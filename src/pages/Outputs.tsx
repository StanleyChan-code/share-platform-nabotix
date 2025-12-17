import {Navigation} from "@/components/Navigation";
import {Card, CardContent} from "@/components/ui/card";
import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {FileText, Award, BookOpen, TrendingUp, ExternalLink, Plus, Search} from "lucide-react";
import {useState, useEffect} from "react";
import SubmitOutputDialog from "@/components/outputs/SubmitOutputDialog";
import {useToast} from "@/hooks/use-toast";
import {getOutputTypeDisplayName} from "@/lib/outputUtils";
import {outputApi, ResearchOutput} from "@/integrations/api/outputApi";
import {formatDate} from "@/lib/utils";

const Outputs = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedType, setSelectedType] = useState("all");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [outputs, setOutputs] = useState<ResearchOutput[]>([]);
    const [statistics, setStatistics] = useState({
        totalApprovedOutputs: 0,
        academicPapers: 0,
        patentOutputs: 0,
        totalCitations: 0
    });
    const [loading, setLoading] = useState(true);
    const {toast} = useToast();

    useEffect(() => {
        Promise.all([fetchOutputs(), fetchStatistics()])
            .catch(error => {
                console.error('Error fetching data:', error);
                toast({
                    title: "加载失败",
                    description: "无法加载研究成果数据",
                    variant: "destructive"
                });
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    const fetchOutputs = async () => {
        try {
            const data = await outputApi.getPublicOutputs({sortBy: 'createdAt', sortDir: 'desc'});
            setOutputs(data.content);
        } catch (error) {
            console.error('Error fetching outputs:', error);
            throw error;
        }
    };

    const fetchStatistics = async () => {
        try {
            const stats = await outputApi.getOutputStatistics();
            setStatistics(stats.data);
        } catch (error) {
            console.error('Error fetching statistics:', error);
            throw error;
        }
    };

    const handleSubmitOutput = async () => {
        // Refresh the outputs list after successful submission
        await fetchOutputs();
    };

    const filteredOutputs = outputs.filter(output => {
        const matchesSearch = output.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            output.abstractText?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = selectedType === "all" || output.type === selectedType;

        return matchesSearch && matchesType;
    });

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

                    <Button className="gap-2" onClick={() => setIsDialogOpen(true)}>
                        <Plus className="h-4 w-4"/>
                        提交成果
                    </Button>
                </div>

                {/* Statistics */}
                <div className="grid gap-4 md:grid-cols-4">
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

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center space-x-2">
                                <TrendingUp className="h-5 w-5 text-primary"/>
                                <div>
                                    <p className="text-2xl font-bold">
                                        {statistics.totalCitations}
                                    </p>
                                    <p className="text-xs text-muted-foreground">总引用次数</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Search and Filter */}
                <Card>
                    <CardContent className="p-6">
                        <div className="flex gap-4">
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
                    </CardContent>
                </Card>

                {/* Results */}
                <div className="space-y-4">
                    {loading ? (
                        <div className="text-center py-8 text-muted-foreground">
                            加载中...
                        </div>
                    ) : (
                        filteredOutputs.map((output) => (
                            <Card key={output.id}>
                                <CardContent className="p-6">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 space-y-3">
                                            <div className="flex items-start gap-3">
                                                <div className="flex-1">
                                                    <h3 className="font-semibold text-lg">{output.title}</h3>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <Badge
                                                            variant={output.type === "paper" ? "default" : "secondary"}>
                                                            {getOutputTypeDisplayName(output.type)}
                                                        </Badge>
                                                        {output.otherInfo?.journal && (
                                                            <span className="text-sm text-muted-foreground">
                                发表于 {output.otherInfo.journal}
                              </span>
                                                        )}
                                                        {output.outputNumber && output.type.includes('patent') && (
                                                            <span className="text-sm text-muted-foreground">
                                编号: {output.outputNumber}
                              </span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-4 text-sm">
                                                    {output.citationCount > 0 && (
                                                        <div className="text-center">
                                                            <p className="font-bold text-lg">{output.citationCount}</p>
                                                            <p className="text-xs text-muted-foreground">引用</p>
                                                        </div>
                                                    )}
                                                    {output.publicationUrl && (
                                                        <Button variant="outline" size="sm" asChild>
                                                            <a href={output.publicationUrl?.startsWith('http') ? output.publicationUrl : `https://${output.publicationUrl}`}
                                                               target="_blank"
                                                               rel="noopener noreferrer"
                                                            >
                                                                <ExternalLink className="h-4 w-4"/>
                                                            </a>
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>

                                            <p className="text-sm text-muted-foreground">{output.abstractText}</p>

                                            <div
                                                className="flex items-center justify-between text-xs text-muted-foreground">
                                                <div className="flex items-center gap-4">
                                                    <span>基于数据集：{output.dataset?.titleCn || '未知数据集'}</span>
                                                    <span>提交者：{output.submitter?.realName || '未知用户'}</span>
                                                    <span>提交时间：{formatDate(output.createdAt)}</span>
                                                    {output.approved === null && (
                                                        <Badge variant="secondary">待审核</Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>

                <SubmitOutputDialog
                    open={isDialogOpen}
                    onOpenChange={setIsDialogOpen}
                    onSubmit={handleSubmitOutput}
                />
            </main>
        </div>
    );
};

export default Outputs;