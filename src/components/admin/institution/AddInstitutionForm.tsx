import {useState} from "react";
import {Button} from "@/components/ui/button.tsx";
import {Input} from "@/components/ui/input.tsx";
import {Label} from "@/components/ui/label.tsx";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select.tsx";
import {Dialog, DialogContent, DialogHeader, DialogTitle} from "@/components/ui/dialog.tsx";
import {useToast} from "@/hooks/use-toast.ts";
import {institutionApi} from "@/integrations/api/institutionApi.ts";
import {ID_TYPES, InstitutionTypes} from "@/lib/enums.ts";

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
        type: "",
        contact_person: "",
        contact_id_type: "",
        contact_id_number: "",
        contact_phone: "",
        contact_email: "",
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const {id, value} = e.target;
        setFormData(prev => ({...prev, [id]: value}));
    };

    const handleSelectChange = (name: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
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
            // 构造机构数据对象
            const institutionData = {
                fullName: formData.full_name,
                shortName: formData.short_name,
                type: formData.type,
                contactPerson: formData.contact_person,
                contactIdType: formData.contact_id_type,
                contactIdNumber: formData.contact_id_number,
                contactPhone: formData.contact_phone,
                contactEmail: formData.contact_email
            };

            // 调用API创建机构
            await institutionApi.createInstitution(institutionData);

            toast({
                title: "机构添加成功",
                description: "新机构已成功添加。",
            });

            // 重置表单
            setFormData({
                full_name: "",
                short_name: "",
                type: "",
                contact_person: "",
                contact_id_type: "",
                contact_id_number: "",
                contact_phone: "",
                contact_email: "",
            });

            // 通知父组件刷新机构列表并关闭对话框
            onInstitutionAdded();
            onOpenChange(false);
        } catch (error: any) {
            console.error('添加机构失败:', error);
            const errorMessage = error?.response?.data?.message || error?.message || '未知错误';
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
                                    {Object.entries(InstitutionTypes).map(([key, value]) => (
                                        <SelectItem key={key} value={key}>{value}</SelectItem>
                                    ))}
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
                                    {Object.entries(ID_TYPES).map(([key, value]) => (
                                        <SelectItem key={key} value={key}>{value}</SelectItem>
                                    ))}
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