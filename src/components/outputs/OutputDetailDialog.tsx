import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { getOutputTypeDisplayName, getOutputTypeIconComponent } from "@/lib/outputUtils";
import { formatDate, formatDateTime, formatFileSize } from "@/lib/utils";
import { ResearchOutput, outputApi } from "@/integrations/api/outputApi";
import { getCurrentUser, getCurrentUserRoles } from "@/lib/authUtils";
import React, { useEffect, useState } from "react";
import { fileApi, FileInfo } from "@/integrations/api/fileApi";
import {Download} from "lucide-react";
import {toast} from "@/hooks/use-toast.ts";

interface OutputDetailDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    output: ResearchOutput | null;
}

const OutputDetailDialog = ({ open, onOpenChange, output }: OutputDetailDialogProps) => {
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [isAdmin, setIsAdmin] = useState<boolean>(false);
    const [fileInfo, setFileInfo] = useState<FileInfo | null>(null); // 添加文件信息状态

    useEffect(() => {
        const fetchCurrentUser = async () => {
            try {
                const currentUser = getCurrentUser();
                setCurrentUserId(currentUser.id);

                // 获取用户角色以确定是否为管理员
                // const rolesResponse = await getCurrentUserRoles();
                // const roles = rolesResponse.data.data.roles || [];
                // setIsAdmin(roles.includes('ADMIN'));
            } catch (error) {
                console.error("Failed to fetch current user:", error);
            }
        };

        // 获取文件信息
        const fetchFileInfo = async () => {
            if (output?.fileId && (currentUserId && output.submitter && output.submitter.id === currentUserId || isAdmin)) {
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
            fetchFileInfo(); // 获取文件信息
        }
    }, [open, output, currentUserId, isAdmin]);

    if (!output) return null;

    // 检查当前用户是否是提交者或管理员
    const isSubmitter = currentUserId && output.submitter && output.submitter.id === currentUserId;
    const canViewSensitiveInfo = isSubmitter || isAdmin;

    // 添加下载文件函数
    const handleDownloadFile = async () => {
        if (!output?.id || !output?.fileId) return;

        try {
            let response;
            if (isSubmitter) {
                // 如果是提交者，使用用户下载接口
                response = await outputApi.downloadOutputFile(output.id, output.fileId);
            } else if (isAdmin) {
                // 如果是管理员，使用管理下载接口
                response = await outputApi.downloadManagedOutputFile(output.id, output.fileId);
            } else {
                // 其他情况不应当能够下载
                return;
            }
            
            // 创建下载链接
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
                description: `文件 "${fileInfo.fileName}" 已开始下载`
            });
        } catch (error) {
            console.error("Failed to download file:", error);
        }
    };

    const getTypeIcon = (type: string) => {
        const IconComponent = getOutputTypeIconComponent(type);
        return <IconComponent className="h-4 w-4" />;
    };

    const getStatusBadge = (approved: boolean | null) => {
        if (approved === true) {
            return <Badge variant="default">已审核</Badge>;
        } else if (approved === false) {
            return <Badge variant="destructive">已拒绝</Badge>;
        } else {
            return <Badge variant="secondary">待审核</Badge>;
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px] md:max-w-[600px] lg:max-w-[800px] max-h-[85vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        {getTypeIcon(output.type)}
                        成果详情 - {getOutputTypeDisplayName(output.type)}
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-hidden overflow-y-auto">
                    <ScrollArea className="h-full w-full flex-1 pr-4">
                        <div className="space-y-6 py-2">
                            {/* 基本信息 */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between w-full">
                                    <h2 className="text-xl font-bold">{output.title}</h2>
                                    <span className="whitespace-nowrap">{getStatusBadge(output.approved)}</span>
                                </div>

                                <div className="space-y-4 text-sm">
                                    <div>
                                        <p className="font-medium text-muted-foreground">提交时间</p>
                                        <p>{formatDateTime(output.createdAt)}</p>
                                    </div>

                                    {output.approvedAt && (
                                        <div>
                                            <p className="font-medium text-muted-foreground">审核时间</p>
                                            <p>{formatDateTime(output.approvedAt)}</p>
                                        </div>
                                    )}

                                    {output.submitter && (
                                        <div>
                                            <p className="font-medium text-muted-foreground">提交人</p>
                                            <p>{output.submitter.realName || output.submitter.username}</p>
                                        </div>
                                    )}

                                    {output.dataset && (
                                        <div>
                                            <p className="font-medium text-muted-foreground">关联数据集</p>
                                            <p>{output.dataset.titleCn}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* 摘要 */}
                            {output.abstractText && (
                                <div className="space-y-2">
                                    <h3 className="text-lg font-semibold">
                                        {output.type === 'other_award' ? '简介' : '摘要'}
                                    </h3>
                                    <p className="whitespace-pre-wrap">{output.abstractText}</p>
                                </div>
                            )}


                            {/* 特定类型信息 */}
                            <div className="space-y-4 pt-4 border-t">
                                <h3 className="text-lg font-semibold">详细信息</h3>

                                <div className="space-y-4 text-sm">
                                    {output.outputNumber && (
                                        <div>
                                            <p className="font-medium text-muted-foreground">
                                                {output.type === 'project' ? '项目编号' :
                                                    output.type === 'publication' ? '出版物编号' :
                                                        (output.type === 'invention_patent' || output.type === 'utility_patent') ? '专利号' :
                                                            output.type === 'software_copyright' ? '登记号' : '编号'}
                                            </p>
                                            <p>{output.outputNumber}</p>
                                        </div>
                                    )}

                                    {output.otherInfo?.authors && (
                                        <div>
                                            <p className="font-medium text-muted-foreground">
                                                {output.type === 'PAPER' ? '作者' :
                                                    output.type === 'PUBLICATION' ? '作者' :
                                                        (output.type === 'INVENTION_PATENT' || output.type === 'UTILITY_PATENT' || output.type === 'PROJECT') ? '成员' :
                                                            output.type === 'SOFTWARE_COPYRIGHT' ? '著作权人' : '相关人员'}
                                            </p>
                                            <p>{output.otherInfo.authors}</p>
                                        </div>
                                    )}

                                    {output.otherInfo?.journal && (
                                        <div>
                                            <p className="font-medium text-muted-foreground">发表期刊</p>
                                            <p>{output.otherInfo.journal}</p>
                                        </div>
                                    )}

                                    {output.otherInfo?.journalPartition && output.type === 'PAPER' && (
                                        <div>
                                            <p className="font-medium text-muted-foreground">期刊分区</p>
                                            <p>{
                                                output.otherInfo.journalPartition === 'cas_1' ? '中科院 一区' :
                                                output.otherInfo.journalPartition === 'cas_2' ? '中科院 二区' :
                                                output.otherInfo.journalPartition === 'cas_3' ? '中科院 三区' :
                                                output.otherInfo.journalPartition === 'cas_4' ? '中科院 四区' :
                                                output.otherInfo.journalPartition === 'jcr_q1' ? 'JCR Q1' :
                                                output.otherInfo.journalPartition === 'jcr_q2' ? 'JCR Q2' :
                                                output.otherInfo.journalPartition === 'jcr_q3' ? 'JCR Q3' :
                                                output.otherInfo.journalPartition === 'jcr_q4' ? 'JCR Q4' :
                                                output.otherInfo.journalPartition === 'other' ? '其他' :
                                                '-'
                                            }</p>
                                        </div>
                                    )}

                                    {(output.type === 'INVENTION_PATENT' || output.type === 'UTILITY_PATENT') && output.otherInfo?.legalStatus && (
                                        <div>
                                            <p className="font-medium text-muted-foreground">法律状态</p>
                                            <p>{output.otherInfo.legalStatus}</p>
                                        </div>
                                    )}

                                    {(output.type === 'INVENTION_PATENT' || output.type === 'UTILITY_PATENT') && output.otherInfo?.patentCountry && (
                                        <div>
                                            <p className="font-medium text-muted-foreground">专利国别</p>
                                            <p>{output.otherInfo.patentCountry}</p>
                                        </div>
                                    )}

                                    {output.type === 'SOFTWARE_COPYRIGHT' && output.otherInfo?.softwareName && (
                                        <div>
                                            <p className="font-medium text-muted-foreground">软件名称</p>
                                            <p>{output.otherInfo.softwareName}</p>
                                        </div>
                                    )}

                                    {output.type === 'SOFTWARE_COPYRIGHT' && output.otherInfo?.copyrightOwner && (
                                        <div>
                                            <p className="font-medium text-muted-foreground">著作权人</p>
                                            <p>{output.otherInfo.copyrightOwner}</p>
                                        </div>
                                    )}

                                    {output.type === 'SOFTWARE_COPYRIGHT' && output.otherInfo?.registrationDate && (
                                        <div>
                                            <p className="font-medium text-muted-foreground">登记日期</p>
                                            <p>{formatDate(output.otherInfo.registrationDate)}</p>
                                        </div>
                                    )}

                                    {output.type === 'other_award' && output.otherInfo?.awardRecipient && (
                                        <div>
                                            <p className="font-medium text-muted-foreground">获奖人/单位</p>
                                            <p>{output.otherInfo.awardRecipient}</p>
                                        </div>
                                    )}

                                    {output.type === 'other_award' && output.otherInfo?.awardIssuingAuthority && (
                                        <div>
                                            <p className="font-medium text-muted-foreground">颁发单位</p>
                                            <p>{output.otherInfo.awardIssuingAuthority}</p>
                                        </div>
                                    )}

                                    {output.type === 'other_award' && output.otherInfo?.awardTime && (
                                        <div>
                                            <p className="font-medium text-muted-foreground">获奖时间</p>
                                            <p>{formatDate(output.otherInfo.awardTime)}</p>
                                        </div>
                                    )}

                                    {output.type === 'other_award' && output.otherInfo?.competitionLevel && (
                                        <div>
                                            <p className="font-medium text-muted-foreground">赛事层次</p>
                                            <p>
                                                {output.otherInfo.competitionLevel === 'unit' && '单位内部'}
                                                {output.otherInfo.competitionLevel === 'district' && '县区级'}
                                                {output.otherInfo.competitionLevel === 'city' && '市级'}
                                                {output.otherInfo.competitionLevel === 'province' && '省级'}
                                                {output.otherInfo.competitionLevel === 'national' && '国家级'}
                                                {output.otherInfo.competitionLevel === 'international' && '国际级'}
                                            </p>
                                        </div>
                                    )}



                                    {output.publicationUrl && (
                                        <div>
                                            <p className="font-medium text-muted-foreground">
                                                {output.type === 'PAPER' ? 'DOI链接' : 'URL链接'}
                                            </p>
                                            <a
                                                href={output.publicationUrl.startsWith('http') ? output.publicationUrl : `https://${output.publicationUrl}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-600 hover:underline break-all"
                                            >
                                                {output.publicationUrl}
                                            </a>
                                        </div>
                                    )}

                                    {/* 显示其他可能存在的信息 */}
                                    {output.otherInfo && Object.keys(output.otherInfo).map((key) => {
                                        const processedFields = [
                                            'authors', 'journal', 'legalStatus', 'patentCountry',
                                            'softwareName', 'copyrightOwner', 'registrationDate',
                                            'awardRecipient', 'awardIssuingAuthority', 'awardTime', 'competitionLevel',
                                            'journalPartition'
                                        ];

                                        if (processedFields.includes(key)) {
                                            return null;
                                        }

                                        return (
                                            <div key={key}>
                                                <p className="font-medium text-muted-foreground capitalize">{key}</p>
                                                <p>{String(output.otherInfo[key])}</p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* 文件信息 - 只有提交者或管理员可以看到 */}
                            {canViewSensitiveInfo && fileInfo && (
                                <div className="space-y-4 border-t pt-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-lg font-semibold">说明文件</h3>
                                    </div>
                                    <div className="bg-muted rounded-lg p-4">
                                        <div className="grid grid-cols-3 gap-3 text-sm">
                                            <div className={"col-span-2"}>
                                                <label className="text-muted-foreground">文件名:</label>
                                                <p className="font-medium break-all">
                                                    {fileInfo.fileName}（{formatFileSize(fileInfo.fileSize)}）
                                                </p>
                                            </div>
                                            <div className="flex items-end">
                                                <Button
                                                    onClick={handleDownloadFile}
                                                    variant="outline"
                                                    size="sm"
                                                    className="w-full"
                                                >
                                                    <Download className="h-4 w-4 mr-2" />
                                                    下载
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* 审核信息 - 只有提交者或管理员可以看到 */}
                            {canViewSensitiveInfo && output.approved !== null && (
                                <div className="space-y-4 border-t pt-4">
                                    <h3 className="text-lg font-semibold">审核信息</h3>
                                    <div className="space-y-4 text-sm">
                                        <div>
                                            <p className="font-medium text-muted-foreground">审核状态</p>
                                            <div className="mt-1">
                                                {getStatusBadge(output.approved)}
                                            </div>
                                        </div>

                                        {output.approved === false && output.rejectionReason && (
                                            <div>
                                                <p className="font-medium text-muted-foreground">拒绝原因</p>
                                                <p className="text-destructive">{output.rejectionReason}</p>
                                            </div>
                                        )}

                                        {output.approved === true && output.approver && (
                                            <div>
                                                <p className="font-medium text-muted-foreground">审核人</p>
                                                <p>{output.approver.realName || output.approver.username}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                    </ScrollArea>
                </div>

                <div className="flex justify-end mt-4">
                    <Button onClick={() => onOpenChange(false)}>关闭</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default OutputDetailDialog;