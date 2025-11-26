import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Shield, Key } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SettingsTabProps {
  user: any;
}

const SettingsTab = ({ user }: SettingsTabProps) => {
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false);
  const { toast } = useToast();

  const handleResetPassword = async () => {
    if (!user?.email) return;

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/auth/v1/verify?redirect_to=/profile&tab=reset`
      });

      if (error) throw error;

      toast({
        title: "密码重置邮件已发送",
        description: "请检查您的邮箱并按照邮件中的指示重置密码",
      });

      setIsResetPasswordDialogOpen(false);
    } catch (error: any) {
      console.error('Error sending reset password email:', error);
      toast({
        title: "发送失败",
        description: error.message || "发送密码重置邮件时发生错误",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            账户安全
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h4 className="font-medium">修改密码</h4>
              <p className="text-sm text-muted-foreground">
                通过邮箱验证修改密码
              </p>
            </div>
            <Dialog open={isResetPasswordDialogOpen} onOpenChange={setIsResetPasswordDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2" onClick={() => setIsResetPasswordDialogOpen(true)}>
                  <Key className="h-4 w-4" />
                  修改密码
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>确认密码重置</DialogTitle>
                  <DialogDescription>
                    您确定要重置密码吗？系统将向您的邮箱 {user?.email} 发送密码重置链接。
                  </DialogDescription>
                </DialogHeader>
                <div className="flex justify-end space-x-2 mt-4">
                  <Button variant="outline" onClick={() => setIsResetPasswordDialogOpen(false)}>
                    取消
                  </Button>
                  <Button onClick={handleResetPassword}>
                    确认发送
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h4 className="font-medium">登录记录</h4>
              <p className="text-sm text-muted-foreground">
                最后登录：{user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : "未知"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>通知设置</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">申请状态更新</h4>
              <p className="text-sm text-muted-foreground">
                当数据申请状态发生变化时通知我
              </p>
            </div>
            <Button variant="outline" size="sm">
              已开启
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">新数据集发布</h4>
              <p className="text-sm text-muted-foreground">
                有新的数据集发布时通知我
              </p>
            </div>
            <Button variant="outline" size="sm">
              已开启
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
};

export default SettingsTab;