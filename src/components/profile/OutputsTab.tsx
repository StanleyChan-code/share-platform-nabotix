import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {
    Download,
    FileText,
    Plus,
    Trash2,
    Pencil,
    Eye,
    Calendar,
    User,
    Building,
    CheckCircle,
    XCircle,
    Clock
} from "lucide-react";
import {useState, useCallback, useRef} from "react";
import {useToast} from "@/hooks/use-toast";
import {Badge} from "@/components/ui/badge";
import {getOutputTypeDisplayName, getOutputTypeIconComponent} from "@/lib/outputUtils";
import {outputApi, ResearchOutput} from "@/integrations/api/outputApi";
import {Button} from "@/components/ui/button";
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
import {api} from "@/integrations/api/client";
import SubmitOutputDialog from "@/components/outputs/SubmitOutputDialog";
import OutputDetailDialog from "@/components/outputs/OutputDetailDialog";
import EditOutputDialog from "@/components/outputs/EditOutputDialog";
import {formatDateTime} from "@/lib/utils";
import PaginatedList from "@/components/ui/PaginatedList";
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from "@/components/ui/tooltip";
import {Dataset} from "@/integrations/api/datasetApi.ts";
import {getCurrentUserInfoFromSession} from "@/lib/authUtils.ts";
import {hasPermissionRole, PermissionRoles} from "@/lib/permissionUtils.ts";

const OutputsTab = () => {
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [outputToDelete, setOutputToDelete] = useState<ResearchOutput | null>(null);
    const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
    const [detailDialogOpen, setDetailDialogOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [selectedOutput, setSelectedOutput] = useState<ResearchOutput | null>(null);
    const {toast} = useToast();
    const paginatedListRef = useRef<any>(null);

    const fetchUserOutputs = useCallback(async (page: number, size: number) => {
        return await outputApi.getMySubmissions({
            page,
            size
        });
    }, []);

    const getTypeIcon = (type: string) => {
        const IconComponent = getOutputTypeIconComponent(type);
        return <IconComponent className="h-4 w-4"/>;
    };

    const getStatusIcon = (approved: boolean | null) => {
        switch (approved) {
            case true:
                return <CheckCircle className="h-3 w-3 mr-1"/>;
            case false:
                return <XCircle className="h-3 w-3 mr-1"/>;
            default:
                return <Clock className="h-3 w-3 mr-1"/>;
        }
    };

    const getStatusBadge = (approved: boolean | null) => {
        if (approved === true) {
            return (
                <Badge variant="default" className="flex items-center whitespace-nowrap">
                    {getStatusIcon(approved)}
                    已审核
                </Badge>
            );
        } else if (approved === false) {
            return (
                <Badge variant="destructive" className="flex items-center whitespace-nowrap">
                    {getStatusIcon(approved)}
                    已拒绝
                </Badge>
            );
        } else {
            return (
                <Badge variant="secondary" className="flex items-center whitespace-nowrap">
                    {getStatusIcon(approved)}
                    待审核
                </Badge>
            );
        }
    };

    const truncateText = (text: string, maxLength: number) => {
        if (!text) return '';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    };

    const handleDeleteClick = (output: ResearchOutput, e: React.MouseEvent) => {
        e.stopPropagation();
        setOutputToDelete(output);
        setDeleteDialogOpen(true);
    };

    const handleEditClick = (output: ResearchOutput, e: React.MouseEvent) => {
        e.stopPropagation();
        // 只有待审核状态的成果才能编辑
        if (output.approved === null) {
            setSelectedOutput(output);
            setEditDialogOpen(true);
        } else {
            toast({
                title: "无法编辑",
                description: "只有待审核状态的成果才能编辑",
                variant: "destructive"
            });
        }
    };

    const handleOutputClick = (output: ResearchOutput) => {
        setSelectedOutput(output);
        setDetailDialogOpen(true);
    };

    const handleAddOutput = () => {
        setSubmitDialogOpen(true);
    };

    const handleOutputSubmitted = () => {
        // 成果提交后刷新列表
        toast({
            title: "提交成功",
            description: "研究成果已成功提交，等待审核",
        });

        // 刷新列表
        if (paginatedListRef.current) {
            paginatedListRef.current.refresh();
        }
    };

    const handleOutputEdited = () => {
        // 成果编辑后刷新列表
        toast({
            title: "更新成功",
            description: "研究成果已成功更新",
        });

        // 刷新列表
        if (paginatedListRef.current) {
            paginatedListRef.current.refresh();
        }
    };

    const confirmDelete = async () => {
        if (!outputToDelete) return;

        try {
            // 调用API删除研究成果
            await api.delete(`/research-outputs/${outputToDelete.id}`);

            toast({
                title: "删除成功",
                description: "研究成果已成功删除",
            });

            // 刷新列表
            if (paginatedListRef.current) {
                paginatedListRef.current.refresh();
            }
        } catch (error) {
            console.error('Error deleting output:', error);
            toast({
                title: "删除失败",
                description: "无法删除该研究成果",
                variant: "destructive"
            });
        } finally {
            setDeleteDialogOpen(false);
            setOutputToDelete(null);
        }
    };

    const hasDeletionPermission = (output: ResearchOutput) => {
        // 只有成果创建者或平台管理员可以删除成果
        if (!getCurrentUserInfoFromSession()) return false;
        return output.submitter?.id === getCurrentUserInfoFromSession().user.id || hasPermissionRole(PermissionRoles.PLATFORM_ADMIN);
    };

    const renderOutputItem = (output: ResearchOutput) => (
        <Card
            key={output.id}
            className="hover:shadow-md transition-all duration-200 border-l-4 border-l-primary"
        >
            <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                        {/* 标题和状态行 */}
                        <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                                <div className="flex-shrink-0">
                                    {getTypeIcon(output.type)}
                                </div>
                                <h3
                                    className="font-semibold text-lg truncate"
                                    title={output.title}
                                >
                                    {truncateText(output.title, 50)}
                                </h3>
                            </div>
                            <div className="flex-shrink-0 ml-2">
                                {getStatusBadge(output.approved)}
                            </div>
                        </div>

                        {/* 基本信息行 */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground mb-3">
                            <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 flex-shrink-0"/>
                                <span>提交时间: {formatDateTime(output.createdAt)}</span>
                            </div>

                            <div className="flex items-center gap-2">
                                <Badge variant="outline" className="flex items-center gap-1">
                                    {getTypeIcon(output.type)}
                                    {getOutputTypeDisplayName(output.type)}
                                </Badge>
                            </div>

                        </div>
                        <div className=" text-sm text-muted-foreground mb-3">
                            {output.dataset && (
                                <div className="flex items-center gap-2">
                                    <Building className="h-4 w-4 flex-shrink-0"/>
                                    <span className="truncate" title={output.dataset.titleCn}>数据集: {truncateText(output.dataset.titleCn, 20)}</span>
                                </div>
                            )}
                        </div>

                        {/* 摘要 */}
                        {output.abstractText && (
                            <div className="mb-3">
                                <p className="text-sm text-muted-foreground line-clamp-3">
                                    {output.abstractText}
                                </p>
                            </div>
                        )}

                        {/* 其他关键信息预览 */}
                        <div className="flex flex-wrap gap-2 text-xs">
                            {output.outputNumber && (
                                <Badge variant="secondary" className="text-xs">
                                    编号: {truncateText(output.outputNumber, 15)}
                                </Badge>
                            )}

                            {output.otherInfo?.authors && (
                                <Badge variant="secondary" className="text-xs">
                                    作者: {truncateText(output.otherInfo.authors, 12)}
                                </Badge>
                            )}
                        </div>
                    </div>

                    {/* 操作按钮 */}
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        <div className="text-right text-sm text-muted-foreground whitespace-nowrap">
                            {output.approvedAt && (
                                <div className="text-xs">
                                    {output.approved === true ? '审核通过' : '审核拒绝'}: {formatDateTime(output.approvedAt)}
                                </div>
                            )}
                        </div>

                        <div className="flex gap-1">
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={(e) => handleOutputClick(output)}
                                        className="h-8 w-8 p-0"
                                    >
                                        <Eye className="h-4 w-4"/>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>查看详情</p>
                                </TooltipContent>
                            </Tooltip>

                            {/* 只有待审核状态的成果才显示编辑按钮 */}
                            {output.approved === null && (
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={(e) => handleEditClick(output, e)}
                                            className="h-8 w-8 p-0"
                                        >
                                            <Pencil className="h-4 w-4"/>
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>编辑成果</p>
                                    </TooltipContent>
                                </Tooltip>
                            )}

                            {hasDeletionPermission(output) && (
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={(e) => handleDeleteClick(output, e)}
                                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
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
            </CardContent>
        </Card>
    );

    const renderEmptyState = () => (
        <div className="text-center py-12 text-muted-foreground">
            <FileText className="h-16 w-16 mx-auto mb-4 opacity-50"/>
            <p className="text-lg font-medium mb-2">暂无研究成果</p>
            <p className="text-sm mb-6">您还没有提交任何研究成果</p>
            <Button onClick={handleAddOutput}>
                <Plus className="mr-2 h-4 w-4"/>
                提交新成果
            </Button>
        </div>
    );

    return (
        <TooltipProvider>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5"/>
                        我的研究成果
                    </CardTitle>
                    <Button onClick={handleAddOutput}>
                        <Plus className="mr-2 h-4 w-4"/>
                        提交新成果
                    </Button>
                </CardHeader>
                <CardContent>
                    <PaginatedList
                        ref={paginatedListRef}
                        fetchData={fetchUserOutputs}
                        renderItem={renderOutputItem}
                        renderEmptyState={renderEmptyState}
                        pageSize={10}
                    />
                </CardContent>

                <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>确认删除</AlertDialogTitle>
                            <AlertDialogDescription>
                                您确定要删除研究成果"{outputToDelete?.title}"吗？此操作无法撤销。
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

                <SubmitOutputDialog
                    open={submitDialogOpen}
                    onOpenChange={setSubmitDialogOpen}
                    onSubmit={handleOutputSubmitted}
                />

                <OutputDetailDialog
                    open={detailDialogOpen}
                    onOpenChange={setDetailDialogOpen}
                    output={selectedOutput}
                    managementMode={true}
                />

                <EditOutputDialog
                    open={editDialogOpen}
                    onOpenChange={setEditDialogOpen}
                    output={selectedOutput}
                    onEdit={handleOutputEdited}
                />
            </Card>
        </TooltipProvider>
    );
};

export default OutputsTab;