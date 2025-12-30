import {useState, useEffect, useRef} from "react";
import {Link, useLocation, useNavigate} from "react-router-dom";
import {Button} from "@/components/ui/button";
import {Sheet, SheetContent, SheetTrigger} from "@/components/ui/sheet";
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger} from "@/components/ui/dropdown-menu";
import {Badge} from "@/components/ui/badge";
import {
    Menu,
    Database,
    Info,
    User,
    Shield,
    LogOut,
    Home,
    Award,
    ChevronDown,
    X,
    Phone,
    AlertCircle
} from "lucide-react";
import {useToast} from "@/hooks/use-toast";
import {logout} from "@/integrations/api/authApi";
import {
    clearTokens,
    getCurrentUserInfoFromSession,
    getOrFetchUserInfo,
    isAuthenticated,
} from "@/lib/authUtils";
import {getPermissionRoleDisplayName, PermissionRoles} from "@/lib/permissionUtils.ts";
import RcImageComponent from "./ui/RcImageComponent";
import {getTotalCount, pendingCountsController} from "@/lib/pendingCountsController";
import {AUTH_BROADCAST_CHANNEL, USER_INFO_KEY} from "@/lib/constants.ts";

const navigationItems = [
    {name: "首页", name_en: "Home", href: "/", icon: Home, description: "平台概览", authRequired: false},
    {name: "数据集", name_en: "Datasets", href: "/datasets", icon: Database, description: "浏览数据集", authRequired: false},
    {name: "研究成果", name_en: "Outputs", href: "/outputs", icon: Award, description: "查看成果", authRequired: false},
    {name: "关于平台", name_en: "About", href: "/about", icon: Info, description: "了解平台", authRequired: false},
    {name: "个人中心", name_en: "My Center", href: "/profile", icon: User, description: "个人管理", authRequired: true},
    {name: "管理面板", name_en: "Admin", href: "/admin", icon: Shield, description: "系统管理", authRequired: true, adminOnly: true},
];

// 需要认证的页面路径
const AUTH_REQUIRED_PATHS = ['/profile', '/admin'];

export function Navigation() {
    const location = useLocation();
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [user, setUser] = useState<any | null>(null);
    const [userProfile, setUserProfile] = useState<any>(null);
    const [userRoles, setUserRoles] = useState<string[]>([]);
    const [authChecking, setAuthChecking] = useState(true);
    // 添加待审核总数状态
    const [pendingTotalCount, setPendingTotalCount] = useState(getTotalCount());
    const {toast} = useToast();

    // mounted/ref guards to avoid state updates on unmounted components and reentrancy
    const mountedRef = useRef(true);
    const isCheckingRef = useRef(false);

    useEffect(() => {
        mountedRef.current = true;
        return () => { mountedRef.current = false; };
    }, []);

    // 创建全局导航函数
    useEffect(() => {
        (window as any).globalNavigate = (path: string) => {
            // 检查目标页面是否需要认证
            if (AUTH_REQUIRED_PATHS.includes(path) && !isAuthenticated()) {
                navigate('/auth', { state: { from: path } });
                return;
            }
            navigate(path);
        };

        return () => {
            (window as any).globalNavigate = null;
        };
    }, [navigate]);

    // 检查认证状态的函数
    const checkAuthStatus = async (forceRefresh = false) => {
        if (isCheckingRef.current) return;
        isCheckingRef.current = true;
        try {
            if (!mountedRef.current) return;
            setAuthChecking(true);

            // 检查token是否有效
            if (!isAuthenticated()) {
                clearAuthState();
                setAuthChecking(false);
                return;
            }

            // 如果有强制刷新标志或者localStorage中没有用户信息，重新获取
            if (forceRefresh || !getCurrentUserInfoFromSession()) {
                await fetchAndSetAuthStatus();
            } else {
                // 使用localStorage中的缓存信息
                const userInfo = getCurrentUserInfoFromSession();
                if (userInfo && mountedRef.current) {
                    setUserProfile(userInfo);
                    setUser(userInfo.user);
                    setUserRoles(userInfo.roles || []);
                }
            }
        } catch (error) {
            console.error('认证检查错误:', error);
            // 如果获取用户信息失败但token有效，可能是网络问题，保留token但清除用户信息
            if (isAuthenticated()) {
                // 只清除用户信息，保留token以便重试
                setUserProfile(null);
                setUser(null);
                setUserRoles([]);
                localStorage.removeItem(USER_INFO_KEY);
            } else {
                clearAuthState();
            }

            toast({
                title: "认证错误",
                description: "无法验证登录状态",
                variant: "destructive",
            });
        } finally {
            if (mountedRef.current) setAuthChecking(false);
            isCheckingRef.current = false;
        }
    };

    // 清除认证状态
    const clearAuthState = () => {
        setUserProfile(null);
        setUser(null);
        setUserRoles([]);
        localStorage.removeItem(USER_INFO_KEY);
        // 使用抑制事件的方式清除token，避免触发多个listener导致重复处理
        clearTokens(true);
        // 主动通知一次（在需要时）
        window.dispatchEvent(new CustomEvent('authStatusChanged', { detail: { isAuthenticated: false } }));
    };

    // 异步函数来获取用户信息
    const fetchAndSetAuthStatus = async () => {
        try {
            const userInfo = await getOrFetchUserInfo();
            if (userInfo && mountedRef.current) {
                setUserProfile(userInfo);
                setUser(userInfo.user);
                setUserRoles(userInfo.roles || []);

                // 如果当前在认证页面且成功获取用户信息，重定向到之前页面或首页
                if (location.pathname === '/auth') {
                    const from = (location.state as any)?.from || '/';
                    navigate(from, { replace: true });
                }
            } else if (mountedRef.current) {
                clearAuthState();
            }
        } catch (error) {
            console.error('获取用户信息错误:', error);
            // 如果是401错误，清除所有状态
            if (error.response?.status === 401) {
                clearAuthState();
            }
            throw error;
        }
    };

    useEffect(() => {
        // 初始检查认证状态
        checkAuthStatus();

        // 监听认证状态变化事件
        const handleAuthStatusChange = () => {
            checkAuthStatus();
        };

        // 监听storage变化（其他tab页登录/登出）
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'access_token' || e.key === 'refresh_token' || e.key === USER_INFO_KEY) {
                checkAuthStatus();
            }
        };

        // 监听网络状态变化
        const handleOnline = () => {
            // 网络恢复时重新检查认证状态
            if (isAuthenticated() && !user) {
                checkAuthStatus(true);
            }
        };

        // BroadcastChannel (跨标签页通知)
        const bc = (typeof window !== 'undefined' && (window as any).BroadcastChannel) ? new (window as any).BroadcastChannel(AUTH_BROADCAST_CHANNEL) : null;
        if (bc) {
            bc.onmessage = (_msg: any) => {
                checkAuthStatus();
            };
        }

        window.addEventListener('authStatusChanged', handleAuthStatusChange);
        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('online', handleOnline);

        return () => {
            window.removeEventListener('authStatusChanged', handleAuthStatusChange);
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('online', handleOnline);
            if (bc) {
                try { bc.close(); } catch (e) { /* ignore */ }
            }
        };
    }, []);

    // 监听待审核总数的刷新事件
    useEffect(() => {
        const handleRefreshCounts = () => {
            setPendingTotalCount(getTotalCount());
        };

        // 添加事件监听器
        pendingCountsController.addEventListener('refetchAllPendingCounts', handleRefreshCounts);

        // 初始化时获取总数
        setPendingTotalCount(getTotalCount());

        // 清理函数
        return () => {
            pendingCountsController.removeEventListener('refetchAllPendingCounts', handleRefreshCounts);
        };
    }, []);

    // 监听路径变化，检查是否需要重定向到登录页
    useEffect(() => {
        if (authChecking) return;

        const currentPath = location.pathname;

        // 如果访问需要认证的页面但未登录，重定向到登录页
        if (AUTH_REQUIRED_PATHS.includes(currentPath) && !isAuthenticated()) {
            navigate('/auth', {
                state: {
                    from: currentPath,
                    message: '请先登录以访问该页面'
                }
            });
            return;
        }

        // 如果已登录但访问登录页，重定向到首页或个人中心
        if (currentPath === '/auth' && isAuthenticated()) {
            const from = (location.state as any)?.from || '/profile';
            navigate(from, { replace: true });
            return;
        }

        // 检查访问权限
        if (AUTH_REQUIRED_PATHS.includes(currentPath) && isAuthenticated()) {
            const hasAccess = hasPageAccess(currentPath);
            if (!hasAccess) {
                toast({
                    title: "访问受限",
                    description: "您没有权限访问该页面",
                    variant: "destructive",
                });
                navigate(-1); // 返回上一页
            }
        }
    }, [location.pathname, authChecking, navigate, user]);

    const handleLogout = async () => {
        try {
            setIsOpen(false);
            await logout();
            toast({
                title: "已登出",
                description: "您已成功登出",
            });
        } catch (error) {
            console.error('登出API错误:', error);
            toast({
                title: "网络错误",
                description: "登出请求失败，但已清除本地登录状态",
                variant: "destructive",
            });
        } finally {
            clearAuthState();

            // 如果当前在需要认证的页面，重定向到首页
            if (AUTH_REQUIRED_PATHS.includes(location.pathname)) {
                navigate('/', { replace: true });
            }
        }
    };

    // 检查用户是否具有管理权限
    const hasAdminPermission = () => {
        return userRoles.some((role: string) =>
            Object.keys(PermissionRoles).includes(role)
        );
    };

    // 检查页面访问权限
    const hasPageAccess = (path: string) => {
        const item = navigationItems.find(nav => nav.href === path);
        if (!item) return true;

        // 不需要认证的页面对所有用户开放
        if (!item.authRequired) return true;

        // 需要认证但用户未登录，无访问权限
        if (!isAuthenticated()) return false;

        // 管理页面需要管理员权限；否则普通认证页面对所有登录用户开放
        return !item.adminOnly || hasAdminPermission();
    };

    // 处理导航点击
    const handleNavigation = (item: typeof navigationItems[0], mobile: boolean = false, e: React.MouseEvent) => {
        e.preventDefault();

        // 检查访问权限
        if (!hasPageAccess(item.href)) {
            if (!isAuthenticated()) {
                navigate('/auth', {
                    state: {
                        from: item.href,
                        message: `请先登录以访问${item.name}`
                    }
                });
            } else {
                toast({
                    title: "权限不足",
                    description: `您没有权限访问${item.name}`,
                    variant: "destructive",
                });
            }
            mobile && setIsOpen(false);
            return;
        }

        navigate(item.href);
        mobile && setIsOpen(false);
    };

    const hasPendingItems = pendingTotalCount > 0;

    const NavItems = ({mobile = false}) => (
        <>
            {navigationItems
                .filter((item) => {
                    // 移动端显示所有项目，但控制访问权限
                    if (mobile) return true;

                    // 桌面端隐藏无权限的项目（除了需要认证但未登录的页面）
                    if (item.authRequired && !isAuthenticated()) return false;

                    // 管理页需要管理员权限
                    if (item.adminOnly) return hasAdminPermission();

                    return true;
                })
                .map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.href;
                    const canAccess = hasPageAccess(item.href);
                    const requiresAuth = item.authRequired && !isAuthenticated();

                    // 检查是否是管理面板且有待审核项
                    const isAdminPanel = item.href === '/admin';
                    const showPendingBadge = isAdminPanel && hasPendingItems && canAccess;

                    return (
                        <Link
                            key={item.href}
                            to={canAccess ? item.href : '#'}
                            onClick={(e) => handleNavigation(item, mobile, e)}
                            className={`group flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 relative ${
                                !canAccess
                                    ? "text-gray-400 cursor-not-allowed opacity-50"
                                    : isActive
                                        ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg"
                                        : "text-muted-foreground hover:text-blue-700 hover:bg-blue-50/50"
                            } ${mobile ? "justify-start" : "justify-center"} min-w-0`}
                            title={!canAccess ?
                                (requiresAuth ? "请先登录" : "无权限") :
                                item.description
                            }
                        >
                            <div className="relative">
                                <Icon className={`h-5 w-5 ${isActive && canAccess ? "text-white" : "text-current"}`}/>
                            </div>

                            <div className="flex flex-col min-w-0 flex-1">
                                <span className={`font-semibold truncate ${mobile ? 'block' : 'hidden lg:block'}`}>
                                    {item.name}
                                </span>
                                {mobile && (
                                    <span className="text-xs opacity-70">
                                        {!canAccess ? (requiresAuth ? "请先登录" : "无权限") : item.description}
                                    </span>
                                )}
                            </div>

                            {!canAccess && mobile && (
                                <AlertCircle className="h-4 w-4 text-amber-500 ml-auto" />
                            )}
                            {isActive && !mobile && canAccess && (
                                <div className="ml-auto w-2 h-2 bg-white rounded-full"></div>
                            )}
                        </Link>
                    );
                })}
        </>
    );

    // 显示加载状态
    if (authChecking) {
        return (
            <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
                <div className="container flex h-16 items-center px-4">
                    <div className="flex items-center gap-3">
                        <div className="animate-pulse bg-gray-200 rounded-2xl h-10 w-10"></div>
                        <div className="flex flex-col gap-2">
                            <div className="animate-pulse bg-gray-200 rounded h-4 w-40"></div>
                            <div className="animate-pulse bg-gray-200 rounded h-3 w-32"></div>
                        </div>
                    </div>
                    <div className="ml-auto">
                        <div className="animate-pulse bg-gray-200 rounded-full h-8 w-24"></div>
                    </div>
                </div>
            </header>
        );
    }

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md supports-[backdrop-filter]:bg-white/60 shadow-sm">
            <div className="container flex h-16 items-center px-4">
                {/* Logo */}
                <div className="flex items-center gap-3 min-w-[230px]">
                    <Link to="/" className="flex items-center space-x-3 group">
                        <div className="p-1 bg-white rounded-2xl shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                            <RcImageComponent
                                src="/public/logo.jpeg"
                                alt="老年疾病国家临床医学研究中心（华西）"
                                className="h-9 w-9"
                            />
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-xl font-bold bg-gradient-to-r from-gray-900 to-blue-800 bg-clip-text text-transparent">
                                老年疾病国家临床医学研究中心（华西）
                            </span>
                            <span className="text-xs text-muted-foreground -mt-1 hidden md:block">临床科研数据共享平台</span>
                        </div>
                    </Link>
                </div>

                {/* Desktop Navigation */}
                <nav className="hidden lg:flex items-center space-x-1 flex-1">
                    <NavItems/>
                </nav>

                <div className="flex items-center space-x-3 ml-auto">
                    {/* Auth Section */}
                    {isAuthenticated() ? (
                        <div className="flex items-center gap-3">
                            {/* 用户下拉菜单 */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="flex items-center gap-2 px-3 py-2 rounded-2xl hover:bg-blue-50/50 transition-colors relative"
                                    >
                                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-sm relative">
                                            <User className="h-4 w-4 text-white"/>
                                            {/* 用户头像上的红点 */}
                                            {hasPendingItems && hasAdminPermission() && (
                                                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[18px] h-4.5 flex items-center justify-center px-1 border-2 border-white text-[10px] font-bold">
                                                        {pendingTotalCount > 99 ? '99+' : pendingTotalCount}
                                                    </span>
                                            )}
                                        </div>
                                        <div className="hidden sm:flex flex-col items-start">
                                            <span className="text-sm font-medium text-gray-900">
                                                {userProfile?.user?.realName || userProfile?.user?.username || '用户'}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                {userProfile?.institution?.fullName || '未设置机构'}
                                            </span>
                                        </div>
                                        <ChevronDown className="h-4 w-4 text-muted-foreground"/>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-64 border-blue-200/50 shadow-xl rounded-xl">
                                    {/* 用户信息头部 */}
                                    <div className="p-4 border-b border-blue-200/30">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-sm relative">
                                                <User className="h-6 w-6 text-white"/>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-gray-900 truncate">
                                                    {userProfile?.user?.realName || userProfile?.user?.username || '用户'}
                                                </p>
                                                <p className="text-sm text-muted-foreground truncate flex items-center py-1">
                                                    <Phone className="h-4 w-4 mr-1"/>
                                                    {userProfile?.user?.phone?.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2') || '未设置手机'}
                                                </p>
                                                <div className="flex items-center justify-between mt-1">
                                                    <div className="flex flex-wrap gap-1 flex-1">
                                                        {userRoles.map((role, index) => (
                                                            <Badge key={index} variant="secondary" className="bg-blue-100 text-blue-800 text-xs">
                                                                {getPermissionRoleDisplayName(role)}
                                                            </Badge>
                                                        ))}
                                                        {userRoles.length === 0 && (
                                                            <Badge variant="outline" className="text-xs">普通用户</Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <DropdownMenuItem onClick={() => navigate('/profile?tab=profile')} className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-blue-50/50">
                                        <User className="h-4 w-4 text-blue-600"/>
                                        <span className="font-medium">个人资料</span>
                                    </DropdownMenuItem>

                                    {hasAdminPermission() && (
                                        <DropdownMenuItem
                                            onClick={() => navigate('/admin')}
                                            className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-blue-50/50 relative"
                                        >
                                            <Shield className="h-4 w-4 text-blue-600"/>
                                            <span className="font-medium flex-1">管理面板</span>
                                            {pendingTotalCount > 0 && (
                                                <span className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center ml-2 font-bold">
                                                    {pendingTotalCount > 99 ? '99+' : pendingTotalCount}
                                                </span>
                                            )}
                                        </DropdownMenuItem>
                                    )}

                                    <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 cursor-pointer text-red-600 hover:bg-red-50/50">
                                        <LogOut className="h-4 w-4"/>
                                        <span className="font-medium">退出登录</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    ) : (
                        <Button asChild variant="default" size="sm" className="bg-blue-600 hover:bg-blue-700 text-white border-0 shadow-md hover:shadow-lg transition-all duration-200 rounded-md">
                            <Link to="/auth" className="flex items-center gap-1.5">
                                <User className="h-3.5 w-3.5"/>
                                <span className="font-medium text-sm">登录 | 注册</span>
                            </Link>
                        </Button>
                    )}

                    {/* Mobile Navigation Trigger */}
                    <Sheet open={isOpen} onOpenChange={setIsOpen}>
                        <SheetTrigger asChild>
                            <Button variant="ghost" className="lg:hidden p-2 rounded-xl hover:bg-blue-50/50" size="icon">
                                {isOpen ? <X className="h-5 w-5"/> : <Menu className="h-5 w-5"/>}
                                <span className="sr-only">切换菜单</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="right" className="w-80 pr-0 border-l-blue-200/50 bg-white/95 backdrop-blur-md">
                            <div className="flex flex-col h-full">
                                {/* Header */}
                                <div className="p-6 border-b border-blue-200/30">
                                    <Link to="/" className="flex items-center space-x-3 group" onClick={() => setIsOpen(false)}>
                                        <div className="p-1 bg-gradient-to-br rounded-2xl shadow-lg">
                                            <RcImageComponent
                                                src="/public/logo.jpeg"
                                                alt="老年疾病国家临床医学研究中心（华西）"
                                                className="h-20 w-20"
                                            />
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-lg font-bold bg-gradient-to-r from-gray-900 to-blue-800 bg-clip-text text-transparent">
                                                老年疾病国家临床医学研究中心（华西）
                                            </span>
                                            <span className="text-xs text-muted-foreground -mt-1">临床科研数据共享平台</span>
                                        </div>
                                    </Link>
                                </div>

                                {/* Navigation Items */}
                                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                                    <NavItems mobile/>
                                </nav>

                                {/* User Section */}
                                <div className="p-4 border-t border-blue-200/30 bg-blue-50/30">
                                    {isAuthenticated() ? (
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-3 p-3 bg-white/50 rounded-xl border border-blue-200/30 relative">
                                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl flex items-center justify-center shadow-sm relative">
                                                    <User className="h-5 w-5 text-white"/>
                                                    {/* 移动端用户头像上的红点 */}
                                                    {hasPendingItems && hasAdminPermission() && (
                                                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[16px] h-4 flex items-center justify-center px-1 border-2 border-white text-[10px] font-bold">
                                                            {pendingTotalCount > 99 ? '99+' : pendingTotalCount}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-semibold text-gray-900 text-sm truncate">
                                                        {userProfile?.user?.realName || userProfile?.user?.username || '用户'}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground truncate">
                                                        {userProfile?.institution?.fullName || '未设置机构'}
                                                    </p>
                                                    <div className="flex items-center justify-between mt-1">
                                                        <div className="flex flex-wrap gap-1 flex-1">
                                                            {userRoles.slice(0, 2).map((role, index) => (
                                                                <Badge key={index} variant="secondary" className="bg-blue-100 text-blue-800 text-xs">
                                                                    {getPermissionRoleDisplayName(role)}
                                                                </Badge>
                                                            ))}
                                                            {userRoles.length > 2 && (
                                                                <Badge variant="outline" className="text-xs">+{userRoles.length - 2}</Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <Button onClick={handleLogout} variant="outline" className="w-full border-red-200 text-red-600 hover:bg-red-50">
                                                <LogOut className="h-4 w-4 mr-2"/>
                                                退出登录
                                            </Button>
                                        </div>
                                    ) : (
                                        <Button asChild variant="default" size="sm" className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                                            <Link to="/auth" onClick={() => setIsOpen(false)} className="flex items-center justify-center gap-1.5">
                                                <User className="h-3.5 w-3.5"/>
                                                <span className="font-medium text-sm">登录 | 注册</span>
                                            </Link>
                                        </Button>
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