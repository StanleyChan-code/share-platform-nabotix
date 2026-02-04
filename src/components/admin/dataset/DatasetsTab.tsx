import React, {useCallback, useRef, useState, useEffect} from 'react';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card.tsx';
import {Badge} from '@/components/ui/badge.tsx';
import {Skeleton} from '@/components/ui/skeleton.tsx';
import {datasetApi, Dataset, ResearchSubject} from '@/integrations/api/datasetApi.ts';
import {cn, formatDateTime} from '@/lib/utils.ts';
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
    Filter,
    RefreshCw, Users, BookOpen, Tag, UserCheck, Target, CalendarCheck
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
import {getCurrentUserInfoFromSession, getCurrentUserRolesFromSession} from '@/lib/authUtils';
import {canUploadDataset, hasPermissionRole, PermissionRoles} from '@/lib/permissionUtils.ts';
import {DatasetTypes} from "@/lib/enums.ts";
import {DatasetUploadForm} from "@/components/admin/dataset/DatasetUploadForm.tsx";
import ReactPaginatedList, {ReactPaginatedListRef} from "@/components/ui/ReactPaginatedList.tsx";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select.tsx";
import {InstitutionSelector} from "@/components/admin/institution/InstitutionSelector.tsx";
import {useDebounce} from "@/hooks/useDebounce";
import {Input} from "@/components/ui/FormValidator.tsx";
import {Switch} from "@/components/ui/switch.tsx";
import {refreshDatasetPendingCount} from "@/lib/pendingCountsController";

const DatasetsTab = () => {
    const [filterByCurrentUser, setFilterByCurrentUser] = useState(false);
    const [selectedDataset, setSelectedDataset] = React.useState<any>(null);
    const [isDatasetModalOpen, setIsDatasetModalOpen] = React.useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
    const [datasetToDelete, setDatasetToDelete] = React.useState<Dataset | null>(null);
    const [showUpload, setShowUpload] = React.useState(false);
    const [cancelUploadDialogOpen, setCancelUploadDialogOpen] = React.useState(false);
    const [userRoles, setUserRoles] = useState<string[]>([]);
    const {toast} = useToast();
    const currentUser = getCurrentUserInfoFromSession();

    // 添加筛选相关状态
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedSubject, setSelectedSubject] = useState<string>("all");
    const [selectedType, setSelectedType] = useState<string>("all"); // 数据集类型筛选状态
    const [isTopLevel, setIsTopLevel] = useState<boolean | "all">("all");
    const [institutionId, setInstitutionId] = useState<string[] | null>(null);
    // 根据用户角色设置默认审核状态筛选和是否显示“只看自己”选项
    let showOnlyOwn = false;
    const initialReviewStatus = (() => {
        const roles = getCurrentUserRolesFromSession();
        if (roles.includes(PermissionRoles.INSTITUTION_SUPERVISOR) || roles.includes(PermissionRoles.DATASET_APPROVER)) {
            showOnlyOwn = true;
            return "PENDING_INSTITUTION_REVIEW"; // 机构管理员和机构数据集审核员默认选待机构审核
        } else if (roles.includes(PermissionRoles.PLATFORM_ADMIN)) {
            showOnlyOwn = true;
            return "PENDING_PLATFORM_REVIEW"; // 平台管理员默认选待平台审核
        } else {
            return "ALL"; // 其他角色默认选全部
        }
    })();
    const [reviewStatus, setReviewStatus] = useState<string>(initialReviewStatus); // 审核状态筛选
    const [subjects, setSubjects] = useState<ResearchSubject[]>([]);
    const [showFilters, setShowFilters] = useState(true);

    // 添加防抖处理，延迟550ms
    const debouncedSearchTerm = useDebounce(searchTerm, 550);

    // 创建ReactPaginatedList的ref
    const paginatedListRef = useRef<ReactPaginatedListRef>(null);
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
        const roles = getCurrentUserRolesFromSession();
        setUserRoles(roles);
    }, []);

    // 使用 useRef 来跟踪加载状态，避免依赖循环
    const loadingRef = useRef(false);

    // 获取数据集列表（用于ReactPaginatedList分页）
    const fetchDatasetList = useCallback(async (page: number, size: number = 10) => {
        if (loadingRef.current) return {content: [], page: {number: page, totalPages: 0, totalElements: 0}};

        loadingRef.current = true;
        setLoading(true);
        try {
            const response = await datasetApi.advancedSearchDatasets({
                page,
                size,
                sortDir: 'desc',
                titleCnOrKey: debouncedSearchTerm || undefined,
                subjectAreaId: selectedSubject !== "all" ? selectedSubject : undefined,
                type: selectedType !== "all" ? selectedType : undefined, // 添加类型筛选
                isTopLevel: isTopLevel !== "all" ? isTopLevel : undefined,
                institutionId: institutionId && institutionId.length > 0 ? institutionId[0] : undefined,
                providerId: filterByCurrentUser ? currentUser?.user?.id : undefined, // 如果设置了filterByCurrentUser并且有当前用户，则只获取当前用户的数据集
                reviewStatus: reviewStatus !== "ALL" ? reviewStatus as any : undefined
            });

            // 刷新待审核数量
            refreshDatasetPendingCount();

            return response.data;
        } catch (error) {
            console.error("获取数据集列表失败:", error);
            toast({
                title: "错误",
                description: "获取数据集列表失败",
                variant: "destructive"
            });
            throw error;
        } finally {
            loadingRef.current = false;
            setLoading(false);
        }
    }, [currentUser?.user?.id, filterByCurrentUser, toast, debouncedSearchTerm, selectedSubject, selectedType, isTopLevel, institutionId, reviewStatus]); // 添加 selectedType 到依赖数组

    // 当筛选条件变化时重新获取数据
    useEffect(() => {
        // 使用ref调用刷新方法
        if (paginatedListRef.current) {
            paginatedListRef.current.reset();
        }
    }, [debouncedSearchTerm, selectedSubject, selectedType, isTopLevel, institutionId, reviewStatus, filterByCurrentUser]);

    const hasDeletionPermission = (dataset: Dataset) => {
        // 只有数据集创建者或平台管理员可以删除数据集
        const userInfo = getCurrentUserInfoFromSession();
        if (!userInfo) {
            return false;
        }
        return dataset.provider?.id === userInfo.user.id || hasPermissionRole(PermissionRoles.PLATFORM_ADMIN);
    };

    const getStatusBadgeVariant = (dataset: Dataset) => {
        // 检查是否有已批准的版本
        const hasApprovedVersion = dataset.versions.some(version => version.approved === true);

        if (hasApprovedVersion) {
            return 'outline';
        } else if (dataset.versions.length > 0) {
            return 'secondary';
        } else {
            return 'outline';
        }
    };

    const getStatusIcon = (dataset: Dataset) => {
        // 检查是否有已批准的版本
        const hasApprovedVersion = dataset.versions.some(version => version.approved === true);
        const hasRejectedVersion = dataset.versions.some(version => version.institutionApproved === false || version.approved === false);

        if (hasApprovedVersion) {
            return <CheckCircle className="h-3 w-3 mr-1"/>;
        } else if (hasRejectedVersion) {
            return <XCircle className="h-3 w-3 mr-1"/>;
        } else {
            return <Clock className="h-3 w-3 mr-1"/>;
        }
    };

    const getStatusColor = (dataset: Dataset) => {
        // 检查是否有已批准的版本
        const hasApprovedVersion = dataset.versions.some(version => version.approved === true);
        const hasRejectedVersion = dataset.versions.some(version => version.institutionApproved === false || version.approved === false);

        if (hasApprovedVersion) {
            return 'text-green-700 bg-green-100';
        } else if (hasRejectedVersion) {
            return 'text-red-700 bg-red-100';
        } else {
            return 'text-yellow-800 bg-yellow-100';
        }
    }

    const getStatusText = (dataset: Dataset) => {
        // 检查是否有已批准的版本
        const hasApprovedVersion = dataset.versions.some(version => version.approved === true);
        const hasRejectedVersion = dataset.versions.some(version => version.institutionApproved === false || version.approved === false);
        const hasPendingInstitutionReview = dataset.versions.some(version => version.institutionApproved === null);
        const hasPendingPlatformReview = dataset.versions.some(version => version.institutionApproved === true && version.approved === null);

        if (hasApprovedVersion) {
            return '已发布';
        } else if (hasRejectedVersion) {
            return '已拒绝';
        } else if (hasPendingPlatformReview) {
            return '待平台审核';
        } else if (hasPendingInstitutionReview) {
            return '待机构审核';
        } else if (dataset.versions.length > 0) {
            return '待审核';
        } else {
            return '未提交数据集版本';
        }
    };

    // 计算待审核版本数量
    const getPendingVersionCount = (dataset: Dataset) => {
        return dataset.versions.filter(version => version.institutionApproved === null || version.approved === null).length;
    };

    // 计算待机构审核版本数量
    const getPendingInstitutionReviewCount = (dataset: Dataset) => {
        return dataset.versions.filter(version => version.institutionApproved === null).length;
    };

    // 计算待平台审核版本数量
    const getPendingPlatformReviewCount = (dataset: Dataset) => {
        return dataset.versions.filter(version => version.institutionApproved === true && version.approved === null).length;
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
            handleRefresh();
        } catch (error) {
            toast({
                title: "删除失败",
                description: "无法删除数据集，请稍后重试。",
                variant: "destructive",
            });
        }
    };


    // 重置筛选条件
    const resetFilters = () => {
        setSearchTerm("");
        setSelectedSubject("all");
        setSelectedType("all"); // 重置类型筛选
        setIsTopLevel("all");
        setInstitutionId(null);
        setReviewStatus("ALL");
    };

    // 手动刷新列表
    const handleRefresh = () => {
        if (paginatedListRef.current) {
            paginatedListRef.current.refresh();
        }
    };

    const renderDatasetItem = (dataset: Dataset) => (
        <Card key={dataset.id} className="hover:shadow-md transition-shadow border-l-4 border-l-primary">
            <CardHeader className="pb-3">
                <div className="flex justify-between items-start gap-4">
                    <div className="space-y-2 flex-1 min-w-0">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <span className="truncate hover:underline hover:cursor-pointer"
                                  onClick={() => handleViewDataset(dataset)}
                            >
                                {dataset.titleCn}
                            </span>
                            {dataset.parentDatasetId && (
                                <Badge variant="secondary" className="text-xs">
                                    随访数据集
                                </Badge>
                            )}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground line-clamp-2 whitespace-pre-wrap break-all">
                            {dataset.description}
                        </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="flex flex-col items-end gap-1">
                            <Badge
                                variant={getStatusBadgeVariant(dataset)}
                                className={"flex items-center whitespace-nowrap min-w-[100px] justify-center " + getStatusColor(dataset)}
                            >
                                {getStatusIcon(dataset)}
                                <span className={"text-sm"}>{getStatusText(dataset)}</span>
                            </Badge>
                            {getPendingVersionCount(dataset) > 0 && (
                                <>
                                    {getPendingInstitutionReviewCount(dataset) > 0 && (
                                        <Badge variant="secondary"
                                               className="text-xs bg-yellow-100 text-yellow-800 border-yellow-200 mr-1">
                                            版本待机构审核
                                        </Badge>
                                    )}
                                    {getPendingPlatformReviewCount(dataset) > 0 && (
                                        <Badge variant="secondary"
                                               className="text-xs bg-blue-100 text-blue-800 border-blue-200">
                                            版本待平台审核
                                        </Badge>
                                    )}
                                </>
                            )}
                        </div>
                        <div className="flex gap-1">
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        className="h-10 w-10 p-2"
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
                                            className="h-10 w-10 p-2 text-destructive hover:text-destructive"
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
                                <UserCheck className="h-4 w-4 text-muted-foreground flex-shrink-0"/>
                                <span className="font-medium">数据集提供者: </span>
                                <span className="truncate">
                  {dataset.provider.realName}
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
                            <span className="font-medium">采集单位:</span>
                            <span className="truncate" title={dataset.dataCollectionUnit}>
                {dataset.dataCollectionUnit}
              </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0"/>
                            <span className="font-medium">版本数:</span>
                            <span>{dataset.versions.length}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <CalendarCheck className="h-4 w-4 text-muted-foreground flex-shrink-0"/>
                            <span className="font-medium">首次发布时间:</span>
                            <span className="truncate">{formatDateTime(dataset.firstPublishedDate) || '未发布'}</span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Target className="h-4 w-4 text-muted-foreground flex-shrink-0"/>
                            <span className="font-medium">学科领域:</span>
                            <span>{dataset.subjectArea?.name || '未指定'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <BookOpen className="h-4 w-4 text-muted-foreground flex-shrink-0"/>
                            <span className="font-medium">数据集类型:</span>
                            <span>{DatasetTypes[dataset.type as keyof typeof DatasetTypes] || dataset.type}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0"/>
                            <span className="font-medium">更新时间:</span>
                            <span>{formatDateTime(dataset.updatedAt)}</span>
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
            <p className="text-sm mt-2">当前筛选条件下没有找到相关数据集</p>
        </div>
    );

    // 数据集骨架屏组件
    const renderDatasetSkeleton = () => (
        <Card className="border-l-4 border-l-primary">
            <CardHeader className="pb-3">
                <div className="flex justify-between items-start gap-4">
                    <div className="space-y-2 flex-1 min-w-0">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Skeleton className="h-5 w-3/4 rounded"/>
                        </CardTitle>
                        <Skeleton className="h-4 w-full rounded mb-2"/>
                        <Skeleton className="h-4 w-5/6 rounded"/>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="flex flex-col items-end gap-1">
                            <Skeleton className="h-6 w-28 rounded"/>
                            <Skeleton className="h-5 w-24 rounded"/>
                        </div>
                        <div className="flex gap-1">
                            <Skeleton className="h-10 w-10 rounded-full"/>
                            <Skeleton className="h-10 w-10 rounded-full"/>
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Skeleton className="h-4 w-4 rounded"/>
                            <Skeleton className="h-4 w-20 rounded"/>
                            <Skeleton className="h-4 w-24 rounded"/>
                        </div>
                        <div className="flex items-center gap-2">
                            <Skeleton className="h-4 w-4 rounded"/>
                            <Skeleton className="h-4 w-16 rounded"/>
                            <Skeleton className="h-4 w-20 rounded"/>
                        </div>
                        <div className="flex items-center gap-2">
                            <Skeleton className="h-4 w-4 rounded"/>
                            <Skeleton className="h-4 w-20 rounded"/>
                            <Skeleton className="h-4 w-28 rounded"/>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Skeleton className="h-4 w-4 rounded"/>
                            <Skeleton className="h-4 w-20 rounded"/>
                            <Skeleton className="h-4 w-24 rounded"/>
                        </div>
                        <div className="flex items-center gap-2">
                            <Skeleton className="h-4 w-4 rounded"/>
                            <Skeleton className="h-4 w-16 rounded"/>
                            <Skeleton className="h-4 w-8 rounded"/>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Skeleton className="h-4 w-24 rounded"/>
                            <Skeleton className="h-4 w-16 rounded"/>
                        </div>
                        <div className="flex items-center gap-2">
                            <Skeleton className="h-4 w-24 rounded"/>
                            <Skeleton className="h-4 w-16 rounded"/>
                        </div>
                        <div className="flex items-center gap-2">
                            <Skeleton className="h-4 w-24 rounded"/>
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
                {showFilters && (
                    <div className="mb-6 p-4 border rounded-lg bg-muted/50">
                        {/* 第一行：搜索和操作按钮 */}
                        <div className="flex flex-col sm:flex-row gap-4 mb-4">
                            {/* 左侧搜索框 */}
                            <div className="flex-1 min-w-[200px]">
                                <Input
                                    placeholder="搜索标题或关键词..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    maxLength={100}
                                    className="w-full"
                                />
                            </div>

                            {/* 右侧按钮组 */}
                            <div className="flex flex-wrap gap-2 justify-end">
                                {/* 只看自己开关 */}
                                {showOnlyOwn && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm">只看自己</span>
                                        <Switch
                                            checked={filterByCurrentUser}
                                            onCheckedChange={(checked) => {
                                                setFilterByCurrentUser(checked);
                                            }}
                                        />
                                    </div>
                                )}


                                {/* 刷新按钮 */}
                                <Button variant="outline"
                                        disabled={loading}
                                        onClick={() => {
                                            handleRefresh();
                                        }} className="gap-2">
                                    <RefreshCw className={cn("h-4 w-4", loading ? "animate-spin" : "")}/>
                                    刷新
                                </Button>

                                {/* 重置按钮 */}
                                <Button variant="outline" onClick={resetFilters}>
                                    重置筛选
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
                        </div>

                        {/* 第二行：筛选器 */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

                            {/* 审核状态筛选 */}
                            <div>
                                <Select value={reviewStatus} onValueChange={setReviewStatus}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="审核状态"/>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ALL">全部审核状态</SelectItem>
                                        <SelectItem value="PUBLISHED">已发布</SelectItem>
                                        <SelectItem value="PENDING_INSTITUTION_REVIEW">待机构审核</SelectItem>
                                        <SelectItem value="PENDING_PLATFORM_REVIEW">待平台审核</SelectItem>
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
                    </div>
                )}

                {showUpload && (
                    <div className="mb-6">
                        <DatasetUploadForm onSuccess={() => {
                            setShowUpload(false);
                            handleRefresh();
                        }}/>
                    </div>
                )}

                <ReactPaginatedList
                    ref={paginatedListRef}
                    fetchData={fetchDatasetList}
                    renderItem={renderDatasetItem}
                    renderEmptyState={renderEmptyState}
                    renderSkeletonItem={renderDatasetSkeleton}
                    pageSize={10}
                />

                {selectedDataset && (
                    <DatasetDetailModal
                        dataset={selectedDataset}
                        open={isDatasetModalOpen}
                        onOpenChange={setIsDatasetModalOpen}
                        useAdvancedQuery={true}
                        onDatasetUpdated={() => {
                            // 关闭模态框后刷新列表
                            handleRefresh();
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