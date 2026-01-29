import React, {useMemo, useState} from 'react';
import {CheckCircle, ChevronDown, ChevronRight, ClockIcon, Download, Filter, Layers, XCircle} from 'lucide-react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import {toast} from "@/hooks/use-toast.ts";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select.tsx";
import InfiniteScroll from 'react-infinite-scroll-component';
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table.tsx";
import {useNavigate} from "react-router-dom";
import {Button} from "@/components/ui/button.tsx";
import {api} from "@/integrations/api/client.ts";

export interface CategoryDistribution {
    name: string;
    count: number;
    percentage: string;
}

export interface ColumnStats {
    variable: string;
    label: string;
    inferredType: string;
    count: number;
    missing: number;
    validPercentage?: string; // 例如 "95.0%"
    missingPercentage?: string; // 例如 "5.0%"
    unique?: number;
    mean?: number;
    median?: number;
    stdDev?: number;
    min?: number | string;
    max?: number | string;
    mode?: string;
    modeFreq?: number;
    categoryDistribution?: CategoryDistribution[];
}

interface StatisticsContentProps {
    stats: ColumnStats[];
    totalRows: number;
    versionNumber: string;
}

export function StatisticsContent({
                                      stats,
                                      totalRows,
                                      versionNumber
                                  }: StatisticsContentProps) {
    const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
    const [hiddenVariables, setHiddenVariables] = useState<Set<string>>(new Set());
    const [showFilter, setShowFilter] = useState(false);
    const [dataTypeFilter, setDataTypeFilter] = useState<'all' | 'numeric' | 'categorical'>('all');
    const navigate = useNavigate();

    // Data type filtered stats (for candidate list)
    const dataTypeFilteredStats = useMemo(() => {
        if (dataTypeFilter === 'numeric') {
            return stats.filter(s => s.inferredType === 'numeric');
        } else if (dataTypeFilter === 'categorical') {
            return stats.filter(s => s.inferredType !== 'numeric');
        }
        return stats;
    }, [stats, dataTypeFilter]);

    // Filter stats based on data type filter and visibility (for display)
    const visibleStats = useMemo(() => {
        // 只显示候选里有的且勾选的字段
        const filtered = dataTypeFilteredStats.filter(s => !hiddenVariables.has(s.variable));
        return filtered;
    }, [dataTypeFilteredStats, hiddenVariables]);

    // Group statistics by inferredType
    const groupedStats = useMemo(() => {
        const groups: Record<string, ColumnStats[]> = {};
        visibleStats.forEach(stat => {
            const type = stat.inferredType || 'unknown';
            // Capitalize first letter
            const key = type.charAt(0).toUpperCase() + type.slice(1);
            if (!groups[key]) groups[key] = [];
            groups[key].push(stat);
        });
        return groups;
    }, [visibleStats]);

    const toggleGroup = (group: string) => {
        setCollapsedGroups(prev => {
            const next = new Set(prev);
            if (next.has(group)) {
                next.delete(group);
            } else {
                next.add(group);
            }
            return next;
        });
    };

    const toggleVariable = (variable: string) => {
        setHiddenVariables(prev => {
            const next = new Set(prev);
            if (next.has(variable)) {
                next.delete(variable);
            } else {
                next.add(variable);
            }
            return next;
        });
    };

    const toggleAllVariables = (show: boolean) => {
        if (show) {
            // 显示当前数据类型筛选下的所有变量（取消隐藏）
            const newHidden = new Set(hiddenVariables);
            dataTypeFilteredStats.forEach(s => {
                newHidden.delete(s.variable);
            });
            setHiddenVariables(newHidden);
        } else {
            // 隐藏当前数据类型筛选下的所有变量
            const newHidden = new Set(hiddenVariables);
            dataTypeFilteredStats.forEach(s => {
                newHidden.add(s.variable);
            });
            setHiddenVariables(newHidden);
        }
    };

    const handleDownloadAll = () => {
        // 获取可见的连续型变量和分类型变量
        const numericStats = visibleStats.filter(s => s.inferredType === 'numeric');
        const catStats = visibleStats.filter(s => s.inferredType !== 'numeric');

        if (numericStats.length === 0 && catStats.length === 0) {
            toast({title: '没有可下载的数据', description: '请至少选择一个变量', variant: 'destructive'});
            return;
        }

        // Create a new workbook
        const wb = XLSX.utils.book_new();

        // Process numeric data sheet
        if (numericStats.length > 0) {
            const numericData = numericStats.map(stat => ({
                Variable: stat.variable,
                Label: stat.label,
                Valid_Count: stat.count,
                Valid_Pct: stat.validPercentage,
                Missing_Count: stat.missing,
                Missing_Pct: stat.missingPercentage,
                Mean: stat.mean,
                StdDev: stat.stdDev,
                Median: stat.median,
                Min: stat.min,
                Max: stat.max
            }));

            const numericWs = XLSX.utils.json_to_sheet(numericData);
            XLSX.utils.book_append_sheet(wb, numericWs, '连续型变量');
        }

        // Process categorical data sheet
        if (catStats.length > 0) {
            const categoricalData = catStats.map(stat => {
                const base: any = {
                    Variable: stat.variable,
                    Label: stat.label,
                    Valid_Count: stat.count,
                    Valid_Pct: stat.validPercentage,
                    Missing_Count: stat.missing,
                    Missing_Pct: stat.missingPercentage,
                    Unique_Values: stat.unique,
                    Mode: stat.mode,
                    Mode_Freq: stat.modeFreq,
                };

                if (stat.categoryDistribution) {
                    stat.categoryDistribution.forEach((cat, idx) => {
                        base[`Top_${idx + 1}_Category`] = cat.name;
                        base[`Top_${idx + 1}_Pct`] = cat.percentage;
                    });
                }
                return base;
            });

            const categoricalWs = XLSX.utils.json_to_sheet(categoricalData);
            XLSX.utils.book_append_sheet(wb, categoricalWs, '分类型变量');
        }

        // Generate Excel file and trigger download
        XLSX.writeFile(wb, 'variable_analysis.xlsx');

        toast({
            title: "开始下载",
            description: `文件 "variable_analysis.xlsx" 已开始下载`
        });
    };

    const formatNumber = (num?: number) => {
        if (num === undefined) return '-';
        return num.toLocaleString(undefined, {maximumFractionDigits: 2});
    };

    // 预定义的分组顺序
    const groupOrder = ['Numeric', 'Categorical', 'Unknown'];

    // 中文显示映射
    const groupLabels: Record<string, string> = {
        'Numeric': '连续型变量 (Continuous)',
        'Categorical': '分类型变量 (Categorical)',
        'Unknown': '未知类型 (Unknown)'
    };

    const sortedGroupKeys = Object.keys(groupedStats).sort((a, b) => {
        const idxA = groupOrder.indexOf(a);
        const idxB = groupOrder.indexOf(b);
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;
        return a.localeCompare(b);
    });

    return (
        <div className="space-y-6 p-1">
            {/* Controls Container */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-4">

                {/* Header, Downloads & Data Type Filter */}
                <div className="space-y-4">
                    {/* Title and Stats */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between">
                        <div className="w-full">
                            {versionNumber && (
                                <div className="flex flex-col md:flex-row md:items-center justify-between">
                                    <h2 className="text-xl font-bold text-slate-800">分析结果</h2>
                                    {/* 当前版本信息显示 */}

                                    <div className="bg-blue-50 p-2 rounded-md border border-blue-200 mt-2 inline-block">
                                        <p className="text-sm font-medium text-blue-800">
                                            当前版本: {versionNumber}
                                        </p>
                                    </div>
                                </div>
                            )}
                            <p className="text-sm text-slate-500 mt-1 flex flex-wrap gap-x-4 gap-y-1">
                                <span>总记录数: <span
                                    className="font-mono font-medium text-slate-900">{totalRows}</span></span>
                                <span>总变量数: <span
                                    className="font-mono font-medium text-slate-900">{stats.length}</span></span>
                                <span>显示变量数: <span
                                    className="font-mono font-medium text-indigo-600">{visibleStats.length}</span></span>
                            </p>
                        </div>
                    </div>

                </div>

                <div className="h-px bg-slate-100 my-2"></div>

                <div>
                    {/* 筛选器开关 */}
                    <div className="flex justify-between items-center gap-3">
                        {/* Data Type Filter */}
                        <div
                            className="flex flex-wrap items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200">
                            <button
                                onClick={() => setShowFilter(!showFilter)}
                                className="flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-indigo-600 transition-colors mr-2"
                            >
                                {showFilter ? <ChevronDown className="w-4 h-4"/> : <ChevronRight className="w-4 h-4"/>}
                                <Filter className="w-4 h-4"/>
                                {showFilter ? '隐藏变量筛选' : '筛选显示变量'}
                            </button>
                            <div className="flex flex-wrap gap-1">
                                <button
                                    onClick={() => setDataTypeFilter('all')}
                                    className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${dataTypeFilter === 'all' ? 'bg-indigo-500 text-white' : 'bg-white text-slate-700 hover:bg-slate-100'}`}
                                >
                                    全部
                                </button>
                                <button
                                    onClick={() => setDataTypeFilter('numeric')}
                                    className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${dataTypeFilter === 'numeric' ? 'bg-indigo-500 text-white' : 'bg-white text-slate-700 hover:bg-slate-100'}`}
                                >
                                    连续型变量
                                </button>
                                <button
                                    onClick={() => setDataTypeFilter('categorical')}
                                    className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${dataTypeFilter === 'categorical' ? 'bg-indigo-500 text-white' : 'bg-white text-slate-700 hover:bg-slate-100'}`}
                                >
                                    分类型变量
                                </button>
                            </div>
                        </div>

                        {/* Download Button */}
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={handleDownloadAll}
                                className="flex items-center justify-center gap-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors flex-1 min-w-[120px]"
                            >
                                <Download className="w-4 h-4"/>
                                下载分析报告
                            </button>
                        </div>
                    </div>

                    <div>
                        {showFilter && (
                            <div className="mt-4 animate-in slide-in-from-top-2 duration-300">
                                <div className="flex gap-2 mb-3">
                                    <button onClick={() => toggleAllVariables(true)}
                                            className="text-xs bg-slate-100 hover:bg-slate-200 px-3 py-1 rounded text-slate-700 font-medium">全选
                                    </button>
                                    <button onClick={() => toggleAllVariables(false)}
                                            className="text-xs bg-slate-100 hover:bg-slate-200 px-3 py-1 rounded text-slate-700 font-medium">全不选
                                    </button>
                                </div>
                                <div
                                    className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2 bg-slate-50 p-4 rounded-lg border border-slate-100 max-h-60 overflow-y-auto">
                                    {dataTypeFilteredStats.map(s => {
                                        const isHidden = hiddenVariables.has(s.variable);
                                        return (
                                            <label key={s.variable}
                                                   className="flex items-center gap-2 text-sm cursor-pointer hover:bg-white p-1 rounded transition-colors">
                                                <input
                                                    type="checkbox"
                                                    checked={!isHidden}
                                                    onChange={() => toggleVariable(s.variable)}
                                                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                                />
                                                <span
                                                    className={`truncate ${isHidden ? 'text-slate-400' : 'text-slate-700'}`}
                                                    title={s.variable}>
                                                {s.variable}
                                            </span>
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                {sortedGroupKeys.map((group) => {
                    const isCollapsed = collapsedGroups.has(group);
                    const groupItems = groupedStats[group];
                    const count = groupItems.length;
                    const displayLabel = groupLabels[group] || `${group} 变量`;

                    if (count === 0) return null;

                    return (
                        <div key={group}
                             className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                            <button
                                onClick={() => toggleGroup(group)}
                                className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors border-b border-slate-200"
                            >
                                <div className="flex items-center gap-2">
                                    {isCollapsed ? <ChevronRight className="w-5 h-5 text-slate-400"/> :
                                        <ChevronDown className="w-5 h-5 text-slate-400"/>}
                                    <Layers className="w-4 h-4 text-indigo-500"/>
                                    <span className="font-semibold text-slate-700">{displayLabel}</span>
                                    <span
                                        className="bg-slate-200 text-slate-600 text-xs px-2 py-0.5 rounded-full font-medium">{count}</span>
                                </div>
                                <span className="text-xs text-slate-400 font-medium">
                                    {isCollapsed ? '展开' : '收起'}
                                </span>
                            </button>

                            {!isCollapsed && (
                                <div className="overflow-x-auto">
                                    <InfiniteScroll
                                        dataLength={groupItems.length}
                                        next={() => {
                                        }}
                                        hasMore={false}
                                        loader={<div className="text-center py-4">加载中...</div>}
                                        scrollThreshold={0.8}
                                        style={{overflowX: 'auto'}}
                                    >
                                        <Table>
                                            <TableHeader>
                                                <tr>
                                                    <TableHead className="w-[15%] bg-slate-50/50">变量名</TableHead>
                                                    <TableHead className="w-[15%] bg-slate-50/50">标签</TableHead>
                                                    <TableHead className="w-[12%] text-right bg-slate-50/50">有效值
                                                        (占比)</TableHead>
                                                    <TableHead className="w-[12%] text-right bg-slate-50/50">缺失值
                                                        (占比)</TableHead>

                                                    {group === 'Numeric' ? (
                                                        <>
                                                            <TableHead
                                                                className="text-right bg-slate-50/50">均值</TableHead>
                                                            <TableHead
                                                                className="text-right bg-slate-50/50">标准差</TableHead>
                                                            <TableHead
                                                                className="text-right bg-slate-50/50">中位数</TableHead>
                                                            <TableHead
                                                                className="text-right bg-slate-50/50">最小值</TableHead>
                                                            <TableHead
                                                                className="text-right bg-slate-50/50">最大值</TableHead>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <TableHead className="w-[30%] bg-slate-50/50">类别分布 (Top
                                                                5)</TableHead>
                                                            <TableHead
                                                                className="text-right bg-slate-50/50">众数</TableHead>
                                                        </>
                                                    )}
                                                </tr>
                                            </TableHeader>
                                            <TableBody>
                                                {groupItems.map((row) => (
                                                    <TableRow key={row.variable}
                                                              className="hover:bg-slate-50/50 transition-colors align-top">
                                                        <TableCell
                                                            className="px-4 py-3 font-mono text-slate-700 font-medium break-all">{row.variable}</TableCell>
                                                        <TableCell className="px-4 py-3 text-slate-600 break-all"
                                                                   title={row.label}>{row.label || '-'}</TableCell>

                                                        {/* Valid with Percentage */}
                                                        <TableCell className="px-4 py-3 text-right text-slate-600">
                                                            <div>{row.count}</div>
                                                            <div
                                                                className="text-xs text-slate-400">{row.validPercentage}</div>
                                                        </TableCell>

                                                        {/* Missing with Percentage */}
                                                        <TableCell className="px-4 py-3 text-right">
                                                            <div
                                                                className={`${row.missing > 0 ? 'text-red-500 font-medium' : 'text-slate-600'}`}>{row.missing}</div>
                                                            <div
                                                                className="text-xs text-slate-400">{row.missingPercentage}</div>
                                                        </TableCell>

                                                        {group === 'Numeric' ? (
                                                            <>
                                                                <TableCell
                                                                    className="px-4 py-3 text-right text-slate-600">{formatNumber(row.mean)}</TableCell>
                                                                <TableCell
                                                                    className="px-4 py-3 text-right text-slate-600">{formatNumber(row.stdDev)}</TableCell>
                                                                <TableCell
                                                                    className="px-4 py-3 text-right text-slate-600">{formatNumber(row.median)}</TableCell>
                                                                <TableCell
                                                                    className="px-4 py-3 text-right text-slate-600">{row.min ?? '-'}</TableCell>
                                                                <TableCell
                                                                    className="px-4 py-3 text-right text-slate-600">{row.max ?? '-'}</TableCell>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <TableCell className="px-4 py-3">
                                                                    <div className="space-y-1">
                                                                        {row.categoryDistribution?.map((cat, i) => (
                                                                            <div key={i}
                                                                                 className="flex items-center justify-between text-xs group">
                                                                                <span
                                                                                    className="text-slate-700 truncate max-w-[180px] bg-slate-100 px-1.5 py-0.5 rounded"
                                                                                    title={cat.name}>
                                                                                    {cat.name}
                                                                                </span>
                                                                                <div
                                                                                    className="flex items-center gap-2">
                                                                                    <span
                                                                                        className="text-slate-400 text-[10px] tabular-nums">({cat.count})</span>
                                                                                    <span
                                                                                        className="font-medium text-indigo-600 w-12 text-right">{cat.percentage}</span>
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                        {(!row.categoryDistribution || row.categoryDistribution.length === 0) && (
                                                                            <span
                                                                                className="text-slate-400 italic text-xs">无数据</span>
                                                                        )}
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell
                                                                    className="px-4 py-3 text-right text-slate-600 truncate max-w-[100px]"
                                                                    title={`${row.mode} (频率: ${row.modeFreq})`}>
                                                                    {row.mode ?? '-'}
                                                                </TableCell>
                                                            </>
                                                        )}
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </InfiniteScroll>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}