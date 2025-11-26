import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Edit, Building2 } from "lucide-react";
import { useState, useEffect } from "react";

interface ProfileInfoProps {
  userProfile: any;
  institutions: any;
  user: any;
  educationLabels: Record<string, string>;
  onUpdateProfile: (formData: any) => void;
}

const ProfileInfo = ({ userProfile, institutions, user, educationLabels, onUpdateProfile }: ProfileInfoProps) => {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [editForm, setEditForm] = useState({
    username: "",
    real_name: "",
    title: "",
    field: "",
    phone: "",
    email: "",
    education: ""
  });

  // 当 userProfile 改变时，更新表单初始值
  useEffect(() => {
    if (userProfile) {
      setEditForm({
        username: userProfile.username || "",
        real_name: userProfile.real_name || "",
        title: userProfile.title || "",
        field: userProfile.field || "",
        phone: userProfile.phone || "",
        email: userProfile.email || "",
        education: userProfile.education || ""
      });
    }
  }, [userProfile]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    
    // 调用父组件传递的更新函数
    onUpdateProfile(editForm);
    
    setUpdating(false);
    setIsEditDialogOpen(false);
  };

  // 机构类型标签
  const institutionTypeLabels = {
    hospital: "医院",
    university: "大学",
    research_center: "研究中心",
    lab: "实验室",
    government: "政府机构",
    enterprise: "企业",
    other: "其他"
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            基本信息
          </CardTitle>
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Edit className="h-4 w-4" />
                编辑
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>编辑个人信息</DialogTitle>
                <DialogDescription/>
              </DialogHeader>

              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">用户名</Label>
                    <Input
                      id="username"
                      required={true}
                      value={editForm.username}
                      onChange={(e) => setEditForm(prev => ({
                        ...prev,
                        username: e.target.value
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="real_name">真实姓名</Label>
                    <Input
                      id="real_name"
                      value={editForm.real_name}
                      onChange={(e) => setEditForm(prev => ({
                        ...prev,
                        real_name: e.target.value
                      }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="education">学历</Label>
                    <Select 
                      value={editForm.education || undefined}
                      onValueChange={(value) => setEditForm(prev => ({
                        ...prev,
                        education: value || ""
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="选择学历" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bachelor">本科</SelectItem>
                        <SelectItem value="master">硕士</SelectItem>
                        <SelectItem value="phd">博士</SelectItem>
                        <SelectItem value="postdoc">博士后</SelectItem>
                        <SelectItem value="professor">教授</SelectItem>
                        <SelectItem value="other">其他</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="title">职称</Label>
                    <Input
                      id="title"
                      value={editForm.title}
                      onChange={(e) => setEditForm(prev => ({
                        ...prev,
                        title: e.target.value
                      }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="field">专业领域</Label>
                  <Input
                    id="field"
                    value={editForm.field}
                    onChange={(e) => setEditForm(prev => ({
                      ...prev,
                      field: e.target.value
                    }))}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">联系电话</Label>
                    <Input
                      id="phone"
                      value={editForm.phone}
                      onChange={(e) => setEditForm(prev => ({
                        ...prev,
                        phone: e.target.value
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">邮箱地址</Label>
                    <Input
                      id="email"
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm(prev => ({
                        ...prev,
                        email: e.target.value
                      }))}
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                    取消
                  </Button>
                  <Button type="submit" disabled={updating}>
                    {updating ? "保存中..." : "保存"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                <Label className="text-muted-foreground">用户名</Label>
                <div className="col-span-2">{userProfile?.username}</div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Label className="text-muted-foreground">真实姓名</Label>
                <div className="col-span-2">{userProfile?.real_name}</div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Label className="text-muted-foreground">身份证号</Label>
                <div className="col-span-2">
                  {userProfile?.id_number?
                      userProfile?.id_number?.replace(/(\d{6})\d*(\d{4})/, '$1****$2') : "未填写"}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Label className="text-muted-foreground">学历</Label>
                <div className="col-span-2">
                  {userProfile?.education ? (educationLabels[userProfile.education as keyof typeof educationLabels] || userProfile.education) : "未填写"}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Label className="text-muted-foreground">职称</Label>
                <div className="col-span-2">{userProfile?.title || "未填写"}</div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                <Label className="text-muted-foreground">专业领域</Label>
                <div className="col-span-2">{userProfile?.field || "未填写"}</div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Label className="text-muted-foreground">所属机构</Label>
                <div className="col-span-2">{institutions?.full_name || "无"}</div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Label className="text-muted-foreground">联系电话</Label>
                <div className="col-span-2">{userProfile?.phone || "未填写"}</div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Label className="text-muted-foreground">邮箱地址</Label>
                <div className="col-span-2">{userProfile?.email || user?.email}</div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Label className="text-muted-foreground">注册时间</Label>
                <div className="col-span-2">
                  {userProfile?.created_at ? new Date(userProfile.created_at).toLocaleDateString() : ""}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 机构详细信息卡片 */}
      {userProfile.institution_id && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              所属机构
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-2">
                  <Label className="text-muted-foreground">机构全称</Label>
                  <div className="col-span-2">{institutions?.full_name || "未填写"}</div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Label className="text-muted-foreground">机构简称</Label>
                  <div className="col-span-2">{institutions?.short_name || "未填写"}</div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Label className="text-muted-foreground">机构类型</Label>
                  <div className="col-span-2">
                    {institutions?.type ? (institutionTypeLabels[institutions.type as keyof typeof institutionTypeLabels] || institutions.type) : "未填写"}
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-2">
                  <Label className="text-muted-foreground">联系人</Label>
                  <div className="col-span-2">{institutions?.contact_person || "未填写"}</div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Label className="text-muted-foreground">联系电话</Label>
                  <div className="col-span-2">{institutions?.contact_phone || "未填写"}</div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Label className="text-muted-foreground">联系邮箱</Label>
                  <div className="col-span-2">{institutions?.contact_email || "未填写"}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProfileInfo;