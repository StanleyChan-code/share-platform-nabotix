import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import {
    Dialog as InfoDialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { formatDateTime } from '@/lib/utils';
import { getPermissionRoleDisplayName } from '@/lib/permissionUtils';
import { ID_TYPES, EducationLevels } from '@/lib/enums';
import { Skeleton } from '@/components/ui/skeleton';
import { userApi } from '@/integrations/api/userApi';
import { institutionApi } from '@/integrations/api/institutionApi';
import { useToast } from '@/hooks/use-toast';

// 定义组件属性接口
interface UserInfoDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    userId: string;
    showUserId?: boolean;
}

// 对证件号码进行脱敏处理
const maskIdNumber = (idType: string, idNumber: string) => {
    if (!idNumber) return "未填写";

    switch (idType) {
        case 'NATIONAL_ID':
            // 身份证：显示前6位和后4位，中间用*代替
            return idNumber.replace(/(\d{6})\d+(\d{4})/, '$1**********$2');
        case 'PASSPORT':
            // 护照：显示前2位和后2位，中间用*代替
            return idNumber.replace(/(.{2}).*(.{2})/, '$1******$2');
        default:
            // 其他类型：显示前1/3和后1/3，中间用*代替
            const showLength = Math.max(1, Math.floor(idNumber.length / 3));
            const regExp = new RegExp(`(.{${showLength}}).*?(.{${showLength}})$`);
            return idNumber.replace(regExp, `$1${'*'.repeat(Math.max(3, idNumber.length - showLength * 2))}$2`);
    }
};

// 渲染信息字段的辅助函数
const renderInfoField = (label: string, value: string | React.ReactNode, isImportant?: boolean) => (
    <div className="grid grid-cols-3 gap-4 py-3 px-2 hover:bg-muted/30 rounded-lg transition-colors duration-200">
        <dt className={`text-sm font-semibold text-right text-muted-foreground col-span-1 ${isImportant ? 'text-primary' : ''}`}>
            {label}
        </dt>
        <dd className={`text-sm text-left text-foreground col-span-2 ${isImportant ? 'font-medium text-primary' : ''}`}>
            {value}
        </dd>
    </div>
);

const UserInfoDialog: React.FC<UserInfoDialogProps> = ({
                                                           open,
                                                           onOpenChange,
                                                           userId,
                                                           showUserId = false
                                                       }) => {
    const [user, setUser] = useState<any>(null);
    const [institutionName, setInstitutionName] = useState<string>('未分配');
    const [userRoles, setUserRoles] = useState<string[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const { toast } = useToast();

    // 加载用户信息
    useEffect(() => {
        const fetchUserInfo = async () => {
            if (!open || !userId) {
                return;
            }

            setLoading(true);
            try {
                // 获取用户基本信息
                const response = await userApi.getUserById(userId);
                if (!response.success) {
                    toast({
                        title: '错误',
                        description: response.message || '获取用户信息失败，请稍后重试',
                        variant: 'destructive',
                    });

                } else {
                    const userData = response.data;
                    setUser(userData);

                    // 获取用户角色
                    if (userData.authorities) {
                        setUserRoles(userData.authorities);
                    } else {
                        setUserRoles([]);
                    }

                    // 获取机构信息
                    if (userData.institutionId) {
                        try {
                            const institutionResponse = await institutionApi.getInstitutionById(userData.institutionId);
                            if (institutionResponse.success){
                                setInstitutionName(institutionResponse.data.fullName);
                            } else {
                                setInstitutionName('加载失败');
                            }
                        } catch (error) {
                            console.error(`获取机构 ${userData.institutionId} 信息失败:`, error);
                            setInstitutionName(userData.institutionId);
                        }
                    } else {
                        setInstitutionName('未分配');
                    }
                }
            } catch (error) {
                console.error('获取用户信息失败:', error);
                toast({
                    title: '错误',
                    description: '获取用户信息失败，请稍后重试',
                    variant: 'destructive',
                });
            } finally {
                setLoading(false);
            }
        };

        fetchUserInfo();
    }, [open, userId, toast]);
    // 生成角色徽章颜色
    const getRoleBadgeColor = (role: string) => {
        const roleColors: Record<string, string> = {
            'PLATFORM_ADMIN': 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800',
            'INSTITUTION_ADMIN': 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
            'RESEARCHER': 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800',
            'DATA_MANAGER': 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800',
            'VIEWER': 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600',
        };
        return roleColors[role] || 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600';
    };

    // 加载状态的骨架屏
    const renderLoadingSkeleton = () => (
        <div className="space-y-3 p-6">
            {Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="flex items-center space-x-4">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-full" />
                </div>
            ))}
        </div>
    );

    // 用户信息内容
    const userInfoContent = loading ? renderLoadingSkeleton() : (user ? (
        <div className="divide-y divide-border/50">
            {/* 基础信息区域 */}
            <div className="p-6">
                <h3 className="text-lg font-semibold mb-4 text-primary flex items-center">
                    <div className="w-1 h-5 bg-primary rounded-full mr-3"></div>
                    基础信息
                </h3>
                <dl className="space-y-1">
                    {showUserId && renderInfoField("用户ID", user.id, true)}
                    {renderInfoField("姓名", user.realName, true)}
                    {renderInfoField("邮箱地址", user.email)}
                    {renderInfoField("手机号码", user.phone || "未填写")}
                    {renderInfoField(
                        "所属机构",
                        institutionName
                    )}
                    {renderInfoField("注册时间", formatDateTime(user.createdAt))}
                </dl>
            </div>

            {/* 身份信息区域 */}
            <div className="p-6 bg-muted/20">
                <h3 className="text-lg font-semibold mb-4 text-primary flex items-center">
                    <div className="w-1 h-5 bg-primary rounded-full mr-3"></div>
                    身份信息
                </h3>
                <dl className="space-y-1">
                    {renderInfoField(
                        "证件类型",
                        user.idType
                            ? (ID_TYPES[user.idType] || user.idType)
                            : "未填写"
                    )}
                    {renderInfoField(
                        "证件号码",
                        <span className="font-mono tracking-wide">
                            {maskIdNumber(user.idType, user.idNumber)}
                        </span>
                    )}
                </dl>
            </div>

            {/* 职业信息区域 */}
            <div className="p-6">
                <h3 className="text-lg font-semibold mb-4 text-primary flex items-center">
                    <div className="w-1 h-5 bg-primary rounded-full mr-3"></div>
                    职业信息
                </h3>
                <dl className="space-y-1">
                    {renderInfoField(
                        "学历",
                        user.education
                            ? (EducationLevels[user.education as keyof typeof EducationLevels] || user.education)
                            : "未填写"
                    )}
                    {renderInfoField("职称", user.title || "未填写")}
                    {renderInfoField("专业领域", user.field || "未填写")}
                </dl>
            </div>

            {/* 角色信息区域 */}
            <div className="p-6 bg-muted/20">
                <h3 className="text-lg font-semibold mb-4 text-primary flex items-center">
                    <div className="w-1 h-5 bg-primary rounded-full mr-3"></div>
                    系统角色
                </h3>
                <div className="flex flex-wrap gap-2 pl-[calc(33.333%+1rem)]">
                    {userRoles.length > 0 ? (
                        userRoles.map((role, index) => (
                            <Badge
                                key={index}
                                variant="outline"
                                className={`px-3 py-1.5 text-sm font-medium rounded-full border transition-all duration-200 hover:scale-105 hover:shadow-md ${getRoleBadgeColor(role)}`}
                            >
                                {getPermissionRoleDisplayName(role)}
                            </Badge>
                        ))
                    ) : (
                        <span className="text-muted-foreground italic">暂未分配角色</span>
                    )}
                </div>
            </div>
        </div>
    ) : (
        <div>
            加载失败
        </div>
    ));

    return (
        <InfoDialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="max-w-3xl max-h-[90vh] overflow-y-auto bg-background border-border shadow-2xl rounded-2xl"
            >
                <DialogHeader className="pb-4 border-b border-border">
                    <DialogTitle className="text-2xl font-bold text-foreground flex items-center">
                        <div className="w-2 h-6 bg-gradient-to-br from-primary to-primary/60 rounded-lg mr-3"></div>
                        用户详细信息
                    </DialogTitle>
                    <p className="text-muted-foreground mt-1">
                        查看用户的完整信息和权限配置
                    </p>
                </DialogHeader>

                {userInfoContent}

                {/* 底部操作按钮 */}
                <div className="flex justify-end p-6 pt-4 border-t border-border bg-muted/10 rounded-b-2xl">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        className="px-6"
                    >
                        关闭
                    </Button>
                </div>
            </DialogContent>
        </InfoDialog>
    );
};

export default UserInfoDialog;