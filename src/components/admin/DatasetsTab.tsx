import React, {useCallback, useRef, useState, useEffect} from 'react';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card.tsx';
import {Badge} from '@/components/ui/badge.tsx';
import PaginatedList from '@/components/ui/PaginatedList.tsx';
import {datasetApi, Dataset, ResearchSubject} from '@/integrations/api/datasetApi.ts';
import {formatDateTime} from '@/lib/utils.ts';
import {
    Database,
    Calendar,
    User,
    Building,
    FileText,
    CheckCircle,
    Clock,
    XCircle,
    Trash2,
    Upload,
    ChevronLeftIcon,
    ChevronRightIcon,
    Search,
    Filter
} from "lucide-react";
import {Button} from "@/components/ui/button.tsx";
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from "@/components/ui/tooltip.tsx";
import {DatasetDetailModal} from '@/components/dataset/DatasetDetailModal.tsx';
import {useToast} from '@/components/ui/use-toast.ts';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog.tsx";
import {getCurrentUserInfo, getCurrentUserRoles} from '@/lib/authUtils.ts';
import {canUploadDataset, hasPermissionRole, PermissionRoles} from '@/lib/permissionUtils.ts';
import {DatasetTypes} from "@/lib/enums.ts";
import {DatasetUploadForm} from "@/components/upload/DatasetUploadForm.tsx";
import ReactPaginate from "react-paginate";
import {Input} from "@/components/ui/input.tsx";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select.tsx";
import {AdminInstitutionSelector} from "@/components/admin/AdminInstitutionSelector.tsx";

interface DatasetsTabProps {
    filterByCurrentUser?: boolean;
}

const DatasetsTab = ({filterByCurrentUser = true}: DatasetsTabProps) => {
    const [selectedDataset, setSelectedDataset] = React.useState<any>(null);
    const [isDatasetModalOpen, setIsDatasetModalOpen] = React.useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
    const [datasetToDelete, setDatasetToDelete] = React.useState<Dataset | null>(null);
    const [showUpload, setShowUpload] = React.useState(false);
    const [cancelUploadDialogOpen, setCancelUploadDialogOpen] = React.useState(false);
    const [userRoles, setUserRoles] = useState<string[]>([]);
    const {toast} = useToast();
    const paginatedListRef = useRef<any>(null);
    const currentUser = getCurrentUserInfo();

    // 添加筛选相关状态
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedSubject, setSelectedSubject] = useState<string>("all");
    const [selectedType, setSelectedType] = useState<string>("all"); // 新增数据集类型筛选状态
    const [hasPendingVersion, setHasPendingVersion] = useState<boolean | "all">("all");
    const [isTopLevel, setIsTopLevel] = useState<boolean | "all">("all");
    const [institutionId, setInstitutionId] = useState<string | null>(null);
    const [subjects, setSubjects] = useState<ResearchSubject[]>([]);
    const [showFilters, setShowFilters] = useState(false);

    // 添加分页相关状态
    const [datasets, setDatasets] = useState<Dataset[]>([]);
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [loading, setLoading] = useState(false);

    // 获取学科领域选项
    useEffect(() => {
        const fetchSubjects = async () => {
            try {
                const subjectsData = await datasetApi.getResearchSubjects();
                setSubjects(subjectsData.data);
            } catch (error) {
                console.error("获取学科领域失败:", error);
                toast({
                    title: "错误",
                    description: "获取学科领域失败",
                    variant: "destructive"
                });
            }
        };

        fetchSubjects();
    }, [toast]);

    // Check user permissions
    useEffect(() => {
        const roles = getCurrentUserRoles();
        setUserRoles(roles);
    }, []);

    // 使用 useRef 来跟踪加载状态，避免依赖循环
    const loadingRef = useRef(false);

    // 获取数据集列表（用于react-paginate分页）
    const fetchDatasetList = useCallback(async (page: number) => {
        if (loadingRef.current) return;

        loadingRef.current = true;
        setLoading(true);
        try {
            // 如果设置了filterByCurrentUser并且有当前用户，则只获取当前用户的数据集
            let response;
            if (filterByCurrentUser && currentUser?.user?.id) {
                response = await datasetApi.advancedSearchDatasets({
                    page,
                    size: 10,
                    sortBy: 'updatedAt',
                    sortDir: 'desc',
                    providerId: currentUser?.user?.id,
                    titleCnOrKey: searchTerm || undefined,
                    subjectAreaId: selectedSubject !== "all" ? selectedSubject : undefined,
                    type: selectedType !== "all" ? selectedType : undefined, // 添加类型筛选
                    hasPendingVersion: hasPendingVersion !== "all" ? hasPendingVersion : undefined,
                    isTopLevel: isTopLevel !== "all" ? isTopLevel : undefined,
                    institutionId: institutionId || undefined
                });
            } else {
                // 否则获取所有可管理的数据集
                response = await datasetApi.advancedSearchDatasets({
                    page,
                    size: 10,
                    sortBy: 'updatedAt',
                    sortDir: 'desc',
                    titleCnOrKey: searchTerm || undefined,
                    subjectAreaId: selectedSubject !== "all" ? selectedSubject : undefined,
                    type: selectedType !== "all" ? selectedType : undefined, // 添加类型筛选
                    isTopLevel: isTopLevel !== "all" ? isTopLevel : undefined,
                    hasPendingVersion: hasPendingVersion !== "all" ? hasPendingVersion : undefined,
                    institutionId: institutionId || undefined,
                    providerId: ''
                });
            }

            setDatasets(response.data.content);
            setTotalPages(response.data.page.totalPages);
            setTotalElements(response.data.page.totalElements || 0);
            setCurrentPage(page);
        } catch (error) {
            console.error("获取数据集列表失败:", error);
            toast({
                title: "错误",
                description: "获取数据集列表失败",
                variant: "destructive"
            });
        } finally {
            loadingRef.current = false;
            setLoading(false);
        }
    }, [currentUser?.user?.id, filterByCurrentUser, toast, searchTerm, selectedSubject, selectedType, hasPendingVersion, isTopLevel, institutionId]); // 添加 selectedType 到依赖数组

    // 当filterByCurrentUser或currentUser改变时，重新获取数据
    useEffect(() => {
        // 只在非过滤当前用户模式下使用分页逻辑
        if (!filterByCurrentUser) {
            fetchDatasetList(0);
        }
    }, [filterByCurrentUser, fetchDatasetList]);

    // 当筛选条件变化时重新获取数据
    useEffect(() => {
        if (!filterByCurrentUser) {
            fetchDatasetList(0);
        } else if (paginatedListRef.current) {
            paginatedListRef.current.refresh();
        }
    }, [searchTerm, selectedSubject, hasPendingVersion, isTopLevel, institutionId, filterByCurrentUser, fetchDatasetList]);

    // 当切换到我的数据集模式时，确保使用 PaginatedList
    useEffect(() => {
        if (filterByCurrentUser && paginatedListRef.current) {
            paginatedListRef.current.refresh();
        }
    }, [filterByCurrentUser]);

    const hasDeletionPermission = (dataset: Dataset) => {
        // 只有数据集创建者或平台管理员可以删除数据集
        return dataset.provider?.id === getCurrentUserInfo().user.id || hasPermissionRole(PermissionRoles.PLATFORM_ADMIN);
    };

    const fetchDatasets = useCallback(async (page: number, size: number) => {
        // 如果设置了filterByCurrentUser并且有当前用户，则只获取当前用户的数据集
        if (filterByCurrentUser && currentUser?.user?.id) {
            const response = await datasetApi.advancedSearchDatasets({
                page,
                size,
                sortBy: 'updatedAt',
                sortDir: 'desc',
                providerId: currentUser?.user?.id,
                titleCnOrKey: searchTerm || undefined,
                subjectAreaId: selectedSubject !== "all" ? selectedSubject : undefined,
                type: selectedType !== "all" ? selectedType : undefined, // 添加类型筛选
                hasPendingVersion: hasPendingVersion !== "all" ? hasPendingVersion : undefined,
                isTopLevel: isTopLevel !== "all" ? isTopLevel : undefined,
                institutionId: institutionId || undefined
            });
            return response.data;
        } else {
            // 否则获取所有可管理的数据集
            const response = await datasetApi.advancedSearchDatasets({
                page,
                size,
                sortBy: 'updatedAt',
                sortDir: 'desc',
                titleCnOrKey: searchTerm || undefined,
                subjectAreaId: selectedSubject !== "all" ? selectedSubject : undefined,
                type: selectedType !== "all" ? selectedType : undefined, // 添加类型筛选
                hasPendingVersion: hasPendingVersion !== "all" ? hasPendingVersion : undefined,
                isTopLevel: isTopLevel !== "all" ? isTopLevel : undefined,
                institutionId: institutionId || undefined
            });
            return response.data;
        }
    }, [currentUser?.user?.id, filterByCurrentUser, searchTerm, selectedSubject, selectedType, hasPendingVersion, isTopLevel, institutionId]); // 添加 selectedType 到依赖数组

    const getStatusBadgeVariant = (dataset: Dataset) => {
        // 检查是否有已批准的版本
        const hasApprovedVersion = dataset.versions.some(version => version.approved === true);

        if (hasApprovedVersion) {
            return 'default';
        } else if (dataset.versions.length > 0) {
            return 'secondary';
        } else {
            return 'outline';
        }
    };

    const getStatusIcon = (dataset: Dataset) => {
        // 检查是否有已批准的版本
        const hasApprovedVersion = dataset.versions.some(version => version.approved === true);
        const hasRejectedVersion = dataset.versions.some(version => version.approved === false);

        if (hasApprovedVersion) {
            return <CheckCircle className="h-3 w-3 mr-1"/>;
        } else if (hasRejectedVersion) {
            return <XCircle className="h-3 w-3 mr-1"/>;
        } else {
            return <Clock className="h-3 w-3 mr-1"/>;
        }
    };

    const getStatusText = (dataset: Dataset) => {
        // 检查是否有已批准的版本
        const hasApprovedVersion = dataset.versions.some(version => version.approved === true);
        const hasRejectedVersion = dataset.versions.some(version => version.approved === false);

        if (hasApprovedVersion) {
            return '已发布';
        } else if (hasRejectedVersion) {
            return '已拒绝';
        } else if (dataset.versions.length > 0) {
            return '审核中';
        } else {
            return '未提交数据集版本';
        }
    };

    // 计算待审核版本数量
    const getPendingVersionCount = (dataset: Dataset) => {
        return dataset.versions.filter(version => version.approved === null).length;
    };

    const handleViewDataset = (dataset: Dataset) => {
        setSelectedDataset(dataset);
        setIsDatasetModalOpen(true);
    };

    const handleDeleteClick = (dataset: Dataset) => {
        setDatasetToDelete(dataset);
        setDeleteDialogOpen(true);
    };

    const handleCancelUploadClick = () => {
        setCancelUploadDialogOpen(true);
    };

    const confirmCancelUpload = () => {
        setCancelUploadDialogOpen(false);
        setShowUpload(false);
    };

    const confirmDelete = async () => {
        if (!datasetToDelete) return;

        try {
            await datasetApi.deleteDataset(datasetToDelete.id);
            toast({
                title: "删除成功",
                description: "数据集已成功删除。",
            });
            setDeleteDialogOpen(false);
            setDatasetToDelete(null);
            // 触发重新加载数据
            if (paginatedListRef.current) {
                paginatedListRef.current.refresh();
            }
            // 如果使用react-paginate分页，也需要刷新
            if (!filterByCurrentUser) {
                fetchDatasetList(currentPage);
            }
        } catch (error) {
            toast({
                title: "删除失败",
                description: "无法删除数据集，请稍后重试。",
                variant: "destructive",
            });
        }
    };

    // 处理页面更改
    const handlePageClick = (event: { selected: number }) => {
        const page = event.selected;
        fetchDatasetList(page);
    };

    // 重置筛选条件
    const resetFilters = () => {
        setSearchTerm("");
        setSelectedSubject("all");
        setSelectedType("all"); // 重置类型筛选
        setHasPendingVersion("all");
        setIsTopLevel("all");
        setInstitutionId(null);
    };

    const renderDatasetItem = (dataset: Dataset) => (
        <Card key={dataset.id} className="hover:shadow-md transition-shadow border-l-4 border-l-primary">
            <CardHeader className="pb-3">
                <div className="flex justify-between items-start gap-4">
                    <div className="space-y-2 flex-1 min-w-0">
                        <CardTitle className="text-lg flex items-center gap-2">
                              <span className="truncate" title={dataset.titleCn}>
                                {dataset.titleCn}
                              </span>
                            {dataset.parentDatasetId && (
                                <Badge variant="secondary" className="text-xs">
                                    随访数据集
                                </Badge>
                            )}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground line-clamp-2 whitespace-pre-line">
                            {dataset.description}
                        </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="flex flex-col items-end gap-1">
                            <Badge
                                variant={getStatusBadgeVariant(dataset)}
                                className="flex items-center whitespace-nowrap min-w-[80px] justify-center"
                            >
                                {getStatusIcon(dataset)}
                                {getStatusText(dataset)}
                            </Badge>
                            {getPendingVersionCount(dataset) > 0 && (
                                <Badge variant="secondary" className="text-xs">
                                    存在待审核版本
                                </Badge>
                            )}
                        </div>
                        <div className="flex gap-1">
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleViewDataset(dataset)}
                                    >
                                        <Database className="h-4 w-4"/>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>查看详情</p>
                                </TooltipContent>
                            </Tooltip>
                            {hasDeletionPermission(dataset) && (
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleDeleteClick(dataset)}
                                        >
                                            <Trash2 className="h-4 w-4"/>
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>删除数据集</p>
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
                            <User className="h-4 w-4 text-muted-foreground flex-shrink-0"/>
                            <span className="font-medium">数据集负责人:</span>
                            <span className="truncate" title={dataset.datasetLeader}>
                {dataset.datasetLeader}
              </span>
                        </div>
                        {dataset.provider && (
                            <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground flex-shrink-0"/>
                                <span className="font-medium">提供者: </span>
                                <span className="truncate">
                  {dataset.provider.realName || dataset.provider.username}
                </span>
                            </div>
                        )}
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0"/>
                            <span className="font-medium">创建时间:</span>
                            <span>{formatDateTime(dataset.createdAt)}</span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Building className="h-4 w-4 text-muted-foreground flex-shrink-0"/>
                            <span className="font-medium">收集单位:</span>
                            <span className="truncate" title={dataset.dataCollectionUnit}>
                {dataset.dataCollectionUnit}
              </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0"/>
                            <span className="font-medium">版本数:</span>
                            <span>{dataset.versions.length}</span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div>
                            <span className="font-medium">学科领域:</span>
                            <span className="ml-2">{dataset.subjectArea?.name || '未指定'}</span>
                        </div>
                        <div>
                            <span className="font-medium">数据类型:</span>
                            <span
                                className="ml-2">{DatasetTypes[dataset.type as keyof typeof DatasetTypes] || dataset.type}</span>
                        </div>
                        <div>
                            <span className="font-medium">更新时间:</span>
                            <span className="ml-2">{formatDateTime(dataset.updatedAt)}</span>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );

    const renderEmptyState = () => (
        <div className="text-center py-12 text-muted-foreground">
            <Database className="h-16 w-16 mx-auto mb-4 opacity-50"/>
            <p className="text-lg font-medium">暂无数据集</p>
        </div>
    );

    return (
        <TooltipProvider>
            <>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div className="space-y-1">
                            <CardTitle className="flex items-center gap-2">
                                <span>数据集管理</span>
                            </CardTitle>
                            <CardDescription>
                                管理上传的所有数据集
                            </CardDescription>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                onClick={() => setShowFilters(!showFilters)}
                                className="gap-2"
                            >
                                <Filter className="h-4 w-4"/>
                                筛选
                            </Button>
                            {canUploadDataset() && (
                                <Button
                                    onClick={() => showUpload ? handleCancelUploadClick() : setShowUpload(true)}
                                    className="gap-2"
                                >
                                    <Upload className="h-4 w-4"/>
                                    {showUpload ? '取消上传' : '上传数据集'}
                                </Button>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent>
                        {/* 平台管理员机构选择器 */}
                        {hasPermissionRole(PermissionRoles.PLATFORM_ADMIN) && !filterByCurrentUser && (
                            <div className="mb-6 p-4 border rounded-lg bg-muted/50">
                                <AdminInstitutionSelector
                                    value={institutionId}
                                    onChange={setInstitutionId}
                                    placeholder="选择要管理的机构（可选）"
                                />
                            </div>
                        )}

                        {/* 筛选区域 */}
                        {showFilters && (
                            <div className="mb-6 p-4 border rounded-lg bg-muted/50 space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                                    {/* 搜索框 */}
                                    <div className="flex items-center gap-2">
                                        <Search className="h-4 w-4 text-muted-foreground"/>
                                        <Input
                                            placeholder="搜索标题或关键词..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>

                                    {/* 学科领域筛选 */}
                                    <div>
                                        <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="学科领域"/>
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">全部学科</SelectItem>
                                                {subjects.map((subject) => (
                                                    <SelectItem key={subject.id} value={subject.id}>
                                                        {subject.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* 数据集类型筛选 */}
                                    <div>
                                        <Select value={selectedType} onValueChange={setSelectedType}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="数据集类型"/>
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">全部类型</SelectItem>
                                                {Object.entries(DatasetTypes).map(([key, value]) => (
                                                    <SelectItem key={key} value={key}>
                                                        {value}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* 是否有待审核版本 */}
                                    <div>
                                        <Select
                                            value={hasPendingVersion === "all" ? "all" : hasPendingVersion ? "true" : "false"}
                                            onValueChange={(value) =>
                                                setHasPendingVersion(value === "all" ? "all" : value === "true")
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="待审核版本"/>
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">全部审核状态</SelectItem>
                                                <SelectItem value="true">待审核状态</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* 是否基线数据集 */}
                                    <div>
                                        <Select
                                            value={isTopLevel === "all" ? "all" : isTopLevel ? "true" : "false"}
                                            onValueChange={(value) =>
                                                setIsTopLevel(value === "all" ? "all" : value === "true")
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="基线数据集"/>
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">全部数据集</SelectItem>
                                                <SelectItem value="true">基线数据集</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                {/* 重置按钮 */}
                                <div className="flex justify-end">
                                    <Button variant="outline" onClick={resetFilters}>
                                        重置筛选条件
                                    </Button>
                                </div>
                            </div>
                        )}

                        {showUpload && (
                            <div className="mb-6">
                                <DatasetUploadForm onSuccess={() => {
                                    setShowUpload(false);
                                    // Refresh the dataset list
                                    if (paginatedListRef.current) {
                                        paginatedListRef.current.refresh();
                                    }
                                    if (!filterByCurrentUser) {
                                        fetchDatasetList(currentPage);
                                    }
                                }}/>
                            </div>
                        )}

                        {filterByCurrentUser ? (
                            <PaginatedList
                                ref={paginatedListRef}
                                fetchData={fetchDatasets}
                                renderItem={renderDatasetItem}
                                renderEmptyState={renderEmptyState}
                                pageSize={10}
                            />
                        ) : (
                            <div>
                                {loading ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        加载中...
                                    </div>
                                ) : datasets.length > 0 ? (
                                    <div className="space-y-4">
                                        {datasets.map(renderDatasetItem)}

                                        {/* 分页控件 */}
                                        <div
                                            className="mt-4 text-sm text-muted-foreground flex justify-between items-center">
                                            <div>
                                                共 {totalElements} 条记录
                                            </div>
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
                                    </div>
                                ) : (
                                    renderEmptyState()
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {selectedDataset && (
                    <DatasetDetailModal
                        dataset={selectedDataset}
                        open={isDatasetModalOpen}
                        onOpenChange={setIsDatasetModalOpen}
                        useAdvancedQuery={true}
                        onDatasetUpdated={() => {
                            // 关闭模态框后刷新列表
                            if (paginatedListRef.current) {
                                paginatedListRef.current.refresh();
                            }
                            if (!filterByCurrentUser) {
                                fetchDatasetList(currentPage);
                            }
                        }}
                    />
                )}

                <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>确认删除数据集？</AlertDialogTitle>
                            <AlertDialogDescription>
                                此操作将永久删除数据集"{datasetToDelete?.titleCn}"及其所有版本。此操作不可撤销。
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

                <AlertDialog open={cancelUploadDialogOpen} onOpenChange={setCancelUploadDialogOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>确认取消上传？</AlertDialogTitle>
                            <AlertDialogDescription>
                                您确定要取消上传吗？取消后填写的信息和上传的文件将丢失且无法恢复。
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>继续上传</AlertDialogCancel>
                            <AlertDialogAction onClick={confirmCancelUpload} className="bg-red-600 hover:bg-red-700">
                                确认清空
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </>
        </TooltipProvider>
    );
};

export default DatasetsTab;