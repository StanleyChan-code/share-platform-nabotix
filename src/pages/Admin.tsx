import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Shield, Users, Database, FileText, Building2, Loader2 } from "lucide-react";
import UserManagementTab from "@/components/admin/user/UserManagementTab.tsx";
import DatasetApprovalTab from "@/components/admin/DatasetApprovalTab";
import ApplicationReviewTab from "@/components/admin/ApplicationReviewTab";
import InstitutionManagementTab from "@/components/admin/institution/InstitutionManagementTab.tsx";
import { getCurrentUserRoles } from "@/integrations/api/authApi";

const Admin = () => {
  const [activeTab, setActiveTab] = useState("users");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Check authentication and admin authorization
  useEffect(() => {
    const checkAuthorization = async () => {
      try {
        // Check if user is authenticated by getting user roles
        const rolesResponse = await getCurrentUserRoles();
        
        if (!rolesResponse.data.success) {
          toast({
            title: "未授权",
            description: "请先登录以访问管理面板。",
            variant: "destructive",
          });
          navigate('/auth');
          return;
        }

        // Check if user has PLATFORM_ADMIN role
        const roles = rolesResponse.data.data;
        const isAdmin = roles.includes('PLATFORM_ADMIN');
        
        if (!isAdmin) {
          toast({
            title: "访问被拒绝",
            description: "您没有访问管理面板的权限。",
            variant: "destructive",
          });
          navigate('/');
          return;
        }

        setIsAuthorized(true);
      } catch (error) {
        console.error('Authorization check failed:', error);
        toast({
          title: "错误",
          description: "授权检查失败。",
          variant: "destructive",
        });
        navigate('/');
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuthorization();
  }, [navigate, toast]);

  // Show loading state while checking authorization
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">正在验证权限...</p>
        </div>
      </div>
    );
  }

  // Only render admin panel if authorized
  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto py-6 space-y-6">
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">管理员仪表板</h1>
            <p className="text-muted-foreground">管理用户、数据集和平台操作</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              用户
            </TabsTrigger>
            <TabsTrigger value="datasets" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              数据集
            </TabsTrigger>
            <TabsTrigger value="applications" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              申请
            </TabsTrigger>
            <TabsTrigger value="institutions" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              机构
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-4">
            <UserManagementTab />
          </TabsContent>

          <TabsContent value="datasets" className="space-y-4">
            <DatasetApprovalTab />
          </TabsContent>

          <TabsContent value="applications" className="space-y-4">
            <ApplicationReviewTab />
          </TabsContent>

          <TabsContent value="institutions" className="space-y-4">
            <InstitutionManagementTab />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Admin;