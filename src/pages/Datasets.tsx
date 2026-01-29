import { Navigation } from "@/components/Navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {Upload, List, Grid, Database, Search, Filter, RotateCcw, FileText} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import {useNavigate, useSearchParams} from "react-router-dom";
import { DatasetDetailModal } from "@/components/dataset/DatasetDetailModal";
import { DatasetTreeView } from "@/components/dataset/DatasetTreeView";
import { DatasetGrid } from "@/components/dataset/DatasetGrid";
import { DatasetFilters } from "@/components/dataset/DatasetFilters";
import { DatasetTypes } from "@/lib/enums";
import { DatasetAnnualChart } from "@/components/dataset/DatasetAnnualChart";
import { getAnnualDatasetStatistics } from "@/integrations/api/statisticsApi";
import { datasetApi } from "@/integrations/api/datasetApi";
import { ScrollArea } from "@radix-ui/react-scroll-area";
import PaginatedList from "@/components/ui/PaginatedList";
import { useDebounce } from "@/hooks/useDebounce";
import { isAuthenticated, redirectToAuth } from "@/lib/authUtils";

// Type mappings for database enum values
const typeLabels = DatasetTypes;

const Datasets = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedType, setSelectedType] = useState("all");
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [selectedInstitution, setSelectedInstitution] = useState<string[] | null>(null);
    const [dateFrom, setDateFrom] = useState<Date | undefined>();
    const [dateTo, setDateTo] = useState<Date | undefined>();
    const [selectedDataset, setSelectedDataset] = useState(null);
    const [showDetail, setShowDetail] = useState(false);
    const [viewMode, setViewMode] = useState<'grid' | 'tree'>('grid');
    const [researchSubjects, setResearchSubjects] = useState([]);
    const [annualData, setAnnualData] = useState<{ year: number, count: number }[]>([]);
    const [annualLoading, setAnnualLoading] = useState(true);
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const debouncedSearchTerm = useDebounce(searchTerm, 550);

    // Listen for custom event to open dataset detail
    useEffect(() => {
        const handleOpenDatasetDetail = (event: any) => {
            setSelectedDataset(event.detail);
            setShowDetail(true);
        };

        window.addEventListener('openDatasetDetail', handleOpenDatasetDetail);
        return () => {
            window.removeEventListener('openDatasetDetail', handleOpenDatasetDetail);
        };
    }, []);

    // Handle dataset ID and default tab from URL parameters
    useEffect(() => {
        const datasetId = searchParams.get('id');
        if (datasetId) {
            const fetchDatasetById = async () => {
                try {
                    const response = await datasetApi.getDatasetById(datasetId);
                    if (response.success && response.data) {
                        setSelectedDataset(response.data);
                        setShowDetail(true);
                    } else {
                        console.error('Failed to fetch dataset by ID:', datasetId);
                    }
                } catch (error) {
                    console.error('Error fetching dataset by ID:', error);
                }
            };

            fetchDatasetById();
        }
    }, [searchParams]);

    // Fetch research subjects
    useEffect(() => {
        const fetchResearchSubjects = async () => {
            try {
                const apiResponse = await datasetApi.getResearchSubjects();
                const subjects = apiResponse.data;
                setResearchSubjects(subjects);
            } catch (error) {
                console.error('Error fetching research subjects:', error);
            }
        };

        fetchResearchSubjects();
    }, []);

    // Fetch annual dataset statistics
    useEffect(() => {
        const fetchAnnualData = async () => {
            try {
                setAnnualLoading(true);
                const response = await getAnnualDatasetStatistics();
                if (response.data.success) {
                    setAnnualData(response.data.data);
                }
            } catch (error) {
                console.error('Error fetching annual dataset statistics:', error);
            } finally {
                setAnnualLoading(false);
            }
        };

        fetchAnnualData();
    }, []);

    // Create fetch function for paginated list
    const fetchDatasets = useCallback(async (page: number, size: number) => {
        // Map display labels back to API enum values
        const typeEnumValue = selectedType !== "all"
            ? Object.keys(typeLabels).find(
            key => typeLabels[key as keyof typeof typeLabels] === selectedType
        ) || selectedType
            : undefined;

        // Find subject area ID
        const subject = selectedCategory !== "all"
            ? researchSubjects.find((s: any) => s.name === selectedCategory)
            : undefined;

        const response = await datasetApi.queryDatasets({
            page: page,
            size: size,
            searchTerm: debouncedSearchTerm || undefined,
            type: typeEnumValue,
            subjectAreaId: subject?.id,
            institutionId: selectedInstitution?.[0],
            dateFrom: dateFrom,
            dateTo: dateTo,
            loadTimeline: true
        });

        return response.data;
    }, [debouncedSearchTerm, selectedType, selectedCategory, selectedInstitution, dateFrom, dateTo, researchSubjects]);

    const handleDatasetClick = (dataset: any) => {
        setSelectedDataset(dataset);
        setShowDetail(true);
    };

    // Reset filters
    const resetFilters = () => {
        setSearchTerm("");
        setSelectedType("all");
        setSelectedCategory("all");
        setSelectedInstitution(null);
        setDateFrom(undefined);
        setDateTo(undefined);
    };

    // Render grid item for paginated list
    const renderGridItem = (dataset: any) => (
        <DatasetGrid
            datasets={[dataset]}
            onDatasetClick={handleDatasetClick}
        />
    );

    // Render tree item for paginated list
    const renderTreeItem = (dataset: any) => (
        <DatasetTreeView
            datasets={[dataset]}
            onDatasetClick={handleDatasetClick}
        />
    );

    // Render empty state
    const renderEmptyState = () => (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Database className="h-16 w-16 mb-4 opacity-30" />
            <p className="text-xl font-medium mb-2">暂无数据集</p>
            <p className="text-sm">当前搜索条件下没有找到相关数据集</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50/30 to-blue-50/10">
            <Navigation/>

            <main className="container mx-auto px-4 py-8 space-y-8 max-w-7xl">
                {/* Header */}
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                    <div className="space-y-3">
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-blue-800 bg-clip-text text-transparent">
                            数据集目录
                        </h1>
                        <p className="text-lg text-muted-foreground max-w-2xl">
                            浏览已发布的临床研究数据集，支持按研究类型、学科领域筛选查找
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <Button
                            className="gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                            onClick={() => {
                                if (isAuthenticated()) {
                                    navigate('/profile?tab=applications');
                                } else {
                                    redirectToAuth('/profile?tab=applications');
                                }
                            }}
                        >
                            <FileText className="h-4 w-4"/>
                            我的申请
                        </Button>
                    </div>
                </div>

                {/* Annual Chart */}
                {annualLoading ? (
                    <Card className="bg-gradient-to-br from-white to-blue-50/30 border-blue-200/50 shadow-lg">
                        <CardContent className="p-8">
                            <div className="text-center py-8">
                                <p className="text-muted-foreground">年度统计数据加载中...</p>
                            </div>
                        </CardContent>
                    </Card>
                ) : annualData.length > 0 && (
                    <Card className="bg-gradient-to-br from-white to-blue-50/30 border-blue-200/50 shadow-lg hover:shadow-xl transition-shadow duration-300">
                        <CardContent className="p-6">
                            <DatasetAnnualChart data={annualData}/>
                        </CardContent>
                    </Card>
                )}

                {/* Main Content Area */}
                <Card className="bg-white/80 backdrop-blur-sm border-blue-200/50 shadow-xl overflow-hidden">
                    {/* Search and Filters Header */}
                    <div className="bg-gradient-to-r from-blue-50/50 to-blue-100/20 border-b border-blue-200/50 p-6">
                        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 rounded-lg">
                                    <Search className="h-5 w-5 text-blue-600" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900">数据集筛选</h3>
                                    <p className="text-sm text-muted-foreground">根据条件筛选查找数据集（不含随访数据集）</p>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="gap-2 border-blue-200/50 text-blue-700 hover:bg-blue-50"
                                    onClick={resetFilters}
                                >
                                    <RotateCcw className="h-4 w-4" />
                                    重置
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Filters */}
                    <CardContent className="p-6">
                        <DatasetFilters
                                searchTerm={searchTerm}
                                onSearchTermChange={setSearchTerm}
                                selectedType={selectedType}
                                onSelectedTypeChange={setSelectedType}
                                selectedCategory={selectedCategory}
                                onSelectedCategoryChange={setSelectedCategory}
                                selectedInstitution={selectedInstitution}
                                onSelectedInstitutionChange={setSelectedInstitution}
                                dateFrom={dateFrom}
                                onDateFromChange={setDateFrom}
                                dateTo={dateTo}
                                onDateToChange={setDateTo}
                                researchSubjects={researchSubjects}
                            />
                    </CardContent>

                    {/* View Controls and Results Summary */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 border-t border-blue-200/30 bg-white/50">
                        <div className="flex gap-2">
                            <Button
                                variant={viewMode === 'grid' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setViewMode('grid')}
                            >
                                <Grid className="h-4 w-4"/>
                                网格视图
                            </Button>
                            <Button
                                variant={viewMode === 'tree' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setViewMode('tree')}
                            >
                                <List className="h-4 w-4"/>
                                层级视图
                            </Button>
                        </div>

                        {viewMode === 'tree' && (
                            <div className="flex flex-wrap justify-center gap-4 p-3 bg-blue-50/50 rounded-xl border border-blue-200/30">
                                <div className="flex items-center gap-2 text-sm font-medium text-blue-800">
                                    <div className="w-3 h-3 bg-blue-500 rounded shadow-sm"></div>
                                    <span>基线数据集</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm font-medium text-green-800">
                                    <div className="w-3 h-3 bg-green-500 rounded shadow-sm"></div>
                                    <span>随访数据集</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Dataset Grid / Tree View */}
                    <div className="border-t border-blue-200/30">
                        <ScrollArea className="h-full w-full">
                            <div className="p-6 min-h-[600px]">
                                <PaginatedList
                                    fetchData={fetchDatasets}
                                    renderItem={viewMode === 'grid' ? renderGridItem : renderTreeItem}
                                    pageSize={viewMode === 'grid' ? 12 : 6}
                                    gridLayout={viewMode === 'grid'}
                                    gap={viewMode === 'grid' ? 16 : 16}
                                    renderEmptyState={renderEmptyState}
                                    autoLoad={true}
                                />
                            </div>
                        </ScrollArea>
                    </div>
                </Card>

                <DatasetDetailModal
                    dataset={selectedDataset}
                    open={showDetail}
                    onOpenChange={setShowDetail}
                    useAdvancedQuery={false}
                    defaultTab={searchParams.get('dstab') || 'overview'}
                />
            </main>
        </div>
    );
};

export default Datasets;