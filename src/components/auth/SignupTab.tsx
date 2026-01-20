import { useState, useEffect, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useDebounce } from "@/hooks/useDebounce";
import {FormValidator, Input, ValidatedSelect} from "@/components/ui/FormValidator";
import {ID_TYPES} from "@/lib/enums.ts";

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

  // 密码验证函数 - 更详细的错误提示
  const validatePassword = (value: string): boolean | string => {
    if (!value.trim()) {
      return "密码不能为空";
    }
    if (value.length < 6) {
      return "密码长度至少为6位";
    }
    if (!/(?=.*[a-zA-Z])/.test(value)) {
      return "密码必须包含至少一个字母";
    }
    if (!/(?=.*\d)/.test(value)) {
      return "密码必须包含至少一个数字";
    }
    if (!/^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]*$/.test(value)) {
      return "密码只能包含字母、数字和特殊字符";
    }
    return true;
  };

  // 修复：确保 realName 字段正确同步
  const handleRealNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setRealName(value);
  };

  // 修复：realName 验证函数
  const validateRealName = (value: string): boolean | string => {
    if (!value.trim()) {
      return "真实姓名不能为空";
    }
    if (value.trim().length < 2) {
      return "真实姓名至少需要2个字符";
    }
    if (value.trim().length > 20) {
      return "真实姓名不能超过20个字符";
    }
    if (!/^[\u4e00-\u9fa5a-zA-Z\s·]+$/.test(value.trim())) {
      return "真实姓名只能包含中文、英文和空格";
    }
    return true;
  };

  // 手机号验证函数
  const validatePhone = (value: string): boolean | string => {
    if (!value.trim()) {
      return "手机号不能为空";
    }
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(value.trim())) {
      return "请输入有效的11位手机号码";
    }
    return true;
  };

  // 验证码验证函数
  const validateVerificationCode = (value: string): boolean | string => {
    if (!value.trim()) {
      return "验证码不能为空";
    }
    if (!/^\d{6}$/.test(value.trim())) {
      return "验证码必须是6位数字";
    }
    return true;
  };

  // 证件号码验证函数
  const validateIdNumber = (value: string): boolean | string => {
    if (!value.trim()) {
      return "证件号码不能为空";
    }

    if (idType === 'NATIONAL_ID') {
      // 身份证验证
      const idCardRegex = /^[1-9]\d{5}(18|19|20)\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/;
      if (!idCardRegex.test(value.trim())) {
        return "请输入有效的身份证号码";
      }
    } else if (idType === 'PASSPORT') {
      // 护照验证
      const passportRegex = /^[a-zA-Z0-9]{5,9}$/;
      if (!passportRegex.test(value.trim())) {
        return "请输入有效的护照号码";
      }
    } else if (idType === 'OTHER') {
      // 其他证件类型，最少3位
      if (value.trim().length < 3) {
        return "证件号码至少需要3个字符";
      }
    }

    return true;
  };

  // 机构验证函数
  const validateInstitution = (value: string): boolean | string => {
    if (!value.trim()) {
      return "请选择所属机构";
    }
    return true;
  };

  // 证件类型验证函数
  const validateIdType = (value: string): boolean | string => {
    if (!value.trim()) {
      return "请选择证件类型";
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
    // 先验证手机号格式
    const phoneValidation = validatePhone(phone);
    if (phoneValidation !== true) {
      toast({
        title: "手机号格式错误",
        description: phoneValidation as string,
        variant: "destructive",
      });
      return;
    }

    if (countdown > 0) {
      toast({
        title: "请稍候",
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
          description: "验证码已发送至您的手机，请注意查收",
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
        title: "发送失败",
        description: apiError.response?.data?.message || "发送验证码时发生错误，请稍后重试",
        variant: "destructive",
      });
    } finally {
      setSendCodeLoading(false);
    }
  };

  const handleSubmit = async (formData: Record<string, any>) => {
    console.log('表单提交数据:', formData);

    // 手动验证机构选择（因为不是标准 Input 组件）
    if (!institutionId) {
      toast({
        title: "提交失败",
        description: "请选择所属机构",
        variant: "destructive",
      });
      return;
    }

    // 手动验证证件类型选择
    if (!idType) {
      toast({
        title: "提交失败",
        description: "请选择证件类型",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await register({
        phone: phone.trim(),
        verificationCode: verificationCode.trim(),
        realName: realName.trim(),
        email: email.trim(),
        password: password,
        idType: idType,
        idNumber: idNumber.trim(),
        institutionId: institutionId
      });

      if (response.data.success) {
        toast({
          title: "注册成功",
          description: "账户已创建，请使用新账户登录",
        });
        onSignupSuccess();
      } else {
        toast({
          title: "注册失败",
          description: response.data.message || "注册失败，请检查输入信息",
          variant: "destructive",
        });
      }
    } catch (error: unknown) {
      const apiError = error as ApiError;
      toast({
        title: "注册失败",
        description: apiError.response?.data?.message || "网络错误，请检查网络连接后重试",
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
      <FormValidator
          onSubmit={handleSubmit}
          className="space-y-4"
          showAllErrorsOnSubmit={true}
      >
        {/* 机构选择 */}
        <div className="space-y-2">
          <Label htmlFor="signup-institution" className="text-sm font-medium flex items-center gap-1">
            所属机构 <span className="text-red-500">*</span>
          </Label>
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
            <input
                type="hidden"
                name="institutionId"
                value={institutionId}
                onChange={(e) => setInstitutionId(e.target.value)}
                required
                data-validation-type="custom"
                data-custom-validation="validateInstitution"
            />
          </div>
        </div>

        {/* 真实姓名 */}
        <div className="space-y-2">
          <Label htmlFor="signup-realname" className="text-sm font-medium flex items-center gap-1">
            真实姓名 <span className="text-red-500">*</span>
          </Label>
          <div className="relative">
            <BadgeCheck className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
                id="signup-realname"
                name="realName"
                type="text"
                placeholder="请输入真实姓名，支持中文、英文"
                value={realName} // 确保 value 正确绑定
                onChange={handleRealNameChange} // 使用专门的 change handler
                className="pl-10 h-11"
                maxLength={20}
                required
                validationType="custom"
                customValidation={validateRealName}
                errorMessage="真实姓名格式不正确"
            />
          </div>
        </div>

        {/* 证件类型和证件号码行 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="signup-id-type" className="text-sm font-medium flex items-center gap-1">
              证件类型 <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <ValidatedSelect
                  id="signup-id-type"
                  name="idType"
                  placeholder="请选择证件类型"
                  value={idType}
                  onValueChange={setIdType}
                  required>
                <SelectContent>
                  {Object.entries(ID_TYPES).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                  ))}
                </SelectContent>
              </ValidatedSelect>
              <input
                  type="hidden"
                  name="idType"
                  value={idType}
                  onChange={(e) => setIdType(e.target.value)}
                  required
                  data-validation-type="custom"
                  data-custom-validation="validateIdType"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="signup-id-number" className="text-sm font-medium flex items-center gap-1">
              证件号码 <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <CreditCard className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                  id="signup-id-number"
                  name="idNumber"
                  type="text"
                  placeholder={idType === 'NATIONAL_ID' ? '请输入18位身份证号码' : idType === 'PASSPORT' ? '请输入护照号码' : '请输入证件号码'}
                  value={idNumber}
                  onChange={(e) => setIdNumber(e.target.value)}
                  className="pl-10 h-11"
                  required
                  validationType="custom"
                  customValidation={validateIdNumber}
                  errorMessage="证件号码格式不正确"
              />
            </div>
          </div>
        </div>

        {/* 邮箱 */}
        {/*<div className="space-y-2">*/}
        {/*  <Label htmlFor="signup-email" className="text-sm font-medium">联系邮箱</Label>*/}
        {/*  <div className="relative">*/}
        {/*    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />*/}
        {/*    <Input*/}
        {/*        id="signup-email"*/}
        {/*        name="email"*/}
        {/*        type="email"*/}
        {/*        placeholder="请输入邮箱地址（选填）"*/}
        {/*        value={email}*/}
        {/*        onChange={(e) => setEmail(e.target.value)}*/}
        {/*        className="pl-10 h-11"*/}
        {/*        validationType="custom"*/}
        {/*        customValidation={validateEmail}*/}
        {/*        errorMessage="请输入有效的邮箱地址"*/}
        {/*    />*/}
        {/*  </div>*/}
        {/*</div>*/}

        {/* 密码 */}
        <div className="space-y-2">
          <Label htmlFor="signup-password" className="text-sm font-medium flex items-center gap-1">
            密码 <span className="text-red-500">*</span>
          </Label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
                id="signup-password"
                name="password"
                type="password"
                placeholder="至少6位，包含字母和数字"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 h-11"
                ref={passwordRef}
                required
                validationType="custom"
                customValidation={validatePassword}
                errorMessage="密码格式不符合要求"
            />
          </div>
        </div>

        {/* 确认密码 */}
        <div className="space-y-2">
          <Label htmlFor="confirm-password" className="text-sm font-medium flex items-center gap-1">
            确认密码 <span className="text-red-500">*</span>
          </Label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
                id="confirm-password"
                name="confirmPassword"
                type="password"
                placeholder="请再次输入密码"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="pl-10 h-11"
                ref={confirmPasswordRef}
                required
                isPasswordConfirm={true}
                passwordRef={passwordRef}
                errorMessage="两次输入的密码不一致"
            />
          </div>
        </div>

        {/* 手机号与验证码行 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-2 space-y-2">
            <Label htmlFor="signup-phone" className="text-sm font-medium flex items-center gap-1">
              手机号 <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                  id="signup-phone"
                  name="phone"
                  type="tel"
                  placeholder="请输入11位手机号码"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="pl-10 h-11"
                  maxLength={11}
                  required
                  validationType="custom"
                  customValidation={validatePhone}
                  errorMessage="请输入有效的手机号码"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium opacity-0">发送</Label>
            <Button
                type="button"
                onClick={handleSendVerificationCode}
                disabled={sendCodeLoading || countdown > 0}
                className="w-full h-11 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                variant="default"
            >
              <Send className="h-4 w-4 mr-1" />
              {sendCodeLoading ? "发送中..." : countdown > 0 ? `${countdown}秒后重试` : "发送验证码"}
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="signup-verification-code" className="text-sm font-medium flex items-center gap-1">
            验证码 <span className="text-red-500">*</span>
          </Label>
          <div className="relative">
            <Shield className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
                id="signup-verification-code"
                name="verificationCode"
                type="text"
                placeholder="请输入6位数字验证码"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                className="pl-10 h-11"
                maxLength={6}
                required
                validationType="custom"
                customValidation={validateVerificationCode}
                errorMessage="请输入6位数字验证码"
            />
          </div>
        </div>

        {/* 重要提示 */}
        <Alert className="bg-amber-50 border-amber-200">
          <Shield className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            <span className="font-semibold">重要提示：</span> 注册后所属机构将无法修改，修改证件类型和证件号码需机构管理员操作，请仔细核对。
          </AlertDescription>
        </Alert>

        {/* 注册按钮 */}
        <Button
            type="submit"
            className="w-full h-11 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
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