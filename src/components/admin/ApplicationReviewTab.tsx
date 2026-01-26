import React, {useState, useCallback, useEffect} from 'react';
import ReactPaginate from "react-paginate";
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
import {ChevronLeftIcon, ChevronRightIcon} from "lucide-react";
import ApplicationItem from "./ApplicationItem";
import {useDebounce} from "@/hooks/useDebounce";
import {Input} from "@/components/ui/FormValidator.tsx";
import {refreshApplicationPendingCount} from "@/lib/pendingCountsController";
import {Button} from "@/components/ui/button.tsx";

const ApplicationReviewTab: React.FC = () => {
    const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
    const [viewDialogOpen, setViewDialogOpen] = useState(false);
    const [selectedDataset, setSelectedDataset] = useState<any>(null);
    const [isDatasetModalOpen, setIsDatasetModalOpen] = useState(false);
    const {toast} = useToast();

    // 添加分页相关状态
    const [applications, setApplications] = useState<Application[]>([]);
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [loading, setLoading] = useState(false);

    // 添加筛选相关状态
    const [searchTerm, setSearchTerm] = useState("");
    const [institutionId, setInstitutionId] = useState<string[] | null>(null);

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

    // 管理端获取申请列表的API
    const fetchApplications = useCallback(async (page: number = 0) => {
        // 使用管理API获取申请列表，包括待审核和已处理的申请
        setLoading(true);

        try {
            const size = 10; // 每页大小固定为10
            const data = await getAllApplications(
                page,
                size,
                'submittedAt',
                'desc',
                institutionId && institutionId.length > 0 ? institutionId[0] : undefined,
                debouncedSearchTerm || undefined,
                selectedStatus === 'all' ? undefined : selectedStatus
            );

            setApplications(data.data.content);
            setTotalPages(data.data.page.totalPages);
            setTotalElements(data.data.page.totalElements || 0);
            setCurrentPage(page);

            // 刷新待审核数量
            refreshApplicationPendingCount();
        } catch (error) {
            console.error('获取申请列表失败:', error);
            toast({
                title: "错误",
                description: "获取申请列表失败：" + (error instanceof Error ? error.message : "未知错误"),
                variant: "destructive",
            });
            // 设置空数据
            setApplications([]);
            setTotalPages(0);
            setTotalElements(0);
        } finally {
            setLoading(false);
        }
    }, [institutionId, debouncedSearchTerm, selectedStatus, toast]);

    // 监听防抖后的搜索值变化和状态变化，执行搜索
    useEffect(() => {
        fetchApplications(0);
    }, [debouncedSearchTerm, selectedStatus, fetchApplications]);

    const handleViewDataset = (application: Application) => {
        // 创建一个模拟的数据集对象，包含必要的字段
        const dataset = {
            id: application.dataset.id,
            titleCn: application.dataset.titleCn,
            // 可以根据需要添加其他字段
        };
        setSelectedDataset(dataset);
        setIsDatasetModalOpen(true);
    };

    const handleViewDetails = (application: Application) => {
        setSelectedApplication(application);
        setViewDialogOpen(true);
    };

    // 处理分页更改
    const handlePageClick = (event: { selected: number }) => {
        const page = event.selected;
        fetchApplications(page);
    };

    const renderApplicationItem = (application: Application) => (
        <ApplicationItem
            key={application.id}
            application={application}
            onViewDetails={handleViewDetails}
            onViewDataset={handleViewDataset}
            onApprove={() => {
                // 重新加载当前页
                fetchApplications(currentPage);
            }}
            onReject={() => {
                fetchApplications(currentPage);
            }}
            onDelete={() => {
                fetchApplications(currentPage);
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
                        <Button variant="outline" onClick={() => fetchApplications(currentPage)} className="gap-2 whitespace-nowrap">
                            <RefreshCw className="h-4 w-4"/>
                            刷新
                        </Button>
                    </div>

                {loading ? (
                    <div className="space-y-4">
                        {[...Array(totalElements || 1)].map((_, index) => (
                            <ApplicationItemSkeleton key={index} />
                        ))}
                    </div>
                ) : (
                    <>
                        <div className="space-y-4">
                            {applications && applications.length > 0 ? (
                                applications.map(renderApplicationItem)
                            ) : (
                                renderEmptyState()
                            )}
                        </div>

                        {/* 显示总数信息和分页 */}
                        <div className="mt-4 text-sm text-muted-foreground flex justify-between items-center">
                            {totalElements > 0 && (
                                <div>
                                    共 {totalElements} 条记录
                                </div>
                            )}
                            {/* 只有在总页数大于1时才显示分页 */}
                            {totalPages > 1 && (
                                <div className="flex justify-center">
                                    <ReactPaginate
                                        breakLabel="..."
                                        nextLabel={
                                            <span className="flex items-center gap-1">
                            下一页 <ChevronRightIcon className="h-4 w-4"/>
                          </span>
                                        }
                                        onPageChange={handlePageClick}
                                        pageRangeDisplayed={3}
                                        marginPagesDisplayed={1}
                                        pageCount={totalPages}
                                        previousLabel={
                                            <span className="flex items-center gap-1">
                            <ChevronLeftIcon className="h-4 w-4"/> 上一页
                          </span>
                                        }
                                        renderOnZeroPageCount={null}
                                        containerClassName="flex items-center justify-center gap-2"
                                        pageClassName=""
                                        pageLinkClassName="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-700 transition-all duration-200 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-blue-500 dark:hover:bg-blue-900/20"
                                        previousClassName=""
                                        previousLinkClassName="flex h-10 items-center justify-center rounded-lg border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700 transition-all duration-200 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-600 disabled:hover:border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-blue-500 dark:hover:bg-blue-900/20"
                                        nextClassName=""
                                        nextLinkClassName="flex h-10 items-center justify-center rounded-lg border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700 transition-all duration-200 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-600 disabled:hover:border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-blue-500 dark:hover:bg-blue-900/20"
                                        breakClassName=""
                                        breakLinkClassName="flex h-10 w-10 items-center justify-center text-gray-500 dark:text-gray-400"
                                        activeClassName=""
                                        activeLinkClassName="!border-blue-500 !bg-blue-500 !text-white hover:!bg-blue-600 hover:!border-blue-600 dark:!border-blue-500 dark:!bg-blue-500"
                                        disabledClassName="opacity-40 cursor-not-allowed"
                                        disabledLinkClassName="hover:border-gray-200 hover:bg-white hover:text-gray-700 dark:hover:border-gray-700 dark:hover:bg-gray-800"
                                        forcePage={currentPage}
                                    />
                                </div>
                            )}
                        </div>
                    </>
                )}

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