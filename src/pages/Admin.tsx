import {useState, useEffect} from "react";
import {useNavigate} from "react-router-dom";
import {Navigation} from "@/components/Navigation";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {Badge} from "@/components/ui/badge";
import {Card, CardContent} from "@/components/ui/card";
import {useToast} from "@/hooks/use-toast";
import {
    Shield,
    Users,
    Database,
    FileText,
    Building2,
    Loader2,
    Target,
    Award,
    BookOpen,
    UserCheck,
    BarChart3,
    Settings
} from "lucide-react";
import UserManagementTab from "@/components/admin/user/UserManagementTab.tsx";
import ApplicationReviewTab from "@/components/admin/ApplicationReviewTab";
import InstitutionManagementTab from "@/components/admin/institution/InstitutionManagementTab.tsx";
import InstitutionProfileTab from "@/components/admin/institution/InstitutionProfileTab.tsx";
import ResearchSubjectManagementTab from "@/components/admin/researchsubject/ResearchSubjectManagementTab.tsx";
import {institutionApi} from "@/integrations/api/institutionApi";
import {getCurrentUserInfoFromSession} from "@/lib/authUtils.ts";
import {getPermissionRoleDisplayName, hasPermissionRole, PermissionRoles} from "@/lib/permissionUtils.ts";
import DatasetsTab from "@/components/admin/dataset/DatasetsTab.tsx";
import ResearchOutputsManagementTab from "@/components/admin/researchoutput/ResearchOutputsManagementTab.tsx";

const UnifiedDashboard = () => {
    const [activeTab, setActiveTab] = useState("institutions");
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);
    const [userInstitution, setUserInstitution] = useState<any>(null);
    const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);
    const [availableTabs, setAvailableTabs] = useState<any>([]);
    const [currentUserInfo, setCurrentUserInfo] = useState<any | null>(null);
    const {toast} = useToast();
    const navigate = useNavigate();

    // 定义所有可用的标签页
    const getAllTabs = (institutionId: string) => {
        return [
            {
                value: "institutions",
                label: "机构管理",
                icon: Building2,
                description: "管理平台所有机构信息",
                content: <InstitutionManagementTab/>,
                allowRoles: [PermissionRoles.PLATFORM_ADMIN],
                color: "blue"
            },
            {
                value: "profile",
                label: "机构信息",
                icon: Building2,
                description: "查看和编辑机构资料",
                content: <InstitutionProfileTab institutionId={institutionId}/>,
                allowRoles: [PermissionRoles.INSTITUTION_SUPERVISOR],
                color: "green"
            },
            {
                value: "research-subjects",
                label: "学科管理",
                icon: Target,
                description: "管理研究学科分类",
                content: <ResearchSubjectManagementTab/>,
                allowRoles: [PermissionRoles.PLATFORM_ADMIN],
                color: "purple"
            },
            {
                value: "users",
                label: "用户管理",
                icon: Users,
                description: "管理系统用户和权限",
                content: <UserManagementTab/>,
                allowRoles: [PermissionRoles.PLATFORM_ADMIN, PermissionRoles.INSTITUTION_SUPERVISOR, PermissionRoles.INSTITUTION_USER_MANAGER],
                color: "orange"
            },
            {
                value: "datasets",
                label: "数据集管理",
                icon: Database,
                description: "审核和管理数据集",
                content: <DatasetsTab filterByCurrentUser={false}/>,
                allowRoles: [PermissionRoles.PLATFORM_ADMIN, PermissionRoles.INSTITUTION_SUPERVISOR, PermissionRoles.DATASET_APPROVER, PermissionRoles.DATASET_UPLOADER],
                color: "indigo"
            },
            {
                value: "applications",
                label: "申请管理",
                icon: FileText,
                description: "审核数据使用申请",
                content: <ApplicationReviewTab/>,
                allowRoles: [PermissionRoles.PLATFORM_ADMIN, PermissionRoles.INSTITUTION_SUPERVISOR, PermissionRoles.DATASET_APPROVER, PermissionRoles.DATASET_UPLOADER],
                color: "red"
            },
            {
                value: "research-outputs",
                label: "成果管理",
                icon: Award,
                description: "管理研究成果产出",
                content: <ResearchOutputsManagementTab/>,
                allowRoles: [PermissionRoles.PLATFORM_ADMIN, PermissionRoles.INSTITUTION_SUPERVISOR, PermissionRoles.RESEARCH_OUTPUT_APPROVER],
                color: "amber"
            },
        ]
    };

    const getActiveClass = (color: string) => {
        const colorMap = {
            blue: 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg',
            green: 'bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg',
            purple: 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg',
            orange: 'bg-gradient-to-r from-orange-600 to-orange-700 text-white shadow-lg',
            indigo: 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg',
            red: 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg',
            amber: 'bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-lg',
        };
        return colorMap[color] || colorMap.blue;
    };

    useEffect(() => {
        const checkAuthorization = async () => {
            try {
                setIsCheckingAuth(true);
                const userInfo = getCurrentUserInfoFromSession();
                setCurrentUserInfo(userInfo);

                if (!userInfo) {
                    navigate("/auth");
                    return;
                }

                // 检查用户权限
                const userRoles = userInfo.roles || [];
                if (userRoles.length === 0) {
                    toast({
                        title: "访问被拒绝",
                        description: "您没有权限访问管理面板",
                        variant: "destructive",
                    });
                    navigate("/");
                    return;
                }

                // 检查是否拥有管理权限
                const allTabs = getAllTabs(userInfo.institution?.id);
                const hasAdminAccess = allTabs.some(tab =>
                    tab.allowRoles.some(role => hasPermissionRole(role))
                );

                if (!hasAdminAccess) {
                    toast({
                        title: "访问被拒绝",
                        description: "您没有管理权限",
                        variant: "destructive",
                    });
                    navigate("/");
                    return;
                }

                setAvailableTabs(allTabs.filter(tab =>
                    tab.allowRoles.some(role => hasPermissionRole(role))
                ));

                // 获取机构信息（如果不是平台管理员）
                const platformAdmin = hasPermissionRole(PermissionRoles.PLATFORM_ADMIN);
                setIsPlatformAdmin(platformAdmin);

                if (!platformAdmin && userInfo.institution?.id) {
                    try {
                        const institutionResponse = await institutionApi.getInstitutionById(userInfo.institution.id);
                        if (institutionResponse.success) {
                            setUserInstitution(institutionResponse.data);
                        }
                    } catch (error) {
                        console.error("获取机构信息失败:", error);
                    }
                }

                setIsAuthorized(true);

                // 设置默认激活的标签页
                const availableTabs = allTabs.filter(tab =>
                    tab.allowRoles.some(role => hasPermissionRole(role))
                );

                if (availableTabs.length > 0 && !availableTabs.find(tab => tab.value === activeTab)) {
                    setActiveTab(availableTabs[0].value);
                }

            } catch (error: any) {
                console.error("检查授权时出错:", error);
                toast({
                    title: "错误",
                    description: error.message || "检查用户权限时发生错误",
                    variant: "destructive",
                });
                navigate("/");
            } finally {
                setIsCheckingAuth(false);
            }
        };

        checkAuthorization();
    }, [navigate, toast]);

    if (isCheckingAuth) {
        return (
            <div
                className="min-h-screen bg-gradient-to-br from-gray-50/30 to-blue-50/10 flex items-center justify-center">
                <div className="text-center space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p className="text-muted-foreground">正在验证权限...</p>
                </div>
            </div>
        );
    }

    if (!isAuthorized) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50/30 to-blue-50/10">
            <Navigation/>

            <main className="container mx-auto px-4 py-8 space-y-6 max-w-7xl">
                {/* Header Section - 保持不变 */}
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl shadow-lg">
                                <Shield className="h-8 w-8 text-white"/>
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-blue-800 bg-clip-text text-transparent">
                                    {isPlatformAdmin ? "平台管理面板" : "机构管理面板"}
                                </h1>
                                <p className="text-lg text-muted-foreground mt-1">
                                    {isPlatformAdmin ? "管理平台所有机构和用户" : `管理 ${userInstitution?.fullName || '当前机构'}`}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* 用户信息和角色显示 */}
                    <Card className="bg-gradient-to-br from-white to-blue-50/30 border-blue-200/50 shadow-lg">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-4">
                                <div className="flex-1 min-w-0">
                                    <div className="flex flex-wrap gap-1">
                                        {currentUserInfo && currentUserInfo.roles.map((role, index) => (
                                            <Badge
                                                key={index}
                                                className="bg-blue-100 text-blue-800 hover:bg-blue-200 text-xs font-medium border-0"
                                            >
                                                {getPermissionRoleDisplayName(role)}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Management Tabs - 美化后的部分 */}
                <Card className="bg-white/80 backdrop-blur-sm border-blue-200/50 shadow-xl overflow-hidden">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        {/* 美化后的 Tabs Header */}
                        <div className="relative">
                            {/* 背景装饰 */}
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-50/20 to-indigo-50/20"></div>

                            <div className="relative px-8 pt-6 pb-0">

                                {/* 美化后的 Tab 列表 - 占满整行 */}
                                <div className="relative">
                                    {/* 底部边框装饰 */}
                                    <div
                                        className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-200/50 to-transparent"></div>

                                    <TabsList
                                        className="flex w-full h-auto bg-transparent p-0 overflow-hidden rounded-none">
                                        {availableTabs.map((tab, index) => {
                                            const IconComponent = tab.icon;
                                            const isActive = activeTab === tab.value;
                                            const isFirst = index === 0;
                                            const isLast = index === availableTabs.length - 1;

                                            return (
                                                <TabsTrigger
                                                    key={tab.value}
                                                    value={tab.value}
                                                    className={`
        relative flex-1 flex items-center justify-center gap-3 py-5 px-3 font-medium 
        transition-all duration-300 border-b-2 border-transparent
        group hover:shadow-inner
        ${isActive
                                                        ? `${getActiveClass(tab.color)} border-current shadow-inner transform scale-[1.02] text-white`
                                                        : `text-gray-600 hover:text-gray-900 bg-white/30 hover:bg-white/60 backdrop-blur-sm border-blue-100`
                                                    }
        ${isFirst ? 'rounded-tl-xl' : ''}
        ${isLast ? 'rounded-tr-xl' : ''}
        min-w-0 flex-shrink-0
    `}
                                                    style={{flexBasis: `${100 / availableTabs.length}%`}}
                                                >
                                                    {/* 激活状态指示器 */}
                                                    {isActive && (
                                                        <div
                                                            className={`absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-white rounded-full animate-pulse`}></div>
                                                    )}

                                                    <IconComponent
                                                        className={`h-5 w-5 flex-shrink-0 transition-transform duration-300 ${
                                                            isActive ? 'scale-110 text-white' : 'group-hover:scale-110 text-current'
                                                        }`}/>

                                                    <span
                                                        className={`font-semibold text-base whitespace-nowrap truncate text-center ${
                                                            isActive ? 'text-white' : 'text-current'
                                                        }`}>
        {tab.label}
    </span>

                                                    {/* 悬停效果装饰 */}
                                                    <div
                                                        className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-b from-white/20 to-transparent ${
                                                            isActive ? 'opacity-100' : ''
                                                        }`}></div>

                                                    {/* 分隔线（除了最后一个） */}
                                                    {!isLast && !isActive && (
                                                        <div
                                                            className="absolute right-0 top-1/2 transform -translate-y-1/2 w-px h-7 bg-gray-200/60"></div>
                                                    )}
                                                </TabsTrigger>
                                            );
                                        })}
                                    </TabsList>
                                </div>
                            </div>
                        </div>

                        {/* Tabs Content */}
                        <div className="p-8">
                            {availableTabs.map(tab => {
                                return (
                                    <TabsContent key={tab.value} value={tab.value} className="space-y-6 m-0">

                                        {/* Tab Content */}
                                        <div
                                            className="min-h-[500px] rounded-2xl bg-white/50 p-6 shadow-sm border border-blue-100/50">
                                            {tab.content}
                                        </div>
                                    </TabsContent>
                                );
                            })}
                        </div>
                    </Tabs>
                </Card>
            </main>
        </div>
    );
};

export default UnifiedDashboard;