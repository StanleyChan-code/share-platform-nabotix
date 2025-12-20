import { useState } from "react";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { useToast } from "@/hooks/use-toast.ts";
import {userApi, CreateUserRequest} from "@/integrations/api/userApi.ts";
import { AdminInstitutionSelector } from "@/components/admin/AdminInstitutionSelector.tsx";

interface CreateUserFormProps {
  onUserCreated: () => void;
}

const CreateUserForm = ({ onUserCreated }: CreateUserFormProps) => {
  const [formData, setFormData] = useState({
    username: "",
    realName: "",
    phone: "",
    email: "",
    password: "",
    institutionId: ""
  });
  
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleInstitutionSelect = (institutionId: string | null) => {
    setFormData(prev => ({
      ...prev,
      institutionId: institutionId || ""
    }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const request: CreateUserRequest = {
        username: formData.username,
        realName: formData.realName,
        phone: formData.phone,
        email: formData.email,
        password: formData.password,
        institutionId: formData.institutionId
      };

      await userApi.createUser(request);
      
      toast({
        title: "成功",
        description: "用户创建成功。",
      });

      // Reset form
      setFormData({
        username: "",
        realName: "",
        phone: "",
        email: "",
        password: "",
        institutionId: ""
      });
      
      onUserCreated();
    } catch (error: any) {
      console.error("创建用户时出错:", error);
      toast({
        title: "错误",
        description: error.response?.data?.message || "创建用户时发生未知错误",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>创建新用户</CardTitle>
        <CardDescription>填写以下信息创建新用户</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">用户名 *</Label>
            <Input
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="请输入用户名"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="realName">真实姓名 *</Label>
            <Input
              id="realName"
              name="realName"
              value={formData.realName}
              onChange={handleChange}
              placeholder="请输入真实姓名"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="phone">手机号 *</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              placeholder="请输入手机号"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">邮箱地址 *</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="请输入邮箱地址"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">密码 *</Label>
            <Input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="请输入密码"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label>所属机构 *</Label>
            <AdminInstitutionSelector 
              value={formData.institutionId || null}
              onChange={handleInstitutionSelect}
            />
          </div>
          
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "创建中..." : "创建用户"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default CreateUserForm;