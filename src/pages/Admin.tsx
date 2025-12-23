import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
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
import { institutionApi } from "@/integrations/api/institutionApi";
import { getCurrentUserInfo } from "@/lib/authUtils.ts";
import { getPermissionRoleDisplayName, hasPermissionRole, PermissionRoles } from "@/lib/permissionUtils.ts";
import DatasetsTab from "@/components/admin/dataset/DatasetsTab.tsx";
import ResearchOutputsManagementTab from "@/components/admin/researchoutput/ResearchOutputsManagementTab.tsx";

const UnifiedDashboard = () => {
    const [activeTab, setActiveTab] = useState("institutions");
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);
    const [userInstitution, setUserInstitution] = useState<any>(null);
    const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);
    const { toast } = useToast();
    const navigate = useNavigate();

    // 定义所有可用的标签页
    const allTabs = [
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
            content: <InstitutionProfileTab institutionId={userInstitution?.id}/>,
            allowRoles: [PermissionRoles.INSTITUTION_SUPERVISOR],
            color: "green"
        },
        {
            value: "research-subjects",
            label: "学科管理",
            icon: Target,
            description: "管理研究学科分类",
            content: <ResearchSubjectManagementTab />,
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
            content: <ResearchOutputsManagementTab />,
            allowRoles: [PermissionRoles.PLATFORM_ADMIN, PermissionRoles.INSTITUTION_SUPERVISOR, PermissionRoles.RESEARCH_OUTPUT_APPROVER],
            color: "amber"
        },
    ];

    useEffect(() => {
        const checkAuthorization = async () => {
            try {
                setIsCheckingAuth(true);

                // 获取当前用户信息
                const user = getCurrentUserInfo();

                if (!user) {
                    navigate("/auth");
                    return;
                }

                // 检查用户权限
                const userRoles = user.roles || [];
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

                // 获取机构信息（如果不是平台管理员）
                const platformAdmin = hasPermissionRole(PermissionRoles.PLATFORM_ADMIN);
                setIsPlatformAdmin(platformAdmin);

                if (!platformAdmin && user.institution?.id) {
                    try {
                        const institutionResponse = await institutionApi.getInstitutionById(user.institution.id);
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
            <div className="min-h-screen bg-gradient-to-br from-gray-50/30 to-blue-50/10 flex items-center justify-center">
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

    const userInfo = getCurrentUserInfo();
    const availableTabs = allTabs.filter(tab =>
        tab.allowRoles.some(role => hasPermissionRole(role))
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50/30 to-blue-50/10">
            <Navigation/>

            <main className="container mx-auto px-4 py-8 space-y-8 max-w-7xl">
                {/* Header Section */}
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl shadow-lg">
                                <Shield className="h-8 w-8 text-white" />
                            </div>
                            <div>
                                <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-blue-800 bg-clip-text text-transparent">
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
                                        {userInfo.roles.map((role, index) => (
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

                {/* Management Tabs */}
                <Card className="bg-white/80 backdrop-blur-sm border-blue-200/50 shadow-xl overflow-hidden">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        {/* Tabs Header */}
                        <div className="border-b border-blue-200/30">
                            <div className="px-6 pt-6">
                                <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-blue-800 bg-clip-text text-transparent mb-2">
                                    管理功能
                                </h2>
                                <p className="text-muted-foreground">
                                    选择以下功能模块进行系统管理
                                </p>
                            </div>

                            <TabsList className="grid w-full h-full px-6 pb-0 mt-2" style={{ gridTemplateColumns: `repeat(${availableTabs.length}, 1fr)` }}>
                                {availableTabs.map(tab => {
                                    const IconComponent = tab.icon;
                                    const isActive = activeTab === tab.value;

                                    return (
                                        <TabsTrigger
                                            key={tab.value}
                                            value={tab.value}
                                            className={`flex items-center gap-3 py-4 px-4 font-medium transition-all duration-200 ${
                                                isActive
                                                    ? `bg-gradient-to-r from-${tab.color}-600 to-${tab.color}-700 text-white shadow-lg`
                                                    : "text-muted-foreground hover:text-gray-900 hover:bg-gray-50/50"
                                            }`}
                                        >
                                            <IconComponent className="h-5 w-5" />
                                            {tab.label}
                                        </TabsTrigger>
                                    );
                                })}
                            </TabsList>
                        </div>

                        {/* Tabs Content */}
                        <div className="p-6">
                            {availableTabs.map(tab => {
                                const currentTab = allTabs.find(t => t.value === tab.value);
                                return (
                                    <TabsContent key={tab.value} value={tab.value} className="space-y-6 m-0">
                                        {/* Tab Header */}
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 bg-${currentTab?.color}-100 rounded-lg`}>
                                                    <currentTab.icon className={`h-6 w-6 text-${currentTab?.color}-600`} />
                                                </div>
                                                <div>
                                                    <h3 className="text-xl font-bold text-gray-900">{currentTab?.label}</h3>
                                                    <p className="text-muted-foreground">{currentTab?.description}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Tab Content */}
                                        <div className="min-h-[400px]">
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