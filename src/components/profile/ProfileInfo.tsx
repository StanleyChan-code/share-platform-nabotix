import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Edit, Building2, Mail, Phone, Calendar, GraduationCap, Briefcase, Shield, Hash } from "lucide-react";
import { useState, useEffect } from "react";
import {EducationLevels, ID_TYPES, InstitutionTypes} from "@/lib/enums";
import {Institution} from "@/integrations/api/institutionApi.ts";
import {formatDate} from "@/lib/utils.ts";

interface ProfileInfoProps {
  userProfile: any;
  institution: Institution;
  onUpdateProfile: (formData: any) => void;
}

const ProfileInfo = ({ userProfile, institution, onUpdateProfile }: ProfileInfoProps) => {
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

  // 信息项组件
  const InfoItem = ({ icon: Icon, label, value, className = "" }: {
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
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-lg font-semibold">编辑个人信息</DialogTitle>
                    <DialogDescription className="text-sm text-muted-foreground">
                      更新您的个人资料信息
                    </DialogDescription>
                  </DialogHeader>

                  <form onSubmit={handleUpdateProfile} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-sm font-medium">联系电话</Label>
                        <Input
                            id="phone"
                            value={editForm.phone}
                            disabled
                            readOnly
                            className="bg-muted/50"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="realName" className="text-sm font-medium">真实姓名</Label>
                        <Input
                            id="realName"
                            value={editForm.realName}
                            disabled
                            readOnly
                            className="bg-muted/50"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="username" className="text-sm font-medium">用户名 <span className="text-red-500">*</span></Label>
                        <Input
                            id="username"
                            required={true}
                            value={editForm.username}
                            onChange={(e) => setEditForm(prev => ({
                              ...prev,
                              username: e.target.value
                            }))}
                            className="focus:ring-2 focus:ring-blue-200"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm font-medium">邮箱地址</Label>
                        <Input
                            id="email"
                            type="email"
                            value={editForm.email}
                            onChange={(e) => setEditForm(prev => ({
                              ...prev,
                              email: e.target.value
                            }))}
                            className="focus:ring-2 focus:ring-blue-200"
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
                        <Label htmlFor="title" className="text-sm font-medium">职称</Label>
                        <Input
                            id="title"
                            value={editForm.title}
                            onChange={(e) => setEditForm(prev => ({
                              ...prev,
                              title: e.target.value
                            }))}
                            className="focus:ring-2 focus:ring-blue-200"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="field" className="text-sm font-medium">专业领域</Label>
                      <Input
                          id="field"
                          value={editForm.field}
                          onChange={(e) => setEditForm(prev => ({
                            ...prev,
                            field: e.target.value
                          }))}
                          className="focus:ring-2 focus:ring-blue-200"
                      />
                    </div>


                    <div className="flex justify-end space-x-2 pt-2">
                      <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                        取消
                      </Button>
                      <Button type="submit" disabled={updating} className="bg-blue-600 hover:bg-blue-700">
                        {updating ? "保存中..." : "保存更改"}
                      </Button>
                    </div>
                  </form>
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
                    value={userProfile?.username}
                />
                <InfoItem
                    icon={User}
                    label="真实姓名"
                    value={userProfile?.realName}
                />
                <InfoItem
                    icon={Shield}
                    label={userProfile?.idType ? (ID_TYPES[userProfile.idType] || "证件号码") : "证件号码"}
                    value={userProfile?.idNumber ?
                        (() => {
                          // 根据证件类型进行不同程度的脱敏处理
                          switch (userProfile.idType) {
                            case 'NATIONAL_ID':
                              // 身份证：显示前6位和后4位，中间用*代替
                              return userProfile.idNumber.replace(/(\d{6})\d*(\d{4})/, '$1******$2');
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
                        : ""}
                />
                <InfoItem
                    icon={GraduationCap}
                    label="学历"
                    value={userProfile?.education ?
                        (EducationLevels[userProfile.education as keyof typeof EducationLevels] || userProfile.education)
                        : ""}
                />
                <InfoItem
                    icon={Briefcase}
                    label="职称"
                    value={userProfile?.title}
                />
              </div>

              <div className="space-y-1">
                <InfoItem
                    icon={Briefcase}
                    label="专业领域"
                    value={userProfile?.field}
                />
                <InfoItem
                    icon={Building2}
                    label="所属机构"
                    value={institution?.fullName}
                />
                <InfoItem
                    icon={Phone}
                    label="联系电话"
                    value={userProfile?.phone}
                />
                <InfoItem
                    icon={Mail}
                    label="邮箱地址"
                    value={userProfile?.email}
                />
                <InfoItem
                    icon={Calendar}
                    label="注册日期"
                    value={userProfile?.createdAt ? formatDate(userProfile.createdAt) : ""}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 机构详细信息卡片 */}
        {userProfile?.institutionId && (
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
                        value={institution?.fullName}
                    />
                    <InfoItem
                        icon={Building2}
                        label="机构简称"
                        value={institution?.shortName}
                    />
                    <InfoItem
                        icon={Building2}
                        label="机构类型"
                        value={institution?.type ?
                            (InstitutionTypes[institution.type as keyof typeof InstitutionTypes] || institution.type)
                            : ""}
                    />
                  </div>

                  <div className="space-y-1">
                    <InfoItem
                        icon={User}
                        label="联系人"
                        value={institution?.contactPerson}
                    />
                    <InfoItem
                        icon={Phone}
                        label="联系电话"
                        value={institution?.contactPhone}
                    />
                    <InfoItem
                        icon={Mail}
                        label="联系邮箱"
                        value={institution?.contactEmail}
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