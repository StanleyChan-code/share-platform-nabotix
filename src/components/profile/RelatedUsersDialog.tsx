import React from 'react';
import {Dialog, DialogContent, DialogHeader, DialogTitle} from '@/components/ui/dialog.tsx';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card.tsx';
import {ScrollArea} from '@/components/ui/scroll-area.tsx';
import {
    User,
    Briefcase,      // 职称
    Microscope,     // 研究领域（更学术）
    AtSign,          // 邮箱也可用 @ 符号图标
    Phone,
    Shield,
    CheckCircle,
    Users,           // 多用户
    Database,        // 数据库/数据集
    FileText,        // 文件/研究成果
    Crown,           // 超级管理员/最高权限
    Settings,        // 管理类通用
    Send, Mail             // 提交动作
} from 'lucide-react';
import {RelatedUsersDto} from '@/integrations/api/userApi.ts';
import {Loader2} from 'lucide-react';

interface RelatedUsersDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    relatedUsers: RelatedUsersDto | null;
    loading: boolean;
    highlightedUserIds?: string[];
}

interface UserGroup {
    id: string;
    title: string;
    users: any[];
    icon: React.ElementType;
}

const RelatedUsersDialog: React.FC<RelatedUsersDialogProps> = ({
                                                                   open,
                                                                   onOpenChange,
                                                                   relatedUsers,
                                                                   loading,
                                                                   highlightedUserIds = []
                                                               }) => {

    const getUserGroups = (): UserGroup[] => {
        if (!relatedUsers) return [];

        return [
            {
                id: "submitters",
                title: "提交人",
                users: relatedUsers.submitters || [],
                icon: Send          // 表示提交动作
            },
            {
                id: "institutionUserManagers",
                title: "机构用户管理员",
                users: relatedUsers.institutionUserManagers || [],
                icon: Users         // 管理多个用户
            },
            {
                id: "datasetProviders",
                title: "数据集提供者",
                users: relatedUsers.datasetProviders || [],
                icon: Database      // 数据集相关
            },
            {
                id: "datasetApprovers",
                title: "机构数据集审批员",
                users: relatedUsers.datasetApprovers || [],
                icon: FileText      // 审批文件/内容
            },
            {
                id: "institutionSupervisors",
                title: "机构管理员",
                users: relatedUsers.institutionSupervisors || [],
                icon: Settings       // 机构设置与管理
            },
            {
                id: "platformAdmins",
                title: "平台管理员",
                users: relatedUsers.platformAdmins || [],
                icon: Shield          // 平台最高权限 Crown
            }
        ].filter(group => group.users.length > 0);
    };

    const isUserHighlighted = (userId: string): boolean => {
        return highlightedUserIds.includes(userId);
    };

    const InfoItem = ({
                          icon: Icon,
                          label,
                          value
                      }: {
        icon: React.ElementType;
        label: string;
        value: string;
    }) => (
        <div className="flex items-center gap-2 text-sm">
            <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0"/>
            <span className="text-muted-foreground flex-shrink-0 w-16">{label}</span>
            <span className="font-medium truncate">{value || "未填写"}</span>
        </div>
    );

    const userGroups = getUserGroups();

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden">
                <DialogHeader className="border-b pb-4">
                    <DialogTitle className="text-xl font-semibold flex items-center gap-2 text-primary">
                        <User className="h-5 w-5"/>
                        相关人员信息
                    </DialogTitle>
                </DialogHeader>

                <ScrollArea className="h-[calc(90vh-12rem)] px-2">
                    <div className="space-y-6 p-4 mb-3">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-16 space-y-4">
                                <Loader2 className="h-10 w-10 animate-spin text-primary"/>
                                <p className="text-muted-foreground">正在加载相关人员信息...</p>
                            </div>
                        ) : userGroups.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 space-y-4">
                                <User className="h-16 w-16 text-muted-foreground/50"/>
                                <p className="text-muted-foreground text-lg">暂无相关人员信息</p>
                            </div>
                        ) : (
                            userGroups.map((group, groupIndex) => (
                                <div key={groupIndex} className="space-y-3">
                                    <div
                                        className="flex items-center gap-2 text-lg font-semibold text-gray-800 bg-gray-50 p-2 rounded-md">
                                        <group.icon className="h-5 w-5 text-primary"/>
                                        {group.title}
                                    </div>
                                    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-2">
                                        {group.users.map((user) => (
                                            <Card
                                                key={user.id}
                                                className={`transition-all duration-300 hover:shadow-md border-2 ${isUserHighlighted(user.id) || group.id === 'submitters'
                                                    ? "border-primary shadow-lg ring-2 ring-primary/20"
                                                    : "border-gray-200 hover:border-primary/50"
                                                }`}
                                            >
                                                <CardHeader
                                                    className="pb-3 flex flex-row items-center justify-between bg-gray-50 rounded-t-md">
                                                    <CardTitle
                                                        className="text-base font-semibold">{user.realName}</CardTitle>
                                                    {isUserHighlighted(user.id) && (
                                                        <div
                                                            className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded text-xs font-medium">
                                                            <CheckCircle className="h-3 w-3"/>
                                                            <span>审核人</span>
                                                        </div>
                                                    )}
                                                </CardHeader>
                                                <CardContent className="space-y-2 mt-4">
                                                    <InfoItem icon={User} label="姓名" value={user.realName} />
                                                    <InfoItem icon={Phone} label="电话" value={user.phone} />
                                                    <InfoItem icon={Mail} label="邮箱" value={user.email} />
                                                    <InfoItem icon={Microscope} label="研究领域" value={user.field} />
                                                    {group.id === 'submitters' && (
                                                        <InfoItem icon={Briefcase} label="职称" value={user.title} />
                                                    )}

                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
};

export default RelatedUsersDialog;