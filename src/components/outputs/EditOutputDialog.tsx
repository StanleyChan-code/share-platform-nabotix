import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { getOutputTypeDisplayName } from "@/lib/outputUtils";
import { outputApi, ResearchOutput } from "@/integrations/api/outputApi";
import { Dataset } from "@/integrations/api/datasetApi";
import { DatasetTypes } from "@/lib/enums";
import { DatasetSelector } from "../dataset/DatasetSelector.tsx";
import { formatDate, formatFileSize } from "@/lib/utils";
import FileUploader from "@/components/upload/FileUploader";
import { FileInfo, fileApi } from "@/integrations/api/fileApi";

interface EditOutputDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    output: ResearchOutput | null;
    onEdit: () => void;
}

const EditOutputDialog = ({ open, onOpenChange, output, onEdit }: EditOutputDialogProps) => {
    const [editedOutput, setEditedOutput] = useState({
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

    // 添加文件信息状态
    const [uploadedFile, setUploadedFile] = useState<FileInfo | null>(null);
    const [loadingFileInfo, setLoadingFileInfo] = useState(false);
    const fileUploaderRef = useRef<any>(null);
    const resetUploadFile = (clearFile: boolean = false) => {
        // 调用 FileUploader 的重置方法
        if (fileUploaderRef.current && fileUploaderRef.current.handleReset) {
            fileUploaderRef.current.handleReset(clearFile);
        }
    };

    const [isLoadingPubmed, setIsLoadingPubmed] = useState(false);
    const [pubmedError, setPubmedError] = useState("");
    const [lastPubmedFetchTime, setLastPubmedFetchTime] = useState<number>(0);
    const { toast } = useToast();

    // 数据集状态
    const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);

    // 初始化表单数据
    useEffect(() => {
        if (output && open) {
            const formData = {
                title: output.title || "",
                abstract: output.abstractText || "",
                type: output.type?.toLowerCase() || "",
                journal: output.otherInfo?.journal || "",
                patentNumber: (output.type === 'PAPER' && output.otherInfo?.pubmedId) || "",
                datasetId: output.dataset?.id || "",
                publicationUrl: output.publicationUrl || "",
                pubmedId: output.otherInfo?.pubmedId || "",
                authors: output.otherInfo?.authors || "",
                citationCount: output.citationCount || 0,
                projectId: output.outputNumber || "",
                publicationAuthors: "",
                publicationNumber: output.outputNumber || "",
                legalStatus: output.otherInfo?.legalStatus || "",
                patentCountry: output.otherInfo?.patentCountry || "",
                softwareName: output.otherInfo?.softwareName || "",
                copyrightOwner: output.otherInfo?.copyrightOwner || "",
                registrationDate: output.otherInfo?.registrationDate || "",
                awardRecipient: output.otherInfo?.awardRecipient || "",
                awardIssuingAuthority: output.otherInfo?.awardIssuingAuthority || "",
                awardTime: output.otherInfo?.awardTime || "",
                competitionLevel: output.otherInfo?.competitionLevel || "",
                fileId: output.fileId || ""
            };

            setEditedOutput(formData);
            
            // 设置选中的数据集
            if (output.dataset) {
                setSelectedDataset(output.dataset);
            }
            
            // 获取已上传文件的信息
            if (output.fileId) {
                fetchFileInfo(output.fileId);
            } else {
                setUploadedFile(null);
            }
        } else {
            // 重置表单
            setEditedOutput({
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
            setUploadedFile(null);
            resetUploadFile(true);
        }
    }, [output, open]);

    const fetchFileInfo = async (fileId: string) => {
        setLoadingFileInfo(true);
        try {
            const fileInfo = await fileApi.getFileInfo(fileId);
            setUploadedFile(fileInfo.data);
        } catch (error) {
            console.error("获取文件信息失败:", error);
            toast({
                title: "获取文件信息失败",
                description: "无法获取已上传文件的信息",
                variant: "destructive"
            });
            setUploadedFile(null);
        } finally {
            setLoadingFileInfo(false);
        }
    };

    const handlePubmedIdChange = (value: string) => {
        setEditedOutput(prev => ({ ...prev, pubmedId: value }));
        // 清除之前的错误信息
        setPubmedError("");
    };

    // 新增手动获取PubMed数据的函数
    const handleFetchPubMedData = async () => {
        const pubmedId = editedOutput.pubmedId.trim();

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
            setEditedOutput(prev => ({
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
        setEditedOutput(prev => ({ ...prev, datasetId: dataset.id }));
    };

    const handleEditOutput = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!output) return;

        // Validate required fields based on type
        if (!editedOutput.datasetId || !editedOutput.type) {
            toast({
                title: "提交失败",
                description: "请填写所有必填字段",
                variant: "destructive"
            });
            return;
        }

        // Validate fields based on output type
        if (editedOutput.type === 'project' && (!editedOutput.projectId || !editedOutput.authors)) {
            toast({
                title: "提交失败",
                description: "请输入项目编号/课题编号和项目/课题成员",
                variant: "destructive"
            });
            return;
        }

        if (editedOutput.type === 'paper' && (!editedOutput.title || !editedOutput.abstract || !editedOutput.authors)) {
            toast({
                title: "提交失败",
                description: "请输入论文标题、摘要和作者",
                variant: "destructive"
            });
            return;
        }

        if (editedOutput.type === 'publication' && (!editedOutput.title || !editedOutput.abstract || !editedOutput.publicationNumber || !editedOutput.authors)) {
            toast({
                title: "提交失败",
                description: "请输入出版物标题、摘要、作者和出版物编号",
                variant: "destructive"
            });
            return;
        }

        if ((editedOutput.type === 'invention_patent' || editedOutput.type === 'utility_patent') && (!editedOutput.title || !editedOutput.abstract || !editedOutput.patentNumber || !editedOutput.legalStatus || !editedOutput.authors)) {
            toast({
                title: "提交失败",
                description: "请输入专利标题、摘要、专利识别号、法律状态和发明人",
                variant: "destructive"
            });
            return;
        }

        if (editedOutput.type === 'software_copyright' && (!editedOutput.title || !editedOutput.abstract || !editedOutput.patentNumber || !editedOutput.softwareName || !editedOutput.authors)) {
            toast({
                title: "提交失败",
                description: "请输入软件著作权标题、摘要、登记号、软件名称和著作权人",
                variant: "destructive"
            });
            return;
        }

        if (editedOutput.type === 'other_award' && (!editedOutput.title || !editedOutput.abstract || !editedOutput.awardRecipient || !editedOutput.awardIssuingAuthority || !editedOutput.awardTime)) {
            toast({
                title: "提交失败",
                description: "请输入奖项名称、成果简介、获奖人/单位、颁发单位和获奖时间",
                variant: "destructive"
            });
            return;
        }

        try {
            // Prepare the research output data for update
            const outputData = {
                datasetId: editedOutput.datasetId,
                type: editedOutput.type.toUpperCase(),
                otherType: null,
                title: editedOutput.title,
                abstractText: editedOutput.abstract,
                outputNumber:
                    editedOutput.type === 'project' ? editedOutput.projectId :
                        editedOutput.type === 'paper' && editedOutput.pubmedId ? editedOutput.pubmedId :
                            editedOutput.type === 'publication' ? editedOutput.publicationNumber :
                                (editedOutput.type === 'invention_patent' || editedOutput.type === 'utility_patent') ? editedOutput.patentNumber :
                                    editedOutput.type === 'software_copyright' ? editedOutput.patentNumber :
                                        '',
                citationCount: editedOutput.citationCount || 0,
                publicationUrl: editedOutput.publicationUrl || '',
                fileId: editedOutput.fileId || '',
                otherInfo: {
                    pubmedId: editedOutput.type === 'paper' && editedOutput.pubmedId ? editedOutput.pubmedId : undefined,
                    journal: editedOutput.type === 'paper' ? editedOutput.journal : undefined,
                    authors: editedOutput.type === 'paper' ? editedOutput.authors :
                        editedOutput.type === 'publication' ? editedOutput.authors :
                            (editedOutput.type === 'invention_patent' || editedOutput.type === 'utility_patent' || editedOutput.type === 'project' || editedOutput.type === 'software_copyright') ? editedOutput.authors : undefined,
                    legalStatus: (editedOutput.type === 'invention_patent' || editedOutput.type === 'utility_patent') ? editedOutput.legalStatus : undefined,
                    patentCountry: (editedOutput.type === 'invention_patent' || editedOutput.type === 'utility_patent') ? editedOutput.patentCountry : undefined,
                    softwareName: editedOutput.type === 'software_copyright' ? editedOutput.softwareName : undefined,
                    copyrightOwner: editedOutput.type === 'software_copyright' ? editedOutput.copyrightOwner : undefined,
                    registrationDate: editedOutput.type === 'software_copyright' ? editedOutput.registrationDate : undefined,
                    awardRecipient: editedOutput.type === 'other_award' ? editedOutput.awardRecipient : undefined,
                    awardIssuingAuthority: editedOutput.type === 'other_award' ? editedOutput.awardIssuingAuthority : undefined,
                    awardTime: editedOutput.type === 'other_award' ? editedOutput.awardTime : undefined,
                    competitionLevel: editedOutput.type === 'other_award' ? editedOutput.competitionLevel : undefined
                }
            };

            await outputApi.updateOutput(output.id, outputData);

            toast({
                title: "更新成功",
                description: "研究成果已成功更新"
            });

            onEdit();
            onOpenChange(false);
        } catch (error) {
            console.error('Update error:', error);
            toast({
                title: "更新失败",
                description: "更新研究成果时出现错误，请稍后重试",
                variant: "destructive"
            });
        }
    };

    if (!output) return null;

    return (
        <Dialog open={open} onOpenChange={(isOpen) => {
            onOpenChange(isOpen);
            if (!isOpen) {
                // Reset form when closing
                setEditedOutput({
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
                className="sm:max-w-[425px] md:max-w-[500px] lg:max-w-[600px] max-h-[85vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle>编辑研究成果</DialogTitle>
                </DialogHeader>
                <DialogDescription>
                    编辑您的研究成果信息。注意：只有待审核状态的成果才能编辑。
                </DialogDescription>

                {/* 主要内容区域，设置为可滚动 */}
                <div className="flex-1 overflow-hidden overflow-y-auto">
                    <ScrollArea className="h-full w-full pr-4">
                        <form onSubmit={handleEditOutput} className="space-y-4 px-1 py-2">
                            {selectedDataset === null && (
                                <DatasetSelector
                                    selectedDataset={selectedDataset}
                                    onDatasetSelect={handleDatasetSelect}
                                    label="关联数据集"
                                    required
                                />
                            )}

                            {/* 显示选中的数据集信息 */}
                            {selectedDataset && (
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
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="outputType">成果类型 *</Label>
                                <Select 
                                    value={editedOutput.type} 
                                    onValueChange={(value) => {
                                        // 清空之前填写的字段
                                        setEditedOutput(prev => ({
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
                                    }}
                                    disabled={!!output.type}
                                >
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
                            {editedOutput.type && (
                                <>
                                    {/* 只有论文类型才显示PubMed ID输入框 */}
                                    {editedOutput.type === "paper" && (
                                        <div className="space-y-2">
                                            <Label htmlFor="pubmedId">PubMed ID</Label>
                                            <div className="flex gap-2">
                                                <Input
                                                    id="pubmedId"
                                                    value={editedOutput.pubmedId}
                                                    onChange={(e) => handlePubmedIdChange(e.target.value)}
                                                    placeholder="输入7-9位PubMed ID"
                                                    disabled={isLoadingPubmed}
                                                />
                                                <Button
                                                    type="button"
                                                    onClick={handleFetchPubMedData}
                                                    disabled={isLoadingPubmed}
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

                                    {editedOutput.type !== "other_award" && (
                                        <div className="space-y-2">
                                            <Label htmlFor="outputTitle">成果标题 *</Label>
                                            <Input
                                                id="outputTitle"
                                                value={editedOutput.title}
                                                onChange={(e) => setEditedOutput(prev => ({
                                                    ...prev,
                                                    title: e.target.value
                                                }))}
                                                placeholder="请输入论文或专利标题"
                                                disabled={isLoadingPubmed && editedOutput.type === "paper"}
                                            />
                                        </div>
                                    )}

                                    {editedOutput.type === "other_award" && (
                                        <div className="space-y-2">
                                            <Label htmlFor="outputTitle">奖项名称 *</Label>
                                            <Input
                                                id="outputTitle"
                                                value={editedOutput.title}
                                                onChange={(e) => setEditedOutput(prev => ({
                                                    ...prev,
                                                    title: e.target.value
                                                }))}
                                                placeholder="请输入奖项名称"
                                            />
                                        </div>
                                    )}

                                    {editedOutput.type === "paper" ? (
                                        <>
                                            <div className="space-y-2">
                                                <Label htmlFor="journal">发表期刊</Label>
                                                <Input
                                                    id="journal"
                                                    value={editedOutput.journal}
                                                    onChange={(e) => setEditedOutput(prev => ({
                                                        ...prev,
                                                        journal: e.target.value
                                                    }))}
                                                    placeholder="期刊名称"
                                                    disabled={isLoadingPubmed}
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="authors">作者 *</Label>
                                                <Input
                                                    id="authors"
                                                    value={editedOutput.authors}
                                                    onChange={(e) => setEditedOutput(prev => ({
                                                        ...prev,
                                                        authors: e.target.value
                                                    }))}
                                                    placeholder="作者姓名，多个作者请用逗号分隔"
                                                    disabled={isLoadingPubmed}
                                                />
                                            </div>

                                            {editedOutput.citationCount > 0 && (
                                                <div className="space-y-2">
                                                    <Label htmlFor="citationCount">被引用次数</Label>
                                                    <Input
                                                        id="citationCount"
                                                        type="number"
                                                        min="0"
                                                        value={editedOutput.citationCount || ''}
                                                        onChange={(e) => setEditedOutput(prev => ({
                                                            ...prev,
                                                            citationCount: parseInt(e.target.value) || 0
                                                        }))}
                                                        placeholder="请输入被引用次数"
                                                        disabled={isLoadingPubmed}
                                                    />
                                                </div>
                                            )}
                                        </>
                                    ) : editedOutput.type === "project" ? (
                                        <>
                                            <div className="space-y-2">
                                                <Label htmlFor="projectId">项目编号/课题编号 *</Label>
                                                <Input
                                                    id="projectId"
                                                    value={editedOutput.projectId}
                                                    onChange={(e) => setEditedOutput(prev => ({
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
                                                    value={editedOutput.authors}
                                                    onChange={(e) => setEditedOutput(prev => ({
                                                        ...prev,
                                                        authors: e.target.value
                                                    }))}
                                                    placeholder="项目/课题成员，多个成员请用逗号分隔"
                                                />
                                            </div>
                                        </>
                                    ) : editedOutput.type === "publication" ? (
                                        <>
                                            <div className="space-y-2">
                                                <Label htmlFor="authors">作者 *</Label>
                                                <Input
                                                    id="authors"
                                                    value={editedOutput.authors}
                                                    onChange={(e) => setEditedOutput(prev => ({
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
                                                    value={editedOutput.publicationNumber}
                                                    onChange={(e) => setEditedOutput(prev => ({
                                                        ...prev,
                                                        publicationNumber: e.target.value
                                                    }))}
                                                    placeholder="请输入出版物编号"
                                                />
                                            </div>
                                        </>
                                    ) : (editedOutput.type === 'invention_patent' || editedOutput.type === 'utility_patent') ? (
                                        <>
                                            <div className="space-y-2">
                                                <Label htmlFor="patentNumber">专利识别号 *</Label>
                                                <Input
                                                    id="patentNumber"
                                                    value={editedOutput.patentNumber}
                                                    onChange={(e) => setEditedOutput(prev => ({
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
                                                    value={editedOutput.authors}
                                                    onChange={(e) => setEditedOutput(prev => ({
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
                                                    value={editedOutput.legalStatus}
                                                    onChange={(e) => setEditedOutput(prev => ({
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
                                                    value={editedOutput.citationCount || ''}
                                                    onChange={(e) => setEditedOutput(prev => ({
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
                                                    value={editedOutput.patentCountry}
                                                    onChange={(e) => setEditedOutput(prev => ({
                                                        ...prev,
                                                        patentCountry: e.target.value
                                                    }))}
                                                    placeholder="请输入专利国别或地区"
                                                />
                                            </div>
                                        </>
                                    ) : editedOutput.type === "software_copyright" ? (
                                        <>
                                            <div className="space-y-2">
                                                <Label htmlFor="patentNumber">登记号 *</Label>
                                                <Input
                                                    id="patentNumber"
                                                    value={editedOutput.patentNumber}
                                                    onChange={(e) => setEditedOutput(prev => ({
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
                                                    value={editedOutput.softwareName}
                                                    onChange={(e) => setEditedOutput(prev => ({
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
                                                    value={editedOutput.authors}
                                                    onChange={(e) => setEditedOutput(prev => ({
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
                                                    value={editedOutput.registrationDate}
                                                    onChange={(e) => setEditedOutput(prev => ({
                                                        ...prev,
                                                        registrationDate: e.target.value
                                                    }))}
                                                />
                                            </div>
                                        </>
                                    ) : editedOutput.type === "other_award" ? (
                                        <>
                                            <div className="space-y-2">
                                                <Label htmlFor="awardRecipient">获奖人/单位 *</Label>
                                                <Input
                                                    id="awardRecipient"
                                                    value={editedOutput.awardRecipient}
                                                    onChange={(e) => setEditedOutput(prev => ({
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
                                                    value={editedOutput.awardIssuingAuthority}
                                                    onChange={(e) => setEditedOutput(prev => ({
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
                                                    value={editedOutput.awardTime}
                                                    onChange={(e) => setEditedOutput(prev => ({
                                                        ...prev,
                                                        awardTime: e.target.value
                                                    }))}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="competitionLevel">赛事层次</Label>
                                                <Select value={editedOutput.competitionLevel}
                                                        onValueChange={(value) =>
                                                            setEditedOutput(prev => ({
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

                                    {editedOutput.type !== "other_award" && (
                                        <div className="space-y-2">
                                            <Label htmlFor="abstract">摘要 *</Label>
                                            <Textarea
                                                id="abstract"
                                                rows={4}
                                                value={editedOutput.abstract}
                                                onChange={(e) => setEditedOutput(prev => ({
                                                    ...prev,
                                                    abstract: e.target.value
                                                }))}
                                                placeholder="简要描述研究内容、方法和主要发现"
                                                disabled={isLoadingPubmed && editedOutput.type === "paper"}
                                            />
                                        </div>
                                    )}

                                    {editedOutput.type === "other_award" && (
                                        <div className="space-y-2">
                                            <Label htmlFor="abstract">成果简介 *</Label>
                                            <Textarea
                                                id="abstract"
                                                rows={4}
                                                value={editedOutput.abstract}
                                                onChange={(e) => setEditedOutput(prev => ({
                                                    ...prev,
                                                    abstract: e.target.value
                                                }))}
                                                placeholder="请输入成果简介"
                                            />
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        <Label
                                            htmlFor="url">{editedOutput.type === "paper" && ('DOI链接') || ('URL链接')}</Label>
                                        <Input
                                            id="url"
                                            value={editedOutput.publicationUrl}
                                            onChange={(e) => setEditedOutput(prev => ({
                                                ...prev,
                                                publicationUrl: e.target.value
                                            }))}
                                            placeholder={editedOutput.type === "paper" && ('示例: doi.org/10.1038/s41586-025-09732-2') || 'https://www.baidu.com'}
                                            disabled={isLoadingPubmed && editedOutput.type === "paper"}
                                        />
                                    </div>

                                    {/* 文件上传区域 */}
                                    <div className="space-y-2">
                                        <Label htmlFor="supportingDocument">说明文件（选填）</Label>
                                        
                                        {/* 显示已上传文件信息 */}
                                        {loadingFileInfo ? (
                                            <div className="text-sm text-muted-foreground">正在加载文件信息...</div>
                                        ) : uploadedFile && (
                                            <div className="text-sm p-2 bg-muted rounded">
                                                已上传文件: {uploadedFile.fileName} (大小: {formatFileSize(uploadedFile.fileSize)})
                                            </div>
                                        )}
                                        
                                        <FileUploader
                                            ref={fileUploaderRef}
                                            onResetComplete={() => {
                                                setUploadedFile(null);
                                            }}
                                            onUploadComplete={(fileInfo) => {
                                                setUploadedFile(fileInfo);
                                                setEditedOutput(prev => ({ ...prev, fileId: fileInfo.id }));
                                            }}
                                            maxSize={500 * 1024 * 1024} // 50MB限制
                                        />
                                    </div>
                                </>
                            )}

                            <div className="flex justify-end space-x-2 pt-4">
                                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                    取消
                                </Button>
                                <Button type="submit" disabled={!editedOutput.datasetId || !editedOutput.type}>
                                    保存更改
                                </Button>
                            </div>
                        </form>
                    </ScrollArea>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default EditOutputDialog;