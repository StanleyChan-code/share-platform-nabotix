import {useState, useEffect, useRef} from "react";
import {Button} from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
import {ScrollArea} from "@/components/ui/scroll-area";
import {useToast} from "@/hooks/use-toast";
import {outputApi, ResearchOutput} from "@/integrations/api/outputApi";
import {Dataset} from "@/integrations/api/datasetApi";
import {fileApi, FileInfo} from "@/integrations/api/fileApi";
import ResearchOutputForm from "@/components/outputs/ResearchOutputForm";
import FileUploader from "@/components/fileuploader/FileUploader.tsx";
import {getJournalPartitionValue} from "@/lib/outputUtils.ts";
import {ApprovedDatasetSelector} from "@/components/outputs/ApprovedDatasetSelector.tsx";

interface EditOutputDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    output: ResearchOutput | null;
    onEdit: () => void;
}

const EditOutputDialog = ({open, onOpenChange, output, onEdit}: EditOutputDialogProps) => {
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
        value: 0,
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
        fileId: "",
        journalPartition: "" // 添加期刊分区字段
    });

    // 添加文件信息状态
    const [uploadedFile, setUploadedFile] = useState<FileInfo | null>(null);
    const [loadingFileInfo, setLoadingFileInfo] = useState(false);
    const fileUploaderRef = useRef<any>(null);
    const resetUploadFile = (clearFile: boolean = false) => {
        if (!fileUploaderRef.current) return;
        fileUploaderRef.current.handleReset(clearFile);
    };

    const [isLoadingPubmed, setIsLoadingPubmed] = useState(false);
    const [pubmedError, setPubmedError] = useState("");
    const [lastPubmedFetchTime, setLastPubmedFetchTime] = useState<number>(0);
    const {toast} = useToast();

    // 数据集状态
    const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);

    // 初始化表单数据
    useEffect(() => {
        if (output && open) {
            console.log("output:", output)
            const formData = {
                title: output.title || "",
                abstract: output.abstractText || "",
                type: output.type?.toUpperCase() || "",
                journal: output.otherInfo?.journal || "",
                patentNumber: (output.type === 'INVENTION_PATENT' || output.type === 'UTILITY_PATENT' || output.type === 'SOFTWARE_COPYRIGHT') ? output.outputNumber : "",
                datasetId: output.dataset?.id || "",
                publicationUrl: output.publicationUrl || "",
                pubmedId: output.otherInfo?.pubmedId || "",
                authors: output.otherInfo?.authors || "",
                value: output.value || 0,
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
                fileId: output.fileId || "",
                journalPartition: output.otherInfo?.journalPartition || "" // 添加期刊分区字段
            };

            setEditedOutput(formData);

            // 设置选中的数据集
            if (output.dataset) {
                setSelectedDataset(output.dataset);
            } else {
                setSelectedDataset(null);
            }

            // 获取已上传文件的信息
            if (output.fileId) {
                fetchFileInfo(output.fileId);
            } else {
                setUploadedFile(null);
            }
        } else if (!open) {
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
                value: 0,
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
                fileId: "",
                journalPartition: "" // 添加期刊分区字段
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
        setEditedOutput(prev => ({...prev, pubmedId: value}));
        // 清除之前的错误信息
        setPubmedError("");
    };

    // 新增手动获取PubMed数据的函数
    const handleFetchPubMedData = async (pubmedId: string) => {
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
                value: data.value || prev.value,
                publicationUrl: 'doi.org/' + data.otherInfo.doi || prev.publicationUrl,
                type: "PAPER" // PubMed获取的通常是论文
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
        setEditedOutput(prev => ({...prev, datasetId: dataset.id}));
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

        if (editedOutput.type === 'PAPER' && (!editedOutput.title || !editedOutput.abstract || !editedOutput.authors)) {
            toast({
                title: "提交失败",
                description: "请输入论文标题、摘要和作者",
                variant: "destructive"
            });
            return;
        }

        if (editedOutput.type === 'PUBLICATION' && (!editedOutput.title || !editedOutput.abstract || !editedOutput.publicationNumber || !editedOutput.authors)) {
            toast({
                title: "提交失败",
                description: "请输入出版物标题、摘要、作者和出版物编号",
                variant: "destructive"
            });
            return;
        }

        if ((editedOutput.type === 'INVENTION_PATENT' || editedOutput.type === 'UTILITY_PATENT') && (!editedOutput.title || !editedOutput.abstract || !editedOutput.patentNumber || !editedOutput.legalStatus || !editedOutput.authors)) {
            toast({
                title: "提交失败",
                description: "请输入专利标题、摘要、专利识别号、法律状态和发明人",
                variant: "destructive"
            });
            return;
        }

        if (editedOutput.type === 'SOFTWARE_COPYRIGHT' && (!editedOutput.title || !editedOutput.abstract || !editedOutput.patentNumber || !editedOutput.softwareName || !editedOutput.authors)) {
            toast({
                title: "提交失败",
                description: "请输入软件著作权标题、摘要、登记号、软件名称和著作权人",
                variant: "destructive"
            });
            return;
        }

        if (editedOutput.type === 'OTHER_AWARD' && (!editedOutput.title || !editedOutput.abstract || !editedOutput.awardRecipient || !editedOutput.awardIssuingAuthority || !editedOutput.awardTime)) {
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
                    editedOutput.type === 'PROJECT' ? editedOutput.projectId :
                        editedOutput.type === 'PAPER' && editedOutput.pubmedId ? editedOutput.pubmedId :
                            editedOutput.type === 'PUBLICATION' ? editedOutput.publicationNumber :
                                (editedOutput.type === 'INVENTION_PATENT' || editedOutput.type === 'UTILITY_PATENT') ? editedOutput.patentNumber :
                                    editedOutput.type === 'SOFTWARE_COPYRIGHT' ? editedOutput.patentNumber :
                                        '',
                value: editedOutput.type === 'PAPER' ? getJournalPartitionValue(editedOutput.journalPartition) : editedOutput.value,
                publicationUrl: editedOutput.publicationUrl || '',
                fileId: editedOutput.fileId || '',
                otherInfo: {
                    pubmedId: editedOutput.type === 'PAPER' && editedOutput.pubmedId ? editedOutput.pubmedId : undefined,
                    journal: editedOutput.type === 'PAPER' ? editedOutput.journal : undefined,
                    authors: editedOutput.type === 'PAPER' ? editedOutput.authors :
                        editedOutput.type === 'PUBLICATION' ? editedOutput.authors :
                            (editedOutput.type === 'INVENTION_PATENT' || editedOutput.type === 'UTILITY_PATENT' || editedOutput.type === 'PROJECT' || editedOutput.type === 'SOFTWARE_COPYRIGHT') ? editedOutput.authors : undefined,
                    legalStatus: (editedOutput.type === 'INVENTION_PATENT' || editedOutput.type === 'UTILITY_PATENT') ? editedOutput.legalStatus : undefined,
                    patentCountry: (editedOutput.type === 'INVENTION_PATENT' || editedOutput.type === 'UTILITY_PATENT') ? editedOutput.patentCountry : undefined,
                    softwareName: editedOutput.type === 'SOFTWARE_COPYRIGHT' ? editedOutput.softwareName : undefined,
                    copyrightOwner: editedOutput.type === 'SOFTWARE_COPYRIGHT' ? editedOutput.copyrightOwner : undefined,
                    registrationDate: editedOutput.type === 'SOFTWARE_COPYRIGHT' ? editedOutput.registrationDate : undefined,
                    awardRecipient: editedOutput.type === 'OTHER_AWARD' ? editedOutput.awardRecipient : undefined,
                    awardIssuingAuthority: editedOutput.type === 'OTHER_AWARD' ? editedOutput.awardIssuingAuthority : undefined,
                    awardTime: editedOutput.type === 'OTHER_AWARD' ? editedOutput.awardTime : undefined,
                    competitionLevel: editedOutput.type === 'OTHER_AWARD' ? editedOutput.competitionLevel : undefined,
                    journalPartition: editedOutput.type === 'PAPER' ? editedOutput.journalPartition : undefined // 添加期刊分区信息
                }
            };

            await outputApi.updateOutput(output.id, outputData);

            toast({
                title: "更新成功",
                description: "研究成果已成功更新"
            });

            resetUploadFile(false);

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
                    value: 0,
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
                    fileId: "",
                    journalPartition: "" // 添加期刊分区字段
                });
                setSelectedDataset(null);
                resetUploadFile(true);
            }
        }}>
            <DialogContent
                className="sm:max-w-[500px] md:max-w-[600px] lg:max-w-[700px] max-h-[85vh] overflow-hidden flex flex-col"
                onInteractOutside={(e) => e.preventDefault()}
            >
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
                            <ResearchOutputForm
                                formData={editedOutput}
                                onFormDataChange={setEditedOutput}
                                selectedDataset={selectedDataset}
                                onDatasetSelect={handleDatasetSelect}
                                DatasetSelectorComponent={ApprovedDatasetSelector}
                                FileUploaderComponent={FileUploader}
                                maxSize={500 * 1024 * 1024} // 500MB
                                acceptedFileTypes={['.zip', '.rar', '.7z', '.pdf', '.doc', '.docx', '.txt', '.ppt', '.pptx']} // 压缩包和文档格式
                                isLoadingPubmed={isLoadingPubmed}
                                pubmedError={pubmedError}
                                onFetchPubMed={handleFetchPubMedData}
                                onPubmedIdChange={handlePubmedIdChange}
                                disableTypeSelect={!!output.type}
                                uploadedFile={uploadedFile}
                                loadingFileInfo={loadingFileInfo}
                                fileUploaderRef={fileUploaderRef}
                                onFileUploadComplete={(fileInfo) => {
                                    setUploadedFile(fileInfo);
                                    setEditedOutput(prev => ({...prev, fileId: fileInfo.id}));
                                }}
                                onFileResetComplete={() => {
                                    setUploadedFile(null);
                                    setEditedOutput(prev => ({...prev, fileId: null}));
                                }}
                            />

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