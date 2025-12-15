import {useState, useEffect} from "react";
import {Link, useLocation, useNavigate} from "react-router-dom";
import {Button} from "@/components/ui/button";
import {Sheet, SheetContent, SheetTrigger} from "@/components/ui/sheet";
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger} from "@/components/ui/dropdown-menu";
import {Menu, Database, FileText, Upload, BarChart3, Info, User, Shield, LogOut} from "lucide-react";
import {useToast} from "@/hooks/use-toast";
import {logout, getCurrentUser, getCurrentUserRoles} from "@/integrations/api/authApi.ts";

const navigationItems = [
    {name: "首页", name_en: "Home", href: "/", icon: BarChart3},
    {name: "数据集", name_en: "Datasets", href: "/datasets", icon: Database},
    {name: "申请", name_en: "Apply", href: "/apply", icon: FileText},
    {name: "成果", name_en: "Outputs", href: "/outputs", icon: Upload},
    {name: "关于", name_en: "About", href: "/about", icon: Info},
    {name: "个人中心", name_en: "My Center", href: "/profile", icon: User},
    {name: "管理", name_en: "Admin", href: "/admin", icon: Shield, adminOnly: true},
];

export function Navigation() {
    const location = useLocation();
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [user, setUser] = useState<any | null>(null);
    const [session, setSession] = useState<any | null>(null);
    const [userProfile, setUserProfile] = useState<any>(null);
    const [userRoles, setUserRoles] = useState<string[]>([]);
    const {toast} = useToast();

    useEffect(() => {
        // 检查现有会话
        const token = localStorage.getItem('authToken');
        if (token) {
            // 获取用户信息和角色
            fetchUserInfoAndRoles()
                .catch(error => {
                    console.error("Failed to fetch user info and roles:", error);
                });
        }
    }, []);

    const fetchUserInfoAndRoles = async () => {
        try {
            // 获取用户信息
            const userResponse = await getCurrentUser();
            if (userResponse.data.success) {
                const userData = userResponse.data.data;
                setUser({id: userData.id, email: userData.email});
                setUserProfile(userData);
                setSession({token: localStorage.getItem('authToken')});
            }

            // 获取用户角色
            const rolesResponse = await getCurrentUserRoles();
            if (rolesResponse.data.success) {
                setUserRoles(rolesResponse.data.data);
            }
        } catch (error) {
            console.error("Failed to fetch user info or roles:", error);
            // Token可能已过期，清除它
            localStorage.removeItem('authToken');
            setUser(null);
            setSession(null);
            setUserRoles([]);
        }
    };

    const handleLogout = async () => {
        try {
            await logout();
            setUser(null);
            setSession(null);
            setUserProfile(null);
            setUserRoles([]);
            toast({
                title: "已登出",
                description: "您已成功登出。",
            });
            navigate('/auth');
        } catch (error) {
            toast({
                title: "错误",
                description: "登出过程中发生错误。",
                variant: "destructive",
            });
        }
    };

    const getAdminHref = () => {
        if (userRoles.includes('institution_supervisor')) {
            return "/institution-dashboard";
        }
        return "/admin";
    };

    const NavItems = ({mobile = false}) => (
        <>
            {navigationItems
                .filter((item) => !item.adminOnly || user) // Show admin link only if user is logged in
                .map((item) => {
                    const Icon = item.icon;
                    let href = item.href;
                    // 如果是管理链接且用户已登录，根据角色确定跳转地址
                    if (item.href === "/admin" && user) {
                        href = getAdminHref();
                    }
                    const isActive = location.pathname === item.href ||
                        (item.href === "/admin" && location.pathname === "/institution-dashboard");

                    return (
                        <Link
                            key={item.href}
                            to={href}
                            onClick={() => mobile && setIsOpen(false)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                                isActive
                                    ? "bg-primary text-primary-foreground"
                                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                            } ${mobile ? "justify-start" : ""}`}
                        >
                            <Icon className="h-4 w-4"/>
                            <span className={mobile ? "block" : "hidden md:block"}>
              {item.name}
            </span>
                        </Link>
                    );
                })}
        </>
    );

    return (
        <header
            className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-14 items-center">
                <div className="mr-4 flex">
                    <Link to="/" className="mr-6 flex items-center space-x-2">
                        <Database className="h-6 w-6 text-primary"/>
                        <span className="hidden font-bold sm:inline-block">
              Nabotix Platform
            </span>
                    </Link>
                </div>

                {/* Desktop Navigation */}
                <nav className="hidden md:flex items-center space-x-1 flex-1">
                    <NavItems/>
                </nav>

                <div className="flex items-center space-x-2">
                    {/* Auth Section */}
                    {user ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="flex items-center gap-2">
                                    <User className="h-4 w-4"/>
                                    <span className="hidden sm:inline">{userProfile?.username || user.email}</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => navigate('/profile')}>
                                    <User className="h-4 w-4 mr-2"/>
                                    个人资料
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={handleLogout}>
                                    <LogOut className="h-4 w-4 mr-2"/>
                                    登出
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                        <Button asChild variant="ghost" size="sm">
                            <Link to="/auth">登录</Link>
                        </Button>
                    )}

                    {/* Mobile Navigation */}
                    <Sheet open={isOpen} onOpenChange={setIsOpen}>
                        <SheetTrigger asChild>
                            <Button
                                variant="ghost"
                                className="md:hidden"
                                size="icon"
                            >
                                <Menu className="h-5 w-5"/>
                                <span className="sr-only">Toggle menu</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="pr-0">
                            <Link
                                to="/"
                                className="flex items-center space-x-2 mb-6"
                                onClick={() => setIsOpen(false)}
                            >
                                <Database className="h-6 w-6 text-primary"/>
                                <span className="font-bold">Nabotix Platform</span>
                            </Link>
                            <nav className="flex flex-col space-y-1">
                                <NavItems mobile/>
                            </nav>

                            {/* Mobile Auth Section */}
                            <div className="mt-6 pt-6 border-t">
                                {user ? (
                                    <div className="space-y-2">
                                        <div
                                            className="text-sm text-muted-foreground px-3">{userProfile?.username || user.email}</div>
                                        <Button variant="outline" onClick={handleLogout} className="w-full">
                                            <LogOut className="h-4 w-4 mr-2"/>
                                            登出
                                        </Button>
                                    </div>
                                ) : (
                                    <Button asChild className="w-full">
                                        <Link to="/auth" onClick={() => setIsOpen(false)}>登录</Link>
                                    </Button>
                                )}
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>
        </header>
    );
}