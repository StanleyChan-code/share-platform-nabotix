import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { useToast } from "@/hooks/use-toast.ts";
import { institutionApi, Institution } from "@/integrations/api/institutionApi.ts";
import { Loader2 } from "lucide-react";
import { InstitutionTypes } from "@/lib/enums.ts";
import { getCurrentUserRoles } from "@/lib/authUtils.ts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.tsx";

interface InstitutionProfileTabProps {
  institutionId: string;
}

const InstitutionProfileTab = ({ institutionId }: InstitutionProfileTabProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [institution, setInstitution] = useState<Institution | null>(null);
  const [formData, setFormData] = useState<Partial<Institution>>({});
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);

  useEffect(() => {
    const checkUserRole = async () => {
      try {
        const roles = getCurrentUserRoles();
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
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!institution) return;

    try {
      setSaving(true);
      
      // 准备要更新的数据，排除不可更改的字段
      const updateData: Partial<Institution> = {
        shortName: formData.shortName,
        contactPhone: formData.contactPhone,
        contactEmail: formData.contactEmail,
      };

      // 只有平台管理员可以修改敏感字段
      if (isPlatformAdmin) {
        updateData.fullName = formData.fullName;
        updateData.type = formData.type;
        updateData.contactPerson = formData.contactPerson;
        updateData.contactIdType = formData.contactIdType;
        updateData.contactIdNumber = formData.contactIdNumber;
      }

      // 平台管理员可以直接更新任意机构
      // 机构管理员只能更新自己的机构
      if (isPlatformAdmin && institutionId) {
        await institutionApi.updateInstitution(institutionId, updateData);
      } else {
        await institutionApi.updateCurrentUserInstitution(updateData);
      }
      
      toast({
        title: "更新成功",
        description: "机构信息已成功更新",
      });
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

  if (!institution) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500"></p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">机构基本信息</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">机构全称 *</Label>
              <Input
                id="fullName"
                value={formData.fullName || ""}
                onChange={handleInputChange}
                placeholder="机构的完整名称"
                required
                readOnly={!isPlatformAdmin}
                className={!isPlatformAdmin ? "bg-gray-100 cursor-not-allowed" : ""}
              />
              {!isPlatformAdmin && (
                <p className="text-sm text-muted-foreground">只有平台管理员可以修改此项</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">机构类型 *</Label>
              <Select 
                value={formData.type || ""} 
                onValueChange={(value) => handleSelectChange("type", value)}
                disabled={!isPlatformAdmin}
              >
                <SelectTrigger className={!isPlatformAdmin ? "bg-gray-100 opacity-50" : ""}>
                  <SelectValue placeholder="选择机构类型" />
                </SelectTrigger>
                <SelectContent>
                  {
                    Object.entries(InstitutionTypes).map(([key, value]) => (
                      <SelectItem key={key} value={key}>{value}</SelectItem>
                    ))
                  }
                </SelectContent>
              </Select>
              {!isPlatformAdmin && (
                <p className="text-sm text-muted-foreground">只有平台管理员可以修改此项</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="shortName">机构简称</Label>
              <Input
                id="shortName"
                value={formData.shortName || ""}
                onChange={handleInputChange}
                placeholder="机构的简称或缩写"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactEmail">联系邮箱 *</Label>
              <Input
                id="contactEmail"
                type="email"
                value={formData.contactEmail || ""}
                onChange={handleInputChange}
                placeholder="联系人邮箱地址"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactPerson">联系人 *</Label>
              <Input
                id="contactPerson"
                value={formData.contactPerson || ""}
                onChange={handleInputChange}
                placeholder="机构联系人姓名"
                required
                readOnly={!isPlatformAdmin}
                className={!isPlatformAdmin ? "bg-gray-100 cursor-not-allowed" : ""}
              />
              {!isPlatformAdmin && (
                <p className="text-sm text-muted-foreground">只有平台管理员可以修改此项</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactPhone">联系电话 *</Label>
              <Input
                id="contactPhone"
                value={formData.contactPhone || ""}
                onChange={handleInputChange}
                placeholder="联系人电话号码"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactIdType">联系人证件类型 *</Label>
              <Select 
                value={formData.contactIdType || ""} 
                onValueChange={(value) => handleSelectChange("contactIdType", value)}
                disabled={!isPlatformAdmin}
              >
                <SelectTrigger className={!isPlatformAdmin ? "bg-gray-100 opacity-50" : ""}>
                  <SelectValue placeholder="选择证件类型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NATIONAL_ID">身份证</SelectItem>
                  <SelectItem value="PASSPORT">护照</SelectItem>
                  <SelectItem value="OTHER">其他</SelectItem>
                </SelectContent>
              </Select>
              {!isPlatformAdmin && (
                <p className="text-sm text-muted-foreground">只有平台管理员可以修改此项</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactIdNumber">联系人证件号码 *</Label>
              <Input
                id="contactIdNumber"
                value={formData.contactIdNumber || ""}
                onChange={handleInputChange}
                placeholder="联系人证件号码"
                required
                readOnly={!isPlatformAdmin}
                className={!isPlatformAdmin ? "bg-gray-100 cursor-not-allowed" : ""}
              />
              {!isPlatformAdmin && (
                <p className="text-sm text-muted-foreground">只有平台管理员可以修改此项</p>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="submit" disabled={saving}>
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
        </form>
      </div>
    </div>
  );
};

export default InstitutionProfileTab;