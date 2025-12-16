import { Navigation } from "@/components/Navigation";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { ResearchDirectionChart } from "@/components/dashboard/ResearchDirectionChart";
import { DatasetTypeChart } from "@/components/dashboard/DatasetTypeChart";
import { Database, Users, FileText, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { getPlatformStatistics } from "@/integrations/api/statisticsApi";
import { api } from "@/integrations/api/client";
import { DatasetTypes, OutputTypes } from "@/lib/enums";

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
  const [recentDatasets, setRecentDatasets] = useState<any[]>([]);
  const [recentOutputs, setRecentOutputs] = useState<any[]>([]);
  const [datasetsLoading, setDatasetsLoading] = useState(true);
  const [outputsLoading, setOutputsLoading] = useState(true);
  
  useEffect(() => {
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
        const response = await api.get('/datasets/query?size=3');
        if (response.data.success) {
          setRecentDatasets(response.data.data.content);
        }
      } catch (error) {
        console.error('Error fetching recent datasets:', error);
      } finally {
        setDatasetsLoading(false);
      }
    };

    const fetchRecentOutputs = async () => {
      try {
        setOutputsLoading(true);
        const response = await api.get('/research-outputs/public?size=3&sortBy=createdAt&sortDir=desc');
        if (response.data.success) {
          setRecentOutputs(response.data.data.content);
        }
      } catch (error) {
        console.error('Error fetching recent outputs:', error);
      } finally {
        setOutputsLoading(false);
      }
    };

    fetchStats();
    fetchRecentDatasets();
    fetchRecentOutputs();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
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
          <ResearchDirectionChart />
          <DatasetTypeChart data={stats?.datasetCountByType} />
        </div>

        {/* Recent Activities */}
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">最新数据集</h2>
            <div className="space-y-3">
              {datasetsLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  加载中...
                </div>
              ) : recentDatasets && recentDatasets.length > 0 ? (
                recentDatasets.map((dataset: any) => (
                  <div key={dataset.id} className="flex flex-col p-4 border rounded-lg hover:shadow-md transition-shadow">
                    <h3 className="font-medium text-lg mb-2 truncate">{dataset.titleCn.length > 30 ? `${dataset.titleCn.substring(0, 30)}...` : dataset.titleCn}</h3>
                    <div className="flex justify-between items-center mb-2">
                      <span className="bg-secondary px-2 py-1 rounded text-xs">
                        {DatasetTypes[dataset.type as keyof typeof DatasetTypes] || dataset.type}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {new Date(dataset.createdAt).toLocaleDateString('zh-CN')}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex flex-col w-full">
                        {dataset.provider?.institution?.fullName && (
                          <span className="text-sm text-muted-foreground truncate" title={dataset.provider.institution.fullName}>
                            机构: {dataset.provider.institution.fullName.length > 30 ? `${dataset.provider.institution.fullName.substring(0, 30)}...` : dataset.provider.institution.fullName}
                          </span>
                        )}
                        {dataset.subjectArea?.name && (
                          <span className="text-sm text-muted-foreground truncate" title={dataset.subjectArea.name}>
                            学科: {dataset.subjectArea.name.length > 30 ? `${dataset.subjectArea.name.substring(0, 30)}...` : dataset.subjectArea.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  暂无数据集
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">最新研究成果</h2>
            <div className="space-y-3">
              {outputsLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  加载中...
                </div>
              ) : recentOutputs && recentOutputs.length > 0 ? (
                recentOutputs.map((output: any) => (
                  <div key={output.id} className="flex flex-col p-4 border rounded-lg hover:shadow-md transition-shadow">
                    <h3 className="font-medium text-lg mb-2 truncate">{output.title.length > 30 ? `${output.title.substring(0, 30)}...` : output.title}</h3>
                    <div className="flex justify-between items-center mb-2">
                      <span className="bg-secondary px-2 py-1 rounded text-xs">
                        {OutputTypes[output.type as keyof typeof OutputTypes] || output.type}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {new Date(output.createdAt).toLocaleDateString('zh-CN')}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground truncate" title={output.submitter?.realName || '未知'}>
                        提交者: {(output.submitter?.realName || '未知').length > 30 ? `${(output.submitter?.realName || '未知').substring(0, 30)}...` : (output.submitter?.realName || '未知')}
                      </span>
                      <span className="inline-flex items-center gap-1 text-sm">
                        引用数: {output.citationCount || 0}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
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