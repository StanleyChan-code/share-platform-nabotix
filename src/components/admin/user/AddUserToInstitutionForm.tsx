import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button.tsx";
import { Label } from "@/components/ui/label.tsx";
import { useToast } from "@/hooks/use-toast.ts";
import { PermissionRoles, getPermissionRoleDisplayName } from "@/lib/permissionUtils.ts";
import { userApi } from "@/integrations/api/userApi.ts";
import { InstitutionSelector } from "@/components/admin/institution/InstitutionSelector.tsx";
import { getCurrentUserInfoFromSession } from "@/lib/authUtils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { Separator } from "@/components/ui/separator.tsx";
import { Asterisk, User, Mail, Phone, IdCard, GraduationCap, Briefcase, Target, Shield, Key, Info, AlertCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip.tsx";
import {FormValidator, Input, ValidatedSelect} from "@/components/ui/FormValidator";

interface AddUserToInstitutionFormProps {
  institutionId?: string;
  onUserAdded: () => void;
}

const AddUserToInstitutionForm = ({ institutionId: propInstitutionId, onUserAdded }: AddUserToInstitutionFormProps) => {
  const [formData, setFormData] = useState({
    realName: "",
    phone: "",
    email: "",
    idType: "NATIONAL_ID" as "NATIONAL_ID" | "PASSPORT" | "OTHER",
    idNumber: "",
    education: "",
    title: "",
    field: "",
  });

  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);
  const [isInstitutionAdmin, setIsInstitutionAdmin] = useState(false);
  const [selectedInstitutionId, setSelectedInstitutionId] = useState<string[] | null>(propInstitutionId ? [propInstitutionId] : null);
  const { toast } = useToast();

  // 检查用户是否为平台管理员或机构管理员
  useEffect(() => {
    const userInfo = getCurrentUserInfoFromSession();
    if (userInfo) {
      setIsPlatformAdmin(userInfo.roles.includes(PermissionRoles.PLATFORM_ADMIN));
      setIsInstitutionAdmin(userInfo.roles.includes(PermissionRoles.INSTITUTION_SUPERVISOR));
      if (!userInfo.roles.includes(PermissionRoles.PLATFORM_ADMIN) && propInstitutionId) {
        setSelectedInstitutionId([propInstitutionId]);
      }
    }

    return () => {
      resetForm();
    };
  }, [propInstitutionId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRoleToggle = (role: string) => {
    setSelectedRoles(prev => {
      if (prev.includes(role)) {
        return prev.filter(r => r !== role);
      }

      if (role === PermissionRoles.PLATFORM_ADMIN || role === PermissionRoles.INSTITUTION_SUPERVISOR) {
        return [role];
      }

      const hasAdminRole = prev.includes(PermissionRoles.PLATFORM_ADMIN) || prev.includes(PermissionRoles.INSTITUTION_SUPERVISOR);
      if (hasAdminRole) {
        return [role];
      }

      return [...prev, role];
    });
  };

  const isRoleDisabled = (role: string) => {
    // 如果是机构管理员角色，只有平台管理员可以选择
    if (role === PermissionRoles.INSTITUTION_SUPERVISOR && !isPlatformAdmin) {
      return true;
    }

    // 如果是机构用户管理员角色，只有平台管理员或机构管理员可以选择
    if (role === PermissionRoles.INSTITUTION_USER_MANAGER && !isPlatformAdmin && !isInstitutionAdmin) {
      return true;
    }

    if (selectedRoles.includes(PermissionRoles.PLATFORM_ADMIN) || selectedRoles.includes(PermissionRoles.INSTITUTION_SUPERVISOR)) {
      return !selectedRoles.includes(role);
    }
    if (role === PermissionRoles.PLATFORM_ADMIN || role === PermissionRoles.INSTITUTION_SUPERVISOR) {
      return selectedRoles.length > 0 && !selectedRoles.includes(role);
    }
    return false;
  };

  const getRoleDescription = (role: string) => {
    const descriptions = {
      [PermissionRoles.PLATFORM_ADMIN]: "系统最高权限，可以管理所有机构、用户、学科、数据集及其申请和研究成果",
      [PermissionRoles.INSTITUTION_SUPERVISOR]: "可以管理本机构的所有用户和数据",
      [PermissionRoles.INSTITUTION_USER_MANAGER]: "可以管理本机构的用户信息和权限",
      [PermissionRoles.DATASET_UPLOADER]: "可以上传数据集和审核自己上传的数据集的申请",
      [PermissionRoles.DATASET_APPROVER]: "可以审核机构用户上传的数据集和相关数据集申请",
      [PermissionRoles.RESEARCH_OUTPUT_APPROVER]: "可以审核机构用户上传的研究成果"
    };
    return descriptions[role as keyof typeof descriptions] || "暂无描述";
  };

  // 证件号码验证函数
  const validateIdNumber = (idType: string, idNumber: string): boolean => {
    if (!idNumber.trim()) return false;

    switch (idType) {
      case 'NATIONAL_ID':
        return /^\d{17}[\dXx]$|^\d{15}$/.test(idNumber.trim());
      case 'PASSPORT':
        return /^[a-zA-Z0-9]{5,20}$/.test(idNumber.trim());
      default:
        return /^[a-zA-Z0-9\-_]{2,30}$/.test(idNumber.trim());
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    setLoading(true);

    try {
      // 1. 检查所有必填字段
      const requiredFields = [
        { field: 'realName' as keyof typeof formData, label: '姓名' },
        { field: 'phone' as keyof typeof formData, label: '手机号' },
        { field: 'idType' as keyof typeof formData, label: '证件类型' },
        { field: 'idNumber' as keyof typeof formData, label: '证件号码' }
      ];

      const missingFields = requiredFields.filter(item => !formData[item.field]);
      if (missingFields.length > 0) {
        toast({
          title: "错误",
          description: `请填写以下必填字段：${missingFields.map(item => item.label).join('、')}`,
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // 2. 验证手机号格式
      const phoneRegex = /^1[3-9]\d{9}$/;
      if (!phoneRegex.test(formData.phone)) {
        toast({
          title: "错误",
          description: "请输入正确的手机号码",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // 3. 验证证件号码格式
      if (!validateIdNumber(formData.idType, formData.idNumber)) {
        toast({
          title: "错误",
          description: "证件号码格式不正确",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // 5. 检查机构ID
      const effectiveInstitutionId = isPlatformAdmin ? selectedInstitutionId?.[0] : propInstitutionId;
      if (!effectiveInstitutionId) {
        toast({
          title: "错误",
          description: isPlatformAdmin ? "请选择一个机构" : "无法确定用户所属机构",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // 6. 创建用户请求数据
      const createUserRequest = {
        realName: formData.realName.trim(),
        email: formData.email?.trim() || null,
        phone: formData.phone.trim(),
        password: "",
        institutionId: effectiveInstitutionId,
        idType: formData.idType,
        idNumber: formData.idNumber.trim(),
        education: formData.education?.trim() || null,
        title: formData.title?.trim() || null,
        field: formData.field?.trim() || null,
        authorities: selectedRoles.length > 0 ? selectedRoles : undefined
      };

      // 7. 调用API
      const createdUser = await userApi.createUser(createUserRequest);

      toast({
        title: "成功",
        description: `用户 ${formData.realName} 已成功创建。首次登录须使用手机验证码。`,
      });

      resetForm();
      onUserAdded();

    } catch (error: any) {
      console.error("添加用户时出错:", error);
      toast({
        title: "错误",
        description: error?.response?.data?.message || "添加用户时发生未知错误",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      realName: "",
      phone: "",
      email: "",
      idType: "NATIONAL_ID",
      idNumber: "",
      education: "",
      title: "",
      field: "",
    });
    setSelectedRoles([]);
    if (isPlatformAdmin) {
      setSelectedInstitutionId(null);
    }
  };

  // 定义可用的角色选项
  const roleOptions: { id: string; name: string }[] = [];
  
  // 只有平台管理员可以看到机构管理员选项
  if (isPlatformAdmin) {
    roleOptions.push({ id: PermissionRoles.INSTITUTION_SUPERVISOR, name: getPermissionRoleDisplayName(PermissionRoles.INSTITUTION_SUPERVISOR) });
  }
  
  // 添加普通角色选项
  roleOptions.push(
    { id: PermissionRoles.INSTITUTION_USER_MANAGER, name: getPermissionRoleDisplayName(PermissionRoles.INSTITUTION_USER_MANAGER) },
    { id: PermissionRoles.DATASET_UPLOADER, name: getPermissionRoleDisplayName(PermissionRoles.DATASET_UPLOADER) },
    { id: PermissionRoles.DATASET_APPROVER, name: getPermissionRoleDisplayName(PermissionRoles.DATASET_APPROVER) }
  );
  
  // 如果是平台管理员，添加平台管理员选项到最前面
  if (isPlatformAdmin) {
    roleOptions.unshift({ id: PermissionRoles.PLATFORM_ADMIN, name: getPermissionRoleDisplayName(PermissionRoles.PLATFORM_ADMIN) });
  }

  // 教育程度选项
  const educationOptions = [
    { value: "BACHELOR", label: "学士" },
    { value: "MASTER", label: "硕士" },
    { value: "PHD", label: "博士" },
    { value: "PROFESSIONAL", label: "专业学位" },
    { value: "OTHER", label: "其他" },
  ];

  // 证件类型选项
  const idTypeOptions = [
    { value: "NATIONAL_ID", label: "身份证" },
    { value: "PASSPORT", label: "护照" },
    { value: "OTHER", label: "其他证件" },
  ];

  // 字段分组配置
  const fieldGroups = [
    {
      title: "基本信息（必填）",
      icon: User,
      required: true,
      fields: [
        { name: "realName", label: "姓名", icon: User, required: true, type: "text" },
        { name: "phone", label: "手机号", icon: Phone, required: true, type: "tel" },
      ]
    },
    {
      title: "身份信息（必填）",
      icon: IdCard,
      required: true,
      fields: [
        { name: "idType", label: "证件类型", icon: IdCard, required: true, type: "select", options: idTypeOptions },
        { name: "idNumber", label: "证件号码", icon: IdCard, required: true, type: "text" },
      ]
    },
    {
      title: "账户信息（选填）",
      icon: User,
      required: false,
      fields: [
        { name: "email", label: "邮箱地址", icon: Mail, required: false, type: "email" },
      ]
    },
    {
      title: "教育背景（选填）",
      icon: GraduationCap,
      required: false,
      fields: [
        { name: "education", label: "学历", icon: GraduationCap, required: false, type: "select", options: educationOptions },
        { name: "field", label: "专业领域", icon: Target, required: false, type: "text" },
      ]
    },
    {
      title: "职业信息（选填）",
      icon: Briefcase,
      required: false,
      fields: [
        { name: "title", label: "职称", icon: Briefcase, required: false, type: "text" },
      ]
    }
  ];

  return (
      <TooltipProvider>
            <FormValidator onSubmit={handleSubmit} className="space-y-6">
              {fieldGroups.map((group, groupIndex) => (
                  <div key={group.title} className="space-y-4">
                    <div className={`p-4 rounded-lg border-l-4 ${group.required ? 'border-l-red-500 bg-red-50' : 'border-l-blue-500 bg-blue-50'}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <group.icon className={`h-4 w-4 ${group.required ? 'text-red-600' : 'text-blue-600'}`} />
                        <h3 className="font-semibold text-sm">{group.title}</h3>
                        {!group.required && (
                            <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">选填</span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {group.fields.map((field) => (
                            <div key={field.name} className="space-y-2">
                              <Label htmlFor={field.name} className="flex items-center gap-2 text-sm">
                                <field.icon className="h-3 w-3" />
                                {field.label}
                                {field.required ? (
                                    <Asterisk className="h-3 w-3 text-red-500" />
                                ) : (
                                    <span className="text-xs text-muted-foreground">选填</span>
                                )}
                              </Label>

                              {field.type === "select" ? (
                                  <ValidatedSelect
                                      id={field.name}
                                      placeholder={`请选择${field.label}`}
                                      errorMessage={`请选择${field.label}`}
                                      name={field.name}
                                      value={formData[field.name as keyof typeof formData] as string}
                                      onValueChange={(value) => handleSelectChange(field.name, value)}
                                  >
                                    <SelectContent>
                                      {field.options?.map(option => (
                                          <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                          </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </ValidatedSelect>
                              ) : (
                                  <Input
                                      id={field.name}
                                      name={field.name}
                                      type={field.type}
                                      value={formData[field.name as keyof typeof formData] as string}
                                      onChange={handleChange}
                                      placeholder={field.required ? `请输入${field.label}` : `可选项，请输入${field.label}`}
                                      maxLength={
                                        field.name === 'realName' ? 100 :
                                            field.name === 'phone' ? 20 :
                                                field.name === 'email' ? 200 :
                                                    field.name === 'idNumber' ? 50 :
                                                        field.name === 'title' ? 100 :
                                                            field.name === 'field' ? 200 : 100
                                      }
                                      required={field.required}
                                      validationType={
                                        field.name === 'phone' ? 'phone' :
                                            field.name === 'email' ? 'email' :
                                                field.name === 'idNumber' ? 'idNumber' : undefined
                                      }
                                      idType={field.name === 'idNumber' ? formData.idType : undefined}
                                  />
                              )}
                            </div>
                        ))}
                      </div>
                    </div>

                    {groupIndex < fieldGroups.length - 1 && <Separator />}
                  </div>
              ))}

              {/* 仅平台管理员显示机构选择器 */}
              {isPlatformAdmin && (
                  <div className="p-4 rounded-lg border-l-4 border-l-red-500 bg-red-50">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="h-4 w-4 text-red-600" />
                      <h3 className="font-semibold text-sm">机构信息（必填）</h3>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="institution" className="flex items-center gap-2 text-sm">
                        <Shield className="h-3 w-3" />
                        所属机构
                        <Asterisk className="h-3 w-3 text-red-500" />
                      </Label>
                      <InstitutionSelector
                          value={selectedInstitutionId}
                          onChange={setSelectedInstitutionId}
                          placeholder="请选择机构"
                          allowMultiple={false}
                      />
                    </div>
                  </div>
              )}

              <div className="p-4 rounded-lg border-l-4 border-l-blue-500 bg-blue-50">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-4 w-4 text-blue-600" />
                  <h3 className="font-semibold text-sm">权限角色（选填）</h3>
                  <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">选填</span>
                </div>

                <div className="space-y-2 mb-4">
                  {isPlatformAdmin && (
                      <p className="text-xs text-blue-600">
                        <strong>注意：</strong>平台管理员和机构管理员角色与其他角色互斥，不能同时选择。
                      </p>
                  )}
                  <p className="text-xs text-blue-600">
                    <strong>提示：</strong>如果不选择任何角色，用户将只有基础访问权限。
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {roleOptions.map((role) => {
                    const disabled = isRoleDisabled(role.id);
                    const isSelected = selectedRoles.includes(role.id);
                    const description = getRoleDescription(role.id);

                    return (
                        <Tooltip key={role.id}>
                          <TooltipTrigger asChild>
                            <div className={`flex items-center space-x-2 p-3 rounded border transition-colors ${
                                isSelected
                                    ? 'border-primary bg-primary/5'
                                    : disabled
                                        ? 'bg-gray-100 opacity-50'
                                        : 'hover:bg-accent cursor-pointer'
                            }`}>
                              <input
                                  type="checkbox"
                                  id={role.id}
                                  checked={isSelected}
                                  onChange={() => handleRoleToggle(role.id)}
                                  disabled={disabled && !isSelected}
                                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                              />
                              <Label
                                  htmlFor={role.id}
                                  className={`text-sm font-medium leading-none flex-1 ${
                                      disabled && !isSelected ? 'cursor-not-allowed text-gray-500' : 'cursor-pointer'
                                  }`}
                              >
                                {role.name}
                              </Label>
                              <Info className="h-3 w-3 text-muted-foreground" />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-xs">
                            <p className="font-medium">{role.name}</p>
                            <p className="text-sm">{description}</p>
                            {disabled && !isSelected && (
                                <p className="text-xs text-orange-600 mt-1">
                                  {selectedRoles.includes(PermissionRoles.PLATFORM_ADMIN) || selectedRoles.includes(PermissionRoles.INSTITUTION_SUPERVISOR)
                                      ? "已选择管理员角色，无法同时选择其他角色"
                                      : "已选择其他角色，无法同时选择管理员角色"}
                                </p>
                            )}
                          </TooltipContent>
                        </Tooltip>
                    );
                  })}
                </div>

                {selectedRoles.length > 0 && (
                    <div className="mt-4 p-3 bg-blue-100 rounded">
                      <p className="text-sm font-medium text-blue-800">已选择的角色：</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {selectedRoles.map(role => (
                            <span key={role} className="px-2 py-1 bg-blue-200 text-blue-800 text-xs rounded-full">
                        {getPermissionRoleDisplayName(role)}
                      </span>
                        ))}
                      </div>
                    </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-4 border-t">
                <div className="text-xs text-muted-foreground space-y-1">
                  <div>必填字段：姓名、手机号、证件类型、证件号码{isPlatformAdmin && '、所属机构'}</div>
                  <div>创建账号后须使用手机验证码登录，登录后修改密码后才可以使用密码登录。</div>
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={resetForm} disabled={loading}>
                    重置
                  </Button>
                  <Button type="submit" disabled={loading} className="min-w-32">
                    {loading ? "添加中..." : "添加用户"}
                  </Button>
                </div>
              </div>
            </FormValidator>
      </TooltipProvider>
  );
};

export default AddUserToInstitutionForm;