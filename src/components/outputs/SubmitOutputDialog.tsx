import {useState} from "react";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Textarea} from "@/components/ui/textarea";
import {Label} from "@/components/ui/label";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
import {Loader2} from "lucide-react";
import {ScrollArea} from "@/components/ui/scroll-area";
import {useToast} from "@/hooks/use-toast";
import {getOutputTypeDisplayName} from "@/lib/outputUtils";
import {outputApi} from "@/integrations/api/outputApi";
import {Dataset} from "@/integrations/api/datasetApi";
import {DatasetTypes} from "@/lib/enums";
import {DatasetSelector} from "../dataset/DatasetSelector.tsx";
import {formatDate} from "@/lib/utils";
import FileUploader from "@/components/upload/FileUploader";
import {FileInfo} from "@/integrations/api/fileApi";
import {useRef} from 'react';

interface SubmitOutputDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: () => void;
}

const SubmitOutputDialog = ({open, onOpenChange, onSubmit}: SubmitOutputDialogProps) => {
    const [newOutput, setNewOutput] = useState({
        title: "",
        abstract: "",
        type: "", // 默认不选择类型
        journal: "",
        patentNumber: "",
        datasetId: "",
        publicationUrl: "",
        pubmedId: "",
        authors: "",
        citationCount: 0,
        projectId: "",
        publicationAuthors: "",
        publicationNumber: "",
        legalStatus: "",
        patentCountry: "",
        softwareName: "",
        copyrightOwner: "",
        registrationDate: "",
        awardRecipient: "",
        awardIssuingAuthority: "",
        awardTime: "",
        competitionLevel: "",
        fileId: "" // 添加文件ID字段
    });

    // 添加文件信息状态
    const [uploadedFile, setUploadedFile] = useState<FileInfo | null>(null);
    const fileUploaderRef = useRef<any>(null);
    const resetUploadFile = (clearFile: boolean=false) => {
        // 调用 FileUploader 的重置方法
        if (fileUploaderRef.current && fileUploaderRef.current.handleReset) {
            fileUploaderRef.current.handleReset(clearFile);
        }
    };


    const [isLoadingPubmed, setIsLoadingPubmed] = useState(false);
    const [pubmedError, setPubmedError] = useState("");
    const [lastPubmedFetchTime, setLastPubmedFetchTime] = useState<number>(0); // 添加防抖时间记录
    const {toast} = useToast();

    // 数据集状态
    const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);

    const handlePubmedIdChange = (value: string) => {
        setNewOutput(prev => ({...prev, pubmedId: value}));
        // 清除之前的错误信息
        setPubmedError("");
    };

    // 新增手动获取PubMed数据的函数
    const handleFetchPubMedData = async () => {
        const pubmedId = newOutput.pubmedId.trim();

        // 验证输入
        if (!pubmedId) {
            setPubmedError("请输入PubMed ID");
            return;
        }

        // 验证是否为数字且长度在7-9位之间
        if (!/^\d{7,9}$/.test(pubmedId)) {
            setPubmedError("PubMed ID必须为7-9位数字");
            return;
        }

        // 防抖检查（至少间隔3秒）
        const now = Date.now();
        if (now - lastPubmedFetchTime < 3000) {
            setPubmedError("请求过于频繁，请至少间隔3秒");
            return;
        }

        setIsLoadingPubmed(true);
        setPubmedError("");
        setLastPubmedFetchTime(now);

        try {
            const data = await outputApi.getPubMedOutput(pubmedId);

            // 更新表单数据
            setNewOutput(prev => ({
                ...prev,
                title: data.title || prev.title,
                abstract: data.abstractText || prev.abstract,
                authors: data.otherInfo?.authors || prev.authors,
                journal: data.otherInfo?.journal || prev.journal,
                citationCount: data.citationCount || prev.citationCount,
                publicationUrl: 'doi.org/' + data.otherInfo.doi || prev.publicationUrl,
                type: "paper" // PubMed获取的通常是论文
            }));
        } catch (error) {
            setPubmedError("获取PubMed数据时出现错误");
            console.error('PubMed fetch error:', error);
        } finally {
            setIsLoadingPubmed(false);
        }
    };

    const handleDatasetSelect = (dataset: Dataset) => {
        setSelectedDataset(dataset);
        setNewOutput(prev => ({...prev, datasetId: dataset.id}));
    };

    const handleSubmitOutput = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate required fields based on type
        if (!newOutput.datasetId || !newOutput.type) {
            toast({
                title: "提交失败",
                description: "请填写所有必填字段",
                variant: "destructive"
            });
            return;
        }

        // Validate fields based on output type
        if (newOutput.type === 'project' && (!newOutput.projectId || !newOutput.authors)) {
            toast({
                title: "提交失败",
                description: "请输入项目编号/课题编号和项目/课题成员",
                variant: "destructive"
            });
            return;
        }

        if (newOutput.type === 'paper' && (!newOutput.title || !newOutput.abstract || !newOutput.authors)) {
            toast({
                title: "提交失败",
                description: "请输入论文标题、摘要和作者",
                variant: "destructive"
            });
            return;
        }

        if (newOutput.type === 'publication' && (!newOutput.title || !newOutput.abstract || !newOutput.publicationNumber || !newOutput.authors)) {
            toast({
                title: "提交失败",
                description: "请输入出版物标题、摘要、作者和出版物编号",
                variant: "destructive"
            });
            return;
        }

        if ((newOutput.type === 'invention_patent' || newOutput.type === 'utility_patent') && (!newOutput.title || !newOutput.abstract || !newOutput.patentNumber || !newOutput.legalStatus || !newOutput.authors)) {
            toast({
                title: "提交失败",
                description: "请输入专利标题、摘要、专利识别号、法律状态和发明人",
                variant: "destructive"
            });
            return;
        }

        if (newOutput.type === 'software_copyright' && (!newOutput.title || !newOutput.abstract || !newOutput.patentNumber || !newOutput.softwareName || !newOutput.authors)) {
            toast({
                title: "提交失败",
                description: "请输入软件著作权标题、摘要、登记号、软件名称和著作权人",
                variant: "destructive"
            });
            return;
        }

        if (newOutput.type === 'other_award' && (!newOutput.title || !newOutput.abstract || !newOutput.awardRecipient || !newOutput.awardIssuingAuthority || !newOutput.awardTime)) {
            toast({
                title: "提交失败",
                description: "请输入奖项名称、成果简介、获奖人/单位、颁发单位和获奖时间",
                variant: "destructive"
            });
            return;
        }

        try {
            // Submit the research output via API
            const outputData = {
                datasetId: newOutput.datasetId,
                type: newOutput.type.toUpperCase(), // 根据API文档，类型应该使用大写
                otherType: null,
                title: newOutput.title,
                abstractText: newOutput.abstract,
                outputNumber:
                    newOutput.type === 'project' ? newOutput.projectId :
                        newOutput.type === 'paper' && newOutput.pubmedId ? newOutput.pubmedId :
                        newOutput.type === 'publication' ? newOutput.publicationNumber :
                            (newOutput.type === 'invention_patent' || newOutput.type === 'utility_patent') ? newOutput.patentNumber :
                                newOutput.type === 'software_copyright' ? newOutput.patentNumber :
                                    '',
                citationCount: newOutput.citationCount || 0,
                publicationUrl: newOutput.publicationUrl || '',
                fileId: newOutput.fileId || '',
                otherInfo: {
                    pubmedId: newOutput.type === 'paper' && newOutput.pubmedId ? newOutput.pubmedId : undefined,
                    journal: newOutput.type === 'paper' ? newOutput.journal : undefined,
                    authors: newOutput.type === 'paper' ? newOutput.authors :
                        newOutput.type === 'publication' ? newOutput.authors :
                            (newOutput.type === 'invention_patent' || newOutput.type === 'utility_patent' || newOutput.type === 'project' || newOutput.type === 'software_copyright') ? newOutput.authors : undefined,
                    legalStatus: (newOutput.type === 'invention_patent' || newOutput.type === 'utility_patent') ? newOutput.legalStatus : undefined,
                    patentCountry: (newOutput.type === 'invention_patent' || newOutput.type === 'utility_patent') ? newOutput.patentCountry : undefined,
                    softwareName: newOutput.type === 'software_copyright' ? newOutput.softwareName : undefined,
                    copyrightOwner: newOutput.type === 'software_copyright' ? newOutput.copyrightOwner : undefined,
                    registrationDate: newOutput.type === 'software_copyright' ? newOutput.registrationDate : undefined,
                    awardRecipient: newOutput.type === 'other_award' ? newOutput.awardRecipient : undefined,
                    awardIssuingAuthority: newOutput.type === 'other_award' ? newOutput.awardIssuingAuthority : undefined,
                    awardTime: newOutput.type === 'other_award' ? newOutput.awardTime : undefined,
                    competitionLevel: newOutput.type === 'other_award' ? newOutput.competitionLevel : undefined
                }
            };

            await outputApi.submitOutput(outputData);

            toast({
                title: "提交成功",
                description: "研究成果已成功提交，等待管理员审核"
            });

            onSubmit();
            onOpenChange(false);

            // Reset form
            setNewOutput({
                title: "",
                abstract: "",
                type: "",
                journal: "",
                patentNumber: "",
                datasetId: "",
                publicationUrl: "",
                pubmedId: "",
                authors: "",
                citationCount: 0,
                projectId: "",
                publicationAuthors: "",
                publicationNumber: "",
                legalStatus: "",
                patentCountry: "",
                softwareName: "",
                copyrightOwner: "",
                registrationDate: "",
                awardRecipient: "",
                awardIssuingAuthority: "",
                awardTime: "",
                competitionLevel: "",
                fileId: ""
            });
            setSelectedDataset(null);
            resetUploadFile(false); // 重置上传的文件
        } catch (error) {
            console.error('Submission error:', error);
            toast({
                title: "提交失败",
                description: "提交研究成果时出现错误，请稍后重试",
                variant: "destructive"
            });
        }
    };

    return (
        <Dialog open={open} onOpenChange={(isOpen) => {
            onOpenChange(isOpen);
            if (!isOpen) {
                // Reset form when closing
                setNewOutput({
                    title: "",
                    abstract: "",
                    type: "",
                    journal: "",
                    patentNumber: "",
                    datasetId: "",
                    publicationUrl: "",
                    pubmedId: "",
                    authors: "",
                    citationCount: 0,
                    projectId: "",
                    publicationAuthors: "",
                    publicationNumber: "",
                    legalStatus: "",
                    patentCountry: "",
                    softwareName: "",
                    copyrightOwner: "",
                    registrationDate: "",
                    awardRecipient: "",
                    awardIssuingAuthority: "",
                    awardTime: "",
                    competitionLevel: "",
                    fileId: ""
                });
                setSelectedDataset(null);
                resetUploadFile(true);
            }
        }}>
            <DialogContent
                className="sm:max-w-[425px] md:max-w-[500px] lg:max-w-[700px] max-h-[85vh] min-h-[20vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle>提交研究成果</DialogTitle>
                </DialogHeader>
                <DialogDescription>
                    请填写以下信息，并提交您的成果。
                </DialogDescription>

                {/* 主要内容区域，设置为可滚动 */}
                <div className="flex-1 overflow-hidden overflow-y-auto">
                    <ScrollArea className="h-full w-full pr-4">
                        <form onSubmit={handleSubmitOutput} className="space-y-4 px-1 py-2">
                            {/* 数据集选择器移到独立组件 */}
                            <DatasetSelector
                                selectedDataset={selectedDataset}
                                onDatasetSelect={handleDatasetSelect}
                                label="关联数据集"
                                required
                            />

                            {/* 只有选择了数据集才显示成果类型选择 */}
                            {newOutput.datasetId && selectedDataset && (
                                <>
                                    {/* 显示选中的数据集信息 */}
                                    <div className="border rounded-lg p-4 bg-muted/50">
                                        <h3 className="font-semibold mb-2">关联数据集信息</h3>
                                        <div className="space-y-1 text-sm">
                                            <div className="flex">
                                                <span className="font-medium w-24 flex-shrink-0">标题:</span>
                                                <span className="truncate whitespace-normal break-words"
                                                      title={selectedDataset.titleCn}>
                          {selectedDataset.titleCn}
                        </span>
                                            </div>
                                            <div className="flex">
                                                <span className="font-medium w-24 flex-shrink-0">类型:</span>
                                                <span className="truncate"
                                                      title={DatasetTypes[selectedDataset.type as keyof typeof DatasetTypes] || selectedDataset.type}>
                          {DatasetTypes[selectedDataset.type as keyof typeof DatasetTypes] || selectedDataset.type}
                        </span>
                                            </div>
                                            <div className="flex">
                                                <span className="font-medium w-24 flex-shrink-0">研究学科:</span>
                                                <span className="truncate"
                                                      title={selectedDataset.subjectArea?.name || '无'}>{selectedDataset.subjectArea?.name || '无'}</span>
                                            </div>
                                            <div className="flex">
                                                <span className="font-medium w-24 flex-shrink-0">发布时间:</span>
                                                <span
                                                    className="truncate">{formatDate(selectedDataset.firstPublishedDate)}</span>
                                            </div>
                                            <div className="flex">
                                                <span className="font-medium w-24 flex-shrink-0">提供者:</span>
                                                <span className="truncate"
                                                      title={selectedDataset.datasetLeader}>{selectedDataset.datasetLeader}</span>
                                            </div>
                                            <div className="flex">
                                                <span className="font-medium w-24 flex-shrink-0">采集单位:</span>
                                                <span className="truncate"
                                                      title={selectedDataset.dataCollectionUnit}>{selectedDataset.dataCollectionUnit}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="outputType">成果类型 *</Label>
                                        <Select value={newOutput.type} onValueChange={(value) => {
                                            // 清空之前填写的字段
                                            setNewOutput(prev => ({
                                                ...prev,
                                                type: value,
                                                // 清空所有特定类型的字段
                                                projectId: "",
                                                publicationAuthors: "",
                                                publicationNumber: "",
                                                patentNumber: "",
                                                legalStatus: "",
                                                patentCountry: "",
                                                softwareName: "",
                                                copyrightOwner: "",
                                                registrationDate: "",
                                                awardRecipient: "",
                                                awardIssuingAuthority: "",
                                                awardTime: "",
                                                competitionLevel: "",
                                                // 论文相关字段
                                                pubmedId: "",
                                                journal: "",
                                                authors: "",
                                                citationCount: 0,
                                                // 通用字段也清空
                                                title: "",
                                                abstract: "",
                                                publicationUrl: "",
                                                fileId: ""
                                            }));
                                            resetUploadFile(true); // 清空已上传的文件

                                        }}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="请选择成果类型"/>
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem
                                                    value="project">{getOutputTypeDisplayName("project")}</SelectItem>
                                                <SelectItem
                                                    value="paper">{getOutputTypeDisplayName("paper")}</SelectItem>
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

                                    {/* 只有选择了成果类型才显示后续内容 */}
                                    {newOutput.type && (
                                        <>
                                            {/* 只有论文类型才显示PubMed ID输入框 */}
                                            {newOutput.type === "paper" && (
                                                <div className="space-y-2">
                                                    <Label htmlFor="pubmedId">PubMed ID</Label>
                                                    <div className="flex gap-2">
                                                        <Input
                                                            id="pubmedId"
                                                            value={newOutput.pubmedId}
                                                            onChange={(e) => handlePubmedIdChange(e.target.value)}
                                                            placeholder="输入7-9位PubMed ID"
                                                            disabled={isLoadingPubmed} // 添加禁用状态
                                                        />
                                                        <Button
                                                            type="button"
                                                            onClick={handleFetchPubMedData}
                                                            disabled={isLoadingPubmed} // 添加禁用状态
                                                        >
                                                            {isLoadingPubmed ? (
                                                                <Loader2 className="h-5 w-5 animate-spin"/>
                                                            ) : (
                                                                "搜索"
                                                            )}
                                                        </Button>
                                                    </div>
                                                    {pubmedError && (
                                                        <p className="text-sm text-destructive">{pubmedError}</p>
                                                    )}
                                                </div>
                                            )}

                                            {newOutput.type !== "other_award" && (
                                                <div className="space-y-2">
                                                    <Label htmlFor="outputTitle">成果标题 *</Label>
                                                    <Input
                                                        id="outputTitle"
                                                        value={newOutput.title}
                                                        onChange={(e) => setNewOutput(prev => ({
                                                            ...prev,
                                                            title: e.target.value
                                                        }))}
                                                        placeholder="请输入论文或专利标题"
                                                        disabled={isLoadingPubmed && newOutput.type === "paper"} // 添加禁用状态
                                                    />
                                                </div>
                                            )}

                                            {newOutput.type === "other_award" && (
                                                <div className="space-y-2">
                                                    <Label htmlFor="outputTitle">奖项名称 *</Label>
                                                    <Input
                                                        id="outputTitle"
                                                        value={newOutput.title}
                                                        onChange={(e) => setNewOutput(prev => ({
                                                            ...prev,
                                                            title: e.target.value
                                                        }))}
                                                        placeholder="请输入奖项名称"
                                                    />
                                                </div>
                                            )}

                                            {newOutput.type === "paper" ? (
                                                <>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="journal">发表期刊</Label>
                                                        <Input
                                                            id="journal"
                                                            value={newOutput.journal}
                                                            onChange={(e) => setNewOutput(prev => ({
                                                                ...prev,
                                                                journal: e.target.value
                                                            }))}
                                                            placeholder="期刊名称"
                                                            disabled={isLoadingPubmed} // 添加禁用状态
                                                        />
                                                    </div>

                                                    <div className="space-y-2">
                                                        <Label htmlFor="authors">作者 *</Label>
                                                        <Input
                                                            id="authors"
                                                            value={newOutput.authors}
                                                            onChange={(e) => setNewOutput(prev => ({
                                                                ...prev,
                                                                authors: e.target.value
                                                            }))}
                                                            placeholder="作者姓名，多个作者请用逗号分隔"
                                                            disabled={isLoadingPubmed} // 添加禁用状态
                                                        />
                                                    </div>

                                                    {newOutput.citationCount > 0 && (
                                                        <div className="space-y-2">
                                                            <Label htmlFor="citationCount">被引用次数</Label>
                                                            <Input
                                                                id="citationCount"
                                                                type="number"
                                                                min="0"
                                                                value={newOutput.citationCount || ''}
                                                                onChange={(e) => setNewOutput(prev => ({
                                                                    ...prev,
                                                                    citationCount: parseInt(e.target.value) || 0
                                                                }))}
                                                                placeholder="请输入被引用次数"
                                                                disabled={isLoadingPubmed} // 添加禁用状态
                                                            />
                                                        </div>
                                                    )}
                                                </>
                                            ) : newOutput.type === "project" ? (
                                                <>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="projectId">项目编号/课题编号 *</Label>
                                                        <Input
                                                            id="projectId"
                                                            value={newOutput.projectId}
                                                            onChange={(e) => setNewOutput(prev => ({
                                                                ...prev,
                                                                projectId: e.target.value
                                                            }))}
                                                            placeholder="请输入项目编号或课题编号"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="authors">项目/课题成员 *</Label>
                                                        <Input
                                                            id="authors"
                                                            value={newOutput.authors}
                                                            onChange={(e) => setNewOutput(prev => ({
                                                                ...prev,
                                                                authors: e.target.value
                                                            }))}
                                                            placeholder="项目/课题成员，多个成员请用逗号分隔"
                                                        />
                                                    </div>
                                                </>
                                            ) : newOutput.type === "publication" ? (
                                                <>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="authors">作者 *</Label>
                                                        <Input
                                                            id="authors"
                                                            value={newOutput.authors}
                                                            onChange={(e) => setNewOutput(prev => ({
                                                                ...prev,
                                                                authors: e.target.value
                                                            }))}
                                                            placeholder="作者姓名，多个作者请用逗号分隔"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="publicationNumber">出版物编号 *</Label>
                                                        <Input
                                                            id="publicationNumber"
                                                            value={newOutput.publicationNumber}
                                                            onChange={(e) => setNewOutput(prev => ({
                                                                ...prev,
                                                                publicationNumber: e.target.value
                                                            }))}
                                                            placeholder="请输入出版物编号"
                                                        />
                                                    </div>
                                                </>
                                            ) : (newOutput.type === "invention_patent" || newOutput.type === "utility_patent") ? (
                                                <>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="patentNumber">专利识别号 *</Label>
                                                        <Input
                                                            id="patentNumber"
                                                            value={newOutput.patentNumber}
                                                            onChange={(e) => setNewOutput(prev => ({
                                                                ...prev,
                                                                patentNumber: e.target.value
                                                            }))}
                                                            placeholder="请输入公开号或者授权号"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="authors">发明人 *</Label>
                                                        <Input
                                                            id="authors"
                                                            value={newOutput.authors}
                                                            onChange={(e) => setNewOutput(prev => ({
                                                                ...prev,
                                                                authors: e.target.value
                                                            }))}
                                                            placeholder="发明人姓名，多个发明人请用逗号分隔"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="legalStatus">法律状态 *</Label>
                                                        <Input
                                                            id="legalStatus"
                                                            value={newOutput.legalStatus}
                                                            onChange={(e) => setNewOutput(prev => ({
                                                                ...prev,
                                                                legalStatus: e.target.value
                                                            }))}
                                                            placeholder="例如：实质性审查生效、专利权维持、专利权终止等"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="citationCount">被引用次数</Label>
                                                        <Input
                                                            id="citationCount"
                                                            type="number"
                                                            min="0"
                                                            value={newOutput.citationCount || ''}
                                                            onChange={(e) => setNewOutput(prev => ({
                                                                ...prev,
                                                                citationCount: parseInt(e.target.value) || 0
                                                            }))}
                                                            placeholder="请输入被引用次数"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="patentCountry">专利国别/地区</Label>
                                                        <Input
                                                            id="patentCountry"
                                                            value={newOutput.patentCountry}
                                                            onChange={(e) => setNewOutput(prev => ({
                                                                ...prev,
                                                                patentCountry: e.target.value
                                                            }))}
                                                            placeholder="请输入专利国别或地区"
                                                        />
                                                    </div>
                                                </>
                                            ) : newOutput.type === "software_copyright" ? (
                                                <>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="patentNumber">登记号 *</Label>
                                                        <Input
                                                            id="patentNumber"
                                                            value={newOutput.patentNumber}
                                                            onChange={(e) => setNewOutput(prev => ({
                                                                ...prev,
                                                                patentNumber: e.target.value
                                                            }))}
                                                            placeholder="请输入软件著作权登记号"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="softwareName">软件名称(全称) *</Label>
                                                        <Input
                                                            id="softwareName"
                                                            value={newOutput.softwareName}
                                                            onChange={(e) => setNewOutput(prev => ({
                                                                ...prev,
                                                                softwareName: e.target.value
                                                            }))}
                                                            placeholder="请输入软件全称"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="authors">著作权人 *</Label>
                                                        <Input
                                                            id="authors"
                                                            value={newOutput.authors}
                                                            onChange={(e) => setNewOutput(prev => ({
                                                                ...prev,
                                                                authors: e.target.value
                                                            }))}
                                                            placeholder="著作权人姓名，多个著作权人请用逗号分隔"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="registrationDate">登记日期</Label>
                                                        <Input
                                                            id="registrationDate"
                                                            type="date"
                                                            value={newOutput.registrationDate}
                                                            onChange={(e) => setNewOutput(prev => ({
                                                                ...prev,
                                                                registrationDate: e.target.value
                                                            }))}
                                                        />
                                                    </div>
                                                </>
                                            ) : newOutput.type === "other_award" ? (
                                                <>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="awardRecipient">获奖人/单位 *</Label>
                                                        <Input
                                                            id="awardRecipient"
                                                            value={newOutput.awardRecipient}
                                                            onChange={(e) => setNewOutput(prev => ({
                                                                ...prev,
                                                                awardRecipient: e.target.value
                                                            }))}
                                                            placeholder="请输入获奖人或单位名称"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="awardIssuingAuthority">颁发单位 *</Label>
                                                        <Input
                                                            id="awardIssuingAuthority"
                                                            value={newOutput.awardIssuingAuthority}
                                                            onChange={(e) => setNewOutput(prev => ({
                                                                ...prev,
                                                                awardIssuingAuthority: e.target.value
                                                            }))}
                                                            placeholder="请输入颁发单位名称"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="awardTime">获奖时间 *</Label>
                                                        <Input
                                                            id="awardTime"
                                                            type="date"
                                                            value={newOutput.awardTime}
                                                            onChange={(e) => setNewOutput(prev => ({
                                                                ...prev,
                                                                awardTime: e.target.value
                                                            }))}
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="competitionLevel">赛事层次</Label>
                                                        <Select value={newOutput.competitionLevel}
                                                                onValueChange={(value) =>
                                                                    setNewOutput(prev => ({
                                                                        ...prev,
                                                                        competitionLevel: value
                                                                    }))
                                                                }>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="请选择赛事层次"/>
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="unit">单位内部</SelectItem>
                                                                <SelectItem value="district">县区级</SelectItem>
                                                                <SelectItem value="city">市级</SelectItem>
                                                                <SelectItem value="province">省级</SelectItem>
                                                                <SelectItem value="national">国家级</SelectItem>
                                                                <SelectItem value="international">国际级</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </>
                                            ) : null}

                                            {newOutput.type !== "other_award" && (
                                                <div className="space-y-2">
                                                    <Label htmlFor="abstract">摘要 *</Label>
                                                    <Textarea
                                                        id="abstract"
                                                        rows={4}
                                                        value={newOutput.abstract}
                                                        onChange={(e) => setNewOutput(prev => ({
                                                            ...prev,
                                                            abstract: e.target.value
                                                        }))}
                                                        placeholder="简要描述研究内容、方法和主要发现"
                                                        disabled={isLoadingPubmed && newOutput.type === "paper"} // 添加禁用状态
                                                    />
                                                </div>
                                            )}

                                            {newOutput.type === "other_award" && (
                                                <div className="space-y-2">
                                                    <Label htmlFor="abstract">成果简介 *</Label>
                                                    <Textarea
                                                        id="abstract"
                                                        rows={4}
                                                        value={newOutput.abstract}
                                                        onChange={(e) => setNewOutput(prev => ({
                                                            ...prev,
                                                            abstract: e.target.value
                                                        }))}
                                                        placeholder="请输入成果简介"
                                                    />
                                                </div>
                                            )}

                                            <div className="space-y-2">
                                                <Label
                                                    htmlFor="url">{newOutput.type === "paper" && ('DOI链接') || ('URL链接')}</Label>
                                                <Input
                                                    id="url"
                                                    value={newOutput.publicationUrl}
                                                    onChange={(e) => setNewOutput(prev => ({
                                                        ...prev,
                                                        publicationUrl: e.target.value
                                                    }))}
                                                    placeholder={newOutput.type === "paper" && ('示例: doi.org/10.1038/s41586-025-09732-2') || 'https://www.baidu.com'}
                                                    disabled={isLoadingPubmed && newOutput.type === "paper"}
                                                />
                                            </div>

                                            {/* 文件上传区域 */}
                                            <div className="space-y-2">
                                                <Label htmlFor="supportingDocument">说明文件（选填）</Label>
                                                <FileUploader
                                                    ref={fileUploaderRef}
                                                    onResetComplete={() => {
                                                        setUploadedFile(null);
                                                    }}
                                                    onUploadComplete={(fileInfo) => {
                                                        setUploadedFile(fileInfo);
                                                        setNewOutput(prev => ({...prev, fileId: fileInfo.id}));
                                                    }}
                                                    maxSize={500 * 1024 * 1024} // 50MB限制
                                                />
                                            </div>
                                        </>
                                    )}
                                </>
                            )}

                            <div className="flex justify-end space-x-2 pt-4">
                                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                    取消
                                </Button>
                                <Button type="submit" disabled={!newOutput.datasetId || !newOutput.type}>
                                    提交成果
                                </Button>
                            </div>
                        </form>
                    </ScrollArea>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default SubmitOutputDialog;