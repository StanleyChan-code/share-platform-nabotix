import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { api, ApiError } from "@/integrations/api/client";
import { login, sendVerificationCode } from "@/integrations/api/authApi";
import { Phone, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface LoginTabProps {
  phone: string;
  setPhone: (phone: string) => void;
  onLoginSuccess: () => void;
}

const LoginTab = ({ phone, setPhone, onLoginSuccess }: LoginTabProps) => {
  const [password, setPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [loginType, setLoginType] = useState("PASSWORD"); // PASSWORD or VERIFICATION_CODE
  const [loading, setLoading] = useState(false);
  const [sendCodeLoading, setSendCodeLoading] = useState(false);
  const [countdown, setCountdown] = useState(0); // 登录验证码倒计时状态
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  // 清理定时器
  useEffect(() => {
    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, []);

  // 处理倒计时
  useEffect(() => {
    if (countdown > 0) {
      countdownRef.current = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
    }
    return () => {
      if (countdownRef.current) {
        clearTimeout(countdownRef.current);
      }
    };
  }, [countdown]);

  const handleSendVerificationCode = async () => {
    if (!phone) {
      toast({
        title: "错误",
        description: "请输入手机号。",
        variant: "destructive",
      });
      return;
    }

    // 检查倒计时
    if (countdown > 0) {
      toast({
        title: "提示",
        description: `请在 ${countdown} 秒后重新发送验证码`,
      });
      return;
    }

    setSendCodeLoading(true);
    try {
      const response = await sendVerificationCode(phone, "LOGIN");

      if (response.data.success) {
        toast({
          title: "发送成功",
          description: "验证码已发送至您的手机。",
        });
        setCountdown(60);
      } else {
        toast({
          title: "发送失败",
          description: response.data.message,
          variant: "destructive",
        });
      }
    } catch (error: unknown) {
      const apiError = error as ApiError;
      toast({
        title: "错误",
        description: apiError.response?.data?.message || "发送验证码过程中发生错误。",
        variant: "destructive",
      });
    } finally {
      setSendCodeLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!phone) {
      toast({
        title: "错误",
        description: "请输入手机号。",
        variant: "destructive",
      });
      return;
    }

    if (loginType === "PASSWORD" && !password) {
      toast({
        title: "错误",
        description: "请输入密码。",
        variant: "destructive",
      });
      return;
    }

    if (loginType === "VERIFICATION_CODE" && !verificationCode) {
      toast({
        title: "错误",
        description: "请输入验证码。",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const requestData: any = {
        phone,
        loginType
      };

      if (loginType === "PASSWORD") {
        requestData.password = password;
      } else {
        requestData.verificationCode = verificationCode;
      }

      const response = await login(requestData);

      if (response.data.success) {
        const token = response.data.data.token;
        api.setAuthToken(token);
        localStorage.setItem('authToken', token); // 保存令牌到localStorage
        toast({
          title: "登录成功",
          description: "欢迎回来！",
        });
        onLoginSuccess();
        navigate('/');
      } else {
        toast({
          title: "登录失败",
          description: response.data.message || "登录失败，请稍后重试。",
          variant: "destructive",
        });
      }
    } catch (error: unknown) {
      const apiError = error as ApiError;
      console.error("Login error:", error);
      toast({
        title: "错误",
        description: apiError.response?.data?.message || "登录过程中发生错误。",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="login-phone">手机号</Label>
        <div className="relative">
          <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="login-phone"
            type="tel"
            placeholder="请输入手机号"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="pl-10"
            required
          />
        </div>
      </div>
      
      <div className="flex space-x-2">
        <Button 
          type="button" 
          variant="outline" 
          onClick={() => setLoginType("PASSWORD")}
          className={loginType === "PASSWORD" ? "bg-primary text-primary-foreground" : ""}
        >
          密码登录
        </Button>
        <Button 
          type="button" 
          variant="outline" 
          onClick={() => setLoginType("VERIFICATION_CODE")}
          className={loginType === "VERIFICATION_CODE" ? "bg-primary text-primary-foreground" : ""}
        >
          验证码登录
        </Button>
      </div>
      
      {loginType === "PASSWORD" ? (
        <div className="space-y-2">
          <Label htmlFor="login-password">密码</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="login-password"
              type="password"
              placeholder="请输入密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10"
              required
            />
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <Label htmlFor="login-verification-code">验证码</Label>
          <div className="flex space-x-2">
            <div className="relative flex-1">
              <Input
                id="login-verification-code"
                type="text"
                placeholder="请输入验证码"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                required
              />
            </div>
            <Button 
              type="button" 
              onClick={handleSendVerificationCode}
              disabled={sendCodeLoading || !phone || countdown > 0}
            >
              {sendCodeLoading ? "发送中..." : countdown > 0 ? `${countdown}秒后重发` : "发送"}
            </Button>
          </div>
        </div>
      )}
      
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "登录中..." : "登录"}
      </Button>
    </form>
  );
};

export default LoginTab;