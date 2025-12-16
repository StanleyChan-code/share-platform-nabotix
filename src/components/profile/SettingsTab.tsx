import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Shield, Key } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { sendVerificationCode } from "@/integrations/api/authApi";
import {api, ApiError} from "@/integrations/api/client";

interface SettingsTabProps {
  user: any;
}

const SettingsTab = ({ user }: SettingsTabProps) => {
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const { toast } = useToast();

  const handleSendVerificationCode = async () => {
    if (!user?.phone) {
      toast({
        title: "无法发送验证码",
        description: "用户手机号不存在",
        variant: "destructive",
      });
      return;
    }

    setIsSendingCode(true);
    try {
      await sendVerificationCode(user.phone, "UPDATE_PASSWORD");
      setPhone(user.phone);
      toast({
        title: "验证码已发送",
        description: "验证码已发送至您的手机，请注意查收",
      });
    } catch (error: any) {
      console.error('Error sending verification code:', error);
      toast({
        title: "发送失败",
        description: error.response?.data?.message || "发送验证码时发生错误",
        variant: "destructive",
      });
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleResetPassword = async () => {
    if (!user?.phone) {
      toast({
        title: "无法重置密码",
        description: "用户手机号不存在",
        variant: "destructive",
      });
      return;
    }

    if (!verificationCode) {
      toast({
        title: "请输入验证码",
        description: "验证码不能为空",
        variant: "destructive",
      });
      return;
    }

    if (!newPassword) {
      toast({
        title: "请输入新密码",
        description: "新密码不能为空",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "密码不匹配",
        description: "两次输入的密码不一致",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "密码长度不足",
        description: "密码至少需要6位字符",
        variant: "destructive",
      });
      return;
    }

    setIsResettingPassword(true);
    try {
      await api.put('/users/password', {
        phone: user.phone,
        verificationCode,
        newPassword
      });

      toast({
        title: "密码修改成功",
        description: "您的密码已成功修改，请使用新密码登录",
      });

      setIsResetPasswordDialogOpen(false);
      setVerificationCode("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      console.error('Error resetting password:', error);
      toast({
        title: "修改失败",
        description: error.response?.data?.message || "修改密码时发生错误",
        variant: "destructive",
      });
    } finally {
      setIsResettingPassword(false);
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
                通过手机验证码修改密码
              </p>
            </div>
            <Dialog open={isResetPasswordDialogOpen} onOpenChange={setIsResetPasswordDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2" onClick={() => setIsResetPasswordDialogOpen(true)}>
                  <Key className="h-4 w-4" />
                  修改密码
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>修改密码</DialogTitle>
                  <DialogDescription>
                    通过手机验证码修改您的登录密码
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label htmlFor="phone" className="text-right">
                      手机号
                    </label>
                    <div className="col-span-3 flex gap-2">
                      <Input
                        id="phone"
                        value={user?.phone || ""}
                        disabled
                        className="flex-1"
                      />
                      <Button 
                        onClick={handleSendVerificationCode} 
                        disabled={isSendingCode || !user?.phone}
                        variant="outline"
                      >
                        {isSendingCode ? "发送中..." : "发送验证码"}
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label htmlFor="code" className="text-right">
                      验证码
                    </label>
                    <Input
                      id="code"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      placeholder="请输入验证码"
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label htmlFor="new-password" className="text-right">
                      新密码
                    </label>
                    <Input
                      id="new-password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="请输入新密码"
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label htmlFor="confirm-password" className="text-right">
                      确认密码
                    </label>
                    <Input
                      id="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="请再次输入新密码"
                      className="col-span-3"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsResetPasswordDialogOpen(false)}>
                    取消
                  </Button>
                  <Button onClick={handleResetPassword} disabled={isResettingPassword}>
                    {isResettingPassword ? "提交中..." : "确认修改"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
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