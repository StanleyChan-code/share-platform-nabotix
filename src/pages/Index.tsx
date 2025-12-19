import { Navigation } from "@/components/Navigation";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { ResearchDirectionChart } from "@/components/dashboard/ResearchDirectionChart";
import { DatasetTypeChart } from "@/components/dashboard/DatasetTypeChart";
import { Database, Users, FileText, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { getPlatformStatistics } from "@/integrations/api/statisticsApi";
import { api } from "@/integrations/api/client";
import { DatasetTypes, OutputTypes } from "@/lib/enums";
import {formatDate} from "@/lib/utils.ts";
import {Dataset} from "@/integrations/api/datasetApi.ts";

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
        const response = await api.get('/datasets/query?size=6&sortBy=currentVersionDate&sortDir=desc');
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
        const response = await api.get('/research-outputs/public?size=6&sortBy=createdAt&sortDir=desc');
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
            <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
              {datasetsLoading ? (
                <div className="col-span-2 text-center py-8 text-muted-foreground">
                  加载中...
                </div>
              ) : recentDatasets && recentDatasets.length > 0 ? (
                recentDatasets.map((dataset: Dataset) => (
                  <div 
                    key={dataset.id} 
                    className="flex flex-col p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 
                        className="font-medium text-lg leading-tight truncate" 
                        title={dataset.titleCn}
                      >
                        {dataset.titleCn}
                      </h3>
                      <span className="bg-secondary px-2 py-1 rounded text-xs whitespace-nowrap ml-2">
                        {DatasetTypes[dataset.type as keyof typeof DatasetTypes] || dataset.type}
                      </span>
                    </div>
                    
                    {dataset.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3" title={dataset.description}>
                        {dataset.description}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-muted-foreground truncate" title={dataset.provider?.realName || '未知'}>
                        提供者: {dataset.provider?.realName || '未知'}
                      </span>
                      <span className="text-muted-foreground whitespace-nowrap ml-2">
                        {formatDate(dataset.currentVersionDate || dataset.createdAt)}
                      </span>
                    </div>
                    
                    {dataset.dataCollectionUnit && (
                      <div className="text-xs text-muted-foreground truncate mb-1" title={`采集单位: ${dataset.dataCollectionUnit}`}>
                        采集单位: {dataset.dataCollectionUnit}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="col-span-2 text-center py-8 text-muted-foreground">
                  暂无数据集
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">最新研究成果</h2>
            <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
              {outputsLoading ? (
                <div className="col-span-2 text-center py-8 text-muted-foreground">
                  加载中...
                </div>
              ) : recentOutputs && recentOutputs.length > 0 ? (
                recentOutputs.map((output: any) => (
                  <div 
                    key={output.id} 
                    className="flex flex-col p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 
                        className="font-medium text-lg leading-tight truncate" 
                        title={output.title}
                      >
                        {output.title}
                      </h3>
                      <span className="bg-secondary px-2 py-1 rounded text-xs whitespace-nowrap ml-2">
                        {OutputTypes[output.type as keyof typeof OutputTypes] || output.type}
                      </span>
                    </div>
                    
                    {output.abstractText && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3" title={output.abstractText}>
                        {output.abstractText}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-muted-foreground truncate" title={output.submitter?.realName || '未知'}>
                        提交者: {output.submitter?.realName || '未知'}
                      </span>
                      <span className="text-muted-foreground whitespace-nowrap ml-2">
                        {formatDate(output.createdAt)}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      {output.dataset?.titleCn && (
                        <div className="text-xs text-muted-foreground truncate max-w-[60%]" title={`基于数据集: ${output.dataset.titleCn}`}>
                          基于: {output.dataset.titleCn}
                        </div>
                      )}
                      <span className="inline-flex items-center gap-1 text-sm">
                        <TrendingUp className="h-4 w-4" />
                        {output.citationCount || 0}
                      </span>
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