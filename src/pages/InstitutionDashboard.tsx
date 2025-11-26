import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Users, Database, FileText, Building2, Loader2 } from "lucide-react";
import UserManagementTab from "@/components/admin/UserManagementTab";
import DatasetApprovalTab from "@/components/admin/DatasetApprovalTab";
import ApplicationReviewTab from "@/components/admin/ApplicationReviewTab";
import InstitutionManagementTab from "@/components/admin/InstitutionManagementTab";

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
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          navigate("/auth");
          return;
        }

        // 获取用户的角色和机构信息
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('institution_id')
          .eq('id', user.id)
          .maybeSingle();

        if (userError) {
          throw userError;
        }

        // 检查用户是否是机构管理员
        const { data: roleData, error: roleError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'institution_supervisor');

        if (roleError) {
          throw roleError;
        }

        if (!roleData || roleData.length === 0) {
          toast({
            title: "访问被拒绝",
            description: "您没有权限访问此页面",
            variant: "destructive",
          });
          navigate("/");
          return;
        }

        // 设置用户机构信息
        if (userData?.institution_id) {
          const { data: institutionData, error: institutionError } = await supabase
            .from('institutions')
            .select('id, full_name')
            .eq('id', userData.institution_id)
            .maybeSingle();

          if (institutionError) {
            throw institutionError;
          }

          setUserInstitution(institutionData);
        }

        setIsAuthorized(true);
      } catch (error) {
        console.error("检查授权时出错:", error);
        toast({
          title: "错误",
          description: "检查用户权限时发生错误",
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
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Building2 className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold">机构管理面板</h1>
            <p className="text-gray-600">
              {userInstitution ? userInstitution.full_name : "管理您的机构"}
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
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

          <TabsContent value="users">
            {userInstitution ? (
              <UserManagementTab institutionId={userInstitution.id} />
            ) : (
              <div>加载中...</div>
            )}
          </TabsContent>
          
          <TabsContent value="datasets">
            {userInstitution ? (
              <DatasetApprovalTab institutionId={userInstitution.id} />
            ) : (
              <div>加载中...</div>
            )}
          </TabsContent>
          
          <TabsContent value="applications">
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