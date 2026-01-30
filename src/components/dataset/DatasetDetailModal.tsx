import {Dialog, DialogContent, DialogHeader, DialogTitle} from "@/components/ui/dialog";
import {Button} from "@/components/ui/button";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {Info, TrendingUp, FileText, Shield, Clock, Link2, ArrowRight} from "lucide-react";
import {OverviewTab} from "@/components/dataset/detailmodal/OverviewTab.tsx";
import {StatisticsTab} from "@/components/dataset/detailmodal/StatisticsTab.tsx";
import {VersionsTab} from "@/components/dataset/detailmodal/VersionsTab.tsx";
import {TermsAndFilesTab} from "@/components/dataset/detailmodal/TermsAndFilesTab.tsx";
import {ResearchOutputsTab} from "@/components/dataset/detailmodal/ResearchOutputsTab.tsx";
import {useEffect, useState} from "react";
import {api, ApiResponse} from "@/integrations/api/client";
import {ScrollArea} from "@radix-ui/react-scroll-area";
import {Dataset, datasetApi} from "@/integrations/api/datasetApi.ts";
import {getLatestApprovedVersion} from "@/lib/datasetUtils.ts";

interface DatasetDetailModalProps {
    dataset: any;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    useAdvancedQuery?: boolean; // 控制是否使用高级查询
    onDatasetUpdated?: () => void; // 数据集更新后的回调函数
    defaultTab?: string; // 默认显示的标签页
}

export function DatasetDetailModal({
                                       dataset,
                                       open,
                                       onOpenChange,
                                       useAdvancedQuery = false,
                                       onDatasetUpdated,
                                       defaultTab: propDefaultTab = 'overview'
                                   }: DatasetDetailModalProps) {
    const [detailDataset, setDetailDataset] = useState<any>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [institution, setInstitution] = useState<any>(null);
    const [versions, setVersions] = useState<any[]>([]);
    const [parentDataset, setParentDataset] = useState<Dataset>(null);
    const [followUpModals, setFollowUpModals] = useState<{ [key: string]: boolean }>({}); // 管理随访数据集对话框
    const [defaultTab, setDefaultTab] = useState<string>(propDefaultTab);

    // 更新默认标签页当外部属性变化时
    useEffect(() => {
        setDefaultTab(propDefaultTab);
    }, [propDefaultTab]);

    // Fetch detailed dataset with timeline when modal opens
    useEffect(() => {
        const fetchDetailedDataset = async () => {
            if (!dataset?.id || !open) return;

            try {
                setLoading(true);
                setError(null);

                let datasetResponse: ApiResponse<Dataset>;
                if (useAdvancedQuery) {
                    // 使用高级查询接口获取数据集详情
                    datasetResponse = await datasetApi.getManageableDatasetById(dataset.id);
                    setDetailDataset(datasetResponse.data || datasetResponse);
                } else {
                    // Fetch dataset details
                    const response = await api.get(`/datasets/${dataset.id}?loadTimeline=true`);
                    if (response.data.success) {
                        setDetailDataset(response.data.data);
                    } else {
                        setError('获取数据集详情失败');
                    }

                    datasetResponse = response.data;
                }
                setVersions(datasetResponse?.data?.versions);

                // 加载基线数据集
                if (datasetResponse?.data?.parentDatasetId) {
                    const parentId = datasetResponse?.data?.parentDatasetId;
                    try {
                        // 如果是高级查询模式，使用管理API查询基线数据集
                        if (useAdvancedQuery) {
                            const parentDatasetResponse = await datasetApi.getManageableDatasetById(parentId);
                            setParentDataset(parentDatasetResponse.data);
                        } else {
                            const parentDatasetResponse = await datasetApi.getDatasetById(parentId);
                            if (parentDatasetResponse.success) {
                                setParentDataset(parentDatasetResponse.data);
                            }
                        }
                    } catch (err) {
                        console.error('Error fetching parent dataset:', err);
                    }
                }

                // 检查是否有待审核的版本，如果是高级查询模式，则默认跳转到版本标签页
                if (useAdvancedQuery && datasetResponse?.data?.versions) {

                    const hasPendingVersion = datasetResponse?.data?.versions.some(
                        (version: any) =>
                            version.institutionApproved === null ||
                            (version.institutionApproved && version.approved === null)
                    );

                    if (hasPendingVersion) {
                        setDefaultTab('versions');
                    } else {
                        setDefaultTab(propDefaultTab); // 使用传入的默认标签页
                    }
                } else {
                    setDefaultTab(propDefaultTab); // 使用传入的默认标签页
                }
            } catch (err) {
                console.error('Error fetching detailed dataset:', err);
                setError('获取数据集详情时发生错误');
            } finally {
                setLoading(false);
            }
        };

        fetchDetailedDataset();
    }, [dataset?.id, open, useAdvancedQuery, propDefaultTab]);

    // Clear data when modal closes
    useEffect(() => {
        if (!open) {
            // Reset all state to initial values
            setDetailDataset(null);
            setVersions([]);
            setInstitution(null);
            setParentDataset(null);
            setError(null);
            setLoading(true);
        }
    }, [open]);

    // 更新默认标签页当属性变化时
    useEffect(() => {
        if (propDefaultTab) {
            setDefaultTab(propDefaultTab);
        }
    }, [propDefaultTab]);

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
    const followups = currentDataset.followUpDatasets || [];

    // Get latest approved version for record and variable counts
    const latestApprovedVersion = getLatestApprovedVersion(currentDataset.versions);
    const recordCount = latestApprovedVersion?.recordCount;
    const variableCount = latestApprovedVersion?.variableCount;

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

    // 处理打开随访数据集对话框
    const handleOpenFollowUp = (followup: any) => {
        setFollowUpModals(prev => ({
            ...prev,
            [followup.id]: true
        }));
    };

    // 处理关闭随访数据集对话框
    const handleCloseFollowUp = (followupId: string) => {
        setFollowUpModals(prev => {
            const newModals = {...prev};
            delete newModals[followupId];
            return newModals;
        });
    };


    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-5xl h-[85vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                        <DialogTitle className="text-2xl flex items-start gap-2">
                            {currentDataset.titleCn}
                            {currentDataset.parentDatasetId && (
                                <span className="text-sm text-muted-foreground">随访数据集</span>
                            )}
                        </DialogTitle>

                        {/* Navigation Links for Baseline/Follow-up */}
                        {(followups.length > 0) && (
                            <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t">
                                <div className="flex flex-wrap gap-2 items-center">
                                    <span className="text-sm text-muted-foreground">随访数据集:</span>
                                    {[...followups]
                                        .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
                                        .map((followup: any) => (
                                            <Button
                                                key={followup.id}
                                                variant="outline"
                                                size="sm"
                                                className="gap-2"
                                                onClick={() => handleOpenFollowUp(followup)}
                                            >
                                                <Link2 className="h-4 w-4"/>
                                                {followup.titleCn}
                                                <ArrowRight className="h-3 w-3"/>
                                            </Button>
                                        ))}
                                </div>
                            </div>
                        )}
                    </DialogHeader>

                    <div className="flex-1 overflow-hidden overflow-y-auto">
                        <ScrollArea className="h-full w-full pr-4">
                            <Tabs defaultValue={defaultTab} className="w-full">
                                <TabsList className="grid w-full grid-cols-5">
                                    <TabsTrigger value="overview" className="gap-2">
                                        <Info className="h-4 w-4"/>
                                        概述
                                    </TabsTrigger>
                                    <TabsTrigger value="statistics" className="gap-2">
                                        <TrendingUp className="h-4 w-4"/>
                                        统计数据
                                    </TabsTrigger>
                                    {/*<TabsTrigger value="analysis" className="gap-2">*/}
                                    {/*    <BarChart3 className="h-4 w-4"/>*/}
                                    {/*    分析*/}
                                    {/*</TabsTrigger>*/}
                                    <TabsTrigger value="researchoutputs" className="gap-2">
                                        <FileText className="h-4 w-4"/>
                                        研究成果
                                    </TabsTrigger>
                                    <TabsTrigger value="termsandfiles" className="gap-2">
                                        <Shield className="h-4 w-4"/>
                                        条款与文件
                                    </TabsTrigger>
                                    <TabsTrigger value="versions" className="gap-2 relative">
                                        <Clock className="h-4 w-4"/>
                                        版本信息
                                        {useAdvancedQuery && versions.some(version => version.approved === null) && (
                                            <span
                                                className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-red-500"></span>
                                        )}
                                    </TabsTrigger>
                                </TabsList>

                                {/* (1) Overview Tab */}
                                <TabsContent value="overview" className="space-y-6 mt-4">
                                    <OverviewTab
                                        dataset={currentDataset}
                                        recordCount={recordCount}
                                        variableCount={variableCount}
                                        institution={institution}
                                        parentDataset={parentDataset}
                                        useAdvancedQuery={useAdvancedQuery}
                                        onEditDataset={(updatedDataset) => {
                                            // 更新当前数据集状态
                                            setDetailDataset(updatedDataset);
                                            onDatasetUpdated?.(); // 调用回调通知数据集已更新
                                        }}
                                    />
                                </TabsContent>

                                {/* (3) Statistics Tab */}
                                <TabsContent value="statistics" className="space-y-4 mt-4">
                                    <StatisticsTab useAdvancedQuery={useAdvancedQuery}
                                                   versions={currentDataset.versions}
                                                   dataset={currentDataset}/>
                                </TabsContent>

                                {/* Research Outputs Tab */}
                                <TabsContent value="researchoutputs" className="space-y-4 mt-4">
                                    <ResearchOutputsTab datasetId={currentDataset.id}/>
                                </TabsContent>

                                {/* Terms and Files Tab */}
                                <TabsContent value="termsandfiles" className="space-y-4 mt-4">
                                    <TermsAndFilesTab dataset={currentDataset} useAdvancedQuery={useAdvancedQuery}/>
                                </TabsContent>

                                {/* (4) Versions Tab */}
                                <TabsContent value="versions" className="space-y-4 mt-4">
                                    <VersionsTab
                                        versions={versions}
                                        currentVersionNumber={currentDataset.versionNumber}
                                        showAllVersions={useAdvancedQuery} // 传递参数控制是否显示所有版本
                                        useAdvancedQuery={useAdvancedQuery} // 传递参数控制是否使用高级查询
                                        dataset={currentDataset} // 传递数据集
                                        onVersionAdded={() => {
                                            // 重新加载数据集和版本信息
                                            const reloadDatasetAndVersions = async () => {
                                                try {
                                                    let datasetResponse: ApiResponse<Dataset>;
                                                    if (useAdvancedQuery) {
                                                        // 使用高级查询接口获取数据集详情
                                                        datasetResponse = await datasetApi.getManageableDatasetById(dataset.id);
                                                        setDetailDataset(datasetResponse.data || datasetResponse);
                                                    } else {
                                                        // Fetch dataset details
                                                        const response = await datasetApi.getDatasetById(dataset.id);
                                                        if (response.success) {
                                                            setDetailDataset(response.data);
                                                        } else {
                                                            setError('获取数据集详情失败');
                                                        }
                                                    }

                                                    // Fetch dataset versions
                                                    const versionsResponse = await api.get(`/datasets/${dataset.id}/versions`);
                                                    if (versionsResponse.data.success) {
                                                        setVersions(versionsResponse.data.data);
                                                    }
                                                } catch (err) {
                                                    console.error('Error reloading dataset and versions:', err);
                                                }
                                            };

                                            reloadDatasetAndVersions();

                                            // 调用回调通知数据集已更新
                                            onDatasetUpdated?.();
                                        }}
                                    />
                                </TabsContent>
                            </Tabs>
                        </ScrollArea>
                    </div>
                </DialogContent>
            </Dialog>

            {/* 渲染随访数据集对话框 */}
            {followups.map((followup: any) => (
                <DatasetDetailModal
                    key={followup.id}
                    dataset={followup}
                    open={!!followUpModals[followup.id]}
                    onOpenChange={(open) => {
                        if (!open) {
                            handleCloseFollowUp(followup.id);
                        }
                    }}
                    useAdvancedQuery={useAdvancedQuery} // 传递给子组件
                    onDatasetUpdated={onDatasetUpdated} // 传递给子组件
                />
            ))}
        </>
    );
}