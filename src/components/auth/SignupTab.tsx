import { useState, useEffect, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { ApiError } from "@/integrations/api/client";
import { register, sendVerificationCode } from "@/integrations/api/authApi";
import { Institution, institutionApi } from "@/integrations/api/institutionApi";
import { Phone, Lock, User as UserIcon, Mail, Send, Building, CreditCard, Check, ChevronsUpDown, Shield, BadgeCheck, KeyRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useDebounce } from "@/hooks/useDebounce";
import { FormValidator, InputWrapper } from "@/components/ui/FormValidator";

interface SignupTabProps {
  phone: string;
  setPhone: (phone: string) => void;
  onSignupSuccess: () => void;
}

const SignupTab = ({ phone, setPhone, onSignupSuccess }: SignupTabProps) => {
  const [loading, setLoading] = useState(false);
  const [sendCodeLoading, setSendCodeLoading] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [username, setUsername] = useState("");
  const [realName, setRealName] = useState("");
  const [email, setEmail] = useState("");
  const [idType, setIdType] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [institutionId, setInstitutionId] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [searchResults, setSearchResults] = useState<Institution[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const passwordRef = useRef<any>(null);
  const confirmPasswordRef = useRef<any>(null);
  const { toast } = useToast();
  
  // 添加防抖处理，延迟550ms
  const debouncedSearchValue = useDebounce(searchValue, 550);

  // 密码验证函数
  const validatePassword = (value: string): boolean | string => {
    if (value.length < 6) {
      return "密码长度至少为6位";
    }
    if (!/(?=.*[a-zA-Z])/.test(value)) {
      return "密码必须包含字母";
    }
    if (!/(?=.*\d)/.test(value)) {
      return "密码必须包含数字";
    }
    return true;
  };

  // 用户名验证函数
  const validateUsername = (value: string): boolean | string => {
    if (value.length < 2) {
      return "用户名至少2个字符";
    }
    if (value.length > 20) {
      return "用户名不能超过20个字符";
    }
    if (!/^[a-zA-Z0-9_\u4e00-\u9fa5]+$/.test(value)) {
      return "用户名只能包含中文、英文、数字和下划线";
    }
    return true;
  };

  // 倒计时处理
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // 机构搜索
  useEffect(() => {
    if (debouncedSearchValue.trim() === "") {
      setSearchResults([]);
      return;
    }

    const searchInstitutions = async () => {
      setIsSearching(true);
      try {
        const response = await institutionApi.searchInstitutions(debouncedSearchValue);
        if (response.success) {
          setSearchResults(response.data.content || []);
        }
      } catch (error) {
        console.error("搜索机构失败:", error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    searchInstitutions();
  }, [debouncedSearchValue]);

  const handleSendVerificationCode = async () => {
    if (!phone) {
      toast({
        title: "错误",
        description: "请输入手机号。",
        variant: "destructive",
      });
      return;
    }

    // 验证手机号格式
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      toast({
        title: "手机号格式错误",
        description: "请输入有效的手机号码",
        variant: "destructive",
      });
      return;
    }

    if (countdown > 0) {
      toast({
        title: "提示",
        description: `请在 ${countdown} 秒后重新发送验证码`,
      });
      return;
    }

    setSendCodeLoading(true);
    try {
      const response = await sendVerificationCode(phone, "REGISTER");

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    try {
      const response = await register({
        phone,
        verificationCode,
        username,
        realName,
        email,
        password,
        idType,
        idNumber,
        institutionId
      });

      if (response.data.success) {
        toast({
          title: "注册成功",
          description: "账户已创建，请登录。",
        });
        onSignupSuccess();
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

  // 获取选中机构的名称
  const selectedInstitution = useMemo(() => {
    if (!institutionId) return "";
    const institution = searchResults.find(inst => inst.id === institutionId);
    return institution ? institution.fullName : "";
  }, [institutionId, searchResults]);

  return (
          <FormValidator onSubmit={handleSubmit} className="space-y-4" showAllErrorsOnSubmit={true}>
            {/* 手机号与验证码行 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="signup-phone" className="text-sm font-medium">手机号 *</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <InputWrapper required validationType="phone">
                    <Input
                        id="signup-phone"
                        type="tel"
                        placeholder="请输入手机号"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="pl-10 h-11"
                        maxLength={11}
                    />
                  </InputWrapper>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium opacity-0">发送</Label>
                <Button
                    type="button"
                    onClick={handleSendVerificationCode}
                    disabled={sendCodeLoading || !phone || countdown > 0}
                    className="w-full h-11 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white transition-all duration-200"
                    variant="default"
                >
                  <Send className="h-4 w-4 mr-1" />
                  {sendCodeLoading ? "发送中" : countdown > 0 ? `${countdown}s` : "发送"}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="signup-verification-code" className="text-sm font-medium">验证码 *</Label>
              <div className="relative">
                <Shield className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <InputWrapper required validationType="verificationCode">
                  <Input
                      id="signup-verification-code"
                      type="text"
                      placeholder="请输入6位验证码"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      className="pl-10 h-11"
                      maxLength={6}
                  />
                </InputWrapper>
              </div>
            </div>

            {/* 用户名 */}
            <div className="space-y-2">
              <Label htmlFor="signup-username" className="text-sm font-medium">用户名 *</Label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <InputWrapper required customValidation={validateUsername}>
                  <Input
                      id="signup-username"
                      type="text"
                      placeholder="2-20个字符，支持中文、英文、数字"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="pl-10 h-11"
                      maxLength={20}
                  />
                </InputWrapper>
              </div>
            </div>

            {/* 真实姓名 */}
            <div className="space-y-2">
              <Label htmlFor="signup-realname" className="text-sm font-medium">真实姓名 *</Label>
              <div className="relative">
                <BadgeCheck className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <InputWrapper required>
                  <Input
                      id="signup-realname"
                      type="text"
                      placeholder="请输入真实姓名"
                      value={realName}
                      onChange={(e) => setRealName(e.target.value)}
                      className="pl-10 h-11"
                      maxLength={20}
                  />
                </InputWrapper>
              </div>
            </div>

            {/* 机构选择 */}
            <div className="space-y-2">
              <Label htmlFor="signup-institution" className="text-sm font-medium">所属机构 *</Label>
              <div className="relative">
                <Building className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
                <Popover open={open} onOpenChange={setOpen}>
                  <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="w-full justify-between pl-10 h-11 border-gray-300 hover:border-blue-500 transition-colors"
                    >
                    <span className={cn("truncate", !selectedInstitution && "text-muted-foreground")}>
                      {selectedInstitution || "请选择所属机构"}
                    </span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                    <Command shouldFilter={false}>
                      <CommandInput
                          placeholder="搜索机构..."
                          value={searchValue}
                          onValueChange={setSearchValue}
                      />
                      <CommandList>
                        <CommandEmpty>
                          {isSearching ? "搜索中..." : "未找到相关机构"}
                        </CommandEmpty>
                        <CommandGroup>
                          {(searchValue ? searchResults : []).map((institution) => (
                              <CommandItem
                                  key={institution.id}
                                  value={institution.id}
                                  onSelect={(currentValue) => {
                                    setInstitutionId(currentValue === institutionId ? "" : currentValue);
                                    setOpen(false);
                                  }}
                                  className="flex items-center space-x-2"
                              >
                                <Check
                                    className={cn(
                                        "h-4 w-4",
                                        institutionId === institution.id ? "opacity-100" : "opacity-0"
                                    )}
                                />
                                <div className="flex flex-col">
                                  <span className="font-medium">{institution.fullName}</span>
                                  {institution.shortName && (
                                      <span className="text-xs text-muted-foreground">{institution.shortName}</span>
                                  )}
                                </div>
                              </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <Input
                    type="hidden"
                    value={institutionId}
                    onChange={(e) => setInstitutionId(e.target.value)}
                    required
                />
              </div>
            </div>

            {/* 证件类型和证件号码行 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="signup-id-type" className="text-sm font-medium">证件类型 *</Label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
                  <Select value={idType} onValueChange={setIdType} required>
                    <SelectTrigger className="pl-10 h-11 border-gray-300">
                      <SelectValue placeholder="请选择证件类型" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NATIONAL_ID">身份证</SelectItem>
                      <SelectItem value="PASSPORT">护照</SelectItem>
                      <SelectItem value="OTHER">其他</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-id-number" className="text-sm font-medium">证件号码 *</Label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <InputWrapper required validationType="idNumber" idType={idType as 'NATIONAL_ID' | 'PASSPORT' | 'OTHER'}>
                    <Input
                        id="signup-id-number"
                        type="text"
                        placeholder="请输入证件号码"
                        value={idNumber}
                        onChange={(e) => setIdNumber(e.target.value)}
                        className="pl-10 h-11"
                        idType={idType as 'NATIONAL_ID' | 'PASSPORT' | 'OTHER'}
                    />
                  </InputWrapper>
                </div>
              </div>
            </div>

            {/* 邮箱 */}
            <div className="space-y-2">
              <Label htmlFor="signup-email" className="text-sm font-medium">联系邮箱</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <InputWrapper validationType="email">
                  <Input
                      id="signup-email"
                      type="email"
                      placeholder="请输入邮箱"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 h-11"
                  />
                </InputWrapper>
              </div>
            </div>

            {/* 密码 */}
            <div className="space-y-2">
              <Label htmlFor="signup-password" className="text-sm font-medium">密码 *</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <InputWrapper required customValidation={validatePassword}>
                  <Input
                      id="signup-password"
                      type="password"
                      placeholder="至少6位，包含字母和数字"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 h-11"
                      ref={passwordRef}
                  />
                </InputWrapper>
              </div>
            </div>

            {/* 确认密码 */}
            <div className="space-y-2">
              <Label htmlFor="confirm-password" className="text-sm font-medium">确认密码 *</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <InputWrapper required isPasswordConfirm={true} passwordRef={passwordRef}>
                  <Input
                      id="confirm-password"
                      type="password"
                      placeholder="再次输入密码"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10 h-11"
                      ref={confirmPasswordRef}
                  />
                </InputWrapper>
              </div>
            </div>

            {/* 重要提示 */}
            <Alert className="bg-amber-50 border-amber-200">
              <Shield className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                <span className="font-semibold">重要提示：</span> 所属机构、证件类型和证件号码注册后无法修改，请仔细核对。
              </AlertDescription>
            </Alert>

            {/* 注册按钮 */}
            <Button
                type="submit"
                className="w-full h-11 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium transition-all duration-200 shadow-md hover:shadow-lg"
                disabled={loading}
            >
              {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                    注册中...
                  </>
              ) : (
                  "立即注册"
              )}
            </Button>
          </FormValidator>
  );
};

export default SignupTab;