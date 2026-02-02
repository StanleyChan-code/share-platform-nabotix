import {useState, useEffect} from "react";
import {Button} from "@/components/ui/button";
import {Label} from "@/components/ui/label";
import {Switch} from "@/components/ui/switch";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
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
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";
import {useToast} from "@/hooks/use-toast";
import {api} from "@/integrations/api/client";
import {Plus, Edit, Save, X, Eye, EyeOff} from "lucide-react";
import {Input} from "@/components/ui/FormValidator.tsx";

interface ResearchSubject {
    id: string;
    name: string;
    nameEn: string;
    description: string;
    active: boolean;
    createdAt: string;
    updatedAt: string;
}

const ResearchSubjectManagementTab = () => {
    const [subjects, setSubjects] = useState<ResearchSubject[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingSubject, setEditingSubject] = useState<ResearchSubject | null>(null);
    const [formData, setFormData] = useState({
        name: "",
        nameEn: "",
        description: "",
        active: true
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [confirmDialog, setConfirmDialog] = useState({
        open: false,
        title: "",
        description: "",
        actionText: "",
        onConfirm: () => {},
        variant: "default" as "default" | "destructive"
    });
    const {toast} = useToast();

    // 获取所有研究学科
    const fetchSubjects = async () => {
        try {
            setLoading(true);
            const response = await api.get<ResearchSubject[]>("/manage/research-subjects");
            if (response.data.success) {
                setSubjects(response.data.data);
            } else {
                throw new Error(response.data.message || "获取研究学科列表失败");
            }
        } catch (error: any) {
            console.error("获取研究学科失败:", error);
            toast({
                title: "错误",
                description: error.message || "获取研究学科列表失败",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSubjects();
    }, []);

    const handleCreate = () => {
        setEditingSubject(null);
        setFormData({
            name: "",
            nameEn: "",
            description: "",
            active: true
        });
        setDialogOpen(true);
    };

    const handleEdit = (subject: ResearchSubject) => {
        setEditingSubject(subject);
        setFormData({
            name: subject.name,
            nameEn: subject.nameEn || "",
            description: subject.description,
            active: subject.active
        });
        setDialogOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("确定要删除这个研究学科吗？")) return;

        try {
            const response = await api.delete(`/manage/research-subjects/${id}`);
            if (response.data.success) {
                toast({
                    title: "删除成功",
                    description: "研究学科已成功删除"
                });
                fetchSubjects();
            } else {
                throw new Error(response.data.message || "删除研究学科失败");
            }
        } catch (error: any) {
            console.error("删除研究学科失败:", error);
            toast({
                title: "删除失败",
                description: error.message || "删除研究学科时发生错误",
                variant: "destructive"
            });
        }
    };

    const handleSubmit = async () => {
        if (!formData.name.trim()) {
            toast({
                title: "填写检查错误",
                description: "请填写研究学科名称",
                variant: "destructive"
            });
            return;
        }

        try {
            setIsSubmitting(true);

            if (editingSubject) {
                // 更新研究学科
                const response = await api.put(`/manage/research-subjects/${editingSubject.id}`, {
                    name: formData.name,
                    nameEn: formData.nameEn,
                    description: formData.description,
                    active: formData.active
                });

                if (response.data.success) {
                    toast({
                        title: "更新成功",
                        description: "研究学科已成功更新"
                    });
                } else {
                    throw new Error(response.data.message || "更新研究学科失败");
                }
            } else {
                // 创建研究学科
                const response = await api.post("/manage/research-subjects", {
                    name: formData.name,
                    nameEn: formData.nameEn,
                    description: formData.description,
                    active: formData.active
                });

                if (response.data.success) {
                    toast({
                        title: "创建成功",
                        description: "研究学科已成功创建"
                    });
                } else {
                    throw new Error(response.data.message || "创建研究学科失败");
                }
            }

            setDialogOpen(false);
            fetchSubjects();
        } catch (error: any) {
            console.error("保存研究学科失败:", error);
            toast({
                title: "保存失败",
                description: error.message || "保存研究学科时发生错误",
                variant: "destructive"
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        setDialogOpen(false);
    };

    const handleToggleActive = async (id: string, newStatus: boolean) => {
        try {
            // 查找对应的学科以获取完整数据
            const subject = subjects.find(s => s.id === id);
            if (!subject) {
                toast({
                    title: "操作失败",
                    description: "未找到指定学科",
                    variant: "destructive",
                });
                return;
            }

            // 更新研究学科的启用状态，提交完整数据
            const response = await api.put(`/manage/research-subjects/${id}`, {
                name: subject.name,
                nameEn: subject.nameEn,
                description: subject.description,
                active: newStatus
            });

            if (response.data.success) {
                toast({
                    title: "操作成功",
                    description: `学科已${newStatus ? '启用' : '禁用'}`,
                });
                fetchSubjects();
            } else {
                throw new Error(response.data.message || "更新学科状态失败");
            }
        } catch (error: any) {
            console.error('更新学科状态失败:', error);
            toast({
                title: "操作失败",
                description: error.message || `更新学科状态失败`,
                variant: "destructive",
            });
        }
    };

    const openToggleActiveDialog = (id: string, name: string, currentStatus: boolean, newStatus: boolean) => {
        setConfirmDialog({
            open: true,
            title: "确认修改启用状态",
            description: `确定要将学科 "<strong>${name}</strong>" 的状态从 "${currentStatus ? '启用' : '禁用'}" 修改为 "${newStatus ? '启用' : '禁用'}" 吗？`,
            actionText: "确认修改",
            onConfirm: () => handleToggleActive(id, newStatus),
            variant: "default"
        });
    };

    return (
        <div className="space-y-6">
            {loading ? (
                <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            ) : (
                <>
                    <div className="flex justify-end">
                        <Button onClick={handleCreate}>
                            <Plus className="h-4 w-4" />
                            新增学科
                        </Button>
                    </div>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>名称</TableHead>
                                <TableHead>英文名称</TableHead>
                                {/*<TableHead>描述</TableHead>*/}
                                <TableHead>状态</TableHead>
                                <TableHead>操作</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {subjects.map((subject) => (
                                <TableRow key={subject.id}>
                                    <TableCell className="font-medium">{subject.name}</TableCell>
                                    <TableCell>{subject.nameEn || "-"}</TableCell>
                                    {/*<TableCell className="whitespace-pre-wrap break-all">{subject.description || "-"}</TableCell>*/}
                                    <TableCell>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => openToggleActiveDialog(subject.id, subject.name, subject.active, !subject.active)}
                                            className={subject.active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                                        ><span className={"inline-flex items-center justify-center h-10 gap-1 px-2 py-1 rounded-full text-xs font-medium min-w-20"}>
                                            {subject.active ? (
                                                <><Eye className="h-4 w-4" />启用</>
                                            ) : (
                                                <><EyeOff className="h-4 w-4" />禁用</>
                                            )}
                                            </span>
                                        </Button>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex space-x-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-10"
                                                onClick={() => handleEdit(subject)}
                                            >
                                                <Edit className="h-4 w-4"/>
                                            </Button>
                                            {/*<Button*/}
                                            {/*  variant="outline"*/}
                                            {/*  size="sm"*/}
                                            {/*  onClick={() => handleDelete(subject.id)}*/}
                                            {/*>*/}
                                            {/*  <Trash2 className="h-4 w-4" />*/}
                                            {/*</Button>*/}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </>
            )}

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent 
                    className="max-w-2xl"
                    onInteractOutside={(e) => e.preventDefault()}
                >
                    <DialogHeader>
                        <DialogTitle>
                            {editingSubject ? "编辑研究学科" : "创建研究学科"}
                        </DialogTitle>
                        <DialogDescription>
                            {editingSubject
                                ? "修改研究学科的信息"
                                : "添加一个新的研究学科"}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">
                                名称 *
                            </Label>
                            <div className="col-span-3">
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                    placeholder="请输入研究学科名称（必填，建议不要过长）"
                                    maxLength={30}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="nameEn" className="text-right">
                                英文名称
                            </Label>
                            <div className="col-span-3">
                                <Input
                                    id="nameEn"
                                    value={formData.nameEn}
                                    onChange={(e) => setFormData({...formData, nameEn: e.target.value})}
                                    placeholder="请输入英文名称（选填）"
                                    maxLength={200}
                                />
                            </div>
                        </div>

                        {/*<div className="grid grid-cols-4 items-center gap-4">*/}
                        {/*    <Label htmlFor="description" className="text-right">*/}
                        {/*        描述*/}
                        {/*    </Label>*/}
                        {/*    <div className="col-span-3">*/}
                        {/*        <Textarea*/}
                        {/*            id="description"*/}
                        {/*            value={formData.description}*/}
                        {/*            onChange={(e) => setFormData({...formData, description: e.target.value})}*/}
                        {/*            placeholder="请输入描述（选填）"*/}
                        {/*            rows={3}*/}
                        {/*            maxLength={1000}*/}
                        {/*        />*/}
                        {/*    </div>*/}
                        {/*</div>*/}

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="active" className="text-right">
                                状态
                            </Label>
                            <div className="col-span-3 flex items-center">
                                <Switch
                                    id="active"
                                    checked={formData.active}
                                    onCheckedChange={(checked) => setFormData({...formData, active: checked})}
                                />
                                <span className="ml-2 text-sm">
                  {formData.active ? "启用" : "禁用"}
                </span>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={handleCancel} disabled={isSubmitting}>
                            <X className="mr-2 h-4 w-4"/>
                            取消
                        </Button>
                        <Button onClick={handleSubmit} disabled={isSubmitting}>
                            {isSubmitting ? (
                                <>
                                    <div
                                        className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                                    保存中...
                                </>
                            ) : (
                                <>
                                    <Save className="mr-2 h-4 w-4"/>
                                    保存
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

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
        </div>
    );
};

export default ResearchSubjectManagementTab;