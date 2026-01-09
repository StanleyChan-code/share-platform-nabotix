import {useState, useRef} from "react";
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
import {outputApi} from "@/integrations/api/outputApi";
import {Dataset} from "@/integrations/api/datasetApi";
import {FileInfo} from "@/integrations/api/fileApi";
import ResearchOutputForm from "@/components/outputs/ResearchOutputForm";
import {ApprovedDatasetSelector} from "./ApprovedDatasetSelector.tsx";
import FileUploader from "@/components/fileuploader/FileUploader.tsx";
import {getJournalPartitionValue} from "@/lib/outputUtils.ts";

// 定义表单数据接口，提高类型安全性
export interface OutputFormData {
    title: string;
    abstract: string;
    type: string;
    journal: string;
    patentNumber: string;
    datasetId: string;
    publicationUrl: string;
    pubmedId: string;
    authors: string;
    value: number;
    projectId: string;
    publicationAuthors: string;
    publicationNumber: string;
    legalStatus: string;
    patentCountry: string;
    softwareName: string;
    copyrightOwner: string;
    registrationDate: string;
    awardRecipient: string;
    awardIssuingAuthority: string;
    awardTime: string;
    competitionLevel: string;
    fileId: string;
    journalPartition: string;
}

interface SubmitOutputDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: () => void;
}

// 定义表单初始状态常量，提高复用性和可维护性
const INITIAL_OUTPUT_STATE: OutputFormData = {
    title: "",
    abstract: "",
    type: "", // 默认不选择类型
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
    fileId: "", // 添加文件ID字段
    journalPartition: "" // 添加期刊分区字段
};

const SubmitOutputDialog = ({open, onOpenChange, onSubmit}: SubmitOutputDialogProps) => {
    const [newOutput, setNewOutput] = useState<OutputFormData>(INITIAL_OUTPUT_STATE);

    // 添加文件信息状态
    const [uploadedFile, setUploadedFile] = useState<FileInfo | null>(null);
    const fileUploaderRef = useRef<any>(null);
    const resetUploadFile = (clearFile: boolean = false) => {
        // 调用 FileUploader 的重置方法
        if (!fileUploaderRef.current) return;
        fileUploaderRef.current.handleReset(clearFile);
    };

    // 统一的表单重置函数
    const resetForm = () => {
        setNewOutput(INITIAL_OUTPUT_STATE);
        setSelectedDataset(null);
        resetUploadFile(true);
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
            setNewOutput(prev => ({
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
        setNewOutput(prev => ({...prev, datasetId: dataset.id}));
    };

    // 表单验证函数，提取验证逻辑以提高可读性
    const validateForm = (): boolean => {
        // Validate required fields based on type
        if (!newOutput.datasetId || !newOutput.type) {
            toast({
                title: "提交失败",
                description: "请填写所有必填字段",
                variant: "destructive"
            });
            return false;
        }

        // Validate fields based on output类型
        if (newOutput.type === 'PROJECT' && (!newOutput.projectId || !newOutput.authors)) {
            toast({
                title: "提交失败",
                description: "请输入项目编号/课题编号和项目/课题成员",
                variant: "destructive"
            });
            return false;
        }

        if (newOutput.type === 'PAPER' && (!newOutput.title || !newOutput.abstract || !newOutput.authors)) {
            toast({
                title: "提交失败",
                description: "请输入论文标题、摘要和作者",
                variant: "destructive"
            });
            return false;
        }

        if (newOutput.type === 'PUBLICATION' && (!newOutput.title || !newOutput.abstract || !newOutput.publicationNumber || !newOutput.authors)) {
            toast({
                title: "提交失败",
                description: "请输入出版物标题、摘要、作者和出版物编号",
                variant: "destructive"
            });
            return false;
        }

        if ((newOutput.type === 'INVENTION_PATENT' || newOutput.type === 'UTILITY_PATENT') && (!newOutput.title || !newOutput.abstract || !newOutput.patentNumber || !newOutput.legalStatus || !newOutput.authors)) {
            toast({
                title: "提交失败",
                description: "请输入专利标题、摘要、专利识别号、法律状态和发明人",
                variant: "destructive"
            });
            return false;
        }

        if (newOutput.type === 'SOFTWARE_COPYRIGHT' && (!newOutput.title || !newOutput.abstract || !newOutput.patentNumber || !newOutput.softwareName || !newOutput.authors)) {
            toast({
                title: "提交失败",
                description: "请输入软件著作权标题、摘要、登记号、软件名称和著作权人",
                variant: "destructive"
            });
            return false;
        }

        if (newOutput.type === 'OTHER_AWARD' && (!newOutput.title || !newOutput.abstract || !newOutput.awardRecipient || !newOutput.awardIssuingAuthority || !newOutput.awardTime)) {
            toast({
                title: "提交失败",
                description: "请输入奖项名称、成果简介、获奖人/单位、颁发单位和获奖时间",
                variant: "destructive"
            });
            return false;
        }

        return true;
    };

    // 构建API提交数据的函数，提取复杂的逻辑
    const buildOutputData = () => {
        // Determine output number based on type
        const getOutputNumber = () => {
            switch (newOutput.type) {
                case 'PROJECT':
                    return newOutput.projectId;
                case 'PAPER':
                    return newOutput.pubmedId;
                case 'PUBLICATION':
                    return newOutput.publicationNumber;
                case 'INVENTION_PATENT':
                case 'UTILITY_PATENT':
                case 'SOFTWARE_COPYRIGHT':
                    return newOutput.patentNumber;
                default:
                    return '';
            }
        };

        // Build conditional otherInfo object
        const buildOtherInfo = () => {
            const otherInfo: any = {};

            if (newOutput.type === 'PAPER') {
                otherInfo.pubmedId = newOutput.pubmedId;
                otherInfo.journal = newOutput.journal;
                otherInfo.authors = newOutput.authors;
                otherInfo.journalPartition = newOutput.journalPartition;
            } else if (newOutput.type === 'PUBLICATION') {
                otherInfo.authors = newOutput.authors;
            } else if (['INVENTION_PATENT', 'UTILITY_PATENT'].includes(newOutput.type)) {
                otherInfo.authors = newOutput.authors;
                otherInfo.legalStatus = newOutput.legalStatus;
                otherInfo.patentCountry = newOutput.patentCountry;
            } else if (newOutput.type === 'PROJECT' || newOutput.type === 'SOFTWARE_COPYRIGHT') {
                otherInfo.authors = newOutput.authors;
            }

            if (newOutput.type === 'SOFTWARE_COPYRIGHT') {
                otherInfo.softwareName = newOutput.softwareName;
                otherInfo.copyrightOwner = newOutput.copyrightOwner;
                otherInfo.registrationDate = newOutput.registrationDate;
            } else if (newOutput.type === 'OTHER_AWARD') {
                otherInfo.awardRecipient = newOutput.awardRecipient;
                otherInfo.awardIssuingAuthority = newOutput.awardIssuingAuthority;
                otherInfo.awardTime = newOutput.awardTime;
                otherInfo.competitionLevel = newOutput.competitionLevel;
            }

            return Object.keys(otherInfo).length > 0 ? otherInfo : undefined;
        };

        return {
            datasetId: newOutput.datasetId,
            type: newOutput.type.toUpperCase(),
            otherType: null,
            title: newOutput.title,
            abstractText: newOutput.abstract,
            outputNumber: getOutputNumber(),
            value: newOutput.type === 'PAPER' ? getJournalPartitionValue(newOutput.journalPartition) : newOutput.value,
            publicationUrl: newOutput.publicationUrl || '',
            fileId: newOutput.fileId || '',
            otherInfo: buildOtherInfo()
        };
    };

    const handleSubmitOutput = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate form
        if (!validateForm()) {
            return;
        }

        try {
            // Submit the research output via API
            const outputData = buildOutputData();

            await outputApi.submitOutput(outputData);

            toast({
                title: "提交成功",
                description: "研究成果已成功提交，等待管理员审核"
            });

            onSubmit();
            onOpenChange(false);

            // Reset form using the unified function
            resetForm();
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
                // Reset form when closing using the unified function
                resetForm();
            }
        }}>
            <DialogContent
                className="sm:max-w-[500px] md:max-w-[600px] lg:max-w-[700px] max-h-[85vh] overflow-hidden flex flex-col"
                onInteractOutside={(e) => e.preventDefault()}
            >
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
                            <ResearchOutputForm
                                formData={newOutput}
                                onFormDataChange={setNewOutput}
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
                                uploadedFile={uploadedFile}
                                fileUploaderRef={fileUploaderRef}
                                onFileUploadComplete={(fileInfo) => {
                                    setUploadedFile(fileInfo);
                                    setNewOutput(prev => ({...prev, fileId: fileInfo.id}));
                                }}
                                onFileResetComplete={() => {
                                    setUploadedFile(null);
                                    setNewOutput(prev => ({...prev, fileId: null}));
                                }}
                            />
                            
                            <div className="flex justify-end space-x-2 pt-4">
                                <Button type="button" variant="outline" onClick={() => {
                                    // 先清除表单内容，再关闭对话框
                                    resetForm();
                                    onOpenChange(false);
                                }}>
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