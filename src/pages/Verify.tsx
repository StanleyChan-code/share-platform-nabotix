import {useEffect, useState} from "react";
import {useNavigate, useSearchParams} from "react-router-dom";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {useToast} from "@/hooks/use-toast";
import {supabase} from "@/integrations/supabase/client";
import {Shield, Lock} from "lucide-react";

const Verify = () => {
    const [searchParams] = useSearchParams();
    const [loading, setLoading] = useState(true);
    const [verificationStatus, setVerificationStatus] = useState<"verifying" | "success" | "error">("verifying");
    const [showResetPassword, setShowResetPassword] = useState(false);
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [resetLoading, setResetLoading] = useState(false);
    const {toast} = useToast();
    const navigate = useNavigate();

    useEffect(() => {
        const verifyEmail = async () => {
            // Get parameters from URL
            const token_hash = searchParams.get("token");
            const type = searchParams.get("type");
            const next = searchParams.get("next") || '/profile';

            try {
                // Handle the verification based on the type parameter
                if (type && token_hash) {
                    let result;

                    switch (type) {
                        case 'signup':
                        case 'invite':
                        case 'recovery':
                        case 'email_change':
                        case 'email':
                            result = await supabase.auth.verifyOtp({token_hash, type});
                            break;
                        default:
                            // Default to email verification
                            result = await supabase.auth.verifyOtp({token_hash, type: 'email'});
                    }

                    const {error, data} = result;


                    if (error) {
                        throw error;
                    }

                    // If this is a signup verification, create the user profile in public.users
                    if (type === 'signup' && data.user) {
                        const user = data.user;

                        // Check if user already exists in public.users
                        const {data: existingUser} = await supabase
                            .from('users')
                            .select('id')
                            .eq('id', user.id)
                            .single();

                        if (existingUser) {
                            // Check if this user is associated with an institution
                            // If so, verify the institution automatically
                            // First check if the user has an institution_id
                            const {data: userData, error: userError} = await supabase
                                .from('users')
                                .select('institution_id')
                                .eq('id', user.id)
                                .single();
                            console.log("userData result:", userData)

                            if (userData && !userError && userData.institution_id) {
                                // Update the institution to verified
                                const {error: updateError} = await supabase
                                    .from('institutions')
                                    .update({verified: true})
                                    .eq('id', userData.institution_id);

                                if (!updateError) {
                                    toast({
                                        title: "机构验证成功",
                                        description: "关联的机构已自动验证通过。",
                                    });
                                } else {
                                    console.error('Error verifying institution:', updateError);
                                    toast({
                                        title: "机构验证失败",
                                        description: `关联的机构验证出现问题`,
                                        variant: "destructive",
                                    });
                                }
                            }
                        } else {
                            console.log("Creating user profile...",  user)
                            const user_metadata = user.user_metadata;

                            // Create the user profile in public.users
                            const {error: createError} = await supabase
                                .from('users')
                                .insert({
                                    id: user.id,
                                    username: user_metadata.real_name,
                                    real_name: user_metadata.real_name,
                                    email: user.email,
                                });

                            if (createError) {
                                throw createError;
                            }
                        }
                    }


                    setVerificationStatus("success");

                    // Show appropriate message based on type
                    switch (type) {
                        case 'signup':
                            toast({
                                title: "注册成功",
                                description: "您的账户已成功创建并验证！",
                            });
                            break;
                        case 'recovery':
                            // For recovery, show password reset form
                            setShowResetPassword(true);
                            setLoading(false);
                            return;
                        case 'email_change':
                            toast({
                                title: "邮箱变更",
                                description: "您的邮箱地址已更新。",
                            });
                            break;
                        default:
                            toast({
                                title: "验证成功",
                                description: "您的邮箱已成功验证！",
                            });
                    }

                    // Redirect after successful verification (except for recovery)
                    if (type !== 'recovery') {
                        setTimeout(() => {
                            navigate(next);
                        }, 2000);
                    }
                } else {
                    // If no token_hash or type, show error
                    setVerificationStatus("error");
                    toast({
                        title: "验证失败",
                        description: "无效的验证链接。",
                        variant: "destructive",
                    });
                }
            } catch (error: any) {
                console.error("Verification error:", error);
                setVerificationStatus("error");
                toast({
                    title: "验证失败",
                    description: error.message || "验证过程中发生错误，请重试。",
                    variant: "destructive",
                });
            } finally {
                if (!showResetPassword) {
                    setLoading(false);
                }
            }
        };

        verifyEmail();
    }, [searchParams, toast, navigate]);

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (newPassword.length < 6) {
            toast({
                title: "密码太短",
                description: "密码长度至少为6位。",
                variant: "destructive",
            });
            return;
        }

        if (newPassword !== confirmPassword) {
            toast({
                title: "密码不匹配",
                description: "两次输入的密码不一致。",
                variant: "destructive",
            });
            return;
        }

        setResetLoading(true);

        try {
            const {error} = await supabase.auth.updateUser({
                password: newPassword
            });

            if (error) throw error;

            toast({
                title: "密码重置成功",
                description: "您的密码已成功更新。",
            });

            // Redirect to profile page after successful password reset
            setTimeout(() => {
                navigate('/profile');
            }, 2000);
        } catch (error: any) {
            console.error("Password reset error:", error);
            toast({
                title: "密码重置失败",
                description: error.message || "重置密码时发生错误，请重试。",
                variant: "destructive",
            });
        } finally {
            setResetLoading(false);
        }
    };

    const handleRedirect = () => {
        navigate("/auth");
    };

    // Show password reset form if needed
    if (showResetPassword) {
        return (
            <div
                className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <div className="flex justify-center mb-4">
                            <Shield className="h-12 w-12 text-primary"/>
                        </div>
                        <CardTitle className="text-2xl">重置密码</CardTitle>
                        <CardDescription>
                            请输入您的新密码
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleResetPassword} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="new-password">新密码</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground"/>
                                    <Input
                                        id="new-password"
                                        type="password"
                                        placeholder="请输入新密码（至少6位）"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="pl-10"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirm-password">确认密码</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground"/>
                                    <Input
                                        id="confirm-password"
                                        type="password"
                                        placeholder="请再次输入新密码"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="pl-10"
                                        required
                                    />
                                </div>
                            </div>
                            <Button type="submit" className="w-full" disabled={resetLoading}>
                                {resetLoading ? "重置中..." : "重置密码"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="flex justify-center mb-4">
                        <Shield className="h-12 w-12 text-primary"/>
                    </div>
                    <CardTitle className="text-2xl">
                        {loading ? "正在验证..." :
                            verificationStatus === "success" ? "验证成功" :
                                "验证失败"}
                    </CardTitle>
                    <CardDescription>
                        {loading ? "正在处理您的验证请求..." :
                            verificationStatus === "success" ? "您的操作已成功完成" :
                                "验证过程中发生错误"}
                    </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                    {loading ? (
                        <div className="flex flex-col items-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                            <p>正在处理您的请求，请稍候...</p>
                        </div>
                    ) : verificationStatus === "success" ? (
                        <div className="space-y-4">
                            <div className="text-green-500 text-5xl mb-4">✓</div>
                            <p>恭喜！您的操作已完成。</p>
                            <p>页面将自动跳转...</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="text-red-500 text-5xl mb-4">✗</div>
                            <p>抱歉，验证失败。请检查链接是否正确或重新发送验证邮件。</p>
                            <Button onClick={handleRedirect} variant="outline" className="w-full">
                                返回登录页面
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default Verify;