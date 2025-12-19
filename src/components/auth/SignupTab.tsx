import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { ApiError } from "@/integrations/api/client";
import { register, sendVerificationCode } from "@/integrations/api/authApi";
import {Institution, institutionApi} from "@/integrations/api/institutionApi";
import { Page } from "@/integrations/api/client";
import { Phone, Lock, User as UserIcon, Mail, Send, Building, CreditCard, Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

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
  const [countdown, setCountdown] = useState(0); // 注册验证码倒计时状态
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [searchResults, setSearchResults] = useState<Institution[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const { toast } = useToast();

  // 处理倒计时
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // 当搜索值改变时进行搜索
  useEffect(() => {
    const searchTimeout = setTimeout(async () => {
      if (searchValue.trim() === "") {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const response = await institutionApi.searchInstitutions(searchValue);
        if (response.success) {
          setSearchResults(response.data.content || []);
        }
      } catch (error) {
        console.error("搜索机构失败:", error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [searchValue]);

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

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !verificationCode || !username || !realName || !password || !idType || !idNumber || !institutionId) {
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

  // 获取选中机构的名称用于显示
  const selectedInstitution = useMemo(() => {
    if (!institutionId) return "";
    const institution = searchResults.find(inst => inst.id === institutionId);
    return institution ? institution.fullName : "";
  }, [institutionId, searchResults]);

  return (
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
            onClick={handleSendVerificationCode}
            disabled={sendCodeLoading || !phone || countdown > 0}
          >
            <Send className="h-4 w-4 mr-2" />
            {sendCodeLoading ? "发送中..." : countdown > 0 ? `${countdown}秒后重发` : "发送"}
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
        <Label htmlFor="signup-institution">所属机构 *</Label>
        <div className="relative">
          <Building className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="w-full justify-between pl-10"
              >
                {selectedInstitution || "请选择所属机构"}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
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
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            institutionId === institution.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {institution.fullName}
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
      
      <div className="space-y-2">
        <Label htmlFor="signup-id-type">证件类型 *</Label>
        <div className="relative">
          <CreditCard className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Select value={idType} onValueChange={setIdType} required>
            <SelectTrigger className="pl-10">
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
        <Label htmlFor="signup-id-number">证件号码 *</Label>
        <div className="relative">
          <CreditCard className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="signup-id-number"
            type="text"
            placeholder="请输入证件号码"
            value={idNumber}
            onChange={(e) => setIdNumber(e.target.value)}
            className="pl-10"
            required
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="signup-email">联系邮箱</Label>
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
      
      <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-3 text-sm text-yellow-800">
        <p className="font-medium">重要提示：</p>
        <p>所属机构、证件类型和证件号码注册后无法随意修改，请务必仔细核对。</p>
      </div>
      
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "注册中..." : "注册"}
      </Button>
    </form>
  );
};

export default SignupTab;