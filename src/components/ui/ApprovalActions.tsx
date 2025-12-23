import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface ApprovalActionsProps {
  /**
   * 是否在点击按钮后显示意见输入对话框
   */
  showCommentDialog?: boolean;
  
  /**
   * 通过时是否需要填写意见（如果为false，则不显示输入框）
   */
  requireCommentOnApprove?: boolean;
  
  /**
   * 拒绝时是否需要填写意见（如果为false，则不显示输入框）
   */
  requireCommentOnReject?: boolean;
  
  /**
   * 审核通过时对话框的标题
   */
  approveDialogTitle?: string;
  
  /**
   * 审核拒绝时对话框的标题
   */
  rejectDialogTitle?: string;
  
  /**
   * 审核操作完成后的回调函数
   * @param approved 审核结果，true表示通过，false表示拒绝
   * @param comment 审核意见
   */
  onSuccess?: (approved: boolean, comment: string) => void;
  
  /**
   * 通过按钮的文本
   */
  approveButtonText?: string;
  
  /**
   * 拒绝按钮的文本
   */
  rejectButtonText?: string;
  
  /**
   * 驳回通过按钮的文本
   */
  revokeApprovalButtonText?: string;
  
  /**
   * 通过按钮的变体样式
   */
  approveButtonVariant?: 
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
  
  /**
   * 拒绝按钮的变体样式
   */
  rejectButtonVariant?: 
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
  
  /**
   * 驳回通过按钮的变体样式
   */
  revokeApprovalButtonVariant?: 
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
  
  /**
   * 是否显示驳回通过按钮
   */
  showRevokeApprovalButton?: boolean;
  
  /**
   * 审核意见的最大字符数
   */
  commentMaxLength?: number;
}

const ApprovalActions = ({
  showCommentDialog = true,
  requireCommentOnApprove = true,
  requireCommentOnReject = true,
  approveDialogTitle = "审核通过意见",
  rejectDialogTitle = "审核拒绝意见",
  onSuccess,
  approveButtonText = "通过",
  rejectButtonText = "拒绝",
  revokeApprovalButtonText = "驳回通过",
  approveButtonVariant = "default",
  rejectButtonVariant = "destructive",
  revokeApprovalButtonVariant = "outline",
  showRevokeApprovalButton = false,
  commentMaxLength = 1000, // 默认最大1000字符
}: ApprovalActionsProps) => {
  const [open, setOpen] = useState(false);
  const [comment, setComment] = useState("");
  const [isApprove, setIsApprove] = useState(true); // true表示通过，false表示拒绝

  const handleApproveClick = () => {
    if (showCommentDialog) {
      setIsApprove(true);
      setOpen(true);
    } else {
      onSuccess?.(true, comment);
    }
  };

  const handleRejectClick = () => {
    if (showCommentDialog) {
      setIsApprove(false);
      setOpen(true);
    } else {
      onSuccess?.(false, comment);
    }
  };

  const handleRevokeApprovalClick = () => {
    if (showCommentDialog) {
      setIsApprove(false);
      setOpen(true);
    } else {
      onSuccess?.(false, comment);
    }
  };

  const handleConfirm = () => {
    onSuccess?.(isApprove, comment);
    handleClose();
  };

  const handleClose = () => {
    setOpen(false);
    setComment("");
  };

  // 根据操作类型判断是否需要显示意见输入框
  const requireComment = isApprove ? requireCommentOnApprove : requireCommentOnReject;

  return (
    <>
      <div className="flex gap-2">
        {!showRevokeApprovalButton && (
          <>
            <Button 
              variant={approveButtonVariant} 
              onClick={handleApproveClick}
              type="button"
            >
              {approveButtonText}
            </Button>
            <Button 
              variant={rejectButtonVariant} 
              onClick={handleRejectClick}
              type="button"
            >
              {rejectButtonText}
            </Button>
          </>
        )}
        {showRevokeApprovalButton && (
          <Button 
            variant={revokeApprovalButtonVariant} 
            onClick={handleRevokeApprovalClick}
            type="button"
          >
            {revokeApprovalButtonText}
          </Button>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isApprove ? approveDialogTitle : rejectDialogTitle}
            </DialogTitle>
            <DialogDescription>
              {requireComment 
                ? `请输入您的${isApprove ? '通过意见' : '拒绝意见'}` 
                : isApprove 
                  ? "确定要通过该审核吗？" 
                  : `确定要${showRevokeApprovalButton ? '驳回' : '拒绝'}该审核吗？`}
            </DialogDescription>
          </DialogHeader>
          
          {requireComment && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="comment" className="text-right">
                  {isApprove ? '通过意见' : '拒绝意见'}
                </Label>
                <div className="col-span-3">
                  <Textarea
                    id="comment"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder={`请输入${isApprove ? '通过意见' : '拒绝意见'}...`}
                    className="min-h-[100px]"
                    maxLength={commentMaxLength}
                  />
                  <div className="text-right text-xs text-muted-foreground mt-1">
                    {comment.length}/{commentMaxLength} 字符
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={handleClose} type="button">
              取消
            </Button>
            <Button 
              variant={isApprove ? approveButtonVariant : rejectButtonVariant} 
              onClick={handleConfirm} 
              type="button"
            >
              {isApprove ? '通过' : '拒绝'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ApprovalActions;