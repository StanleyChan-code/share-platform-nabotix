import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle} from "@/components/ui/dialog";
import {Button} from "@/components/ui/button";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {Info, TrendingUp, BarChart3, FileText, Shield, Clock, Link2, ArrowRight, Building, Badge, CheckCircle, ClockIcon, XCircle} from "lucide-react";
import {AnalysisTab} from "./AnalysisTab";
import {OverviewTab} from "./detailmodal/OverviewTab.tsx";
import {StatisticsTab} from "./detailmodal/StatisticsTab.tsx";
import {VersionsTab} from "./detailmodal/VersionsTab.tsx";
import {TermsAndFilesTab} from "./detailmodal/TermsAndFilesTab.tsx";
import {useEffect, useState} from "react";
import {api} from "@/integrations/api/client";
import {getDatasetStatisticsByVersionId} from "@/integrations/api/statisticsApi.ts";
import pako from 'pako';
import {ScrollArea} from "@radix-ui/react-scroll-area";
import {Dataset, datasetApi, DatasetVersion} from "@/integrations/api/datasetApi.ts";

// Helper function to get the latest approved version
const getLatestApprovedVersion = (versions: DatasetVersion[]) => {
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
    useAdvancedQuery?: boolean; // 新增属性，控制是否使用高级查询
}

export function DatasetDetailModal({dataset, open, onOpenChange, useAdvancedQuery = false}: DatasetDetailModalProps) {
    const [detailDataset, setDetailDataset] = useState<any>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [institution, setInstitution] = useState<any>(null);
    const [versions, setVersions] = useState<any[]>([]);
    const [statistics, setStatistics] = useState<any[]>([]);
    const [totalRows, setTotalRows] = useState<number>(0);
    const [demographicFields, setDemographicFields] = useState<any[]>([]);
    const [outcomeFields, setOutcomeFields] = useState<any[]>([]);
    const [parentDataset, setParentDataset] = useState<Dataset>(null);
    const [followUpModals, setFollowUpModals] = useState<{ [key: string]: boolean }>({}); // 管理随访数据集对话框
    const [selectedStatVersion, setSelectedStatVersion] = useState<DatasetVersion | null>(null); // 新增状态用于跟踪选中的统计数据版本

    // Fetch detailed dataset with timeline when modal opens
    useEffect(() => {
        const fetchDetailedDataset = async () => {
            if (!dataset?.id || !open) return;

            try {
                setLoading(true);
                setError(null);

                let datasetResponse;
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

                    datasetResponse = response.data.data;
                }

                // Fetch dataset versions
                const versionsResponse = await api.get(`/datasets/${dataset.id}/versions`);
                if (versionsResponse.data.success) {
                    setVersions(versionsResponse.data.data);
                }

                // 加载基线数据集
                if ((datasetResponse?.data || datasetResponse)?.parentDatasetId) {
                    const parentId = (datasetResponse?.data || datasetResponse)?.parentDatasetId;
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
            } catch (err) {
                console.error('Error fetching detailed dataset:', err);
                setError('获取数据集详情时发生错误');
            } finally {
                setLoading(false);
            }
        };

        fetchDetailedDataset();
    }, [dataset?.id, open, useAdvancedQuery]);

    // Clear data when modal closes
    useEffect(() => {
        if (!open) {
            // Reset all state to initial values
            setDetailDataset(null);
            setVersions([]);
            setStatistics([]);
            setTotalRows(0);
            setDemographicFields([]);
            setOutcomeFields([]);
            setInstitution(null);
            setParentDataset(null);
            setError(null);
            setLoading(true);
            setSelectedStatVersion(null); // 重置选中的统计数据版本
        }
    }, [open]);

    // 当数据集详情加载完成时，获取统计数据
    useEffect(() => {
        const fetchStatistics = async () => {
            if (!detailDataset) return;

            try {
                let version;
                if (useAdvancedQuery && detailDataset.versions && detailDataset.versions.length > 0) {
                    // 如果使用高级查询且有选中的统计版本，则使用选中的版本
                    version = selectedStatVersion || detailDataset.versions[detailDataset.versions.length-1];
                } else {
                    // 获取最新批准的版本
                    const latestApprovedVersion = getLatestApprovedVersion(detailDataset.versions);
                    if (!latestApprovedVersion) return;
                    version = latestApprovedVersion;
                }

                // 根据版本ID获取统计数据
                const statsResponse = await getDatasetStatisticsByVersionId(version.id);

                if (statsResponse.data.success && statsResponse.data.data.statisticalFile) {
                    // 解码Base64编码并解压GZIP压缩的统计数据
                    const binaryString = atob(statsResponse.data.data.statisticalFile);
                    const compressedData = new Uint8Array(binaryString.length);
                    for (let i = 0; i < binaryString.length; i++) {
                        compressedData[i] = binaryString.charCodeAt(i);
                    }

                    // 使用pako解压GZIP数据
                    const decompressedData = pako.inflate(compressedData, {to: 'string'});
                    const decodedStats = JSON.parse(decompressedData);
                    setStatistics(decodedStats);
                }
                setTotalRows(version.recordCount);
                // 设置人口统计学和结果字段
                setDemographicFields(detailDataset.demographicFields || []);
                setOutcomeFields(detailDataset.outcomeFields || []);
            } catch (err) {
                console.error('Error fetching statistics:', err);
                // 即使统计数据获取失败，也不应该阻止其他内容显示
            }
        };

        fetchStatistics();
    }, [detailDataset, selectedStatVersion]); // 添加 selectedStatVersion 作为依赖项

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

    // 处理统计数据版本选择
    const handleStatVersionChange = (versionId: string) => {
        const version = currentDataset.versions.find((v: DatasetVersion) => v.id === versionId);
        if (version) {
            setSelectedStatVersion(version);
        }
    };

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

    // 获取当前选中的统计版本，如果没有则默认为最后一个版本（针对高级查询）或者最新的已批准版本
    const currentStatVersion = useAdvancedQuery 
        ? (selectedStatVersion || (currentDataset.versions && currentDataset.versions.length > 0 
            ? currentDataset.versions[currentDataset.versions.length - 1] 
            : null))
        : latestApprovedVersion;

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-5xl h-[85vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                        <DialogTitle className="text-2xl flex items-center gap-2">
                            {currentDataset.titleCn}
                            {currentDataset.parentDatasetId && (
                                <span className="text-sm text-muted-foreground">（随访数据集）</span>
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
                            <Tabs defaultValue="overview" className="w-full">
                                <TabsList className="grid w-full grid-cols-4">
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
                                    <TabsTrigger value="termsandfiles" className="gap-2">
                                        <Shield className="h-4 w-4"/>
                                        条款与文件
                                    </TabsTrigger>
                                    <TabsTrigger value="versions" className="gap-2">
                                        <Clock className="h-4 w-4"/>
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
                                        parentDataset={useAdvancedQuery ? parentDataset : null} // 仅在高级查询模式下传递父数据集
                                    />
                                </TabsContent>

                                {/* (2) Analysis Tab */}
                                <TabsContent value="analysis" className="mt-4">
                                    <AnalysisTab datasetId={currentDataset.id}/>
                                </TabsContent>

                                {/* (3) Statistics Tab */}
                                <TabsContent value="statistics" className="space-y-4 mt-4">
                                    {/* 版本选择器 - 仅在使用高级查询时显示 */}
                                    {useAdvancedQuery && currentDataset.versions && currentDataset.versions.length > 0 && (
                                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                                <div>
                                                    <h3 className="font-medium text-gray-900">统计数据版本选择</h3>
                                                    <p className="text-sm text-gray-500 mt-1">
                                                        选择要查看统计数据的版本
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <select
                                                        value={currentStatVersion?.id || ""}
                                                        onChange={(e) => handleStatVersionChange(e.target.value)}
                                                        className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                    >
                                                        {currentDataset.versions
                                                            .slice()
                                                            .sort((a: DatasetVersion, b: DatasetVersion) => 
                                                                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                                                            )
                                                            .map((version: DatasetVersion) => (
                                                                <option key={version.id} value={version.id}>
                                                                    版本 {version.versionNumber} ({new Date(version.createdAt).toLocaleDateString()})
                                                                </option>
                                                            ))}
                                                    </select>
                                                    
                                                    {/* 版本状态指示器 */}
                                                    {currentStatVersion && (
                                                        <div className="flex items-center gap-1.5 bg-white px-3 py-2 rounded-md border border-gray-200">
                                                            {currentStatVersion.approved === true ? (
                                                                <>
                                                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                                                    <span className="text-sm font-medium text-green-700">已审核</span>
                                                                </>
                                                            ) : currentStatVersion.approved === false ? (
                                                                <>
                                                                    <XCircle className="h-4 w-4 text-red-500" />
                                                                    <span className="text-sm font-medium text-red-700">已拒绝</span>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <ClockIcon className="h-4 w-4 text-yellow-500" />
                                                                    <span className="text-sm font-medium text-yellow-700">待审核</span>
                                                                </>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    
                                    <StatisticsTab
                                        stats={statistics}
                                        demographicFields={demographicFields}
                                        outcomeFields={outcomeFields}
                                        totalRows={totalRows}
                                    />
                                </TabsContent>

                                {/* Terms and Files Tab */}
                                <TabsContent value="termsandfiles" className="space-y-4 mt-4">
                                    <TermsAndFilesTab dataset={currentDataset} useAdvancedQuery={useAdvancedQuery} />
                                </TabsContent>

                                {/* (4) Versions Tab */}
                                <TabsContent value="versions" className="space-y-4 mt-4">
                                    <VersionsTab
                                        versions={versions}
                                        currentVersionNumber={currentDataset.versionNumber}
                                        showAllVersions={useAdvancedQuery} // 传递参数控制是否显示所有版本
                                        useAdvancedQuery={useAdvancedQuery} // 传递参数控制是否使用高级查询
                                        datasetId={currentDataset.id} // 传递数据集ID
                                        onVersionAdded={() => {
                                            // 重新加载版本信息
                                            api.get(`/datasets/${dataset.id}/versions`).then(response => {
                                                if (response.data.success) {
                                                    setVersions(response.data.data);
                                                }
                                            }).catch(err => {
                                                console.error('Error reloading versions:', err);
                                            });
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
                />
            ))}
        </>
    );
}