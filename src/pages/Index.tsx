import { Navigation } from "@/components/Navigation";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { ResearchDirectionChart } from "@/components/dashboard/ResearchDirectionChart";
import { DatasetTypeChart } from "@/components/dashboard/DatasetTypeChart";
import { Database, Users, FileText, TrendingUp } from "lucide-react";
import { useRealtimeStats, useRealtimeQuery } from "@/hooks/useRealtimeQuery";

const Index = () => {
  const { stats, loading: statsLoading } = useRealtimeStats();
  const { data: recentDatasets } = useRealtimeQuery('datasets', {
    select: 'id, title_cn, type, created_at, provider_id, users!datasets_provider_id_fkey(real_name)',
    order: ['created_at', { ascending: false }],
    limit: 3
  });
  const { data: recentOutputs } = useRealtimeQuery('research_outputs', {
    select: 'id, title, type, citation_count, created_at, users!research_outputs_submitter_id_fkey(real_name)',
    order: ['created_at', { ascending: false }],
    limit: 3,
    filter: 'approved.eq.true'  // Only show approved outputs
  });

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
            value={statsLoading ? "..." : stats.datasets.toString()}
            description="已发布的数据集"
            icon={Database}
          />
          <StatsCard
            title="注册用户"
            value={statsLoading ? "..." : stats.users.toLocaleString()}
            description="平台注册用户数"
            icon={Users}
          />
          <StatsCard
            title="研究成果"
            value={statsLoading ? "..." : stats.outputs.toString()}
            description="基于平台数据发表的成果"
            icon={FileText}
          />
          <StatsCard
            title="数据申请"
            value={statsLoading ? "..." : stats.applications.toString()}
            description="本月数据申请数量"
            icon={TrendingUp}
          />
        </div>

        {/* Charts */}
        <div className="grid gap-6 md:grid-cols-3">
          <ResearchDirectionChart />
          <DatasetTypeChart />
        </div>

        {/* Recent Activities */}
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">最新数据集</h2>
            <div className="space-y-3">
              {recentDatasets.map((dataset) => (
                <div key={dataset.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-medium">{dataset.title_cn}</h3>
                    <p className="text-sm text-muted-foreground">
                      {dataset.type} • {new Date(dataset.created_at).toLocaleDateString('zh-CN')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">最新研究成果</h2>
            <div className="space-y-3">
              {recentOutputs.map((output) => (
                <div key={output.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-medium">{output.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {output.type} • 引用数: {output.citation_count || 0}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
