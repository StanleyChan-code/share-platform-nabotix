import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { getCurrentUser, getCurrentUserRoles, updateUserProfile } from "@/integrations/api/authApi";
import { institutionApi } from "@/integrations/api/institutionApi";
import { getPermissionRoleDisplayName, PermissionRoles } from "@/lib/permissionUtils";
import { getCurrentUserInfo, getCurrentUser as getCachedUser, getCurrentUserRoles as getCachedRoles, getCurrentUserInstitution } from "@/lib/authUtils";
import ProfileInfo from "@/components/profile/ProfileInfo";
import ApplicationsTab from "@/components/profile/ApplicationsTab";
import OutputsTab from "@/components/profile/OutputsTab";
import SettingsTab from "@/components/profile/SettingsTab";
import DatasetsTab from "@/components/admin/DatasetsTab.tsx";

const Profile = () => {
  const [activeTab, setActiveTab] = useState<"profile" | "applications" | "outputs" | "datasets" | "settings">("profile");
  const [user, setUser] = useState<any | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [institution, setInstitution] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [points, setPoints] = useState<number>(0); // 新增积分状态
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

  // 计算积分的函数
  const calculatePoints = (registrationDate: string | Date): number => {
    if (!registrationDate) return 0;

    const regDate = new Date(registrationDate);
    const currentDate = new Date();

    // 计算两个日期之间的天数差
    const timeDiff = currentDate.getTime() - regDate.getTime();
    const daysDiff = Math.floor(timeDiff / (1000 * 3600 * 24));

    // 确保天数为非负数
    return Math.max(0, daysDiff);
  };

  // Check if user has permission to access datasets tab
  const canAccessDatasetsTab = () => {
    return userRoles.includes(PermissionRoles.DATASET_UPLOADER);
  };

  useEffect(() => {
    // Check for existing session
    const userInfo = getCurrentUserInfo();

    if (userInfo) {
      // 从sessionStorage中获取用户信息
      try {
        setUser({
          id: userInfo.user.id,
          phone: userInfo.user.phone
        });
        setUserProfile(userInfo.user);
        setUserRoles(userInfo.roles);
        setInstitution(userInfo.institution);

        // 计算并设置积分
        if (userInfo.user.createdAt) {
          const userPoints = calculatePoints(userInfo.user.createdAt);
          setPoints(userPoints);
        }

        setEditForm({
          username: userInfo.user.username || "",
          realName: userInfo.user.realName || "",
          title: userInfo.user.title || "",
          field: userInfo.user.field || "",
          phone: userInfo.user.phone || "",
          email: userInfo.user.email || "",
          education: userInfo.user.education || ""
        });

        setLoading(false);
      } catch (error) {
        console.error("解析用户信息失败:", error);
        // 如果解析失败，清除认证信息并跳转到登录页
        localStorage.removeItem('authToken');
        sessionStorage.removeItem('userInfo');
        navigate('/auth');
      }
    } else {
      const token = localStorage.getItem('authToken');
      if (token) {
        // 有token但没有用户信息，从API获取
        fetchUserProfile();
      } else {
        // 没有token，跳转到登录页
        navigate('/auth');
      }
    }

    // 检查URL参数，如果tab=outputs，则切换到成果标签页
    const params = new URLSearchParams(location.search);
    if (params.get('tab') === 'outputs') {
      setActiveTab('outputs');
    }

    // 如果用户尝试访问数据集标签但没有权限，则重定向到个人信息标签
    if (activeTab === 'datasets' && !canAccessDatasetsTab()) {
      setActiveTab('profile');
    }

    if (params.get('tab') === 'datasets') {
      setActiveTab('datasets');
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

      // 计算并设置积分
      if (profileData.createdAt) {
        const userPoints = calculatePoints(profileData.createdAt);
        setPoints(userPoints);
      }

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

        // 更新sessionStorage中的用户信息
        const userInfoStr = sessionStorage.getItem('userInfo');
        if (userInfoStr) {
          try {
            const userInfo = JSON.parse(userInfoStr);
            userInfo.roles = rolesResponse.data.data;
            sessionStorage.setItem('userInfo', JSON.stringify(userInfo));
          } catch (error) {
            console.error("更新sessionStorage中的角色信息失败:", error);
          }
        }
      }

      // 如果用户有机构ID，获取机构信息
      if (profileData.institutionId) {
        try {
          const institutionResponse = await institutionApi.getInstitutionById(profileData.institutionId);
          if (institutionResponse.success) {
            setInstitution(institutionResponse.data);

            // 更新sessionStorage中的用户信息
            const userInfoStr = sessionStorage.getItem('userInfo');
            if (userInfoStr) {
              try {
                const userInfo = JSON.parse(userInfoStr);
                userInfo.institution = institutionResponse.data;
                sessionStorage.setItem('userInfo', JSON.stringify(userInfo));
              } catch (error) {
                console.error("更新sessionStorage中的机构信息失败:", error);
              }
            }
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
        sessionStorage.removeItem('userInfo');
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

  // 如果没有用户信息，跳转到登录页
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

            <div className="flex flex-col items-end gap-2">
              {/* 角色显示 */}
              <div className="flex items-center gap-2">
                {userRoles.map((role, index) => (
                    <Badge
                        key={index}
                        variant="secondary"
                        className="bg-primary/10 text-sm text-primary"
                    >
                      {getPermissionRoleDisplayName(role)}
                    </Badge>
                ))}
              </div>

              {/* 积分显示 */}
              <div className="flex items-center gap-2 bg-gradient-to-r from-blue-50 to-purple-50 px-3 py-2 rounded-lg border">
                <div className="flex items-center gap-1">
                  <span className="font-medium text-xs text-gray-700">积分:</span>
                  <span className="font-bold text-xs text-blue-600">{points}</span>
                </div>
              </div>
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
                我的申请
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
          <div className="mt-6">
            {activeTab === "profile" && (
                <ProfileInfo
                    userProfile={userProfile}
                    institution={institution}
                    onUpdateProfile={handleUpdateProfile}
                />
            )}

            {activeTab === "applications" && (
                <ApplicationsTab />
            )}

            {activeTab === "outputs" && (
                <OutputsTab />
            )}

            {activeTab === "settings" && (
                <SettingsTab user={user} />
            )}
          </div>
        </main>
      </div>
  );
};

// 导出工具方法供外部使用
export {
  getCurrentUserInfo,
  getCachedUser as getCurrentUser,
  getCachedRoles as getUserRoles,
  getCurrentUserInstitution
};

export default Profile;