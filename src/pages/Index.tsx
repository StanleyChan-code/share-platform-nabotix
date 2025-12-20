import {Navigation} from "@/components/Navigation";
import {StatsCard} from "@/components/dashboard/StatsCard";
import {ResearchDirectionChart} from "@/components/dashboard/ResearchDirectionChart";
import {DatasetTypeChart} from "@/components/dashboard/DatasetTypeChart";
import {Database, Users, FileText, TrendingUp} from "lucide-react";
import {useEffect, useState} from "react";
import {getPlatformStatistics} from "@/integrations/api/statisticsApi";
import {api} from "@/integrations/api/client";
import {Dataset, datasetApi} from "@/integrations/api/datasetApi.ts";
import {getCurrentUser} from "@/lib/authUtils";
import { RecommendedDatasetsSection } from "@/components/home/RecommendedDatasetsSection";
import { RecentDatasetsSection } from "@/components/home/RecentDatasetsSection";
import { RecentOutputsSection } from "@/components/home/RecentOutputsSection";
import { OutputCard } from "@/components/home/OutputCard";
import { outputApi } from "@/integrations/api/outputApi.ts";

// 定义平台统计数据结构
interface PlatformStatistics {
    approvedDatasetCount: number;
    registeredUserCount: number;
    approvedResearchOutputCount: number;
    recentApplicationCount: number;
    datasetCountByType: Record<string, number>;
}

interface User {
    id: string;
    institutionId?: string;
    realName?: string;
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
    const [currentUser, setCurrentUser] = useState<User | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
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
    }, []);

    // 当用户信息获取完成后，获取推荐数据集
    useEffect(() => {
        if (currentUser !== null) { // 明确检查是否为null，避免初始undefined状态触发
            fetchRecommendationDatasets();
        }
    }, [currentUser]);

    const fetchStats = async () => {
        try {
            setStatsLoading(true);
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
            setDatasetsLoading(true);
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
            setOutputsLoading(true);
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
            setHighValueOutputsLoading(true);
            const response = await outputApi.getHighValueOutputs({ minValue: 2, size: 6 });
            setHighValueOutputs(response.content || []);
        } catch (error) {
            console.error('Error fetching high value outputs:', error);
            setHighValueOutputs([]);
        } finally {
            setHighValueOutputsLoading(false);
        }
    };

    const fetchCurrentUser = async () => {
        setCurrentUser(getCurrentUser);
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
        <div className="min-h-screen bg-background">
            <Navigation/>

            <main className="container mx-auto py-6 space-y-6">
                {/* Hero Section */}
                <div className="text-center space-y-4">
                    <h1 className="text-4xl font-bold tracking-tight">
                        临床研究数据共享平台
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                        安全、标准化、协作的临床研究数据集共享平台。遵循OMOP CDM规范，严格去标识化处理，内置描述性统计分析功能。
                    </p>
                </div>

                {/* Statistics Overview */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <StatsCard
                        title="数据集总数"
                        value={statsLoading ? "..." : (stats?.approvedDatasetCount || 0).toString()}
                        description="已发布的数据集"
                        icon={Database}
                    />
                    <StatsCard
                        title="注册用户"
                        value={statsLoading ? "..." : (stats?.registeredUserCount || 0).toLocaleString()}
                        description="平台注册用户数"
                        icon={Users}
                    />
                    <StatsCard
                        title="研究成果"
                        value={statsLoading ? "..." : (stats?.approvedResearchOutputCount || 0).toString()}
                        description="基于平台数据发表的成果"
                        icon={FileText}
                    />
                    <StatsCard
                        title="数据申请"
                        value={statsLoading ? "..." : (stats?.recentApplicationCount || 0).toString()}
                        description="近30天的数据申请数量"
                        icon={TrendingUp}
                    />
                </div>

                {/* Charts */}
                <div className="grid gap-6 md:grid-cols-3">
                    <ResearchDirectionChart/>
                    <DatasetTypeChart data={stats?.datasetCountByType}/>
                </div>

                {/* 高质量成果展示 */}
                <div className="space-y-4">
                    <h2 className="text-2xl font-semibold">高质量研究成果</h2>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {highValueOutputsLoading ? (
                            <div className="col-span-3 text-center py-8 text-muted-foreground">
                                加载中...
                            </div>
                        ) : highValueOutputs.length > 0 ? (
                            highValueOutputs.map((output: any) => <OutputCard key={output.id} output={output} />)
                        ) : (
                            <div className="col-span-3 text-center py-8 text-muted-foreground">
                                暂无高质量研究成果
                            </div>
                        )}
                    </div>
                </div>

                {/* 推荐数据集（如果已登录且有推荐） */}
                {recommendedDatasets.length > 0 && (
                    <RecommendedDatasetsSection 
                        datasets={recommendedDatasets}
                        loading={recommendedLoading}
                        recommendationReason={currentUser?.institutionId ? '基于您的机构推荐' : '热门数据集'}
                    />
                )}

                {/* Recent Activities */}
                <div className="grid gap-6 md:grid-cols-2">
                    {/* 最新数据集 */}
                    <RecentDatasetsSection datasets={recentDatasets} loading={datasetsLoading} />
                    
                    {/* 最新研究成果 */}
                    <RecentOutputsSection outputs={recentOutputs} loading={outputsLoading} />
                </div>
            </main>
        </div>
    );
};

export default Index;