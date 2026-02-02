import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog.tsx';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip.tsx';
import {cn, formatDateTime} from '@/lib/utils.ts';
import { AuditLog } from '@/integrations/api/auditLogApi.ts';
import { Shield, Clock, User, Globe, Activity, FileText, Hash, FileX, Copy, Check } from 'lucide-react';
import { AuditLogConstants, ACTION_DISPLAY_NAMES } from '@/lib/auditLogConstants.ts';
import UserInfoDialog from '@/components/admin/user/UserInfoDialog.tsx';
import { userApi } from '@/integrations/api/userApi.ts';
import { toast } from '@/components/ui/use-toast.ts';
import { institutionApi } from '@/integrations/api/institutionApi.ts';
import {CopyButton} from "@/components/ui/CopyButton.tsx";

interface AuditLogDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  auditLog: AuditLog | null;
}

// 信息卡片组件 - 支持 truncate 和 tooltip
const InfoCard = ({ label, value, icon, isMonospace = false, copyable = false, onClick = undefined }: {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  isMonospace?: boolean;
  copyable?: boolean;
  onClick?: () => void;
}) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    if (typeof value === 'string') {
      navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // 检查值是否为字符串且过长
  const isLongText = typeof value === 'string' && value.length > 30;
  const displayValue = isLongText ? `${value.substring(0, 30)}...` : value;

  const cardContent = (
      <div className="bg-background border rounded-lg p-3 space-y-2 hover:shadow-sm transition-shadow relative group">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            {icon}
            {label}
          </label>
          <div className="flex items-center gap-1">
            {copyable && (
                <CopyButton
                    size={"xs"} variant={"ghost"}
                    text={value.toLocaleString()} className="absolute right-2 top-2" />
            )}
          </div>
        </div>
        <div onClick={onClick}
            className={cn(
                'text-sm',
                'text-foreground',
                isMonospace ? 'font-mono' : '',
                isLongText ? 'truncate' : '',
                onClick !== undefined ? 'cursor-pointer truncate hover:underline' : ''
            )}
        >
          {displayValue || '-'}
        </div>
      </div>
  );

  // 如果是长文本，用 Tooltip 包装
  if (isLongText) {
    return (
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              {cardContent}
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-md p-3">
              <p className={`${isMonospace ? 'font-mono' : ''} text-sm whitespace-pre-wrap break-all`}>
                {value}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
    );
  }

  return cardContent;
};

// 操作类型颜色映射
const getActionColor = (action: string) => {
  const actionColors: Record<string, string> = {
    [AuditLogConstants.ACTION_CREATE]: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    [AuditLogConstants.ACTION_UPDATE]: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    [AuditLogConstants.ACTION_DELETE]: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    [AuditLogConstants.ACTION_RESET_APPROVAL_STATUS]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    [AuditLogConstants.ACTION_PROVIDER_APPROVE]: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    [AuditLogConstants.ACTION_INSTITUTION_APPROVE]: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    [AuditLogConstants.ACTION_PLATFORM_APPROVE]: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    [AuditLogConstants.ACTION_PROVIDER_REJECT]: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    [AuditLogConstants.ACTION_INSTITUTION_REJECT]: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    [AuditLogConstants.ACTION_PLATFORM_REJECT]: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    [AuditLogConstants.ACTION_ANALYZE]: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
    [AuditLogConstants.ACTION_UPLOAD]: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    [AuditLogConstants.ACTION_INIT_CHUNKED_UPLOAD]: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    [AuditLogConstants.ACTION_MERGE_CHUNKED_UPLOAD]: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    [AuditLogConstants.ACTION_DOWNLOAD]: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    [AuditLogConstants.ACTION_SEND_VERIFICATION_CODE]: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    [AuditLogConstants.ACTION_LOGIN]: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    [AuditLogConstants.ACTION_LOGOUT]: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
    [AuditLogConstants.ACTION_REGISTER]: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
    [AuditLogConstants.ACTION_UPDATE_AUTHORITIES]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    [AuditLogConstants.ACTION_UPDATE_PHONE]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    [AuditLogConstants.ACTION_UPDATE_USER_STATUS]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    [AuditLogConstants.ACTION_UNKNOWN]: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
  };

  return actionColors[action] || actionColors[AuditLogConstants.ACTION_UNKNOWN];
};

const AuditLogDetailDialog: React.FC<AuditLogDetailDialogProps> = ({
                                                                     open,
                                                                     onOpenChange,
                                                                     auditLog,
                                                                   }) => {
  if (!auditLog) return null;

  // 状态管理
  const [userInfoDialogOpen, setUserInfoDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [institutionMap, setInstitutionMap] = useState<Record<string, { fullName: string }>>({});
  const [userRoles, setUserRoles] = useState<Record<string, string[]>>({});
  const [userLoading, setUserLoading] = useState(false);

  // 获取用户信息
  const fetchUserInfo = async (userId: string) => {
    setUserLoading(true);
    try {
      // 获取用户基本信息
      const response = await userApi.getUserById(userId);
      const user = response.data;
      setUserRoles(prev => ({
        ...prev,
        [userId]: user.authorities || []
      }));
      setSelectedUser(user);

      // 获取用户所属机构信息
      if (user.institutionId) {
        const institutionResponse = await institutionApi.getInstitutionById(user.institutionId);
        if (institutionResponse.success) {
          setInstitutionMap(prev => ({
            ...prev,
            [user.institutionId]: { fullName: institutionResponse.data.fullName }
          }));
        }
      }

      // 打开用户详情对话框
      setUserInfoDialogOpen(true);
    } catch (error) {
      console.error('获取用户信息失败:', error);
      toast({
        title: '错误',
        description: '获取用户信息失败，请稍后重试',
        variant: 'destructive',
      });
    } finally {
      setUserLoading(false);
    }
  };

  return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 gap-0">
          {/* 头部 */}
          <DialogHeader className="p-6 pb-4 border-b bg-gradient-to-r from-primary/5 to-transparent">
            <DialogTitle className="text-xl font-semibold flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              审计日志详情
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground mt-1">
              点击任意字段可查看完整信息
            </DialogDescription>
          </DialogHeader>

          {/* 内容区域 */}
          <div className="flex-1 overflow-hidden overflow-y-auto">
            <ScrollArea className="h-full w-full px-8">
            <div className="py-6 space-y-6">
              {/* 基础信息区 */}
              <section className="space-y-4">
                <h2 className="text-base font-semibold text-foreground border-b pb-2">基础信息</h2>

                {/* 日志ID - 单独处理，因为通常很长 */}
                <TooltipProvider delayDuration={200}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-4 rounded-lg border cursor-help">
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-sm font-medium text-muted-foreground">日志ID</label>
                          <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigator.clipboard.writeText(auditLog.id);
                              }}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                        <code className="text-xs font-mono bg-background px-3 py-2 rounded border block truncate block">
                          {auditLog.id}
                        </code>
                      </div>
                    </TooltipTrigger>
                  </Tooltip>
                </TooltipProvider>

                {/* 关键信息网格 - 使用新的 InfoCard */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  <InfoCard
                      label="操作时间"
                      value={formatDateTime(auditLog.createdAt)}
                      icon={<Clock className="w-3.5 h-3.5" />}
                      copyable
                  />
                  <InfoCard
                      label="操作用户ID"
                      value={auditLog.operatorId}
                      icon={<User className="w-3.5 h-3.5" />}
                      copyable
                      onClick={auditLog.operatorId ? () => fetchUserInfo(auditLog.operatorId) : undefined}
                  />
                  <InfoCard
                      label="IP地址"
                      value={auditLog.ipAddress}
                      icon={<Globe className="w-3.5 h-3.5" />}
                      copyable
                  />
                  <InfoCard
                      label="操作行为"
                      value={
                        <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${getActionColor(auditLog.action)}`}>
                      {ACTION_DISPLAY_NAMES[auditLog.action] || auditLog.action}
                    </span>
                      }
                      icon={<Activity className="w-3.5 h-3.5" />}
                  />
                  <InfoCard
                      label="实例类型"
                      value={auditLog.instanceType}
                      icon={<FileText className="w-3.5 h-3.5" />}
                      copyable
                  />
                  <InfoCard
                      label="实例ID"
                      value={auditLog.instanceId || '-'}
                      icon={<Hash className="w-3.5 h-3.5" />}
                      isMonospace
                      copyable
                  />
                  <InfoCard
                      label="实例标题"
                      value={auditLog.resourceTitle || '-'}
                      icon={<FileText className="w-3.5 h-3.5" />}
                      copyable
                  />
                </div>
              </section>

              {/* 详细参数区 */}
              <section className="space-y-3">
                <h2 className="text-base font-semibold text-foreground border-b pb-2">详细参数</h2>

                {auditLog.additionalParams ? (
                    <TooltipProvider delayDuration={200}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="bg-slate-50 dark:bg-slate-900/50 border rounded-lg overflow-hidden cursor-help">
                            <div className="flex items-center justify-between px-4 py-2 bg-muted/50 border-b">
                              <label className="text-sm font-medium">JSON 参数数据</label>
                              <CopyButton variant={"ghost"} size={"xs"}
                                  text={JSON.stringify(auditLog.additionalParams, null, 2)} />
                            </div>
                              <pre className="p-4 text-xs whitespace-pre-wrap break-all font-mono truncate">
                                {JSON.stringify(auditLog.additionalParams, null, 2)}
                              </pre>
                          </div>
                        </TooltipTrigger>
                      </Tooltip>
                    </TooltipProvider>
                ) : (
                    <div className="text-center py-8 px-4 bg-muted/30 rounded-lg border-2 border-dashed">
                      <FileX className="w-10 h-10 mx-auto text-muted-foreground/50 mb-2" />
                      <p className="text-muted-foreground text-sm">无额外参数记录</p>
                    </div>
                )}
              </section>
            </div>
          </ScrollArea>
          </div>

        </DialogContent>

        {/* 用户信息对话框 */}
        <UserInfoDialog
            open={userInfoDialogOpen}
            onOpenChange={setUserInfoDialogOpen}
            userId={selectedUser?.id || ''}
            showUserId={true}
        />
      </Dialog>
  );
};

export default AuditLogDetailDialog;