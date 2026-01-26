
import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast.ts';
import {
    Clock,
    User,
    Building,
    CheckCircle,
    XCircle,
    Plus,
    FileText,
    Download,
    Eye,
    AlertCircle
} from 'lucide-react';
import { formatDateTime, formatFileSize } from '@/lib/utils.ts';
import { fileApi, FileInfo } from '@/integrations/api/fileApi.ts';
import {Application, downloadApplicationFile, getApplicationRelatedUsers} from '@/integrations/api/applicationApi.ts';
import PDFPreview from '@/components/ui/pdf-preview.tsx'
import DatasetInfoDisplay from "@/components/dataset/DatasetInfoDisplay.tsx";

interface ApplicationDetailDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    application: Application | null;
}

const ApplicationDetailDialog: React.FC<ApplicationDetailDialogProps> = ({
                                                                             open,
                                                                             onOpenChange,
                                                                             application
                                                                         }) => {
    const [fileInfo, setFileInfo] = useState<FileInfo | null>(null);
    const [isPdfPreviewOpen, setIsPdfPreviewOpen] = useState(false);
    const [pdfPreviewUrl, setPdfPreviewUrl] = useState('');
    const [isPreviewLoading, setIsPreviewLoading] = useState(false);
    const {toast} = useToast();

    // 当对话框打开且选中有审批文档的应用时，获取文件信息
    useEffect(() => {
        const fetchFileInfo = async () => {
            if (open && application?.approvalDocumentId) {
                try {
                    const info = await fileApi.getFileInfo(application.approvalDocumentId);
                    setFileInfo(info.data);
                } catch (error) {
                    console.error("Failed to fetch file info:", error);
                    setFileInfo(null);
                }
            } else {
                setFileInfo(null);
            }
        };

        fetchFileInfo();
    }, [open, application]);

    // 清理预览URL以避免内存泄漏
    useEffect(() => {
        return () => {
            if (pdfPreviewUrl) {
                URL.revokeObjectURL(pdfPreviewUrl);
            }
        };
    }, [pdfPreviewUrl]);

    if (!application) return null;

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
                return <Clock className="h-3 w-3 mr-1"/>;
            case 'PENDING_PROVIDER_REVIEW':
            case 'PENDING_INSTITUTION_REVIEW':
                return <AlertCircle className="h-3 w-3 mr-1"/>;
            case 'APPROVED':
                return <CheckCircle className="h-3 w-3 mr-1"/>;
            case 'DENIED':
                return <XCircle className="h-3 w-3 mr-1"/>;
            default:
                return <Clock className="h-3 w-3 mr-1"/>;
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

    const getTimelineItems = (application: Application) => {
        const items = [{
            status: '提交申请',
            date: application.submittedAt,
            completed: true,
            icon: <Plus className="h-4 w-4"/>,
            notes: null,
            reviewer: null
        }];

        // 提供者审核
        if (application.providerReviewedAt) {
            // 根据最终状态判断提供者审核结果
            const isProviderApproved = application.providerReviewResult === true;
            items.push({
                status: isProviderApproved ? '提供者审核通过' : '提供者审核拒绝',
                date: application.providerReviewedAt,
                completed: true,
                icon: <User className="h-4 w-4"/>,
                notes: application.providerNotes,
                reviewer: null
            });
        } else if (['PENDING_PROVIDER_REVIEW', 'PENDING_INSTITUTION_REVIEW', 'APPROVED', 'DENIED'].includes(application.status)) {
            items.push({
                status: '待提供者审核',
                date: null,
                completed: false,
                icon: <User className="h-4 w-4"/>,
                notes: null,
                reviewer: null
            });
        }

        // 机构审核
        if (application.institutionReviewedAt) {
            // 根据最终状态判断机构审核结果
            const isFinalApproved = application.institutionReviewResult === true;
            items.push({
                status: isFinalApproved ? '机构审核通过' : '机构审核拒绝',
                date: application.institutionReviewedAt,
                completed: true,
                icon: <Building className="h-4 w-4"/>,
                notes: application.adminNotes,
                reviewer: null
            });
        } else if (['PENDING_INSTITUTION_REVIEW', 'APPROVED', 'DENIED'].includes(application.status)) {
            items.push({
                status: '待机构审核',
                date: null,
                completed: false,
                icon: <Building className="h-4 w-4"/>,
                notes: null,
                reviewer: null
            });
        }

        // 最终状态
        if (application.status === 'APPROVED' || application.status === 'DENIED') {
            const isApproved = application.status === 'APPROVED';
            items.push({
                status: isApproved ? '审批完成' : '审批结束',
                date: application.approvedAt || application.institutionReviewedAt,
                completed: true,
                icon: isApproved ? <CheckCircle className="h-4 w-4"/> : <XCircle className="h-4 w-4"/>,
                notes: null,
                reviewer: null
            });
        }

        return items;
    };

    const handleDownloadApproval = async () => {
        if (!application.approvalDocumentId) {
            toast({
                title: "无法下载",
                description: "该申请没有关联的审批文件",
                variant: "destructive"
            });
            return;
        }

        try {
            // 下载文件
            const response = await downloadApplicationFile(application.id, application.approvalDocumentId);

            // 创建下载链接
            const url = window.URL.createObjectURL(new Blob([response]));
            const link = document.createElement('a');
            link.href = url;
            link.download = fileInfo?.fileName || `approval-document-${application.id}`;

            // 触发下载
            document.body.appendChild(link);
            link.click();

            // 清理
            setTimeout(() => {
                window.URL.revokeObjectURL(url);
                document.body.removeChild(link);
            }, 100);

            toast({
                title: "开始下载",
                description: `文件 "${fileInfo?.fileName}" 已开始下载`
            });
        } catch (error) {
            console.error('下载失败:', error);
            toast({
                title: "下载失败",
                description: "无法下载文件，请稍后重试",
                variant: "destructive"
            });
        }
    };

    // 处理预览PDF
    const handlePreviewPdf = async () => {
        if (!application.approvalDocumentId) {
            toast({
                title: "无法预览",
                description: "该申请没有关联的审批文件",
                variant: "destructive"
            });
            return;
        }

        try {
            setIsPreviewLoading(true);
            // 获取文件下载响应
            const response:any = await downloadApplicationFile(application.id, application.approvalDocumentId);
            // 创建PDF预览URL
            const fileUrl = URL.createObjectURL(new Blob([response], { type: 'application/pdf' }));
            setPdfPreviewUrl(fileUrl);
            setIsPdfPreviewOpen(true);
        } catch (error) {
            console.error('预览失败:', error);
            toast({
                title: "预览失败",
                description: "无法预览文件，请尝试下载后查看",
                variant: "destructive"
            });
        } finally {
            setIsPreviewLoading(false);
        }
    };

    const timelineItems = getTimelineItems(application);

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5"/>
                            <span>申请详情 - {application.projectTitle}</span>
                        </DialogTitle>
                    </DialogHeader>

                    <div className="flex-1 overflow-hidden overflow-y-auto">
                        <ScrollArea className="h-full w-full pr-4">
                            {/* 数据集名称单独一行显示 */}
                            <div className={"mb-4"}>
                                <DatasetInfoDisplay dataset={application.dataset} title={"相关数据集信息"} />
                            </div>

                            <Tabs defaultValue="basic" className="w-full">
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="basic">基本信息</TabsTrigger>
                                    <TabsTrigger value="timeline">审核进度</TabsTrigger>
                                </TabsList>

                                <TabsContent value="basic" className="space-y-4 mt-4">
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-sm font-medium text-muted-foreground">项目名称</label>
                                                <p className="mt-1">{application.projectTitle}</p>
                                            </div>
                                        </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-sm font-medium text-muted-foreground">申请人</label>
                                                    <p className="mt-1">{application.applicantName}</p>
                                                </div>
                                                <div>
                                                    <label className="text-sm font-medium text-muted-foreground">项目负责人</label>
                                                    <p className="mt-1">{application.projectLeader}</p>
                                                </div>
                                            </div>

                                        <div className="grid grid-cols-1 gap-4">
                                            <div>
                                                <label className="text-sm font-medium text-muted-foreground">资金来源</label>
                                                <p className="mt-1">{application.fundingSource}</p>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-sm font-medium text-muted-foreground">项目描述</label>
                                            <p className="mt-1 p-3 bg-muted rounded text-sm break-words whitespace-pre-line">{application.projectDescription}</p>
                                        </div>

                                        <div>
                                            <label className="text-sm font-medium text-muted-foreground">申请用途:</label>
                                            <p className="mt-1 p-3 bg-muted rounded text-sm break-words whitespace-pre-line">{application.purpose}</p>
                                        </div>

                                        <div>
                                            <label className="text-sm font-medium text-muted-foreground">申请时间</label>
                                            <p className="mt-1">{formatDate(application.submittedAt)}</p>
                                        </div>

                                        {/* 审批文件信息显示区域 */}
                                        {fileInfo && (
                                            <div className="border-t pt-4">
                                                <h3 className="text-lg font-semibold mb-3">审批表文件</h3>
                                                <div className="bg-muted rounded-lg p-4">
                                                    <div className="grid grid-cols-3 gap-3 text-sm">
                                                        <div className="col-span-2">
                                                            <label className="text-muted-foreground">文件名:</label>
                                                            <p className="font-medium break-all">
                                                                {fileInfo.fileName}（{formatFileSize(fileInfo.fileSize)}）
                                                            </p>
                                                        </div>
                                                        <div className="flex items-end gap-2">
                                                            {fileInfo.fileName?.toLowerCase().endsWith('.pdf') && (
                                                                <Button
                                                                    onClick={handlePreviewPdf}
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="w-full"
                                                                    disabled={isPreviewLoading}
                                                                >
                                                                    <Eye className="h-4 w-4 mr-2"/>
                                                                    {isPreviewLoading ? '加载中' : '预览'}
                                                                </Button>
                                                            )}
                                                            <Button
                                                                onClick={handleDownloadApproval}
                                                                variant="outline"
                                                                size="sm"
                                                                className="w-full"
                                                            >
                                                                <Download className="h-4 w-4 mr-2"/>
                                                                下载
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </TabsContent>

                                <TabsContent value="timeline" className="space-y-6 mt-4">
                                    <div className="relative">
                                        {timelineItems.map((item, index) => (
                                            <div key={index} className="relative flex gap-4 pb-6 last:pb-0">
                                                {/* 连接线 */}
                                                {index < timelineItems.length - 1 && (
                                                    <div className="absolute left-4 top-8 w-0.5 h-6 bg-border"/>
                                                )}

                                                {/* 图标 */}
                                                <div
                                                    className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center relative z-10 ${
                                                        item.completed ? 'bg-primary text-primary-foreground' : 'bg-muted'
                                                    }`}>
                                                    {item.icon}
                                                </div>

                                                {/* 内容 */}
                                                <div className="flex-1">
                                                    <div className="font-medium flex items-center gap-2">
                                                        {item.status}
                                                        {item.reviewer && (
                                                            <span className="text-sm text-muted-foreground font-normal">
                                                                ({item.reviewer})
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-sm text-muted-foreground mt-1">
                                                        {item.date ? formatDate(item.date) : '待处理'}
                                                    </div>
                                                    {item.notes && (
                                                        <div className="mt-2 p-2 bg-muted rounded text-sm">
                                                            {item.notes}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </TabsContent>
                            </Tabs>

                            <div className="flex justify-end gap-2 pt-4 border-t mt-4">
                                <Button variant="outline" onClick={() => onOpenChange(false)}>
                                    关闭
                                </Button>
                            </div>
                        </ScrollArea>
                    </div>
                </DialogContent>
            </Dialog>

            {/* PDF预览对话框 */}
            <PDFPreview
                open={isPdfPreviewOpen}
                onOpenChange={setIsPdfPreviewOpen}
                fileUrl={pdfPreviewUrl}
                fileName={fileInfo?.fileName}
            />
        </>
    );
};

export default ApplicationDetailDialog;