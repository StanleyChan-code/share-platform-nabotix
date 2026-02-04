import {Button} from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {ScrollArea} from "@/components/ui/scroll-area";
import {Badge} from "@/components/ui/badge";
import {getJournalPartitionName, getOutputTypeDisplayName, getOutputTypeIconComponent} from "@/lib/outputUtils";
import {downloadFile, formatDate, formatDateTime, formatFileSize, generateDownloadUrl} from "@/lib/utils";
import {ResearchOutput, outputApi} from "@/integrations/api/outputApi";
import {getCurrentUserFromSession} from "@/lib/authUtils";
import React, {useEffect, useState} from "react";
import {fileApi, FileInfo} from "@/integrations/api/fileApi";
import {
    Download,
    ExternalLink,
    User,
    Calendar,
    FileText,
    Award,
    Share,
    Eye,
    BookOpen,
    Database,
    ClipboardCheck,
    Hash
} from "lucide-react";
import {toast} from "@/hooks/use-toast.ts";
import {DatasetDetailModal} from "@/components/dataset/DatasetDetailModal.tsx";
import ApprovalActions from "@/components/ui/ApprovalActions.tsx";
import {api} from "@/integrations/api/client.ts";
import PDFPreview from '@/components/ui/pdf-preview.tsx'
import {CopyButton} from "@/components/ui/CopyButton.tsx";

interface OutputDetailDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    output: ResearchOutput | null;
    canApprove?: boolean; // 是否有审核权限
    onApprovalChange?: () => void; // 审核状态改变后的回调
    managementMode?: boolean; // 管理模式，控制是否显示审核相关功能和文件信息
    onOutputUpdate?: (updatedOutput: ResearchOutput) => void; // 新增：用于向上传递更新后的数据
}

const OutputDetailDialog = ({
                                open,
                                onOpenChange,
                                output,
                                canApprove = false,
                                onApprovalChange,
                                managementMode = false
                            }: OutputDetailDialogProps) => {
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [fileInfo, setFileInfo] = useState<FileInfo | null>(null);
    const [isDatasetModalOpen, setIsDatasetModalOpen] = useState(false);
    const [isPdfPreviewOpen, setIsPdfPreviewOpen] = useState(false);
    const [pdfPreviewUrl, setPdfPreviewUrl] = useState('');
    const [isPreviewLoading, setIsPreviewLoading] = useState(false);
    const [currentOutput, setCurrentOutput] = useState<ResearchOutput | null>(output); // 新增：内部状态管理

    // 当外部传入的 output 变化时，更新内部状态
    useEffect(() => {
        setCurrentOutput(output);
    }, [output]);

    const isSubmitter = currentUserId && currentOutput?.submitter && currentOutput.submitter.id === currentUserId;
    const canViewSensitiveInfo = isSubmitter || managementMode;

    useEffect(() => {
        const fetchCurrentUser = async () => {
            try {
                const currentUser = getCurrentUserFromSession();
                setCurrentUserId(currentUser ? currentUser.id : null);
            } catch (error) {
                console.error("Failed to fetch current user:", error);
            }
        };

        const fetchFileInfo = async () => {
            if (currentOutput?.fileId && canViewSensitiveInfo) {
                try {
                    const info = await fileApi.getFileInfo(currentOutput.fileId);
                    setFileInfo(info.data);
                } catch (error) {
                    console.error("Failed to fetch file info:", error);
                }
            } else {
                setFileInfo(null);
            }
        };

        if (open && currentOutput) {
            fetchCurrentUser();
            fetchFileInfo();
        }
    }, [open, currentOutput, canViewSensitiveInfo]);

    // 清理预览URL以避免内存泄漏
    useEffect(() => {
        return () => {
            if (pdfPreviewUrl) {
                URL.revokeObjectURL(pdfPreviewUrl);
            }
        };
    }, [pdfPreviewUrl]);

    if (!currentOutput) return null;

    const refreshOutput = async () => {
        if (!currentOutput?.id) return;
        try {
            // 根据管理模式选择不同的 API
            const response = await outputApi.getManagedOutputById(currentOutput.id);

            if (response.data) {
                const updatedOutput = response.data;
                setCurrentOutput(updatedOutput);

                toast({
                    title: "刷新成功",
                    description: "研究成果信息已更新"
                });
            }
        } catch (error) {
            console.error("Failed to refresh output:", error);
            toast({
                title: "刷新失败",
                description: "刷新该成果信息失败，请重试",
                variant: "destructive"
            });
        }
    }

    const handleDownloadFile = async () => {
        if (!currentOutput?.id || !currentOutput?.fileId) return;

        try {
            let response = null;
            if (isSubmitter) {
                response = await outputApi.getDownloadOutputFileToken(currentOutput.id, currentOutput.fileId);
            } else if (currentOutput.submitter.id !== currentUserId) {
                response = await outputApi.getDownloadManagedOutputFileToken(currentOutput.id, currentOutput.fileId);
            } else {
                return;
            }

            if (!response || !response.success) {
                toast({
                    title: "下载失败",
                    description: response.message || "无法下载文件，请稍后重试",
                    variant: "destructive"
                });
                return;
            }
            const filename = await downloadFile(response.data);
            
            toast({
                title: "开始下载",
                description: `文件 "${filename}" 已开始下载`
            });
        } catch (error) {
            console.error("Failed to download file:", error);
            toast({
                title: "下载失败",
                description: error.response?.data?.message || "文件下载失败，请重试",
                variant: "destructive"
            });
        }
    };

    // 处理预览PDF
    const handlePreviewPdf = async () => {
        if (!currentOutput?.id || !currentOutput?.fileId) {
            toast({
                title: "无法预览",
                description: "该成果没有关联的文件",
                variant: "destructive"
            });
            return;
        }

        try {
            setIsPreviewLoading(true);
            let response = null;
            if (isSubmitter) {
                response = await outputApi.getDownloadOutputFileToken(currentOutput.id, currentOutput.fileId);
            } else if (currentOutput.submitter.id !== currentUserId) {
                response = await outputApi.getDownloadManagedOutputFileToken(currentOutput.id, currentOutput.fileId);
            } else {
                return;
            }

            if (!response || !response.success) {
                toast({
                    title: "下载失败",
                    description: response.message || "无法下载文件，请稍后重试",
                    variant: "destructive"
                });
                return;
            }
            const downloadUrl = generateDownloadUrl(response.data);
            setPdfPreviewUrl(downloadUrl);
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

    const getTypeIcon = (type: string) => {
        const IconComponent = getOutputTypeIconComponent(type);
        return <IconComponent className="h-4 w-4"/>;
    };

    const getStatusBadge = (approved: boolean | null) => {
        if (approved === true) {
            return <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">已审核</Badge>;
        } else if (approved === false) {
            return <Badge variant="destructive">已拒绝</Badge>;
        } else {
            return <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-100">待审核</Badge>;
        }
    };

    // 处理审核操作
    const handleApproval = async (approved: boolean, comment: string) => {
        if (!currentOutput) return;

        try {
            const response = await api.put(`/manage/research-outputs/${currentOutput.id}/approval`, {
                approved,
                rejectionReason: approved ? null : (comment || null)
            });

            if (response.data.success) {
                toast({
                    title: "操作成功",
                    description: approved ? "研究成果已审核通过" : "研究成果已被拒绝"
                });

                // 刷新数据
                await refreshOutput();

                // 触发外部状态更新
                if (onApprovalChange) {
                    onApprovalChange();
                }
            }
        } catch (error: any) {
            console.error('Approval error:', error);
            toast({
                title: "操作失败",
                description: error.message || "审核操作失败，请重试",
                variant: "destructive"
            });
        }
    };

    // 信息卡片组件
    const InfoCard = ({title, value, icon: Icon, className = ""}: {
        title: string;
        value: string | React.ReactNode;
        icon?: any;
        className?: string
    }) => (
        <div className={`bg-muted/30 rounded-lg p-3 ${className}`}>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                {Icon && <Icon className="h-3.5 w-3.5"/>}
                <span>{title}</span>
            </div>
            <div className="text-sm font-medium break-all whitespace-pre-wrap">{value}</div>
        </div>
    );

    // 详情部分组件
    const DetailSection = ({title, children, icon}: { title: string; children: React.ReactNode; icon?: any }) => (
        <div className="space-y-3">
            <div className="flex items-center gap-2">
                {icon && React.createElement(icon, {className: "h-4 w-4"})}
                <h3 className="text-lg font-semibold">{title}</h3>
            </div>
            {children}
        </div>
    );

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent
                    className="max-w-4xl max-h-[90vh] flex flex-col">
                    <DialogHeader className="pb-4 border-b">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                {getTypeIcon(currentOutput.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <DialogTitle className="text-xl font-bold line-clamp-2 break-all whitespace-pre-wrap">
                                    {currentOutput.title}
                                </DialogTitle>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-sm text-muted-foreground">
                                        {getOutputTypeDisplayName(currentOutput.type)}
                                    </span>
                                    <span className="text-muted-foreground">•</span>
                                    {getStatusBadge(currentOutput.approved)}
                                </div>
                            </div>

                            {/* 审核操作 */}
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 mr-2">
                                <CopyButton
                                    text={`${window.location.origin}/outputs?id=${currentOutput.id}`}
                                    title="分享研究成果"
                                    description="点击下方文本框复制研究成果链接"
                                    variant="outline"
                                    size="sm"
                                    className="flex items-center mx-4 gap-2 hover:bg-green-50 hover:text-green-600 border-green-200"
                                >
                                    <Share className="h-4 w-4"/>
                                    复制分享链接
                                </CopyButton>
                            </div>
                        </div>
                    </DialogHeader>

                    {managementMode && canApprove && currentOutput.approved !== false && (
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                            <ClipboardCheck className={"h-5 w-5"}/>
                            <p className="text-lg font-semibold">审核操作</p>
                            {currentOutput.approved === null ? (
                                // 待审核状态：显示通过和拒绝按钮
                                <ApprovalActions
                                    size={"sm"}
                                    showCommentDialog={true}
                                    requireCommentOnApprove={false}
                                    requireCommentOnReject={true}
                                    approveDialogTitle="审核通过确认"
                                    rejectDialogTitle="审核拒绝原因"
                                    onSuccess={handleApproval}
                                    approveButtonText="通过"
                                    rejectButtonText="拒绝"
                                />
                            ) : currentOutput.approved === true ? (
                                // 已通过状态：显示驳回通过按钮
                                <ApprovalActions
                                    showCommentDialog={true}
                                    requireCommentOnReject={true}
                                    approveDialogTitle="审核通过确认"
                                    rejectDialogTitle="驳回通过原因"
                                    onSuccess={(approved, comment) => handleApproval(approved, comment)}
                                    approveButtonText="通过"
                                    rejectButtonText="驳回通过"
                                    showRevokeApprovalButton={true}
                                />
                            ) : null}
                        </div>
                    )}
                    <div className="flex-1 overflow-hidden overflow-y-auto">
                        <ScrollArea className="h-full w-full pr-4">
                            <div className="space-y-6 py-2">
                                {/* 基本信息网格 */}
                                <DetailSection title="基本信息" icon={BookOpen}>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <InfoCard
                                            className={"col-span-1 md:col-span-2"}
                                            title={getOutputTypeDisplayName(currentOutput.type) + '名称'}
                                            value={currentOutput.title}
                                            icon={getOutputTypeIconComponent(currentOutput.type)}
                                        />
                                        {currentOutput.dataset && (
                                            <InfoCard
                                                className={"col-span-1 md:col-span-2"}
                                                title="关联数据集"
                                                icon={Database}
                                                value={
                                                    <a
                                                        href={`/datasets?id=${currentOutput.dataset.id}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-blue-600 hover:underline cursor-pointer flex items-center gap-1"
                                                    >
                                                        {currentOutput.dataset.titleCn}
                                                    </a>
                                                }
                                            />
                                        )}

                                        {currentOutput.outputNumber && (
                                            <InfoCard
                                                icon={Hash}
                                                title={
                                                    currentOutput.type === 'PROJECT' ? '项目编号/课题编号' :
                                                        currentOutput.type === 'PUBLICATION' ? '出版物编号' :
                                                            (currentOutput.type === 'INVENTION_PATENT' || currentOutput.type === 'UTILITY_PATENT') ? '专利识别号' :
                                                                currentOutput.type === 'SOFTWARE_COPYRIGHT' ? '登记号' : '编号'
                                                }
                                                value={currentOutput.outputNumber}
                                            />
                                        )}
                                        {currentOutput.submitter && (
                                            <InfoCard
                                                title="提交人"
                                                value={currentOutput.submitter.realName || currentOutput.submitter.phone}
                                                icon={User}
                                            />
                                        )}
                                        <InfoCard
                                            title="提交时间"
                                            value={formatDateTime(currentOutput.createdAt)}
                                            icon={Calendar}
                                        />

                                        {currentOutput.approvedAt && (
                                            <InfoCard
                                                title="审核时间"
                                                value={formatDateTime(currentOutput.approvedAt)}
                                                icon={Calendar}
                                            />
                                        )}


                                    </div>
                                </DetailSection>

                                {/* 摘要 */}
                                {currentOutput.abstractText && (
                                    <DetailSection title={currentOutput.type === 'OTHER_AWARD' ? '成果简介' : '摘要'}
                                                   icon={FileText}>
                                        <div className="bg-muted/30 rounded-lg p-4">
                                            <p className="text-sm leading-relaxed break-all whitespace-pre-wrap">
                                                {currentOutput.abstractText}
                                            </p>
                                        </div>
                                    </DetailSection>
                                )}

                                {/* 详细信息 */}
                                <DetailSection title="详细信息" icon={Award}>
                                    <div className="space-y-4">
                                        {currentOutput.otherInfo?.authors && (
                                            <InfoCard
                                                title={
                                                    currentOutput.type === 'PAPER' ? '作者' :
                                                        currentOutput.type === 'PUBLICATION' ? '作者' :
                                                            (currentOutput.type === 'PROJECT') ? '项目/课题成员' :
                                                                (currentOutput.type === 'INVENTION_PATENT' || currentOutput.type === 'UTILITY_PATENT') ? '发明人' :
                                                                    currentOutput.type === 'SOFTWARE_COPYRIGHT' ? '著作权人' : '相关人员'
                                                }
                                                value={currentOutput.otherInfo.authors}
                                                className="col-span-2"
                                            />
                                        )}

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {currentOutput.otherInfo?.journal && (
                                                <InfoCard title="发表期刊" value={currentOutput.otherInfo.journal}/>
                                            )}

                                            {currentOutput.otherInfo?.journalPartition && currentOutput.type === 'PAPER' && (
                                                <InfoCard title="期刊分区"
                                                          value={getJournalPartitionName(currentOutput.otherInfo.journalPartition)}/>
                                            )}

                                            {(currentOutput.type === 'INVENTION_PATENT' || currentOutput.type === 'UTILITY_PATENT') && currentOutput.otherInfo?.legalStatus && (
                                                <InfoCard title="法律状态" value={currentOutput.otherInfo.legalStatus}/>
                                            )}

                                            {(currentOutput.type === 'INVENTION_PATENT' || currentOutput.type === 'UTILITY_PATENT') && currentOutput.otherInfo?.patentCountry && (
                                                <InfoCard title="专利国别/地区"
                                                          value={currentOutput.otherInfo.patentCountry}/>
                                            )}

                                            {currentOutput.type === 'SOFTWARE_COPYRIGHT' && currentOutput.otherInfo?.softwareName && (
                                                <InfoCard title="软件名称(全称)"
                                                          value={currentOutput.otherInfo.softwareName}/>
                                            )}

                                            {currentOutput.type === 'SOFTWARE_COPYRIGHT' && currentOutput.otherInfo?.copyrightOwner && (
                                                <InfoCard title="著作权人"
                                                          value={currentOutput.otherInfo.copyrightOwner}/>
                                            )}

                                            {currentOutput.type === 'SOFTWARE_COPYRIGHT' && currentOutput.otherInfo?.registrationDate && (
                                                <InfoCard title="登记日期"
                                                          value={formatDate(currentOutput.otherInfo.registrationDate)}/>
                                            )}

                                            {currentOutput.type === 'OTHER_AWARD' && currentOutput.otherInfo?.awardRecipient && (
                                                <InfoCard title="获奖人/单位"
                                                          value={currentOutput.otherInfo.awardRecipient}/>
                                            )}

                                            {currentOutput.type === 'OTHER_AWARD' && currentOutput.otherInfo?.awardIssuingAuthority && (
                                                <InfoCard title="颁发单位"
                                                          value={currentOutput.otherInfo.awardIssuingAuthority}/>
                                            )}

                                            {currentOutput.type === 'OTHER_AWARD' && currentOutput.otherInfo?.awardTime && (
                                                <InfoCard title="获奖时间"
                                                          value={formatDate(currentOutput.otherInfo.awardTime)}/>
                                            )}

                                            {currentOutput.type === 'OTHER_AWARD' && currentOutput.otherInfo?.competitionLevel && (
                                                <InfoCard
                                                    title="赛事层次"
                                                    value={
                                                        {
                                                            'unit': '单位内部',
                                                            'district': '县区级',
                                                            'city': '市级',
                                                            'province': '省级',
                                                            'national': '国家级',
                                                            'international': '国际级'
                                                        }[currentOutput.otherInfo.competitionLevel] || currentOutput.otherInfo.competitionLevel
                                                    }
                                                />
                                            )}
                                        </div>

                                        {currentOutput.publicationUrl && (
                                            <InfoCard
                                                title={currentOutput.type === 'PAPER' ? 'DOI链接' : 'URL链接'}
                                                value={
                                                    <a
                                                        href={currentOutput.publicationUrl.startsWith('http') ? currentOutput.publicationUrl : `https://${currentOutput.publicationUrl}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-blue-600 hover:underline whitespace-pre-wrap break-all flex items-center gap-1"
                                                    >
                                                        {currentOutput.publicationUrl}
                                                        <ExternalLink className="h-3 w-3"/>
                                                    </a>
                                                }
                                                className="col-span-2"
                                            />
                                        )}

                                        {/* 其他信息 */}
                                        {currentOutput.otherInfo && Object.keys(currentOutput.otherInfo).map((key) => {
                                            const processedFields = [
                                                'authors', 'journal', 'legalStatus', 'patentCountry',
                                                'softwareName', 'copyrightOwner', 'registrationDate',
                                                'awardRecipient', 'awardIssuingAuthority', 'awardTime', 'competitionLevel',
                                                'journalPartition'
                                            ];

                                            if (processedFields.includes(key)) return null;

                                            return (
                                                <InfoCard
                                                    key={key}
                                                    title={key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                                                    value={String(currentOutput.otherInfo[key])}
                                                />
                                            );
                                        })}
                                    </div>
                                </DetailSection>

                                {/* 文件信息 */}
                                {canViewSensitiveInfo && fileInfo && (
                                    <DetailSection title="说明文件" icon={FileText}>
                                        <div className="bg-muted/30 rounded-lg p-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <FileText className="h-4 w-4 text-muted-foreground"/>
                                                        <span className="text-sm font-medium truncate">
                                                            {fileInfo.fileName}
                                                        </span>
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {formatFileSize(fileInfo.fileSize)}
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    {fileInfo.fileName?.toLowerCase().endsWith('.pdf') && (
                                                        <Button
                                                            onClick={handlePreviewPdf}
                                                            variant="outline"
                                                            size="sm"
                                                            disabled={isPreviewLoading}
                                                        >
                                                            <Eye className="h-4 w-4 mr-2"/>
                                                            {isPreviewLoading ? '加载中' : '预览'}
                                                        </Button>
                                                    )}
                                                    <Button
                                                        onClick={handleDownloadFile}
                                                        variant="outline"
                                                        size="sm"
                                                    >
                                                        <Download className="h-4 w-4 mr-2"/>
                                                        下载
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </DetailSection>
                                )}

                                {/* 审核信息 */}
                                {managementMode && canViewSensitiveInfo && currentOutput.approved !== null && (
                                    <DetailSection title="审核信息" icon={Award}>
                                        <div className="space-y-3">
                                            <InfoCard
                                                title="审核状态"
                                                value={getStatusBadge(currentOutput.approved)}
                                            />

                                            {currentOutput.approved === false && currentOutput.rejectionReason && (
                                                <InfoCard
                                                    title="拒绝原因"
                                                    value={<span
                                                        className="text-destructive">{currentOutput.rejectionReason || "无"}</span>}
                                                    className="col-span-2"
                                                />
                                            )}

                                            {currentOutput.approved === true && currentOutput.approver && (
                                                <InfoCard
                                                    title="审核人"
                                                    value={currentOutput.approver.realName || currentOutput.approver.phone}
                                                />
                                            )}
                                        </div>
                                    </DetailSection>
                                )}
                            </div>
                        </ScrollArea>
                    </div>
                </DialogContent>
            </Dialog>

            {/* 数据集详情对话框 */}
            {currentOutput?.dataset && (
                <DatasetDetailModal
                    dataset={currentOutput.dataset}
                    open={isDatasetModalOpen}
                    onOpenChange={setIsDatasetModalOpen}
                />
            )}

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

export default OutputDetailDialog;