import {useState, useEffect} from "react";
import {useNavigate, useLocation} from "react-router-dom";
import {Navigation} from "@/components/Navigation";
import {Badge} from "@/components/ui/badge";
import {Card, CardContent} from "@/components/ui/card";
import {useToast} from "@/hooks/use-toast";
import {getPermissionRoleDisplayName} from "@/lib/permissionUtils";
import ProfileInfo from "@/components/profile/ProfileInfo";
import ApplicationsTab from "@/components/profile/ApplicationsTab";
import OutputsTab from "@/components/profile/OutputsTab";
import SettingsTab from "@/components/profile/SettingsTab";
import {User, FileText, Settings, Award, Calendar, Building, Star} from "lucide-react";
import {formatDate} from "@/lib/utils.ts";
import {refreshUserInfo, UserInfo} from "@/lib/authUtils.ts";

const Profile = () => {
    const [activeTab, setActiveTab] = useState<"profile" | "applications" | "outputs" | "datasets" | "settings">("profile");
    const [user, setUser] = useState<any | null>(null);
    const [userProfile, setUserProfile] = useState<UserInfo>(null);
    const [userRoles, setUserRoles] = useState<string[]>([]);
    const [institution, setInstitution] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [points, setPoints] = useState<number>(0);
    const {toast} = useToast();
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

    const fetchUser = async () => {
        const userInfo = await refreshUserInfo();

        if (userInfo) {
            try {
                setUser({
                    id: userInfo.user.id,
                    phone: userInfo.user.phone
                });
                setUserProfile(userInfo);
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
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                sessionStorage.removeItem('userInfo');
                navigate('/auth');
            }
        } else {
            navigate('/auth');
        }

        // 检查URL参数，如果tab=outputs，则切换到成果标签页
        const params = new URLSearchParams(location.search);
        if (params.get('tab') === 'outputs') {
            setActiveTab('outputs');
        } else if (params.get('tab') === 'applications') {
            setActiveTab('applications');
        } else if (params.get('tab') === 'profile') {
            setActiveTab('profile');
        }
    }

    useEffect(() => {
        fetchUser();
    }, []);

    if (loading) {
        return (
            <div
                className="min-h-screen bg-gradient-to-br from-gray-50/30 to-blue-50/10 flex items-center justify-center">
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

    const tabs = [
        {id: "profile", label: "个人信息", icon: User},
        {id: "applications", label: "我的申请", icon: FileText},
        {id: "outputs", label: "研究成果", icon: Award},
        {id: "settings", label: "账户设置", icon: Settings}
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50/30 to-blue-50/10">
            <Navigation/>

            <main className="container mx-auto px-4 py-8 space-y-8 max-w-6xl">
                {/* Header */}
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                    <div className="space-y-3">
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-blue-800 bg-clip-text text-transparent">
                            个人中心
                        </h1>
                        <p className="text-lg text-muted-foreground max-w-2xl">
                            管理您的个人信息、查看申请状态和研究成果
                        </p>
                    </div>

                    {/* 用户信息卡片 */}
                    <Card
                        className="bg-gradient-to-br from-white to-blue-50/30 border-blue-200/50 shadow-lg hover:shadow-xl transition-shadow duration-300">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-4">
                                {/* 用户头像区域 */}
                                <div
                                    className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                                    <User className="h-8 w-8 text-white"/>
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h2 className="text-xl font-bold text-gray-900 truncate">
                                            {userProfile.user.realName || userProfile?.user.username || '用户'}
                                        </h2>
                                        {/* 角色显示 */}
                                        <div className="flex items-center gap-1 flex-wrap">
                                            {userRoles.slice(0, 2).map((role, index) => (
                                                <Badge
                                                    key={index}
                                                    className="bg-blue-100 text-blue-800 hover:bg-blue-200 text-xs font-medium"
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
                                    </div>

                                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                        <div className="flex items-center gap-1">
                                            <Building className="h-4 w-4"/>
                                            <span
                                                className="truncate max-w-[160px]">{institution?.fullName || '未设置机构'}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Calendar className="h-4 w-4"/>
                                            <span>注册 {userProfile?.user.createdAt ? formatDate(userProfile.user.createdAt) : '未知'}</span>
                                        </div>


                                        <div className="flex items-center gap-2">
                                            <div className="p-2 bg-amber-100 rounded-lg">
                                                <Star className="h-2 w-2 text-amber-600"/>
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-700">
                                                    当前积分
                                                    <span
                                                        className="ml-1 text-sm font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                              {points}
                            </span>
                                                </p>

                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Tabs Navigation */}
                <Card className="bg-white/80 backdrop-blur-sm border-blue-200/50 shadow-xl">
                    <div className="p-2">
                        <nav className="flex space-x-1">
                            {tabs.map((tab) => {
                                const IconComponent = tab.icon;
                                const isActive = activeTab === tab.id;

                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id as any)}
                                        className={`flex items-center gap-2 py-3 px-4 rounded-lg font-medium text-sm transition-all duration-200 ${
                                            isActive
                                                ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg"
                                                : "text-muted-foreground hover:text-blue-700 hover:bg-blue-50/50"
                                        }`}
                                    >
                                        <IconComponent className="h-4 w-4"/>
                                        {tab.label}
                                    </button>
                                );
                            })}
                        </nav>
                    </div>
                </Card>

                {/* Tab Content */}
                <div className="mt-2">
                    {activeTab === "profile" && (
                        <ProfileInfo userProfile={userProfile} onUpdateProfile={fetchUser} />
                    )}

                    {activeTab === "applications" && (
                        <ApplicationsTab/>
                    )}

                    {activeTab === "outputs" && (
                        <OutputsTab/>
                    )}

                    {activeTab === "settings" && (
                        <SettingsTab user={user}/>
                    )}
                </div>
            </main>
        </div>
    );
};

export default Profile;