import {Navigation} from "@/components/Navigation";
import {Badge} from "@/components/ui/badge";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {User, FileText, Download, Settings, Shield} from "lucide-react";
import {useState, useEffect} from "react";
import {supabase} from "@/integrations/supabase/client";
import {useToast} from "@/hooks/use-toast";
import {User as SupabaseUser} from "@supabase/supabase-js";
import ProfileInfo from "@/components/profile/ProfileInfo";
import ApplicationsTab from "@/components/profile/ApplicationsTab";
import OutputsTab from "@/components/profile/OutputsTab";
import SettingsTab from "@/components/profile/SettingsTab";
import { getRoleDisplayName } from "@/lib/roleUtils";

const Profile = () => {
    const [activeTab, setActiveTab] = useState("profile");
    const [user, setUser] = useState<SupabaseUser | null>(null);
    const [userProfile, setUserProfile] = useState<any>(null);
    const [userRoles, setUserRoles] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const {toast} = useToast();

    const [editForm, setEditForm] = useState({
        username: "",
        real_name: "",
        title: "",
        field: "",
        phone: "",
        email: "",
        education: ""
    });

    const [institutions, setInstitutions] = useState<any[]>([]);

    useEffect(() => {
        // Set up auth state listener
        const {data: {subscription}} = supabase.auth.onAuthStateChange(
            (event, session) => {
                setUser(session?.user ?? null);
                if (session?.user) {
                    fetchUserProfile(session.user.id);
                } else {
                    setUserProfile(null);
                    setUserRoles([]);
                    setLoading(false);
                }
            }
        );

        // Check for existing session
        supabase.auth.getSession().then(({data: {session}}) => {
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchUserProfile(session.user.id);
            } else {
                setLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const fetchUserProfile = async (userId: string) => {
        try {
            const [profileResult, rolesResult] = await Promise.all([
                supabase
                    .from('users')
                    .select('*')
                    .eq('id', userId)
                    .maybeSingle(),
                supabase
                    .from('user_roles')
                    .select('role')
                    .eq('user_id', userId)
            ]);

            if (profileResult.error) {
                console.error('Error fetching profile:', profileResult.error);
                toast({
                    title: "错误",
                    description: "获取用户信息失败",
                    variant: "destructive",
                });
            } else if (profileResult.data) {
                setUserProfile(profileResult.data);
                setEditForm({
                    username: profileResult.data.username || "",
                    real_name: profileResult.data.real_name || "",
                    title: profileResult.data.title || "",
                    field: profileResult.data.field || "",
                    phone: profileResult.data.phone || "",
                    email: profileResult.data.email || "",
                    education: profileResult.data.education || ""
                });

                if (profileResult.data.institution_id) {

                    const institutionsResult = await supabase
                        .from('institutions')
                        .select('*')
                        .eq('id', profileResult.data.institution_id);

                    if (institutionsResult.data && institutionsResult.data.length > 0) {
                        setInstitutions(institutionsResult.data[0]);
                    }
                }
            }

            if (rolesResult.error) {
                console.error('Error fetching user roles:', rolesResult.error);
                // Fallback to the deprecated role field if we can't fetch from user_roles
                if (profileResult.data) {
                    setUserRoles([profileResult.data.role]);
                }
            } else if (rolesResult.data) {
                const roles = rolesResult.data.map(item => item.role);
                setUserRoles(roles);
            } else if (profileResult.data) {
                // Fallback to the deprecated role field if user_roles table is empty
                setUserRoles([profileResult.data.role]);
            }
        } catch (error) {
            console.error('Error:', error);
            // Fallback to the deprecated role field if we encounter any other error
            if (userProfile) {
                setUserRoles([userProfile.role]);
            }
        } finally {
            setLoading(false);
        }
    };

    const statusLabels = {
        submitted: {label: "已提交", color: "bg-blue-100 text-blue-800"},
        under_review: {label: "审核中", color: "bg-yellow-100 text-yellow-800"},
        approved: {label: "已批准", color: "bg-green-100 text-green-800"},
        rejected: {label: "已拒绝", color: "bg-red-100 text-red-800"}
    };

    const educationLabels = {
        bachelor: "本科",
        master: "硕士",
        phd: "博士",
        postdoc: "博士后",
        professor: "教授",
        other: "其他"
    };

    const handleUpdateProfile = async (updatedData: any) => {
        if (!user || !userProfile) return;

        setUpdating(true);
        console.log("Updating profile:", updatedData);

        try {
            const {error} = await supabase
                .from('users')
                .update({
                    username: updatedData.username,
                    real_name: updatedData.real_name,
                    title: updatedData.title,
                    field: updatedData.field,
                    phone: updatedData.phone,
                    email: updatedData.email,
                    education: updatedData.education || null
                })
                .eq('id', user.id);

            if (error) throw error;

            // Update local state
            setUserProfile(prev => ({
                ...prev,
                username: updatedData.username,
                real_name: updatedData.real_name,
                title: updatedData.title,
                field: updatedData.field,
                phone: updatedData.phone,
                email: updatedData.email,
                education: updatedData.education || null
            }));

            toast({
                title: "更新成功",
                description: "个人信息已更新",
            });

        } catch (error) {
            console.error('Error updating profile:', error);
            toast({
                title: "更新失败",
                description: "更新个人信息时发生错误",
                variant: "destructive",
            });
        } finally {
            setUpdating(false);
        }
    };

    // Show loading state
    if (loading) {
        return (
            <div className="min-h-screen bg-background">
                <Navigation/>
                <main className="container mx-auto py-6">
                    <div className="text-center">加载中...</div>
                </main>
            </div>
        );
    }

    // Show login prompt if not authenticated
    if (!user) {
        return (
            <div className="min-h-screen bg-background">
                <Navigation/>
                <main className="container mx-auto py-6">
                    <div className="text-center">
                        <h1 className="text-2xl font-bold mb-4">请先登录</h1>
                        <p>您需要登录才能查看个人信息</p>
                    </div>
                </main>
            </div>
        );
    }

    // Show profile not found if no profile data
    if (!userProfile) {
        return (
            <div className="min-h-screen bg-background">
                <Navigation/>
                <main className="container mx-auto py-6">
                    <div className="text-center">
                        <h1 className="text-2xl font-bold mb-4">个人信息不完整</h1>
                        <p>请联系管理员完善您的个人信息</p>
                    </div>
                </main>
            </div>
        );
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
                                {getRoleDisplayName(role)}
                            </Badge>
                        ))}
                    </div>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="profile" className="gap-2">
                            <User className="h-4 w-4"/>
                            个人信息
                        </TabsTrigger>
                        <TabsTrigger value="applications" className="gap-2">
                            <FileText className="h-4 w-4"/>
                            我的申请
                        </TabsTrigger>
                        <TabsTrigger value="outputs" className="gap-2">
                            <Download className="h-4 w-4"/>
                            我的成果
                        </TabsTrigger>
                        <TabsTrigger value="settings" className="gap-2">
                            <Settings className="h-4 w-4"/>
                            账户设置
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="profile" className="space-y-6">
                        <ProfileInfo 
                          userProfile={userProfile} 
                          institutions={institutions} 
                          user={user} 
                          educationLabels={educationLabels}
                          onUpdateProfile={handleUpdateProfile}
                        />
                    </TabsContent>

                    <TabsContent value="applications" className="space-y-4">
                        <ApplicationsTab />
                    </TabsContent>

                    <TabsContent value="outputs" className="space-y-4">
                        <OutputsTab />
                    </TabsContent>

                    <TabsContent value="settings" className="space-y-6">
                        <SettingsTab user={user} />
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    );
};

export default Profile;