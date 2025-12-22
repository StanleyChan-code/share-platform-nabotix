import {useState, useEffect} from "react";
import {useNavigate} from "react-router-dom";
import {Navigation} from "@/components/Navigation";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {useToast} from "@/hooks/use-toast";
import {Shield, Users, Database, FileText, Building2, Loader2} from "lucide-react";
import UserManagementTab from "@/components/admin/user/UserManagementTab.tsx";
import ApplicationReviewTab from "@/components/admin/ApplicationReviewTab";
import InstitutionManagementTab from "@/components/admin/institution/InstitutionManagementTab.tsx";
import InstitutionProfileTab from "@/components/admin/institution/InstitutionProfileTab.tsx";
import ResearchSubjectManagementTab from "@/components/admin/researchsubject/ResearchSubjectManagementTab.tsx";
import {institutionApi} from "@/integrations/api/institutionApi";
import {getCurrentUserInfo} from "@/lib/authUtils.ts";
import {getPermissionRoleDisplayName, hasPermissionRole, PermissionRoles} from "@/lib/permissionUtils.ts";
import DatasetsTab from "@/components/admin/DatasetsTab.tsx";
import {Badge} from "@/components/ui/badge.tsx";
import ResearchOutputsManagementTab from "@/components/admin/ResearchOutputsManagementTab.tsx";

const UnifiedDashboard = () => {
    const [activeTab, setActiveTab] = useState(null);
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);
    const [userInstitution, setUserInstitution] = useState<any>(null);
    const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);
    const {toast} = useToast();
    const navigate = useNavigate();
    useEffect(() => {
        if (isAuthorized) {
            const availableTabs = allTabs.filter(tab =>
                tab.allowRoles.some(role => hasPermissionRole(role))
            );

            // 只有当当前activeTab不在可用tabs中时才重置
            if (availableTabs.length > 0 && !availableTabs.find(tab => tab.value === activeTab)) {
                setActiveTab(availableTabs[0].value);
            }
        }
    }, [isAuthorized, activeTab]);

    useEffect(() => {
        const checkAuthorization = async () => {
            try {
                // 获取当前用户信息
                const user = getCurrentUserInfo();

                if (!user) {
                    navigate("/auth");
                    return;
                }

                // 必须至少拥有其中一个角色
                if (!getCurrentUserInfo().roles) {
                    toast({
                        title: "访问被拒绝",
                        description: "您没有权限访问此页面",
                        variant: "destructive",
                    });
                    navigate("/");
                    return;
                }

                // 如果是不是平台管理员，获取用户所属机构信息
                if (!hasPermissionRole(PermissionRoles.PLATFORM_ADMIN)) {
                    if (!user.institution) {
                        toast({
                            title: "访问被拒绝",
                            description: "您的账号没有绑定机构",
                            variant: "destructive",
                        });
                        navigate("/");
                        return;
                    }

                    const institutionResponse = await institutionApi.getInstitutionById(user.institution.id);
                    setUserInstitution(institutionResponse.data);
                    setIsPlatformAdmin(false);
                } else {
                    setIsPlatformAdmin(true);
                }

                setIsAuthorized(true);
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
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center space-y-4">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary"/>
                    <p className="text-muted-foreground">正在验证权限...</p>
                </div>
            </div>
        );
    }

    if (!isAuthorized) {
        return null;
    }

    const allTabs = [
        {
            value: "institutions", label: "机构管理", icon: <Building2 className="h-4 w-4"/>, content: <InstitutionManagementTab/>,
            allowRoles: [PermissionRoles.PLATFORM_ADMIN]
        },
        {
            value: "profile", label: "机构信息", icon: <Building2 className="h-4 w-4"/>, content: <InstitutionProfileTab institutionId={userInstitution?.id}/>,
            allowRoles: [PermissionRoles.INSTITUTION_SUPERVISOR]
        },
        {
            value: "research-subjects", label: "研究学科管理", icon: <Shield className="h-4 w-4"/>, content: <ResearchSubjectManagementTab />,
            allowRoles: [PermissionRoles.PLATFORM_ADMIN]
        },
        {
            value: "users", label: "用户管理", icon: <Users className="h-4 w-4"/>, content: <UserManagementTab/>,
            allowRoles: [PermissionRoles.PLATFORM_ADMIN, PermissionRoles.INSTITUTION_SUPERVISOR, PermissionRoles.INSTITUTION_USER_MANAGER]
        },
        {
            value: "datasets", label: "数据集管理", icon: <Database className="h-4 w-4"/>, content: <DatasetsTab filterByCurrentUser={false}/>,
            allowRoles: [PermissionRoles.PLATFORM_ADMIN, PermissionRoles.INSTITUTION_SUPERVISOR, PermissionRoles.DATASET_APPROVER, PermissionRoles.DATASET_UPLOADER]
        },
        {
            value: "applications", label: "申请管理", icon: <FileText className="h-4 w-4"/>, content: <ApplicationReviewTab/>,
            allowRoles: [PermissionRoles.PLATFORM_ADMIN, PermissionRoles.INSTITUTION_SUPERVISOR, PermissionRoles.DATASET_APPROVER, PermissionRoles.DATASET_UPLOADER]
        },
        {
            value: "research-outputs", label: "研究成果管理", icon: <FileText className="h-4 w-4"/>, content: <ResearchOutputsManagementTab />,
            allowRoles: [PermissionRoles.PLATFORM_ADMIN, PermissionRoles.INSTITUTION_SUPERVISOR, PermissionRoles.RESEARCH_OUTPUT_APPROVER]
        },
    ]

    const tabs = allTabs.filter(tab =>
        tab.allowRoles.some(role => hasPermissionRole(role))
    );

    return (
        <div className="min-h-screen bg-background">
            <Navigation/>

            <main className="container mx-auto py-6 space-y-6">
                <div className="flex items-center gap-3">
                    <Shield className="h-8 w-8 text-primary"/>
                    <div className="flex-1">
                        <h1 className="text-3xl font-bold">
                            {isPlatformAdmin ? "平台管理面板" : "机构管理面板"}
                        </h1>
                        <p className="text-muted-foreground">
                            {(userInstitution ? userInstitution.fullName : "")}
                        </p>
                    </div>
                    {/* 角色显示 */}
                    <div className="flex items-center gap-2">
                        {getCurrentUserInfo().roles.map((role, index) => (
                            <Badge
                                key={index}
                                variant="secondary"
                                className="bg-primary/10 text-sm text-primary"
                            >
                                {getPermissionRoleDisplayName(role)}
                            </Badge>
                        ))}
                    </div>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                    <TabsList
                        className="grid w-full"
                        style={{
                            gridTemplateColumns: `repeat(${tabs.length}, 1fr)`
                        }}
                    >
                        {tabs.map(tab => (
                            <TabsTrigger key={tab.value} value={tab.value} className="flex items-center gap-2">
                                {tab.icon}
                                {tab.label}
                            </TabsTrigger>
                        ))}
                    </TabsList>

                    {tabs.map(tab => (
                            <TabsContent key={tab.value} value={tab.value} className="space-y-4">
                                {tab.content}
                            </TabsContent>
                        ))
                    }
                </Tabs>
            </main>
        </div>
    );
};

export default UnifiedDashboard;