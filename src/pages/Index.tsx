import { Navigation } from "@/components/Navigation";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { ResearchDirectionChart } from "@/components/dashboard/ResearchDirectionChart";
import { DatasetTypeChart } from "@/components/dashboard/DatasetTypeChart";
import { Database, Users, FileText, TrendingUp, Award, Star, Zap, Target, Shield } from "lucide-react";
import { useEffect, useState } from "react";
import { getPlatformStatistics } from "@/integrations/api/statisticsApi";
import { api } from "@/integrations/api/client";
import { Dataset, datasetApi } from "@/integrations/api/datasetApi.ts";
import { getCurrentUserFromSession } from "@/lib/authUtils";
import { RecommendedDatasetsSection} from "@/components/home/RecommendedDatasetsSection.tsx";
import { RecentDatasetsSection} from "@/components/home/RecentDatasetsSection.tsx";
import { RecentOutputsSection } from "@/components/home/RecentOutputsSection";
import { OutputCard } from "@/components/home/OutputCard";
import { outputApi } from "@/integrations/api/outputApi.ts";
import { Card, CardContent } from "@/components/ui/card";
import {UserDto} from "@/integrations/api/userApi.ts";

// 定义平台统计数据结构
interface PlatformStatistics {
    approvedDatasetCount: number;
    registeredUserCount: number;
    approvedResearchOutputCount: number;
    recentApplicationCount: number;
    datasetCountByType: Record<string, number>;
}

const Index = () => {
    const [stats, setStats] = useState<PlatformStatistics | null>(null);
    const [statsLoading, setStatsLoading] = useState(true);
    const [recentDatasets, setRecentDatasets] = useState<Dataset[]>([]);
    const [recommendedDatasets, setRecommendedDatasets] = useState<Dataset[]>([]);
    const [recentOutputs, setRecentOutputs] = useState<any[]>([]);
    const [highValueOutputs, setHighValueOutputs] = useState<any[]>([]);
    const [datasetsLoading, setDatasetsLoading] = useState(true);
    const [recommendedLoading, setRecommendedLoading] = useState(true);
    const [outputsLoading, setOutputsLoading] = useState(true);
    const [highValueOutputsLoading, setHighValueOutputsLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<UserDto | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setStatsLoading(true);
                setDatasetsLoading(true);
                setOutputsLoading(true);
                setHighValueOutputsLoading(true);

                // 并行获取基础数据
                await Promise.all([
                    fetchStats(),
                    fetchRecentDatasets(),
                    fetchRecentOutputs(),
                    fetchHighValueOutputs(),
                    fetchCurrentUser()
                ]);
            } catch (error) {
                console.error('Error fetching initial data:', error);
            }
        };

        fetchData();

        // 监听认证状态变化事件
        const handleAuthStatusChange = (event: Event) => {
            const customEvent = event as CustomEvent<{ isAuthenticated: boolean }>;
            if (!customEvent.detail.isAuthenticated) {
                // 用户已登出，更新currentUser状态
                setCurrentUser(null);
                // 清空推荐数据集
                setRecommendedDatasets([]);
            }
        };

        window.addEventListener('authStatusChanged', handleAuthStatusChange);

        // 清理事件监听器
        return () => {
            window.removeEventListener('authStatusChanged', handleAuthStatusChange);
        };
    }, []);

    // 当用户信息获取完成后，获取推荐数据集
    useEffect(() => {
        if (currentUser !== null) {
            fetchRecommendationDatasets();
        }
    }, [currentUser]);

    const fetchStats = async () => {
        try {
            const response = await getPlatformStatistics();
            if (response.data.success) {
                setStats(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching platform statistics:', error);
        } finally {
            setStatsLoading(false);
        }
    };

    const fetchRecentDatasets = async () => {
        try {
            const datasetResponse = await datasetApi.queryDatasets({
                size: 6,
                loadTimeline: false,
            });
            if (datasetResponse.success) {
                setRecentDatasets(datasetResponse.data.content || []);
            }
        } catch (error) {
            console.error('Error fetching recent datasets:', error);
            setRecentDatasets([]);
        } finally {
            setDatasetsLoading(false);
        }
    };

    const fetchRecentOutputs = async () => {
        try {
            const response = await api.get('/research-outputs/public?size=6&sortBy=createdAt&sortDir=desc');
            if (response.data.success) {
                setRecentOutputs(response.data.data.content || []);
            }
        } catch (error) {
            console.error('Error fetching recent outputs:', error);
            setRecentOutputs([]);
        } finally {
            setOutputsLoading(false);
        }
    };

    const fetchHighValueOutputs = async () => {
        try {
            const response = await outputApi.getHighValueOutputs({ minValue: 3, size: 6 });
            setHighValueOutputs(response.content || []);
        } catch (error) {
            console.error('Error fetching high value outputs:', error);
            setHighValueOutputs([]);
        } finally {
            setHighValueOutputsLoading(false);
        }
    };

    const fetchCurrentUser = async () => {
        const user = getCurrentUserFromSession();
        setCurrentUser(user);
    };

    const fetchRecommendationDatasets = async () => {
        try {
            setRecommendedLoading(true);

            // 如果有用户且用户有机构ID，则基于机构推荐
            if (currentUser?.institutionId) {
                const datasetResponse = await datasetApi.queryDatasets({
                    institutionId: currentUser.institutionId,
                    size: 6,
                    loadTimeline: false,
                });
                if (datasetResponse.success && datasetResponse.data.content.length > 0) {
                    setRecommendedDatasets(datasetResponse.data.content);
                    return;
                }
            }

            // 如果没有机构推荐的数据集，则使用热门数据集作为备选
            const hotDatasetResponse = await datasetApi.queryDatasets({
                size: 6,
                loadTimeline: false,
            });
            if (hotDatasetResponse.success) {
                setRecommendedDatasets(hotDatasetResponse.data.content || []);
            }
        } catch (error) {
            console.error('Error fetching recommendation datasets:', error);
            setRecommendedDatasets([]);
        } finally {
            setRecommendedLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50/30 to-blue-50/10">
            <Navigation/>

            <main className="container mx-auto mb-8 px-4 py-2 space-y-8 max-w-7xl">
                {/* Hero Section */}
                <div className="text-center space-y-6 py-8">
                    <h1 className="text-5xl font-bold bg-gradient-to-r from-gray-900 to-blue-800 bg-clip-text text-transparent">
                        临床科研数据共享平台
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
                        基于OMOP CDM标准的安全、标准化、协作式临床科研数据共享平台，
                        严格遵循数据去标识化规范，为医学研究创新提供高质量数据支撑。
                    </p>
                </div>

                {/* Statistics Overview */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">

                    <StatsCard
                        title="数据集总数"
                        value={statsLoading ? "..." : (stats?.approvedDatasetCount || 0).toString()}
                        description="已发布的数据集"
                        icon={Database}
                        gradient="from-blue-400 to-blue-500"
                        loading={statsLoading}
                    />
                    <StatsCard
                        title="注册用户"
                        value={statsLoading ? "..." : (stats?.registeredUserCount || 0).toLocaleString()}
                        description="平台注册用户数"
                        icon={Users}
                        gradient="from-green-400 to-green-500"
                        loading={statsLoading}
                    />
                    <StatsCard
                        title="研究成果"
                        value={statsLoading ? "..." : (stats?.approvedResearchOutputCount || 0).toString()}
                        description="基于平台数据发表的成果"
                        icon={FileText}
                        gradient="from-purple-400 to-purple-500"
                        loading={statsLoading}
                    />
                    <StatsCard
                        title="数据申请"
                        value={statsLoading ? "..." : (stats?.recentApplicationCount || 0).toString()}
                        description="近30天的数据申请数量"
                        icon={TrendingUp}
                        gradient="from-orange-400 to-orange-500"
                        loading={statsLoading}
                    />
                </div>

                {/* Charts Section */}
                <div className="grid gap-6 lg:grid-cols-3">
                    <Card className="bg-gradient-to-br from-white to-blue-50/30 border-blue-200/50 shadow-lg hover:shadow-xl transition-shadow duration-300 lg:col-span-2">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-blue-100 rounded-lg">
                                    <Target className="h-5 w-5 text-blue-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">研究学科分布</h3>
                                    <p className="text-sm text-muted-foreground">各学科领域研究热度</p>
                                </div>
                            </div>
                            <ResearchDirectionChart/>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-white to-green-50/30 border-green-200/50 shadow-lg hover:shadow-xl transition-shadow duration-300">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-green-100 rounded-lg">
                                    <Database className="h-5 w-5 text-green-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">数据集类型</h3>
                                    <p className="text-sm text-muted-foreground">各类数据集占比</p>
                                </div>
                            </div>
                            <DatasetTypeChart data={stats?.datasetCountByType}/>
                        </CardContent>
                    </Card>
                </div>

                {/* 高质量成果展示 */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-amber-100 rounded-lg">
                                <Award className="h-6 w-6 text-amber-600" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-amber-700 bg-clip-text text-transparent">
                                    高质量研究成果
                                </h2>
                                <p className="text-muted-foreground">基于平台数据产出的高质量学术成果</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {highValueOutputsLoading ? (
                            Array.from({ length: 3 }).map((_, index) => (
                                <Card key={index} className="animate-pulse">
                                    <CardContent className="p-6">
                                        <div className="space-y-3">
                                            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                            <div className="h-3 bg-gray-200 rounded w-full"></div>
                                            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        ) : highValueOutputs.length > 0 ? (
                            highValueOutputs.map((output: any) => (
                                <OutputCard key={output.id} output={output} />
                            ))
                        ) : (
                            <div className="col-span-3 text-center py-12 text-muted-foreground">
                                <Award className="h-12 w-12 mx-auto mb-4 opacity-30" />
                                <p className="text-lg">暂无高质量研究成果</p>
                                <p className="text-sm">当前没有可展示的高质量研究成果</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* 推荐数据集（如果已登录且有推荐） */}
                {currentUser && recommendedDatasets.length > 0 && (
                    <RecommendedDatasetsSection
                        datasets={recommendedDatasets}
                        loading={recommendedLoading}
                        recommendationReason=""
                    />
                )}

                <div className="grid gap-6 lg:gap-8 lg:grid-cols-2">
                    {/* 最新数据集 */}
                    <RecentDatasetsSection
                        datasets={recentDatasets}
                        loading={datasetsLoading}
                    />

                    {/* 最新研究成果 */}
                    <RecentOutputsSection
                        outputs={recentOutputs}
                        loading={outputsLoading}
                    />
                </div>

                {/* Platform Features */}
                <Card className="bg-gradient-to-br from-white to-blue-50/30 border-blue-200/50 shadow-lg hover:shadow-xl transition-shadow duration-300">
                    <CardContent className="p-8">
                        <div className="text-center mb-8">
                            <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-blue-800 bg-clip-text text-transparent mb-4">
                                平台核心特性
                            </h2>
                            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                                为临床研究提供全方位的数据管理和分析支持
                            </p>
                        </div>

                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                            {[
                                { icon: Database, title: "标准化数据", desc: "遵循OMOP CDM国际标准", color: "blue" },
                                { icon: Shield, title: "安全可靠", desc: "严格的数据去标识化处理", color: "green" },
                                { icon: Users, title: "协作共享", desc: "促进跨机构研究合作", color: "purple" },
                                { icon: Award, title: "高质量成果", desc: "支持高水平研究产出", color: "orange" }
                            ].map((feature, index) => (
                                <div key={index} className="text-center space-y-3">
                                    <div className={`w-16 h-16 bg-${feature.color}-100 text-${feature.color}-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg`}>
                                        <feature.icon className="h-8 w-8" />
                                    </div>
                                    <h3 className="font-semibold text-gray-900">{feature.title}</h3>
                                    <p className="text-sm text-muted-foreground">{feature.desc}</p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
};

export default Index;