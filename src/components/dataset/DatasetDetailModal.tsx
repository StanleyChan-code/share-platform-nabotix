import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {Info, TrendingUp, BarChart3, FileText, Shield, Clock, Link2, ArrowRight, Building, Badge} from "lucide-react";
import { AnalysisTab } from "./AnalysisTab";
import { OverviewTab } from "./detailmodal/OverviewTab.tsx";
import { StatisticsTab } from "./detailmodal/StatisticsTab.tsx";
import { VersionsTab } from "./detailmodal/VersionsTab.tsx";
import { TermsAndFilesTab } from "./detailmodal/TermsAndFilesTab.tsx";
import { useEffect, useState } from "react";
import { api } from "@/integrations/api/client";

// Helper function to get the latest approved version
const getLatestApprovedVersion = (versions: any[]) => {
  if (!versions || versions.length === 0) return null;
  
  const approvedVersions = versions
    .filter(version => version.approved === true)
    .sort((a, b) => new Date(b.approvedAt).getTime() - new Date(a.approvedAt).getTime());
    
  return approvedVersions.length > 0 ? approvedVersions[0] : null;
};

interface DatasetDetailModalProps {
  dataset: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DatasetDetailModal({ dataset, open, onOpenChange }: DatasetDetailModalProps) {
  const [detailDataset, setDetailDataset] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [institution, setInstitution] = useState<any>(null);
  const [versions, setVersions] = useState<any[]>([]);
  const [statistics, setStatistics] = useState<any[]>([]);

  // Fetch detailed dataset with timeline when modal opens
  useEffect(() => {
    const fetchDetailedDataset = async () => {
      if (!dataset?.id || !open) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Fetch dataset details
        const response = await api.get(`/datasets/${dataset.id}?loadTimeline=true`);
        if (response.data.success) {
          setDetailDataset(response.data.data);
        } else {
          setError('获取数据集详情失败');
        }
        
        // Fetch dataset versions
        const versionsResponse = await api.get(`/datasets/${dataset.id}/versions`);
        if (versionsResponse.data.success) {
          setVersions(versionsResponse.data.data);
        }
        
        // TODO: 需要确定如何获取统计数据，目前API文档中没有明确说明如何获取单个数据集的统计信息
        // 在找到正确的API之前，暂时将statistics设置为空数组
        setStatistics([]);
      } catch (err) {
        console.error('Error fetching detailed dataset:', err);
        setError('获取数据集详情时发生错误');
      } finally {
        setLoading(false);
      }
    };

    fetchDetailedDataset();
  }, [dataset?.id, open]);

  // Fetch institution information when we have the dataset provider ID
  useEffect(() => {
    const fetchInstitution = async () => {
      const currentDataset = detailDataset || dataset;
      if (!currentDataset?.institutionId) return;

      try {
        const response = await api.get(`/institutions/${currentDataset.institutionId}`);
        if (response.data.success) {
          setInstitution(response.data.data);
        }
      } catch (err) {
        console.error('Error fetching institution:', err);
      }
    };

    fetchInstitution();
  }, [detailDataset, dataset]);

  if (!dataset) return null;

  // Use detailed dataset if available, otherwise fallback to passed dataset
  const currentDataset = detailDataset || dataset;
  const parentDataset = currentDataset.parentDatasetId ? currentDataset.parentDataset : null;
  const followups = currentDataset.followUpDatasets || [];

  // Get latest approved version for record and variable counts
  const latestApprovedVersion = getLatestApprovedVersion(currentDataset.versions);
  const recordCount = latestApprovedVersion?.recordCount;
  const variableCount = latestApprovedVersion?.variableCount;

  const demographicFields = currentDataset.demographicFields || [];
  const outcomeFields = currentDataset.outcomeFields || [];
  const stats = statistics || [];

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">加载中...</DialogTitle>
          </DialogHeader>
          <div className="py-8 text-center">
            <p className="text-muted-foreground">正在加载数据集详情...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (error) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">加载失败</DialogTitle>
          </DialogHeader>
          <div className="py-8 text-center">
            <p className="text-red-500">{error}</p>
            <Button onClick={() => onOpenChange(false)} className="mt-4">关闭</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            {currentDataset.titleCn}
          </DialogTitle>
          
          {/* Navigation Links for Baseline/Follow-up */}
          {(parentDataset || followups.length > 0) && (
            <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t">
              {parentDataset && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => {
                    onOpenChange(false);
                    // Open parent dataset in a new modal
                    setTimeout(() => {
                      const event = new CustomEvent('openDatasetDetail', { detail: parentDataset });
                      window.dispatchEvent(event);
                    }, 100);
                  }}
                >
                  <Link2 className="h-4 w-4" />
                  查看基线数据集
                  <ArrowRight className="h-3 w-3" />
                </Button>
              )}
              
              {followups.length > 0 && (
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="text-sm text-muted-foreground">随访数据集:</span>
                  {[...followups]
                    .sort((a, b) => new Date(a.firstPublishedDate).getTime() - new Date(b.firstPublishedDate).getTime())
                    .map((followup: any) => (
                      <Button
                        key={followup.id}
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        onClick={() => {
                          onOpenChange(false);
                          // Open follow-up dataset in a new modal
                          setTimeout(() => {
                            const event = new CustomEvent('openDatasetDetail', { detail: followup });
                            window.dispatchEvent(event);
                          }, 100);
                        }}
                      >
                        <Link2 className="h-4 w-4" />
                        {followup.titleCn}
                        <ArrowRight className="h-3 w-3" />
                      </Button>
                    ))}
                </div>
              )}
            </div>
          )}
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview" className="gap-2">
              <Info className="h-4 w-4" />
              概述
            </TabsTrigger>
            <TabsTrigger value="statistics" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              统计数据
            </TabsTrigger>
            <TabsTrigger value="analysis" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              分析
            </TabsTrigger>
            <TabsTrigger value="termsandfiles" className="gap-2">
              <Shield className="h-4 w-4" />
              条款与文件
            </TabsTrigger>
            <TabsTrigger value="versions" className="gap-2">
              <Clock className="h-4 w-4" />
              版本信息
            </TabsTrigger>
          </TabsList>

          {/* (1) Overview Tab */}
          <TabsContent value="overview" className="space-y-6 mt-4">
            <OverviewTab 
              dataset={currentDataset}
              recordCount={recordCount}
              variableCount={variableCount}
              demographicFields={demographicFields}
              outcomeFields={outcomeFields}
              institution={institution}
            />
          </TabsContent>

          {/* (2) Analysis Tab */}
          <TabsContent value="analysis" className="mt-4">
            <AnalysisTab datasetId={currentDataset.id} />
          </TabsContent>

          {/* (3) Statistics Tab */}
          <TabsContent value="statistics" className="space-y-4 mt-4">
            <StatisticsTab 
              statistics={stats}
              demographicFields={demographicFields}
              outcomeFields={outcomeFields}
            />
          </TabsContent>

          {/* Terms and Files Tab */}
          <TabsContent value="termsandfiles" className="space-y-4 mt-4">
            <TermsAndFilesTab dataset={currentDataset} />
          </TabsContent>

          {/* (4) Versions Tab */}
          <TabsContent value="versions" className="space-y-4 mt-4">
            <VersionsTab 
              versions={versions || []}
              currentVersionNumber={currentDataset.versionNumber}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}