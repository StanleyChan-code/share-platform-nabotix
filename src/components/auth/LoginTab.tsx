import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ApiError } from "@/integrations/api/client";
import { login, sendVerificationCode } from "@/integrations/api/authApi";
import { Phone, Lock, Shield, Eye, EyeOff, User, Mail } from "lucide-react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { FormValidator, Input } from "@/components/ui/FormValidator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { refreshUserInfo, isAuthenticated, clearTokens, getCurrentUserInfoFromSession } from "@/lib/authUtils";
import {AxiosError} from "axios";

interface LoginTabProps {
  phone: string;
  setPhone: (phone: string) => void;
  onLoginSuccess: () => void;
}

type LoginType = "PASSWORD" | "VERIFICATION_CODE";

// 手机号正则表达式
const PHONE_REGEX = /^1[3-9]\d{9}$/;

const LoginTab = ({ phone, setPhone, onLoginSuccess }: LoginTabProps) => {
  const [password, setPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [loginType, setLoginType] = useState<LoginType>("PASSWORD");
  const [loading, setLoading] = useState(false);
  const [sendCodeLoading, setSendCodeLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const phoneInputRef = useRef<any>(null);
  const passwordInputRef = useRef<any>(null);
  const verificationCodeInputRef = useRef<any>(null);
  const submitAttempted = useRef(false);

  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

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

  // 验证手机号格式
  const validatePhone = useCallback((phone: string): string => {
    if (!phone) return "请输入手机号";
    if (!PHONE_REGEX.test(phone)) return "请输入有效的11位手机号码";
    return "";
  }, []);

  // 验证密码格式
  const validatePassword = useCallback((password: string): string => {
    if (!password) return "请输入密码";
    if (password.length < 6) return "密码长度不能少于6位";
    return "";
  }, []);

  // 验证验证码格式
  const validateVerificationCode = useCallback((code: string): string => {
    if (!code) return "请输入验证码";
    if (code.length !== 6) return "验证码必须为6位数字";
    if (!/^\d+$/.test(code)) return "验证码必须为数字";
    return "";
  }, []);

  // 验证整个表单
  const validateForm = useCallback((): { isValid: boolean; errors: Record<string, string> } => {
    const errors: Record<string, string> = {};

    const phoneError = validatePhone(phone);
    if (phoneError) errors.phone = phoneError;

    if (loginType === "PASSWORD") {
      const passwordError = validatePassword(password);
      if (passwordError) errors.password = passwordError;
    } else {
      const codeError = validateVerificationCode(verificationCode);
      if (codeError) errors.verificationCode = codeError;
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }, [phone, password, verificationCode, loginType, validatePhone, validatePassword, validateVerificationCode]);

  // 实时验证表单
  useEffect(() => {
    if (submitAttempted.current || phone) {
      const { isValid, errors } = validateForm();
      setIsFormValid(isValid);
    }
  }, [phone, password, verificationCode, loginType, validateForm]);

  // 发送验证码前的验证
  const validateBeforeSendCode = useCallback((): boolean => {
    const phoneError = validatePhone(phone);
    if (phoneError) {
      toast({
        title: "手机号格式错误",
        description: phoneError,
        variant: "destructive",
      });
      return false;
    }

    if (countdown > 0) {
      toast({
        title: "请稍后重试",
        description: `${countdown}秒后可重新发送验证码`,
      });
      return false;
    }

    return true;
  }, [phone, countdown, validatePhone, toast]);

  const handleSendVerificationCode = async () => {
    if (!validateBeforeSendCode()) return;

    setSendCodeLoading(true);
    try {
      const response = await sendVerificationCode(phone, "LOGIN");

      if (response.data.success) {
        toast({
          title: "验证码已发送",
          description: "请注意查收短信，验证码5分钟内有效",
        });
        setCountdown(60);

        // 自动聚焦到验证码输入框
        setTimeout(() => {
          verificationCodeInputRef.current?.focus();
        }, 100);
      } else {
        throw new Error(response.data.message || "发送验证码失败");
      }
    } catch (error: unknown) {
      const apiError = error as ApiError;
      let errorMessage = "网络错误，请检查网络连接";

      if (apiError.response?.data?.message) {
        errorMessage = apiError.response.data.message;
      } else {
        const axiosError = error as AxiosError;
        if (axiosError.code !== "ERR_NETWORK") {
          errorMessage = axiosError.message;
        }
      }

      toast({
        title: "发送失败",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setSendCodeLoading(false);
    }
  };

  // 处理登录类型切换
  const handleLoginTypeChange = (type: LoginType) => {
    setLoginType(type);
    setFormErrors({});

    // 切换时清空另一个字段
    if (type === "PASSWORD") {
      setVerificationCode("");
      setTimeout(() => passwordInputRef.current?.focus(), 100);
    } else {
      setPassword("");
      setTimeout(() => verificationCodeInputRef.current?.focus(), 100);
    }
  };

  // 处理登录
  const handleSubmit = async (e: React.FormEvent) => {
    submitAttempted.current = true;

    const { isValid, errors } = validateForm();
    setIsFormValid(isValid);
    setFormErrors(errors);

    if (!isValid) {
      toast({
        title: "请完善信息",
        description: "请检查表单中的错误信息",
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
      } else if (apiError.response?.status === 401) {
        errorMessage = "手机号或密码错误";
      } else if (apiError.response?.status === 403) {
        errorMessage = "账号已被禁用，请联系管理员";
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
      // 先尝试从localStorage获取用户信息（登录成功后已保存）
      let userProfile = getCurrentUserInfoFromSession();
      
      // 如果localStorage中没有，才调用refreshUserInfo获取
      if (!userProfile) {
        userProfile = await refreshUserInfo();
      }
      
      if (!userProfile) {
        throw new Error("获取用户信息失败");
      }

      onLoginSuccess();

      // 处理重定向逻辑
      await handleRedirect();

    } catch (error: any) {
      console.error("获取用户信息失败:", error);
      // 清除可能已存储的token
      clearTokens();
      throw new Error(error?.message || "获取用户信息失败");
    }
  };

  // 处理登录后重定向
  const handleRedirect = async () => {
    // 优先使用URL查询参数中的重定向URL
    const redirectTo = searchParams.get('redirectTo');
    
    if (redirectTo && !redirectTo.includes('/auth')) {
      window.location.href = redirectTo;
      return;
    }
    
    // 其次使用location.state中的重定向路径
    const from = (location.state as any)?.from;

    if (from && from !== '/auth' && from !== location.pathname) {
      navigate(from, { replace: true });
    } else {
      // 默认重定向到首页
      navigate('/', { replace: true });
    }
  };

  return (
      <FormValidator onSubmit={handleSubmit}>
        <div className="space-y-4">
          {/* 手机号输入 */}
          <div className="space-y-2">
            <Label htmlFor="login-phone" className="text-sm font-medium">手机号</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                  id="login-phone"
                  name="login-phone"
                  type="tel"
                  placeholder="请输入手机号"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value.replace(/\D/g, '').slice(0, 11));
                    setFormErrors(prev => ({ ...prev, phone: '' }));
                  }}
                  className={cn(
                      "pl-10 h-11",
                      formErrors.phone && "border-red-500 focus:border-red-500"
                  )}
                  maxLength={11}
                  ref={phoneInputRef}
                  required
                  validationType="phone"
                  autoComplete="tel"
              />
            </div>
          </div>

          {/* 登录方式切换 */}
          <Tabs value={loginType} onValueChange={handleLoginTypeChange} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="PASSWORD">密码登录</TabsTrigger>
              <TabsTrigger value="VERIFICATION_CODE">验证码登录</TabsTrigger>
            </TabsList>

            <TabsContent value="PASSWORD" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="login-password" className="text-sm font-medium">密码</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                      id="login-password"
                      name="login-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="请输入密码"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setFormErrors(prev => ({ ...prev, password: '' }));
                      }}
                      className={cn(
                          "pl-10 pr-10 h-11",
                          formErrors.password && "border-red-500 focus:border-red-500"
                      )}
                      ref={passwordInputRef}
                      required
                      validationType="password"
                      autoComplete="current-password"
                  />
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

            <TabsContent value="VERIFICATION_CODE" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="login-verification-code" className="text-sm font-medium">验证码</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Shield className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                        id="login-verification-code"
                        name="login-verification-code"
                        type="text"
                        placeholder="请输入6位验证码"
                        value={verificationCode}
                        onChange={(e) => {
                          setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6));
                          setFormErrors(prev => ({ ...prev, verificationCode: '' }));
                        }}
                        className={cn(
                            "pl-10 h-11",
                            formErrors.verificationCode && "border-red-500 focus:border-red-500"
                        )}
                        maxLength={6}
                        ref={verificationCodeInputRef}
                        required
                        validationType="verificationCode"
                        autoComplete="one-time-code"
                    />
                  </div>
                  <Button
                      type="button"
                      onClick={handleSendVerificationCode}
                      disabled={sendCodeLoading || countdown > 0 || !phone || !!validatePhone(phone)}
                      className={cn(
                          "whitespace-nowrap px-4 h-11 min-w-[120px]",
                          countdown > 0 || !!validatePhone(phone)
                              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                              : "bg-blue-500 hover:bg-blue-600 text-white"
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
              className="w-full h-11 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium transition-all duration-200 shadow-lg"
              disabled={loading || !isFormValid}
              size="lg"
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