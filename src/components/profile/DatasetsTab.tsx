import React, { useCallback, useRef, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import PaginatedList from '@/components/ui/PaginatedList';
import { datasetApi, Dataset } from '@/integrations/api/datasetApi';
import { formatDateTime } from '@/lib/utils';
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
  Upload
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DatasetDetailModal } from '@/components/dataset/DatasetDetailModal';
import { useToast } from '@/components/ui/use-toast';
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
import { DatasetUpload } from '@/components/upload/DatasetUpload';
import { getCurrentUserRoles } from '@/lib/authUtils';
import { PermissionRoles } from '@/lib/permissionUtils';
import {DatasetTypes} from "@/lib/enums.ts";

const DatasetsTab = () => {
  const [selectedDataset, setSelectedDataset] = React.useState<any>(null);
  const [isDatasetModalOpen, setIsDatasetModalOpen] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [datasetToDelete, setDatasetToDelete] = React.useState<Dataset | null>(null);
  const [showUpload, setShowUpload] = React.useState(false);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const { toast } = useToast();
  const paginatedListRef = useRef<any>(null);

  // Check user permissions
  useEffect(() => {
    const roles = getCurrentUserRoles();
    setUserRoles(roles);
  }, []);

  // Check if user has permission to upload datasets
  const canUploadDataset = useCallback(() => {
    return userRoles.includes(PermissionRoles.PLATFORM_ADMIN) || 
           userRoles.includes(PermissionRoles.INSTITUTION_SUPERVISOR) || 
           userRoles.includes(PermissionRoles.DATASET_UPLOADER);
  }, [userRoles]);

  const fetchDatasets = useCallback(async (page: number, size: number) => {
    const response = await datasetApi.getManageableDatasets({
      page,
      size,
      sortBy: 'updatedAt',
      sortDir: 'desc'
    });
    return response.data;
  }, []);

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
      return <CheckCircle className="h-3 w-3 mr-1" />;
    } else if (hasRejectedVersion) {
      return <XCircle className="h-3 w-3 mr-1" />;
    } else {
      return <Clock className="h-3 w-3 mr-1" />;
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
    } catch (error) {
      toast({
        title: "删除失败",
        description: "无法删除数据集，请稍后重试。",
        variant: "destructive",
      });
    }
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
            <p className="text-sm text-muted-foreground line-clamp-2">
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
                    <Database className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>查看详情</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteClick(dataset)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>删除数据集</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="font-medium">数据集负责人:</span>
              <span className="truncate" title={dataset.datasetLeader}>
                {dataset.datasetLeader}
              </span>
            </div>
            {dataset.provider && (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="font-medium">提供者: </span>
                <span className="truncate">
                  {dataset.provider.realName || dataset.provider.username}
                </span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="font-medium">创建时间:</span>
              <span>{formatDateTime(dataset.createdAt)}</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="font-medium">收集单位:</span>
              <span className="truncate" title={dataset.dataCollectionUnit}>
                {dataset.dataCollectionUnit}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
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
              <span className="ml-2">{DatasetTypes[dataset.type as keyof typeof DatasetTypes] || dataset.type}</span>
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
      <Database className="h-16 w-16 mx-auto mb-4 opacity-50" />
      <p className="text-lg font-medium">暂无数据集</p>
      <p className="text-sm mt-2 mb-4">您还没有提交任何数据集</p>
      {canUploadDataset() && (
        <Button onClick={() => setShowUpload(true)} className="gap-2">
          <Upload className="h-4 w-4" />
          上传数据集
        </Button>
      )}
    </div>
  );

  // 如果用户没有上传权限，则不显示整个组件
  if (!canUploadDataset()) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>访问被拒绝</CardTitle>
        </CardHeader>
        <CardContent>
          <p>您没有权限访问此页面。</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <TooltipProvider>
      <>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              {userRoles.includes(PermissionRoles.DATASET_UPLOADER) ? (
                  <span>我的数据集</span>
              ) : (
                  <span>数据集管理</span>
              )}
            </CardTitle>
            {canUploadDataset() && (
              <Button onClick={() => setShowUpload(!showUpload)} className="gap-2">
                <Upload className="h-4 w-4" />
                {showUpload ? '隐藏上传' : '上传数据集'}
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {showUpload && (
              <div className="mb-6">
                <DatasetUpload onSuccess={() => {
                  setShowUpload(false);
                  // Refresh the dataset list
                  if (paginatedListRef.current) {
                    paginatedListRef.current.refresh();
                  }
                }} />
              </div>
            )}
            <PaginatedList
              ref={paginatedListRef}
              fetchData={fetchDatasets}
              renderItem={renderDatasetItem}
              renderEmptyState={renderEmptyState}
              pageSize={10}
            />
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
      </>
    </TooltipProvider>
  );
};

export default DatasetsTab;