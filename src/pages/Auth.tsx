import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {api, ApiError} from "@/integrations/api/client";
import { login, register, sendVerificationCode } from "@/integrations/api/authApi.ts";
import { Shield, Phone, Lock, User as UserIcon, Mail, Send } from "lucide-react";

const Auth = () => {
  const [user, setUser] = useState<any | null>(null);
  const [session, setSession] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [sendCodeLoading, setSendCodeLoading] = useState(false);
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [username, setUsername] = useState("");
  const [realName, setRealName] = useState("");
  const [email, setEmail] = useState("");
  const [activeTab, setActiveTab] = useState("login");
  const [loginType, setLoginType] = useState("PASSWORD"); // PASSWORD or VERIFICATION_CODE
  const [loginCountdown, setLoginCountdown] = useState(0); // 登录验证码倒计时状态
  const [signupCountdown, setSignupCountdown] = useState(0); // 注册验证码倒计时状态
  const loginCountdownRef = useRef<NodeJS.Timeout | null>(null);
  const signupCountdownRef = useRef<NodeJS.Timeout | null>(null);
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const navigate = useNavigate();

  // 清理定时器
  useEffect(() => {
    return () => {
      if (loginCountdownRef.current) {
        clearInterval(loginCountdownRef.current);
      }
      if (signupCountdownRef.current) {
        clearInterval(signupCountdownRef.current);
      }
    };
  }, []);

  // 处理登录倒计时
  useEffect(() => {
    if (loginCountdown > 0) {
      loginCountdownRef.current = setTimeout(() => {
        setLoginCountdown(loginCountdown - 1);
      }, 1000);
    }
    return () => {
      if (loginCountdownRef.current) {
        clearTimeout(loginCountdownRef.current);
      }
    };
  }, [loginCountdown]);

  // 处理注册倒计时
  useEffect(() => {
    if (signupCountdown > 0) {
      signupCountdownRef.current = setTimeout(() => {
        setSignupCountdown(signupCountdown - 1);
      }, 1000);
    }
    return () => {
      if (signupCountdownRef.current) {
        clearTimeout(signupCountdownRef.current);
      }
    };
  }, [signupCountdown]);

  const handleSendVerificationCode = async (businessType: string) => {
    if (!phone) {
      toast({
        title: "错误",
        description: "请输入手机号。",
        variant: "destructive",
      });
      return;
    }

    // 根据业务类型检查对应的倒计时
    if (businessType === "LOGIN" && loginCountdown > 0) {
      toast({
        title: "提示",
        description: `请在 ${loginCountdown} 秒后重新发送验证码`,
      });
      return;
    }
    
    if (businessType === "REGISTER" && signupCountdown > 0) {
      toast({
        title: "提示",
        description: `请在 ${signupCountdown} 秒后重新发送验证码`,
      });
      return;
    }

    setSendCodeLoading(true);
    try {
      const response = await sendVerificationCode(phone, businessType);

      if (response.data.success) {
        toast({
          title: "发送成功",
          description: "验证码已发送至您的手机。",
        });
        // 根据业务类型启动对应倒计时
        if (businessType === "LOGIN") {
          setLoginCountdown(60);
        } else if (businessType === "REGISTER") {
          setSignupCountdown(60);
        }
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
        setUser({ id: response.data.data.user.id, user: response.data.data.user });
        setSession({ token });
        toast({
          title: "登录成功",
          description: "欢迎回来！",
        });
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

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !verificationCode || !username || !realName || !password) {
      toast({
        title: "错误",
        description: "请填写所有必填字段。",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "错误",
        description: "两次输入的密码不一致。",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "错误",
        description: "密码长度至少为6位。",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await register({
        phone,
        verificationCode,
        username,
        realName,
        email,
        password
      });

      if (response.data.success) {
        toast({
          title: "注册成功",
          description: "账户已创建，请登录。",
        });
        // Switch to login tab after successful signup
        setActiveTab("login");
      } else {
        toast({
          title: "注册失败",
          description: response.data.message,
          variant: "destructive",
        });
      }
    } catch (error: unknown) {
      const apiError = error as ApiError;
      toast({
        title: "错误",
        description: apiError.response?.data?.message || "注册过程中发生错误。",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Shield className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl">欢迎使用数据共享平台</CardTitle>
          <CardDescription>
            登录或注册以访问您的账户
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">登录</TabsTrigger>
              <TabsTrigger value="signup">注册</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
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
                        onClick={() => handleSendVerificationCode("LOGIN")}
                        disabled={sendCodeLoading || !phone || loginCountdown > 0}
                      >
                        {sendCodeLoading ? "发送中..." : loginCountdown > 0 ? `${loginCountdown}秒后重发` : "发送"}
                      </Button>
                    </div>
                  </div>
                )}
                
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "登录中..." : "登录"}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-phone">手机号 *</Label>
                  <div className="flex space-x-2">
                    <div className="relative flex-1">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-phone"
                        type="tel"
                        placeholder="请输入手机号"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                    <Button 
                      type="button" 
                      onClick={() => handleSendVerificationCode("REGISTER")}
                      disabled={sendCodeLoading || !phone || signupCountdown > 0}
                    >
                      <Send className="h-4 w-4 mr-2" />
                      {sendCodeLoading ? "发送中..." : signupCountdown > 0 ? `${signupCountdown}秒后重发` : "发送"}
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signup-verification-code">验证码 *</Label>
                  <div className="relative">
                    <Input
                      id="signup-verification-code"
                      type="text"
                      placeholder="请输入验证码"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signup-username">用户名 *</Label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signup-username"
                      type="text"
                      placeholder="请输入用户名"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signup-realname">真实姓名 *</Label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signup-realname"
                      type="text"
                      placeholder="请输入真实姓名"
                      value={realName}
                      onChange={(e) => setRealName(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signup-email">邮箱</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="请输入邮箱"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signup-password">密码 *</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="请输入密码（至少6位）"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">确认密码 *</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="请再次输入密码"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "注册中..." : "注册"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;