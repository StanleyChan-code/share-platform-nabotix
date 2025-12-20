import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Building2, Users, Database, FileText } from "lucide-react";
import UserManagementTab from "@/components/admin/user/UserManagementTab.tsx";
import DatasetApprovalTab from "@/components/admin/DatasetApprovalTab";
import ApplicationReviewTab from "@/components/admin/ApplicationReviewTab";
import InstitutionProfileTab from "@/components/admin/institution/InstitutionProfileTab.tsx";
import { getCurrentUser, getCurrentUserRoles } from "@/integrations/api/authApi";
import { institutionApi } from "@/integrations/api/institutionApi";

const InstitutionDashboard = () => {
  const [activeTab, setActiveTab] = useState("users");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [userInstitution, setUserInstitution] = useState<any>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuthorization = async () => {
      try {
        // 获取当前用户信息
        const userResponse = await getCurrentUser();
        const user = userResponse.data.data;
        
        if (!user) {
          navigate("/auth");
          return;
        }

        // 获取用户角色
        const rolesResponse = await getCurrentUserRoles();
        const userRoles = rolesResponse.data.data;

        // 检查用户是否是机构管理员 (使用大写权限字符串)
        const isAuthorizedUser = userRoles.includes('INSTITUTION_SUPERVISOR');
        
        if (!isAuthorizedUser) {
          toast({
            title: "访问被拒绝",
            description: "您没有权限访问此页面",
            variant: "destructive",
          });
          navigate("/");
          return;
        }

        // 获取用户所属机构信息
        const institutionResponse = await institutionApi.getCurrentUserInstitution();
        setUserInstitution(institutionResponse.data);

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
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <Building2 className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">机构管理面板</h1>
            <p className="text-muted-foreground">
              {userInstitution ? userInstitution.fullName : "管理您的机构"}
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              机构信息
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              用户管理
            </TabsTrigger>
            <TabsTrigger value="datasets" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              数据集审批
            </TabsTrigger>
            <TabsTrigger value="applications" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              申请审批
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-4">
            {userInstitution ? (
              <InstitutionProfileTab institutionId={userInstitution.id} />
            ) : (
              <div>加载中...</div>
            )}
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            {userInstitution ? (
              <UserManagementTab />
            ) : (
              <div>加载中...</div>
            )}
          </TabsContent>
          
          <TabsContent value="datasets" className="space-y-4">
            {userInstitution ? (
              <DatasetApprovalTab institutionId={userInstitution.id} />
            ) : (
              <div>加载中...</div>
            )}
          </TabsContent>
          
          <TabsContent value="applications" className="space-y-4">
            {userInstitution ? (
              <ApplicationReviewTab institutionId={userInstitution.id} />
            ) : (
              <div>加载中...</div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default InstitutionDashboard;