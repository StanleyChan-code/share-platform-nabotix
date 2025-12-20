import {Navigation} from "@/components/Navigation";
import {Card, CardContent} from "@/components/ui/card";
import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";

import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {FileText,Database,User,Hash ,Trophy, Target,Code  ,Calendar , Award, BookOpen, ExternalLink, Search} from "lucide-react";
import {useState, useEffect, useCallback} from "react";
import SubmitOutputDialog from "@/components/outputs/SubmitOutputDialog";
import OutputDetailDialog from "@/components/outputs/OutputDetailDialog";
import {getAllOutputTypes, getJournalPartitionName, getOutputTypeDisplayName} from "@/lib/outputUtils";
import {outputApi, ResearchOutput} from "@/integrations/api/outputApi";
import {formatDate} from "@/lib/utils";
import PaginatedList from "@/components/ui/PaginatedList";
import { useNavigate } from "react-router-dom";

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

    const fetchOutputs = useCallback(async (page: number, size: number) => {
        return await outputApi.getPublicOutputs({
            page,
            size,
            sortBy: 'createdAt',
            sortDir: 'desc',
            type: selectedType !== "all" ? selectedType : undefined,
            keyword: searchTerm || undefined
        });
    }, [selectedType, searchTerm]);

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

    // 添加搜索和过滤的useEffect
    useEffect(() => {
        const refreshStatistics = async () => {
            try {
                await fetchStatistics();
            } catch (error) {
                console.error('Error refreshing statistics:', error);
            }
        };

        // 添加防抖，避免频繁请求
        const timeoutId = setTimeout(() => {
            refreshStatistics();
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [searchTerm, selectedType]);

    const renderOutputItem = (output: ResearchOutput) => (
        <Card
            key={output.id}
            className="group hover:cursor-pointer hover:shadow-lg transition-all duration-300 border-2 border-transparent hover:border-blue-100 bg-gradient-to-br from-white to-blue-50/30 relative overflow-hidden"
            onClick={() => handleOutputClick(output)}
        >
            {/* 类型角标 */}
            <div className={`absolute top-0 right-0 px-3 py-1 text-xs font-bold text-white rounded-bl-lg ${
                output.type === "PROJECT" ? "bg-purple-600" :
                    output.type === "PAPER" ? "bg-blue-600" :
                        output.type === "PUBLICATION" ? "bg-indigo-600" :
                            output.type.includes('PATENT') ? "bg-green-600" :
                                output.type === "SOFTWARE_COPYRIGHT" ? "bg-orange-600" :
                                    output.type === "OTHER_AWARD" ? "bg-red-600" :
                                        "bg-gray-600"
            }`}>
                {getOutputTypeDisplayName(output.type)}
            </div>

            <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-4 min-w-0">
                        {/* 标题和类型区域 */}
                        <div className="flex items-start justify-between gap-4 mb-3 pr-16"> {/* 为角标留出空间 */}
                            <div className="flex-1 min-w-0">
                                <h3
                                    className="font-semibold text-xl leading-tight text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 mb-3"
                                    title={output.title}
                                >
                                    {output.title}
                                </h3>

                                {/* 类型徽章和相关信息 */}
                                <div className="flex items-center flex-wrap gap-3">
                                    {/* 主类型徽章 - 更大更醒目 */}
                                    <Badge
                                        variant="default"
                                        className={`px-4 py-2 text-sm font-bold border-2 ${
                                            output.type === "PROJECT" ? "bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-200" :
                                                output.type === "PAPER" ? "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200" :
                                                    output.type === "PUBLICATION" ? "bg-indigo-100 text-indigo-800 border-indigo-200 hover:bg-indigo-200" :
                                                        output.type.includes('PATENT') ? "bg-green-100 text-green-800 border-green-200 hover:bg-green-200" :
                                                            output.type === "SOFTWARE_COPYRIGHT" ? "bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-200" :
                                                                output.type === "OTHER_AWARD" ? "bg-red-100 text-red-800 border-red-200 hover:bg-red-200" :
                                                                    "bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200"
                                        }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            {output.type === "PROJECT" && <Target className="h-4 w-4" />}
                                            {output.type === "PAPER" && <FileText className="h-4 w-4" />}
                                            {output.type === "PUBLICATION" && <BookOpen className="h-4 w-4" />}
                                            {output.type.includes('PATENT') && <Award className="h-4 w-4" />}
                                            {output.type === "SOFTWARE_COPYRIGHT" && <Code className="h-4 w-4" />}
                                            {output.type === "OTHER_AWARD" && <Trophy className="h-4 w-4" />}
                                            <span>{getOutputTypeDisplayName(output.type)}</span>
                                        </div>
                                    </Badge>

                                    {/* 论文类型特有信息 */}
                                    {output.type === "PAPER" && output.otherInfo?.journal && (
                                        <div className="flex items-center gap-2 bg-blue-50 rounded-full px-3 py-1 border border-blue-200">
                                            <FileText className="h-4 w-4 text-blue-600" />
                                            <span className="text-sm font-medium text-blue-700 whitespace-nowrap">
                                        发表于 {output.otherInfo.journal}
                                    </span>
                                            {output.otherInfo?.journalPartition && (
                                                <Badge className="bg-blue-600 text-white text-xs px-2 py-0.5 font-bold">
                                                    {getJournalPartitionName(output.otherInfo.journalPartition)}
                                                </Badge>
                                            )}
                                        </div>
                                    )}

                                    {/* 专利类型特有信息 */}
                                    {output.type.includes('PATENT') && output.outputNumber && (
                                        <div className="flex items-center gap-2 bg-green-50 rounded-full px-3 py-1 border border-green-200">
                                            <Hash className="h-4 w-4 text-green-600" />
                                            <span className="text-sm font-medium text-green-700 whitespace-nowrap">
                                        专利编号: {output.outputNumber}
                                    </span>
                                        </div>
                                    )}

                                    {/* 项目类型特有信息 */}
                                    {output.type === "PROJECT" && output.otherInfo?.projectNumber && (
                                        <div className="flex items-center gap-2 bg-purple-50 rounded-full px-3 py-1 border border-purple-200">
                                            <Hash className="h-4 w-4 text-purple-600" />
                                            <span className="text-sm font-medium text-purple-700 whitespace-nowrap">
                                        项目编号: {output.otherInfo.projectNumber}
                                    </span>
                                        </div>
                                    )}

                                    {/* 获奖类型特有信息 */}
                                    {output.type === "OTHER_AWARD" && output.otherInfo?.awardLevel && (
                                        <div className="flex items-center gap-2 bg-red-50 rounded-full px-3 py-1 border border-red-200">
                                            <Trophy className="h-4 w-4 text-red-600" />
                                            <span className="text-sm font-medium text-red-700 whitespace-nowrap">
                                        {output.otherInfo.awardLevel}级奖项
                                    </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* 外部链接 */}
                            <div className="flex items-center gap-2 text-sm shrink-0">
                                {output.publicationUrl && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="rounded-full p-2 border-blue-200 hover:bg-blue-50 hover:border-blue-300 transition-colors shadow-sm"
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

                        {/* 摘要 - 限制4行 */}
                        {output.abstractText && (
                            <div className="bg-gradient-to-r from-gray-50 to-blue-50/30 rounded-lg p-4 border border-gray-200">
                                <p
                                    className="text-sm text-gray-700 leading-relaxed line-clamp-4 font-medium"
                                    title={output.abstractText}
                                >
                                    {output.abstractText}
                                </p>
                            </div>
                        )}

                        {/* 元信息区域 */}
                        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pt-3 border-t border-gray-200">
                            {/* 数据集信息和状态 - 左侧 */}
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                                <div className="flex items-center gap-2 bg-white rounded-full px-3 py-1.5 border shadow-sm">
                                    <Database className="h-4 w-4 text-purple-600" />
                                    <span
                                        className="font-medium text-gray-700 truncate max-w-[300px]"
                                        title={output.dataset?.titleCn || '未知数据集'}
                                    >
                                        基于: {output.dataset?.titleCn || '未知数据集'}
                                    </span>
                                </div>
                            </div>

                            {/* 提交者和时间 - 右侧 */}
                            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 text-sm text-gray-600">
                                <div className="flex items-center gap-2 bg-white rounded-full px-3 py-1.5 border shadow-sm">
                                    <User className="h-4 w-4 text-green-600" />
                                    <span className="whitespace-nowrap">提交者: {output.submitter?.realName || '未知用户'}</span>
                                </div>
                                <div className="flex items-center gap-2 bg-white rounded-full px-3 py-1.5 border shadow-sm">
                                    <Calendar className="h-4 w-4 text-blue-600" />
                                    <span className="whitespace-nowrap">{formatDate(output.createdAt)}</span>
                                </div>
                            </div>
                        </div>

                        {/* 额外信息展示 */}
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                            {output.citations && output.citations > 0 && (
                                <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-full">
                                    <Star className="h-3 w-3 text-amber-500" />
                                    <span className="font-medium">被引用 {output.citations} 次</span>
                                </div>
                            )}
                            {output.downloadCount !== undefined && output.downloadCount > 0 && (
                                <div className="flex items-center gap-1 bg-blue-50 px-2 py-1 rounded-full">
                                    <Download className="h-3 w-3 text-blue-500" />
                                    <span className="font-medium">下载 {output.downloadCount} 次</span>
                                </div>
                            )}
                            {output.viewCount !== undefined && output.viewCount > 0 && (
                                <div className="flex items-center gap-1 bg-green-50 px-2 py-1 rounded-full">
                                    <Eye className="h-3 w-3 text-green-500" />
                                    <span className="font-medium">浏览 {output.viewCount} 次</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );

    const renderEmptyState = () => (
        <div className="text-center py-12 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg">暂无研究成果</p>
            <p className="text-sm mt-2">当前搜索条件下没有找到相关研究成果</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-background">
            <Navigation/>

            <main className="container mx-auto py-6 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="space-y-2">
                        <h1 className="text-3xl font-bold">研究成果</h1>
                        <p className="text-muted-foreground">
                            基于平台数据集产生的学术论文、专利等研究成果展示
                        </p>
                    </div>

                    <Button className="gap-2" onClick={() => navigate('/profile?tab=outputs')}>
                        <FileText className="h-4 w-4"/>
                        我的成果
                    </Button>
                </div>

                {/* Statistics */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center space-x-2">
                                <FileText className="h-5 w-5 text-primary"/>
                                <div>
                                    <p className="text-2xl font-bold">{statistics.totalApprovedOutputs}</p>
                                    <p className="text-xs text-muted-foreground">研究成果总数</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center space-x-2">
                                <BookOpen className="h-5 w-5 text-primary"/>
                                <div>
                                    <p className="text-2xl font-bold">
                                        {statistics.academicPapers}
                                    </p>
                                    <p className="text-xs text-muted-foreground">学术论文</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center space-x-2">
                                <Award className="h-5 w-5 text-primary"/>
                                <div>
                                    <p className="text-2xl font-bold">
                                        {statistics.patentOutputs}
                                    </p>
                                    <p className="text-xs text-muted-foreground">专利成果</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Search and Filter */}
                <div className="sticky top-14 z-50 bg-background/95 supports-[backdrop-filter]:bg-background/95">
                    <div className="flex items-center gap-3 p-4">
                        <Select value={selectedType} onValueChange={setSelectedType}>
                            <SelectTrigger className="w-60">
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
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                            <Input
                                placeholder="搜索成果标题或摘要..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </div>
                </div>

                {/* Results */}
                <div className="space-y-2">
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
                />
            </main>
        </div>
    );
};

export default Outputs;