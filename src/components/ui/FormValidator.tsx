// components/ui/form-validator.tsx
import React, {
    createContext,
    useContext,
    ReactNode,
    useRef,
    useCallback,
    useState,
    useEffect,
    forwardRef,
    useImperativeHandle
} from 'react';
import {cn} from '@/lib/utils';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select.tsx";
import {toast} from "@/components/ui/use-toast.ts";

// ============================ 类型定义 ============================

export interface FormValidatorContextType {
    registerInput: (inputRef: React.RefObject<any>) => void;
    unregisterInput: (inputRef: React.RefObject<any>) => void;
    registerPasswordPair: (passwordRef: React.RefObject<any>, confirmPasswordRef: React.RefObject<any>) => void;
    validateField: (inputRef: React.RefObject<any>) => boolean;
    validateAll: () => Promise<{ isValid: boolean; errors: ValidationError[] }>;
    getErrors: () => ValidationError[];
    clearErrors: () => void;
    markAllAsTouched: () => void;
    reset: () => void;
    showAllErrors: () => void;
}

export interface ValidationError {
    fieldName: string;
    message: string;
    inputRef: React.RefObject<any>;
}

export interface FormValidatorProps {
    children: ReactNode;
    onSubmit?: (formData: Record<string, any>) => void;
    onInvalid?: (errors: ValidationError[]) => void;
    className?: string;
    showAllErrorsOnSubmit?: boolean;
    validateOnChange?: boolean;
    validateOnBlur?: boolean;
    disabled?: boolean;
    customValidation?: (formData: Record<string, any>) => ValidationError[] | Promise<ValidationError[]>;
    onValidityChange?: (isValid: boolean, errors: ValidationError[]) => void;
    validateBeforeSubmit?: boolean;
}

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    validationType?: 'phone' | 'email' | 'idNumber' | 'numeric' | 'alphanumeric' | 'verificationCode' | 'password' | 'custom';
    customValidation?: (value: string) => boolean | string;
    errorMessage?: string;
    onValidityChange?: (isValid: boolean) => void;
    validateOnSubmit?: boolean;
    isPasswordConfirm?: boolean;
    passwordRef?: React.RefObject<any>;
    idType?: 'NATIONAL_ID' | 'PASSPORT' | 'OTHER';
    maxLength?: number;
    onReset?: () => void;
    onMarkAsTouched?: () => void;
}

// ============================ 空实现上下文 ============================

const emptyContextValue: FormValidatorContextType = {
    registerInput: () => {
    },
    unregisterInput: () => {
    },
    registerPasswordPair: () => {
    },
    validateField: () => true,
    validateAll: async () => ({isValid: true, errors: []}),
    getErrors: () => [],
    clearErrors: () => {
    },
    markAllAsTouched: () => {
    },
    reset: () => {
    },
    showAllErrors: () => {
    }
};

// ============================ 上下文 ============================

const FormValidatorContext = createContext<FormValidatorContextType | undefined>(undefined);

// ============================ Hook ============================

export const useFormValidator = (): FormValidatorContextType => {
    const context = useContext(FormValidatorContext);
    return context || emptyContextValue;
};

// ============================ FormValidator 组件 ============================

interface RegisteredInput {
    ref: React.RefObject<any>;
    name: string;
    isPasswordConfirm?: boolean;
    passwordRef?: React.RefObject<any>;
}

interface PasswordPair {
    passwordRef: React.RefObject<any>;
    confirmPasswordRef: React.RefObject<any>;
}

export const FormValidator: React.FC<FormValidatorProps> = ({
                                                                children,
                                                                onSubmit,
                                                                onInvalid,
                                                                className,
                                                                showAllErrorsOnSubmit = false,
                                                                validateOnChange = true,
                                                                validateOnBlur = true,
                                                                disabled = false,
                                                                customValidation,
                                                                onValidityChange,
                                                                validateBeforeSubmit = true,
                                                            }) => {
    const inputRefs = useRef<RegisteredInput[]>([]);
    const passwordPairs = useRef<PasswordPair[]>([]);
    const [errors, setErrors] = useState<ValidationError[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // 默认的 onInvalid 处理函数
    const defaultOnInvalid = useCallback((errors: ValidationError[]) => {
        if (errors.length > 0) {
            const firstError = errors[0];

            // 默认错误消息映射
            const defaultErrorMessages: Record<string, string> = {
                phone: "请输入有效的11位手机号码",
                email: "请输入有效的邮箱地址",
                password: "密码必须包含字母和数字，长度至少6位",
                verificationCode: "请输入6位数字验证码",
                idNumber: "请输入有效的证件号码",
                confirmPassword: "两次输入的密码不一致"
            };

            let title = "填写验证错误";
            let description = firstError.message || "请检查填写的内容";

            // 根据错误类型定制提示
            if (errors.length > 1) {
                title = `填写验证错误 (${errors.length} 处错误)`;
                description = `请检查${errors.length}处填写错误`;
            } else {
                // 单错误时的智能描述
                const fieldName = firstError.fieldName.toLowerCase();
                if (fieldName.includes('password') || fieldName.includes('pwd')) {
                    description = firstError.message || defaultErrorMessages.password;
                } else if (fieldName.includes('phone') || fieldName.includes('mobile')) {
                    description = firstError.message || defaultErrorMessages.phone;
                } else if (fieldName.includes('email') || fieldName.includes('mail')) {
                    description = firstError.message || defaultErrorMessages.email;
                } else if (fieldName.includes('code') || fieldName.includes('verification')) {
                    description = firstError.message || defaultErrorMessages.verificationCode;
                } else if (fieldName.includes('id') || fieldName.includes('card')) {
                    description = firstError.message || defaultErrorMessages.idNumber;
                }
            }

            toast({
                title: title,
                description: description,
                variant: "destructive",
                duration: 5000,
            });

            // 调试信息
            if (process.env.NODE_ENV === 'development' && errors.length > 1) {
                console.group('表单验证错误详情');
                errors.forEach((error, index) => {
                    console.log(`错误 ${index + 1}:`, {
                        字段: error.fieldName,
                        消息: error.message
                    });
                });
                console.groupEnd();
            }
        }
    }, []);

    // 注册输入字段
    const registerInput = useCallback((inputRef: React.RefObject<any>) => {
        if (!inputRef.current) return;

        const name = inputRef.current.name || inputRef.current.id || '';
        const existingIndex = inputRefs.current.findIndex(ref =>
            ref.ref === inputRef || (ref.name === name && name !== '')
        );

        if (existingIndex >= 0) {
            inputRefs.current[existingIndex] = {
                ref: inputRef,
                name,
                isPasswordConfirm: inputRef.current?.isPasswordConfirm,
                passwordRef: inputRef.current?.passwordRef
            };
        } else {
            inputRefs.current.push({
                ref: inputRef,
                name,
                isPasswordConfirm: inputRef.current?.isPasswordConfirm,
                passwordRef: inputRef.current?.passwordRef
            });
        }
    }, []);

    // 注销输入字段
    const unregisterInput = useCallback((inputRef: React.RefObject<any>) => {
        inputRefs.current = inputRefs.current.filter(ref => ref.ref !== inputRef);
    }, []);

    // 注册密码对
    const registerPasswordPair = useCallback((
        passwordRef: React.RefObject<any>,
        confirmPasswordRef: React.RefObject<any>
    ) => {
        if (passwordRef && confirmPasswordRef) {
            // 避免重复注册
            const exists = passwordPairs.current.some(pair =>
                pair.passwordRef === passwordRef && pair.confirmPasswordRef === confirmPasswordRef
            );
            if (!exists) {
                passwordPairs.current.push({ passwordRef, confirmPasswordRef });
            }
        }
    }, []);

    // 验证密码对
    const validatePasswordPairs = useCallback((): ValidationError[] => {
        const passwordErrors: ValidationError[] = [];

        passwordPairs.current.forEach((pair) => {
            if (pair.passwordRef.current && pair.confirmPasswordRef.current) {
                const passwordValue = pair.passwordRef.current.value;
                const confirmPasswordValue = pair.confirmPasswordRef.current.value;

                // 只在两个字段都有值且不相等时报错
                if (passwordValue && confirmPasswordValue && passwordValue !== confirmPasswordValue) {
                    passwordErrors.push({
                        fieldName: pair.confirmPasswordRef.current.name || 'confirmPassword',
                        message: '两次输入的密码不一致',
                        inputRef: pair.confirmPasswordRef
                    });
                }
            }
        });

        return passwordErrors;
    }, []);

    // 获取所有错误
    const getErrors = useCallback((): ValidationError[] => {
        return errors;
    }, [errors]);

    // 清除所有错误
    const clearErrors = useCallback(() => {
        setErrors([]);
        inputRefs.current.forEach(({ ref }) => {
            if (ref.current && ref.current.clearError) {
                ref.current.clearError();
            }
        });
    }, []);

    // 标记所有字段为已触摸
    const markAllAsTouched = useCallback(() => {
        inputRefs.current.forEach(({ ref }) => {
            if (ref.current && ref.current.markAsTouched) {
                ref.current.markAsTouched();
            }
        });
    }, []);

    // 重置表单
    const reset = useCallback(() => {
        clearErrors();
        inputRefs.current.forEach(({ ref }) => {
            if (ref.current && ref.current.reset) {
                ref.current.reset();
            }
        });
    }, [clearErrors]);

    // 强制显示所有错误信息
    const showAllErrors = useCallback(() => {
        inputRefs.current.forEach(({ ref }) => {
            if (ref.current && ref.current.markAsTouched) {
                ref.current.markAsTouched();
            }
            if (ref.current && (ref.current.forceValidate || ref.current.validate)) {
                (ref.current.forceValidate || ref.current.validate)();
            }
        });
        validatePasswordPairs();
    }, [validatePasswordPairs]);

    // 验证所有字段
    const validateAll = useCallback(async (): Promise<{ isValid: boolean; errors: ValidationError[] }> => {
        let allValid = true;
        const newErrors: ValidationError[] = [];

        // 强制显示所有错误
        if (showAllErrorsOnSubmit) {
            showAllErrors();
        }

        const validInputRefs = inputRefs.current.filter(registeredInput =>
            registeredInput.ref?.current &&
            document.contains(registeredInput.ref.current)
        );

        // 1. 验证所有输入字段
        validInputRefs.forEach(({ ref }) => {
            if (ref.current) {
                // 标记为已触摸
                if (ref.current.markAsTouched) {
                    ref.current.markAsTouched();
                }

                let isValid = true;
                if (ref.current.validate) {
                    isValid = ref.current.validate();
                } else {
                    // 基础验证
                    const isRequired = ref.current.required;
                    const value = ref.current.value || '';
                    isValid = !isRequired || (isRequired && value.trim() !== '');
                }

                if (!isValid) {
                    allValid = false;
                    const errorMessage = ref.current.getValidationError ?
                        ref.current.getValidationError() : '此字段为必填项';
                    newErrors.push({
                        fieldName: ref.current.name || ref.current.id || 'unknown',
                        message: errorMessage,
                        inputRef: ref
                    });
                }
            }
        });

        // 2. 验证密码对
        const passwordErrors = validatePasswordPairs();
        if (passwordErrors.length > 0) {
            allValid = false;
            newErrors.push(...passwordErrors);
        }

        // 3. 自定义验证
        if (customValidation) {
            try {
                const formData: Record<string, any> = {};
                validInputRefs.forEach(({ ref, name }) => {
                    if (ref.current && name) {
                        formData[name] = ref.current.value;
                    }
                });

                const customErrors = await customValidation(formData);
                if (customErrors.length > 0) {
                    allValid = false;
                    newErrors.push(...customErrors);
                }
            } catch (error) {
                console.error('Custom validation error:', error);
                allValid = false;
                newErrors.push({
                    fieldName: 'form',
                    message: '表单验证失败',
                    inputRef: { current: null }
                });
            }
        }

        setErrors(newErrors);
        onValidityChange?.(allValid, newErrors);

        return { isValid: allValid, errors: newErrors };
    }, [showAllErrorsOnSubmit, showAllErrors, validatePasswordPairs, customValidation, onValidityChange]);

    // 处理表单提交
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (disabled) return;

        setIsSubmitting(true);

        try {
            // 验证前先显示所有错误
            showAllErrors();

            const validationResult = await validateAll();

            if (!validationResult.isValid) {
                const invalidHandler = onInvalid || defaultOnInvalid;
                invalidHandler(validationResult.errors);
                setIsSubmitting(false);
                return;
            }

            // 收集表单数据
            const formData: Record<string, any> = {};
            inputRefs.current.forEach(({ ref, name }) => {
                if (ref.current && name) {
                    const value = ref.current.value;
                    if (value !== undefined && value !== null) {
                        formData[name] = value;
                    }
                }
            });

            await onSubmit?.(formData);

        } catch (error) {
            console.error('Form submission error:', error);
            const invalidHandler = onInvalid || defaultOnInvalid;
            invalidHandler([{
                fieldName: 'form',
                message: '表单提交过程中发生错误',
                inputRef: { current: null }
            }]);
        } finally {
            setIsSubmitting(false);
        }
    };

    // 提供上下文值
    const contextValue: FormValidatorContextType = {
        registerInput,
        unregisterInput,
        registerPasswordPair,
        validateAll,
        getErrors,
        clearErrors,
        markAllAsTouched,
        reset,
        showAllErrors,
        validateField: function (inputRef: React.RefObject<any>): boolean {
            throw new Error('Function not implemented.');
        }
    };

    return (
        <FormValidatorContext.Provider value={contextValue}>
            <form
                onSubmit={handleSubmit}
                className={cn('space-y-4', className)}
                noValidate
            >
                {children}
            </form>
        </FormValidatorContext.Provider>
    );
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({
         className,
         type,
         validationType,
         customValidation,
         errorMessage,
         onValidityChange,
         validateOnSubmit = true,
         required,
         isPasswordConfirm = false,
         passwordRef,
         idType,
         maxLength,
         onReset,
         onMarkAsTouched,
         name,
         onChange,
         onBlur,
         onFocus,
         value,
         ...props
     }, ref) => {
        const inputRef = useRef<HTMLInputElement>(null);
        const [error, setError] = useState<string | null>(null);
        const [isTouched, setIsTouched] = useState(false);
        const [internalValue, setInternalValue] = useState(value || '');
        const [shouldShowError, setShouldShowError] = useState(false);

        const { registerInput, unregisterInput, registerPasswordPair } = useFormValidator();

        // 默认错误消息映射
        const getDefaultErrorMessage = (): string => {
            if (errorMessage) return errorMessage;

            const defaultMessages: Record<string, string> = {
                phone: "请输入有效的11位手机号码",
                email: "请输入有效的邮箱地址",
                password: "密码必须包含字母和数字，长度至少6位",
                verificationCode: "请输入6位数字验证码",
                idNumber: "请输入有效的证件号码"
            };

            return defaultMessages[validationType || ''] || "请填写正确的信息";
        };

        // 主验证函数 - 简化逻辑，避免重叠验证
        const validateInput = useCallback((value: string, forceShowError = false): boolean => {
            const trimmedValue = value.trim();
            const showErrorNow = forceShowError || isTouched;

            // 1. 检查必填字段
            if (required && !trimmedValue) {
                if (showErrorNow) {
                    setError(getDefaultErrorMessage());
                    setShouldShowError(true);
                }
                onValidityChange?.(false);
                return false;
            }

            // 2. 非必填字段为空时直接通过
            if (!required && !trimmedValue) {
                setError(null);
                setShouldShowError(false);
                onValidityChange?.(true);
                return true;
            }

            // 3. 密码确认验证
            if (isPasswordConfirm && passwordRef?.current) {
                const passwordValue = passwordRef.current.value;
                if (trimmedValue !== passwordValue) {
                    if (showErrorNow) {
                        setError("两次输入的密码不一致");
                        setShouldShowError(true);
                    }
                    onValidityChange?.(false);
                    return false;
                }
            }

            // 4. 自定义验证
            if (validationType === 'custom' && customValidation) {
                const result = customValidation(trimmedValue);
                if (result !== true) {
                    if (showErrorNow) {
                        setError(typeof result === 'string' ? result : getDefaultErrorMessage());
                        setShouldShowError(true);
                    }
                    onValidityChange?.(false);
                    return false;
                }
            }

            // 5. 内置验证规则
            let isValid = true;
            switch (validationType) {
                case 'phone':
                    isValid = /^1[3-9]\d{9}$/.test(trimmedValue);
                    break;
                case 'email':
                    isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedValue);
                    break;
                case 'verificationCode':
                    isValid = /^\d{6}$/.test(trimmedValue);
                    break;
                case 'password':
                    isValid = trimmedValue.length >= 6 &&
                        /(?=.*[a-zA-Z])/.test(trimmedValue) &&
                        /(?=.*\d)/.test(trimmedValue);
                    break;
                case 'idNumber':
                    if (idType === 'NATIONAL_ID') {
                        isValid = /^[1-9]\d{5}(18|19|20)\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/.test(trimmedValue);
                    } else if (idType === 'PASSPORT') {
                        isValid = /^[a-zA-Z0-9]{5,9}$/.test(trimmedValue);
                    } else {
                        isValid = trimmedValue.length >= 2;
                    }
                    break;
                default:
                    isValid = true;
            }

            if (!isValid && showErrorNow) {
                setError(getDefaultErrorMessage());
                setShouldShowError(true);
                onValidityChange?.(false);
                return false;
            }

            // 验证通过
            setError(null);
            setShouldShowError(false);
            onValidityChange?.(true);
            return true;
        }, [
            isTouched, required, isPasswordConfirm, passwordRef,
            validationType, customValidation, idType, onValidityChange,
            getDefaultErrorMessage
        ]);

        // 暴露给父组件的方法
        const validate = useCallback((): boolean => {
            return validateInput(internalValue, true);
        }, [internalValue, validateInput]);

        const forceValidate = useCallback((): boolean => {
            setIsTouched(true);
            return validateInput(internalValue, true);
        }, [internalValue, validateInput]);

        const checkValidity = useCallback((): boolean => {
            return validateInput(internalValue, false);
        }, [internalValue, validateInput]);

        // 注册到表单验证器
        useEffect(() => {
            if (!validateOnSubmit) return;

            const proxyMethods = {
                validate,
                forceValidate,
                checkValidity,
                getValidationError: () => error,
                setCustomValidity: (message: string) => {
                    setError(message);
                    setShouldShowError(true);
                    onValidityChange?.(false);
                },
                markAsTouched: () => {
                    setIsTouched(true);
                    onMarkAsTouched?.();
                    validateInput(internalValue, true);
                },
                clearError: () => {
                    setError(null);
                    setShouldShowError(false);
                    onValidityChange?.(true);
                },
                reset: () => {
                    setError(null);
                    setShouldShowError(false);
                    setIsTouched(false);
                    setInternalValue('');
                    onReset?.();
                },
                value: internalValue,
                name: name || '',
                required: required || false,
                isPasswordConfirm: isPasswordConfirm,
                passwordRef: passwordRef
            };

            if (inputRef.current) {
                Object.assign(inputRef.current, proxyMethods);
            }

            registerInput(inputRef);

            if (isPasswordConfirm && passwordRef) {
                registerPasswordPair(passwordRef, inputRef);
            }

            return () => {
                unregisterInput(inputRef);
            };
        }, [
            validateOnSubmit, name, internalValue, error, required,
            isPasswordConfirm, passwordRef, validate, forceValidate,
            checkValidity, registerInput, unregisterInput, registerPasswordPair,
            onMarkAsTouched, onReset, onValidityChange, validateInput
        ]);

        // 事件处理
        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            let newValue = e.target.value;

            if (maxLength && newValue.length > maxLength) {
                newValue = newValue.slice(0, maxLength);
            }

            setInternalValue(newValue);

            // 只在有错误或已触摸时实时验证
            if (error || isTouched) {
                validateInput(newValue, true);
            }

            onChange?.(e);
        };

        const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
            setIsTouched(true);
            validateInput(e.target.value, true);
            onBlur?.(e);
        };

        const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
            onFocus?.(e);
        };

        // 同步外部 value
        useEffect(() => {
            if (value !== undefined && value !== internalValue) {
                setInternalValue(value);
                // 值改变时重新验证
                if (isTouched) {
                    validateInput(value, true);
                }
            }
        }, [value]);

        // 依赖变化时重新验证
        useEffect(() => {
            if (isTouched && internalValue) {
                validateInput(internalValue, true);
            }
        }, [idType, required]);

        useImperativeHandle(ref, () => {
            const methods = {
                validate,
                forceValidate,
                checkValidity,
                getValidationError: () => error,
                setCustomValidity: (message: string) => {
                    setError(message);
                    setShouldShowError(true);
                    onValidityChange?.(false);
                },
                markAsTouched: () => {
                    setIsTouched(true);
                    onMarkAsTouched?.();
                    validateInput(internalValue, true);
                },
                clearError: () => {
                    setError(null);
                    setShouldShowError(false);
                    onValidityChange?.(true);
                },
                reset: () => {
                    setError(null);
                    setShouldShowError(false);
                    setIsTouched(false);
                    setInternalValue('');
                    onReset?.();
                }
            };

            if (inputRef.current) {
                Object.assign(inputRef.current, methods);
            }

            return inputRef.current as any;
        }, [internalValue, error, validate, forceValidate, checkValidity]);

        return (
            <div className="relative">
                <input
                    type={type}
                    className={cn(
                        "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                        className,
                        (error && shouldShowError) && "border-red-500 focus-visible:ring-red-500"
                    )}
                    ref={inputRef}
                    name={name}
                    value={internalValue}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    onFocus={onFocus}
                    required={required}
                    maxLength={maxLength}
                    {...props}
                />
                {error && shouldShowError && (
                    <div className="absolute top-full left-0 w-full z-10">
                        <p className="mt-1 text-xs text-red-500 bg-red-50 px-2 py-1 rounded-md border border-red-200 shadow-sm">
                            {error}
                        </p>
                    </div>
                )}
            </div>
        );
    }
);

Input.displayName = "Input";

// ============================ Textarea 组件 ============================

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({
         className,
         validationType,
         customValidation,
         errorMessage,
         onValidityChange,
         validateOnSubmit = true,
         required,
         maxLength,
         onReset,
         onMarkAsTouched,
         name,
         onChange,
         onBlur,
         onFocus,
         value,
         ...props
     }, ref) => {
        const textareaRef = useRef<HTMLTextAreaElement>(null);
        const [error, setError] = useState<string | null>(null);
        const [isTouched, setIsTouched] = useState(false);
        const [internalValue, setInternalValue] = useState(value || '');
        const [shouldShowError, setShouldShowError] = useState(false);

        const { registerInput, unregisterInput } = useFormValidator();

        // 默认错误消息
        const getDefaultErrorMessage = (): string => {
            if (errorMessage) return errorMessage;
            return required ? '此字段为必填项' : '请填写正确的信息';
        };

        // 简化验证函数
        const validateTextarea = useCallback((forceShowError = false): boolean => {
            const trimmedValue = internalValue.trim();
            const showErrorNow = forceShowError || isTouched;

            // 1. 检查必填字段
            if (required && !trimmedValue) {
                if (showErrorNow) {
                    setError(getDefaultErrorMessage());
                    setShouldShowError(true);
                }
                onValidityChange?.(false);
                return false;
            }

            // 2. 非必填字段为空时直接通过
            if (!required && !trimmedValue) {
                setError(null);
                setShouldShowError(false);
                onValidityChange?.(true);
                return true;
            }

            // 3. 自定义验证
            if (validationType === 'custom' && customValidation) {
                const result = customValidation(trimmedValue);
                if (result !== true) {
                    if (showErrorNow) {
                        setError(typeof result === 'string' ? result : getDefaultErrorMessage());
                        setShouldShowError(true);
                    }
                    onValidityChange?.(false);
                    return false;
                }
            }

            // 4. 长度验证（如果有 maxLength）
            if (maxLength && trimmedValue.length > maxLength) {
                if (showErrorNow) {
                    setError(`内容长度不能超过${maxLength}个字符`);
                    setShouldShowError(true);
                }
                onValidityChange?.(false);
                return false;
            }

            // 验证通过
            setError(null);
            setShouldShowError(false);
            onValidityChange?.(true);
            return true;
        }, [internalValue, isTouched, required, validationType, customValidation, maxLength, onValidityChange]);

        // 暴露给父组件的方法
        const validate = useCallback((): boolean => {
            return validateTextarea(true);
        }, [validateTextarea]);

        const forceValidate = useCallback((): boolean => {
            setIsTouched(true);
            return validateTextarea(true);
        }, [validateTextarea]);

        const checkValidity = useCallback((): boolean => {
            return validateTextarea(false);
        }, [validateTextarea]);

        // 注册到表单验证器
        useEffect(() => {
            if (!validateOnSubmit) return;

            const proxyMethods = {
                validate,
                forceValidate,
                checkValidity,
                getValidationError: () => error,
                setCustomValidity: (message: string) => {
                    setError(message);
                    setShouldShowError(true);
                    onValidityChange?.(false);
                },
                markAsTouched: () => {
                    setIsTouched(true);
                    onMarkAsTouched?.();
                    validateTextarea(true);
                },
                clearError: () => {
                    setError(null);
                    setShouldShowError(false);
                    onValidityChange?.(true);
                },
                reset: () => {
                    setError(null);
                    setShouldShowError(false);
                    setIsTouched(false);
                    setInternalValue('');
                    onReset?.();
                },
                value: internalValue,
                name: name || '',
                required: required || false,
            };

            if (textareaRef.current) {
                Object.assign(textareaRef.current, proxyMethods);
            }

            registerInput(textareaRef);

            return () => {
                unregisterInput(textareaRef);
            };
        }, [
            validateOnSubmit, name, internalValue, error, required,
            validate, forceValidate, checkValidity, registerInput,
            unregisterInput, onMarkAsTouched, onReset, onValidityChange,
            validateTextarea
        ]);

        // 事件处理
        const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
            const newValue = e.target.value;
            setInternalValue(newValue);

            // 只在有错误或已触摸时实时验证
            if (error || isTouched) {
                validateTextarea(true);
            }

            onChange?.(e);
        };

        const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
            setIsTouched(true);
            validateTextarea(true);
            onBlur?.(e);
        };

        const handleFocus = (e: React.FocusEvent<HTMLTextAreaElement>) => {
            onFocus?.(e);
        };

        // 同步外部 value
        useEffect(() => {
            if (value !== undefined && value !== internalValue) {
                setInternalValue(value);
                // 值改变时重新验证
                if (isTouched) {
                    validateTextarea(true);
                }
            }
        }, [value]);

        useImperativeHandle(ref, () => {
            const methods = {
                validate,
                forceValidate,
                checkValidity,
                getValidationError: () => error,
                setCustomValidity: (message: string) => {
                    setError(message);
                    setShouldShowError(true);
                    onValidityChange?.(false);
                },
                markAsTouched: () => {
                    setIsTouched(true);
                    onMarkAsTouched?.();
                    validateTextarea(true);
                },
                clearError: () => {
                    setError(null);
                    setShouldShowError(false);
                    onValidityChange?.(true);
                },
                reset: () => {
                    setError(null);
                    setShouldShowError(false);
                    setIsTouched(false);
                    setInternalValue('');
                    onReset?.();
                }
            };

            if (textareaRef.current) {
                Object.assign(textareaRef.current, methods);
            }

            return textareaRef.current as any;
        }, [internalValue, error, validate, forceValidate, checkValidity]);

        return (
            <div className="relative">
        <textarea
            className={cn(
                "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                className,
                (error && shouldShowError) && "border-red-500 focus-visible:ring-red-500"
            )}
            ref={textareaRef}
            name={name}
            value={internalValue}
            onChange={handleChange}
            onBlur={handleBlur}
            onFocus={onFocus}
            required={required}
            maxLength={maxLength}
            {...props}
        />
                {error && shouldShowError && (
                    <div className="absolute top-full left-0 w-full z-10">
                        <p className="mt-1 text-xs text-red-500 bg-red-50 px-2 py-1 rounded-md border border-red-200 shadow-sm">
                            {error}
                        </p>
                    </div>
                )}
                {maxLength && (
                    <div className="flex justify-between items-center mt-1">
            <span className="text-xs text-muted-foreground">
              {internalValue.length}/{maxLength}
            </span>
                    </div>
                )}
            </div>
        );
    }
);

Textarea.displayName = "Textarea";

// ============================ ValidatedSelect 组件 ============================

interface ValidatedSelectProps {
    value?: string
    onValueChange?: (value: string) => void
    children: React.ReactNode
    className?: string
    required?: boolean
    name?: string
    id?: string
    placeholder?: string
    validateOnSubmit?: boolean
    errorMessage?: string
    disabled?: boolean
    onValidityChange?: (isValid: boolean) => void
    onReset?: () => void
    onMarkAsTouched?: () => void
}

export const ValidatedSelect = forwardRef<HTMLButtonElement, ValidatedSelectProps>(
    (
        {
            value,
            onValueChange,
            children,
            className,
            required,
            name,
            id,
            placeholder,
            validateOnSubmit = true,
            errorMessage,
            disabled,
            onValidityChange,
            onReset,
            onMarkAsTouched,
            ...props
        },
        ref
    ) => {
        const selectRef = useRef<HTMLButtonElement>(null);
        const [error, setError] = useState<string | null>(null);
        const [isTouched, setIsTouched] = useState(false);
        const [shouldShowError, setShouldShowError] = useState(false);
        const { registerInput, unregisterInput } = useFormValidator();

        // 默认错误消息
        const getDefaultErrorMessage = (): string => {
            return errorMessage || '请选择此项';
        };

        // 简化验证函数
        const validateSelect = useCallback((forceShowError = false): boolean => {
            const currentValue = value || '';
            const showErrorNow = forceShowError || isTouched;

            // 必填字段验证
            if (required && !currentValue.trim()) {
                if (showErrorNow) {
                    setError(getDefaultErrorMessage());
                    setShouldShowError(true);
                }
                onValidityChange?.(false);
                return false;
            }

            // 验证通过
            setError(null);
            setShouldShowError(false);
            onValidityChange?.(true);
            return true;
        }, [value, isTouched, required, onValidityChange]);

        // 暴露给父组件的方法
        const validate = useCallback((): boolean => {
            return validateSelect(true);
        }, [validateSelect]);

        const forceValidate = useCallback((): boolean => {
            setIsTouched(true);
            return validateSelect(true);
        }, [validateSelect]);

        const checkValidity = useCallback((): boolean => {
            return validateSelect(false);
        }, [validateSelect]);

        // 注册到表单验证器
        useEffect(() => {
            if (!validateOnSubmit || !selectRef.current) return;

            const proxyMethods = {
                validate,
                forceValidate,
                checkValidity,
                getValidationError: () => error,
                setCustomValidity: (message: string) => {
                    setError(message);
                    setShouldShowError(true);
                    onValidityChange?.(false);
                },
                markAsTouched: () => {
                    setIsTouched(true);
                    onMarkAsTouched?.();
                    validateSelect(true);
                },
                clearError: () => {
                    setError(null);
                    setShouldShowError(false);
                    onValidityChange?.(true);
                },
                reset: () => {
                    setError(null);
                    setShouldShowError(false);
                    setIsTouched(false);
                    onReset?.();
                },
                value: value || '',
                name: name || '',
                required: required || false,
            };

            Object.assign(selectRef.current, proxyMethods);
            registerInput({ current: selectRef.current });

            return () => {
                unregisterInput({ current: selectRef.current });
            };
        }, [
            registerInput, unregisterInput, validateOnSubmit, name, required,
            value, error, onValidityChange, onMarkAsTouched, onReset,
            validate, forceValidate, checkValidity, validateSelect
        ]);

        const handleValueChange = (newValue: string) => {
            // 更新 data-value 属性
            if (selectRef.current) {
                selectRef.current.setAttribute('data-value', newValue);
            }

            // 标记为已触摸（当用户选择值时）
            if (!isTouched) {
                setIsTouched(true);
            }

            onValueChange?.(newValue);

            // 值改变时进行验证
            validateSelect(true);
        };

        // 处理 blur 事件
        const handleBlur = () => {
            if (!isTouched) {
                setIsTouched(true);
                onMarkAsTouched?.();
                validateSelect(true);
            }
        };

        // 当值或必填状态改变时重新验证
        useEffect(() => {
            if (isTouched) {
                validateSelect(true);
            }
        }, [value, required, validateSelect, isTouched]);

        useImperativeHandle(ref, () => {
            const methods = {
                validate,
                forceValidate,
                checkValidity,
                getValidationError: () => error,
                setCustomValidity: (message: string) => {
                    setError(message);
                    setShouldShowError(true);
                    onValidityChange?.(false);
                },
                markAsTouched: () => {
                    setIsTouched(true);
                    onMarkAsTouched?.();
                    validateSelect(true);
                },
                clearError: () => {
                    setError(null);
                    setShouldShowError(false);
                    onValidityChange?.(true);
                },
                reset: () => {
                    setError(null);
                    setShouldShowError(false);
                    setIsTouched(false);
                    onReset?.();
                }
            };

            if (selectRef.current) {
                Object.assign(selectRef.current, methods);
            }

            return selectRef.current as any;
        }, [value, error, onMarkAsTouched, onReset, onValidityChange, validate, forceValidate, checkValidity, required]);

        return (
            <div className="relative">
                <Select
                    disabled={disabled}
                    required={required}
                    value={value}
                    onValueChange={handleValueChange}
                    {...props}
                >
                    <SelectTrigger
                        ref={selectRef}
                        className={cn(
                            className,
                            (error && shouldShowError) && "border-red-500 focus-visible:ring-red-500"
                        )}
                        name={name}
                        id={id}
                        data-value={value || ''}
                        onBlur={handleBlur}
                    >
                        <SelectValue placeholder={placeholder} />
                    </SelectTrigger>
                    {children}
                </Select>
                {error && shouldShowError && (
                    <div className="absolute top-full left-0 w-full z-10">
                        <p className="mt-1 text-xs text-red-500 bg-red-50 px-2 py-1 rounded-md border border-red-200 shadow-sm">
                            {error}
                        </p>
                    </div>
                )}
            </div>
        );
    }
);

ValidatedSelect.displayName = 'ValidatedSelect';