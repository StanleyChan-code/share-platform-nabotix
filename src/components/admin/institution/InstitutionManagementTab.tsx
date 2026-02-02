import {useState, useEffect, useCallback} from "react";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table.tsx";
import {Button} from "@/components/ui/button.tsx";
import {useToast} from "@/hooks/use-toast.ts";
import {
    CheckCircle,
    Clock,
    Plus,
    Loader2,
    Search,
    ChevronRightIcon,
    ChevronLeftIcon,
    X,
    Eye,
    EyeOff,
    Trash2,
    Edit
} from "lucide-react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog.tsx";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog.tsx";
import AddInstitutionForm from "@/components/admin/institution/AddInstitutionForm.tsx";
import {formatDate} from "@/lib/utils.ts";
import InstitutionProfileTab from "@/components/admin/institution/InstitutionProfileTab.tsx";
import {institutionApi, Institution} from "@/integrations/api/institutionApi.ts";
import ReactPaginate from "react-paginate";
import {InstitutionTypes} from "@/lib/enums.ts";
import {ApiResponse, Page} from "@/integrations/api/client";
import {useDebounce} from "@/hooks/useDebounce";
import {Input} from "@/components/ui/FormValidator.tsx";
import {getCurrentUserRolesFromSession} from "@/lib/authUtils";
import {PermissionRoles} from "@/lib/permissionUtils.ts";
import {ScrollArea} from "@radix-ui/react-scroll-area";

const InstitutionManagementTab = () => {
    const [showAddInstitutionForm, setShowAddInstitutionForm] = useState(false);
    const [selectedInstitution, setSelectedInstitution] = useState<Institution | null>(null);
    const [institutions, setInstitutions] = useState<Institution[]>([]);
    const [loading, setLoading] = useState(false);
    const [confirmDialog, setConfirmDialog] = useState({
        open: false,
        title: "",
        description: "",
        actionText: "",
        onConfirm: () => {},
        variant: "default" as "default" | "destructive"
    });
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [editInstitution, setEditInstitution] = useState<Institution | null>(null);
    const {toast} = useToast();

    // 分页相关状态
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const pageSize = 5;

    // 搜索相关状态
    const [searchTerm, setSearchTerm] = useState("");

    // 添加防抖处理，延迟550ms
    const debouncedSearchTerm = useDebounce(searchTerm, 550);

    // 获取机构列表
    const fetchInstitutions = useCallback(async (page: number = 0, searchName: string = "") => {
        try {
            setLoading(true);
            let response: ApiResponse<Page<Institution>>;

            // 否则获取所有机构列表（支持搜索和分页）
            if (searchName) {
                response = await institutionApi.searchInstitutions(searchName, page, pageSize);
            } else {
                response = await institutionApi.getAllInstitutionsForAdmin(page, pageSize);
            }
            if (response.success) {
                setInstitutions(response.data.content);
                setTotalPages(response.data.page.totalPages);
                setTotalElements(response.data.page.totalElements);
                setCurrentPage(page);
                setEditDialogOpen(false);
            } else {
                throw new Error(response.message || "获取机构列表失败");
            }
        } catch (error: any) {
            console.error("获取机构列表失败:", error);
            toast({
                title: "错误",
                description: error.message || "获取机构列表时发生错误",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchInstitutions(0);
    }, [fetchInstitutions]);

    // 监听防抖后的搜索值变化，执行搜索
    useEffect(() => {
        // 重置到第一页并使用防抖后的搜索值
        fetchInstitutions(0, debouncedSearchTerm);
    }, [debouncedSearchTerm, fetchInstitutions]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        // 由于使用了防抖，这里不需要额外操作，只需确保搜索值被更新
        // 防抖的useEffect会自动处理搜索
    };

    const handleInstitutionAdded = () => {
        // 重新获取机构数据
        fetchInstitutions(currentPage, debouncedSearchTerm);

        toast({
            title: "刷新数据",
            description: "机构列表已更新",
        });
    };

    const handlePageClick = (event: { selected: number }) => {
        const page = event.selected;
        fetchInstitutions(page, debouncedSearchTerm);
    };

    const handleVerifyInstitution = async (id: string, newStatus: boolean) => {
        try {
            const response = await institutionApi.verifyInstitution(id, newStatus);
            if (response.success) {
                toast({
                    title: "操作成功",
                    description: `机构${newStatus ? '公开' : '取消公开'}状态已更新`,
                });
                // 重新获取数据
                fetchInstitutions(currentPage, debouncedSearchTerm);
            } else {
                throw new Error(response.message || "更新机构公开状态失败");
            }
        } catch (error: any) {
            console.error('更新机构公开状态失败:', error);
            toast({
                title: "操作失败",
                description: error.message || `更新机构公开状态失败`,
                variant: "destructive",
            });
        }
    };

    const handleDeleteInstitution = async (id: string, fullName: string) => {
        try {
            const response = await institutionApi.deleteInstitution(id);
            if (response.success) {
                toast({
                    title: "删除成功",
                    description: "机构已成功删除",
                });
                // 重新获取数据
                fetchInstitutions(currentPage, debouncedSearchTerm);

                // 如果删除的是当前选中的机构，则清除选择
                if (selectedInstitution && selectedInstitution.id === id) {
                    setSelectedInstitution(null);
                }
            } else {
                throw new Error(response.message || "删除机构失败");
            }
        } catch (error: any) {
            console.error('删除机构失败:', error);
            toast({
                title: "删除失败",
                description: error.message || "删除机构失败",
                variant: "destructive",
            });
        }
    };

    const openVerifyDialog = (id: string, fullName: string, currentStatus: boolean, newStatus: boolean) => {
        setConfirmDialog({
            open: true,
            title: "确认修改公开状态",
            description: `确定要将机构 "<strong>${fullName}</strong>" 的状态从 "${currentStatus ? '公开' : '不公开'}" 修改为 "${newStatus ? '公开' : '不公开'}" 吗？`,
            actionText: "确认修改",
            onConfirm: () => handleVerifyInstitution(id, newStatus),
            variant: "default"
        });
    };

    const openDeleteDialog = (id: string, fullName: string) => {
        setConfirmDialog({
            open: true,
            title: "确认删除",
            description: `确定要删除机构 "<strong>${fullName}</strong>" 吗？此操作不可逆，请谨慎操作。`,
            actionText: "删除",
            onConfirm: () => handleDeleteInstitution(id, fullName),
            variant: "destructive"
        });
    };

    return (
        <div className="space-y-6">
            <AddInstitutionForm
                open={showAddInstitutionForm}
                onOpenChange={setShowAddInstitutionForm}
                onInstitutionAdded={handleInstitutionAdded}
            />
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1 max-w-md min-w-72">
                        <Search
                            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/>
                        <Input
                            placeholder="搜索机构名称..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                            maxLength={100}
                        />
                    </div>
                    <Button type="submit" className="w-full sm:w-auto">
                        搜索
                    </Button>
                </form>
                <Button
                    onClick={() => setShowAddInstitutionForm(true)}
                    className="gap-2 ml-auto"
                >
                    <Plus className="h-4 w-4"/>
                    添加机构
                </Button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin"/>
                </div>
            ) : (
                <>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>机构全称</TableHead>
                                <TableHead>机构类型</TableHead>
                                <TableHead>联系人</TableHead>
                                <TableHead>创建时间</TableHead>
                                <TableHead>状态</TableHead>
                                <TableHead>操作</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {institutions.map((institution) => {
                                const userRoles = getCurrentUserRolesFromSession();
                                const canVerify = userRoles.includes(PermissionRoles.PLATFORM_ADMIN) || userRoles.includes(PermissionRoles.INSTITUTION_SUPERVISOR);
                                const canDelete = userRoles.includes(PermissionRoles.PLATFORM_ADMIN);

                                return (
                                    <TableRow
                                        key={institution.id}
                                    >
                                        <TableCell className="font-medium">{institution.fullName}</TableCell>
                                        <TableCell>{InstitutionTypes[institution.type]}</TableCell>
                                        <TableCell>{institution.contactPerson}</TableCell>
                                        <TableCell>{formatDate(institution.createdAt)}</TableCell>
                                        <TableCell>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    openVerifyDialog(institution.id, institution.fullName, institution.verified, !institution.verified);
                                                }}
                                                disabled={!canVerify}
                                                className={institution.verified ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}
                                            ><span
                                                className={"inline-flex items-center justify-center gap-1 px-2 py-1 rounded-full text-xs font-medium min-w-20"}>
                                                    {institution.verified ? (
                                                        <><Eye className="h-4 w-4"/>公开</>
                                                    ) : (
                                                        <><EyeOff className="h-4 w-4"/>不公开</>
                                                    )}
                                                    </span>
                                            </Button>
                                        </TableCell>
                                        <TableCell>
                                                <div className="flex gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setEditInstitution(institution);
                                                            setEditDialogOpen(true);
                                                        }}
                                                        className="h-10 w-10 p-0"
                                                        title="修改机构"
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            openDeleteDialog(institution.id, institution.fullName);
                                                        }}
                                                        disabled={!canDelete}
                                                        className="h-10 w-10 p-0 text-red-600 hover:text-red-700"
                                                        title="删除机构"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                    </TableRow>
                                )
                            })}
                        </TableBody>
                    </Table>

                    {totalPages > 1 && (
                        <div className="mt-4 text-sm text-muted-foreground flex justify-between items-center">
                            <div>
                                共 {totalElements} 条记录
                            </div>
                            <ReactPaginate
                                breakLabel="..."
                                nextLabel={
                                    <span className="flex items-center gap-1">
                                                下一页 <ChevronRightIcon className="h-4 w-4"/>
                                            </span>
                                }
                                onPageChange={handlePageClick}
                                pageRangeDisplayed={3}
                                marginPagesDisplayed={1}
                                pageCount={totalPages}
                                previousLabel={
                                <span className="flex items-center gap-1">
                                    <ChevronLeftIcon className="h-4 w-4"/> 上一页
                                </span>
                                }
                                renderOnZeroPageCount={null}
                                containerClassName="flex items-center justify-center gap-2"
                                pageClassName=""
                                pageLinkClassName="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-700 transition-all duration-200 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-blue-500 dark:hover:bg-blue-900/20"
                                previousClassName=""
                                previousLinkClassName="flex h-10 items-center justify-center rounded-lg border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700 transition-all duration-200 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-600 disabled:hover:border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-blue-500 dark:hover:bg-blue-900/20"
                                nextClassName=""
                                nextLinkClassName="flex h-10 items-center justify-center rounded-lg border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700 transition-all duration-200 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-600 disabled:hover:border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-blue-500 dark:hover:bg-blue-900/20"
                                breakClassName=""
                                breakLinkClassName="flex h-10 w-10 items-center justify-center text-gray-500 dark:text-gray-400"
                                activeClassName=""
                                activeLinkClassName="!border-blue-500 !bg-blue-500 !text-white hover:!bg-blue-600 hover:!border-blue-600 dark:!border-blue-500 dark:!bg-blue-500"
                                disabledClassName="opacity-40 cursor-not-allowed"
                                disabledLinkClassName="hover:border-gray-200 hover:bg-white hover:text-gray-700 dark:hover:border-gray-700 dark:hover:bg-gray-800"
                                forcePage={currentPage}
                            />
                        </div>
                    )}
                </>
            )}

            <AlertDialog open={confirmDialog.open} onOpenChange={(open) => !open && setConfirmDialog(prev => ({...prev, open}))}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle dangerouslySetInnerHTML={{ __html: confirmDialog.title }} />
                        <AlertDialogDescription dangerouslySetInnerHTML={{ __html: confirmDialog.description }} />
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>取消</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={() => {
                                confirmDialog.onConfirm();
                                setConfirmDialog(prev => ({...prev, open: false}));
                            }}
                            className={confirmDialog.variant === "destructive" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
                        >
                            {confirmDialog.actionText}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>修改机构信息 - {editInstitution?.fullName}</DialogTitle>
                        <DialogDescription>
                            编辑机构的详细信息
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex-1 overflow-hidden overflow-y-auto max-h-[80vh]">
                        <ScrollArea className="h-full w-full pr-4">
                            <div className={"py-2"}>
                                {editInstitution && (
                                    <InstitutionProfileTab
                                        institutionId={editInstitution.id}
                                        onInstitutionUpdated={() => fetchInstitutions(currentPage, debouncedSearchTerm)}
                                    />
                                )}
                            </div>
                        </ScrollArea>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default InstitutionManagementTab;