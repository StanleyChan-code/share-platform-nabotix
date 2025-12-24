import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Edit, Building2, Mail, Phone, Calendar, GraduationCap, Briefcase, Shield, Hash } from "lucide-react";
import { useState, useEffect } from "react";
import { EducationLevels, ID_TYPES, InstitutionTypes } from "@/lib/enums";
import { formatDate } from "@/lib/utils.ts";
import { toast } from "sonner";
import { FormValidator, Input } from "@/components/ui/FormValidator";
import { Asterisk } from "lucide-react";
import {UserInfo} from "@/lib/authUtils.ts";
import {updateUserProfile} from "@/integrations/api/authApi.ts";

interface ProfileInfoProps {
  userProfile: UserInfo;
  onUpdateProfile: (formData: any) => void;
}

// 用户信息表单类型
interface EditFormData {
  username: string;
  realName: string;
  title: string;
  field: string;
  phone: string;
  email: string;
  education: string;
}

const ProfileInfo = ({ userProfile, onUpdateProfile }: ProfileInfoProps) => {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [editForm, setEditForm] = useState<EditFormData>({
    username: "",
    realName: "",
    title: "",
    field: "",
    phone: "",
    email: "",
    education: ""
  });

  // 表单验证状态
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [institution, setInstitution] = useState<any>(null);

  useEffect(() => {
    setInstitution(userProfile.institution);
  }, []);

  // 当对话框打开时，初始化表单数据
  useEffect(() => {
    if (isEditDialogOpen && userProfile) {
      setEditForm({
        username: userProfile.user.username || "",
        realName: userProfile.user.realName || "",
        title: userProfile.user.title || "",
        field: userProfile.user.field || "",
        phone: userProfile.user.phone || "",
        email: userProfile.user.email || "",
        education: userProfile.user.education || ""
      });
      setFormErrors({});
    }
  }, [isEditDialogOpen, userProfile]);

  // 验证表单
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // 用户名验证（必填）
    if (!editForm.username.trim()) {
      errors.username = "用户名不能为空";
    } else if (editForm.username.trim().length < 2) {
      errors.username = "用户名至少需要2个字符";
    } else if (editForm.username.trim().length > 50) {
      errors.username = "用户名不能超过50个字符";
    }

    // 真实姓名验证
    if (editForm.realName.trim().length > 100) {
      errors.realName = "真实姓名不能超过100个字符";
    }

    // 邮箱验证
    if (editForm.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(editForm.email.trim())) {
        errors.email = "请输入有效的邮箱地址";
      } else if (editForm.email.trim().length > 200) {
        errors.email = "邮箱地址不能超过200个字符";
      }
    }

    // 职称验证
    if (editForm.title.trim().length > 100) {
      errors.title = "职称不能超过100个字符";
    }

    // 专业领域验证
    if (editForm.field.trim().length > 200) {
      errors.field = "专业领域不能超过200个字符";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {

    if (!validateForm()) {
      return;
    }
    setUpdating(true);

    try {
      const response = await updateUserProfile({
        username: editForm.username,
        email: editForm.email,
        education: editForm.education ? editForm.education : null,
        field: editForm.field,
        title: editForm.title
      });

      if (response.data.success) {
        toast.success("个人信息更新成功");
        // 调用父组件传递的更新函数
        onUpdateProfile(editForm);
        setIsEditDialogOpen(false);
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

  // 对证件号码进行脱敏处理
  const maskIdNumber = (idType: string, idNumber: string): string => {
    if (!idNumber) return "未填写";

    switch (idType) {
      case 'NATIONAL_ID':
        // 身份证：显示前6位和后4位，中间用*代替
        return idNumber.replace(/(\d{6})\d+(\d{4})/, '$1******$2');
      case 'PASSPORT':
        // 护照：显示前2位和后2位，中间用*代替
        return idNumber.replace(/(.{2}).*(.{2})/, '$1******$2');
      default:
        // 其他类型：显示前1/3和后1/3，中间用*代替
        const showLength = Math.max(1, Math.floor(idNumber.length / 3));
        const regExp = new RegExp(`(.{${showLength}}).*?(.{${showLength}})$`);
        return idNumber.replace(regExp, `$1${'*'.repeat(Math.max(3, idNumber.length - showLength * 2))}$2`);
    }
  };

  // 信息项组件
  const InfoItem = ({
                      icon: Icon,
                      label,
                      value,
                      className = ""
                    }: {
    icon: any;
    label: string;
    value: string;
    className?: string;
  }) => (
      <div className={`flex items-start gap-3 py-3 ${className}`}>
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex-shrink-0">
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-muted-foreground mb-1">{label}</p>
          <p className="text-base font-medium truncate">{value || "未填写"}</p>
        </div>
      </div>
  );

  // 获取学历显示名称
  const getEducationDisplayName = (education: string): string => {
    return EducationLevels[education as keyof typeof EducationLevels] || education || "未填写";
  };

  // 获取证件类型显示名称
  const getIdTypeDisplayName = (idType: string): string => {
    return ID_TYPES[idType as keyof typeof ID_TYPES] || idType || "未填写";
  };

  // 获取机构类型显示名称
  const getInstitutionTypeDisplayName = (type: string): string => {
    return InstitutionTypes[type as keyof typeof InstitutionTypes] || type || "未填写";
  };

  if (!userProfile) {
    return (
        <div className="flex items-center justify-center py-12">
          <div className="text-center text-muted-foreground">
            <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>暂无用户信息</p>
          </div>
        </div>
    );
  }

  return (
      <div className="space-y-6">
        {/* 用户信息卡片 */}
        <Card className="overflow-hidden border-blue-100 shadow-sm">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-blue-100">
            <CardHeader className="p-0 flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-3 text-blue-900">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white shadow-sm">
                  <User className="h-5 w-5 text-blue-600" />
                </div>
                <span className="text-xl font-semibold">基本信息</span>
              </CardTitle>
              <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2 bg-white/80 hover:bg-white border-blue-200">
                    <Edit className="h-4 w-4" />
                    编辑信息
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="text-lg font-semibold">编辑个人信息</DialogTitle>
                    <DialogDescription className="text-sm text-muted-foreground">
                      更新您的个人资料信息
                    </DialogDescription>
                  </DialogHeader>

                  <FormValidator onSubmit={handleUpdateProfile} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-sm font-medium flex items-center gap-1">
                          联系电话
                        </Label>
                        <Input
                            id="phone"
                            value={editForm.phone}
                            disabled
                            readOnly
                            className="bg-muted/50"
                            maxLength={20}
                        />
                        <p className="text-xs text-muted-foreground">联系电话不可修改</p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="realName" className="text-sm font-medium flex items-center gap-1">
                          真实姓名
                        </Label>
                        <Input
                            id="realName"
                            value={editForm.realName}
                            disabled
                            readOnly
                            className="bg-muted/50"
                            maxLength={100}
                        />
                        <p className="text-xs text-muted-foreground">真实姓名不可修改</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="username" className="text-sm font-medium flex items-center gap-1">
                          用户名 <Asterisk className="h-3 w-3 text-red-500" />
                        </Label>
                        <Input
                            id="username"
                            name="username"
                            value={editForm.username}
                            onChange={(e) => setEditForm(prev => ({
                              ...prev,
                              username: e.target.value
                            }))}
                            className="focus:ring-2 focus:ring-blue-200"
                            maxLength={50}
                            placeholder="请输入用户名"
                            required
                            validationType="custom"
                            customValidation={(value) => {
                              if (!value.trim()) return "用户名不能为空";
                              if (value.trim().length < 2) return "用户名至少需要2个字符";
                              if (value.trim().length > 50) return "用户名不能超过50个字符";
                              return true;
                            }}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm font-medium flex items-center gap-1">
                          邮箱地址
                        </Label>
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            value={editForm.email}
                            onChange={(e) => setEditForm(prev => ({
                              ...prev,
                              email: e.target.value
                            }))}
                            className="focus:ring-2 focus:ring-blue-200"
                            maxLength={200}
                            placeholder="请输入邮箱地址"
                            validationType="email"
                            errorMessage="请输入有效的邮箱地址"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="education" className="text-sm font-medium">学历</Label>
                        <Select
                            value={editForm.education || ""}
                            onValueChange={(value) => setEditForm(prev => ({
                              ...prev,
                              education: value
                            }))}
                        >
                          <SelectTrigger className="focus:ring-2 focus:ring-blue-200">
                            <SelectValue placeholder="选择学历" />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(EducationLevels).map(([key, value]) => (
                                <SelectItem key={key} value={key}>
                                  {value}
                                </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="title" className="text-sm font-medium">职称</Label>
                        <Input
                            id="title"
                            name="title"
                            value={editForm.title}
                            onChange={(e) => setEditForm(prev => ({
                              ...prev,
                              title: e.target.value
                            }))}
                            className="focus:ring-2 focus:ring-blue-200"
                            maxLength={100}
                            placeholder="请输入职称"
                            validationType="custom"
                            customValidation={(value) => {
                              if (value.trim().length > 100) return "职称不能超过100个字符";
                              return true;
                            }}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="field" className="text-sm font-medium">专业领域</Label>
                      <Input
                          id="field"
                          name="field"
                          value={editForm.field}
                          onChange={(e) => setEditForm(prev => ({
                            ...prev,
                            field: e.target.value
                          }))}
                          className="focus:ring-2 focus:ring-blue-200"
                          maxLength={200}
                          placeholder="请输入专业领域"
                          validationType="custom"
                          customValidation={(value) => {
                            if (value.trim().length > 200) return "专业领域不能超过200个字符";
                            return true;
                          }}
                      />
                    </div>

                    <div className="flex justify-end space-x-2 pt-4">
                      <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsEditDialogOpen(false)}
                          disabled={updating}
                      >
                        取消
                      </Button>
                      <Button
                          type="submit"
                          disabled={updating}
                          className="bg-blue-600 hover:bg-blue-700 min-w-20"
                      >
                        {updating ? "保存中..." : "保存"}
                      </Button>
                    </div>
                  </FormValidator>
                </DialogContent>
              </Dialog>
            </CardHeader>
          </div>

          <CardContent className="p-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-1">
                <InfoItem
                    icon={Hash}
                    label="用户名"
                    value={userProfile.user.username}
                />
                <InfoItem
                    icon={User}
                    label="真实姓名"
                    value={userProfile.user.realName}
                />
                <InfoItem
                    icon={Shield}
                    label={userProfile.user.idType ? getIdTypeDisplayName(userProfile.user.idType) : "证件号码"}
                    value={userProfile.user.idNumber ? maskIdNumber(userProfile.user.idType, userProfile.user.idNumber) : ""}
                />
                <InfoItem
                    icon={GraduationCap}
                    label="学历"
                    value={getEducationDisplayName(userProfile.user.education)}
                />
                <InfoItem
                    icon={Briefcase}
                    label="职称"
                    value={userProfile.user.title}
                />
              </div>

              <div className="space-y-1">
                <InfoItem
                    icon={Briefcase}
                    label="专业领域"
                    value={userProfile.user.field}
                />
                <InfoItem
                    icon={Building2}
                    label="所属机构"
                    value={institution?.fullName || "未分配"}
                />
                <InfoItem
                    icon={Phone}
                    label="联系电话"
                    value={userProfile.user.phone}
                />
                <InfoItem
                    icon={Mail}
                    label="邮箱地址"
                    value={userProfile.user.email}
                />
                <InfoItem
                    icon={Calendar}
                    label="注册日期"
                    value={userProfile.user.createdAt ? formatDate(userProfile.user.createdAt) : ""}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 机构详细信息卡片 */}
        {institution && (
            <Card className="overflow-hidden border-green-100 shadow-sm">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-green-100">
                <CardHeader className="p-0">
                  <CardTitle className="flex items-center gap-3 text-green-900">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white shadow-sm">
                      <Building2 className="h-5 w-5 text-green-600" />
                    </div>
                    <span className="text-xl font-semibold">所属机构</span>
                  </CardTitle>
                </CardHeader>
              </div>
              <CardContent className="p-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-1">
                    <InfoItem
                        icon={Building2}
                        label="机构全称"
                        value={institution.fullName}
                    />
                    <InfoItem
                        icon={Building2}
                        label="机构简称"
                        value={institution.shortName || "未填写"}
                    />
                    <InfoItem
                        icon={Building2}
                        label="机构类型"
                        value={getInstitutionTypeDisplayName(institution.type)}
                    />
                  </div>

                  <div className="space-y-1">
                    <InfoItem
                        icon={User}
                        label="联系人"
                        value={institution.contactPerson || "未填写"}
                    />
                    <InfoItem
                        icon={Phone}
                        label="联系电话"
                        value={institution.contactPhone || "未填写"}
                    />
                    <InfoItem
                        icon={Mail}
                        label="联系邮箱"
                        value={institution.contactEmail || "未填写"}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
        )}
      </div>
  );
};

export default ProfileInfo;