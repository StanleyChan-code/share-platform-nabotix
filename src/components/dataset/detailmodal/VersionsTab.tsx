import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card.tsx";
import {Badge} from "@/components/ui/badge.tsx";
import {Button} from "@/components/ui/button.tsx";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table.tsx";
import {
    CheckCircle,
    XCircle,
    HelpCircle,
    Database,
    Hash,
    Plus,
    FileText,
    Calendar,
    BarChart3,
    Layers,
    MessageSquare
} from "lucide-react";
import {useState} from "react";
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger} from "@/components/ui/dialog.tsx";
import {AddDatasetVersionForm} from "@/components/upload/AddDatasetVersionForm.tsx";
import {ScrollArea} from "@/components/ui/scroll-area.tsx";
import {formatDate} from "@/lib/utils.ts";
import {canUploadDataset, hasPermissionRole, PermissionRoles} from "@/lib/permissionUtils.ts";
import ApprovalActions from "@/components/ui/ApprovalActions.tsx";
import {Dataset, datasetApi} from "@/integrations/api/datasetApi.ts";
import {toast} from "@/hooks/use-toast.ts";
import {getCurrentUser} from "@/lib/authUtils.ts";

interface VersionsTabProps {
    versions: any[];
    currentVersionNumber?: string;
    showAllVersions?: boolean;
    useAdvancedQuery?: boolean;
    dataset?: Dataset;
    onVersionAdded?: () => void;
}

export function VersionsTab({
                                versions,
                                currentVersionNumber,
                                showAllVersions = false,
                                useAdvancedQuery = false,
                                dataset,
                                onVersionAdded
                            }: VersionsTabProps) {
    const [isAddVersionDialogOpen, setIsAddVersionDialogOpen] = useState(false);
    const [expandedDescriptionId, setExpandedDescriptionId] = useState<string | null>(null);
    const datasetId = dataset?.id;

    // 检查用户是否有审核权限
    const canApproveDataset = useAdvancedQuery && (
        hasPermissionRole(PermissionRoles.PLATFORM_ADMIN) ||
        dataset.institutionId === getCurrentUser().institutionId && (hasPermissionRole(PermissionRoles.INSTITUTION_SUPERVISOR) || hasPermissionRole(PermissionRoles.DATASET_APPROVER))
    );


    // 获取版本状态显示信息
    const getVersionStatusInfo = (version: any) => {
        if (version.approved === true) {
            return {
                icon: CheckCircle,
                text: "已批准",
                variant: "default" as const,
                color: "text-green-600",
                bgColor: "bg-green-50 border-green-200"
            };
        } else if (version.approved === false) {
            return {
                icon: XCircle,
                text: "已拒绝",
                variant: "destructive" as const,
                color: "text-red-600",
                bgColor: "bg-red-50 border-red-200"
            };
        } else {
            return {
                icon: HelpCircle,
                text: "待审核",
                variant: "secondary" as const,
                color: "text-amber-600",
                bgColor: "bg-amber-50 border-amber-200"
            };
        }
    };

    // 根据showAllVersions属性决定是否过滤版本
    const displayedVersions = showAllVersions
        ? versions
        : versions?.filter(version => version.approved === true) || [];

    // 检查是否存在待审核的版本
    const hasPendingVersion = versions?.some(version => version.approved === null);

    // 处理版本添加完成
    const handleVersionAdded = () => {
        setIsAddVersionDialogOpen(false);
        if (onVersionAdded) {
            onVersionAdded();
        }
    };

    // 切换描述展开/收起
    const toggleDescription = (versionId: string) => {
        setExpandedDescriptionId(expandedDescriptionId === versionId ? null : versionId);
    };

    // 检查文本是否需要展开/收起功能
    const needsExpansion = (text: string) => {
        return text.length > 100 || text.split('\n').length > 3;
    };

    // 获取显示的描述文本
    const getDisplayDescription = (version: any) => {
        const description = version.description || version.changesDescription || '暂无版本说明';
        const isExpanded = expandedDescriptionId === version.id;

        if (!needsExpansion(description) || isExpanded) {
            return description;
        }

        if (description.length <= 100) {
            return description;
        }

        const truncated = description.slice(0, 100);
        const lastSpaceIndex = truncated.lastIndexOf(' ');
        return lastSpaceIndex > 80 ? truncated.slice(0, lastSpaceIndex) + '...' : truncated + '...';
    };

    // 处理审核操作
    const handleApprovalAction = async (versionId: string, approved: boolean, comment: string) => {
        if (!datasetId) return;

        try {
            await datasetApi.updateDatasetVersionApproval(datasetId, versionId, {
                approved: approved,
                rejectionReason: approved ? undefined : comment // 只有拒绝时才传入拒绝理由
            });

            toast({
                title: "操作成功",
                description: approved ? "版本已通过审核" : "版本已被拒绝"
            });

            // 重新加载版本信息
            if (onVersionAdded) {
                onVersionAdded();
            }
        } catch (error: any) {
            console.error("审核操作失败:", error);
            toast({
                title: "操作失败",
                description: error.response?.data?.message || "审核操作失败，请稍后重试",
                variant: "destructive"
            });
        }
    };

    return (
        <Card className="border shadow-sm">
            <CardHeader className="pb-4">
                <div className="flex justify-between items-center">
                    <CardTitle className="flex items-center gap-3 text-xl">
                        <div className="p-2 bg-blue-50 rounded-lg">
                            <Layers className="h-6 w-6 text-blue-600"/>
                        </div>
                        <div>
                            <div>版本历史</div>
                            {displayedVersions.length > 0 && (
                                <div className="text-sm font-normal text-muted-foreground mt-1">
                                    共 {displayedVersions.length} 个版本
                                </div>
                            )}
                        </div>
                    </CardTitle>

                    {useAdvancedQuery && canUploadDataset() && !hasPendingVersion && datasetId && (
                        <Dialog open={isAddVersionDialogOpen} onOpenChange={setIsAddVersionDialogOpen}>
                            <DialogTrigger asChild>
                                <Button size="sm" variant="default" className="gap-2 shadow-sm">
                                    <Plus className="h-4 w-4"/>
                                    添加新版本
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                                <DialogHeader>
                                    <DialogTitle className="flex items-center gap-2">
                                        <Plus className="h-5 w-5"/>
                                        添加数据集新版本
                                    </DialogTitle>
                                </DialogHeader>
                                <AddDatasetVersionForm
                                    datasetId={datasetId}
                                    onSuccess={handleVersionAdded}
                                />
                            </DialogContent>
                        </Dialog>
                    )}
                </div>
            </CardHeader>

            <CardContent>
                {displayedVersions && displayedVersions.length > 0 ? (
                    <div className="rounded-lg border">
                        {/* 使用 table-layout: fixed 确保列宽固定 */}
                        <Table className="table-fixed">
                            <TableHeader>
                                <TableRow className="bg-muted/50 hover:bg-muted/50">
                                    {/* 状态列 - 120px */}
                                    <TableHead className="w-[120px] font-semibold py-4">
                                        <div className="flex items-center gap-2">
                                            <BarChart3 className="h-4 w-4 text-muted-foreground"/>
                                            状态
                                        </div>
                                    </TableHead>

                                    {/* 版本号列 - 120px */}
                                    <TableHead className="w-[120px] font-semibold py-4">
                                        <div className="flex items-center gap-2">
                                            <Hash className="h-4 w-4 text-muted-foreground"/>
                                            版本号
                                        </div>
                                    </TableHead>

                                    {/* 发布时间列 - 180px */}
                                    <TableHead className="w-[180px] font-semibold py-4">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4 text-muted-foreground"/>
                                            发布时间
                                        </div>
                                    </TableHead>

                                    {/* 数据统计列 - 200px */}
                                    <TableHead className="w-[200px] font-semibold py-4">
                                        <div className="flex items-center gap-2">
                                            <Database className="h-4 w-4 text-muted-foreground"/>
                                            数据统计
                                        </div>
                                    </TableHead>

                                    {/* 版本说明列 - 弹性宽度 */}
                                    <TableHead className="font-semibold py-4">
                                        <div className="flex items-center gap-2">
                                            <MessageSquare className="h-4 w-4 text-muted-foreground"/>
                                            版本说明
                                        </div>
                                    </TableHead>

                                    {/* 审核操作列 - 150px */}
                                    {canApproveDataset && (
                                        <TableHead className="w-[150px] font-semibold py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <MessageSquare className="h-4 w-4 text-muted-foreground"/>
                                                操作
                                            </div>
                                        </TableHead>
                                    )}
                                </TableRow>
                            </TableHeader>

                            <TableBody>
                                {displayedVersions.map((version: any) => {
                                    const statusInfo = getVersionStatusInfo(version);
                                    const StatusIcon = statusInfo.icon;
                                    const isCurrentVersion = version.versionNumber === currentVersionNumber;
                                    const description = version.description || version.changesDescription;
                                    const hasDescription = description && description !== '暂无版本说明';
                                    const needsExpand = hasDescription && needsExpansion(description);
                                    const isExpanded = expandedDescriptionId === version.id;
                                    const displayDescription = getDisplayDescription(version);

                                    return (
                                        <TableRow key={version.id} className="group hover:bg-muted/30">
                                            {/* 状态单元格 - 固定宽度 */}
                                            <TableCell className="py-4 w-[120px] align-top">
                                                <div className="flex justify-center">
                                                    <Badge
                                                        variant={statusInfo.variant}
                                                        className={`gap-1.5 px-3 py-1.5 ${statusInfo.bgColor} ${statusInfo.color} border whitespace-nowrap`}
                                                    >
                                                        <StatusIcon className="h-3.5 w-3.5"/>
                                                        {statusInfo.text}
                                                    </Badge>
                                                </div>
                                            </TableCell>

                                            {/* 版本号单元格 - 固定宽度 */}
                                            <TableCell className="py-4 w-[120px] align-top">
                                                <div className="flex flex-col items-center gap-1">
                                                    <div className="font-semibold text-base text-center break-all">
                                                        {version.versionNumber}
                                                    </div>
                                                    {isCurrentVersion && (
                                                        <Badge
                                                            variant="secondary"
                                                            className="bg-blue-100 text-blue-800 border-blue-200 text-xs whitespace-nowrap"
                                                        >
                                                            当前版本
                                                        </Badge>
                                                    )}
                                                </div>
                                            </TableCell>

                                            {/* 发布时间单元格 - 固定宽度 */}
                                            <TableCell className="py-4 w-[180px] align-top">
                                                <div className="flex gap-2 text-sm bg-muted/20 rounded-lg p-2">
                                                    <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0"/>
                                                    <span className="font-medium break-words">
                                  {version.publishedDate ?
                                      formatDate(new Date(version.publishedDate)) :
                                      '未发布'
                                  }
                                </span>
                                                </div>
                                            </TableCell>

                                            {/* 数据统计单元格 - 固定宽度 */}
                                            <TableCell className="py-4 w-[200px] align-top">
                                                <div className="space-y-2 bg-muted/20 rounded-lg p-2">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-1">
                                                            <div className="p-1 bg-green-50 rounded flex-shrink-0">
                                                                <Database className="h-3 w-3 text-green-600"/>
                                                            </div>
                                                            <span
                                                                className="text-xs text-muted-foreground whitespace-nowrap">记录</span>
                                                        </div>
                                                        <span className="font-semibold text-sm whitespace-nowrap">
                              {(version.recordCount || 0).toLocaleString()}
                            </span>
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-1">
                                                            <div className="p-1 bg-purple-50 rounded flex-shrink-0">
                                                                <Hash className="h-3 w-3 text-purple-600"/>
                                                            </div>
                                                            <span
                                                                className="text-xs text-muted-foreground whitespace-nowrap">变量</span>
                                                        </div>
                                                        <span className="font-semibold text-sm whitespace-nowrap">
                              {version.variableCount || 0}
                            </span>
                                                    </div>
                                                </div>
                                            </TableCell>

                                            {/* 版本说明单元格 - 弹性宽度 */}
                                            <TableCell className="py-4 align-top">
                                                <div className="max-w-full">
                                                    {hasDescription ? (
                                                        <div className="space-y-2">
                                                            <ScrollArea
                                                                className={`text-sm text-muted-foreground leading-relaxed bg-muted/20 rounded-lg p-3 ${
                                                                    isExpanded ? 'max-h-32' : 'max-h-20'
                                                                } transition-all duration-200`}
                                                            >
                                                                <div className="whitespace-pre-wrap break-words">
                                                                    {displayDescription}
                                                                </div>
                                                            </ScrollArea>
                                                            {needsExpand && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-7 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                                                                    onClick={() => toggleDescription(version.id)}
                                                                >
                                                                    {isExpanded ? '收起' : '展开全文'}
                                                                </Button>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <div
                                                            className="flex items-center justify-center gap-2 text-sm text-muted-foreground bg-muted/20 rounded-lg p-3 h-20">
                                                            <FileText className="h-4 w-4"/>
                                                            暂无版本说明
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>

                                            {/* 审核操作单元格 - 固定宽度 */}
                                            {canApproveDataset && (
                                                <TableCell className="py-4 w-[150px] align-top">
                                                    <div className="flex justify-end">
                                                        {version.approved === null && (
                                                            <ApprovalActions
                                                                showCommentDialog={true}
                                                                requireCommentOnApprove={false} // 通过时无需填写意见
                                                                requireCommentOnReject={true} // 拒绝时需要填写意见
                                                                approveDialogTitle={`审核通过意见 - 版本${version.versionNumber}`}
                                                                rejectDialogTitle={`审核拒绝意见 - 版本${version.versionNumber}`}
                                                                onSuccess={(approved, comment) =>
                                                                    handleApprovalAction(version.id, approved, comment)
                                                                }
                                                                approveButtonText="通过"
                                                                rejectButtonText="拒绝"
                                                                showRevokeApprovalButton={false}
                                                            />
                                                        )}
                                                        {version.approved === true && (
                                                            <ApprovalActions
                                                                showCommentDialog={true}
                                                                requireCommentOnApprove={true} // 驳回通过时需要填写意见
                                                                requireCommentOnReject={true} // 保持拒绝时也需要填写意见
                                                                // 不再显示通过和拒绝按钮，只显示"驳回通过"按钮
                                                                showRevokeApprovalButton={true}
                                                                revokeApprovalButtonText="驳回通过"
                                                                rejectDialogTitle={`驳回通过意见 - 版本${version.versionNumber}`}
                                                                onSuccess={(approved, comment) =>
                                                                    // 注意：驳回通过实际上是拒绝操作，所以approved为false
                                                                    handleApprovalAction(version.id, false, comment)
                                                                }
                                                            />
                                                        )}
                                                        {version.approved === false && (
                                                            <div className="text-sm text-muted-foreground italic">
                                                                已拒绝
                                                            </div>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            )}

                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <div
                            className="mx-auto w-20 h-20 bg-muted/30 rounded-full flex items-center justify-center mb-4">
                            <FileText className="h-10 w-10 text-muted-foreground"/>
                        </div>
                        <p className="text-muted-foreground text-lg mb-2">暂无版本历史记录</p>
                        {currentVersionNumber && (
                            <p className="text-sm text-muted-foreground">
                                当前版本：<span className="font-semibold text-foreground">{currentVersionNumber}</span>
                            </p>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}