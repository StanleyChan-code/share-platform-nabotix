import {useState} from "react";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {Dialog, DialogContent, DialogHeader, DialogTitle} from "@/components/ui/dialog";
import {useToast} from "@/hooks/use-toast";
import {supabase} from "@/integrations/supabase/client";
import type {Database} from "@/integrations/supabase/types";

type InstitutionType = Database["public"]["Enums"]["institution_type"];
type IdType = Database["public"]["Enums"]["id_type"];

interface AddInstitutionFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onInstitutionAdded: () => void;
}

const AddInstitutionForm = ({open, onOpenChange, onInstitutionAdded}: AddInstitutionFormProps) => {
    const {toast} = useToast();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        full_name: "",
        short_name: "",
        type: "" as InstitutionType,
        contact_person: "",
        contact_id_type: "" as IdType,
        contact_id_number: "",
        contact_phone: "",
        contact_email: "",
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const {id, value} = e.target;
        setFormData(prev => ({...prev, [id]: value}));
    };

    const handleSelectChange = (name: string, value: string) => {
        setFormData(prev => {
            const newData = {...prev};
            switch (name) {
                case "type":
                    newData.type = value as InstitutionType;
                    break;
                case "contact_id_type":
                    newData.contact_id_type = value as IdType;
                    break;
                default:
                    newData[name as keyof typeof formData] = value as any;
            }
            return newData;
        });
    };

    const validateForm = () => {
        const requiredFields = [
            'full_name', 'type', 'contact_person',
            'contact_id_type', 'contact_id_number', 'contact_phone', 'contact_email'
        ];

        for (const field of requiredFields) {
            if (!formData[field as keyof typeof formData]) {
                toast({
                    title: "表单验证失败",
                    description: `请填写所有必填字段: ${field}`,
                    variant: "destructive",
                });
                return false;
            }
        }

        // 简单邮箱验证
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.contact_email)) {
            toast({
                title: "表单验证失败",
                description: "请输入有效的邮箱地址",
                variant: "destructive",
            });
            return false;
        }

        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        setLoading(true);

        try {
            // 创建机构时自动使用邮箱作为用户名
            const institutionUsername = formData.contact_email;

            // 在auth.users中创建用户账户，但不自动验证
            const {data: authUser, error: authError} = await supabase.auth.signUp({
                email: formData.contact_email,
                password: "123456",
                options: {
                    emailRedirectTo: `${window.location.origin}/profile`,
                    data: {
                        real_name: formData.contact_person,
                    }
                }
            });
            console.log("authUser:", authUser)

            if (authError) throw authError;

            // 在public.institutions中创建机构记录，verified设为false
            const { data: institutionData, error: institutionError } = await supabase
                .from('institutions')
                .insert([{
                    user_id: authUser.user.id,
                    username: institutionUsername,
                    full_name: formData.full_name,
                    short_name: formData.short_name,
                    type: formData.type,
                    contact_person: formData.contact_person,
                    contact_id_type: formData.contact_id_type,
                    contact_id_number: formData.contact_id_number,
                    contact_phone: formData.contact_phone,
                    contact_email: formData.contact_email,
                    verified: false
                }])
                .select()
                .single();

            if (institutionError) throw institutionError;

            // 更新账号的机构 ID
            console.log("institutionData:", institutionData)
            let institutionId = institutionData.id;
            if (!institutionId) {
                const {data: institutionIdData, error: institutionError} = await supabase
                    .from('institutions')
                    .select('id')
                    .eq('user_id', authUser.user.id)
                    .single();
                institutionId = institutionIdData.id;
            }
            console.log("institutionId:", institutionId)

            // 如果auth用户创建成功，则在public.users中创建用户记录
            // 使用RPC函数绕过RLS限制
            if (authUser.user) {
                const {error: userError} = await supabase.rpc('create_institution_user_profile', {
                    user_id: authUser.user.id,
                    user_username: institutionUsername,
                    user_real_name: formData.contact_person,
                    user_email: formData.contact_email,
                    user_phone: formData.contact_phone,
                    user_id_type: formData.contact_id_type,
                    user_id_number: formData.contact_id_number,
                    user_institution_id: institutionId
                });

                if (userError) throw userError;
            }

            toast({
                title: "机构添加成功",
                description: "新机构已成功添加，等待邮箱验证。",
            });

            // 重置表单
            setFormData({
                full_name: "",
                short_name: "",
                type: "" as InstitutionType,
                contact_person: "",
                contact_id_type: "" as IdType,
                contact_id_number: "",
                contact_phone: "",
                contact_email: "",
            });

            // 通知父组件刷新机构列表并关闭对话框
            onInstitutionAdded();
            onOpenChange(false);
        } catch (error) {
            console.error('添加机构失败:', error);
            const errorMessage = error instanceof Error ? error.message : String(error);
            toast({
                title: "添加失败",
                description: `添加新机构时发生错误：${errorMessage || '请重试'}`,
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>添加新机构</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="full_name">机构全称 *</Label>
                            <Input
                                id="full_name"
                                value={formData.full_name}
                                onChange={handleInputChange}
                                placeholder="机构的完整名称"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="type">机构类型 *</Label>
                            <Select value={formData.type} onValueChange={(value) => handleSelectChange("type", value)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="选择机构类型"/>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="hospital">医院</SelectItem>
                                    <SelectItem value="university">大学</SelectItem>
                                    <SelectItem value="research_center">研究中心</SelectItem>
                                    <SelectItem value="lab">实验室</SelectItem>
                                    <SelectItem value="government">政府部门</SelectItem>
                                    <SelectItem value="enterprise">企业</SelectItem>
                                    <SelectItem value="other">其他</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="short_name">机构简称</Label>
                            <Input
                                id="short_name"
                                value={formData.short_name}
                                onChange={handleInputChange}
                                placeholder="机构的简称或缩写"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="contact_email">登录账号 / 联系邮箱 *</Label>
                            <Input
                                id="contact_email"
                                type="email"
                                value={formData.contact_email}
                                onChange={handleInputChange}
                                placeholder="联系人邮箱地址"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="contact_person">联系人 *</Label>
                            <Input
                                id="contact_person"
                                value={formData.contact_person}
                                onChange={handleInputChange}
                                placeholder="机构联系人姓名"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="contact_phone">联系电话 *</Label>
                            <Input
                                id="contact_phone"
                                value={formData.contact_phone}
                                onChange={handleInputChange}
                                placeholder="联系人电话号码"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="contact_id_type">联系人证件类型 *</Label>
                            <Select value={formData.contact_id_type}
                                    onValueChange={(value) => handleSelectChange("contact_id_type", value)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="选择证件类型"/>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="national_id">身份证</SelectItem>
                                    <SelectItem value="passport">护照</SelectItem>
                                    <SelectItem value="other">其他</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="contact_id_number">联系人证件号码 *</Label>
                            <Input
                                id="contact_id_number"
                                value={formData.contact_id_number}
                                onChange={handleInputChange}
                                placeholder="联系人证件号码"
                                required
                            />
                        </div>
                    </div>

                    <div className="flex justify-end space-x-2 pt-4">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            取消
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? "提交中..." : "添加机构"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default AddInstitutionForm;