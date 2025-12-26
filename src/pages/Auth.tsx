import {useState, useEffect, useRef} from "react";
import {useNavigate, useSearchParams} from "react-router-dom";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import LoginTab from "@/components/auth/LoginTab";
import SignupTab from "@/components/auth/SignupTab";
import {Database, Shield} from "lucide-react";
import {Navigation} from "@/components/Navigation.tsx";

const Auth = () => {
    const [phone, setPhone] = useState("");
    const [activeTab, setActiveTab] = useState("login");
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

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
                        <div className="flex justify-center mb-4">
                            <Database className="h-12 w-12 text-primary"/>
                        </div>
                        <CardTitle className="text-2xl">临床研究数据共享平台</CardTitle>
                        <CardDescription>
                            欢迎使用
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