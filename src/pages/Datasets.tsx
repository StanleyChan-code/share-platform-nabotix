import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatasetUpload } from "@/components/upload/DatasetUpload";
import { Search, Filter, Calendar, Users, Database, Download, Upload, X, List, Grid } from "lucide-react";
import { useState, useEffect } from "react";
import { useRealtimeQuery } from "@/hooks/useRealtimeQuery";
import { DatasetDetailModal } from "@/components/dataset/DatasetDetailModal";
import { DatasetTrendChart } from "@/components/dataset/DatasetTrendChart";
import { DatasetTreeView } from "@/components/dataset/DatasetTreeView";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

// Type mappings for database enum values
const typeLabels = {
  cohort: '队列研究',
  case_control: '病例对照研究', 
  cross_sectional: '横断面研究',
  rct: '随机对照试验',
  registry: '登记研究',
  biobank: '生物样本库',
  omics: '组学数据',
  wearable: '可穿戴设备'
};

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
  
  const { data: datasets, loading } = useRealtimeQuery('datasets', {
    select: '*, users!datasets_provider_id_fkey(real_name), research_subjects(name)',
    order: ['created_at', { ascending: false }]
  });

  const filteredDatasets = datasets.filter((dataset: any) => {
    const matchesSearch = dataset.title_cn?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (dataset.keywords || []).some((keyword: string) => keyword.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = selectedType === "all" || typeLabels[dataset.type as keyof typeof typeLabels] === selectedType || dataset.type === selectedType;
    const matchesCategory = selectedCategory === "all" || dataset.category === selectedCategory;
    
    // Date range filter
    const datasetDate = new Date(dataset.created_at);
    const matchesDateFrom = !dateFrom || datasetDate >= dateFrom;
    const matchesDateTo = !dateTo || datasetDate <= dateTo;
    
    return matchesSearch && matchesType && matchesCategory && matchesDateFrom && matchesDateTo;
  });

  const handleDatasetClick = (dataset: any) => {
    setSelectedDataset(dataset);
    setShowDetail(true);
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

        {/* Trend Chart */}
        {!loading && datasets.length > 0 && (
          <DatasetTrendChart datasets={datasets} />
        )}

        {/* Search and Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="grid gap-4 md:grid-cols-6">
              <div className="relative md:col-span-2">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="搜索数据集标题或关键词..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue placeholder="研究类型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部类型</SelectItem>
                  <SelectItem value="cohort">队列研究</SelectItem>
                  <SelectItem value="cross_sectional">横断面研究</SelectItem>
                  <SelectItem value="case_control">病例对照研究</SelectItem>
                  <SelectItem value="rct">随机对照试验</SelectItem>
                  <SelectItem value="registry">登记研究</SelectItem>
                  <SelectItem value="biobank">生物样本库</SelectItem>
                  <SelectItem value="omics">组学数据</SelectItem>
                  <SelectItem value="wearable">可穿戴设备</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="学科领域" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部领域</SelectItem>
                  <SelectItem value="心血管疾病">心血管疾病</SelectItem>
                  <SelectItem value="内分泌代谢">内分泌代谢</SelectItem>
                  <SelectItem value="神经系统疾病">神经系统疾病</SelectItem>
                  <SelectItem value="肿瘤学">肿瘤学</SelectItem>
                </SelectContent>
              </Select>
              
              {/* Date From */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal",
                      !dateFrom && "text-muted-foreground"
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {dateFrom ? format(dateFrom, "yyyy-MM-dd") : "开始日期"}
                    {dateFrom && (
                      <X
                        className="ml-auto h-4 w-4 opacity-50 hover:opacity-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDateFrom(undefined);
                        }}
                      />
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={dateFrom}
                    onSelect={setDateFrom}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>

              {/* Date To */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal",
                      !dateTo && "text-muted-foreground"
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {dateTo ? format(dateTo, "yyyy-MM-dd") : "结束日期"}
                    {dateTo && (
                      <X
                        className="ml-auto h-4 w-4 opacity-50 hover:opacity-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDateTo(undefined);
                        }}
                      />
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={dateTo}
                    onSelect={setDateTo}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </CardContent>
        </Card>

        {/* Results Summary */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            找到 {filteredDatasets.length} 个数据集
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

        {/* Dataset Grid / Tree View */}
        {loading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">加载中...</p>
          </div>
        ) : filteredDatasets.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">暂无符合条件的数据集</p>
          </div>
        ) : viewMode === 'tree' ? (
          <DatasetTreeView 
            datasets={filteredDatasets} 
            onDatasetClick={handleDatasetClick}
          />
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredDatasets.map((dataset: any) => (
              <Card 
                key={dataset.id} 
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleDatasetClick(dataset)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg leading-tight">{dataset.title_cn}</CardTitle>
                    <div className="flex flex-col gap-1 shrink-0">
                      <Badge variant="secondary">
                        {typeLabels[dataset.type as keyof typeof typeLabels] || dataset.type}
                      </Badge>
                      {dataset.parent_dataset_id && (
                        <Badge variant="outline" className="text-xs">
                          随访数据
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {(dataset.keywords || []).map((keyword: string, index: number) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {dataset.description}
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{dataset.record_count?.toLocaleString() || '未知'} 条记录</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Database className="h-4 w-4 text-muted-foreground" />
                      <span>{dataset.variable_count || '未知'} 个变量</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{dataset.start_date || '未设置'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Search className="h-4 w-4 text-muted-foreground" />
                      <span>{dataset.search_count || 0} 次查看</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div>
                      <p className="text-xs text-muted-foreground">
                        提供者: {dataset.users?.real_name || '未知'}
                      </p>
                      {dataset.principal_investigator && (
                        <p className="text-xs text-muted-foreground">
                          PI: {dataset.principal_investigator}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        发布于 {new Date(dataset.created_at).toLocaleDateString('zh-CN')}
                      </p>
                    </div>
                    <Button size="sm" className="gap-2">
                      <Download className="h-4 w-4" />
                      申请数据
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

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