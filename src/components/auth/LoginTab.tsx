import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { api, ApiError } from "@/integrations/api/client";
import { login, sendVerificationCode, getCurrentUser, getCurrentUserRoles } from "@/integrations/api/authApi";
import { institutionApi } from "@/integrations/api/institutionApi";
import { Phone, Lock, Shield, Mail, Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { FormValidator, InputWrapper } from "@/components/ui/FormValidator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface LoginTabProps {
  phone: string;
  setPhone: (phone: string) => void;
  onLoginSuccess: () => void;
}

type LoginType = "PASSWORD" | "VERIFICATION_CODE";

const LoginTab = ({ phone, setPhone, onLoginSuccess }: LoginTabProps) => {
  const [password, setPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [loginType, setLoginType] = useState<LoginType>("PASSWORD");
  const [loading, setLoading] = useState(false);
  const [sendCodeLoading, setSendCodeLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);

  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const phoneInputRef = useRef<any>(null);
  const passwordInputRef = useRef<any>(null);
  const verificationCodeInputRef = useRef<any>(null);

  const { toast } = useToast();
  const navigate = useNavigate();

  // 清理定时器
  useEffect(() => {
    return () => {
      if (countdownRef.current) {
        clearTimeout(countdownRef.current);
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

  // 验证表单是否可提交
  useEffect(() => {
    const validateForm = () => {
      if (!phone) return false;

      // 验证手机号格式
      const phoneRegex = /^1[3-9]\d{9}$/;
      if (!phoneRegex.test(phone)) return false;

      if (loginType === "PASSWORD") {
        return password.length >= 6;
      } else {
        return verificationCode.length === 6;
      }
    };

    setIsFormValid(validateForm());
  }, [phone, password, verificationCode, loginType]);

  // 发送验证码前的验证
  const validateBeforeSendCode = useCallback((): boolean => {
    if (!phone) {
      toast({
        title: "请输入手机号",
        description: "请先输入您的手机号码",
        variant: "destructive",
      });
      return false;
    }

    // 验证手机号格式
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      toast({
        title: "手机号格式错误",
        description: "请输入有效的11位手机号码",
        variant: "destructive",
      });
      return false;
    }

    return true;
  }, [phone, toast]);

  const handleSendVerificationCode = async () => {
    // 先进行验证
    if (!validateBeforeSendCode()) {
      return;
    }

    // 检查倒计时
    if (countdown > 0) {
      toast({
        title: "请稍后重试",
        description: `${countdown}秒后可重新发送验证码`,
      });
      return;
    }

    setSendCodeLoading(true);
    try {
      const response = await sendVerificationCode(phone, "LOGIN");

      if (response.data.success) {
        toast({
          title: "验证码已发送",
          description: "请注意查收短信，验证码5分钟内有效",
        });
        setCountdown(60);
      } else {
        toast({
          title: "发送失败",
          description: response.data.message || "请稍后重试",
          variant: "destructive",
        });
      }
    } catch (error: unknown) {
      const apiError = error as ApiError;
      toast({
        title: "发送失败",
        description: apiError.response?.data?.message || "网络错误，请检查网络连接",
        variant: "destructive",
      });
    } finally {
      setSendCodeLoading(false);
    }
  };

  // 处理登录类型切换
  const handleLoginTypeChange = (type: LoginType) => {
    setLoginType(type);
    // 切换时清空另一个字段
    if (type === "PASSWORD") {
      setVerificationCode("");
    } else {
      setPassword("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isFormValid) {
      toast({
        title: "请完善信息",
        description: "请检查手机号和登录信息的格式",
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
        localStorage.setItem('authToken', token);

        // 获取用户信息
        await fetchUserInfo();

      } else {
        throw new Error(response.data.message || "登录失败");
      }
    } catch (error: unknown) {
      console.error("Login error:", error);
      const apiError = error as ApiError;
      let errorMessage = "登录过程中发生错误";

      if (apiError.response?.data?.message) {
        errorMessage = apiError.response.data.message;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      toast({
        title: "登录失败",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // 获取用户信息函数
  const fetchUserInfo = async () => {
    try {
      // 并行获取用户信息和角色
      const [userResponse, rolesResponse] = await Promise.all([
        getCurrentUser(),
        getCurrentUserRoles()
      ]);

      if (!userResponse.data.success || !rolesResponse.data.success) {
        throw new Error("获取用户信息失败");
      }

      const userProfile = userResponse.data.data;
      const userRoles = rolesResponse.data.data;

      // 获取机构信息（如果有）
      let institution = null;
      if (userProfile.institutionId) {
        try {
          const institutionResponse = await institutionApi.getInstitutionById(userProfile.institutionId);
          if (institutionResponse.success) {
            institution = institutionResponse.data;
          }
        } catch (error) {
          console.warn("获取机构信息失败:", error);
        }
      }

      // 存储用户信息
      const userInfo = {
        user: userProfile,
        roles: userRoles,
        institution: institution
      };

      sessionStorage.setItem('userInfo', JSON.stringify(userInfo));

      toast({
        title: "登录成功",
        description: `欢迎回来，${userProfile.realName || userProfile.username}!`,
      });

      onLoginSuccess();
      navigate('/');

    } catch (error: any) {
      console.error("获取用户信息失败:", error);
      throw new Error(error?.message || "获取用户信息失败");
    }
  };

  // 快速填充测试数据（开发环境使用）
  const fillTestData = () => {
    if (process.env.NODE_ENV === 'development') {
      setPhone('13800138000');
      if (loginType === 'PASSWORD') {
        setPassword('123456');
      } else {
        setVerificationCode('123456');
      }
    }
  };

  return (
          <FormValidator onSubmit={handleSubmit}>
            <div className="space-y-4">
              {/* 手机号输入 */}
              <div className="space-y-2">
                <Label htmlFor="login-phone" className="text-sm font-medium">手机号 *</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <InputWrapper required validationType="phone">
                    <Input
                        id="login-phone"
                        type="tel"
                        placeholder="请输入手机号"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="pl-10 h-11"
                        maxLength={11}
                        ref={phoneInputRef}
                    />
                  </InputWrapper>
                </div>
              </div>

              {/* 登录方式切换 */}
              <Tabs value={loginType} onValueChange={handleLoginTypeChange} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="PASSWORD">密码登录</TabsTrigger>
                  <TabsTrigger value="VERIFICATION_CODE">验证码登录</TabsTrigger>
                </TabsList>

                <TabsContent value="PASSWORD" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-password" className="text-sm font-medium">密码 *</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <InputWrapper required validationType="password">
                        <Input
                            id="login-password"
                            type={showPassword ? "text" : "password"}
                            placeholder="请输入密码"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="pl-10 pr-10 h-11"
                            ref={passwordInputRef}
                        />
                      </InputWrapper>
                      <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="VERIFICATION_CODE" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-verification-code" className="text-sm font-medium">验证码 *</Label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Shield className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <InputWrapper required validationType="verificationCode">
                          <Input
                              id="login-verification-code"
                              type="text"
                              placeholder="请输入6位验证码"
                              value={verificationCode}
                              onChange={(e) => setVerificationCode(e.target.value)}
                              className="pl-10 h-11"
                              maxLength={6}
                              ref={verificationCodeInputRef}
                          />
                        </InputWrapper>
                      </div>
                      <Button
                          type="button"
                          onClick={handleSendVerificationCode}
                          disabled={sendCodeLoading || countdown > 0 || !phone}
                          className={cn(
                              "whitespace-nowrap px-4 h-11",
                              countdown > 0 ? "bg-gray-100 text-gray-400" : "bg-blue-500 text-white"
                          )}
                          variant={countdown > 0 ? "outline" : "default"}
                      >
                        {sendCodeLoading ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent mr-1" />
                              发送中
                            </>
                        ) : countdown > 0 ? (
                            `${countdown}s`
                        ) : (
                            "发送验证码"
                        )}
                      </Button>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              {/* 登录按钮 */}
              <Button
                  type="submit"
                  className="w-full h-11 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium transition-all duration-200"
                  disabled={loading || !isFormValid}
              >
                {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                      登录中...
                    </>
                ) : (
                    "立即登录"
                )}
              </Button>

            </div>
          </FormValidator>
  );
};

export default LoginTab;