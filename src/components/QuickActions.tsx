import { Button } from './ui/button';
import { Search, BookOpen, FileQuestion, Sparkles, Brain, Target } from 'lucide-react';

interface QuickActionsProps {
  onActionClick: (prompt: string) => void;
}

export const QuickActions = ({ onActionClick }: QuickActionsProps) => {
  const actions = [
    {
      icon: BookOpen,
      label: 'کتاب‌های درسی',
      prompt: 'لیست کتاب‌های درسی موجود را نمایش بده',
      color: 'from-blue-500/10 to-blue-600/10 border-blue-500/20 hover:border-blue-500/40',
      iconColor: 'text-blue-600',
    },
    {
      icon: FileQuestion,
      label: 'نمونه سوالات',
      prompt: 'نمونه سوالات امتحانی موجود را نشان بده',
      color: 'from-purple-500/10 to-purple-600/10 border-purple-500/20 hover:border-purple-500/40',
      iconColor: 'text-purple-600',
    },
    {
      icon: Brain,
      label: 'نکات مهم',
      prompt: 'نکات کلیدی برای موفقیت در امتحانات را بگو',
      color: 'from-green-500/10 to-green-600/10 border-green-500/20 hover:border-green-500/40',
      iconColor: 'text-green-600',
    },
    {
      icon: Target,
      label: 'برنامه مطالعه',
      prompt: 'یک برنامه مطالعاتی موثر برای من تنظیم کن',
      color: 'from-orange-500/10 to-orange-600/10 border-orange-500/20 hover:border-orange-500/40',
      iconColor: 'text-orange-600',
    },
    {
      icon: Search,
      label: 'جستجو در منابع',
      prompt: 'در منابع آموزشی جستجو کن',
      color: 'from-cyan-500/10 to-cyan-600/10 border-cyan-500/20 hover:border-cyan-500/40',
      iconColor: 'text-cyan-600',
    },
    {
      icon: Sparkles,
      label: 'خلاصه درس',
      prompt: 'خلاصه درس‌های موجود را نمایش بده',
      color: 'from-pink-500/10 to-pink-600/10 border-pink-500/20 hover:border-pink-500/40',
      iconColor: 'text-pink-600',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6 animate-in fade-in slide-in-from-bottom-4">
      {actions.map((action, index) => (
        <Button
          key={index}
          variant="outline"
          onClick={() => onActionClick(action.prompt)}
          className={`h-auto p-4 flex flex-col items-center gap-2 bg-gradient-to-br ${action.color} transition-all hover:scale-105 hover:shadow-lg`}
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <div className={`w-10 h-10 rounded-lg bg-white/50 dark:bg-black/20 flex items-center justify-center`}>
            <action.icon className={`w-5 h-5 ${action.iconColor}`} />
          </div>
          <span className="text-xs font-medium text-center">{action.label}</span>
        </Button>
      ))}
    </div>
  );
};