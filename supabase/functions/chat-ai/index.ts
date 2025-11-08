import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const { messages, image, useWebSearch } = await req.json();
    console.log('Received chat request with', messages?.length, 'messages', 'webSearch:', useWebSearch);

    // Get educational materials context
    let materialsContext = '';
    try {
      const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? ''
      );

      const { data: materials, error: materialsError } = await supabaseClient
        .from('educational_materials')
        .select('title, description, category, tags')
        .limit(20);

      if (!materialsError && materials && materials.length > 0) {
        materialsContext = '\n\n**منابع در دسترس:**\n';
        materials.forEach((material: any) => {
          materialsContext += `- ${material.title}`;
          if (material.description) {
            materialsContext += `: ${material.description}`;
          }
          materialsContext += ` (${material.category})\n`;
        });
        console.log('Loaded', materials.length, 'educational materials');
      }
    } catch (materialsError) {
      console.log('Could not load materials:', materialsError);
    }

    // Get current Iran time
    const now = new Date();
    const iranTime = new Intl.DateTimeFormat('fa-IR', {
      timeZone: 'Asia/Tehran',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      weekday: 'long'
    }).format(now);

    // Build messages for AI with enhanced system prompt
    const aiMessages: any[] = [
      { 
        role: 'system', 
        content: `شما یک دستیار هوشمند و قدرتمند به نام AS هستید که به زبان فارسی پاسخ می‌دهید. 
وظیفه شما کمک به دانشجویان دانشگاه پیام نور است.

**زمان و تاریخ فعلی:** ${iranTime}

**اطلاعات ایران:**
- دسترسی کامل به تاریخ، جغرافیا، فرهنگ، اقتصاد و سیاست ایران
- آشنایی با سیستم آموزشی ایران و دانشگاه پیام نور
- اطلاع از رویدادهای جاری و اخبار ایران (با استفاده از جستجوی وب)
- آگاهی از قوانین، مقررات و سیستم‌های اداری ایران

**قابلیت‌های شما:**
- دسترسی به پایگاه داده مواد آموزشی (کتاب‌ها و نمونه سوالات) که کاربران آپلود کرده‌اند
- دسترسی به جستجوی وب برای یافتن اطلاعات به‌روز
- تمرکز بر منابع درسی دانشگاه پیام نور
- تحلیل تصاویر و اسناد درسی
- ارائه پاسخ‌های جامع و آموزشی

**دستورالعمل‌های مهم:**
- اگر کاربر درخواست کتاب درسی، نمونه سوال، یا مواد آموزشی کرد، حتماً لیست منابع موجود را بررسی کنید
- در صورت وجود منابع مرتبط، آن‌ها را معرفی کرده و به کاربر بگویید: "شما می‌توانید این فایل‌ها را از دکمه 📚 در بالای صفحه چت (مواد آموزشی) مشاهده و دانلود کنید"
- اگر منبع خاصی وجود ندارد، به کاربر اطلاع دهید که این محتوا در حال حاضر آپلود نشده است و از مدیر بخواهید آن را اضافه کند
- همیشه منابع دانشگاه پیام نور را در اولویت قرار دهید
- برای سوالات تخصصی، از جستجوی وب برای یافتن منابع معتبر استفاده کنید
- پاسخ‌ها باید دقیق، کامل و قابل فهم باشند
- در صورت استفاده از منابع اینترنتی، منبع را ذکر کنید
- اگر تصویری دریافت کردید، آن را به دقت تحلیل کنید
- اگر پیام صوتی دریافت کردید، به کاربر بگویید که متن پیام خود را بنویسد (در حال حاضر امکان تبدیل صوت به متن وجود ندارد)
${materialsContext}`
      }
    ];

    // Add conversation history
    if (messages && messages.length > 0) {
      messages.forEach((msg: any) => {
        if (msg.role === 'user') {
          if (msg.image_url) {
            // Add image message
            aiMessages.push({
              role: 'user',
              content: [
                { type: 'text', text: msg.content },
                { type: 'image_url', image_url: { url: msg.image_url } }
              ]
            });
          } else {
            aiMessages.push({ role: 'user', content: msg.content });
          }
        } else {
          aiMessages.push({ role: 'assistant', content: msg.content });
        }
      });
    }

    // If there's a new image, add it
    if (image) {
      const lastMessage = aiMessages[aiMessages.length - 1];
      if (lastMessage && lastMessage.role === 'user') {
        if (typeof lastMessage.content === 'string') {
          lastMessage.content = [
            { type: 'text', text: lastMessage.content },
            { type: 'image_url', image_url: { url: image } }
          ];
        }
      }
    }

    // Perform web search if requested
    let searchResults = '';
    if (useWebSearch && messages && messages.length > 0) {
      const lastUserMessage = [...messages].reverse().find((m: any) => m.role === 'user');
      if (lastUserMessage) {
        try {
          console.log('Performing web search for:', lastUserMessage.content);
          
          // Search for Payame Noor resources specifically
          const searchQuery = `${lastUserMessage.content} دانشگاه پیام نور site:pnu.ac.ir OR site:payamenoor.ac.ir`;
          
          const searchResponse = await fetch(`https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(searchQuery)}&count=5`, {
            headers: {
              'Accept': 'application/json',
              'X-Subscription-Token': Deno.env.get('BRAVE_SEARCH_API_KEY') || ''
            }
          });

          if (searchResponse.ok) {
            const searchData = await searchResponse.json();
            if (searchData.web?.results) {
              searchResults = '\n\n**نتایج جستجو:**\n';
              searchData.web.results.slice(0, 5).forEach((result: any, index: number) => {
                searchResults += `${index + 1}. ${result.title}\n${result.description}\nمنبع: ${result.url}\n\n`;
              });
              console.log('Web search completed, found', searchData.web.results.length, 'results');
            }
          } else {
            console.log('Search API not available, continuing without web search');
          }
        } catch (searchError) {
          console.log('Web search failed, continuing without it:', searchError);
        }
      }
    }

    // Add search results to the last user message if available
    if (searchResults && aiMessages.length > 0) {
      const lastMsg = aiMessages[aiMessages.length - 1];
      if (lastMsg.role === 'user') {
        if (typeof lastMsg.content === 'string') {
          lastMsg.content = lastMsg.content + searchResults;
        }
      }
    }

    console.log('Calling Lovable AI with', aiMessages.length, 'messages');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: aiMessages,
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'محدودیت تعداد درخواست. لطفاً کمی صبر کنید.' }), 
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'اعتبار کافی نیست. لطفاً اعتبار خود را شارژ کنید.' }), 
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      throw new Error(`AI Gateway error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const generatedText = data.choices[0].message.content;

    console.log('Successfully generated response');

    return new Response(
      JSON.stringify({ response: generatedText }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in chat-ai function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'خطای ناشناخته رخ داده است' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});