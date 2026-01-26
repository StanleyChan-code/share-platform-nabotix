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
  HelpCircle,
} from "lucide-react";
import {Button} from "@/components/ui/button";
import {TooltipProvider} from "@/components/ui/tooltip";
import ApplyDialog from '@/components/application/ApplyDialog';
import {DatasetDetailModal} from '@/components/dataset/DatasetDetailModal';
import ApplicationDetailDialog from '../admin/ApplicationDetailDialog';
import ApplicationItem from "@/components/admin/ApplicationItem.tsx";
import { QADialog, QAItem, QATip } from '@/components/ui/QADialog';
const ApplicationsTab = () => {
  const [isApplyDialogOpen, setIsApplyDialogOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedDataset, setSelectedDataset] = useState<any>(null);
  const [isDatasetModalOpen, setIsDatasetModalOpen] = useState(false);
  const [isQADialogOpen, setIsQADialogOpen] = useState(false);
  const [defaultDatasetTab, setDefaultDatasetTab] = useState<string>('overview'); // 控制数据集对话框默认标签页
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

  const handleViewDataset = (application: Application, defaultTab: string = 'overview') => {
    // 创建一个模拟的数据集对象，包含必要的字段
    const dataset = {
      id: application.dataset.id,
      titleCn: application.dataset.titleCn,
      // 可以根据需要添加其他字段
    };
    setDefaultDatasetTab(defaultTab);
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
              <div className="flex items-center gap-3">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5"/>
                  {getCardTitle()}
                </CardTitle>

                {/* Q&A Dialog for Application Review Process */}
                <QADialog
                    isOpen={isQADialogOpen}
                    onOpenChange={setIsQADialogOpen}
                    title="申请审核流程说明"
                    content={
                      <div className="space-y-6">
                        <QAItem
                            number={1}
                            title="提交申请"
                            description="您提交数据集申请后，系统会自动生成申请记录并进入审核流程。请确保填写的申请信息完整准确。"
                        />

                        <QAItem
                            number={2}
                            title="数据集提供者审核"
                            description="数据集提供者会收到申请通知，他们会审核您的申请用途、项目信息等内容，决定是否通过您的申请。"
                        />

                        <QAItem
                            number={3}
                            title="机构审核"
                            description="如果数据集提供者通过审核，申请会进入机构审核阶段。机构管理员会再次审核申请，确保符合机构规定和数据使用政策。"
                        />

                        <QAItem
                            number={4}
                            title="审核结果"
                            description="审核完成后，您会收到系统通知。如果申请通过，您将获得相应的数据集访问权限；如果被拒绝，您会收到详细的拒绝原因。"
                        />

                        <QATip
                            type="warning"
                            title="注意"
                            content="审核通过仅允许您下载数据集提供者分享的数据集文件，不一定等同于完整的数据集资源。"
                        />

                        <QATip
                            type="warning"
                            title="重要提示"
                            content="即使申请已经通过，数据集提供者或数据集所属机构仍有权限根据实际情况驳回通过状态。"
                        />

                        <QAItem
                            number={5}
                            title="申请状态查询"
                            description='您可以在"我的申请记录"页面中随时查看所有申请的当前状态和详细审核进度。'
                        />

                        <QATip
                            type="info"
                            title="提示"
                            content="在申请记录列表中，每条记录旁边的用户按钮点击后可以查看相关审核人员的详细信息。"
                        />
                      </div>
                    }
                />

              </div>
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
                  defaultTab={defaultDatasetTab}
              />
          )}
        </>
      </TooltipProvider>
  );
};

export default ApplicationsTab;