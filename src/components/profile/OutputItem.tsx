import {Card, CardContent} from "@/components/ui/card";
import {ResearchOutput} from "@/integrations/api/outputApi";
import {Badge} from "@/components/ui/badge";
import {getOutputTypeDisplayName, getOutputTypeIconComponent} from "@/lib/outputUtils";
import {Button} from "@/components/ui/button";
import {Trash2, Pencil, Eye, Calendar, Building, CheckCircle, XCircle, Clock, User, Database} from "lucide-react";
import {formatDateTime} from "@/lib/utils";
import {Tooltip, TooltipContent, TooltipTrigger} from "@/components/ui/tooltip";
import {getCurrentUserInfoFromSession} from "@/lib/authUtils";
import {hasPermissionRole, PermissionRoles} from "@/lib/permissionUtils.ts";
import {useToast} from "@/hooks/use-toast.ts";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {useState} from "react";
import {api} from "@/integrations/api/client.ts";
import RelatedUsersDialog from "./RelatedUsersDialog";
import {RelatedUsersDto} from "@/integrations/api/userApi.ts";
import {outputApi} from "@/integrations/api/outputApi.ts";
import {DatasetDetailModal} from "@/components/dataset/DatasetDetailModal.tsx";

interface OutputItemProps {
    output: ResearchOutput;
    onEdit?: (output: ResearchOutput, e: React.MouseEvent) => void;
    onDelete?: (output: ResearchOutput, e: React.MouseEvent) => void; // 保留此回调用于刷新列表
    onDetail: (output: ResearchOutput) => void;
    isEditable?: boolean;
    managementMode?: boolean; // 管理模式，用于调整UI
}

const OutputItem = ({
                        output,
                        onEdit,
                        onDelete,
                        onDetail,
                        isEditable = true,
                        managementMode = false
                    }: OutputItemProps) => {
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [relatedUsersDialogOpen, setRelatedUsersDialogOpen] = useState(false);
    const [relatedUsers, setRelatedUsers] = useState<RelatedUsersDto | null>(null);
    const [relatedUsersLoading, setRelatedUsersLoading] = useState(false);
    const [datasetModalOpen, setDatasetModalOpen] = useState(false);
    const {toast} = useToast();

    const getTypeIcon = (type: string) => {
        const IconComponent = getOutputTypeIconComponent(type);
        return <IconComponent className="h-4 w-4"/>;
    };

    const getHighlightedUserIds = () => {
        const ids: string[] = [];
        // 如果成果已审核，添加审核人的ID
        if (output.approver?.id) {
            ids.push(output.approver.id);
        }
        return ids;
    };

    const handleOpenRelatedUsersDialog = async () => {
        setRelatedUsersLoading(true);
        try {
            const response = await outputApi.getRelatedUsers(output.id);
            setRelatedUsers(response.data);
            setRelatedUsersDialogOpen(true);
        } catch (error) {
            console.error("Failed to fetch related users:", error);
            toast({
                title: "获取用户信息失败",
                description: "无法加载相关用户信息",
                variant: "destructive"
            });
        } finally {
            setRelatedUsersLoading(false);
        }
    };

    const getStatusBadge = (approved: boolean | null) => {
        const statusConfig = {
            approved: {variant: "default" as const, icon: CheckCircle, text: "已审核"},
            rejected: {variant: "destructive" as const, icon: XCircle, text: "已拒绝"},
            pending: {variant: "secondary" as const, icon: Clock, text: "待审核"}
        };

        let statusKey: keyof typeof statusConfig;
        if (approved === true) {
            statusKey = "approved";
        } else if (approved === false) {
            statusKey = "rejected";
        } else {
            statusKey = "pending";
        }

        const {variant, icon: Icon, text} = statusConfig[statusKey];

        return (
            <Badge
                variant={variant}
                className="flex items-center whitespace-nowrap min-w-[100px] justify-center"
            >
                <Icon className="h-3 w-3 mr-1"/>
                <span className="text-sm">{text}</span>
            </Badge>
        );
    };

    const truncateText = (text: string, maxLength: number) => {
        if (!text) return '';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    };

    const hasDeletionPermission = (output: ResearchOutput) => {
        // 只有成果创建者或平台管理员可以删除成果
        const userInfo = getCurrentUserInfoFromSession();
        if (!userInfo) return false;
        return output.submitter?.id === userInfo.user.id || hasPermissionRole(PermissionRoles.PLATFORM_ADMIN);
    };

    const handleDeleteClick = (output: ResearchOutput, e: React.MouseEvent) => {
        e.stopPropagation();
        setDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        try {
            // 调用API删除研究成果
            await api.delete(`/research-outputs/${output.id}`);

            toast({
                title: "删除成功",
                description: "研究成果已成功删除",
            });

            // 调用父组件的onDelete回调以刷新列表
            onDelete && onDelete(output, {} as React.MouseEvent);
        } catch (error) {
            console.error('Error deleting output:', error);
            toast({
                title: "删除失败",
                description: "无法删除该研究成果",
                variant: "destructive"
            });
        } finally {
            setDeleteDialogOpen(false);
        }
    };

    return (
        <Card
            className={`hover:shadow-md transition-all duration-200 border-l-4 ${managementMode ? 'border-l-primary' : 'border-l-primary'} max-w-full`}
        >
            <CardContent className="px-6 py-4 max-w-full">
                <div className="flex flex-col sm:flex-row items-start gap-4 max-w-full">
                    <div className="flex-1 min-w-0 max-w-full">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 max-w-full">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 min-w-0 flex-1 max-w-full">
                                <Badge variant="outline" className="flex items-center min-w-fit gap-1 text-sm whitespace-nowrap max-w-32">
                                    {getTypeIcon(output.type)}
                                    {getOutputTypeDisplayName(output.type)}
                                </Badge>
                                <h3 className="font-semibold text-lg truncate hover:underline hover:cursor-pointer" onClick={() => onDetail(output)}>
                                    {output.title}
                                </h3>
                            </div>
                            <div className="flex flex-row items-center gap-2">
                                <div className="flex-shrink-0">
                                    {getStatusBadge(output.approved)}
                                </div>
                                {/* 操作按钮 */}
                                <div className="gap-2 flex-shrink-0">
                                    <div className="flex gap-1">
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onDetail(output);
                                                    }}
                                                    className="h-10 w-10 p-2"
                                                >
                                                    <Eye className="h-4 w-4"/>
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>查看详情</p>
                                            </TooltipContent>
                                        </Tooltip>

                                        {!managementMode && isEditable && output.approved === null && (
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onEdit && onEdit(output, e);
                                                        }}
                                                        className="h-10 w-10 p-2"
                                                    >
                                                        <Pencil className="h-4 w-4"/>
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>编辑成果</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        )}

                                        {/* 查看审核员按钮 */}
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleOpenRelatedUsersDialog();
                                                    }}
                                                    className="h-10 w-10 p-2"
                                                >
                                                    <User className="h-4 w-4"/>
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>查看审核员</p>
                                            </TooltipContent>
                                        </Tooltip>

                                        {hasDeletionPermission(output) && (
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteClick(output, e);
                                                        }}
                                                        className="h-10 w-10 p-2 text-destructive hover:text-destructive"
                                                    >
                                                        <Trash2 className="h-4 w-4"/>
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>删除成果</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 基本信息行 */}
                        <div
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 mb-2 max-w-full text-sm text-muted-foreground">
                            {output.submitter && (
                                <div className="flex items-center gap-2 min-w-0 max-w-full">
                                    <User className="h-4 w-4 flex-shrink-0"/>
                                    <span className="truncate"
                                          title={output.submitter.realName || output.submitter.phone}>
                                        提交者: {truncateText(output.submitter.realName || output.submitter.phone, 15)}
                                    </span>
                                </div>
                            )}
                            {output.dataset && (
                                <div className="flex flex-row items-center gap-2 min-w-0 flex-1 max-w-full">
                                    <Database className="h-4 w-4 flex-shrink-0"/>
                                    <h3 className="truncate">
                                        数据集: <span
                                        onClick={() => setDatasetModalOpen(true)}
                                        className={"hover:underline hover:cursor-pointer"}>{output.dataset.titleCn}</span>
                                    </h3>
                                </div>
                            )}
                        </div>

                        <div
                            className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-2 sm:gap-4 text-sm text-muted-foreground mb-4 max-w-full">
                            <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 flex-shrink-0"/>
                                <span>提交时间: {formatDateTime(output.createdAt)}</span>
                            </div>
                            {output.approvedAt && (
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 flex-shrink-0"/>
                                    <span>审核时间: {formatDateTime(output.approvedAt)}</span>
                                </div>
                            )}
                        </div>


                        {/* 摘要 */}
                        {output.abstractText && (
                            <div className="mb-4 max-w-full">
                                <p className="line-clamp-3 break-all whitespace-pre-wrap">
                                    {output.abstractText}
                                </p>
                            </div>
                        )}

                        {/* 其他关键信息预览 */}
                        <div className="flex flex-wrap gap-4 text-xs">
                            {output.otherInfo?.authors && (
                                <Badge variant="secondary" className="text-xs">
                                    作者: {truncateText(output.otherInfo.authors, 30)}
                                </Badge>
                            )}
                        </div>
                    </div>

                </div>
            </CardContent>

            {/* 删除确认对话框 */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>确认删除</AlertDialogTitle>
                        <AlertDialogDescription>
                            您确定要删除研究成果"{output.title}"吗？此操作无法撤销。
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>取消</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            删除
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* 相关用户信息对话框 */}
            <RelatedUsersDialog
                open={relatedUsersDialogOpen}
                onOpenChange={setRelatedUsersDialogOpen}
                relatedUsers={relatedUsers}
                loading={relatedUsersLoading}
                highlightedUserIds={getHighlightedUserIds()}
            />

            {/* 相关数据集详情对话框 */}
            <DatasetDetailModal
                dataset={datasetModalOpen && output.dataset}
                onOpenChange={setDatasetModalOpen}
                open={datasetModalOpen}
                useAdvancedQuery={managementMode}
            />
        </Card>
    );
};

export default OutputItem;