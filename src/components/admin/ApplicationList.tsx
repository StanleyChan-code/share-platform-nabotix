import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import PaginatedList from '@/components/ui/PaginatedList';
import { Application, getMyApplications, getProviderApplications, getPendingApplications, deleteApplication } from '@/integrations/api/applicationApi';
import { formatDateTime } from '@/lib/utils';
import {
    FileText,
    Plus,
    Calendar,
    User,
    Building,
    Download,
    Eye,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle,
    MessageSquare,
    Database,
    Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import ApplyDialog from '@/components/application/ApplyDialog';
import ApplicationDetailDialog from './ApplicationDetailDialog'; // 导入新的详情对话框组件
import { useToast } from '@/components/ui/use-toast';
import { DatasetDetailModal } from '@/components/dataset/DatasetDetailModal';
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

interface ApplicationListProps {
    variant?: 'my-applications' | 'provider-applications' | 'pending-applications';
    title?: string;
}

const ApplicationList: React.FC<ApplicationListProps> = ({
                                                             variant = 'my-applications',
                                                             title = '我的申请记录'
                                                         }) => {
    const [isApplyDialogOpen, setIsApplyDialogOpen] = useState(false);
    const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
    const [viewDialogOpen, setViewDialogOpen] = useState(false);
    const [selectedDataset, setSelectedDataset] = useState<any>(null);
    const [isDatasetModalOpen, setIsDatasetModalOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [applicationToDelete, setApplicationToDelete] = useState<Application | null>(null);
    const { toast } = useToast();
    const paginatedListRef = useRef<any>(null);

    const fetchApplications = useCallback(async (page: number, size: number) => {
        switch (variant) {
            case 'my-applications':
                const myApplications = await getMyApplications(page, size);
                return myApplications.data;
            case 'provider-applications':
                const providerApplications = await getProviderApplications(page, size);
                return providerApplications.data;
            case 'pending-applications':
                const pendingApplications = await getPendingApplications(page, size);
                return pendingApplications.data;
            default:
                const defaultApplications = await getMyApplications(page, size);
                return defaultApplications.data;
        }
    }, [variant]);

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
                return <Clock className="h-3 w-3 mr-1" />;
            case 'PENDING_PROVIDER_REVIEW':
            case 'PENDING_INSTITUTION_REVIEW':
                return <AlertCircle className="h-3 w-3 mr-1" />;
            case 'APPROVED':
                return <CheckCircle className="h-3 w-3 mr-1" />;
            case 'DENIED':
                return <XCircle className="h-3 w-3 mr-1" />;
            default:
                return <Clock className="h-3 w-3 mr-1" />;
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

    const handleViewDetails = (application: Application) => {
        setSelectedApplication(application);
        setViewDialogOpen(true);
    };

    const handleViewDataset = (application: Application) => {
        // 创建一个模拟的数据集对象，包含必要的字段
        const dataset = {
            id: application.datasetId,
            titleCn: application.datasetTitle,
            // 可以根据需要添加其他字段
        };
        setSelectedDataset(dataset);
        setIsDatasetModalOpen(true);
    };

    const handleDeleteClick = (application: Application) => {
        setApplicationToDelete(application);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!applicationToDelete) return;
        
        try {
            await deleteApplication(applicationToDelete.id);
            toast({
                title: "删除成功",
                description: "申请记录已成功删除。",
            });
            setDeleteDialogOpen(false);
            setApplicationToDelete(null);
            // 触发重新加载数据
            if (paginatedListRef.current) {
                paginatedListRef.current.refresh();
            }
        } catch (error) {
            toast({
                title: "删除失败",
                description: "无法删除申请记录，请稍后重试。",
                variant: "destructive",
            });
        }
    };

    const renderApplicationItem = (application: Application) => (
        <Card key={application.id} className="hover:shadow-md transition-shadow border-l-4 border-l-primary">
            <CardHeader className="pb-3">
                <div className="flex justify-between items-start gap-4">
                    <div className="space-y-2 flex-1 min-w-0">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <span className="truncate" title={application.projectTitle}>
                                {truncateText(application.projectTitle, 30)}
                            </span>
                            {application.status === 'APPROVED' && (
                                <Tooltip>
                                    <TooltipTrigger>
                                        <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-200 whitespace-nowrap">
                                            <CheckCircle className="h-3 w-3 mr-1" />
                                            可下载
                                        </Badge>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>此申请已批准，可以下载数据集</p>
                                    </TooltipContent>
                                </Tooltip>
                            )}
                        </CardTitle>
                        <div 
                            className="text-sm text-muted-foreground flex items-center gap-1 cursor-pointer hover:text-primary hover:underline"
                            onClick={() => handleViewDataset(application)}
                        >
                            <Database className="h-3 w-3 flex-shrink-0" />
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
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleViewDetails(application)}
                                    >
                                        <Eye className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>查看详情</p>
                                </TooltipContent>
                            </Tooltip>
                            {variant === 'my-applications' && (
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleDeleteClick(application)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>删除申请</p>
                                    </TooltipContent>
                                </Tooltip>
                            )}
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <span className="font-medium">申请人:</span>
                            <span className="truncate" title={application.applicantName}>
                                {application.applicantName}
                            </span>
                        </div>
                        {application.providerName && (
                            <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                <span className="font-medium">数据集提供者: </span>
                                <span className="truncate">
                                    {application.providerName}
                                </span>
                            </div>
                        )}
                        {application.supervisorName && (
                            <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                <span className="font-medium">机构审核人: </span>
                                <span className="truncate">
                                    {application.supervisorName}
                                </span>
                            </div>
                        )}

                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
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
                            <div className="text-green-600 font-medium">批准时间: {formatDate(application.approvedAt)}</div>
                        )}
                    </div>
                </div>

                {/* 审核意见显示 */}
                {(application.providerNotes || application.adminNotes) && (
                    <div className="mt-3 pt-3 border-t">
                        <div className="flex items-start gap-2">
                            <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                                <span className="text-sm font-medium text-muted-foreground">审核意见</span>
                                <div className="text-sm mt-1 space-y-1">
                                    {application.providerNotes && (
                                        <p className="break-words">
                                            <span className="font-medium text-blue-600">数据集提供者:</span> {application.providerNotes}
                                        </p>
                                    )}
                                    {application.adminNotes && (
                                        <p className="break-words">
                                            <span className="font-medium text-purple-600">机构管理员:</span> {application.adminNotes}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 时间轴预览 */}
                <div className="mt-3 pt-3 border-t">
                    <div className="flex items-center justify-between text-xs">
                        {getTimelineItems(application).map((item, index) => (
                            <Tooltip key={index}>
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
    );

    const getTimelineItems = (application: Application) => {
        const items = [{
            status: '提交申请',
            date: application.submittedAt,
            completed: true,
            icon: <Plus className="h-4 w-4" />,
            notes: null,
            reviewer: null
        }];

        // 提供者审核
        if (application.providerReviewedAt) {
            const isProviderRejected = application.status === 'DENIED' && !application.institutionReviewedAt;
            items.push({
                status: isProviderRejected ? '提供者审核拒绝' : '提供者审核通过',
                date: application.providerReviewedAt,
                completed: true,
                icon: <User className="h-4 w-4" />,
                notes: application.providerNotes,
                reviewer: null
            });
        } else if (application.status !== 'SUBMITTED') {
            items.push({
                status: '待提供者审核',
                date: null,
                completed: false,
                icon: <User className="h-4 w-4" />,
                notes: null,
                reviewer: null
            });
        }

        // 机构审核
        if (application.institutionReviewedAt) {
            const isInstitutionRejected = application.status === 'DENIED' && application.providerReviewedAt;
            items.push({
                status: isInstitutionRejected ? '机构审核拒绝' : '机构审核通过',
                date: application.institutionReviewedAt,
                completed: true,
                icon: <Building className="h-4 w-4" />,
                notes: application.adminNotes,
                reviewer: null
            });
        } else if (['PENDING_INSTITUTION_REVIEW', 'APPROVED', 'DENIED'].includes(application.status)) {
            items.push({
                status: '机构审核',
                date: null,
                completed: false,
                icon: <Building className="h-4 w-4" />,
                notes: null,
                reviewer: null
            });
        }

        // 最终状态
        if (application.approvedAt) {
            items.push({
                status: '审批完成',
                date: application.approvedAt,
                completed: true,
                icon: <CheckCircle className="h-4 w-4" />,
                notes: null,
                reviewer: null
            });
        }

        return items;
    };

    const renderEmptyState = () => {
        let emptyMessage = "您还没有提交任何数据集申请";
        if (variant === 'provider-applications') {
            emptyMessage = "暂无需要您审核的申请";
        } else if (variant === 'pending-applications') {
            emptyMessage = "暂无待处理的申请";
        }

        return (
            <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">暂无申请记录</p>
                <p className="text-sm mt-2 mb-4">{emptyMessage}</p>
                {variant === 'my-applications' && (
                    <Button onClick={() => setIsApplyDialogOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        立即申请
                    </Button>
                )}
            </div>
        );
    };

    const getCardTitle = () => {
        if (title) return title;
        switch (variant) {
            case 'my-applications':
                return '我的申请记录';
            case 'provider-applications':
                return '待我审核的申请';
            case 'pending-applications':
                return '待处理申请';
            default:
                return '申请记录';
        }
    };

    return (
        <TooltipProvider>
            <>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            {getCardTitle()}
                        </CardTitle>
                        {variant === 'my-applications' && (
                            <Button onClick={() => setIsApplyDialogOpen(true)}>
                                <Plus className="mr-2 h-4 w-4" />
                                申请数据集
                            </Button>
                        )}
                    </CardHeader>
                    <CardContent>
                        <PaginatedList
                            ref={paginatedListRef}
                            fetchData={fetchApplications}
                            renderItem={renderApplicationItem}
                            renderEmptyState={renderEmptyState}
                            pageSize={10}
                        />
                    </CardContent>
                </Card>

                <ApplyDialog open={isApplyDialogOpen} onOpenChange={setIsApplyDialogOpen} />
                <ApplicationDetailDialog 
                    open={viewDialogOpen} 
                    onOpenChange={setViewDialogOpen} 
                    application={selectedApplication} 
                />
                {selectedDataset && (
                    <DatasetDetailModal 
                        dataset={selectedDataset} 
                        open={isDatasetModalOpen} 
                        onOpenChange={setIsDatasetModalOpen} 
                    />
                )}
                
                <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>确认删除申请？</AlertDialogTitle>
                            <AlertDialogDescription>
                                此操作将永久删除申请"{applicationToDelete?.projectTitle}"。此操作不可撤销。
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>取消</AlertDialogCancel>
                            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
                                删除
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </>
        </TooltipProvider>
    );
};

export default ApplicationList;