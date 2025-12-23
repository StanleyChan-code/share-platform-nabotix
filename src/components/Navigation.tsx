import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
    Menu,
    Database,
    FileText,
    BarChart3,
    Info,
    User,
    Shield,
    LogOut,
    Home,
    Award,
    ChevronDown,
    X,
    Building2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { logout, getCurrentUser, getCurrentUserRoles } from "@/integrations/api/authApi.ts";
import { institutionApi } from "@/integrations/api/institutionApi.ts";
import { getCurrentUserInfo } from "@/lib/authUtils.ts";
import { getPermissionRoleDisplayName, PermissionRoles } from "@/lib/permissionUtils.ts";

// 只有这些角色的用户才能看到管理入口
const ADMIN_ROLES: string[] = [
    PermissionRoles.PLATFORM_ADMIN,
    PermissionRoles.INSTITUTION_SUPERVISOR,
    PermissionRoles.INSTITUTION_USER_MANAGER,
    PermissionRoles.DATASET_APPROVER,
    PermissionRoles.DATASET_UPLOADER,
    PermissionRoles.RESEARCH_OUTPUT_APPROVER
];

const navigationItems = [
    { name: "首页", name_en: "Home", href: "/", icon: Home, description: "平台概览" },
    { name: "数据集", name_en: "Datasets", href: "/datasets", icon: Database, description: "浏览数据集" },
    { name: "研究成果", name_en: "Outputs", href: "/outputs", icon: Award, description: "查看成果" },
    { name: "关于平台", name_en: "About", href: "/about", icon: Info, description: "了解平台" },
    { name: "个人中心", name_en: "My Center", href: "/profile", icon: User, description: "个人管理" },
    { name: "管理面板", name_en: "Admin", href: "/admin", icon: Shield, description: "系统管理", adminOnly: true },
];

export function Navigation() {
    const location = useLocation();
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [user, setUser] = useState<any | null>(null);
    const [session, setSession] = useState<any | null>(null);
    const [userProfile, setUserProfile] = useState<any>(null);
    const [userRoles, setUserRoles] = useState<string[]>([]);
    const { toast } = useToast();

    useEffect(() => {
        // 检查现有会话
        const userInfo = getCurrentUserInfo();

        if (userInfo) {
            // 从sessionStorage中获取用户信息
            try {
                setUser({ id: userInfo.user.id, email: userInfo.user.email });
                setUserProfile(userInfo);
                setUserRoles(userInfo.roles);
                setSession({ token: localStorage.getItem('authToken') });
            } catch (error) {
                console.error("Failed to parse user info from sessionStorage:", error);
                // 如果解析失败，清除token并跳转到登录页
                localStorage.removeItem('authToken');
                sessionStorage.removeItem('userInfo');
                navigate('/auth');
            }
        } else {
            const token = localStorage.getItem('authToken');
            if (token) {
                // 有token但没有用户信息，从API获取
                fetchUserInfoAndRoles()
                    .catch(error => {
                        console.error("Failed to fetch user info and roles:", error);
                        // 如果获取失败，清除token并跳转到登录页
                        localStorage.removeItem('authToken');
                        sessionStorage.removeItem('userInfo');
                        navigate('/auth');
                    });
            }
        }
    }, []);

    const fetchUserInfoAndRoles = async () => {
        try {
            // 获取用户信息
            const userResponse = await getCurrentUser();
            if (userResponse.data.success) {
                const userData = userResponse.data.data;
                setUser({ id: userData.id, email: userData.email });
                setUserProfile(userData);
                setSession({ token: localStorage.getItem('authToken') });
            }

            // 获取用户角色
            const rolesResponse = await getCurrentUserRoles();
            if (rolesResponse.data.success) {
                setUserRoles(rolesResponse.data.data);
            }

            // 如果用户有机构ID，获取机构信息
            let institution = null;
            if (userResponse.data.data.institutionId) {
                try {
                    const institutionResponse = await institutionApi.getInstitutionById(userResponse.data.data.institutionId);
                    if (institutionResponse.success) {
                        institution = institutionResponse.data;
                    }
                } catch (error) {
                    console.warn("获取机构信息失败:", error);
                }
            }

            // 将用户信息、角色和机构信息存储到sessionStorage
            const userInfo = {
                user: userResponse.data.data,
                roles: rolesResponse.data.data,
                institution: institution
            };

            sessionStorage.setItem('userInfo', JSON.stringify(userInfo));
        } catch (error) {
            console.error("Failed to fetch user info or roles:", error);
            // Token可能已过期，清除它
            localStorage.removeItem('authToken');
            sessionStorage.removeItem('userInfo');
            setUser(null);
            setSession(null);
            setUserRoles([]);
            throw error;
        }
    };

    const handleLogout = async () => {
        try {
            await logout();
            setUser(null);
            setSession(null);
            setUserProfile(null);
            setUserRoles([]);
            // 清除sessionStorage中的用户信息
            sessionStorage.removeItem('userInfo');
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

    // 检查用户是否具有管理权限
    const hasAdminPermission = () => {
        return userRoles.some((role: string) => ADMIN_ROLES.includes(role));
    };

    const NavItems = ({ mobile = false }) => (
        <>
            {navigationItems
                .filter((item) => {
                    // 如果是管理项，则只对具有管理权限的用户显示
                    if (item.adminOnly) {
                        return user && hasAdminPermission();
                    }
                    return true;
                })
                .map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.href;

                    return (
                        <Link
                            key={item.href}
                            to={item.href}
                            onClick={() => mobile && setIsOpen(false)}
                            className={`group flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                                isActive
                                    ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg"
                                    : "text-muted-foreground hover:text-blue-700 hover:bg-blue-50/50"
                            } ${mobile ? "justify-start" : ""}`}
                        >
                            <Icon className={`h-5 w-5 ${isActive ? "text-white" : "text-current"}`} />
                            <div className="flex flex-col">
                                <span className="font-semibold">{item.name}</span>
                                {mobile && (
                                    <span className="text-xs opacity-70">{item.description}</span>
                                )}
                            </div>
                            {isActive && !mobile && (
                                <div className="ml-auto w-2 h-2 bg-white rounded-full"></div>
                            )}
                        </Link>
                    );
                })}
        </>
    );

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md supports-[backdrop-filter]:bg-white/60 shadow-sm">
            <div className="container flex h-16 items-center px-4">
                {/* Logo */}
                <div className="flex items-center gap-3">
                    <Link to="/" className="flex items-center space-x-3 group">
                        <div className="p-2 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                            <Database className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xl font-bold bg-gradient-to-r from-gray-900 to-blue-800 bg-clip-text text-transparent">
                                Nabotix Platform
                            </span>
                            <span className="text-xs text-muted-foreground -mt-1">临床研究数据平台</span>
                        </div>
                    </Link>
                </div>

                {/* Desktop Navigation */}
                <nav className="hidden lg:flex items-center space-x-1 flex-1 ml-8">
                    <NavItems />
                </nav>

                <div className="flex items-center space-x-3 ml-auto">
                    {/* Auth Section */}
                    {user ? (
                        <div className="flex items-center gap-3">
                            {/* 用户角色徽章 */}
                            <div className="hidden md:flex items-center gap-1">
                                {userRoles.slice(0, 2).map((role, index) => (
                                    <Badge
                                        key={index}
                                        variant="secondary"
                                        className="bg-blue-100 text-blue-800 hover:bg-blue-200 text-xs font-medium border-0"
                                    >
                                        {getPermissionRoleDisplayName(role)}
                                    </Badge>
                                ))}
                                {userRoles.length > 2 && (
                                    <Badge variant="outline" className="text-xs">
                                        +{userRoles.length - 2}
                                    </Badge>
                                )}
                            </div>

                            {/* 用户下拉菜单 */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-blue-50/50 transition-colors"
                                    >
                                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-sm">
                                            <User className="h-4 w-4 text-white" />
                                        </div>
                                        <div className="hidden sm:flex flex-col items-start">
                                            <span className="text-sm font-medium text-gray-900">
                                                {userProfile?.user?.realName || userProfile?.user?.username || '用户'}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                {userProfile?.institution?.fullName || '未设置机构'}
                                            </span>
                                        </div>
                                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                    align="end"
                                    className="w-64 border-blue-200/50 shadow-xl rounded-xl"
                                >
                                    {/* 用户信息头部 */}
                                    <div className="p-4 border-b border-blue-200/30">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-sm">
                                                <User className="h-6 w-6 text-white" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-gray-900 truncate">
                                                    {userProfile?.user?.realName || userProfile?.user?.username || '用户'}
                                                </p>
                                                <p className="text-sm text-muted-foreground truncate">
                                                    {userProfile?.user?.email}
                                                </p>
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                    {userRoles.slice(0, 2).map((role, index) => (
                                                        <Badge
                                                            key={index}
                                                            variant="secondary"
                                                            className="bg-blue-100 text-blue-800 text-xs"
                                                        >
                                                            {getPermissionRoleDisplayName(role)}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <DropdownMenuItem
                                        onClick={() => navigate('/profile')}
                                        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-blue-50/50"
                                    >
                                        <User className="h-4 w-4 text-blue-600" />
                                        <div>
                                            <span className="font-medium">个人资料</span>
                                            <p className="text-xs text-muted-foreground">查看和编辑个人信息</p>
                                        </div>
                                    </DropdownMenuItem>

                                    <DropdownMenuItem
                                        onClick={handleLogout}
                                        className="flex items-center gap-3 px-4 py-3 cursor-pointer text-red-600 hover:bg-red-50/50"
                                    >
                                        <LogOut className="h-4 w-4" />
                                        <div>
                                            <span className="font-medium">退出登录</span>
                                            <p className="text-xs text-muted-foreground">安全退出系统</p>
                                        </div>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    ) : (
                        location.pathname !== '/auth' && (
                            <Button
                                asChild
                                variant="default"
                                size="sm"
                                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                            >
                                <Link to="/auth" className="flex items-center gap-2">
                                    <User className="h-4 w-4" />
                                    <span>登录系统</span>
                                </Link>
                            </Button>
                        )
                    )}

                    {/* Mobile Navigation Trigger */}
                    <Sheet open={isOpen} onOpenChange={setIsOpen}>
                        <SheetTrigger asChild>
                            <Button
                                variant="ghost"
                                className="lg:hidden p-2 rounded-xl hover:bg-blue-50/50"
                                size="icon"
                            >
                                {isOpen ? (
                                    <X className="h-5 w-5" />
                                ) : (
                                    <Menu className="h-5 w-5" />
                                )}
                                <span className="sr-only">切换菜单</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent
                            side="right"
                            className="w-80 pr-0 border-l-blue-200/50 bg-white/95 backdrop-blur-md"
                        >
                            <div className="flex flex-col h-full">
                                {/* Header */}
                                <div className="p-6 border-b border-blue-200/30">
                                    <Link
                                        to="/"
                                        className="flex items-center space-x-3 group"
                                        onClick={() => setIsOpen(false)}
                                    >
                                        <div className="p-2 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl shadow-lg">
                                            <Database className="h-6 w-6 text-white" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-lg font-bold bg-gradient-to-r from-gray-900 to-blue-800 bg-clip-text text-transparent">
                                                Nabotix Platform
                                            </span>
                                            <span className="text-xs text-muted-foreground -mt-1">临床研究数据平台</span>
                                        </div>
                                    </Link>
                                </div>

                                {/* Navigation Items */}
                                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                                    <NavItems mobile />
                                </nav>

                                {/* User Section */}
                                <div className="p-4 border-t border-blue-200/30 bg-blue-50/30">
                                    {user ? (
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-3 p-3 bg-white/50 rounded-xl border border-blue-200/30">
                                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-sm">
                                                    <User className="h-5 w-5 text-white" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-semibold text-gray-900 text-sm truncate">
                                                        {userProfile?.user?.realName || userProfile?.user?.username || '用户'}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground truncate">
                                                        {userProfile?.institution?.fullName || '未设置机构'}
                                                    </p>
                                                </div>
                                            </div>
                                            <Button
                                                onClick={handleLogout}
                                                variant="outline"
                                                className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                                            >
                                                <LogOut className="h-4 w-4 mr-2" />
                                                退出登录
                                            </Button>
                                        </div>
                                    ) : (
                                        location.pathname !== '/auth' && (
                                            <Button
                                                asChild
                                                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg"
                                            >
                                                <Link to="/auth" onClick={() => setIsOpen(false)}>
                                                    <User className="h-4 w-4 mr-2" />
                                                    登录系统
                                                </Link>
                                            </Button>
                                        )
                                    )}
                                </div>
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>
        </header>
    );
}