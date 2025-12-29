import { Button } from "@/components/ui/button.tsx";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { useClipboard } from 'use-clipboard-copy';
import { Copy, Check, Link } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface CopyButtonProps {
  text: string;
  title?: string;
  description?: string;
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  children?: React.ReactNode;
}

export function CopyButton({ 
  text, 
  title = "复制内容", 
  description = "点击下方文本框复制内容", 
  variant = "outline", 
  size = "sm",
  className,
  children
}: CopyButtonProps) {
  const { copy, isSupported, copied } = useClipboard({ copiedTimeout: 1000 });
  const [showFallback, setShowFallback] = useState(false);

  const handleCopy = () => {
    if (isSupported) {
      copy(text);
      toast.success('内容已复制到剪贴板！');
    } else {
      // 如果不支持 Clipboard API，显示备选对话框
      setShowFallback(true);
    }
  };

  const handleFallbackCopy = (e) => {
    e.target.select();
    const isCopied = document.execCommand('copy');
    if (isCopied) {
      toast.success('内容已复制到剪贴板！');
      setShowFallback(false);
    }
    // 如果浏览器不支持 execCommand，则使用 Textarea 让用户手动复制
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={handleCopy}
        disabled={copied}
      >
        {copied ? (
          <>
            <Check className="h-4 w-4 mr-2" />
            已复制
          </>
        ) : (
          <>
            {children || (
              <>
                <Copy className="h-4 w-4 mr-2" />
                复制
              </>
            )}
          </>
        )}
      </Button>

      {/* 备选对话框 */}
      <Dialog open={showFallback} onOpenChange={setShowFallback}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>
              {description}
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center space-x-2">
            <Textarea
              ref={(el) => {
                if (el) {
                  el.select();
                }
              }}
              value={text}
              readOnly
              onClick={handleFallbackCopy}
              className="min-h-[100px]"
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}