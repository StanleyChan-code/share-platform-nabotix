import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  User,
  Edit,
  Building2,
  Mail,
  Phone,
  Calendar,
  GraduationCap,
  Briefcase,
  Shield,
  Hash,
  Info
} from "lucide-react";
import { useState, useEffect } from "react";
import { EducationLevels, ID_TYPES, InstitutionTypes } from "@/lib/enums";
import { formatDate } from "@/lib/utils.ts";
import {UserInfo} from "@/lib/authUtils.ts";
import EditProfileDialog from "@/components/profile/EditProfileDialog";

interface ProfileInfoProps {
  userProfile: UserInfo;
  onUpdateProfile: (formData: any) => void;
}

// 用户信息表单类型
interface EditFormData {
  realName: string;
  phone: string;
  title: string;
  field: string;
  email: string;
  education: string;
}

const ProfileInfo = ({ userProfile, onUpdateProfile }: ProfileInfoProps) => {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // 表单验证状态
  // Form validation is handled by FormValidator component
  const [institution, setInstitution] = useState<any>(null);


  useEffect(() => {
    setInstitution(userProfile.institution);
  }, []);



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
    return <div>加载中...</div>;
  }

  return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">个人信息</h2>
          <div className="flex gap-2">
            <Button
              variant="default"
              size="sm"
              onClick={() => setIsEditDialogOpen(true)}
              className="flex items-center gap-2"
            >
              <Edit className="h-4 w-4" />
              编辑信息
            </Button>
          </div>
        </div>

        <Card className="overflow-hidden border-blue-100 shadow-sm">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-blue-100">
            <CardHeader className="p-0">
              <CardTitle className="flex items-center gap-3 text-blue-900">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white shadow-sm">
                  <User className="h-5 w-5 text-blue-600" />
                </div>
                <span className="text-xl font-semibold">基本信息</span>
              </CardTitle>
            </CardHeader>
          </div>

          <CardContent className="p-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-1">
                <InfoItem
                    icon={User}
                    label="姓名"
                    value={userProfile.user.realName}
                />
                <InfoItem
                    icon={Phone}
                    label="联系电话"
                    value={userProfile.user.phone}
                />
                <InfoItem
                    icon={Shield}
                    label={userProfile.user.idType ? getIdTypeDisplayName(userProfile.user.idType) : "证件号码"}
                    value={userProfile.user.idNumber ? maskIdNumber(userProfile.user.idType, userProfile.user.idNumber) : ""}
                />
                <InfoItem
                    icon={Briefcase}
                    label="职称"
                    value={userProfile.user.title}
                />
                <InfoItem
                    icon={Calendar}
                    label="注册日期"
                    value={userProfile.user.createdAt ? formatDate(userProfile.user.createdAt) : ""}
                />
              </div>

              <div className="space-y-1">
                <InfoItem
                    icon={Mail}
                    label="联系邮箱"
                    value={userProfile.user.email}
                />
                <InfoItem
                    icon={GraduationCap}
                    label="学历"
                    value={getEducationDisplayName(userProfile.user.education)}
                />
                <InfoItem
                    icon={Building2}
                    label="所属机构"
                    value={institution?.fullName || "未分配"}
                />
                <InfoItem
                    icon={Briefcase}
                    label="专业领域"
                    value={userProfile.user.field}
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
                        icon={Phone}
                        label="机构电话"
                        value={institution.contactPhone || "未填写"}
                    />
                    <InfoItem
                        icon={Mail}
                        label="机构邮箱"
                        value={institution.contactEmail || "未填写"}
                    />
                    <InfoItem
                        icon={Building2}
                        label="进驻日期"
                        value={formatDate(institution.createdAt) || "未填写"}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
        )}

        {/* 编辑个人信息对话框 */}
        <EditProfileDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          userProfile={userProfile}
          onUpdateSuccess={onUpdateProfile}
        />
      </div>
  );
};

export default ProfileInfo;