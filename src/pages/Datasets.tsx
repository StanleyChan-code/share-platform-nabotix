import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DatasetUpload } from "@/components/upload/DatasetUpload";
import { Upload, List, Grid } from "lucide-react";
import { useState, useEffect } from "react";
import { DatasetDetailModal } from "@/components/dataset/DatasetDetailModal";
import { DatasetTreeView } from "@/components/dataset/DatasetTreeView";
import { DatasetGrid } from "@/components/dataset/DatasetGrid";
import { DatasetFilters } from "@/components/dataset/DatasetFilters";
import { DatasetTypes } from "@/lib/enums";
import { api } from "@/integrations/api/client";
import { DatasetAnnualChart } from "@/components/dataset/DatasetAnnualChart";
import { getAnnualDatasetStatistics } from "@/integrations/api/statisticsApi";
import {ResearchSubject} from "@/integrations/api/datasetApi.ts";

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
  const [datasets, setDatasets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [researchSubjects, setResearchSubjects] = useState<ResearchSubject[]>([]);
  const [annualData, setAnnualData] = useState<{year: number, count: number}[]>([]);
  const [annualLoading, setAnnualLoading] = useState(true);

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
        const response = await api.get<ResearchSubject[]>('/research-subjects');
        if (response.data.success) {
          setResearchSubjects(response.data.data);
        }
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
  
  // Fetch datasets using API with query parameters
  const fetchDatasets = async () => {
    try {
      setLoading(true);
      let url = '/datasets/query?loadTimeline=true';
      
      // Add search term if exists
      if (searchTerm) {
        url += `titleCnOrKey=${encodeURIComponent(searchTerm)}&`;
      }
      
      // Add type filter if not "all"
      if (selectedType !== "all") {
        // Map display labels back to API enum values
        const typeEnumValue = Object.keys(typeLabels).find(
          key => typeLabels[key as keyof typeof typeLabels] === selectedType
        ) || selectedType;
        url += `type=${typeEnumValue}&`;
      }
      
      // Add subject area filter if not "all"
      if (selectedCategory !== "all") {
        const subject = researchSubjects.find(s => s.name === selectedCategory);
        if (subject) {
          url += `subjectAreaId=${subject.id}&`;
        }
      }
      
      // Add date filters
      if (dateFrom) {
        url += `currentVersionDateFrom=${dateFrom.toISOString()}&`;
      }
      
      if (dateTo) {
        url += `currentVersionDateTo=${dateTo.toISOString()}&`;
      }
      
      // Remove trailing '&' or '?'
      url = url.endsWith('&') || url.endsWith('?') ? url.slice(0, -1) : url;
      
      const response = await api.get(url);
      if (response.data.success) {
        setDatasets(response.data.data.content || response.data.data);
      }
    } catch (error) {
      console.error('Error fetching datasets:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch datasets when filters change
  useEffect(() => {
    fetchDatasets();
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
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-4">
            <h1 className="text-3xl font-bold">数据集目录</h1>
            <p className="text-muted-foreground">
              浏览已发布的临床研究数据集，支持按研究类型、学科领域筛选查找
            </p>
          </div>
          <Button onClick={() => setShowUpload(!showUpload)} className="gap-2">
            <Upload className="h-4 w-4" />
            {showUpload ? '隐藏上传' : '上传数据集'}
          </Button>
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
          <DatasetAnnualChart data={annualData} />
        )}

        {/* Main Content Area with Fixed Height */}
        <div className="h-[calc(100vh-220px)] flex flex-col border rounded-lg">
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
            <p className="text-sm text-muted-foreground">
              找到 {datasets.length} 个数据集
            </p>
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="gap-2"
              >
                <Grid className="h-4 w-4" />
                网格视图
              </Button>
              <Button
                variant={viewMode === 'tree' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('tree')}
                className="gap-2"
              >
                <List className="h-4 w-4" />
                层级视图
              </Button>
            </div>
          </div>

          {/* Dataset Grid / Tree View - Scrollable Content */}
          <div className="flex-grow overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">加载中...</p>
              </div>
            ) : datasets.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">暂无符合条件的数据集</p>
              </div>
            ) : viewMode === 'tree' ? (
              <div className="h-full">
                <DatasetTreeView 
                  datasets={datasets} 
                  onDatasetClick={handleDatasetClick}
                />
              </div>
            ) : (
              <div className="h-full p-4">
                <DatasetGrid 
                  datasets={datasets} 
                  onDatasetClick={handleDatasetClick}
                />
              </div>
            )}
          </div>
        </div>

        <DatasetDetailModal
          dataset={selectedDataset}
          open={showDetail}
          onOpenChange={setShowDetail}
        />
      </main>
    </div>
  );
};

export default Datasets;