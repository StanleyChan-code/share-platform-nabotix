// components/ui/input.tsx
import * as React from "react"
import { cn } from "@/lib/utils"

// 证件类型枚举
type IdType = 'NATIONAL_ID' | 'PASSPORT' | 'OTHER';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  maxLength?: number;
  validationType?: 'phone' | 'email' | 'idNumber' | 'numeric' | 'alphanumeric' | 'verificationCode' | 'password' | 'custom';
  idType?: IdType;
  customValidation?: (value: string) => boolean | string;
  onValidityChange?: (isValid: boolean) => void;
  validateOnSubmit?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({
       className,
       type,
       maxLength,
       validationType,
       idType,
       customValidation,
       onValidityChange,
       validateOnSubmit = true,
       required,
       ...props
     }, ref) => {
      const inputRef = React.useRef<HTMLInputElement>(null);
      const [error, setError] = React.useState<string | null>(null);
      const [isTouched, setIsTouched] = React.useState(false);

      // 身份证验证函数（增强版）
      const validateIdCard = (value: string): boolean => {
        // 基本格式检查
        if (!/^\d{17}[\dXx]$|^\d{15}$/.test(value)) {
          return false;
        }

        if (value.length === 18) {
          const factors = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
          const checksums = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2'];

          // 检查前17位是否都是数字
          if (!/^\d{17}[\dXx]$/.test(value)) return false;

          let sum = 0;
          for (let i = 0; i < 17; i++) {
            const digit = parseInt(value.charAt(i));
            if (isNaN(digit)) return false;
            sum += digit * factors[i];
          }

          const mod = sum % 11;
          return value.charAt(17).toUpperCase() === checksums[mod];
        }

        // 15位身份证基本验证
        if (value.length === 15) {
          const year = parseInt(value.substr(6, 2));
          const month = parseInt(value.substr(8, 2));
          const day = parseInt(value.substr(10, 2));

          // 简单日期验证
          return month >= 1 && month <= 12 && day >= 1 && day <= 31;
        }

        return false;
      };

      const validateInput = (value: string, forceValidation = false): boolean => {
        const trimmedValue = value.trim();

        // 如果未触摸且不是强制验证，且值为空，不显示错误
        if (!forceValidation && !isTouched && !trimmedValue) {
          setError(null);
          return true;
        }

        // 必填字段验证
        if (required && !trimmedValue) {
          setError('此字段为必填项');
          return false;
        }

        // 非必填字段为空时跳过其他验证
        if (!required && !trimmedValue) {
          setError(null);
          return true;
        }

        let isValid = true;
        let errorMessage = '';

        switch (validationType) {
          case 'phone':
            const phoneRegex = /^1[3-9]\d{9}$/;
            isValid = phoneRegex.test(trimmedValue);
            errorMessage = '请输入有效的11位手机号码';
            break;

          case 'email':
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            isValid = emailRegex.test(trimmedValue);
            errorMessage = '请输入有效的邮箱地址';

            // 额外的邮箱验证
            if (isValid && trimmedValue.length > 254) {
              isValid = false;
              errorMessage = '邮箱地址过长（最多254个字符）';
            }
            break;

          case 'idNumber':
            if (idType === 'NATIONAL_ID') {
              isValid = validateIdCard(trimmedValue);
              errorMessage = '请输入有效的身份证号码';
            } else if (idType === 'PASSPORT') {
              const passportRegex = /^[a-zA-Z0-9]{5,20}$/;
              isValid = passportRegex.test(trimmedValue);
              errorMessage = '请输入有效的护照号码（5-20位字母数字）';
            } else {
              const otherIdRegex = /^[a-zA-Z0-9\-_]{2,30}$/;
              isValid = otherIdRegex.test(trimmedValue);
              errorMessage = '请输入有效的证件号码（2-30位）';
            }
            break;

          case 'numeric':
            const numericRegex = /^\d+$/;
            isValid = numericRegex.test(trimmedValue);
            errorMessage = '只能输入数字';
            break;

          case 'alphanumeric':
            const alphanumericRegex = /^[a-zA-Z0-9]+$/;
            isValid = alphanumericRegex.test(trimmedValue);
            errorMessage = '只能输入字母和数字';
            break;

          case 'verificationCode':
            const codeRegex = /^\d{6}$/;
            isValid = codeRegex.test(trimmedValue);
            errorMessage = '请输入6位数字验证码';
            break;

          case 'password':
            isValid = trimmedValue.length >= 6;
            errorMessage = '密码长度至少为6位';
            break;

          case 'custom':
            if (customValidation) {
              const result = customValidation(trimmedValue);
              if (typeof result === 'string') {
                isValid = false;
                errorMessage = result;
              } else {
                isValid = result;
                errorMessage = '输入格式不正确';
              }
            }
            break;

          default:
            isValid = true;
            break;
        }

        if (!isValid) {
          setError(errorMessage);
          return false;
        }

        setError(null);
        return true;
      };

      const checkValidity = (): boolean => {
        const value = inputRef.current?.value || (props.value as string) || '';
        return validateInput(value, true);
      };

      const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value;

        // 长度限制
        if (maxLength && value.length > maxLength) {
          value = value.slice(0, maxLength);
          e.target.value = value;
        }

        // 实时验证（关键字段实时验证，其他字段在触摸后验证）
        const shouldValidateRealTime = ['phone', 'email', 'idNumber'].includes(validationType || '');
        if (shouldValidateRealTime || isTouched || error) {
          validateInput(value);
        }

        props.onChange?.(e);
      };

      const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        setIsTouched(true);
        validateInput(e.target.value, true);
        props.onBlur?.(e);
      };

      const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
        props.onFocus?.(e);
      };

      // 合并 refs 并提供验证方法
      React.useImperativeHandle(ref, () => {
        const inputElement = inputRef.current as HTMLInputElement;

        if (inputElement) {
          Object.assign(inputElement, {
            checkValidity: () => checkValidity(),
            getValidationError: () => error,
            validate: () => validateInput(inputElement.value, true),
            setCustomValidity: (message: string) => {
              setError(message);
            },
            markAsTouched: () => setIsTouched(true),
            clearError: () => setError(null)
          });
        }

        return inputElement;
      }, [error]);

      // 验证状态回调
      React.useEffect(() => {
        onValidityChange?.(!error);
      }, [error, onValidityChange]);

      return (
          <div className="relative">
            <input
                type={type}
                className={cn(
                    "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
                    className,
                    error && "border-red-500 focus-visible:ring-red-500"
                )}
                ref={inputRef}
                maxLength={maxLength}
                onChange={handleChange}
                onBlur={handleBlur}
                onFocus={handleFocus}
                required={required}
                {...props}
            />
            {error && (
                <div className="absolute top-full left-0 w-full z-10">
                  <p className="mt-1 text-xs text-red-500 bg-red-50 px-2 py-1 rounded-md border border-red-200 shadow-sm">
                    {error}
                  </p>
                </div>
            )}
          </div>
      )
    }
);
Input.displayName = "Input"

export { Input }