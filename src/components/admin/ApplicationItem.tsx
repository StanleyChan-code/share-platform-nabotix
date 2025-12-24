import React, {useState} from 'react';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Badge} from '@/components/ui/badge';
import {
    Application,
    deleteApplication,
    reviewApplicationByProvider,
    reviewApplicationByApprover
} from '@/integrations/api/applicationApi';
import {formatDateTime} from '@/lib/utils';
import {
    Plus,
    Calendar,
    User,
    Building,
    Eye,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle,
    MessageSquare,
    Database,
    Trash2
} from "lucide-react";
import {Button} from "@/components/ui/button";
import {Tooltip, TooltipContent, TooltipTrigger} from "@/components/ui/tooltip";
import {useToast} from '@/components/ui/use-toast';
import {canMangageApplication, hasPermissionRole, PermissionRoles} from "@/lib/permissionUtils.ts";
import ApprovalActions from "@/components/ui/ApprovalActions.tsx";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {getCurrentUserFromSession} from "@/lib/authUtils.ts";

interface ApplicationItemProps {
    application: Application;
    onViewDetails: (application: Application) => void;
    onViewDataset: (application: Application) => void;
    onApprove?: (applicationId: string, notes: string) => void;
    onReject?: (applicationId: string, notes: string) => void;
    onDelete?: (application: Application) => void;
    variant?: 'my-applications' | 'review';
}

const hasDeletionPermission = (application: Application) => {
    // 只有申请人本人可以删除申请记录
    return application.applicantId === getCurrentUserFromSession().id || hasPermissionRole(PermissionRoles.PLATFORM_ADMIN);
};

const getStatusBadgeVariant = (status: Application['status']) => {
    switch (status) {
        case 'SUBMITTED':
            return 'secondary';
        case 'PENDING_PROVIDER_REVIEW':
            return 'outline';
        case 'PENDING_INSTITUTION_REVIEW':
            return 'outline';
        case 'APPROVED':
            return 'default';
        case 'DENIED':
            return 'destructive';
        default:
            return 'secondary';
    }
};

const getStatusIcon = (status: Application['status']) => {
    switch (status) {
        case 'SUBMITTED':
            return <Clock className="h-3 w-3 mr-1"/>;
        case 'PENDING_PROVIDER_REVIEW':
        case 'PENDING_INSTITUTION_REVIEW':
            return <AlertCircle className="h-3 w-3 mr-1"/>;
        case 'APPROVED':
            return <CheckCircle className="h-3 w-3 mr-1"/>;
        case 'DENIED':
            return <XCircle className="h-3 w-3 mr-1"/>;
        default:
            return <Clock className="h-3 w-3 mr-1"/>;
    }
};

const getStatusText = (status: Application['status']) => {
    switch (status) {
        case 'SUBMITTED':
            return '已提交';
        case 'PENDING_PROVIDER_REVIEW':
            return '待提供者审核';
        case 'PENDING_INSTITUTION_REVIEW':
            return '待机构审核';
        case 'APPROVED':
            return '已批准';
        case 'DENIED':
            return '已拒绝';
        default:
            return status;
    }
};

const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return formatDateTime(dateString);
};

const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
};

const getTimelineItems = (application: Application) => {
    const items = [{
        id: 'submitted', // 添加唯一标识符
        status: '提交申请',
        date: application.submittedAt,
        completed: true,
        icon: <Plus className="h-4 w-4"/>,
        notes: null,
        reviewer: null
    }];

    // 提供者审核
    if (application.providerReviewedAt) {
        const isProviderApproved = application.providerReviewResult === true;
        items.push({
            id: 'provider-reviewed', // 添加唯一标识符
            status: isProviderApproved ? '提供者审核通过' : '提供者审核拒绝',
            date: application.providerReviewedAt,
            completed: true,
            icon: <User className="h-4 w-4"/>,
            notes: application.providerNotes,
            reviewer: null
        });
    } else if (['PENDING_PROVIDER_REVIEW', 'PENDING_INSTITUTION_REVIEW', 'APPROVED', 'DENIED'].includes(application.status)) {
        items.push({
            id: 'pending-provider', // 添加唯一标识符
            status: '待提供者审核',
            date: null,
            completed: false,
            icon: <User className="h-4 w-4"/>,
            notes: null,
            reviewer: null
        });
    }

    // 机构审核
    if (application.institutionReviewedAt) {
        const isFinalApproved = application.institutionReviewResult === true;
        items.push({
            id: 'institution-reviewed', // 添加唯一标识符
            status: isFinalApproved ? '机构审核通过' : '机构审核拒绝',
            date: application.institutionReviewedAt,
            completed: true,
            icon: <Building className="h-4 w-4"/>,
            notes: application.adminNotes,
            reviewer: null
        });
    } else if (['PENDING_INSTITUTION_REVIEW', 'APPROVED', 'DENIED'].includes(application.status)) {
        items.push({
            id: 'pending-institution', // 添加唯一标识符
            status: '待机构审核',
            date: null,
            completed: false,
            icon: <Building className="h-4 w-4"/>,
            notes: null,
            reviewer: null
        });
    }

    // 最终状态
    if (application.status === 'APPROVED' || application.status === 'DENIED') {
        const isApproved = application.status === 'APPROVED';
        items.push({
            id: 'final-status', // 添加唯一标识符
            status: isApproved ? '审批完成' : '审批结束',
            date: application.approvedAt || application.institutionReviewedAt,
            completed: true,
            icon: isApproved ? <CheckCircle className="h-4 w-4"/> : <XCircle className="h-4 w-4"/>,
            notes: null,
            reviewer: null
        });
    }

    return items;
};

// 是否能审核
const canApproveApplication = (application: Application, role: 'provider' | 'institution') => {
    if (hasPermissionRole(PermissionRoles.PLATFORM_ADMIN)) {
        return true;
    }

    if (role === 'provider' && application.providerId === getCurrentUserFromSession().id) {
        return true;
    }

    if (role === 'institution' &&
        (hasPermissionRole(PermissionRoles.INSTITUTION_SUPERVISOR) || hasPermissionRole(PermissionRoles.DATASET_APPROVER)) &&
        application.datasetInstitutionId === getCurrentUserFromSession().institutionId) {
        return true;
    }

    return false;
}

const ApplicationItem: React.FC<ApplicationItemProps> = ({
                                                             application,
                                                             onViewDetails,
                                                             onViewDataset,
                                                             onApprove,
                                                             onReject,
                                                             onDelete,
                                                             variant = 'my-applications'
                                                         }) => {
    const {toast} = useToast();
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    const handleApproveApplication = async (role: 'provider' | 'institution' ,  applicationId: string, notes: string = "") => {
        try {
            if (role === 'provider') {
                // 数据集提供者审核
                await reviewApplicationByProvider(applicationId, {
                    notes: notes || "数据集提供者批准申请",
                    approved: true
                });
                toast({
                    title: "申请已提交给下一阶段",
                    description: "申请已由数据集提供者批准，正在等待机构审核。",
                });
            } else if (role === 'institution') {
                // 机构审核
                await reviewApplicationByApprover(applicationId, {
                    notes: notes || "机构审核员批准申请",
                    approved: true
                });
                toast({
                    title: "申请已批准",
                    description: "申请已由机构审核员批准。",
                });
            }

            // 重新加载数据
            if (onApprove) {
                onApprove(applicationId, notes);
            }
        } catch (error) {
            toast({
                title: "操作失败",
                description: "批准申请失败: " + (error instanceof Error ? error.message : "未知错误"),
                variant: "destructive",
            });
        }
    };

    const handleRejectApplication = async (role: 'provider' | 'institution', applicationId: string, notes: string = "") => {
        try {
            if (role === 'provider') {
                // 数据集提供者审核
                await reviewApplicationByProvider(applicationId, {
                    notes: notes || "数据集提供者拒绝申请",
                    approved: false
                });
                toast({
                    title: "申请已拒绝",
                    description: "申请已由数据集提供者拒绝。",
                });
            } else if (role === 'institution') {
                // 机构审核
                await reviewApplicationByApprover(applicationId, {
                    notes: notes || "机构审核员拒绝申请",
                    approved: false
                });
                toast({
                    title: "申请已拒绝",
                    description: "申请已由机构审核员拒绝。",
                });
            }

            // 重新加载数据
            if (onReject) {
                onReject(applicationId, notes);
            }
        } catch (error) {
            toast({
                title: "操作失败",
                description: "拒绝申请失败: " + (error instanceof Error ? error.message : "未知错误"),
                variant: "destructive",
            });
        }
    };

    const handleDeleteClick = async () => {
        try {
            await deleteApplication(application.id);
            toast({
                title: "删除成功",
                description: "申请记录已成功删除。",
            });
            // 调用父组件传入的 onDelete 回调来刷新列表
            if (onDelete) {
                onDelete(application);
            }
        } catch (error) {
            toast({
                title: "删除失败",
                description: "无法删除申请记录，请稍后重试。",
                variant: "destructive",
            });
        } finally {
            setDeleteDialogOpen(false);
        }
    };

    return (
        <>
            <Card key={application.id} className="hover:shadow-md transition-shadow border-l-4 border-l-primary">
                <CardHeader className="pb-3">
                    <div className="flex justify-between items-start gap-4">
                        <div className="space-y-2 flex-1 min-w-0">
                            <CardTitle className="text-lg flex items-center gap-2">
                            <span className="truncate" title={application.projectTitle}>
                                {truncateText(application.projectTitle, 30)}
                            </span>
                            </CardTitle>
                            <div
                                className="text-sm text-muted-foreground flex items-center gap-1 cursor-pointer hover:text-primary hover:underline"
                                onClick={() => onViewDataset(application)}
                            >
                                <Database className="h-3 w-3 flex-shrink-0"/>
                                <span className="truncate" title={application.datasetTitle}>
                                数据集: {truncateText(application.datasetTitle, 40)}
                            </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <Badge
                                variant={getStatusBadgeVariant(application.status)}
                                className="flex items-center whitespace-nowrap min-w-[100px] justify-center"
                            >
                                {getStatusIcon(application.status)}
                                {getStatusText(application.status)}
                            </Badge>
                            <div className="flex gap-1">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            className="h-8 w-8 p-0"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => onViewDetails(application)}
                                        >
                                            <Eye className="h-4 w-4"/>
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>查看详情</p>
                                    </TooltipContent>
                                </Tooltip>
                                {/* 显示删除按钮 */}
                                {hasDeletionPermission(application) && (
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                                onClick={() => setDeleteDialogOpen(true)}
                                            >
                                                <Trash2 className="h-4 w-4"/>
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>删除申请</p>
                                        </TooltipContent>
                                    </Tooltip>
                                )}
                                {/* 显示审核按钮 */}
                                {variant === 'review' && (
                                        <div className="flex gap-1">
                                            {canApproveApplication(application, 'provider') && application.providerReviewResult === null ? (
                                                <ApprovalActions
                                                    requireCommentOnApprove={true}
                                                    requireCommentOnReject={true}
                                                    approveButtonText="提供者通过"
                                                    rejectButtonText="提供者拒绝"
                                                    approveDialogTitle="提供者审核通过意见"
                                                    rejectDialogTitle="提供者审核拒绝意见"
                                                    rejectButtonVariant="outline"
                                                    onSuccess={async (approved, comment) => {
                                                        if (approved) {
                                                            await handleApproveApplication('provider', application.id, comment);
                                                        } else {
                                                            await handleRejectApplication('provider', application.id, comment);
                                                        }
                                                    }}
                                                />
                                            ): application.providerReviewResult && canApproveApplication(application, 'institution') && application.institutionReviewResult === null && (
                                                <ApprovalActions
                                                    requireCommentOnApprove={true}
                                                    requireCommentOnReject={true}
                                                    approveButtonText="机构通过"
                                                    rejectButtonText="机构拒绝"
                                                    approveDialogTitle="机构审核通过意见"
                                                    rejectDialogTitle="机构审核拒绝意见"
                                                    rejectButtonVariant="outline"
                                                    onSuccess={async (approved, comment) => {
                                                        if (approved) {
                                                            await handleApproveApplication( 'institution', application.id, comment);
                                                        } else {
                                                            await handleRejectApplication('institution', application.id, comment);
                                                        }
                                                    }}
                                                />
                                            )}
                                            {canApproveApplication(application, 'provider') && application.status !== 'DENIED' && application.providerReviewResult && (
                                                <ApprovalActions
                                                    requireCommentOnReject={true}
                                                    showRevokeApprovalButton={true}
                                                    revokeApprovalButtonText={"提供者驳回通过"}
                                                    rejectDialogTitle="驳回通过原因"
                                                    rejectButtonVariant="outline"
                                                    onSuccess={async (approved, comment) => {
                                                        if (!approved) {
                                                            await handleRejectApplication('provider', application.id, comment || "已通过的申请被拒绝");
                                                        }
                                                    }}
                                                />
                                            )}
                                            {canApproveApplication(application, 'institution') && application.status !== 'DENIED' && application.institutionReviewResult && (
                                                <ApprovalActions
                                                    requireCommentOnReject={true}
                                                    showRevokeApprovalButton={true}
                                                    revokeApprovalButtonText={"机构驳回通过"}
                                                    rejectDialogTitle="驳回通过原因"
                                                    rejectButtonVariant="outline"
                                                    onSuccess={async (approved, comment) => {
                                                        if (!approved) {
                                                            await handleRejectApplication('institution', application.id, comment || "已通过的申请被拒绝");
                                                        }
                                                    }}
                                                />
                                            )}
                                        </div>
                                    )}
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground flex-shrink-0"/>
                                <span className="font-medium">申请人:</span>
                                <span className="truncate" title={application.applicantName}>
                                {application.applicantName}
                            </span>
                            </div>
                            {application.providerName && (
                                <div className="flex items-center gap-2">
                                    <User className="h-4 w-4 text-muted-foreground flex-shrink-0"/>
                                    <span className="font-medium">数据集提供者: </span>
                                    <span className="truncate">
                                    {application.providerName}
                                </span>
                                </div>
                            )}
                            {application.supervisorName && (
                                <div className="flex items-center gap-2">
                                    <User className="h-4 w-4 text-muted-foreground flex-shrink-0"/>
                                    <span className="font-medium">机构审核人: </span>
                                    <span className="truncate">
                                    {application.supervisorName}
                                </span>
                                </div>
                            )}

                            <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0"/>
                                <span className="font-medium">申请时间:</span>
                                <span>{formatDate(application.submittedAt)}</span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div>
                                <span className="font-medium">项目负责人:</span>
                                <span className="ml-2">{application.projectLeader}</span>
                            </div>
                            <div>
                                <span className="font-medium">资金来源:</span>
                                <span className="ml-2">{application.fundingSource}</span>
                            </div>
                        </div>

                        <div className="space-y-1 text-xs text-muted-foreground">
                            {application.providerReviewedAt && (
                                <div>提供者审核: {formatDate(application.providerReviewedAt)}</div>
                            )}
                            {application.institutionReviewedAt && (
                                <div>机构审核: {formatDate(application.institutionReviewedAt)}</div>
                            )}
                            {application.approvedAt && (
                                <div
                                    className="text-green-600 font-medium">审结时间: {formatDate(application.approvedAt)}</div>
                            )}
                        </div>
                    </div>

                    {/* 审核意见显示 */}
                    <div className="mt-3 pt-3 border-t">
                        <div className="flex items-start gap-2">
                            <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0"/>
                            <div className="flex-1 min-w-0">
                                <span className="text-sm font-medium text-muted-foreground">审核意见</span>
                                <div className="text-sm mt-1 space-y-1">
                                    {application.providerReviewResult !== null && (
                                        <p className="break-words">
                                                <span
                                                    className="font-medium text-blue-600">数据集提供者:</span> {application.providerNotes}
                                        </p>
                                    )}
                                    {application.institutionReviewedAt !== null && (
                                        <p className="break-words">
                                                <span
                                                    className="font-medium text-purple-600">机构管理员:</span> {application.adminNotes}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 时间轴预览 */}
                    <div className="mt-3 pt-3 border-t">
                        <div className="flex items-center justify-between text-xs">
                            {getTimelineItems(application).map((item) => (
                                <Tooltip key={item.id}>
                                    <TooltipTrigger>
                                        <div className={`flex flex-col items-center ${item.completed ? 'text-primary' : 'text-muted-foreground'}`}>
                                            <div className={`p-1 rounded-full ${item.completed ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                                                {item.icon}
                                            </div>
                                            <span className="mt-1 text-center whitespace-nowrap">{item.status}</span>
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>{item.date ? formatDate(item.date) : '待处理'}</p>
                                    </TooltipContent>
                                </Tooltip>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>
            {/* 删除确认对话框 - 仅在需要时渲染 */}
            {variant === 'my-applications' && (
                <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>确认删除申请？</AlertDialogTitle>
                            <AlertDialogDescription>
                                此操作将永久删除申请"{application.projectTitle}"。此操作不可撤销。
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>取消</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleDeleteClick}
                                className="bg-red-600 hover:bg-red-700"
                            >
                                删除
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}
        </>
    );
};

export default ApplicationItem;