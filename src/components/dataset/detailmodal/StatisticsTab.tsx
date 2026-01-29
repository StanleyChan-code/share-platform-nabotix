import React, {useEffect, useState} from 'react';
import {CheckCircle, ChevronDown, ChevronRight, ClockIcon, Download, Filter, Layers, XCircle} from 'lucide-react';
import {toast} from "@/hooks/use-toast.ts";
import {DatasetVersion} from '@/integrations/api/datasetApi.ts';
import {getDatasetStatisticsByVersionId} from '@/integrations/api/statisticsApi.ts';
import pako from 'pako';
import {getLatestApprovedVersion} from "@/lib/datasetUtils.ts";
import {formatDate} from "@/lib/utils.ts";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select.tsx";
import {api} from "@/integrations/api/client.ts";
import {useNavigate} from "react-router-dom";
import {Button} from "@/components/ui/button.tsx";
import {AlertTriangle} from "lucide-react";
import {redirectToAuth} from "@/lib/authUtils.ts";

interface StatisticsTabProps {
    versions?: DatasetVersion[],
    onVersionChange?: (versionId: string) => void,
    useAdvancedQuery?: boolean,
    dataset: any
}

import {ColumnStats, StatisticsContent} from './StatisticsContent.tsx';

export function StatisticsTab({
                                  versions,
                                  onVersionChange,
                                  useAdvancedQuery,
                                  dataset
                              }: StatisticsTabProps) {
    const [stats, setStats] = useState<ColumnStats[]>([]);
    const [totalRows, setTotalRows] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(false);
    const [selectedVersion, setSelectedVersion] = useState<any>(null);
    const navigate = useNavigate();

    // 检查用户是否已认证
    const isAuthenticated = api.isAuthenticated();

    // 在 useEffect 中设置选中的版本，避免在渲染过程中设置状态
    useEffect(() => {
        if (versions && versions.length > 0) {
            const latestApproved = getLatestApprovedVersion(versions);
            setSelectedVersion(latestApproved);
        }
    }, [versions]);

    // 当选中的版本发生变化时，重新获取统计数据
    useEffect(() => {
        const fetchStatistics = async () => {
            // 如果用户未登录，不加载统计数据
            if (!isAuthenticated) {
                return;
            }

            if (!selectedVersion) {
                setStats([]);
                setTotalRows(0);
                return;
            }

            try {
                setLoading(true);
                // 根据版本ID获取统计数据
                const statsResponse = await getDatasetStatisticsByVersionId(selectedVersion.id);

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
                    setStats(decodedStats);
                }
                setTotalRows(selectedVersion.recordCount || 0);
            } catch (err) {
                console.error('Error fetching statistics:', err);
                toast({
                    title: "加载失败",
                    description: "获取统计数据时发生错误",
                    variant: "destructive"
                });
                setStats([]);
                setTotalRows(0);
            } finally {
                setLoading(false);
            }
        };

        fetchStatistics();
    }, [selectedVersion]);

    // 处理版本选择变化
    const handleVersionChange = (versionId: string) => {
        if (versions) {
            const selected = versions.find(v => v.id === versionId);
            if (selected) {
                setSelectedVersion(selected);
                // 调用父组件的回调函数（如果有）
                if (onVersionChange) {
                    onVersionChange(versionId);
                }
            }
        }
    };


    if (loading) {
        return (
            <div className="w-full space-y-6 flex items-center justify-center h-64">
                <p className="text-muted-foreground">正在加载统计数据...</p>
            </div>
        );
    }


    return (
        <div className="w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* 版本选择器 - 仅在提供了版本信息时显示 */}
            {useAdvancedQuery && versions && versions.length > 0 && (
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h3 className="font-medium text-gray-900">统计数据版本选择</h3>
                            <p className="text-sm text-gray-500 mt-1">
                                选择要查看统计数据的版本
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Select
                                value={selectedVersion?.id || ""}
                                onValueChange={(value) => handleVersionChange(value)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="请选择版本"/>
                                </SelectTrigger>
                                <SelectContent>
                                    {[...versions].sort((a, b) =>
                                        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                                    ).map((version) => (
                                        <SelectItem key={version.id} value={version.id}>
                                            版本 {version.versionNumber} ({formatDate(version.createdAt)})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            {/* 版本状态指示器 */}
                            {selectedVersion && (
                                <div
                                    className="inline-flex items-center gap-1.5 bg-white px-3 py-2 rounded-md border border-gray-200 whitespace-nowrap">
                                    {selectedVersion.approved === true ? (
                                        <>
                                            <CheckCircle className="h-4 w-4 text-green-500"/>
                                            <span className="text-sm font-medium text-green-700">已审核</span>
                                        </>
                                    ) : selectedVersion.approved === false ? (
                                        <>
                                            <XCircle className="h-4 w-4 text-red-500"/>
                                            <span className="text-sm font-medium text-red-700">已拒绝</span>
                                        </>
                                    ) : (
                                        <>
                                            <ClockIcon className="h-4 w-4 text-yellow-500"/>
                                            <span className="text-sm font-medium text-yellow-700">待审核</span>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* 显示内容根据登录状态切换 */}
            {isAuthenticated ? (
                <StatisticsContent
                    stats={stats}
                    totalRows={totalRows}
                    versionNumber={selectedVersion?.versionNumber || ''}
                />
            ) : (
                <div className="w-full space-y-6 p-6">
                    {/* 分析结果标题和当前版本 - 在未登录状态下显示 */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                        <h2 className="text-xl font-bold text-slate-800">分析结果</h2>
                        {/* 当前版本信息显示 */}
                        {selectedVersion?.versionNumber && (
                            <div className="bg-blue-50 p-2 rounded-md border border-blue-200 mt-2 inline-block">
                                <p className="text-sm font-medium text-blue-800">
                                    当前版本: {selectedVersion?.versionNumber}
                                </p>
                            </div>
                        )}
                    </div>
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-start gap-2">
                            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0"/>
                            <div>
                                <h4 className="font-medium text-yellow-800">需要登录才能查看统计数据</h4>
                                <p className="text-sm text-yellow-700 mt-1">
                                    请先登录您的账户以访问数据集统计数据。
                                </p>
                                <Button
                                    onClick={() => {
                                        // 构建包含数据集ID的路径，用于登录后返回
                                        const currentUrl = '/datasets?id=' + dataset.id + '&dstab=statistics';
                                        redirectToAuth(currentUrl);
                                    }}
                                    className="mt-3"
                                >
                                    前往登录
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}