import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Edit, Building2 } from "lucide-react";
import { useState, useEffect } from "react";
import { EducationLevels, InstitutionTypes } from "@/lib/enums";
import {Institution} from "@/integrations/api/institutionApi.ts";

// 证件类型映射
const ID_TYPE_DISPLAY_NAMES: Record<string, string> = {
  NATIONAL_ID: "身份证",
  PASSPORT: "护照",
  OTHER: "其他证件"
};

interface ProfileInfoProps {
  userProfile: any;
  institution: Institution;
  user: any;
  educationLabels: Record<string, string>;
  onUpdateProfile: (formData: any) => void;
}

const ProfileInfo = ({ userProfile, institution, user, educationLabels, onUpdateProfile }: ProfileInfoProps) => {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [editForm, setEditForm] = useState({
    username: "",
    realName: "",
    title: "",
    field: "",
    phone: "",
    email: "",
    education: ""
  });

  // 当对话框打开时，初始化表单数据
  useEffect(() => {
    if (isEditDialogOpen && userProfile) {
      setEditForm({
        username: userProfile.username || null,
        realName: userProfile.realName || "",
        title: userProfile.title || null,
        field: userProfile.field || null,
        phone: userProfile.phone || "",
        email: userProfile.email || null,
        education: userProfile.education || null
      });
    }
  }, [isEditDialogOpen, userProfile]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 验证用户名不为空
    if (!editForm.username || editForm.username.trim() === "") {
      alert("用户名不能为空");
      return;
    }
    
    setUpdating(true);
    
    try {
      // 调用父组件传递的更新函数
      onUpdateProfile(editForm);
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error("更新失败:", error);
    } finally {
      setUpdating(false);
    }
  };

  // 机构类型标签
  const institutionTypeLabels = InstitutionTypes;

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
                    <Label htmlFor="phone">联系电话</Label>
                    <Input
                        id="phone"
                        value={editForm.phone}
                        disabled
                        readOnly
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="realName">真实姓名</Label>
                    <Input
                      id="realName"
                      value={editForm.realName}
                      disabled
                      readOnly
                    />
                  </div>
                </div>
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
                        <SelectItem value="BACHELOR">本科</SelectItem>
                        <SelectItem value="MASTER">硕士</SelectItem>
                        <SelectItem value="PHD">博士</SelectItem>
                        <SelectItem value="POSTDOC">博士后</SelectItem>
                        <SelectItem value="PROFESSOR">教授</SelectItem>
                        <SelectItem value="OTHER">其他</SelectItem>
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
                <div className="col-span-2">{userProfile?.username || "未填写"}</div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Label className="text-muted-foreground">真实姓名</Label>
                <div className="col-span-2">{userProfile?.realName || "未填写"}</div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Label className="text-muted-foreground">
                  {userProfile?.idType ? (ID_TYPE_DISPLAY_NAMES[userProfile.idType] || "证件号码") : "证件号码"}
                </Label>
                <div className="col-span-2">
                  {userProfile?.idNumber ?
                    (() => {
                      // 根据证件类型进行不同程度的脱敏处理
                      switch (userProfile.idType) {
                        case 'NATIONAL_ID':
                          // 身份证：显示前6位和后4位，中间用*代替
                          return userProfile.idNumber.replace(/(\d)\d*(\d)/, '$1****************$2');
                        case 'PASSPORT':
                          // 护照：显示前2位和后2位，中间用*代替
                          return userProfile.idNumber.replace(/(.{2}).*(.{2})/, '$1******$2');
                        default:
                          // 其他类型：显示前1/3和后1/3，中间用*代替
                          const showLength = Math.max(1, Math.floor(userProfile.idNumber.length / 3));
                          const regExp = new RegExp(`(.{${showLength}}).*?(.{${showLength}})$`);
                          return userProfile.idNumber.replace(regExp, `$1${'*'.repeat(Math.max(3, userProfile.idNumber.length - showLength * 2))}$2`);
                      }
                    })()
                    : "未填写"}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Label className="text-muted-foreground">学历</Label>
                <div className="col-span-2">
                  {userProfile?.education ? (EducationLevels[userProfile.education as keyof typeof EducationLevels] || userProfile.education) : "未填写"}
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
                <div className="col-span-2">{institution?.fullName || "无"}</div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Label className="text-muted-foreground">联系电话</Label>
                <div className="col-span-2">{userProfile?.phone || "未填写"}</div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Label className="text-muted-foreground">邮箱地址</Label>
                <div className="col-span-2">{userProfile?.email || user?.email || "未填写"}</div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Label className="text-muted-foreground">注册时间</Label>
                <div className="col-span-2">
                  {userProfile?.createdAt ? new Date(userProfile.createdAt).toLocaleDateString() : "未填写"}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 机构详细信息卡片 */}
      {userProfile?.institutionId && (
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
                  <div className="col-span-2">{institution?.fullName || "未填写"}</div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Label className="text-muted-foreground">机构简称</Label>
                  <div className="col-span-2">{institution?.shortName || "未填写"}</div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Label className="text-muted-foreground">机构类型</Label>
                  <div className="col-span-2">
                    {institution?.type ? (InstitutionTypes[institution.type as keyof typeof InstitutionTypes] || institution.type) : "未填写"}
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-2">
                  <Label className="text-muted-foreground">联系人</Label>
                  <div className="col-span-2">{institution?.contactPhone || "未填写"}</div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Label className="text-muted-foreground">联系电话</Label>
                  <div className="col-span-2">{institution?.contactPhone || "未填写"}</div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Label className="text-muted-foreground">联系邮箱</Label>
                  <div className="col-span-2">{institution?.contactEmail || "未填写"}</div>
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