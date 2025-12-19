import {Navigation} from "@/components/Navigation";
import {Card, CardContent} from "@/components/ui/card";
import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {FileText, Award, BookOpen, TrendingUp, ExternalLink, Plus, Search} from "lucide-react";
import {useState, useEffect, useCallback} from "react";
import SubmitOutputDialog from "@/components/outputs/SubmitOutputDialog";
import OutputDetailDialog from "@/components/outputs/OutputDetailDialog";
import {getOutputTypeDisplayName} from "@/lib/outputUtils";
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
            className="hover:cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => handleOutputClick(output)}
        >
            <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-3 min-w-0">
                        {/* 标题和类型区域 */}
                        <div className="flex items-start gap-3">
                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-lg truncate" title={output.title}>
                                    {output.title}
                                </h3>
                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                    <Badge variant={output.type === "PAPER" ? "default" : "secondary"}>
                                        {getOutputTypeDisplayName(output.type)}
                                    </Badge>
                                    {output.otherInfo?.journal && (
                                        <span className="text-sm text-muted-foreground whitespace-nowrap">
                                            发表于 {output.otherInfo.journal}
                                        </span>
                                    )}
                                    {output.outputNumber && output.type.includes('patent') && (
                                        <span className="text-sm text-muted-foreground whitespace-nowrap">
                                            编号: {output.outputNumber}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* 外部链接 */}
                            <div className="flex items-center gap-4 text-sm shrink-0">
                                {output.publicationUrl && (
                                    <Button variant="outline" size="sm" asChild>
                                        <a
                                            href={output.publicationUrl?.startsWith('http') ? output.publicationUrl : `https://${output.publicationUrl}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <ExternalLink className="h-4 w-4"/>
                                        </a>
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* 摘要 - 限制4行 */}
                        <p
                            className="text-sm text-muted-foreground line-clamp-4"
                            title={output.abstractText}
                        >
                            {output.abstractText}
                        </p>

                        {/* 元信息区域 - 响应式布局 */}
                        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-2 text-sm text-muted-foreground">
                            {/* 数据集信息 - 左侧 */}
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                                <span
                                    className="max-w-[500px] truncate"
                                    title={output.dataset?.titleCn || '未知数据集'}
                                >
                                    基于数据集：
                                    {output.dataset?.titleCn && output.dataset.titleCn.length > 30
                                        ? `${output.dataset.titleCn.substring(0, 30)}...`
                                        : output.dataset?.titleCn || '未知数据集'
                                    }
                                </span>
                                {output.approved === null && (
                                    <Badge variant="secondary" className="whitespace-nowrap shrink-0">待审核</Badge>
                                )}
                            </div>

                            {/* 提交者和时间 - 右侧，响应式布局 */}
                            <div className="flex flex-col xs:flex-row gap-1 xs:gap-3 lg:justify-end w-full lg:w-auto">
                                <span className="whitespace-nowrap">提交者：{output.submitter?.realName || '未知用户'}</span>
                                <span className="whitespace-nowrap">提交时间：{formatDate(output.createdAt)}</span>
                            </div>
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
                <div className="flex sticky top-12 z-5000 bg-background/95 backdrop-blur pt-8 pb-4 gap-2">
                    <div className="relative flex-1">
                        <Search
                            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4"/>
                        <Input
                            placeholder="搜索成果标题或摘要..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <Select value={selectedType} onValueChange={setSelectedType}>
                        <SelectTrigger className="w-40">
                            <SelectValue placeholder="成果类型"/>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">全部类型</SelectItem>
                            <SelectItem value="project">{getOutputTypeDisplayName("project")}</SelectItem>
                            <SelectItem value="paper">{getOutputTypeDisplayName("paper")}</SelectItem>
                            <SelectItem
                                value="publication">{getOutputTypeDisplayName("publication")}</SelectItem>
                            <SelectItem
                                value="invention_patent">{getOutputTypeDisplayName("invention_patent")}</SelectItem>
                            <SelectItem
                                value="utility_patent">{getOutputTypeDisplayName("utility_patent")}</SelectItem>
                            <SelectItem
                                value="software_copyright">{getOutputTypeDisplayName("software_copyright")}</SelectItem>
                            <SelectItem
                                value="other_award">{getOutputTypeDisplayName("other_award")}</SelectItem>
                        </SelectContent>
                    </Select>
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