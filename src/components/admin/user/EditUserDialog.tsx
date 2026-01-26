import {useEffect, useState} from "react";
import {ScrollArea} from "@/components/ui/scroll-area";
import {Button} from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {useToast} from "@/hooks/use-toast";
import {UpdateUserRequest, userApi} from "@/integrations/api/userApi";
import {ID_TYPES, EDUCATION_LEVELS} from "@/lib/enums";
import {
    SelectContent,
    SelectItem,
} from "@/components/ui/select";
import {Card, CardContent} from "@/components/ui/card";
import {Separator} from "@/components/ui/separator";
import {Loader2, User, Mail, Phone, IdCard, GraduationCap, Briefcase, Target, Asterisk} from "lucide-react";
import {FormValidator, Input, ValidatedSelect} from "@/components/ui/FormValidator";
import {z} from "zod";

// 修正表单验证规则 - 只有姓名、手机号、证件类型、证件号码是必填
const formSchema = z.object({
    // 必填字段
    realName: z.string().min(1, "姓名不能为空"),
    phone: z.string().min(1, "手机号不能为空").regex(/^1[3-9]\d{9}$/, "请输入有效的手机号码"),
    idType: z.enum(Object.keys(ID_TYPES) as [string, ...string[]], {
        errorMap: () => ({message: "请选择证件类型"})
    }),
    idNumber: z.string().min(1, "证件号码不能为空"),

    // 选填字段 - 允许为空字符串
    email: z.string().email("请输入有效的邮箱地址").optional().or(z.literal("")),
    education: z.enum(Object.keys(EDUCATION_LEVELS) as [string, ...string[]]).optional().or(z.literal("")),
    title: z.string().optional().or(z.literal("")),
    field: z.string().optional().or(z.literal("")),
});

interface EditUserDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    user: any;
    onUserUpdated: () => void;
}

const EditUserDialog = ({open, onOpenChange, user, onUserUpdated}: EditUserDialogProps) => {
    const {toast} = useToast();
    const [formData, setFormData] = useState({
        realName: "",
        email: "",
        phone: "",
        idType: "",
        idNumber: "",
        education: "",
        title: "",
        field: "",
    });
    const [isLoading, setIsLoading] = useState(false);

    // 当对话框开关状态改变时处理表单数据
    useEffect(() => {
        if (open && user) {
            // 当对话框打开且有用户数据时，填充表单
            setFormData({
                realName: user.realName || "",
                email: user.email || "",
                phone: user.phone || "",
                idType: user.idType || "",
                idNumber: user.idNumber || "",
                education: user.education || "",
                title: user.title || "",
                field: user.field || "",
            });
        } else if (!open) {
            // 当对话框关闭时，重置表单
            setFormData({
                realName: "",
                email: "",
                phone: "",
                idType: "",
                idNumber: "",
                education: "",
                title: "",
                field: "",
            });
        }
    }, [open, user]);

    const handleInputChange = (name: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        setIsLoading(true);

        try {
            // 客户端验证
            const validationResult = formSchema.safeParse(formData);
            if (!validationResult.success) {
                const firstError = validationResult.error.errors[0];
                toast({
                    title: "输入验证失败",
                    description: firstError.message,
                    variant: "destructive",
                });
                return;
            }

            // 处理选填字段：如果为空字符串则转为 undefined
            const processedData = {
                ...formData,
                email: formData.email || undefined,
                education: formData.education || undefined,
                title: formData.title || undefined,
                field: formData.field || undefined,
            };

            const updateRequest: UpdateUserRequest = {
                realName: processedData.realName,
                email: processedData.email,
                phone: processedData.phone,
                idType: processedData.idType,
                idNumber: processedData.idNumber,
                education: processedData.education,
                title: processedData.title,
                field: processedData.field,
            };

            await userApi.updateUserByAdmin(user.id, updateRequest);
            toast({
                title: "成功",
                description: "用户信息更新成功",
            });
            onUserUpdated();
            onOpenChange(false);
        } catch (error: any) {
            console.error("更新用户信息失败:", error);
            toast({
                title: "错误",
                description: error.response.data.message || "更新用户信息失败",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    // 重新组织字段分组 - 只有姓名、手机号、证件类型、证件号码是必填
    const fieldGroups = [
        {
            title: "身份信息（必填）",
            description: "请填写用户的身份信息",
            icon: User,
            required: true,
            fields: [
                {name: "realName", label: "姓名", icon: User, required: true},
                {name: "phone", label: "手机号码", icon: Phone, required: true, type: "tel", disabled: true},
            ]
        },
        {
            title: "证件信息（必填）",
            description: "请填写用户的身份认证信息",
            icon: IdCard,
            required: true,
            fields: [
                {
                    name: "idType",
                    label: "证件类型",
                    icon: IdCard,
                    type: "select",
                    options: ID_TYPES,
                    required: true,
                    placeholder: "请选择证件类型"
                },
                {name: "idNumber", label: "证件号码", icon: IdCard, required: true},
            ]
        },
        {
            title: "账户信息",
            description: "可选填写用户的账户相关信息",
            icon: Mail,
            required: true,
            fields: [
                {name: "email", label: "邮箱", icon: Mail, required: false, type: "email"},
            ]
        },
        {
            title: "教育背景（选填）",
            description: "可选填写用户的教育背景信息",
            icon: GraduationCap,
            required: false,
            fields: [
                {
                    name: "education",
                    label: "学历",
                    icon: GraduationCap,
                    type: "select",
                    options: EDUCATION_LEVELS,
                    required: false,
                    placeholder: "可选项，请选择学历"
                },
                {name: "field", label: "专业领域", icon: Target, required: false},
            ]
        },
        {
            title: "职业信息（选填）",
            description: "可选填写用户的职业信息",
            icon: Briefcase,
            required: false,
            fields: [
                {name: "title", label: "职称", icon: Briefcase, required: false},
            ]
        }
    ];

    // 为证件号码字段获取证件类型
    const idTypeValue = formData.idType as 'NATIONAL_ID' | 'PASSPORT' | 'OTHER' | undefined;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="max-w-2xl max-h-[90vh] flex flex-col"
                onInteractOutside={(e) => e.preventDefault()}
            >
                <DialogHeader className="pb-4">
                    <DialogTitle className="text-xl font-bold flex items-center gap-2">
                        <User className="h-5 w-5"/>
                        编辑用户信息
                    </DialogTitle>
                    <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">
                            请完善用户信息，确保必填字段准确无误
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                                <Asterisk className="h-3 w-3 text-red-500"/>
                                <span>标记的字段为必填项</span>
                            </div>
                            <div className="w-px h-3 bg-border"></div>
                            <span>用户名和邮箱为选填项</span>
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-hidden overflow-y-auto">
                    <ScrollArea className="h-full w-full pr-4">
                        <FormValidator onSubmit={handleSubmit} className="space-y-6">
                            {fieldGroups.map((group, groupIndex) => (
                                <Card key={group.title}
                                      className={group.required ? "border-l-4 border-l-red-500" : "border-l-4 border-l-blue-500"}>
                                    <CardContent className="p-4">
                                        <div className="mb-4">
                                            <div className="flex items-center gap-2 mb-1">
                                                <group.icon
                                                    className={`h-4 w-4 ${group.required ? 'text-red-500' : 'text-blue-500'}`}/>
                                                <h3 className="font-semibold text-base">{group.title}</h3>
                                                {!group.required && (
                                                    <span
                                                        className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">选填</span>
                                                )}
                                            </div>
                                            <p className="text-xs text-muted-foreground ml-6">{group.description}</p>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {group.fields.map((field) => (
                                                <div key={field.name} className="space-y-2">
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <field.icon className="h-3 w-3"/>
                                                        {field.label}
                                                        {field.required ? (
                                                            <Asterisk className="h-3 w-3 text-red-500"/>
                                                        ) : (
                                                            <span className="text-xs text-muted-foreground">选填</span>
                                                        )}
                                                    </div>
                                                    {field.type === "select" ? (
                                                        <ValidatedSelect required={field.required}
                                                                         name={field.name}
                                                                         placeholder={field.placeholder || (field.required ? `请选择${field.label}` : `可选项，请选择${field.label}`)}
                                                                         errorMessage={`请选择${field.label}`}
                                                                         value={formData[field.name as keyof typeof formData] as string}
                                                                         onValueChange={(value) => handleInputChange(field.name, value)}>
                                                            <SelectContent>
                                                                {Object.entries(field.options!).map(([key, value]) => (
                                                                    <SelectItem key={key} value={key}>
                                                                        {value.toString()}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </ValidatedSelect>
                                                    ) : (
                                                        <Input
                                                            value={formData[field.name as keyof typeof formData] as string}
                                                            onChange={(e) => handleInputChange(field.name, e.target.value)}
                                                            disabled={field.disabled}
                                                            type={field.type || "text"}
                                                            placeholder={field.required ? `请输入${field.label}` : `可选项，请输入${field.label}`}
                                                            className="transition-colors focus:border-primary"
                                                            idType={field.name === 'idNumber' ? idTypeValue : undefined}
                                                            required={field.required}
                                                            validationType={
                                                                field.name === 'phone' ? 'phone' :
                                                                    field.name === 'email' ? 'email' :
                                                                        field.name === 'idNumber' ? 'idNumber' : undefined
                                                            }
                                                            validateOnSubmit={field.required}
                                                        />
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                    {groupIndex < fieldGroups.length - 1 && (
                                        <Separator className="mx-4 w-auto"/>
                                    )}
                                </Card>
                            ))}

                            <div
                                className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-4 border-t">
                                <div className="text-xs text-muted-foreground">
                                    必填字段：姓名、手机号、证件类型、证件号码
                                </div>
                                <div className="flex space-x-3 w-full sm:w-auto">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => onOpenChange(false)}
                                        disabled={isLoading}
                                        className="min-w-20 flex-1 sm:flex-none"
                                    >
                                        取消
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={isLoading}
                                        className="min-w-20 flex-1 sm:flex-none"
                                    >
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin mr-2"/>
                                                保存中...
                                            </>
                                        ) : (
                                            "保存更改"
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </FormValidator>
                    </ScrollArea>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default EditUserDialog;