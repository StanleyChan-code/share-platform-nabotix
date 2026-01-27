import { Navigation } from "@/components/Navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    FileText,
    Database,
    User,
    Hash,
    Trophy,
    Target,
    Code,
    Calendar,
    Award,
    BookOpen,
    ExternalLink,
    Search,
    Star,
    Download,
    Eye
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import SubmitOutputDialog from "@/components/outputs/SubmitOutputDialog";
import OutputDetailDialog from "@/components/outputs/OutputDetailDialog";
import { getAllOutputTypes, getJournalPartitionName, getOutputTypeDisplayName } from "@/lib/outputUtils";
import { outputApi, ResearchOutput } from "@/integrations/api/outputApi";
import {cn, formatDate } from "@/lib/utils";
import PaginatedList from "@/components/ui/PaginatedList";
import { useNavigate } from "react-router-dom";
import { useDebounce } from "@/hooks/useDebounce";
import {Input} from "@/components/ui/FormValidator.tsx";

const Outputs = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedType, setSelectedType] = useState("all");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
    const [selectedOutput, setSelectedOutput] = useState<ResearchOutput | null>(null);
    const [statistics, setStatistics] = useState({
        totalApprovedOutputs: 0,
        academicPapers: 0,
        patentOutputs: 0,
        totalCitations: 0
    });
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    
    const debouncedSearchTerm = useDebounce(searchTerm, 550);

    // Handle output ID from URL parameters
    useEffect(() => {
        const outputId = searchParams.get('id');
        if (outputId) {
            const fetchOutputById = async () => {
                try {
                    const response = await outputApi.getPublicOutputById(outputId);
                    if (response.success && response.data) {
                        setSelectedOutput(response.data);
                        setIsDetailDialogOpen(true);
                    } else {
                        console.error('Failed to fetch output by ID:', outputId);
                    }
                } catch (error) {
                    console.error('Error fetching output by ID:', error);
                }
            };

            fetchOutputById();
        }
    }, [searchParams]);

    const fetchOutputs = useCallback(async (page: number, size: number) => {
        return await outputApi.getPublicOutputs({
            page,
            size,
            sortBy: 'createdAt',
            sortDir: 'desc',
            type: selectedType !== "all" ? selectedType : undefined,
            titleOrAbstract: debouncedSearchTerm || undefined
        });
    }, [selectedType, debouncedSearchTerm]);

    const fetchStatistics = async () => {
        try {
            const stats = await outputApi.getOutputStatistics();
            setStatistics(stats.data);
        } catch (error) {
            console.error('Error fetching statistics:', error);
            throw error;
        }
    };

    useEffect(() => {
        fetchStatistics().catch(error => {
            console.error('Error fetching statistics:', error);
        });
    }, []);

    const handleSubmitOutput = async () => {
        // Will need to trigger a refresh in the paginated list
    };

    const handleOutputClick = (output: ResearchOutput) => {
        setSelectedOutput(output);
        setIsDetailDialogOpen(true);
    };

    const renderOutputItem = (output: ResearchOutput) => {
        const isHighQuality = output.value > 2;

        return (
            <Card
                key={output.id}
                className={cn(
                    "group relative overflow-hidden rounded-xl",
                    // 默认状态：显示浅色边框
                    "border-2",
                    "bg-gradient-to-br from-white via-white to-blue-50/20",
                    "transition-all duration-300 ease-in-out",
                    "shadow-sm hover:shadow-lg hover:shadow-blue-100/40",
                    // 悬停时统一变为蓝色边框
                    "hover:border-blue-300/80",
                    "hover:-translate-y-0.5"
                )}
            >
                {/* 类型角标 */}
                <div className={`absolute top-0 right-0 px-3 py-1.5 text-xs font-bold text-white rounded-bl-lg shadow-sm ${
                    output.type === "PROJECT" ? "bg-gradient-to-r from-purple-600 to-purple-700" :
                        output.type === "PAPER" ? "bg-gradient-to-r from-blue-600 to-blue-700" :
                            output.type === "PUBLICATION" ? "bg-gradient-to-r from-indigo-600 to-indigo-700" :
                                output.type.includes('PATENT') ? "bg-gradient-to-r from-green-600 to-green-700" :
                                    output.type === "SOFTWARE_COPYRIGHT" ? "bg-gradient-to-r from-orange-600 to-orange-700" :
                                        output.type === "OTHER_AWARD" ? "bg-gradient-to-r from-red-600 to-red-700" :
                                            "bg-gradient-to-r from-gray-600 to-gray-700"
                }`}>
                    {getOutputTypeDisplayName(output.type)}
                </div>

                <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-4 min-w-0">
                            {/* 标题和类型区域 */}
                            <div className="flex items-start justify-between gap-4 mb-4 pr-16">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-3 mb-3">
                                        <h3 onClick={() => handleOutputClick(output)}
                                            className="font-bold text-xl leading-tight text-gray-900 transition-colors break-all whitespace-pre-wrap line-clamp-2 flex-1 pr-2 cursor-pointer hover:text-blue-600">
                                          {output.title}
                                        </h3>
                                        <div className="flex flex-col items-end gap-2 ml-2 flex-shrink-0">
                                            {isHighQuality && (
                                                <span className="bg-gradient-to-r from-amber-400 to-orange-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap shadow-md flex items-center gap-1.5">
                                                    <Award className="h-3.5 w-3.5" />
                                                    高质量成果
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* 类型徽章和相关信息 */}
                                    <div className="flex items-center flex-wrap gap-2">
                                        {output.type === "PAPER" && output.otherInfo?.journal && (
                                            <div className="flex items-center gap-2 bg-blue-50/80 rounded-xl px-3 py-1.5 border border-blue-200/60 shadow-sm">
                                                <FileText className="h-4 w-4 text-blue-600" />
                                                <span className="text-sm font-semibold text-blue-800 whitespace-nowrap">
                                                    发表于 {output.otherInfo.journal}
                                                </span>
                                                {output.otherInfo?.journalPartition && (
                                                    <Badge className="bg-blue-600 text-white text-xs px-2.5 py-1 font-bold shadow-sm">
                                                        {getJournalPartitionName(output.otherInfo.journalPartition)}
                                                    </Badge>
                                                )}
                                            </div>
                                        )}

                                        {output.type.includes('PATENT') && output.outputNumber && (
                                            <div className="flex items-center gap-2 bg-green-50/80 rounded-xl px-3 py-1.5 border border-green-200/60 shadow-sm">
                                                <Hash className="h-4 w-4 text-green-600" />
                                                <span className="text-sm font-semibold text-green-800 whitespace-nowrap">
                                                    专利编号: {output.outputNumber}
                                                </span>
                                            </div>
                                        )}

                                        {output.type === "PROJECT" && output.otherInfo?.projectNumber && (
                                            <div className="flex items-center gap-2 bg-purple-50/80 rounded-xl px-3 py-1.5 border border-purple-200/60 shadow-sm">
                                                <Hash className="h-4 w-4 text-purple-600" />
                                                <span className="text-sm font-semibold text-purple-800 whitespace-nowrap">
                                                    项目编号: {output.otherInfo.projectNumber}
                                                </span>
                                            </div>
                                        )}

                                        {output.type === "OTHER_AWARD" && output.otherInfo?.awardLevel && (
                                            <div className="flex items-center gap-2 bg-red-50/80 rounded-xl px-3 py-1.5 border border-red-200/60 shadow-sm">
                                                <Trophy className="h-4 w-4 text-red-600" />
                                                <span className="text-sm font-semibold text-red-800 whitespace-nowrap">
                                                    {output.otherInfo.awardLevel}级奖项
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* 外部链接 */}
                                <div className="flex items-center gap-2 text-sm shrink-0 mt-1">
                                    {output.publicationUrl && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="rounded-xl p-2 border-blue-300 hover:bg-blue-50 hover:border-blue-400 transition-all duration-200 shadow-sm hover:shadow-md"
                                            asChild
                                        >
                                            <a
                                                href={output.publicationUrl?.startsWith('http') ? output.publicationUrl : `https://${output.publicationUrl}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <ExternalLink className="h-4 w-4 text-blue-600" />
                                            </a>
                                        </Button>
                                    )}
                                </div>
                            </div>

                            {/* 摘要 */}
                            {output.abstractText && (
                                <div className="bg-gradient-to-r from-gray-50/50 to-blue-50/20 rounded-xl p-4 border border-gray-200/50 shadow-sm">
                                    <p className="text-sm text-gray-700 leading-relaxed line-clamp-3 break-all whitespace-pre-wrap font-medium">
                                        {output.abstractText}
                                    </p>
                                </div>
                            )}

                            {/* 元信息区域 */}
                            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 pt-3 border-t border-gray-200/50">
                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                    <div className="flex items-center gap-2 bg-white/80 rounded-xl px-3 py-1.5 border shadow-sm">
                                        <Database className="h-4 w-4 text-purple-600" />
                                        <a
                                            href={`/datasets?id=${output.dataset.id}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="font-semibold text-gray-800 text-sm truncate hover:text-blue-600 hover:underline max-w-[200px] lg:max-w-[300px]">
                                            基于数据集: {output.dataset?.titleCn || '未知数据集'}
                                        </a>
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-2 text-xs">
                                    <div className="flex items-center gap-2 bg-white/80 rounded-xl px-3 py-1.5 border shadow-sm">
                                        <User className="h-4 w-4 text-green-600" />
                                        <span className="font-medium text-gray-700 whitespace-nowrap">提供者: {output.submitter?.realName || '未知用户'}</span>
                                    </div>
                                    <div className="flex items-center gap-2 bg-white/80 rounded-xl px-3 py-1.5 border shadow-sm">
                                        <Calendar className="h-4 w-4 text-blue-600" />
                                        <span className="font-medium text-gray-700 whitespace-nowrap">{formatDate(output.createdAt)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    };

    const renderEmptyState = () => (
        <div className="text-center py-16 text-muted-foreground">
            <FileText className="h-16 w-16 mx-auto mb-4 opacity-30" />
            <p className="text-xl font-medium mb-2">暂无研究成果</p>
            <p className="text-sm">当前搜索条件下没有找到相关研究成果</p>
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
                            研究成果
                        </h1>
                        <p className="text-lg text-muted-foreground max-w-2xl">
                            基于平台数据集产生的学术论文、专利等研究成果展示
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <Button
                            className="gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                            onClick={() => navigate('/profile?tab=outputs')}
                        >
                            <FileText className="h-4 w-4"/>
                            我的成果
                        </Button>
                    </div>
                </div>

                {/* Statistics */}
                <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
                    <Card className="bg-gradient-to-br from-white to-blue-50/30 border-blue-200/50 shadow-lg hover:shadow-xl transition-shadow duration-300">
                        <CardContent className="p-6">
                            <div className="flex items-center space-x-3">
                                <div className="p-2 bg-blue-100 rounded-lg">
                                    <FileText className="h-6 w-6 text-blue-600"/>
                                </div>
                                <div>
                                    <p className="text-3xl font-bold text-gray-900">{statistics.totalApprovedOutputs}</p>
                                    <p className="text-sm text-muted-foreground font-medium">研究成果总数</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-white to-green-50/30 border-green-200/50 shadow-lg hover:shadow-xl transition-shadow duration-300">
                        <CardContent className="p-6">
                            <div className="flex items-center space-x-3">
                                <div className="p-2 bg-green-100 rounded-lg">
                                    <BookOpen className="h-6 w-6 text-green-600"/>
                                </div>
                                <div>
                                    <p className="text-3xl font-bold text-gray-900">{statistics.academicPapers}</p>
                                    <p className="text-sm text-muted-foreground font-medium">学术论文</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-white to-purple-50/30 border-purple-200/50 shadow-lg hover:shadow-xl transition-shadow duration-300">
                        <CardContent className="p-6">
                            <div className="flex items-center space-x-3">
                                <div className="p-2 bg-purple-100 rounded-lg">
                                    <Award className="h-6 w-6 text-purple-600"/>
                                </div>
                                <div>
                                    <p className="text-3xl font-bold text-gray-900">{statistics.patentOutputs}</p>
                                    <p className="text-sm text-muted-foreground font-medium">专利成果</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Search and Filter */}
                <Card className="sticky top-16 z-50 bg-white/80 backdrop-blur-sm border-blue-200/50 shadow-xl">
                    <CardContent className="p-6">
                        <div className="flex flex-row items-center gap-4">
                            <div className="flex-1 w-full sm:max-w-md">
                                <div className="relative min-w-48">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                                    <Input
                                        placeholder="搜索成果标题、摘要或简介..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10 h-11 text-base border-blue-200/50 focus:border-blue-300 transition-colors"
                                    />
                                </div>
                            </div>

                            <Select value={selectedType} onValueChange={setSelectedType}>
                                <SelectTrigger className="w-full sm:w-48 h-11 border-blue-200/50 focus:border-blue-300">
                                    <SelectValue placeholder="成果类型" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">全部类型</SelectItem>
                                    {getAllOutputTypes().map(({ name, value }) => (
                                        <SelectItem key={value} value={value}>
                                            {name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Button
                                variant="outline"
                                className="h-11 border-blue-200/50 text-blue-700 hover:bg-blue-50 whitespace-nowrap"
                                onClick={() => {
                                    setSearchTerm("");
                                    setSelectedType("all");
                                }}
                            >
                                重置筛选
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Results */}
                <div className="space-y-6">
                    <PaginatedList
                        fetchData={fetchOutputs}
                        renderItem={renderOutputItem}
                        renderEmptyState={renderEmptyState}
                        pageSize={10}
                    />
                </div>

                <SubmitOutputDialog
                    open={isDialogOpen}
                    onOpenChange={setIsDialogOpen}
                    onSubmit={handleSubmitOutput}
                />

                <OutputDetailDialog
                    open={isDetailDialogOpen}
                    onOpenChange={setIsDetailDialogOpen}
                    output={selectedOutput}
                    managementMode={false}
                />
            </main>
        </div>
    );
};

export default Outputs;