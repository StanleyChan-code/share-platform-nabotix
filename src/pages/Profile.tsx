import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { getCurrentUser, getCurrentUserRoles, updateUserProfile } from "@/integrations/api/authApi";
import { institutionApi } from "@/integrations/api/institutionApi";
import { getPermissionRoleDisplayName, PermissionRoles } from "@/lib/permissionUtils";
import ProfileInfo from "@/components/profile/ProfileInfo";
import ApplicationsTab from "@/components/profile/ApplicationsTab";
import OutputsTab from "@/components/profile/OutputsTab";
import SettingsTab from "@/components/profile/SettingsTab";
import DatasetsTab from "@/components/profile/DatasetsTab";

const Profile = () => {
  const [activeTab, setActiveTab] = useState<"profile" | "applications" | "outputs" | "datasets" | "settings">("profile");
  const [user, setUser] = useState<{id: string, email: string} | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [institution, setInstitution] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [editForm, setEditForm] = useState({
    username: "",
    realName: "",
    title: "",
    field: "",
    phone: "",
    email: "",
    education: ""
  });

  useEffect(() => {
    // Check for existing session
    const token = localStorage.getItem('authToken');
    if (token) {
      fetchUserProfile();
    } else {
      setLoading(false);
    }

    // 检查URL参数，如果tab=outputs，则切换到成果标签页
    const params = new URLSearchParams(location.search);
    if (params.get('tab') === 'outputs') {
      setActiveTab('outputs');
    }
  }, []);

  const fetchUserProfile = async () => {
    try {
      // 获取用户信息和角色
      const [userResponse, rolesResponse] = await Promise.all([
        getCurrentUser(),
        getCurrentUserRoles()
      ]);

      if (!userResponse.data.success) {
        throw new Error(userResponse.data.message || "获取用户信息失败");
      }

      const profileData = userResponse.data.data;
      setUser({id: profileData.id, email: profileData.email});
      setUserProfile(profileData);
      setEditForm({
        username: profileData.username || "",
        realName: profileData.realName || "",
        title: profileData.title || "",
        field: profileData.field || "",
        phone: profileData.phone || "",
        email: profileData.email || "",
        education: profileData.education || ""
      });

      // 设置用户权限角色
      if (rolesResponse.data.success) {
        setUserRoles(rolesResponse.data.data);
      }

      // 如果用户有机构ID，获取机构信息
      if (profileData.institutionId) {
        try {
          const institutionResponse = await institutionApi.getInstitutionById(profileData.institutionId);
          if (institutionResponse.success) {
            setInstitution(institutionResponse.data);
          }
        } catch (error) {
          console.error("获取机构信息失败:", error);
        }
      }

    } catch (error: any) {
      console.error("获取用户信息失败:", error);
      toast({
        title: "错误",
        description: "获取用户信息失败，请稍后重试",
        variant: "destructive",
      });
      // 如果是认证错误，跳转到登录页
      if (error?.response?.status === 401) {
        localStorage.removeItem('authToken');
        navigate('/auth');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (formData: any) => {
    try {
      const response = await updateUserProfile({
        username: formData.username,
        email: formData.email,
        education: formData.education,
        field: formData.field,
        title: formData.title
      });
  
      if (response.data.success) {
        toast({
          title: "成功",
          description: "个人信息更新成功",
        });
        fetchUserProfile(); // 重新获取用户信息以更新界面
      } else {
        throw new Error(response.data.message || "更新失败");
      }
    } catch (error: any) {
      console.error("更新用户信息失败:", error);
      toast({
        title: "错误",
        description: error?.response?.data?.message || "更新个人信息失败，请稍后重试",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    navigate('/auth');
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation/>

      <main className="container mx-auto py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">个人中心</h1>
            <p className="text-muted-foreground">
              管理您的个人信息、查看申请状态和研究成果
            </p>
          </div>

          <div className="flex items-center gap-2">
            {userRoles.map((role, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="bg-primary/10 text-primary"
              >
                {getPermissionRoleDisplayName(role)}
              </Badge>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab("profile")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "profile"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-foreground"
              }`}
            >
              个人信息
            </button>
            <button
              onClick={() => setActiveTab("applications")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "applications"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-foreground"
              }`}
            >
              数据申请
            </button>
            <button
              onClick={() => setActiveTab("outputs")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "outputs"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-foreground"
              }`}
            >
              研究成果
            </button>
            {userRoles.includes(PermissionRoles.DATASET_UPLOADER) && (
              <button
                onClick={() => setActiveTab("datasets")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "datasets"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-foreground"
                }`}
              >
                我的数据集
              </button>
            )}
            <button
              onClick={() => setActiveTab("settings")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "settings"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-foreground"
              }`}
            >
              账户设置
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === "profile" && (
          <ProfileInfo
            userProfile={userProfile}
            institution={institution}
            user={user}
            educationLabels={{}}
            onUpdateProfile={handleUpdateProfile}
          />
        )}
        
        {activeTab === "applications" && <ApplicationsTab />}
        
        {activeTab === "outputs" && <OutputsTab />}
        
        {activeTab === "datasets" && userRoles.includes(PermissionRoles.DATASET_UPLOADER) && <DatasetsTab />}
        
        {activeTab === "settings" && (
          <SettingsTab 
            user={userProfile}
          />
        )}
      </main>
    </div>
  );
};

export default Profile;