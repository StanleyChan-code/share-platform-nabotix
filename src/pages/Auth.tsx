import {useState, useEffect, useRef} from "react";
import {useNavigate, useSearchParams} from "react-router-dom";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import LoginTab from "@/components/auth/LoginTab";
import SignupTab from "@/components/auth/SignupTab";
import {Database, Shield} from "lucide-react";
import {Navigation} from "@/components/Navigation.tsx";
import RcImageComponent from "@/components/ui/RcImageComponent.tsx";

const Auth = () => {
    const [phone, setPhone] = useState("");
    const [activeTab, setActiveTab] = useState("login");
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    
    // 在组件加载时，如果当前没有记录的重定向路径，则记录当前访问路径
    useEffect(() => {
        const currentPath = window.location.pathname;
        const existingRedirectPath = sessionStorage.getItem('redirectAfterLogin');
        
        // 如果没有已存在的重定向路径，且当前路径不是auth页面，则记录当前路径
        if (!existingRedirectPath && currentPath !== '/auth') {
            sessionStorage.setItem('redirectAfterLogin', currentPath);
        }
    }, []);

    const handleLoginSuccess = () => {
        // 登录成功后的处理已在LoginTab组件中完成，这里可以添加额外的逻辑
    };

    const handleSignupSuccess = () => {
        // 注册成功后切换到登录标签页
        setActiveTab("login");
    };

    return (

        <div className="min-h-screen bg-background">
            <Navigation/>
            <div className="bg-gradient-to-br from-background to-muted flex items-center justify-center p-4" style={{minHeight: 'calc(100vh - 64px)'}}>
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <div className="flex justify-center mb-1">
                            <RcImageComponent
                                src="/logo.jpeg"
                                alt="老年疾病国家临床医学研究中心（华西）"
                                className="h-24 w-24"
                            />
                        </div>
                        <CardTitle className="text-2xl">临床科研数据共享平台</CardTitle>
                        <CardDescription>
                            老年疾病国家临床医学研究中心（华西）
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="login">登录</TabsTrigger>
                                <TabsTrigger value="signup">注册</TabsTrigger>
                            </TabsList>

                            <TabsContent value="login">
                                <LoginTab
                                    phone={phone}
                                    setPhone={setPhone}
                                    onLoginSuccess={handleLoginSuccess}
                                />
                            </TabsContent>

                            <TabsContent value="signup">
                                <SignupTab
                                    phone={phone}
                                    setPhone={setPhone}
                                    onSignupSuccess={handleSignupSuccess}
                                />
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default Auth;