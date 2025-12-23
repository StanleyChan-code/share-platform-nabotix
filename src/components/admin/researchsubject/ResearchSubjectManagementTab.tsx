import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/integrations/api/client";
import { Plus, Edit, Trash2, Save, X } from "lucide-react";

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
  const { toast } = useToast();

  // 获取所有研究学科
  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const response = await api.get<ResearchSubject[]>("/manage/research-subjects");
      setSubjects(response.data.data);
    } catch (error) {
      console.error("获取研究学科失败:", error);
      toast({
        title: "错误",
        description: "获取研究学科列表失败",
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
      await api.delete(`/manage/research-subjects/${id}`);
      toast({
        title: "删除成功",
        description: "研究学科已成功删除"
      });
      fetchSubjects();
    } catch (error) {
      console.error("删除研究学科失败:", error);
      toast({
        title: "删除失败",
        description: "删除研究学科时发生错误",
        variant: "destructive"
      });
    }
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast({
        title: "表单验证失败",
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
        
        toast({
          title: "更新成功",
          description: "研究学科已成功更新"
        });
      } else {
        // 创建研究学科
        const response = await api.post("/manage/research-subjects", {
          name: formData.name,
          nameEn: formData.nameEn,
          description: formData.description,
          active: formData.active
        });
        
        toast({
          title: "创建成功",
          description: "研究学科已成功创建"
        });
      }
      
      setDialogOpen(false);
      fetchSubjects();
    } catch (error) {
      console.error("保存研究学科失败:", error);
      toast({
        title: "保存失败",
        description: "保存研究学科时发生错误",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>研究学科管理</CardTitle>
              <CardDescription>平台中所有研究学科的列表</CardDescription>
            </div>
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4" />
              新增学科
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>名称</TableHead>
                  <TableHead>英文名称</TableHead>
                  <TableHead>描述</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subjects.map((subject) => (
                  <TableRow key={subject.id}>
                    <TableCell className="font-medium">{subject.name}</TableCell>
                    <TableCell>{subject.nameEn || "-"}</TableCell>
                    <TableCell>{subject.description || "-"}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        subject.active 
                          ? "bg-green-100 text-green-800" 
                          : "bg-red-100 text-red-800"
                      }`}>
                        {subject.active ? "启用" : "禁用"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(subject)}
                        >
                          <Edit className="h-4 w-4" />
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
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
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
                  placeholder="请输入研究学科名称"
                  maxLength={200}
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
                  placeholder="请输入英文名称"
                  maxLength={200}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                描述
              </Label>
              <div className="col-span-3">
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="请输入描述"
                  rows={3}
                  maxLength={1000}
                />
              </div>
            </div>
            
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
              <X className="mr-2 h-4 w-4" />
              取消
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                  保存中...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  保存
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ResearchSubjectManagementTab;