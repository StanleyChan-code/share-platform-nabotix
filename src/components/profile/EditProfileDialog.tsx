import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormValidator, Input } from "@/components/ui/FormValidator";
import { EducationLevels } from "@/lib/enums";
import { Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { updateUserProfile } from "@/integrations/api/authApi.ts";
import { toast } from "sonner";
import RelatedUsersDialog from "@/components/profile/RelatedUsersDialog";
import { userApi } from "@/integrations/api/userApi";
import { RelatedUsersDto } from "@/integrations/api/userApi";

interface EditFormData {
  realName: string;
  phone: string;
  title: string;
  field: string;
  email: string;
  education: string;
}

interface EditProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userProfile: any;
  onUpdateSuccess: (formData: EditFormData) => void;
}

const EditProfileDialog = ({ open, onOpenChange, userProfile, onUpdateSuccess }: EditProfileDialogProps) => {
  const [updating, setUpdating] = useState(false);
  const [editForm, setEditForm] = useState<EditFormData>({
    realName: "",
    title: "",
    field: "",
    phone: "",
    email: "",
    education: ""
  });
  // 管理员列表对话框相关状态
  const [isRelatedUsersDialogOpen, setIsRelatedUsersDialogOpen] = useState(false);
  const [relatedUsers, setRelatedUsers] = useState<RelatedUsersDto | null>(null);
  const [relatedUsersLoading, setRelatedUsersLoading] = useState(false);

  // 当对话框打开时，初始化表单数据
  useEffect(() => {
    if (open && userProfile) {
      setEditForm({
        realName: userProfile.user.realName || "",
        phone: userProfile.user.phone || "",
        title: userProfile.user.title || "",
        field: userProfile.user.field || "",
        email: userProfile.user.email || "",
        education: userProfile.user.education || ""
      });
    }
  }, [open, userProfile]);

  // 获取机构相关用户信息
  const fetchRelatedUsers = async () => {
    setRelatedUsersLoading(true);
    try {
      const dataResponse = await userApi.getInstitutionRelatedUsers();
      setRelatedUsers(dataResponse.data);
    } catch (error: any) {
      console.error("获取机构相关用户失败:", error);
      toast.error("获取管理员列表失败: " + (error.response?.data?.message || error.message || "未知错误"));
    } finally {
      setRelatedUsersLoading(false);
    }
  };

  // 当管理员列表对话框打开时，获取相关用户数据
  useEffect(() => {
    if (isRelatedUsersDialogOpen) {
      fetchRelatedUsers();
    }
  }, [isRelatedUsersDialogOpen]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    setUpdating(true);

    try {
      const response = await updateUserProfile({
        email: editForm.email,
        education: editForm.education ? editForm.education : null,
        field: editForm.field,
        title: editForm.title
      });

      if (response.data.success) {
        toast.success("个人信息更新成功");
        // 调用父组件传递的更新函数
        onUpdateSuccess(editForm);
        onOpenChange(false);
      } else {
        throw new Error(response.data.message || "更新失败");
      }
    } catch (error: any) {
      console.error("更新失败:", error);
      toast.error("更新失败: " + (error.response?.data?.message || error.message || "未知错误"));
    } finally {
      setUpdating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>编辑个人信息</DialogTitle>
          <DialogDescription>
                <p className="text-xs text-muted-foreground mt-1">如需修改手机号、姓名、身份信息，
                  <Button variant={"link"} className={"text-blue-500 hover:underline p-0 h-auto text-xs"}
                          onClick={() => setIsRelatedUsersDialogOpen(true)}
                  >请联系管理员</Button>
                </p>
              </DialogDescription>
        </DialogHeader>
        <FormValidator
            onSubmit={handleUpdateProfile}
            className="space-y-4"
        >
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 py-4">
            <div className="space-y-2">
              <Label htmlFor="realName">姓名</Label>
              <div className="relative">
                <Input
                    id="realName"
                    name="realName"
                    value={editForm.realName}
                    disabled
                    className="bg-gray-50 cursor-not-allowed"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">联系电话</Label>
              <div className="relative">
                <Input
                    id="phone"
                    name="phone"
                    value={editForm.phone}
                    disabled
                    className="bg-gray-50 cursor-not-allowed"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">邮箱</Label>
              <Input
                  id="email"
                  name="email"
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  placeholder="请输入邮箱地址"
                  disabled={updating}
                  validationType="email"
                  errorMessage="请输入有效的邮箱地址"
                  maxLength={200}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="education">学历</Label>
              <Select
                  value={editForm.education}
                  onValueChange={(value) => setEditForm({ ...editForm, education: value })}
                  disabled={updating}
              >
                <SelectTrigger>
                  <SelectValue placeholder="请选择学历" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(EducationLevels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">职称</Label>
              <Input
                  id="title"
                  name="title"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  placeholder="请输入职称"
                  disabled={updating}
                  maxLength={100}
                  validationType="custom"
                  customValidation={(value) => {
                    return value.trim().length <= 100;
                  }}
                  errorMessage="职称不能超过100个字符"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="field">专业领域</Label>
              <Input
                  id="field"
                  name="field"
                  value={editForm.field}
                  onChange={(e) => setEditForm({ ...editForm, field: e.target.value })}
                  placeholder="请输入专业领域"
                  disabled={updating}
                  maxLength={200}
                  validationType="custom"
                  customValidation={(value) => {
                    return value.trim().length <= 200;
                  }}
                  errorMessage="专业领域不能超过200个字符"
              />
            </div>

          </div>

          <div className="flex justify-end gap-2">
            <Button
                type="button"
                variant="secondary"
                onClick={() => onOpenChange(false)}
                disabled={updating}
            >
              取消
            </Button>
            <Button
                type="submit"
                variant="default"
                disabled={updating}
            >
              {updating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    保存中...
                  </>
              ) : (
                  "保存修改"
              )}
            </Button>
          </div>
        </FormValidator>
      </DialogContent>

      {/* 管理员列表对话框 */}
      <RelatedUsersDialog
          open={isRelatedUsersDialogOpen}
          onOpenChange={setIsRelatedUsersDialogOpen}
          relatedUsers={relatedUsers}
          loading={relatedUsersLoading}
      />
    </Dialog>
  );
};

export default EditProfileDialog;