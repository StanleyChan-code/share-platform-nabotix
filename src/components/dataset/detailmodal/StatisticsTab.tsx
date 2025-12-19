import React, { useMemo, useState } from 'react';
import { Download, ChevronDown, ChevronRight, Layers, Eye, EyeOff, Filter } from 'lucide-react';
import Papa from 'papaparse';
import {toast} from "@/hooks/use-toast.ts";

interface StatisticsTabProps {
    stats: ColumnStats[];
    demographicFields: any[];
    outcomeFields: any[];
    totalRows: number;
}

export interface CategoryDistribution {
    name: string;
    count: number;
    percentage: string;
}

interface ColumnStats {
    variable: string;
    label: string;
    inferredType: string;
    count: number;
    missing: number;
    validPercentage?: string; // e.g. "95.0%"
    missingPercentage?: string; // e.g. "5.0%"
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

export function StatisticsTab({
                                  stats,
                                  demographicFields,
                                  outcomeFields,
                                  totalRows
                              }: StatisticsTabProps) {
    const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
    const [hiddenVariables, setHiddenVariables] = useState<Set<string>>(new Set());
    const [showFilter, setShowFilter] = useState(false);

    // Filter stats based on visibility
    const visibleStats = useMemo(() => {
        return stats.filter(s => !hiddenVariables.has(s.variable));
    }, [stats, hiddenVariables]);

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
            setHiddenVariables(new Set());
        } else {
            const allVars = new Set(stats.map(s => s.variable));
            setHiddenVariables(allVars);
        }
    };

    const triggerDownload = (data: any[], filename: string) => {
        const csv = Papa.unparse(data);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast({
            title: "开始下载",
            description: `文件 "${filename}" 已开始下载`
        });
    };

    const handleDownloadNumeric = () => {
        const numericStats = stats.filter(s => s.inferredType === 'numeric');
        const csvData = numericStats.map(stat => ({
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
        triggerDownload(csvData, 'numeric_analysis_results.csv');
    };

    const handleDownloadCategorical = () => {
        const catStats = stats.filter(s => s.inferredType !== 'numeric');
        const csvData = catStats.map(stat => {
            const base: any = {
                Variable: stat.variable,
                Label: stat.label,
                Valid_Count: stat.count,
                Valid_Pct: stat.validPercentage,
                Missing_Count: stat.missing,
                Missing_Pct: stat.missingPercentage,
                Unique_Values: stat.unique, // Kept in CSV for data completeness even if hidden in UI
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
        triggerDownload(csvData, 'categorical_analysis_results.csv');
    };

    const formatNumber = (num?: number) => {
        if (num === undefined) return '-';
        return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
    };

    // Predefined order for groups
    const groupOrder = ['Numeric', 'Categorical', 'Unknown'];

    // Mapping for Chinese display
    const groupLabels: Record<string, string> = {
        'Numeric': '数值型变量 (Numeric)',
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
        <div className="w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Controls Container */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-4">

                {/* Header & Downloads */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">分析结果</h2>
                        <p className="text-sm text-slate-500 mt-1">
                            总行数: <span className="font-mono font-medium text-slate-900">{totalRows}</span> |
                            总变量: <span className="font-mono font-medium text-slate-900">{stats.length}</span> |
                            显示: <span className="font-mono font-medium text-indigo-600">{visibleStats.length}</span>
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={handleDownloadNumeric}
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                            <Download className="w-4 h-4" />
                            下载数值型报告
                        </button>
                        <button
                            onClick={handleDownloadCategorical}
                            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                            <Download className="w-4 h-4" />
                            下载分类型报告
                        </button>
                    </div>
                </div>

                <div className="h-px bg-slate-100 my-2"></div>

                {/* Filter Toggle */}
                <div>
                    <button
                        onClick={() => setShowFilter(!showFilter)}
                        className="flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-indigo-600 transition-colors"
                    >
                        <Filter className="w-4 h-4" />
                        {showFilter ? '隐藏变量筛选' : '筛选显示变量'}
                        {showFilter ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>

                    {showFilter && (
                        <div className="mt-4 animate-in slide-in-from-top-2 duration-300">
                            <div className="flex gap-2 mb-3">
                                <button onClick={() => toggleAllVariables(true)} className="text-xs bg-slate-100 hover:bg-slate-200 px-3 py-1 rounded text-slate-700 font-medium">全选</button>
                                <button onClick={() => toggleAllVariables(false)} className="text-xs bg-slate-100 hover:bg-slate-200 px-3 py-1 rounded text-slate-700 font-medium">全不选</button>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2 bg-slate-50 p-4 rounded-lg border border-slate-100 max-h-60 overflow-y-auto">
                                {stats.map(s => {
                                    const isHidden = hiddenVariables.has(s.variable);
                                    return (
                                        <label key={s.variable} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-white p-1 rounded transition-colors">
                                            <input
                                                type="checkbox"
                                                checked={!isHidden}
                                                onChange={() => toggleVariable(s.variable)}
                                                className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                            />
                                            <span className={`truncate ${isHidden ? 'text-slate-400' : 'text-slate-700'}`} title={s.variable}>
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

            <div className="space-y-4">
                {sortedGroupKeys.map((group) => {
                    const isCollapsed = collapsedGroups.has(group);
                    const groupItems = groupedStats[group];
                    const count = groupItems.length;
                    const displayLabel = groupLabels[group] || `${group} 变量`;

                    if (count === 0) return null;

                    return (
                        <div key={group} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                            <button
                                onClick={() => toggleGroup(group)}
                                className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors border-b border-slate-200"
                            >
                                <div className="flex items-center gap-2">
                                    {isCollapsed ? <ChevronRight className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                                    <Layers className="w-4 h-4 text-indigo-500" />
                                    <span className="font-semibold text-slate-700">{displayLabel}</span>
                                    <span className="bg-slate-200 text-slate-600 text-xs px-2 py-0.5 rounded-full font-medium">{count}</span>
                                </div>
                                <span className="text-xs text-slate-400 font-medium">
                  {isCollapsed ? '展开' : '收起'}
                </span>
                            </button>

                            {!isCollapsed && (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-white text-slate-500 font-semibold uppercase text-xs border-b border-slate-100">
                                        <tr>
                                            <th className="px-4 py-3 bg-slate-50/50 w-[15%]">变量名</th>
                                            <th className="px-4 py-3 bg-slate-50/50 w-[15%]">标签</th>
                                            {/* Modified columns for percentage display */}
                                            <th className="px-4 py-3 bg-slate-50/50 text-right w-[12%]">有效值 (占比)</th>
                                            <th className="px-4 py-3 bg-slate-50/50 text-right w-[12%]">缺失值 (占比)</th>
                                            {/* Removed Unique Column Header */}

                                            {group === 'Numeric' ? (
                                                <>
                                                    <th className="px-4 py-3 bg-slate-50/50 text-right">均值</th>
                                                    <th className="px-4 py-3 bg-slate-50/50 text-right">标准差</th>
                                                    <th className="px-4 py-3 bg-slate-50/50 text-right">中位数</th>
                                                    <th className="px-4 py-3 bg-slate-50/50 text-right">最小值</th>
                                                    <th className="px-4 py-3 bg-slate-50/50 text-right">最大值</th>
                                                </>
                                            ) : (
                                                // Categorical Headers
                                                <>
                                                    <th className="px-4 py-3 bg-slate-50/50 w-[30%]">类别分布 (Top 5)</th>
                                                    <th className="px-4 py-3 bg-slate-50/50 text-right">众数</th>
                                                </>
                                            )}
                                        </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                        {groupItems.map((row, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50/50 transition-colors align-top">
                                                <td className="px-4 py-3 font-mono text-slate-700 font-medium break-words">{row.variable}</td>
                                                <td className="px-4 py-3 text-slate-600 break-words" title={row.label}>{row.label || '-'}</td>

                                                {/* Valid with Percentage */}
                                                <td className="px-4 py-3 text-right text-slate-600">
                                                    <div>{row.count}</div>
                                                    <div className="text-xs text-slate-400">{row.validPercentage}</div>
                                                </td>

                                                {/* Missing with Percentage */}
                                                <td className={`px-4 py-3 text-right`}>
                                                    <div className={`${row.missing > 0 ? 'text-red-500 font-medium' : 'text-slate-600'}`}>{row.missing}</div>
                                                    <div className="text-xs text-slate-400">{row.missingPercentage}</div>
                                                </td>

                                                {/* Removed Unique Cell */}

                                                {group === 'Numeric' ? (
                                                    <>
                                                        <td className="px-4 py-3 text-right text-slate-600">{formatNumber(row.mean)}</td>
                                                        <td className="px-4 py-3 text-right text-slate-600">{formatNumber(row.stdDev)}</td>
                                                        <td className="px-4 py-3 text-right text-slate-600">{formatNumber(row.median)}</td>
                                                        <td className="px-4 py-3 text-right text-slate-600">{row.min ?? '-'}</td>
                                                        <td className="px-4 py-3 text-right text-slate-600">{row.max ?? '-'}</td>
                                                    </>
                                                ) : (
                                                    <>
                                                        <td className="px-4 py-3">
                                                            <div className="space-y-1">
                                                                {row.categoryDistribution?.map((cat, i) => (
                                                                    <div key={i} className="flex items-center justify-between text-xs group">
                                      <span className="text-slate-700 truncate max-w-[180px] bg-slate-100 px-1.5 py-0.5 rounded" title={cat.name}>
                                        {cat.name}
                                      </span>
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="text-slate-400 text-[10px] tabular-nums">({cat.count})</span>
                                                                            <span className="font-medium text-indigo-600 w-12 text-right">{cat.percentage}</span>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                                {(!row.categoryDistribution || row.categoryDistribution.length === 0) && (
                                                                    <span className="text-slate-400 italic text-xs">无数据</span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 text-right text-slate-600 truncate max-w-[100px]" title={`${row.mode} (频率: ${row.modeFreq})`}>
                                                            {row.mode ?? '-'}
                                                        </td>
                                                    </>
                                                )}
                                            </tr>
                                        ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}