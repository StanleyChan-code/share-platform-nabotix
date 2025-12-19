import React, { useCallback } from 'react';
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
  XCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DatasetDetailModal } from '@/components/dataset/DatasetDetailModal';

const DatasetsTab = () => {
  const [selectedDataset, setSelectedDataset] = React.useState<any>(null);
  const [isDatasetModalOpen, setIsDatasetModalOpen] = React.useState(false);

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
      return '草稿';
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

  const renderDatasetItem = (dataset: Dataset) => (
    <Card key={dataset.id} className="hover:shadow-md transition-shadow border-l-4 border-l-primary">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start gap-4">
          <div className="space-y-2 flex-1 min-w-0">
            <CardTitle className="text-lg flex items-center gap-2">
              <span className="truncate" title={dataset.titleCn}>
                {dataset.titleCn}
              </span>
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
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="font-medium">负责人:</span>
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
              <span className="ml-2">{dataset.type}</span>
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
      <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
      <p className="text-lg font-medium">暂无数据集</p>
      <p className="text-sm mt-2 mb-4">您还没有提交任何数据集</p>
    </div>
  );

  return (
    <TooltipProvider>
      <>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              我的数据集
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PaginatedList
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
          />
        )}
      </>
    </TooltipProvider>
  );
};

export default DatasetsTab;