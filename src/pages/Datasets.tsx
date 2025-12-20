import {Navigation} from "@/components/Navigation";
import {Card, CardContent} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {DatasetUpload} from "@/components/upload/DatasetUpload";
import {Upload, List, Grid, Database} from "lucide-react";
import {useState, useEffect, useCallback} from "react";
import {DatasetDetailModal} from "@/components/dataset/DatasetDetailModal";
import {DatasetTreeView} from "@/components/dataset/DatasetTreeView";
import {DatasetGrid} from "@/components/dataset/DatasetGrid";
import {DatasetFilters} from "@/components/dataset/DatasetFilters";
import {DatasetTypes} from "@/lib/enums";
import {DatasetAnnualChart} from "@/components/dataset/DatasetAnnualChart";
import {getAnnualDatasetStatistics} from "@/integrations/api/statisticsApi";
import {datasetApi} from "@/integrations/api/datasetApi";
import {ScrollArea} from "@radix-ui/react-scroll-area";
import PaginatedList from "@/components/ui/PaginatedList";
import { getCurrentUserRoles } from "@/lib/authUtils";
import { PermissionRoles } from "@/lib/permissionUtils";
import { useNavigate } from "react-router-dom";

// Type mappings for database enum values
const typeLabels = DatasetTypes;

const Datasets = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedType, setSelectedType] = useState("all");
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [dateFrom, setDateFrom] = useState<Date | undefined>();
    const [dateTo, setDateTo] = useState<Date | undefined>();
    const [showUpload, setShowUpload] = useState(false);
    const [selectedDataset, setSelectedDataset] = useState(null);
    const [showDetail, setShowDetail] = useState(false);
    const [viewMode, setViewMode] = useState<'grid' | 'tree'>('grid');
    const [researchSubjects, setResearchSubjects] = useState([]);
    const [annualData, setAnnualData] = useState<{ year: number, count: number }[]>([]);
    const [annualLoading, setAnnualLoading] = useState(true);
    const [filtersChanged, setFiltersChanged] = useState(false);
    const [userRoles, setUserRoles] = useState<string[]>([]);
    const navigate = useNavigate();

    // Check user permissions
    useEffect(() => {
        const roles = getCurrentUserRoles();
        setUserRoles(roles);
    }, []);

    // Check if user has permission to upload datasets
    const canUploadDataset = useCallback(() => {
        return userRoles.includes(PermissionRoles.PLATFORM_ADMIN) || 
               userRoles.includes(PermissionRoles.INSTITUTION_SUPERVISOR) || 
               userRoles.includes(PermissionRoles.DATASET_UPLOADER);
    }, [userRoles]);

    // Check if user is platform admin
    const isPlatformAdmin = useCallback(() => {
        return userRoles.includes(PermissionRoles.PLATFORM_ADMIN);
    }, [userRoles]);

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
            searchTerm: searchTerm || undefined,
            type: typeEnumValue,
            subjectAreaId: subject?.id,
            dateFrom: dateFrom?.toISOString(),
            dateTo: dateTo?.toISOString(),
            loadTimeline: true
        });
        
        return response.data;
    }, [searchTerm, selectedType, selectedCategory, dateFrom, dateTo, researchSubjects]);

    const handleDatasetClick = (dataset: any) => {
        setSelectedDataset(dataset);
        setShowDetail(true);
    };

    // Reset filters
    const resetFilters = () => {
        setSearchTerm("");
        setSelectedType("all");
        setSelectedCategory("all");
        setDateFrom(undefined);
        setDateTo(undefined);
        setFiltersChanged(!filtersChanged); // Trigger refresh
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
        <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">暂无符合条件的数据集</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-background">
            <Navigation/>

            <main className="container mx-auto py-6 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="space-y-4">
                        <h1 className="text-3xl font-bold">数据集目录</h1>
                        <p className="text-muted-foreground">
                            浏览已发布的临床研究数据集，支持按研究类型、学科领域筛选查找
                        </p>
                    </div>
                    {canUploadDataset() && (
                        <Button onClick={() => navigate('/profile?tab=datasets')} className="gap-2">
                            <Database className="h-4 w-4"/>
                            我的数据集
                        </Button>
                    )}
                </div>

                {/* Upload Component */}
                {showUpload && (
                    <DatasetUpload onSuccess={() => setShowUpload(false)} />
                )}

                {/* Annual Chart */}
                {annualLoading ? (
                    <div className="text-center py-8">
                        <p className="text-muted-foreground">年度统计数据加载中...</p>
                    </div>
                ) : annualData.length > 0 && (
                    <DatasetAnnualChart data={annualData}/>
                )}

                {/* Main Content Area with Fixed Height */}
                <div className="flex flex-col border rounded-lg">
                    {/* Search and Filters */}
                    <Card className="flex-shrink-0 rounded-b-none border-b">
                        <CardContent className="p-6">
                            <DatasetFilters
                                searchTerm={searchTerm}
                                onSearchTermChange={setSearchTerm}
                                selectedType={selectedType}
                                onSelectedTypeChange={setSelectedType}
                                selectedCategory={selectedCategory}
                                onSelectedCategoryChange={setSelectedCategory}
                                dateFrom={dateFrom}
                                onDateFromChange={setDateFrom}
                                dateTo={dateTo}
                                onDateToChange={setDateTo}
                                researchSubjects={researchSubjects}
                                onResetFilters={resetFilters}
                            />
                        </CardContent>
                    </Card>

                    {/* Results Summary */}
                    <div className="flex items-center justify-between p-4 border-b">
                        <div className="flex gap-2">
                            <Button
                                variant={viewMode === 'grid' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setViewMode('grid')}
                                className="gap-2"
                            >
                                <Grid className="h-4 w-4"/>
                                网格视图
                            </Button>
                            <Button
                                variant={viewMode === 'tree' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setViewMode('tree')}
                                className="gap-2"
                            >
                                <List className="h-4 w-4"/>
                                层级视图
                            </Button>
                        </div>
                        <div>
                            {viewMode === 'grid' ? (
                                <></>
                            ) : (
                                <div >
                                    {/* 图例说明 */}
                                    <div className="flex flex-wrap justify-center gap-4 p-2 bg-gray-50 rounded-lg">
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <div className="w-3 h-3 bg-blue-500 rounded"></div>
                                            <span>基线数据集</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <div className="w-3 h-3 bg-green-500 rounded"></div>
                                            <span>随访数据集</span>
                                        </div>
                                        {/*<div className="flex items-center gap-2 text-sm text-gray-600">*/}
                                        {/*    <div className="w-3 h-3 bg-purple-500 rounded"></div>*/}
                                        {/*    <span>多级随访</span>*/}
                                        {/*</div>*/}
                                    </div>

                                </div>
                            )}
                        </div>
                    </div>


                    {/* Dataset Grid / Tree View - Scrollable Content */}
                    <div className="flex-1 overflow-hidden">
                        <ScrollArea className="h-full w-full flex-1">
                            <div className="flex-grow overflow-hidden min-h-[600px] p-6 pb-6">
                                <PaginatedList
                                    fetchData={fetchDatasets}
                                    renderItem={viewMode === 'grid' ? renderGridItem : renderTreeItem}
                                    pageSize={10}
                                    gridLayout={viewMode === 'grid'}
                                    gap={24}
                                    renderEmptyState={renderEmptyState}
                                    key={filtersChanged ? 'reset' : 'normal'} // Reset pagination when filters change
                                    autoLoad={true}
                                />
                            </div>
                        </ScrollArea>
                    </div>
                </div>

                <DatasetDetailModal
                    dataset={selectedDataset}
                    open={showDetail}
                    onOpenChange={setShowDetail}
                    useAdvancedQuery={isPlatformAdmin()} // Pass advanced query flag based on user role
                />
            </main>
        </div>
    );
};

export default Datasets;