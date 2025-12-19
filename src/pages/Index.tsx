import {Navigation} from "@/components/Navigation";
import {StatsCard} from "@/components/dashboard/StatsCard";
import {ResearchDirectionChart} from "@/components/dashboard/ResearchDirectionChart";
import {DatasetTypeChart} from "@/components/dashboard/DatasetTypeChart";
import {Database, Users, FileText, TrendingUp, Calendar, Building} from "lucide-react";
import {useEffect, useState} from "react";
import {getPlatformStatistics} from "@/integrations/api/statisticsApi";
import {api} from "@/integrations/api/client";
import {DatasetTypes, OutputTypes} from "@/lib/enums";
import {formatDate} from "@/lib/utils.ts";
import {Dataset, datasetApi} from "@/integrations/api/datasetApi.ts";
import {getCurrentUser} from "@/lib/authUtils";

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
    const [datasetsLoading, setDatasetsLoading] = useState(true);
    const [recommendedLoading, setRecommendedLoading] = useState(true);
    const [outputsLoading, setOutputsLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<User | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // 并行获取基础数据
                await Promise.all([
                    fetchStats(),
                    fetchRecentDatasets(),
                    fetchRecentOutputs(),
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

    // 渲染数据集卡片组件
    const renderDatasetCard = (dataset: Dataset, showRecommendationBadge = false) => (
        <div
            key={dataset.id}
            className="flex flex-col p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer bg-card"
        >
            {/* 标题和标签行 */}
            <div className="flex items-start justify-between gap-2 mb-2">
                <h3
                    className="font-medium text-lg leading-tight line-clamp-2 flex-1"
                    title={dataset.titleCn}
                >
                    {dataset.titleCn}
                </h3>
                <div className="flex flex-col items-end gap-1 ml-2">
                    {showRecommendationBadge && (
                        <span
                            className="bg-primary text-primary-foreground px-2 py-1 rounded text-xs whitespace-nowrap">
              推荐
            </span>
                    )}
                    <span className="bg-secondary px-2 py-1 rounded text-xs whitespace-nowrap">
            {DatasetTypes[dataset.type as keyof typeof DatasetTypes] || dataset.type}
          </span>
                </div>
            </div>

            {/* 描述 */}
            {dataset.description && (
                <p className="text-sm text-muted-foreground line-clamp-3 mb-3 flex-1" title={dataset.description}>
                    {dataset.description}
                </p>
            )}

            {/* 元信息 */}
            <div className="space-y-2 mt-auto">
                {/* 提供者和时间 */}
                <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1 text-muted-foreground truncate">
                        <Users className="h-3 w-3"/>
                        <span title={dataset.provider?.realName || '未知'}>
              {dataset.provider?.realName || '未知'}
            </span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground whitespace-nowrap ml-2">
                        <Calendar className="h-3 w-3"/>
                        <span>{formatDate(dataset.currentVersionDate || dataset.createdAt)}</span>
                    </div>
                </div>

                {/* 采集单位 */}
                {dataset.dataCollectionUnit && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground truncate">
                        <Building className="h-3 w-3"/>
                        <span title={`采集单位: ${dataset.dataCollectionUnit}`}>
              {dataset.dataCollectionUnit}
            </span>
                    </div>
                )}

            </div>
        </div>
    );

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

                {/* 推荐数据集（如果已登录且有推荐） */}
                {recommendedDatasets.length > 0 && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-semibold">推荐数据集</h2>
                            <span className="text-sm text-muted-foreground">
                {currentUser?.institutionId ? '基于您的机构推荐' : '热门数据集'}
              </span>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {recommendedLoading ? (
                                <div className="col-span-3 text-center py-8 text-muted-foreground">
                                    加载推荐数据集中...
                                </div>
                            ) : (
                                recommendedDatasets.map(dataset =>
                                    renderDatasetCard(dataset, true)
                                )
                            )}
                        </div>
                    </div>
                )}

                {/* Recent Activities */}
                <div className="grid gap-6 md:grid-cols-2">
                    {/* 最新数据集 */}
                    <div className="space-y-4">
                        <h2 className="text-2xl font-semibold">最新数据集</h2>
                        <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-1">
                            {datasetsLoading ? (
                                <div className="col-span-2 text-center py-8 text-muted-foreground">
                                    加载中...
                                </div>
                            ) : recentDatasets.length > 0 ? (
                                recentDatasets.map(dataset => renderDatasetCard(dataset))
                            ) : (
                                <div className="col-span-2 text-center py-8 text-muted-foreground">
                                    暂无数据集
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 最新研究成果 */}
                    <div className="space-y-4">
                        <h2 className="text-2xl font-semibold">最新研究成果</h2>
                        <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-1">
                            {outputsLoading ? (
                                <div className="col-span-2 text-center py-8 text-muted-foreground">
                                    加载中...
                                </div>
                            ) : recentOutputs.length > 0 ? (
                                recentOutputs.map((output: any) => (
                                    <div
                                        key={output.id}
                                        className="flex flex-col p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer bg-card"
                                    >
                                        <div className="flex items-start justify-between gap-2 mb-2">
                                            <h3
                                                className="font-medium text-lg leading-tight line-clamp-2 flex-1"
                                                title={output.title}
                                            >
                                                {output.title}
                                            </h3>
                                            <span
                                                className="bg-secondary px-2 py-1 rounded text-xs whitespace-nowrap ml-2">
                        {OutputTypes[output.type as keyof typeof OutputTypes] || output.type}
                      </span>
                                        </div>

                                        {output.abstractText && (
                                            <p className="text-sm text-muted-foreground line-clamp-3 mb-3 flex-1"
                                               title={output.abstractText}>
                                                {output.abstractText}
                                            </p>
                                        )}

                                        <div className="space-y-2 mt-auto">
                                            <div className="flex items-center justify-between text-sm">
                                                <div className="flex items-center gap-1 text-muted-foreground truncate">
                                                    <Users className="h-3 w-3"/>
                                                    <span title={output.submitter?.realName || '未知'}>
                            提交者: {output.submitter?.realName || '未知'}
                          </span>
                                                </div>
                                                <div
                                                    className="flex items-center gap-1 text-muted-foreground whitespace-nowrap ml-2">
                                                    <Calendar className="h-3 w-3"/>
                                                    <span>{formatDate(output.createdAt)}</span>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between">
                                                {output.dataset?.titleCn && (
                                                    <div className="text-xs text-muted-foreground truncate max-w-[60%]"
                                                         title={`基于数据集: ${output.dataset.titleCn}`}>
                                                        基于: {output.dataset.titleCn}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="col-span-2 text-center py-8 text-muted-foreground">
                                    暂无研究成果
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Index;