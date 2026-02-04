import * as React from "react"
import { Button, ButtonProps } from "./button"
import { Loader2 } from "lucide-react"
import { useToast } from "./use-toast"
import { sendVerificationCode } from "@/integrations/api/authApi"
import { cn } from "@/lib/utils"

interface VerificationCodeButtonProps extends ButtonProps {
  phone: string
  businessType: string
  onSendSuccess?: () => void
  onSendError?: (error: Error) => void
  validatePhone?: (phone: string) => string
  countdownSeconds?: number
}

const VerificationCodeButton = React.forwardRef<HTMLButtonElement, VerificationCodeButtonProps>(
  ({
    phone,
    businessType,
    onSendSuccess,
    onSendError,
    validatePhone,
    countdownSeconds = 60,
    className,
    disabled: propsDisabled,
    ...props
  }, ref) => {
    const [countdown, setCountdown] = React.useState(0)
    const [isSending, setIsSending] = React.useState(false)
    const { toast } = useToast()

    // 定时器引用
    const timerRef = React.useRef<NodeJS.Timeout | null>(null)

    // 清理定时器
    React.useEffect(() => {
      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current)
        }
      }
    }, [])

    // 倒计时逻辑
    React.useEffect(() => {
      if (countdown <= 0) {
        if (timerRef.current) {
          clearInterval(timerRef.current)
          timerRef.current = null
        }
        return
      }

      timerRef.current = setInterval(() => {
        setCountdown((prev) => prev - 1)
      }, 1000)

      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current)
        }
      }
    }, [countdown])

    // 验证手机号
    const validatePhoneNumber = (): boolean => {
      if (!phone) {
        toast({
          title: "手机号不能为空",
          variant: "destructive",
        })
        return false
      }

      // 使用自定义验证函数
      if (validatePhone) {
        const error = validatePhone(phone)
        if (error) {
          toast({
            title: "手机号格式错误",
            description: error,
            variant: "destructive",
          })
          return false
        }
      } else {
        // 默认手机号验证规则
        const phoneRegex = /^1[3-9]\d{9}$/
        if (!phoneRegex.test(phone)) {
          toast({
            title: "手机号格式错误",
            description: "请输入有效的11位手机号码",
            variant: "destructive",
          })
          return false
        }
      }

      return true
    }

    // 发送验证码
    const handleSendCode = async () => {
      if (!validatePhoneNumber()) return
      if (countdown > 0) return

      setIsSending(true)
      try {
        await sendVerificationCode(phone, businessType)
        
        toast({
          title: "验证码已发送",
          description: "验证码已发送至您的手机，5分钟内有效",
        })
        
        // 开始倒计时
        setCountdown(countdownSeconds)
        
        // 调用成功回调
        if (onSendSuccess) {
          onSendSuccess()
        }
      } catch (error: any) {
        console.error("发送验证码失败:", error)
        
        const errorMessage = error.response?.data?.message || "发送验证码时发生错误"
        toast({
          title: "发送失败",
          description: errorMessage,
          variant: "destructive",
        })
        
        // 调用错误回调
        if (onSendError) {
          onSendError(error)
        }
      } finally {
        setIsSending(false)
      }
    }

    // 计算禁用状态
    const isDisabled = propsDisabled || isSending || countdown > 0

    return (
      <Button
        ref={ref}
        onClick={handleSendCode}
        disabled={isDisabled}
        className={cn(className)}
        {...props}
      >
        {isSending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-1" />
            发送中...
          </>
        ) : countdown > 0 ? (
          `${countdown}秒后重试`
        ) : (
          "发送验证码"
        )}
      </Button>
    )
  }
)

VerificationCodeButton.displayName = "VerificationCodeButton"

export { VerificationCodeButton }