import React, {useState, useCallback, useEffect, useRef} from 'react';
import {
    Application, getAllApplications
} from '@/integrations/api/applicationApi';
import {FileText, RefreshCw, Search} from "lucide-react";
import {TooltipProvider} from "@/components/ui/tooltip";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Skeleton} from "@/components/ui/skeleton";
import ApplicationDetailDialog from './ApplicationDetailDialog';
import {useToast} from '@/components/ui/use-toast';
import {DatasetDetailModal} from '@/components/dataset/DatasetDetailModal';
import {hasPermissionRole, PermissionRoles} from "@/lib/permissionUtils.ts";
import {InstitutionSelector} from "@/components/admin/institution/InstitutionSelector.tsx";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select.tsx";
import ApplicationItem from "./ApplicationItem";
import {useDebounce} from "@/hooks/useDebounce";
import {Input} from "@/components/ui/FormValidator.tsx";
import {refreshApplicationPendingCount} from "@/lib/pendingCountsController";
import {Button} from "@/components/ui/button.tsx";
import ReactPaginatedList from "@/components/ui/ReactPaginatedList";
import {ReactPaginatedListRef} from "@/components/ui/ReactPaginatedList";
import {cn} from "@/lib/utils.ts";

const ApplicationReviewTab: React.FC = () => {
    const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
    const [viewDialogOpen, setViewDialogOpen] = useState(false);
    const [selectedDataset, setSelectedDataset] = useState<any>(null);
    const [isDatasetModalOpen, setIsDatasetModalOpen] = useState(false);
    const {toast} = useToast();
    const paginatedListRef = useRef<ReactPaginatedListRef>(null);

    // 添加筛选相关状态
    const [searchTerm, setSearchTerm] = useState("");
    const [institutionId, setInstitutionId] = useState<string[] | null>(null);
    const [loading, setLoading] = useState(false);

    // 添加防抖处理，延迟550ms
    const debouncedSearchTerm = useDebounce(searchTerm, 550);

    const isPlatformAdmin = hasPermissionRole(PermissionRoles.PLATFORM_ADMIN);
    const isInstitutionSupervisor = hasPermissionRole(PermissionRoles.INSTITUTION_SUPERVISOR);
    const isDatasetApprover = hasPermissionRole(PermissionRoles.DATASET_APPROVER);
    const isDatasetUploader = hasPermissionRole(PermissionRoles.DATASET_UPLOADER);

    const isApplicationAdmin = isInstitutionSupervisor || isDatasetApprover;

    // 初始化时直接计算默认状态
    const initialStatus = isApplicationAdmin ? "PENDING_INSTITUTION_REVIEW" :
        isDatasetUploader ? "PENDING_PROVIDER_REVIEW" : "all";

    const [selectedStatus, setSelectedStatus] = useState<string>(initialStatus);

    // 管理端获取申请列表的API（适配ReactPaginatedList的接口）
    const fetchData = useCallback(async (page: number, size: number) => {
        setLoading(true);
        try {
            const data = await getAllApplications(
                page,
                size,
                'submittedAt',
                'desc',
                institutionId && institutionId.length > 0 ? institutionId[0] : undefined,
                debouncedSearchTerm || undefined,
                selectedStatus === 'all' ? undefined : selectedStatus
            );

            // 刷新待审核数量
            refreshApplicationPendingCount();
            
            return data.data;
        } catch (error) {
            console.error('获取申请列表失败:', error);
            toast({
                title: "错误",
                description: "获取申请列表失败：" + (error instanceof Error ? error.message : "未知错误"),
                variant: "destructive",
            });
            throw error;
        } finally {
            setLoading(false);
        }
    }, [institutionId, debouncedSearchTerm, selectedStatus, toast]);

    const handleResetFilters = () => {
        setSearchTerm("");
        setSelectedStatus(initialStatus);
    };

    const handleViewDataset = (application: Application) => {
        setSelectedDataset(application.dataset);
        setIsDatasetModalOpen(true);
    };

    const handleViewDetails = (application: Application) => {
        setSelectedApplication(application);
        setViewDialogOpen(true);
    };

    const renderApplicationItem = (application: Application) => (
        <ApplicationItem
            key={application.id}
            application={application}
            onViewDetails={handleViewDetails}
            onViewDataset={handleViewDataset}
            onApprove={() => {
                // 重新加载当前页
                if (paginatedListRef.current) {
                    paginatedListRef.current.refresh();
                }
            }}
            onReject={() => {
                if (paginatedListRef.current) {
                    paginatedListRef.current.refresh();
                }
            }}
            onDelete={() => {
                if (paginatedListRef.current) {
                    paginatedListRef.current.refresh();
                }
            }}
            variant="review"
        />
    );

    const renderEmptyState = () => (
        <div className="text-center py-12 text-muted-foreground">
            <FileText className="h-16 w-16 mx-auto mb-4 opacity-50"/>
            <p className="text-lg font-medium">暂无申请记录</p>
            <p className="text-sm mt-2">当前筛选条件下没有找到相关申请记录</p>
        </div>
    );

    // 申请记录骨架屏组件
    const ApplicationItemSkeleton = () => (
        <Card className="border-l-4 border-l-primary">
            <CardHeader>
                <div className="flex justify-between items-start gap-4">
                    <div className="space-y-2 flex-1 min-w-0">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Skeleton className="h-5 w-3/4 rounded"/>
                        </CardTitle>
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <Skeleton className="h-3 w-3 rounded"/>
                            <Skeleton className="h-4 w-full rounded"/>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <Skeleton className="h-6 w-32 rounded"/>
                        <div className="flex gap-1">
                            <Skeleton className="h-10 w-10 rounded-full"/>
                            <Skeleton className="h-10 w-10 rounded-full"/>
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm space-y-4">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Skeleton className="h-4 w-4 rounded"/>
                            <Skeleton className="h-4 w-16 rounded"/>
                            <Skeleton className="h-4 w-24 rounded"/>
                        </div>
                        <div className="flex items-center gap-2">
                            <Skeleton className="h-4 w-4 rounded"/>
                            <Skeleton className="h-4 w-16 rounded"/>
                            <Skeleton className="h-4 w-20 rounded"/>
                        </div>
                        <div className="flex items-center gap-2">
                            <Skeleton className="h-4 w-4 rounded"/>
                            <Skeleton className="h-4 w-16 rounded"/>
                            <Skeleton className="h-4 w-28 rounded"/>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Skeleton className="h-4 w-4 rounded"/>
                            <Skeleton className="h-4 w-16 rounded"/>
                            <Skeleton className="h-4 w-20 rounded"/>
                        </div>
                        <div className="flex items-center gap-2">
                            <Skeleton className="h-4 w-4 rounded"/>
                            <Skeleton className="h-4 w-16 rounded"/>
                            <Skeleton className="h-4 w-16 rounded"/>
                        </div>
                        <div className="flex items-center gap-2">
                            <Skeleton className="h-4 w-4 rounded"/>
                            <Skeleton className="h-4 w-16 rounded"/>
                            <Skeleton className="h-4 w-12 rounded"/>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Skeleton className="h-4 w-4 rounded"/>
                            <Skeleton className="h-4 w-16 rounded"/>
                            <Skeleton className="h-4 w-24 rounded"/>
                        </div>
                        <div className="flex items-center gap-2">
                            <Skeleton className="h-4 w-4 rounded"/>
                            <Skeleton className="h-4 w-16 rounded"/>
                            <Skeleton className="h-4 w-20 rounded"/>
                        </div>
                        <div className="flex items-center gap-2">
                            <Skeleton className="h-4 w-4 rounded"/>
                            <Skeleton className="h-4 w-16 rounded"/>
                            <Skeleton className="h-4 w-28 rounded"/>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );

    return (
        <TooltipProvider>
            <>
                {/* 平台管理员机构选择器 */}
                {hasPermissionRole(PermissionRoles.PLATFORM_ADMIN) && (
                    <div className="mb-6 p-4 border rounded-lg bg-muted/50">
                        <InstitutionSelector
                            value={institutionId}
                            onChange={setInstitutionId}
                            placeholder="选择要管理的机构（可选）"
                            allowMultiple={false}
                        />
                    </div>
                )}

                {/* 筛选区域 */}
                    <div className="mb-6 p-4 border rounded-lg bg-muted/50 flex flex-wrap items-center gap-4">
                        {/* 搜索框 */}
                        <div className="relative flex-1 min-w-[200px]">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
                            <Input
                                placeholder="搜索项目标题..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                maxLength={100}
                                className="pl-9"
                            />
                        </div>

                        {/* 状态下拉框 */}
                        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                            <SelectTrigger className="w-[160px]">
                                <SelectValue placeholder="申请状态"/>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">全部状态</SelectItem>
                                <SelectItem value="PENDING_PROVIDER_REVIEW">待提供者审核</SelectItem>
                                <SelectItem value="PENDING_INSTITUTION_REVIEW">待机构审核</SelectItem>
                                <SelectItem value="APPROVED">已批准</SelectItem>
                                <SelectItem value="DENIED">已拒绝</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* 刷新按钮 */}
                        <Button variant="outline"
                                disabled={loading}
                                onClick={() => paginatedListRef.current?.refresh()} className="gap-2 whitespace-nowrap">
                            <RefreshCw className={cn("h-4 w-4", loading ? "animate-spin" : "")} />
                            刷新
                        </Button>
                        <Button variant="outline"
                                onClick={handleResetFilters} className="gap-2 whitespace-nowrap">
                            重置筛选
                        </Button>
                    </div>

                {/* 使用ReactPaginatedList组件 */}
                <ReactPaginatedList
                    ref={paginatedListRef}
                    fetchData={fetchData}
                    renderItem={renderApplicationItem}
                    renderEmptyState={renderEmptyState}
                    renderSkeletonItem={ApplicationItemSkeleton}
                    pageSize={10}
                    gap={16}
                />

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
                        useAdvancedQuery={true}
                    />
                )}
            </>
        </TooltipProvider>
    );
};

export default ApplicationReviewTab;