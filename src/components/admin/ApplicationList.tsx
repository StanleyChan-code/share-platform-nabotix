import React, {useState, useCallback, useRef} from 'react';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import PaginatedList from '@/components/ui/PaginatedList';
import {
    Application,
    getMyApplications,
    getProviderApplications,
    deleteApplication
} from '@/integrations/api/applicationApi';
import {formatDateTime} from '@/lib/utils';
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
import {Button} from "@/components/ui/button";
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from "@/components/ui/tooltip";
import ApplyDialog from '@/components/application/ApplyDialog';
import ApplicationDetailDialog from './ApplicationDetailDialog';
import ApplicationItem from './ApplicationItem';
import {useToast} from '@/components/ui/use-toast';
import {DatasetDetailModal} from '@/components/dataset/DatasetDetailModal';

interface ApplicationListProps {
    title?: string;
}

const ApplicationList: React.FC<ApplicationListProps> = ({
                                                             title = '我的申请记录'
                                                         }) => {
    const [isApplyDialogOpen, setIsApplyDialogOpen] = useState(false);
    const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
    const [viewDialogOpen, setViewDialogOpen] = useState(false);
    const [selectedDataset, setSelectedDataset] = useState<any>(null);
    const [isDatasetModalOpen, setIsDatasetModalOpen] = useState(false);
    const {toast} = useToast();
    const paginatedListRef = useRef<any>(null);

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
                // 触发 PaginatedList 组件刷新数据
                if (paginatedListRef.current) {
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
                        <PaginatedList
                            ref={paginatedListRef}
                            fetchData={fetchApplications}
                            renderItem={renderApplicationItem}
                            renderEmptyState={renderEmptyState}
                            pageSize={10}
                        />
                    </CardContent>
                </Card>

                <ApplyDialog open={isApplyDialogOpen} onOpenChange={setIsApplyDialogOpen}/>
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

export default ApplicationList;