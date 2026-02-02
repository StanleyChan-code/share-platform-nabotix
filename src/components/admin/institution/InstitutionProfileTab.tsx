import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { useToast } from "@/hooks/use-toast.ts";
import { institutionApi, Institution } from "@/integrations/api/institutionApi.ts";
import { Loader2, Building, User, Mail, Phone, IdCard, Briefcase, Shield, Asterisk, Info, Users } from "lucide-react";
import { InstitutionTypes, ID_TYPES } from "@/lib/enums.ts";
import { getCurrentUserRolesFromSession } from "@/lib/authUtils";
import { Separator } from "@/components/ui/separator.tsx";
import {FormValidator, Input, ValidatedSelect} from "@/components/ui/FormValidator";
import RelatedUsersDialog from "@/components/profile/RelatedUsersDialog.tsx";
import { userApi } from "@/integrations/api/userApi.ts";

interface InstitutionProfileTabProps {
  institutionId: string;
  onInstitutionUpdated?: () => void;
}

const InstitutionProfileTab = ({ institutionId, onInstitutionUpdated }: InstitutionProfileTabProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [institution, setInstitution] = useState<Institution | null>(null);
  const [formData, setFormData] = useState<Partial<Institution>>({});
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);
  // 平台管理员相关状态
  const [platformAdminsDialogOpen, setPlatformAdminsDialogOpen] = useState(false);
  const [platformAdminsLoading, setPlatformAdminsLoading] = useState(false);
  const [platformAdmins, setPlatformAdmins] = useState<any>({});

  useEffect(() => {
    const checkUserRole = async () => {
      try {
        const roles = getCurrentUserRolesFromSession();
        setIsPlatformAdmin(roles.includes('PLATFORM_ADMIN'));
      } catch (error) {
        console.error("检查用户角色失败:", error);
      }
    };

    checkUserRole();
  }, []);

  useEffect(() => {
    const fetchInstitution = async () => {
      try {
        if (institutionId === null) return;
        setLoading(true);
        let apiResponse = await institutionApi.getInstitutionById(institutionId);

        const data = apiResponse.data;
        setInstitution(data);
        setFormData(data);
      } catch (error: any) {
        console.error("获取机构信息失败:", error);
        toast({
          title: "错误",
          description: error.message || "获取机构信息时发生错误",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (isPlatformAdmin !== null) {
      fetchInstitution();
    }
  }, [institutionId, toast, isPlatformAdmin]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    if (!institution) return;

    try {
      setSaving(true);

      // 准备要更新的数据，排除不可更改的字段
      const updateData: Partial<Institution> = {
        shortName: formData.shortName?.trim() || null,
        contactPhone: formData.contactPhone?.trim(),
        contactEmail: formData.contactEmail?.trim(),
      };

      // 只有平台管理员可以修改敏感字段
      if (isPlatformAdmin) {
        updateData.fullName = formData.fullName?.trim();
        updateData.type = formData.type;
        updateData.contactPerson = formData.contactPerson?.trim();
        updateData.contactIdType = formData.contactIdType;
        updateData.contactIdNumber = formData.contactIdNumber?.trim();
      }

      // 平台管理员可以直接更新任意机构
      // 机构管理员只能更新自己的机构
      if (isPlatformAdmin && institutionId) {
        await institutionApi.updateInstitution(institutionId, updateData);
      } else {
        await institutionApi.updateCurrentUserInstitution(updateData);
      }

      // 更新本地数据
      setInstitution(prev => prev ? { ...prev, ...updateData } : null);

      toast({
        title: "更新成功",
        description: "机构信息已成功更新",
      });

      // 调用回调通知父组件机构信息已更新
      if (onInstitutionUpdated) {
        onInstitutionUpdated();
      }
    } catch (error: any) {
      console.error("更新机构信息失败:", error);
      toast({
        title: "更新失败",
        description: error.message || "更新机构信息时发生错误",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    if (institution) {
      setFormData(institution);
    }
  };

  // 字段分组配置
  const fieldGroups = [
    {
      title: "机构基本信息",
      icon: Building,
      required: true,
      fields: [
        {
          name: "fullName",
          label: "机构全称",
          icon: Building,
          required: true,
          type: "text",
          placeholder: "请输入机构的完整名称",
          maxLength: 200,
          editable: false, // 只有平台管理员可编辑
          description: "只有平台管理员可以修改此项"
        },
        {
          name: "type",
          label: "机构类型",
          icon: Briefcase,
          required: true,
          type: "select",
          options: Object.entries(InstitutionTypes).map(([key, value]) => ({ value: key, label: value })),
          editable: false, // 只有平台管理员可编辑
          description: "只有平台管理员可以修改此项"
        },
        {
          name: "shortName",
          label: "机构简称",
          icon: Building,
          required: false,
          type: "text",
          placeholder: "请输入机构的简称或缩写",
          maxLength: 100,
          editable: true
        }
      ]
    },
    {
      title: "联系人信息",
      icon: User,
      required: true,
      fields: [
        {
          name: "contactPerson",
          label: "联系人姓名",
          icon: User,
          required: true,
          type: "text",
          placeholder: "请输入联系人姓名",
          maxLength: 100,
          editable: false, // 只有平台管理员可编辑
          description: "只有平台管理员可以修改此项"
        },
        {
          name: "contactEmail",
          label: "联系邮箱",
          icon: Mail,
          required: true,
          type: "email",
          placeholder: "请输入联系人邮箱地址",
          maxLength: 200,
          editable: true
        },
        {
          name: "contactPhone",
          label: "联系电话",
          icon: Phone,
          required: true,
          type: "tel",
          placeholder: "请输入联系人电话号码",
          maxLength: 20,
          editable: true
        }
      ]
    },
    {
      title: "身份验证信息",
      icon: IdCard,
      required: true,
      fields: [
        {
          name: "contactIdType",
          label: "证件类型",
          icon: IdCard,
          required: true,
          type: "select",
          options: Object.entries(ID_TYPES).map(([key, value]) => ({ value: key, label: value })),
          editable: false, // 只有平台管理员可编辑
          description: "只有平台管理员可以修改此项"
        },
        {
          name: "contactIdNumber",
          label: "证件号码",
          icon: IdCard,
          required: true,
          type: "text",
          placeholder: "请输入证件号码",
          maxLength: 50,
          editable: false, // 只有平台管理员可编辑
          description: "只有平台管理员可以修改此项"
        }
      ]
    }
  ];

  if (loading) {
    return (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
    );
  }

  // 获取平台管理员列表
  const fetchPlatformAdmins = async () => {
    try {
      setPlatformAdminsLoading(true);
      const result = await userApi.getPlatformAdmins();
      if (result.success) {
        setPlatformAdmins({platformAdmins: result.data});
      } else {
        toast({
          title: "获取平台管理员失败",
          description: "无法获取平台管理员列表",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("获取平台管理员失败:", error);
      toast({
        title: "错误",
        description: error.message || "获取平台管理员列表时发生错误",
        variant: "destructive",
      });
    } finally {
      setPlatformAdminsLoading(false);
    }
  };

  // 打开平台管理员对话框并获取数据
  const handleOpenPlatformAdminsDialog = () => {
    fetchPlatformAdmins();
    setPlatformAdminsDialogOpen(true);
  };

  if (!institution) {
    if (isPlatformAdmin) {
      return ;
    }

    return (
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">没有相关机构信息</p>
        </div>
    );
  }

  return (
      <div className="space-y-6">
            <FormValidator onSubmit={handleSubmit} className="space-y-6">
              {fieldGroups.map((group, groupIndex) => (
                  <div key={group.title} className="space-y-4">
                    <div className={`p-4 rounded-lg border-l-4 ${group.required ? 'border-l-red-500 bg-red-50' : 'border-l-blue-500 bg-blue-50'}`}>
                      <div className="flex items-center gap-2 mb-4">
                        <group.icon className={`h-4 w-4 ${group.required ? 'text-red-600' : 'text-blue-600'}`} />
                        <h3 className="font-semibold text-sm">{group.title}</h3>
                        {!group.required && (
                            <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">选填</span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {group.fields.map((field) => {
                          const isEditable = field.editable === undefined ? true : (isPlatformAdmin ? true : field.editable);

                          return (
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

                                {!isEditable && field.description && (
                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                      <Info className="h-3 w-3" />
                                      {field.description}
                                    </p>
                                )}
                                {field.type === "select" ? (
                                    <ValidatedSelect
                                        id={field.name}
                                        name={field.name}
                                        placeholder={`请选择${field.label}`}
                                        errorMessage={`请选择${field.label}`}
                                        className={!isEditable ? "bg-gray-100 opacity-50" : ""}
                                        value={formData[field.name as keyof typeof formData] as string || ""}
                                        onValueChange={(value) => handleSelectChange(field.name, value)}
                                        disabled={!isEditable}
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
                                        value={formData[field.name as keyof typeof formData] as string || ""}
                                        onChange={handleInputChange}
                                        placeholder={field.placeholder}
                                        maxLength={field.maxLength}
                                        readOnly={!isEditable}
                                        className={!isEditable ? "bg-gray-100 cursor-not-allowed" : ""}
                                        required={field.required}
                                        validationType={
                                          field.name === 'contactPhone' ? 'phone' :
                                              field.name === 'contactEmail' ? 'email' :
                                                  field.name === 'contactIdNumber' ? 'idNumber' : undefined
                                        }
                                        idType={field.name === 'contactIdNumber' ? formData.contactIdType as 'NATIONAL_ID' | 'PASSPORT' | 'OTHER' : undefined}
                                    />
                                )}

                              </div>
                          );
                        })}
                      </div>
                    </div>

                    {groupIndex < fieldGroups.length - 1 && <Separator />}
                  </div>
              ))}

              {/* 权限提示和查看平台管理员按钮 */}
              {!isPlatformAdmin && (
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 flex justify-between items-start">
                    <div className="flex items-start gap-2">
                      <Shield className="h-4 w-4 text-blue-600 mt-0.5" />
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-blue-800">权限说明</p>
                        <p className="text-xs text-blue-700">
                          您当前是机构管理员，只能修改机构简称、联系邮箱和联系电话，机构信息不与机构管理员账号关联。如需修改其他敏感信息需要联系平台管理员进行修改。
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      onClick={handleOpenPlatformAdminsDialog}
                      variant="outline"
                      className="gap-2"
                      size="sm"
                    >
                      <Users className="h-3 w-3" />
                      查看平台管理员
                    </Button>
                  </div>
              )}

              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-4 border-t">
                <div className="text-xs text-muted-foreground space-y-1">
                  <div className="flex items-center gap-1">
                    <Asterisk className="h-3 w-3 text-red-500" />
                    <span>标记的内容为必填项</span>
                  </div>
                  <div>修改后请确保信息的准确性</div>
                </div>
                <div className="flex gap-2">
                  <Button
                      type="button"
                      variant="outline"
                      onClick={resetForm}
                      disabled={saving}
                  >
                    重置
                  </Button>
                  <Button
                      type="submit"
                      disabled={saving}
                      className="min-w-32"
                  >
                    {saving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          保存中...
                        </>
                    ) : (
                        "保存更改"
                    )}
                  </Button>
                </div>
              </div>
            </FormValidator>

            {/* 平台管理员对话框 */}
            <RelatedUsersDialog
              open={platformAdminsDialogOpen}
              onOpenChange={setPlatformAdminsDialogOpen}
              relatedUsers={platformAdmins}
              loading={platformAdminsLoading}
              highlightedUserIds={[]}
            />
      </div>
  );
};

export default InstitutionProfileTab;