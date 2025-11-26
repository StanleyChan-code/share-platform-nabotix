import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface AddUserToInstitutionFormProps {
  institutionId: string;
  onUserAdded: () => void;
}

const AddUserToInstitutionForm = ({ institutionId, onUserAdded }: AddUserToInstitutionFormProps) => {
  const [realName, setRealName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 首先检查用户是否存在
      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('id, real_name, email, institution_id')
        .eq('email', email)
        .maybeSingle();

      if (fetchError) {
        throw new Error(`查询用户时出错: ${fetchError.message}`);
      }
      console.log("existingUser:", existingUser)

      if (existingUser) {
        // 用户存在，检查是否有机构
        if (existingUser.institution_id) {
          // 用户已经有机构
          toast({
            title: "操作失败",
            description: `用户 ${existingUser.real_name} 已经属于其他机构，无法添加到当前机构。`,
            variant: "destructive",
          });
          return;
        } else {
          // 用户没有机构，更新其机构ID
          const { error: updateError } = await supabase
            .from('users')
            .update({ institution_id: institutionId })
            .eq('id', existingUser.id);

          if (updateError) {
            throw new Error(`更新用户机构信息时出错: ${updateError.message}`);
          }

          toast({
            title: "成功",
            description: `用户 ${existingUser.real_name} 已成功添加到当前机构。`,
          });
          resetForm();
          onUserAdded();
          return;
        }
      }

      // 用户不存在，创建新用户
      // 首先在auth.users中创建用户
      const { data: authUser, error: authError } = await supabase.auth.signUp({
        email: email,
        password: "123456",
        options: {
          emailRedirectTo: `${window.location.origin}/profile`,
          data: {
            real_name: realName,
          }
        }
      });

      if (authError) {
        throw new Error(`创建认证用户时出错: ${authError.message}`);
      }

      if (!authUser.user) {
        throw new Error("未能创建认证用户");
      }

      // 在public.users中创建用户记录
      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: authUser.user.id,
          username: email.split('@')[0],
          real_name: realName,
          email: email,
          phone: '',
          id_type: 'national_id',
          id_number: '',
          institution_id: institutionId
        });

      if (userError) {
        throw new Error(`创建用户档案时出错: ${userError.message}`);
      }

      toast({
        title: "成功",
        description: `用户 ${realName} 已成功创建并添加到当前机构。`,
      });

      resetForm();
      onUserAdded();
    } catch (error) {
      console.error("添加用户时出错:", error);
      toast({
        title: "错误",
        description: error instanceof Error ? error.message : "添加用户时发生未知错误",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setRealName("");
    setEmail("");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>添加用户到机构</CardTitle>
        <CardDescription>请输入用户的真实姓名和邮箱地址</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="realName">真实姓名 *</Label>
            <Input
              id="realName"
              value={realName}
              onChange={(e) => setRealName(e.target.value)}
              placeholder="请输入用户的真实姓名"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">邮箱地址 *</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="请输入用户的邮箱地址"
              required
            />
          </div>
          
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "添加中..." : "添加用户"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default AddUserToInstitutionForm;