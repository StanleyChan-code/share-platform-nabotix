import React, { createContext, useContext, ReactNode, useRef, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface FormValidatorContextType {
  registerInput: (inputRef: React.RefObject<any>) => void;
  unregisterInput: (inputRef: React.RefObject<any>) => void;
  registerPasswordPair: (passwordRef: React.RefObject<any>, confirmPasswordRef: React.RefObject<any>) => void;
  validateField: (inputRef: React.RefObject<any>) => boolean;
}

const FormValidatorContext = createContext<FormValidatorContextType | undefined>(undefined);

interface FormValidatorProps {
  children: ReactNode;
  onSubmit?: (e: React.FormEvent) => void;
  className?: string;
  // 新增：提交时是否显示所有错误
  showAllErrorsOnSubmit?: boolean;
}

export const FormValidator: React.FC<FormValidatorProps> = ({
                                                              children,
                                                              onSubmit,
                                                              className,
                                                              showAllErrorsOnSubmit = false
                                                            }) => {
  const inputRefs = useRef<React.RefObject<any>[]>([]);
  const passwordPairs = useRef<Array<{password: React.RefObject<any>, confirmPassword: React.RefObject<any>}>>([]);
  const { toast } = useToast();

  const registerInput = useCallback((inputRef: React.RefObject<any>) => {
    if (inputRef && !inputRefs.current.includes(inputRef)) {
      inputRefs.current.push(inputRef);
    }
  }, []);

  const unregisterInput = useCallback((inputRef: React.RefObject<any>) => {
    inputRefs.current = inputRefs.current.filter(ref => ref !== inputRef);
  }, []);

  const registerPasswordPair = useCallback((passwordRef: React.RefObject<any>, confirmPasswordRef: React.RefObject<any>) => {
    if (passwordRef && confirmPasswordRef) {
      passwordPairs.current.push({ password: passwordRef, confirmPassword: confirmPasswordRef });
    }
  }, []);

  const validateField = useCallback((inputRef: React.RefObject<any>): boolean => {
    if (inputRef.current && typeof inputRef.current.validate === 'function') {
      return inputRef.current.validate();
    }
    return true;
  }, []);

  const validateAllInputs = useCallback((): boolean => {
    let allValid = true;
    const errors: string[] = [];

    // 验证所有输入框
    inputRefs.current.forEach((inputRef) => {
      if (inputRef.current) {
        // 标记为已触摸
        if (inputRef.current.markAsTouched) {
          inputRef.current.markAsTouched();
        }

        const isValid = validateField(inputRef);
        if (!isValid) {
          allValid = false;
          const errorMessage = inputRef.current.getValidationError?.();
          if (errorMessage) {
            errors.push(errorMessage);
          }
        }
      }
    });

    // 验证密码确认对
    passwordPairs.current.forEach((pair) => {
      if (pair.password.current && pair.confirmPassword.current) {
        const passwordValue = pair.password.current.value;
        const confirmPasswordValue = pair.confirmPassword.current.value;

        if (passwordValue !== confirmPasswordValue && passwordValue) {
          allValid = false;
          errors.push("两次输入的密码不一致");

          // 设置确认密码字段的错误
          if (pair.confirmPassword.current.setCustomValidity) {
            pair.confirmPassword.current.setCustomValidity("两次输入的密码不一致");
          }
        } else {
          // 清除错误
          if (pair.confirmPassword.current.setCustomValidity) {
            pair.confirmPassword.current.setCustomValidity("");
          }
        }
      }
    });

    // 显示错误信息
    if (!allValid && errors.length > 0) {
      if (showAllErrorsOnSubmit) {
        toast({
          title: "表单验证失败",
          description: (
              <ul className="list-disc list-inside">
                {errors.slice(0, 3).map((error, index) => (
                    <li key={index}>{error}</li>
                ))}
                {errors.length > 3 && <li>... 还有 {errors.length - 3} 个错误</li>}
              </ul>
          ),
          variant: "destructive",
        });
      } else {
        // 只显示第一个错误
        toast({
          title: "输入验证失败",
          description: errors[0],
          variant: "destructive",
        });
      }
    }

    return allValid;
  }, [validateField, showAllErrorsOnSubmit, toast]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateAllInputs()) {
      onSubmit?.(e);
    }
  };

  const contextValue: FormValidatorContextType = {
    registerInput,
    unregisterInput,
    registerPasswordPair,
    validateField
  };

  return (
      <form onSubmit={handleSubmit} className={className} noValidate>
        <FormValidatorContext.Provider value={contextValue}>
          {children}
        </FormValidatorContext.Provider>
      </form>
  );
};

export const useFormValidator = () => {
  const context = useContext(FormValidatorContext);
  if (context === undefined) {
    throw new Error('useFormValidator must be used within a FormValidator');
  }
  return context;
};

// InputWrapper组件
interface InputWrapperProps {
  children: React.ReactElement;
  required?: boolean;
  validationType?: 'phone' | 'email' | 'idNumber' | 'numeric' | 'alphanumeric' | 'verificationCode' | 'password' | 'custom';
  isPasswordConfirm?: boolean;
  passwordRef?: React.RefObject<any>;
  // 新增：自定义验证规则
  customValidation?: (value: string) => boolean | string;
  // 新增：是否在提交时验证
  validateOnSubmit?: boolean;
}

export const InputWrapper: React.FC<InputWrapperProps> = ({
                                                            children,
                                                            required,
                                                            validationType,
                                                            isPasswordConfirm = false,
                                                            passwordRef,
                                                            customValidation,
                                                            validateOnSubmit = true
                                                          }) => {
  const inputRef = useRef<any>(null);
  const { registerInput, unregisterInput, registerPasswordPair } = useFormValidator();

  React.useEffect(() => {
    if (inputRef.current) {
      registerInput(inputRef);

      if (isPasswordConfirm && passwordRef) {
        registerPasswordPair(passwordRef, inputRef);
      }
    }

    return () => {
      if (inputRef.current) {
        unregisterInput(inputRef);
      }
    };
  }, [registerInput, unregisterInput, registerPasswordPair, isPasswordConfirm, passwordRef]);

  // 增强子组件的props
  const enhancedProps: any = {
    ref: inputRef,
    required: required ?? children.props.required,
    validationType: validationType ?? children.props.validationType,
    validateOnSubmit: validateOnSubmit ?? children.props.validateOnSubmit,
  };

  // 只有提供了customValidation才传递
  if (customValidation) {
    enhancedProps.customValidation = customValidation;
  }

  return React.cloneElement(children, enhancedProps);
};