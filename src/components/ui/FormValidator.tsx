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

    if (!onInvalid) {
        onInvalid = (errors: ValidationError[]) => {
            if (errors.length > 0) {
                // 如果有多个错误，显示第一个错误
                const firstError = errors[0];

                // 根据错误类型显示不同的提示
                let title = "填写验证错误";
                let description = firstError.message || "请检查填写的内容";

                // 根据错误类型定制提示
                if (errors.length > 1) {
                    title = `填写验证错误 (${errors.length} 处错误)`;
                    description = `${firstError.message} 等 ${errors.length} 处错误，请检查填写内容`;
                }

                // 特殊字段的错误提示优化
                if (firstError.fieldName.includes('password') || firstError.fieldName.includes('Password')) {
                    description = "密码相关内容填写有误，请检查";
                } else if (firstError.fieldName.includes('phone') || firstError.fieldName.includes('Phone')) {
                    description = "手机号格式不正确";
                } else if (firstError.fieldName.includes('email') || firstError.fieldName.includes('Email')) {
                    description = "邮箱格式不正确";
                }

                toast({
                    title: title,
                    description: description,
                    variant: "destructive",
                    duration: 5000, // 显示5秒
                });

                // 在控制台输出所有错误详情，方便调试
                if (errors.length > 1) {
                    console.group('表单验证错误详情');
                    errors.forEach((error, index) => {
                        console.log(`错误 ${index + 1}:`, {
                            字段: error.fieldName,
                            消息: error.message
                        });
                    });
                    console.groupEnd();
                }
            } else {
                // 理论上不会进入这里，但作为保护
                toast({
                    title: "填写验证错误",
                    description: "未知错误，请检查填写内容",
                    variant: "destructive",
                });
            }
        };
    }

    // 注册输入字段 - 修复：防止重复注册
    const registerInput = useCallback((inputRef: React.RefObject<any>) => {
        if (!inputRef.current) return;

        const name = inputRef.current.name || inputRef.current.id || '';
        const existingIndex = inputRefs.current.findIndex(ref =>
            ref.ref === inputRef || (ref.name === name && name !== '')
        );

        if (existingIndex >= 0) {
            // 替换已存在的注册
            inputRefs.current[existingIndex] = {
                ref: inputRef,
                name,
                isPasswordConfirm: inputRef.current?.isPasswordConfirm,
                passwordRef: inputRef.current?.passwordRef
            };
            console.log('替换已注册的输入字段:', name);
        } else {
            // 新注册
            inputRefs.current.push({
                ref: inputRef,
                name,
                isPasswordConfirm: inputRef.current?.isPasswordConfirm,
                passwordRef: inputRef.current?.passwordRef
            });
            console.log('注册输入字段:', name);
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
            passwordPairs.current.push({passwordRef, confirmPasswordRef});
        }
    }, []);

    // 验证单个字段
    const validateField = useCallback((inputRef: React.RefObject<any>): boolean => {
        if (!inputRef.current) return true;

        // 检查是否有 validate 方法
        if (typeof inputRef.current.validate === 'function') {
            return inputRef.current.validate();
        }

        // 如果没有 validate 方法，进行基本验证
        const value = inputRef.current.value?.toString().trim() || '';
        if (inputRef.current.required && !value) {
            return false;
        }
        return true;
    }, []);

    // 验证密码对
    const validatePasswordPairs = useCallback((): ValidationError[] => {
        const passwordErrors: ValidationError[] = [];

        passwordPairs.current.forEach((pair) => {
            if (pair.passwordRef.current && pair.confirmPasswordRef.current) {
                const passwordValue = pair.passwordRef.current.value;
                const confirmPasswordValue = pair.confirmPasswordRef.current.value;

                if (passwordValue !== confirmPasswordValue && passwordValue) {
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
        inputRefs.current.forEach(({ref}) => {
            if (ref.current && ref.current.clearError) {
                ref.current.clearError();
            }
        });
    }, []);

    // 标记所有字段为已触摸
    const markAllAsTouched = useCallback(() => {
        inputRefs.current.forEach(({ref}) => {
            if (ref.current && ref.current.markAsTouched) {
                ref.current.markAsTouched();
            }
        });
    }, []);

    // 重置表单
    const reset = useCallback(() => {
        clearErrors();
        inputRefs.current.forEach(({ref}) => {
            if (ref.current && ref.current.reset) {
                ref.current.reset();
            }
        });
    }, [clearErrors]);

    // 强制显示所有错误信息
    const showAllErrors = useCallback(() => {
        console.log('强制显示所有错误信息，注册字段数:', inputRefs.current.length);

        // 1. 标记所有字段为已触摸状态
        inputRefs.current.forEach(({ref, name}) => {
            if (ref.current && ref.current.markAsTouched) {
                ref.current.markAsTouched();
            } else {
                console.log('markAsTouched 方法不存在:', name);
            }
        });

        // 2. 强制验证所有字段
        inputRefs.current.forEach(({ref, name}) => {
            if (ref.current) {
                if (ref.current.forceValidate) {
                    ref.current.forceValidate();
                } else if (ref.current.validate) {
                    ref.current.validate();
                } else {
                    console.log('验证方法不存在:', name);
                }
            }
        });

        // 3. 强制验证密码对
        validatePasswordPairs();
    }, [validatePasswordPairs]);

    // 验证所有字段
    const validateAll = useCallback(async (): Promise<{ isValid: boolean; errors: ValidationError[] }> => {
        console.log('开始验证所有字段，注册的字段数量:', inputRefs.current.length);

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
        validInputRefs.forEach(({ref}) => {
            if (ref.current) {
                console.log('验证字段:', ref.current.name, '类型:', ref.current.type, '标签名:', ref.current.tagName);

                // 标记为已触摸
                if (ref.current.markAsTouched) {
                    ref.current.markAsTouched();
                }

                // 检查是否是 Select 组件
                const isSelectComponent = ref.current.tagName === 'BUTTON' && ref.current.hasAttribute('data-state');

                let isValid = true;
                if (ref.current.validate) {
                    // 如果有自定义 validate 方法，使用它
                    isValid = ref.current.validate();
                } else if (isSelectComponent) {
                    // 处理 Select 组件 - 检查 required 和 value
                    const isRequired = ref.current.required;
                    const value = ref.current.value || '';

                    if (isRequired && !value.trim()) {
                        isValid = false;
                    }
                } else {
                    // 默认验证：检查 required 和 value
                    const isRequired = ref.current.required;
                    const value = ref.current.value || '';

                    if (isRequired && !value.trim()) {
                        isValid = false;
                    }
                }

                console.log('字段验证结果:', ref.current.name, isValid);

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
                validInputRefs.forEach(({ref, name}) => {
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
                    inputRef: {current: null}
                });
            }
        }

        setErrors(newErrors);
        onValidityChange?.(allValid, newErrors);

        console.log('验证完成，结果:', {isValid: allValid, errors: newErrors});
        return {isValid: allValid, errors: newErrors};
    }, [showAllErrorsOnSubmit, showAllErrors, validatePasswordPairs, customValidation, onValidityChange]);

    // 处理表单提交
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (disabled) {
            return;
        }

        console.log('=== 表单提交开始 ===');
        console.log('注册的输入字段:', inputRefs.current);

        setIsSubmitting(true);

        try {
            // 1. 强制显示所有错误信息
            showAllErrors();

            // 2. 进行完整验证
            const validationResult = await validateAll();

            // 3. 检查验证结果
            if (!validationResult.isValid) {
                console.log('验证失败，错误:', validationResult.errors);
                onInvalid?.(validationResult.errors);
                setIsSubmitting(false);
                return;
            }

            // 4. 收集表单数据
            const formData: Record<string, any> = {};
            inputRefs.current.forEach(({ref, name}) => {
                if (ref.current && name) {
                    const value = ref.current.value;
                    if (value !== undefined && value !== null) {
                        formData[name] = value;
                    }
                }
            });

            console.log('收集的表单数据:', formData);

            // 5. 调用提交处理函数
            await onSubmit?.(formData);

        } catch (error) {
            console.error('Form submission error:', error);
            onInvalid?.([{
                fieldName: 'form',
                message: '表单验证过程中发生错误',
                inputRef: {current: null}
            }]);
        } finally {
            setIsSubmitting(false);
            console.log('=== 表单提交结束 ===');
        }
    };

    // 提供上下文值
    const contextValue: FormValidatorContextType = {
        registerInput,
        unregisterInput,
        registerPasswordPair,
        validateField,
        validateAll,
        getErrors,
        clearErrors,
        markAllAsTouched,
        reset,
        showAllErrors
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

// ============================ Input 组件 ============================
// ============================ Input 组件 ============================

// ============================ Input 组件 ============================

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
        const [showError, setShowError] = useState(false);

        const {registerInput, unregisterInput, registerPasswordPair} = useFormValidator();

        // 验证函数 - 修复：使用 useCallback 并添加 idType 和 required 依赖
        const validateInput = useCallback((value: string, forceValidation = false, forceShowError = false): boolean => {
            const trimmedValue = value.trim();

            // 强制显示错误或已触摸或已有错误
            const shouldShowError = forceShowError || isTouched || error;

            if (!shouldShowError && !forceValidation && !trimmedValue) {
                setError(null);
                setShowError(false);
                onValidityChange?.(!required);
                return !required;
            }

            // 必填字段验证
            if (required && !trimmedValue) {
                const errorMsg = errorMessage || '此字段为必填项';
                setError(errorMsg);
                setShowError(true);
                onValidityChange?.(false);
                return false;
            }

            // 非必填字段为空时跳过其他验证
            if (!required && !trimmedValue) {
                setError(null);
                setShowError(false);
                onValidityChange?.(true);
                return true;
            }

            // 密码确认验证
            if (isPasswordConfirm && passwordRef?.current) {
                const passwordValue = passwordRef.current.value;
                if (trimmedValue !== passwordValue && passwordValue) {
                    const errorMsg = errorMessage || '两次输入的密码不一致';
                    setError(errorMsg);
                    setShowError(true);
                    onValidityChange?.(false);
                    return false;
                }
            }

            // 自定义验证
            if (validationType === 'custom' && customValidation) {
                const result = customValidation(trimmedValue);
                if (result === true) {
                    // 继续后续验证
                } else if (result === false) {
                    const errorMsg = errorMessage || '输入格式不正确';
                    setError(errorMsg);
                    setShowError(true);
                    onValidityChange?.(false);
                    return false;
                } else if (typeof result === 'string') {
                    setError(result);
                    setShowError(true);
                    onValidityChange?.(false);
                    return false;
                }
            }

            // 内置验证类型
            switch (validationType) {
                case 'phone':
                    const phoneRegex = /^1[3-9]\d{9}$/;
                    if (!phoneRegex.test(trimmedValue)) {
                        setError(errorMessage || '请输入有效的11位手机号码');
                        setShowError(true);
                        onValidityChange?.(false);
                        return false;
                    }
                    break;

                case 'email':
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!emailRegex.test(trimmedValue)) {
                        setError(errorMessage || '请输入有效的邮箱地址');
                        setShowError(true);
                        onValidityChange?.(false);
                        return false;
                    }
                    break;

                case 'verificationCode':
                    const codeRegex = /^\d{6}$/;
                    if (!codeRegex.test(trimmedValue)) {
                        setError(errorMessage || '请输入6位数字验证码');
                        setShowError(true);
                        onValidityChange?.(false);
                        return false;
                    }
                    break;

                case 'password':
                    if (trimmedValue.length < 6) {
                        setError(errorMessage || '密码长度至少为6位');
                        setShowError(true);
                        onValidityChange?.(false);
                        return false;
                    }
                    if (!/(?=.*[a-zA-Z])/.test(trimmedValue)) {
                        setError(errorMessage || '密码必须包含字母');
                        setShowError(true);
                        onValidityChange?.(false);
                        return false;
                    }
                    if (!/(?=.*\d)/.test(trimmedValue)) {
                        setError(errorMessage || '密码必须包含数字');
                        setShowError(true);
                        onValidityChange?.(false);
                        return false;
                    }
                    break;

                case 'idNumber':
                    console.log('idType', idType, 'required:', required);
                    if (idType === 'NATIONAL_ID') {
                        const idCardRegex = /^[1-9]\d{5}(18|19|20)\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/;
                        if (!idCardRegex.test(trimmedValue)) {
                            setError(errorMessage || '请输入有效的身份证号码');
                            setShowError(true);
                            onValidityChange?.(false);
                            return false;
                        }
                    } else if (idType === 'PASSPORT') {
                        const passportRegex = /^[a-zA-Z0-9]{5,9}$/;
                        if (!passportRegex.test(trimmedValue)) {
                            setError(errorMessage || '请输入有效的护照号码');
                            setShowError(true);
                            onValidityChange?.(false);
                            return false;
                        }
                    } else if (idType === 'OTHER') {
                        // 其他证件类型，可以添加更宽松的验证或跳过验证
                        if (trimmedValue.length < 2) {
                            setError(errorMessage || '请输入有效的证件号码');
                            setShowError(true);
                            onValidityChange?.(false);
                            return false;
                        }
                    }
                    break;

                default:
                    break;
            }

            setError(null);
            setShowError(false);
            onValidityChange?.(true);
            return true;
        }, [
            isTouched, error, required, isPasswordConfirm, passwordRef,
            validationType, customValidation, errorMessage, onValidityChange,
            idType // 关键：添加 idType 和 required 依赖
        ]);

        const checkValidity = (): boolean => {
            return validateInput(internalValue, true);
        };

        // 强制验证并显示错误
        const forceValidate = (): boolean => {
            setIsTouched(true);
            return validateInput(internalValue, true, true);
        };

        // 当 idType 或 required 改变时，重新验证当前值
        useEffect(() => {
            if (isTouched && internalValue) {
                validateInput(internalValue, true, true);
            } else if (isTouched && !internalValue) {
                // 当字段为空且已被触摸时，重新验证必填状态
                validateInput(internalValue, true, true);
            }
        }, [idType, required, validateInput, isTouched, internalValue]);

        // 更新注册的方法对象中的 required 值
        useEffect(() => {
            if (inputRef.current && typeof inputRef.current === 'object') {
                // 更新 required 属性
                Object.assign(inputRef.current, {
                    required: required || false,
                    validate: () => validateInput(internalValue, true),
                    forceValidate: () => forceValidate(),
                    checkValidity: () => checkValidity(),
                });
            }
        }, [required, validateInput, internalValue]);

        // 注册到表单验证器
        useEffect(() => {
            if (!validateOnSubmit) return;

            console.log('Input 组件挂载:', name, 'required:', required);

            // 创建代理对象来存储自定义方法
            const proxyMethods = {
                validate: () => validateInput(internalValue, true),
                forceValidate: () => forceValidate(),
                checkValidity: () => checkValidity(),
                getValidationError: () => error,
                setCustomValidity: (message: string) => {
                    setError(message);
                    setShowError(true);
                    onValidityChange?.(false);
                },
                markAsTouched: () => {
                    setIsTouched(true);
                    onMarkAsTouched?.();
                    validateInput(internalValue, true, true);
                },
                clearError: () => {
                    setError(null);
                    setShowError(false);
                    onValidityChange?.(true);
                },
                reset: () => {
                    setError(null);
                    setShowError(false);
                    setIsTouched(false);
                    setInternalValue('');
                    onReset?.();
                },
                value: internalValue,
                name: name || '',
                id: props.id || '',
                required: required || false,
                isTouched: isTouched,
                showError: showError,
                isPasswordConfirm: isPasswordConfirm,
                passwordRef: passwordRef
            };

            // 将方法附加到 input 元素
            if (inputRef.current) {
                Object.assign(inputRef.current, proxyMethods);
                console.log('方法附加到 input 元素:', name, 'required:', required);
            }

            // 注册到表单验证器
            registerInput(inputRef);

            if (isPasswordConfirm && passwordRef) {
                registerPasswordPair(passwordRef, inputRef);
            }

            return () => {
                console.log('Input 组件卸载:', name);
                unregisterInput(inputRef);
            };
        }, [
            validateOnSubmit, name, internalValue, error, isTouched, showError,
            required, isPasswordConfirm, passwordRef, onMarkAsTouched, onReset,
            onValidityChange, registerInput, unregisterInput, registerPasswordPair,
            props.id, validateInput, forceValidate, checkValidity
        ]);

        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            let value = e.target.value;
            setInternalValue(value);

            if (maxLength && value.length > maxLength) {
                value = value.slice(0, maxLength);
                e.target.value = value;
                setInternalValue(value);
            }

            if (isTouched || error) {
                validateInput(value, false, !!error);
            }

            onChange?.(e);
        };

        const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
            setIsTouched(true);
            onMarkAsTouched?.();
            validateInput(e.target.value, true, true);
            onBlur?.(e);
        };

        const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
            onFocus?.(e);
        };

        // 暴露方法给父组件
        useImperativeHandle(ref, () => {
            const inputElement = inputRef.current;

            if (!inputElement) {
                return null as any;
            }

            // 创建方法对象
            const methods = {
                validate: () => validateInput(internalValue, true),
                forceValidate: () => forceValidate(),
                checkValidity: () => checkValidity(),
                getValidationError: () => error,
                setCustomValidity: (message: string) => {
                    setError(message);
                    setShowError(true);
                    onValidityChange?.(false);
                },
                markAsTouched: () => {
                    setIsTouched(true);
                    onMarkAsTouched?.();
                    validateInput(internalValue, true, true);
                },
                clearError: () => {
                    setError(null);
                    setShowError(false);
                    onValidityChange?.(true);
                },
                reset: () => {
                    setError(null);
                    setShowError(false);
                    setIsTouched(false);
                    setInternalValue('');
                    onReset?.();
                },
                // 添加动态属性
                get required() {
                    return required || false;
                },
                set required(value) {
                    // 允许外部设置 required，但通常不建议
                    console.log('尝试设置 required:', value);
                }
            };

            // 合并到 input 元素
            Object.assign(inputElement, methods);

            return inputElement;
        }, [
            internalValue, error, isTouched, showError, onMarkAsTouched, onReset,
            onValidityChange, validateInput, forceValidate, checkValidity, required
        ]);

        // 验证状态回调
        useEffect(() => {
            onValidityChange?.(!error);
        }, [error, onValidityChange]);

        // 同步外部 value
        useEffect(() => {
            if (value !== undefined) {
                setInternalValue(value);
            }
        }, [value]);

        // 当 required 改变时，重新验证状态
        useEffect(() => {
            if (isTouched) {
                validateInput(internalValue, true, true);
            } else {
                // 即使未触摸，也需要更新验证状态（用于整体表单验证）
                validateInput(internalValue, false, false);
            }
        }, [required]);

        return (
            <div className="relative">
                <input
                    type={type}
                    className={cn(
                        "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                        className,
                        (error && showError) && "border-red-500 focus-visible:ring-red-500"
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
                {error && showError && (
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

// ============================ 默认导出 ============================

export default FormValidator;

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
        const [showError, setShowError] = useState(false);

        const {registerInput, unregisterInput} = useFormValidator();

        // 验证函数
        const validateTextarea = (value: string, forceValidation = false, forceShowError = false): boolean => {
            const trimmedValue = value.trim();

            const shouldShowError = forceShowError || isTouched || error;

            if (!shouldShowError && !forceValidation && !trimmedValue) {
                setError(null);
                setShowError(false);
                onValidityChange?.(!required);
                return !required;
            }

            if (required && !trimmedValue) {
                const errorMsg = errorMessage || '此字段为必填项';
                setError(errorMsg);
                setShowError(true);
                onValidityChange?.(false);
                return false;
            }

            if (!required && !trimmedValue) {
                setError(null);
                setShowError(false);
                onValidityChange?.(true);
                return true;
            }

            if (validationType === 'custom' && customValidation) {
                const result = customValidation(trimmedValue);
                if (result === true) {
                    // 继续后续验证
                } else if (result === false) {
                    const errorMsg = errorMessage || '输入格式不正确';
                    setError(errorMsg);
                    setShowError(true);
                    onValidityChange?.(false);
                    return false;
                } else if (typeof result === 'string') {
                    setError(result);
                    setShowError(true);
                    onValidityChange?.(false);
                    return false;
                }
            }

            setError(null);
            setShowError(false);
            onValidityChange?.(true);
            return true;
        };

        const checkValidity = (): boolean => {
            const value = internalValue;
            return validateTextarea(value, true);
        };

        const forceValidate = (): boolean => {
            const value = internalValue;
            setIsTouched(true);
            return validateTextarea(value, true, true);
        };

        // 注册到表单验证器 - 修复：添加方法附加逻辑
        useEffect(() => {
            if (!validateOnSubmit) return;

            console.log('Textarea 组件挂载:', name);

            // 创建代理对象来存储自定义方法
            const proxyMethods = {
                validate: () => validateTextarea(internalValue, true),
                forceValidate: () => forceValidate(),
                checkValidity: () => checkValidity(),
                getValidationError: () => error,
                setCustomValidity: (message: string) => {
                    setError(message);
                    setShowError(true);
                    onValidityChange?.(false);
                },
                markAsTouched: () => {
                    setIsTouched(true);
                    onMarkAsTouched?.();
                    validateTextarea(internalValue, true, true);
                },
                clearError: () => {
                    setError(null);
                    setShowError(false);
                    onValidityChange?.(true);
                },
                reset: () => {
                    setError(null);
                    setShowError(false);
                    setIsTouched(false);
                    setInternalValue('');
                    onReset?.();
                },
                value: internalValue,
                name: name || '',
                id: props.id || '',
                required: required || false,
                isTouched: isTouched,
                showError: showError,
                isPasswordConfirm: false, // Textarea 不支持密码确认
                passwordRef: undefined
            };

            // 将方法附加到 textarea 元素
            if (textareaRef.current) {
                Object.assign(textareaRef.current, proxyMethods);
                console.log('方法附加到 textarea 元素:', name, Object.keys(proxyMethods));
            }

            // 注册到表单验证器
            registerInput(textareaRef);

            return () => {
                console.log('Textarea 组件卸载:', name);
                unregisterInput(textareaRef);
            };
        }, [validateOnSubmit, name, internalValue, error, isTouched, showError, required, onMarkAsTouched, onReset, onValidityChange, registerInput, unregisterInput, props.id]);

        const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
            let value = e.target.value;
            setInternalValue(value);

            if (maxLength && value.length > maxLength) {
                value = value.slice(0, maxLength);
                e.target.value = value;
                setInternalValue(value);
            }

            if (isTouched || error) {
                validateTextarea(value, false, !!error);
            }

            onChange?.(e);
        };

        const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
            setIsTouched(true);
            onMarkAsTouched?.();
            validateTextarea(e.target.value, true, true);
            onBlur?.(e);
        };

        const handleFocus = (e: React.FocusEvent<HTMLTextAreaElement>) => {
            onFocus?.(e);
        };

        // 暴露方法给父组件
        useImperativeHandle(ref, () => {
            const textareaElement = textareaRef.current;

            if (!textareaElement) {
                return null as any;
            }

            // 创建方法对象
            const methods = {
                validate: () => validateTextarea(internalValue, true),
                forceValidate: () => forceValidate(),
                checkValidity: () => checkValidity(),
                getValidationError: () => error,
                setCustomValidity: (message: string) => {
                    setError(message);
                    setShowError(true);
                    onValidityChange?.(false);
                },
                markAsTouched: () => {
                    setIsTouched(true);
                    onMarkAsTouched?.();
                    validateTextarea(internalValue, true, true);
                },
                clearError: () => {
                    setError(null);
                    setShowError(false);
                    onValidityChange?.(true);
                },
                reset: () => {
                    setError(null);
                    setShowError(false);
                    setIsTouched(false);
                    setInternalValue('');
                    onReset?.();
                }
            };

            // 合并到 textarea 元素
            Object.assign(textareaElement, methods);

            return textareaElement;
        }, [internalValue, error, isTouched, showError, onMarkAsTouched, onReset, onValidityChange]);

        // 验证状态回调
        useEffect(() => {
            onValidityChange?.(!error);
        }, [error, onValidityChange]);

        // 同步外部 value
        useEffect(() => {
            if (value !== undefined) {
                setInternalValue(value);
            }
        }, [value]);

        return (
            <div className="relative">
        <textarea
            className={cn(
                "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                className,
                (error && showError) && "border-red-500 focus-visible:ring-red-500"
            )}
            ref={textareaRef}
            name={name}
            value={internalValue}
            onChange={handleChange}
            onBlur={handleBlur}
            onFocus={handleFocus}
            required={required}
            maxLength={maxLength}
            {...props}
        />
                {error && showError && (
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
}

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
        const selectRef = useRef<HTMLButtonElement>(null)
        const [error, setError] = useState<string | null>(null)
        const [isTouched, setIsTouched] = useState(false)
        const [showError, setShowError] = useState(false)
        const {registerInput, unregisterInput} = useFormValidator()

        // 验证函数 - 修复：使用 useCallback 并添加 required 依赖
        const validateSelect = useCallback((forceValidation = false, forceShowError = false): boolean => {
            const currentValue = value || ''
            const trimmedValue = currentValue.trim()

            // 强制显示错误或已触摸或已有错误
            const shouldShowError = forceShowError || isTouched || error

            if (!shouldShowError && !forceValidation && !trimmedValue) {
                setError(null)
                setShowError(false)
                onValidityChange?.(!required)
                return !required
            }

            // 必填字段验证
            if (required && !trimmedValue) {
                const errorMsg = errorMessage || '请选择此项'
                setError(errorMsg)
                setShowError(true)
                onValidityChange?.(false)
                return false
            }

            // 非必填字段为空时跳过其他验证
            if (!required && !trimmedValue) {
                setError(null)
                setShowError(false)
                onValidityChange?.(true)
                return true
            }

            setError(null)
            setShowError(false)
            onValidityChange?.(true)
            return true
        }, [value, isTouched, error, required, errorMessage, onValidityChange])

        const checkValidity = (): boolean => {
            return validateSelect(true)
        }

        const forceValidate = (): boolean => {
            setIsTouched(true)
            return validateSelect(true, true)
        }

        // 当 required 或 value 改变时，重新验证
        useEffect(() => {
            if (isTouched) {
                validateSelect(true, true)
            }
        }, [required, value, validateSelect, isTouched])

        // 更新注册的方法对象中的 required 值
        useEffect(() => {
            if (selectRef.current && typeof selectRef.current === 'object') {
                Object.assign(selectRef.current, {
                    required: required || false,
                    validate: () => validateSelect(true),
                    forceValidate: () => forceValidate(),
                    checkValidity: () => checkValidity(),
                })
            }
        }, [required, validateSelect])

        // 注册到表单验证器
        useEffect(() => {
            if (!validateOnSubmit || !selectRef.current) return

            console.log('ValidatedSelect 注册:', name, 'required:', required)

            // 创建代理对象来存储自定义方法
            const proxyMethods = {
                validate: () => validateSelect(true),
                forceValidate: () => forceValidate(),
                checkValidity: () => checkValidity(),
                getValidationError: () => error,
                setCustomValidity: (message: string) => {
                    setError(message)
                    setShowError(true)
                    onValidityChange?.(false)
                },
                markAsTouched: () => {
                    setIsTouched(true)
                    onMarkAsTouched?.()
                    validateSelect(true, true)
                },
                clearError: () => {
                    setError(null)
                    setShowError(false)
                    onValidityChange?.(true)
                },
                reset: () => {
                    setError(null)
                    setShowError(false)
                    setIsTouched(false)
                    onReset?.()
                },
                value: value || '',
                name: name || '',
                id: id || '',
                required: required || false,
                isTouched: isTouched,
                showError: showError
            }

            // 将方法附加到 select 元素
            if (selectRef.current) {
                Object.assign(selectRef.current, proxyMethods)
                console.log('方法附加到 ValidatedSelect 元素:', name, 'required:', required)
            }

            // 注册到表单验证器
            registerInput({ current: selectRef.current })

            return () => {
                console.log('ValidatedSelect 注销:', name)
                unregisterInput({ current: selectRef.current })
            }
        }, [
            registerInput, unregisterInput, validateOnSubmit, name, required,
            errorMessage, id, value, error, isTouched, showError, onValidityChange,
            onMarkAsTouched, onReset, validateSelect, forceValidate, checkValidity
        ])

        const handleValueChange = (newValue: string) => {
            // 更新 data-value 属性
            if (selectRef.current) {
                selectRef.current.setAttribute('data-value', newValue)
            }

            // 标记为已触摸（当用户选择值时）
            if (!isTouched && newValue) {
                setIsTouched(true)
            }

            onValueChange?.(newValue)

            // 值改变时进行验证
            if (isTouched) {
                validateSelect(true, true)
            }
        }

        // 处理 blur 事件
        const handleBlur = () => {
            if (!isTouched) {
                setIsTouched(true)
                onMarkAsTouched?.()
                validateSelect(true, true)
            }
        }

        // 合并 ref
        useImperativeHandle(ref, () => {
            const selectElement = selectRef.current

            if (!selectElement) {
                return null as any
            }

            // 创建方法对象
            const methods = {
                validate: () => validateSelect(true),
                forceValidate: () => forceValidate(),
                checkValidity: () => checkValidity(),
                getValidationError: () => error,
                setCustomValidity: (message: string) => {
                    setError(message)
                    setShowError(true)
                    onValidityChange?.(false)
                },
                markAsTouched: () => {
                    setIsTouched(true)
                    onMarkAsTouched?.()
                    validateSelect(true, true)
                },
                clearError: () => {
                    setError(null)
                    setShowError(false)
                    onValidityChange?.(true)
                },
                reset: () => {
                    setError(null)
                    setShowError(false)
                    setIsTouched(false)
                    onReset?.()
                },
                // 添加动态属性
                get required() {
                    return required || false
                },
                get value() {
                    return value || ''
                }
            }

            // 合并到 select 元素
            Object.assign(selectElement, methods)

            return selectElement
        }, [
            value, error, isTouched, showError, onMarkAsTouched, onReset,
            onValidityChange, validateSelect, forceValidate, checkValidity, required
        ])

        // 验证状态回调
        useEffect(() => {
            onValidityChange?.(!error)
        }, [error, onValidityChange])

        // 当 required 改变时，重新验证状态
        useEffect(() => {
            if (isTouched) {
                validateSelect(true, true)
            } else {
                validateSelect(false, false)
            }
        }, [required])

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
                            (error && showError) && "border-red-500 focus-visible:ring-red-500"
                        )}
                        name={name}
                        id={id}
                        data-value={value || ''}
                        onBlur={handleBlur}
                    >
                        <SelectValue placeholder={placeholder}/>
                    </SelectTrigger>
                    {children}
                </Select>
                {error && showError && (
                    <div className="absolute top-full left-0 w-full z-10">
                        <p className="mt-1 text-xs text-red-500 bg-red-50 px-2 py-1 rounded-md border border-red-200 shadow-sm">
                            {error}
                        </p>
                    </div>
                )}
            </div>
        )
    }
)

ValidatedSelect.displayName = 'ValidatedSelect'

// 重新导出 Select 子组件
export {
    SelectContent as ValidatedSelectContent,
    SelectItem as ValidatedSelectItem,
}