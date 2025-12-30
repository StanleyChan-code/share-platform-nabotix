import React, {useState, useCallback, useRef} from 'react';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import ReactPaginatedList, { ReactPaginatedListRef } from '@/components/ui/ReactPaginatedList';
import {
  Application,
  getMyApplications,
} from '@/integrations/api/applicationApi';
import {
  FileText,
  Plus,
} from "lucide-react";
import {Button} from "@/components/ui/button";
import {TooltipProvider} from "@/components/ui/tooltip";
import ApplyDialog from '@/components/application/ApplyDialog';
import {DatasetDetailModal} from '@/components/dataset/DatasetDetailModal';
import ApplicationDetailDialog from '../admin/ApplicationDetailDialog';
import ApplicationItem from "@/components/admin/ApplicationItem.tsx";
const ApplicationsTab = () => {
  const [isApplyDialogOpen, setIsApplyDialogOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedDataset, setSelectedDataset] = useState<any>(null);
  const [isDatasetModalOpen, setIsDatasetModalOpen] = useState(false);
  const paginatedListRef = useRef<ReactPaginatedListRef>(null);

  const title = '我的申请记录';

  const fetchApplications = useCallback(async (page: number, size: number) => {
    const myApplications = await getMyApplications(page, size);
    return myApplications.data;

  }, []);

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

  const renderApplicationItem = (application: Application) => (
      <ApplicationItem
          application={application}
          onViewDetails={handleViewDetails}
          onViewDataset={handleViewDataset}
          onDelete={() => {
            // 刷新数据
            if (paginatedListRef.current && typeof paginatedListRef.current.refresh === 'function') {
              paginatedListRef.current.refresh();
            }
          }}
      />
  );

  const renderEmptyState = () => {
    let emptyMessage = "您还没有提交任何数据集申请";
    return (
        <div className="text-center py-12 text-muted-foreground">
          <FileText className="h-16 w-16 mx-auto mb-4 opacity-50"/>
          <p className="text-lg font-medium">暂无申请记录</p>
          <p className="text-sm mt-2 mb-4">{emptyMessage}</p>
          <Button onClick={() => setIsApplyDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4"/>
            立即申请
          </Button>
        </div>
    );
  };

  const getCardTitle = () => {
    if (title) return title;
    return '我的申请记录';
  };

  return (
      <TooltipProvider>
        <>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5"/>
                {getCardTitle()}
              </CardTitle>
              <Button onClick={() => setIsApplyDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4"/>
                申请数据集
              </Button>
            </CardHeader>
            <CardContent>
              <ReactPaginatedList
                  ref={paginatedListRef}
                  fetchData={fetchApplications}
                  renderItem={renderApplicationItem}
                  renderEmptyState={renderEmptyState}
                  pageSize={10}
              />
            </CardContent>
          </Card>

          <ApplyDialog
              open={isApplyDialogOpen}
              onOpenChange={setIsApplyDialogOpen}
              onSubmitted={() => {
                // 刷新数据
                if (paginatedListRef.current && typeof paginatedListRef.current.refresh === 'function') {
                  paginatedListRef.current.refresh();
                }
              }}
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
              />
          )}
        </>
      </TooltipProvider>
  );
};

export default ApplicationsTab;