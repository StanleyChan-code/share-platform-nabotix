import { useState } from "react";
import { Button } from "@/components/ui/button.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog.tsx";
import { useToast } from "@/hooks/use-toast.ts";
import { institutionApi } from "@/integrations/api/institutionApi.ts";
import { ID_TYPES, InstitutionTypes } from "@/lib/enums.ts";
import {FormValidator, Input, ValidatedSelect} from "@/components/ui/FormValidator";
import { Asterisk, Building, User, Mail, Phone, IdCard, Briefcase, Info } from "lucide-react";
import { Separator } from "@/components/ui/separator.tsx";

interface AddInstitutionFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onInstitutionAdded: () => void;
}

const AddInstitutionForm = ({ open, onOpenChange, onInstitutionAdded }: AddInstitutionFormProps) => {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        full_name: "",
        short_name: "",
        type: "",
        contact_person: "",
        contact_id_type: "NATIONAL_ID" as "NATIONAL_ID" | "PASSPORT" | "OTHER",
        contact_id_number: "",
        contact_phone: "",
        contact_email: "",
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (name: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        setLoading(true);

        // 检查机构类型
        console.log(formData.type)
        if (!InstitutionTypes[formData.type]) {
            toast({
                title: "机构类型错误",
                description: "请选择正确的机构类型。",
                variant: "destructive",
            })
        }

        try {
            // 构造机构数据对象
            const institutionData = {
                fullName: formData.full_name.trim(),
                shortName: formData.short_name.trim() || null,
                type: formData.type,
                contactPerson: formData.contact_person.trim(),
                contactIdType: formData.contact_id_type,
                contactIdNumber: formData.contact_id_number.trim(),
                contactPhone: formData.contact_phone.trim(),
                contactEmail: formData.contact_email.trim()
            };

            // 调用API创建机构
            await institutionApi.createInstitution(institutionData);

            toast({
                title: "机构添加成功",
                description: "新机构已成功添加。",
            });

            // 重置表单
            resetForm();

            // 通知父组件刷新机构列表并关闭对话框
            onInstitutionAdded();
            onOpenChange(false);
        } catch (error: any) {
            console.error('添加机构失败:', error);
            const errorMessage = error?.response?.data?.message || error?.message || '未知错误';
            toast({
                title: "添加失败",
                description: `添加新机构时发生错误：${errorMessage}`,
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            full_name: "",
            short_name: "",
            type: "",
            contact_person: "",
            contact_id_type: "NATIONAL_ID",
            contact_id_number: "",
            contact_phone: "",
            contact_email: "",
        });
    };

    const handleDialogOpenChange = (open: boolean) => {
        if (!open) {
            resetForm();
        }
        onOpenChange(open);
    };

    // 字段分组配置
    const fieldGroups = [
        {
            title: "机构基本信息",
            icon: Building,
            required: true,
            fields: [
                {
                    name: "full_name",
                    label: "机构全称",
                    icon: Building,
                    required: true,
                    type: "text",
                    placeholder: "请输入机构的完整名称",
                    maxLength: 200
                },
                {
                    name: "type",
                    label: "机构类型",
                    icon: Briefcase,
                    required: true,
                    type: "select",
                    options: Object.entries(InstitutionTypes).map(([key, value]) => ({ value: key, label: value }))
                },
                {
                    name: "short_name",
                    label: "机构简称",
                    icon: Building,
                    required: false,
                    type: "text",
                    placeholder: "请输入机构的简称或缩写",
                    maxLength: 100
                }
            ]
        },
        {
            title: "联系人信息",
            icon: User,
            required: true,
            fields: [
                {
                    name: "contact_person",
                    label: "联系人姓名",
                    icon: User,
                    required: true,
                    type: "text",
                    placeholder: "请输入联系人姓名",
                    maxLength: 100
                },
                {
                    name: "contact_email",
                    label: "联系邮箱",
                    icon: Mail,
                    required: true,
                    type: "email",
                    placeholder: "请输入联系人邮箱地址",
                    maxLength: 200
                },
                {
                    name: "contact_phone",
                    label: "联系电话",
                    icon: Phone,
                    required: true,
                    type: "tel",
                    placeholder: "请输入联系人电话号码",
                    maxLength: 20
                }
            ]
        },
        {
            title: "身份验证信息",
            icon: IdCard,
            required: true,
            fields: [
                {
                    name: "contact_id_type",
                    label: "证件类型",
                    icon: IdCard,
                    required: true,
                    type: "select",
                    options: Object.entries(ID_TYPES).map(([key, value]) => ({ value: key, label: value }))
                },
                {
                    name: "contact_id_number",
                    label: "证件号码",
                    icon: IdCard,
                    required: true,
                    type: "text",
                    placeholder: "请输入证件号码",
                    maxLength: 50
                }
            ]
        }
    ];

    return (
        <Dialog open={open} onOpenChange={handleDialogOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Building className="h-5 w-5" />
                        添加新机构
                    </DialogTitle>
                    <DialogDescription>
                        <div className="space-y-2">
                            <p>请填写机构信息，创建新的机构账户</p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1">
                                    <Asterisk className="h-3 w-3 text-red-500" />
                                    <span>标记的字段为必填项</span>
                                </div>
                            </div>
                        </div>
                    </DialogDescription>
                </DialogHeader>

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
                                                <ValidatedSelect required={field.required}
                                                                 name={field.name}
                                                                 id={field.name}
                                                                  placeholder={`请选择${field.label}`}
                                                                 errorMessage={`请选择${field.label}`}
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
                                                    onChange={handleInputChange}
                                                    placeholder={field.placeholder}
                                                    maxLength={field.maxLength}
                                                    required={field.required}
                                                    validationType={
                                                        field.name === 'contact_phone' ? 'phone' :
                                                            field.name === 'contact_email' ? 'email' :
                                                                field.name === 'contact_id_number' ? 'idNumber' : undefined
                                                    }
                                                    idType={field.name === 'contact_id_number' ? formData.contact_id_type : undefined}
                                                />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {groupIndex < fieldGroups.length - 1 && <Separator />}
                        </div>
                    ))}

                    {/* 提示信息 */}
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-start gap-2">
                            <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                            <div className="space-y-1">
                                <p className="text-sm font-medium text-blue-800">重要提示</p>
                                <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
                                    <li>机构创建后，联系电话将作为机构管理员登录账号，后续修改联系电话不会影响机构管理员登录账号。</li>
                                    <div>机构管理员登录账号须使用手机验证码登录，登录后修改密码后才可以使用密码登录。</div>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-4 border-t">
                        <div className="text-xs text-muted-foreground space-y-1">
                        </div>
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => handleDialogOpenChange(false)}
                                disabled={loading}
                            >
                                取消
                            </Button>
                            <Button
                                type="submit"
                                disabled={loading}
                                className="min-w-32"
                            >
                                {loading ? "提交中..." : "添加机构"}
                            </Button>
                        </div>
                    </div>
                </FormValidator>
            </DialogContent>
        </Dialog>
    );
};

export default AddInstitutionForm;