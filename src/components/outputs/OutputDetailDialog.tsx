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
import {formatDate, formatDateTime, formatFileSize} from "@/lib/utils";
import {ResearchOutput, outputApi} from "@/integrations/api/outputApi";
import {getCurrentUserFromSession} from "@/lib/authUtils";
import React, {useEffect, useState} from "react";
import {fileApi, FileInfo} from "@/integrations/api/fileApi";
import {Download, ExternalLink, User, Calendar, FileText, Award, BookOpen} from "lucide-react";
import {toast} from "@/hooks/use-toast.ts";
import {DatasetDetailModal} from "@/components/dataset/DatasetDetailModal.tsx";
import ApprovalActions from "@/components/ui/ApprovalActions.tsx";
import {api} from "@/integrations/api/client.ts";

interface OutputDetailDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    output: ResearchOutput | null;
    canApprove?: boolean; // 是否有审核权限
    onApprovalChange?: () => void; // 审核状态改变后的回调
    managementMode?: boolean; // 管理模式，控制是否显示审核相关功能和文件信息
}

const OutputDetailDialog = ({open, onOpenChange, output, canApprove = false, onApprovalChange, managementMode = false}: OutputDetailDialogProps) => {
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [fileInfo, setFileInfo] = useState<FileInfo | null>(null);
    const [isDatasetModalOpen, setIsDatasetModalOpen] = useState(false);
    const isSubmitter = currentUserId && output.submitter && output.submitter.id === currentUserId;
    const canViewSensitiveInfo = isSubmitter || managementMode;

    useEffect(() => {
        const fetchCurrentUser = async () => {
            try {
                const currentUser = getCurrentUserFromSession();
                setCurrentUserId(currentUser ? currentUser.id : null);
                // 获取用户角色逻辑...
            } catch (error) {
                console.error("Failed to fetch current user:", error);
            }
        };

        const fetchFileInfo = async () => {
            if (output?.fileId && canViewSensitiveInfo) {
                try {
                    const info = await fileApi.getFileInfo(output.fileId);
                    setFileInfo(info.data);
                } catch (error) {
                    console.error("Failed to fetch file info:", error);
                }
            }
        };

        if (open && output) {
            fetchCurrentUser();
            fetchFileInfo();
        }
    }, [open, output, currentUserId]);

    if (!output) return null;


    const handleDownloadFile = async () => {
        if (!output?.id || !output?.fileId) return;

        try {
            let response;
            if (isSubmitter) {
                response = await outputApi.downloadOutputFile(output.id, output.fileId);
            } else if (output.submitter.id !== currentUserId) {
                response = await outputApi.downloadManagedOutputFile(output.id, output.fileId);
            } else {
                return;
            }

            const url = window.URL.createObjectURL(new Blob([response]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', fileInfo?.fileName || 'file');
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            toast({
                title: "开始下载",
                description: `文件 "${fileInfo?.fileName}" 已开始下载`
            });
        } catch (error) {
            console.error("Failed to download file:", error);
            toast({
                title: "下载失败",
                description: "文件下载失败，请重试",
                variant: "destructive"
            });
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
        if (!output) return;
        
        try {
            const response = await api.put(`/manage/research-outputs/${output.id}/approval`, {
                approved,
                rejectionReason: approved ? null : (comment || null)
            });

            if (response.data.success) {
                toast({
                    title: "操作成功",
                    description: approved ? "研究成果已审核通过" : "研究成果已被拒绝"
                });

                // 触发外部状态更新
                if (onApprovalChange) {
                    onApprovalChange();
                }
                
                // 关闭对话框
                onOpenChange(false);
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
            <div className="text-sm font-medium">{value}</div>
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
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] md:max-w-[700px] lg:max-w-[900px] max-h-[90vh] flex flex-col">
                <DialogHeader className="pb-4 border-b">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            {getTypeIcon(output.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                            <DialogTitle className="text-xl font-bold line-clamp-2">
                                {output.title}
                            </DialogTitle>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-sm text-muted-foreground">
                                    {getOutputTypeDisplayName(output.type)}
                                </span>
                                <span className="text-muted-foreground">•</span>
                                {getStatusBadge(output.approved)}
                            </div>
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-hidden overflow-y-auto">
                    <ScrollArea className="h-full w-full pr-4">
                        <div className="space-y-6 py-4">
                            {/* 基本信息网格 */}
                            <DetailSection title="基本信息" icon={BookOpen}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <InfoCard
                                        title="提交时间"
                                        value={formatDateTime(output.createdAt)}
                                        icon={Calendar}
                                    />

                                    {output.approvedAt && (
                                        <InfoCard
                                            title="审核时间"
                                            value={formatDateTime(output.approvedAt)}
                                            icon={Calendar}
                                        />
                                    )}

                                    {output.submitter && (
                                        <InfoCard
                                            title="提交人"
                                            value={output.submitter.realName || output.submitter.username}
                                            icon={User}
                                        />
                                    )}

                                    {output.outputNumber && (
                                        <InfoCard
                                            title={
                                                output.type === 'project' ? '项目编号' :
                                                    output.type === 'publication' ? '出版物编号' :
                                                        (output.type === 'invention_patent' || output.type === 'utility_patent') ? '专利号' :
                                                            output.type === 'software_copyright' ? '登记号' : '编号'
                                            }
                                            value={output.outputNumber}
                                        />
                                    )}

                                    {output.dataset && (
                                        <InfoCard
                                            title="关联数据集"
                                            value={
                                                <span
                                                    className="text-blue-600 hover:underline cursor-pointer flex items-center gap-1"
                                                    onClick={() => setIsDatasetModalOpen(true)}
                                                >
                                                {output.dataset.titleCn}
                                                    <ExternalLink className="h-3 w-3"/>
                                            </span>
                                            }
                                        />
                                    )}
                                </div>
                            </DetailSection>

                            {/* 摘要 */}
                            {output.abstractText && (
                                <DetailSection title={output.type === 'other_award' ? '简介' : '摘要'} icon={FileText}>
                                    <div className="bg-muted/30 rounded-lg p-4">
                                        <p className="text-sm leading-relaxed whitespace-pre-wrap">
                                            {output.abstractText}
                                        </p>
                                    </div>
                                </DetailSection>
                            )}

                            {/* 详细信息 */}
                            <DetailSection title="详细信息" icon={Award}>
                                <div className="space-y-4">
                                    {output.otherInfo?.authors && (
                                        <InfoCard
                                            title={
                                                output.type === 'PAPER' ? '作者' :
                                                    output.type === 'PUBLICATION' ? '作者' :
                                                        (output.type === 'INVENTION_PATENT' || output.type === 'UTILITY_PATENT' || output.type === 'PROJECT') ? '成员' :
                                                            output.type === 'SOFTWARE_COPYRIGHT' ? '著作权人' : '相关人员'
                                            }
                                            value={output.otherInfo.authors}
                                            className="col-span-2"
                                        />
                                    )}

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {output.otherInfo?.journal && (
                                            <InfoCard title="发表期刊" value={output.otherInfo.journal}/>
                                        )}

                                        {output.otherInfo?.journalPartition && output.type === 'PAPER' && (
                                            <InfoCard title="期刊分区"
                                                      value={getJournalPartitionName(output.otherInfo.journalPartition)}/>
                                        )}

                                        {(output.type === 'INVENTION_PATENT' || output.type === 'UTILITY_PATENT') && output.otherInfo?.legalStatus && (
                                            <InfoCard title="法律状态" value={output.otherInfo.legalStatus}/>
                                        )}

                                        {(output.type === 'INVENTION_PATENT' || output.type === 'UTILITY_PATENT') && output.otherInfo?.patentCountry && (
                                            <InfoCard title="专利国别" value={output.otherInfo.patentCountry}/>
                                        )}

                                        {output.type === 'SOFTWARE_COPYRIGHT' && output.otherInfo?.softwareName && (
                                            <InfoCard title="软件名称" value={output.otherInfo.softwareName}/>
                                        )}

                                        {output.type === 'SOFTWARE_COPYRIGHT' && output.otherInfo?.copyrightOwner && (
                                            <InfoCard title="著作权人" value={output.otherInfo.copyrightOwner}/>
                                        )}

                                        {output.type === 'SOFTWARE_COPYRIGHT' && output.otherInfo?.registrationDate && (
                                            <InfoCard title="登记日期"
                                                      value={formatDate(output.otherInfo.registrationDate)}/>
                                        )}

                                        {output.type === 'other_award' && output.otherInfo?.awardRecipient && (
                                            <InfoCard title="获奖人/单位" value={output.otherInfo.awardRecipient}/>
                                        )}

                                        {output.type === 'other_award' && output.otherInfo?.awardIssuingAuthority && (
                                            <InfoCard title="颁发单位" value={output.otherInfo.awardIssuingAuthority}/>
                                        )}

                                        {output.type === 'other_award' && output.otherInfo?.awardTime && (
                                            <InfoCard title="获奖时间" value={formatDate(output.otherInfo.awardTime)}/>
                                        )}

                                        {output.type === 'other_award' && output.otherInfo?.competitionLevel && (
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
                                                    }[output.otherInfo.competitionLevel] || output.otherInfo.competitionLevel
                                                }
                                            />
                                        )}
                                    </div>

                                    {output.publicationUrl && (
                                        <InfoCard
                                            title={output.type === 'PAPER' ? 'DOI链接' : 'URL链接'}
                                            value={
                                                <a
                                                    href={output.publicationUrl.startsWith('http') ? output.publicationUrl : `https://${output.publicationUrl}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 hover:underline break-all flex items-center gap-1"
                                                >
                                                    {output.publicationUrl}
                                                    <ExternalLink className="h-3 w-3"/>
                                                </a>
                                            }
                                            className="col-span-2"
                                        />
                                    )}

                                    {/* 其他信息 */}
                                    {output.otherInfo && Object.keys(output.otherInfo).map((key) => {
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
                                                value={String(output.otherInfo[key])}
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
                                            <Button
                                                onClick={handleDownloadFile}
                                                variant="outline"
                                                size="sm"
                                                className="ml-4"
                                            >
                                                <Download className="h-4 w-4 mr-2"/>
                                                下载
                                            </Button>
                                        </div>
                                    </div>
                                </DetailSection>
                            )}

                            {/* 审核信息 */}
                            {canViewSensitiveInfo && output.approved !== null && (
                                <DetailSection title="审核信息" icon={Award}>
                                    <div className="space-y-3">
                                        <InfoCard
                                            title="审核状态"
                                            value={getStatusBadge(output.approved)}
                                        />

                                        {output.approved === false && output.rejectionReason && (
                                            <InfoCard
                                                title="拒绝原因"
                                                value={<span
                                                    className="text-destructive">{output.rejectionReason}</span>}
                                                className="col-span-2"
                                            />
                                        )}

                                        {output.approved === true && output.approver && (
                                            <InfoCard
                                                title="审核人"
                                                value={output.approver.realName || output.approver.username}
                                            />
                                        )}
                                    </div>
                                </DetailSection>
                            )}
                            
                            {/* 审核操作 */}
                            {managementMode && canApprove && output.approved !== false && (
                                <DetailSection title="审核操作" icon={Award}>
                                    <div className="space-y-4">
                                        {output.approved === null ? (
                                            // 待审核状态：显示通过和拒绝按钮
                                            <ApprovalActions
                                                showCommentDialog={true}
                                                requireCommentOnApprove={false}
                                                requireCommentOnReject={true}
                                                approveDialogTitle="审核通过确认"
                                                rejectDialogTitle="审核拒绝原因"
                                                onSuccess={handleApproval}
                                                approveButtonText="通过"
                                                rejectButtonText="拒绝"
                                            />
                                        ) : output.approved === true ? (
                                            // 已通过状态：显示驳回通过按钮
                                            <ApprovalActions
                                                showCommentDialog={true}
                                                requireCommentOnApprove={false}
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
                                </DetailSection>
                            )}
                        </div>
                    </ScrollArea>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t mt-4">
                    <Button
                        onClick={() => onOpenChange(false)}
                        variant="outline"
                    >
                        关闭
                    </Button>
                </div>
            </DialogContent>

            {/* 数据集详情对话框 */}
            {output?.dataset && (
                <DatasetDetailModal
                    dataset={output.dataset}
                    open={isDatasetModalOpen}
                    onOpenChange={setIsDatasetModalOpen}
                />
            )}
        </Dialog>
    );
};

export default OutputDetailDialog;