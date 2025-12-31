import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card.tsx";
import {Badge} from "@/components/ui/badge.tsx";
import {Button} from "@/components/ui/button.tsx";
import {Tooltip, TooltipContent, TooltipTrigger} from "@/components/ui/tooltip.tsx";
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
    MessageSquare,
    ChevronDown,
    ChevronUp,
    User
} from "lucide-react";
import {useState} from "react";
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger} from "@/components/ui/dialog.tsx";
import {AddDatasetVersionForm} from "@/components/admin/dataset/AddDatasetVersionForm.tsx";
import {ScrollArea} from "@/components/ui/scroll-area.tsx";
import {formatDate} from "@/lib/utils.ts";
import {canUploadDataset, hasPermissionRole, PermissionRoles} from "@/lib/permissionUtils.ts";
import ApprovalActions from "@/components/ui/ApprovalActions.tsx";
import {Dataset, datasetApi} from "@/integrations/api/datasetApi.ts";
import {toast} from "@/hooks/use-toast.ts";
import {getCurrentUserFromSession} from "@/lib/authUtils";
import RelatedUsersDialog from "@/components/profile/RelatedUsersDialog.tsx";
import {RelatedUsersDto} from "@/integrations/api/userApi.ts";
import {QADialog, QAItem} from "@/components/ui/QADialog.tsx";

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
    const [expandedDescriptions, setExpandedDescriptions] = useState<Set<string>>(new Set());
    
    // 新增：相关用户对话框状态
    const [isRelatedUsersDialogOpen, setIsRelatedUsersDialogOpen] = useState(false);
    const [relatedUsers, setRelatedUsers] = useState<RelatedUsersDto | null>(null);
    const [relatedUsersLoading, setRelatedUsersLoading] = useState(false);
    const [highlightedUserIds, setHighlightedUserIds] = useState<string[]>([]);
    
    // 新增：Q&A对话框状态
    const [isQADialogOpen, setIsQADialogOpen] = useState(false);
    
    const datasetId = dataset?.id;

    // 检查用户是否有审核权限
    const canApproveDataset = useAdvancedQuery && dataset && (
        hasPermissionRole(PermissionRoles.PLATFORM_ADMIN) ||
        dataset.institutionId === getCurrentUserFromSession()?.institutionId && (hasPermissionRole(PermissionRoles.INSTITUTION_SUPERVISOR) || hasPermissionRole(PermissionRoles.DATASET_APPROVER))
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
                text: "待机构审核",
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
        setExpandedDescriptions(prev => {
            const newSet = new Set(prev);
            if (newSet.has(versionId)) {
                newSet.delete(versionId);
            } else {
                newSet.add(versionId);
            }
            return newSet;
        });
    };

    // 检查文本是否需要展开/收起功能
    const needsExpansion = (text: string) => {
        return text.length > 200 || text.split('\n').length > 4;
    };

    // 处理审核操作
    const handleApprovalAction = async (versionId: string, approved: boolean, comment: string) => {
        if (!datasetId) return;

        try {
            await datasetApi.updateDatasetVersionApproval(datasetId, versionId, {
                approved: approved,
                rejectionReason: approved ? undefined : comment
            });

            toast({
                title: "操作成功",
                description: approved ? "版本已通过审核" : "版本已被拒绝"
            });

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

    // 新增：获取数据集相关用户信息
    const handleOpenRelatedUsersDialog = async (version: any) => {
        if (!datasetId) return;

        try {
            setRelatedUsersLoading(true);
            setHighlightedUserIds([]);
            
            // 调用 API 获取数据集相关用户
            const response = await datasetApi.getDatasetRelatedUsers(datasetId);
            setRelatedUsers(response.data);
            
            // 如果版本已经审核，高亮审核员
            if (version.approved !== null && version.supervisor) {
               setHighlightedUserIds([version.supervisor.id]);
            }
            
            // 打开对话框
            setIsRelatedUsersDialogOpen(true);
        } catch (error: any) {
            console.error("获取相关用户失败:", error);
            toast({
                title: "获取失败",
                description: error.response?.data?.message || "获取相关用户信息失败，请稍后重试",
                variant: "destructive"
            });
        } finally {
            setRelatedUsersLoading(false);
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
                        {/* Q&A对话框 */}
                        {useAdvancedQuery && (
                            <QADialog
                                isOpen={isQADialogOpen}
                                onOpenChange={setIsQADialogOpen}
                                title="数据集版本审核说明"
                                content={
                                    <div className="space-y-6">
                                        <QAItem
                                            number={1}
                                            title="版本创建"
                                            description="数据集上传员在创建数据集时，系统会自动创建第一个数据集版本。"
                                        />
                                        
                                        <QAItem
                                            number={2}
                                            title="审核权限"
                                            description="只有机构数据集审核员或机构管理员有权限审核数据集版本。"
                                        />
                                        
                                        <QAItem
                                            number={3}
                                            title="公开展示条件"
                                            description="当且仅当数据集存在至少一个已批准的版本时，该数据集才能在平台公开展示。"
                                        />
                                        
                                        <QAItem
                                            number={4}
                                            title="版本提交限制"
                                            description="当数据集存在待审核的版本时，无法提交新的版本，需等待当前版本审核完成。"
                                        />
                                        
                                        <QAItem
                                            number={5}
                                            title="随访数据集处理"
                                            description="对于随访数据集，请上传新的数据集并关联基线数据集，而不是通过新增数据集版本的方式处理。"
                                        />
                                        
                                        <QAItem
                                            number={6}
                                            title="数据获取规则"
                                            description="平台公开展示和用户申请下载的数据集数据及文件，均为该数据集最新的已审核通过的版本。"
                                        />
                                        
                                        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                            <div className="flex items-start gap-3">
                                                <div className="flex-shrink-0 h-6 w-6 rounded-full bg-blue-200 text-blue-800 flex items-center justify-center font-medium">
                                                    <span className="text-xs">!</span>
                                                </div>
                                                <div className="text-sm">
                                                    <p className="font-medium text-blue-800 mb-1">提示</p>
                                                    <p className="text-blue-700">
                                                        在数据集版本列表中，每个版本右侧的用户图标按钮可以点击查看该版本的相关审核人员信息。
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                }
                            />
                        )}
                    </CardTitle>

                    {useAdvancedQuery && canUploadDataset() && !hasPendingVersion && datasetId && (
                        <Dialog open={isAddVersionDialogOpen} onOpenChange={setIsAddVersionDialogOpen}>
                            <DialogTrigger asChild>
                                <Button size="sm" variant="default" className="gap-2 shadow-sm">
                                    <Plus className="h-4 w-4"/>
                                    添加新版本
                                </Button>
                            </DialogTrigger>
                            <DialogContent
                                className="max-w-3xl max-h-[90vh] overflow-y-auto"
                                onInteractOutside={(e) => e.preventDefault()}
                            >
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
                    <div className="space-y-4">
                        {displayedVersions.map((version: any) => {
                            const statusInfo = getVersionStatusInfo(version);
                            const StatusIcon = statusInfo.icon;
                            const isCurrentVersion = version.versionNumber === currentVersionNumber;
                            const description = version.description || version.changesDescription || '暂无版本说明';
                            const hasDescription = description && description !== '暂无版本说明';
                            const needsExpand = hasDescription && needsExpansion(description);
                            const isExpanded = expandedDescriptions.has(version.id);

                            return (
                                <Card key={version.id} className="border shadow-sm hover:shadow-md transition-shadow">
                                    <CardContent className="p-6">
                                        {/* 顶部信息栏 */}
                                        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 mb-4">
                                            <div className="flex items-start gap-4 flex-1">
                                                {/* 版本号和状态 */}
                                                <div className="flex flex-col items-center gap-2">
                                                    <div className="flex items-center gap-2">
                                                        <div className="text-2xl font-bold text-blue-600">
                                                            {version.versionNumber}
                                                        </div>
                                                        {isCurrentVersion && (
                                                            <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
                                                                当前版本
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <Badge
                                                        variant={statusInfo.variant}
                                                        className={`gap-1.5 px-3 py-1.5 ${statusInfo.bgColor} ${statusInfo.color} border transition-all duration-200`}
                                                    >
                                                        <StatusIcon className="h-3.5 w-3.5"/>
                                                        {statusInfo.text}
                                                    </Badge>
                                                </div>

                                                {/* 发布时间 */}
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/20 rounded-lg px-3 py-2">
                                                    <Calendar className="h-4 w-4"/>
                                                    <span className="font-medium">
                                                        {version.publishedDate ?
                                                            formatDate(new Date(version.publishedDate)) :
                                                            '未发布'
                                                        }
                                                    </span>
                                                </div>

                                                {/* 数据统计 */}
                                                <div className="flex items-center gap-4">
                                                    <div className="flex items-center gap-2 bg-green-50 rounded-lg px-3 py-2">
                                                        <Database className="h-4 w-4 text-green-600"/>
                                                        <span className="text-sm font-medium">
                                                            记录: {(version.recordCount || 0).toLocaleString()}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2 bg-purple-50 rounded-lg px-3 py-2">
                                                        <Hash className="h-4 w-4 text-purple-600"/>
                                                        <span className="text-sm font-medium">
                                                            变量: {version.variableCount || 0}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* 操作按钮 */}
                                            <div className="flex items-center gap-2">
                                                {/* 查看审核员按钮 */}
                                                {useAdvancedQuery && (
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                className="h-10 w-10 p-2"
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => handleOpenRelatedUsersDialog(version)}
                                                            >
                                                                <User className="h-4 w-4"/>
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>查看审核员</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                )}

                                                {/* 审核操作 */}
                                                {canApproveDataset && (
                                                <div className="flex-shrink-0">
                                                    {version.approved === null && (
                                                        <ApprovalActions
                                                            showCommentDialog={true}
                                                            requireCommentOnApprove={false}
                                                            requireCommentOnReject={true}
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
                                                            requireCommentOnApprove={true}
                                                            requireCommentOnReject={true}
                                                            showRevokeApprovalButton={true}
                                                            revokeApprovalButtonText="驳回通过"
                                                            rejectDialogTitle={`驳回通过意见 - 版本${version.versionNumber}`}
                                                            onSuccess={(approved, comment) =>
                                                                handleApprovalAction(version.id, false, comment)
                                                            }
                                                        />
                                                    )}
                                                    {version.approved === false && (
                                                        <div className="text-sm text-muted-foreground italic px-3 py-2">
                                                            已拒绝
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                            </div>
                                        </div>

                                        {/* 版本说明 */}
                                        <div className="border-t pt-4">
                                            <div className="flex items-center gap-2 mb-3">
                                                <MessageSquare className="h-4 w-4 text-muted-foreground"/>
                                                <span className="font-medium text-sm">版本说明</span>
                                            </div>

                                            {hasDescription ? (
                                                <div className="space-y-3">
                                                    <div className={`bg-muted/20 rounded-lg p-4 transition-all duration-200 ${
                                                        isExpanded ? '' : 'max-h-48 overflow-hidden'
                                                    }`}>
                                                        <ScrollArea className={`text-sm text-muted-foreground leading-relaxed ${
                                                            isExpanded ? 'max-h-96' : 'max-h-32'
                                                        }`}>
                                                            <div className="whitespace-pre-wrap break-words">
                                                                {description}
                                                            </div>
                                                        </ScrollArea>
                                                    </div>
                                                    {needsExpand && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-8 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                                                            onClick={() => toggleDescription(version.id)}
                                                        >
                                                            {isExpanded ? (
                                                                <span className="flex items-center gap-1">
                                                                    <ChevronUp className="h-4 w-4"/>
                                                                    收起说明
                                                                </span>
                                                            ) : (
                                                                <span className="flex items-center gap-1">
                                                                    <ChevronDown className="h-4 w-4"/>
                                                                    展开完整说明
                                                                </span>
                                                            )}
                                                        </Button>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground bg-muted/20 rounded-lg p-6">
                                                    <FileText className="h-4 w-4"/>
                                                    暂无版本说明
                                                </div>
                                            )}
                                        </div>

                                        {/* 高级查询时如果版本被拒绝则显示拒绝理由 */}
                                        {version.approved === false && (
                                            <div className="border-t pt-4">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <XCircle className="h-4 w-4 text-destructive"/>
                                                    <span className="font-medium text-sm text-destructive">拒绝原因</span>
                                                </div>
                                                <div className="text-sm text-muted-foreground">
                                                    {version.rejectReason || '无'}
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <div className="mx-auto w-20 h-20 bg-muted/30 rounded-full flex items-center justify-center mb-4">
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
            
            {/* 新增：相关用户对话框 */}
            <RelatedUsersDialog
                open={isRelatedUsersDialogOpen}
                onOpenChange={setIsRelatedUsersDialogOpen}
                relatedUsers={relatedUsers}
                loading={relatedUsersLoading}
                highlightedUserIds={highlightedUserIds}
            />
        </Card>
    );
}