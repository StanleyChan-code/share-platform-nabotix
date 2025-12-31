import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog.tsx';
import { Button } from '@/components/ui/button.tsx';
import { HelpCircle } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';

interface QADialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  content: React.ReactNode;
  trigger?: React.ReactNode;
  buttonText?: string;
  className?: string;
}

/**
 * 统一的Q&A对话框组件
 * 用于展示成果、申请、数据集版本说明等内容
 */
export function QADialog({
  isOpen,
  onOpenChange,
  title,
  content,
  trigger,
  buttonText = '我知道了',
  className,
}: QADialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      {trigger || (
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
          >
            <HelpCircle className="h-4 w-4" />
            <span className="sr-only sm:not-sr-only">Q&A</span>
          </Button>
        </DialogTrigger>
      )}
      <DialogContent
        className={`sm:max-w-2xl max-h-[80vh] overflow-y-auto ${className}`}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            {title}
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-4">
            {content}
          </div>
        </ScrollArea>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
            {buttonText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Q&A步骤项组件
 * 用于展示带编号的步骤说明
 */
export interface QAItemProps {
  number: number;
  title: string;
  description: string;
  className?: string;
}

export function QAItem({
  number,
  title,
  description,
  className,
}: QAItemProps) {
  return (
    <div className={`flex gap-4 items-start ${className}`}>
      <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-medium">
        {number}
      </div>
      <div>
        <h3 className="font-semibold mb-1">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

/**
 * Q&A提示框组件
 * 用于展示重要提示信息
 */
export interface QATipProps {
  type?: 'info' | 'warning' | 'success';
  title: string;
  content: string;
  className?: string;
}

export function QATip({
  type = 'info',
  title,
  content,
  className,
}: QATipProps) {
  const typeStyles = {
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    success: 'bg-green-50 border-green-200 text-green-800',
  };

  const iconMap = {
    info: 'ℹ️',
    warning: '⚠️',
    success: '✅',
  };

  return (
    <div className={`mt-4 p-3 rounded-lg border shadow-sm ${typeStyles[type]} ${className}`}>
      <p className="text-sm">
        <span className="font-semibold">{iconMap[type]} {title}：</span>
        {content}
      </p>
    </div>
  );
}