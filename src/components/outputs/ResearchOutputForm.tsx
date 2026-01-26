import { useEffect } from "react";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2, X, Asterisk, AlertCircle } from "lucide-react";
import { Dataset } from "@/integrations/api/datasetApi";
import {OutputTypes} from "@/lib/enums";
import { formatFileSize } from "@/lib/utils";
import DatasetInfoDisplay from "@/components/dataset/DatasetInfoDisplay.tsx";
import { getAllJournalPartitionName, getAllJournalPartitionTypes, getOutputTypeDisplayName } from "@/lib/outputUtils";
import * as React from "react";
import { FormValidator, Input, Textarea } from "@/components/ui/FormValidator";

interface ResearchOutputFormProps {
    // 表单数据
    formData: any;
    onFormDataChange: (data: any) => void;

    // 数据集相关
    selectedDataset: Dataset | null;
    onDatasetSelect: (dataset: Dataset) => void;
    showDatasetInfo?: boolean;
    DatasetSelectorComponent: React.ComponentType<any>;

    // PubMed相关
    isLoadingPubmed?: boolean;
    pubmedError?: string;
    onFetchPubMed?: (pubmedId: string) => Promise<void>;
    onPubmedIdChange?: (value: string) => void;

    // 类型选择相关
    disableTypeSelect?: boolean;

    // 文件上传相关
    uploadedFile?: any;
    loadingFileInfo?: boolean;
    fileUploaderRef?: React.RefObject<any>;
    onFileUploadComplete?: (fileInfo: any) => void;
    onFileResetComplete?: () => void;
    maxSize?: number;
    acceptedFileTypes?: string[];
    FileUploaderComponent: React.ComponentType<any>;
}

const ResearchOutputForm = ({
                                formData,
                                onFormDataChange,
                                selectedDataset,
                                onDatasetSelect,
                                showDatasetInfo = true,
                                DatasetSelectorComponent,
                                isLoadingPubmed = false,
                                pubmedError = "",
                                onFetchPubMed,
                                onPubmedIdChange,
                                disableTypeSelect = false,
                                uploadedFile,
                                loadingFileInfo = false,
                                fileUploaderRef,
                                onFileUploadComplete,
                                onFileResetComplete,
                                maxSize = 500 * 1024 * 1024,
                                acceptedFileTypes,
                                FileUploaderComponent,
                            }: ResearchOutputFormProps) => {
    // 当selectedDataset改变时，更新formData中的datasetId
    useEffect(() => {
        if (selectedDataset) {
            onFormDataChange({ ...formData, datasetId: selectedDataset.id });
        }
    }, [selectedDataset]);

    const handleInputChange = (field: string, value: string) => {
        onFormDataChange({ ...formData, [field]: value });
    };

    const handleTypeChange = (value: string) => {
        // 清空之前填写的字段
        const clearedData = {
            ...formData,
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
            value: 0,
            // 通用字段也清空
            title: "",
            abstract: "",
            publicationUrl: "",
            fileId: "",
            journalPartition: ""
        };

        onFormDataChange(clearedData);

        // 如果有文件重置回调，则调用
        if (onFileResetComplete) {
            onFileResetComplete();
        }
    };

    const handleFetchPubMedData = async () => {
        if (onFetchPubMed && formData.pubmedId) {
            await onFetchPubMed(formData.pubmedId);
        }
    };

    // 验证PubMed ID格式
    const validatePubMedId = (id: string): boolean => {
        if (!id) return true;
        const pubmedIdRegex = /^\d{7,9}$/;
        return pubmedIdRegex.test(id);
    };

    // 验证URL格式
    const validateUrl = (url: string): boolean => {
        if (!url) return true;
        try {
            new URL(url.startsWith('http') ? url : `https://${url}`);
            return true;
        } catch {
            return false;
        }
    };

    const renderDatasetInformation = () => {
        if (!showDatasetInfo || !selectedDataset) return null;

        return (
            <DatasetInfoDisplay 
                dataset={selectedDataset} 
                title="研究成果关联的数据集信息"
            />
        );
    };

    const renderDatasetSelection = () => {
        return (
            <DatasetSelectorComponent
                selectedDataset={selectedDataset}
                onDatasetSelect={onDatasetSelect}
                label="研究成果关联的数据集"
                required
            />
        );
    };

    const renderPubMedSection = () => {
        if (formData.type !== "PAPER") return null;

        const isPubMedIdValid = validatePubMedId(formData.pubmedId);

        return (
            <div className="space-y-2">
                <Label htmlFor="pubmedId" className="flex items-center gap-1">
                    PubMed ID
                </Label>
                <div className="flex gap-2">
                    <Input
                        id="pubmedId"
                        name="pubmedId"
                        value={formData.pubmedId}
                        onChange={(e) => onPubmedIdChange?.(e.target.value)}
                        placeholder="输入7-9位PubMed ID"
                        disabled={isLoadingPubmed}
                        maxLength={20}
                        validationType="custom"
                        customValidation={() => isPubMedIdValid}
                        errorMessage="请输入7-9位数字的PubMed ID"
                    />
                    <Button
                        type="button"
                        onClick={handleFetchPubMedData}
                        disabled={isLoadingPubmed || !formData.pubmedId || !isPubMedIdValid}
                    >
                        {isLoadingPubmed ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                            "搜索"
                        )}
                    </Button>
                </div>
                {!isPubMedIdValid && formData.pubmedId && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        请输入7-9位数字的PubMed ID
                    </p>
                )}
                {pubmedError && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {pubmedError}
                    </p>
                )}
            </div>
        );
    };

    const renderTitleField = () => {
        if (formData.type === "OTHER_AWARD") {
            return (
                <div className="space-y-2">
                    <Label htmlFor="outputTitle" className="flex items-center gap-1">
                        奖项名称 <Asterisk className="h-3 w-3 text-red-500" />
                    </Label>
                    <Input
                        id="outputTitle"
                        name="title"
                        value={formData.title}
                        onChange={(e) => handleInputChange("title", e.target.value)}
                        placeholder="请输入奖项名称"
                        disabled={isLoadingPubmed && formData.type === "PAPER"}
                        maxLength={200}
                        required
                        validationType="custom"
                    />
                </div>
            );
        }

        return (
            <div className="space-y-2">
                <Label htmlFor="outputTitle" className="flex items-center gap-1">
                    {getOutputTypeDisplayName(formData.type)}名称 <Asterisk className="h-3 w-3 text-red-500" />
                </Label>
                <Input
                    id="outputTitle"
                    name="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    placeholder={`请输入${getOutputTypeDisplayName(formData.type)}名称`}
                    disabled={isLoadingPubmed && formData.type === "PAPER"}
                    maxLength={200}
                    required
                    validationType="custom"
                />
            </div>
        );
    };

    const renderAbstractField = () => {
        if (formData.type === "OTHER_AWARD") {
            return (
                <div className="space-y-2">
                    <Label htmlFor="abstract" className="flex items-center gap-1">
                        成果简介 <Asterisk className="h-3 w-3 text-red-500" />
                    </Label>
                    <Textarea
                        id="abstract"
                        name="abstract"
                        rows={4}
                        value={formData.abstract}
                        onChange={(e) => handleInputChange("abstract", e.target.value)}
                        placeholder="请输入成果简介"
                        maxLength={2000}
                        required
                        validationType="custom"
                    />
                </div>
            );
        }

        return (
            <div className="space-y-2">
                <Label htmlFor="abstract" className="flex items-center gap-1">
                    摘要 <Asterisk className="h-3 w-3 text-red-500" />
                </Label>
                <Textarea
                    id="abstract"
                    name="abstract"
                    rows={4}
                    value={formData.abstract}
                    onChange={(e) => handleInputChange("abstract", e.target.value)}
                    placeholder="简要描述研究内容、方法和主要发现"
                    disabled={isLoadingPubmed && formData.type === "PAPER"}
                    maxLength={2000}
                    required
                    validationType="custom"
                />
            </div>
        );
    };

    const renderTypeSpecificFields = () => {
        if (!formData.type) return null;

        const getRequiredFields = () => {
            switch (formData.type.toUpperCase()) {
                case "PAPER":
                    return { authors: true, journal: false };
                case "PROJECT":
                    return { projectId: true, authors: true };
                case "PUBLICATION":
                    return { authors: true, publicationNumber: true };
                case "INVENTION_PATENT":
                case "UTILITY_PATENT":
                    return { patentNumber: true, authors: true, legalStatus: true };
                case "SOFTWARE_COPYRIGHT":
                    return { patentNumber: true, softwareName: true, authors: true };
                case "OTHER_AWARD":
                    return { awardRecipient: true, awardIssuingAuthority: true, awardTime: true };
                default:
                    return {};
            }
        };

        const requiredFields = getRequiredFields();

        switch (formData.type.toUpperCase()) {
            case "PAPER":
                return (
                    <>
                        <div className="space-y-2">
                            <Label htmlFor="journal" className="flex items-center gap-1">
                                发表期刊 {requiredFields.journal && <Asterisk className="h-3 w-3 text-red-500" />}
                            </Label>
                            <Input
                                id="journal"
                                name="journal"
                                value={formData.journal}
                                onChange={(e) => handleInputChange("journal", e.target.value)}
                                placeholder="期刊名称"
                                disabled={isLoadingPubmed}
                                maxLength={200}
                                required={requiredFields.journal}
                                validationType="custom"
                            />
                        </div>

                        {/* 期刊分区选择 */}
                        <div className="space-y-2">
                            <Label htmlFor="journalPartition">期刊分区</Label>
                            <Select
                                value={formData.journalPartition}
                                onValueChange={(value) => {
                                    handleInputChange("journalPartition", value);
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="-- 请选择 --" />
                                </SelectTrigger>
                                <SelectContent>
                                    {getAllJournalPartitionTypes().map((jpType) => (
                                        <SelectGroup key={jpType.value}>
                                            <SelectLabel>{jpType.name}</SelectLabel>
                                            {getAllJournalPartitionName(jpType.value).map((item) => (
                                                <SelectItem key={item.value} value={item.value}>
                                                    {item.name}
                                                </SelectItem>
                                            ))}
                                        </SelectGroup>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="authors" className="flex items-center gap-1">
                                作者 <Asterisk className="h-3 w-3 text-red-500" />
                            </Label>
                            <Input
                                id="authors"
                                name="authors"
                                value={formData.authors}
                                onChange={(e) => handleInputChange("authors", e.target.value)}
                                placeholder="作者姓名，多个作者请用逗号分隔"
                                disabled={isLoadingPubmed}
                                maxLength={500}
                                required
                                validationType="custom"
                            />
                        </div>
                    </>
                );

            case "PROJECT":
                return (
                    <>
                        <div className="space-y-2">
                            <Label htmlFor="projectId" className="flex items-center gap-1">
                                项目编号/课题编号 <Asterisk className="h-3 w-3 text-red-500" />
                            </Label>
                            <Input
                                id="projectId"
                                name="projectId"
                                value={formData.projectId}
                                onChange={(e) => handleInputChange("projectId", e.target.value)}
                                placeholder="请输入项目编号或课题编号"
                                maxLength={200}
                                required
                                validationType="custom"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="authors" className="flex items-center gap-1">
                                项目/课题成员 <Asterisk className="h-3 w-3 text-red-500" />
                            </Label>
                            <Input
                                id="authors"
                                name="authors"
                                value={formData.authors}
                                onChange={(e) => handleInputChange("authors", e.target.value)}
                                placeholder="项目/课题成员，多个成员请用逗号分隔"
                                maxLength={500}
                                required
                                validationType="custom"
                            />
                        </div>
                    </>
                );

            case "PUBLICATION":
                return (
                    <>
                        <div className="space-y-2">
                            <Label htmlFor="authors" className="flex items-center gap-1">
                                作者 <Asterisk className="h-3 w-3 text-red-500" />
                            </Label>
                            <Input
                                id="authors"
                                name="authors"
                                value={formData.authors}
                                onChange={(e) => handleInputChange("authors", e.target.value)}
                                placeholder="作者姓名，多个作者请用逗号分隔"
                                maxLength={500}
                                required
                                validationType="custom"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="publicationNumber" className="flex items-center gap-1">
                                出版物编号 <Asterisk className="h-3 w-3 text-red-500" />
                            </Label>
                            <Input
                                id="publicationNumber"
                                name="publicationNumber"
                                value={formData.publicationNumber}
                                onChange={(e) => handleInputChange("publicationNumber", e.target.value)}
                                placeholder="请输入出版物编号"
                                maxLength={200}
                                required
                                validationType="custom"
                            />
                        </div>
                    </>
                );

            case "INVENTION_PATENT":
            case "UTILITY_PATENT":
                return (
                    <>
                        <div className="space-y-2">
                            <Label htmlFor="patentNumber" className="flex items-center gap-1">
                                专利识别号 <Asterisk className="h-3 w-3 text-red-500" />
                            </Label>
                            <Input
                                id="patentNumber"
                                name="patentNumber"
                                value={formData.patentNumber}
                                onChange={(e) => handleInputChange("patentNumber", e.target.value)}
                                placeholder="请输入公开号或者授权号"
                                maxLength={200}
                                required
                                validationType="custom"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="authors" className="flex items-center gap-1">
                                发明人 <Asterisk className="h-3 w-3 text-red-500" />
                            </Label>
                            <Input
                                id="authors"
                                name="authors"
                                value={formData.authors}
                                onChange={(e) => handleInputChange("authors", e.target.value)}
                                placeholder="发明人姓名，多个发明人请用逗号分隔"
                                maxLength={500}
                                required
                                validationType="custom"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="legalStatus" className="flex items-center gap-1">
                                法律状态 <Asterisk className="h-3 w-3 text-red-500" />
                            </Label>
                            <Input
                                id="legalStatus"
                                name="legalStatus"
                                value={formData.legalStatus}
                                onChange={(e) => handleInputChange("legalStatus", e.target.value)}
                                placeholder="例如：实质性审查生效、专利权维持、专利权终止等"
                                maxLength={200}
                                required
                                validationType="custom"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="patentCountry">专利国别/地区</Label>
                            <Input
                                id="patentCountry"
                                name="patentCountry"
                                value={formData.patentCountry}
                                onChange={(e) => handleInputChange("patentCountry", e.target.value)}
                                placeholder="请输入专利国别或地区"
                                maxLength={100}
                                validationType="custom"
                            />
                        </div>
                    </>
                );

            case "SOFTWARE_COPYRIGHT":
                return (
                    <>
                        <div className="space-y-2">
                            <Label htmlFor="patentNumber" className="flex items-center gap-1">
                                登记号 <Asterisk className="h-3 w-3 text-red-500" />
                            </Label>
                            <Input
                                id="patentNumber"
                                name="patentNumber"
                                value={formData.patentNumber}
                                onChange={(e) => handleInputChange("patentNumber", e.target.value)}
                                placeholder="请输入软件著作权登记号"
                                maxLength={200}
                                required
                                validationType="custom"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="softwareName" className="flex items-center gap-1">
                                软件名称(全称) <Asterisk className="h-3 w-3 text-red-500" />
                            </Label>
                            <Input
                                id="softwareName"
                                name="softwareName"
                                value={formData.softwareName}
                                onChange={(e) => handleInputChange("softwareName", e.target.value)}
                                placeholder="请输入软件全称"
                                maxLength={200}
                                required
                                validationType="custom"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="authors" className="flex items-center gap-1">
                                著作权人 <Asterisk className="h-3 w-3 text-red-500" />
                            </Label>
                            <Input
                                id="authors"
                                name="authors"
                                value={formData.authors}
                                onChange={(e) => handleInputChange("authors", e.target.value)}
                                placeholder="著作权人姓名，多个著作权人请用逗号分隔"
                                maxLength={500}
                                required
                                validationType="custom"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="registrationDate">登记日期</Label>
                            <Input
                                id="registrationDate"
                                name="registrationDate"
                                type="date"
                                value={formData.registrationDate}
                                onChange={(e) => handleInputChange("registrationDate", e.target.value)}
                                validationType="custom"
                            />
                        </div>
                    </>
                );

            case "OTHER_AWARD":
                return (
                    <>
                        <div className="space-y-2">
                            <Label htmlFor="awardRecipient" className="flex items-center gap-1">
                                获奖人/单位 <Asterisk className="h-3 w-3 text-red-500" />
                            </Label>
                            <Input
                                id="awardRecipient"
                                name="awardRecipient"
                                value={formData.awardRecipient}
                                onChange={(e) => handleInputChange("awardRecipient", e.target.value)}
                                placeholder="请输入获奖人或单位名称"
                                maxLength={200}
                                required
                                validationType="custom"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="awardIssuingAuthority" className="flex items-center gap-1">
                                颁发单位 <Asterisk className="h-3 w-3 text-red-500" />
                            </Label>
                            <Input
                                id="awardIssuingAuthority"
                                name="awardIssuingAuthority"
                                value={formData.awardIssuingAuthority}
                                onChange={(e) => handleInputChange("awardIssuingAuthority", e.target.value)}
                                placeholder="请输入颁发单位名称"
                                maxLength={200}
                                required
                                validationType="custom"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="awardTime" className="flex items-center gap-1">
                                获奖时间 <Asterisk className="h-3 w-3 text-red-500" />
                            </Label>
                            <Input
                                id="awardTime"
                                name="awardTime"
                                type="date"
                                value={formData.awardTime}
                                onChange={(e) => handleInputChange("awardTime", e.target.value)}
                                required
                                validationType="custom"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="competitionLevel">赛事层次</Label>
                            <Select
                                value={formData.competitionLevel}
                                onValueChange={(value) => handleInputChange("competitionLevel", value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="请选择赛事层次" />
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
                );

            default:
                return null;
        }
    };

    const renderUrlField = () => {
        const isUrlValid = validateUrl(formData.publicationUrl);

        return (
            <div className="space-y-2">
                <Label htmlFor="url">
                    {formData.type === "PAPER" ? 'DOI链接' : 'URL链接'}
                </Label>
                <Input
                    id="url"
                    name="publicationUrl"
                    value={formData.publicationUrl}
                    onChange={(e) => handleInputChange("publicationUrl", e.target.value)}
                    placeholder={formData.type === "PAPER"
                        ? '示例: doi.org/10.1038/s41586-025-09732-2'
                        : 'https://www.baidu.com'}
                    disabled={isLoadingPubmed && formData.type === "PAPER"}
                    maxLength={500}
                    validationType="custom"
                    customValidation={() => validateUrl(formData.publicationUrl)}
                    errorMessage="请输入有效的URL地址"
                />
                {!isUrlValid && formData.publicationUrl && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        请输入有效的URL地址
                    </p>
                )}
            </div>
        );
    };

    const renderFileUploadSection = () => {
        const FileUploader = FileUploaderComponent;

        return (
            <div className="space-y-2">
                <Label htmlFor="supportingDocument">说明文件（选填）</Label>

                {/* 显示已上传文件信息 */}
                {loadingFileInfo ? (
                    <div className="text-sm text-muted-foreground">正在加载文件信息...</div>
                ) : uploadedFile && (
                    <div className="text-sm p-2 bg-muted rounded flex justify-between items-center">
            <span>
              已上传文件: {uploadedFile.fileName} （{formatFileSize(uploadedFile.fileSize)}）
            </span>
                        <button
                            type="button"
                            className="text-destructive hover:text-destructive/80"
                            onClick={() => {onFileResetComplete?.(); fileUploaderRef?.current?.handleReset(true)}}
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                )}

                <div className={uploadedFile && "hidden"}>
                    <FileUploader
                        ref={fileUploaderRef}
                        onResetComplete={onFileResetComplete}
                        onUploadComplete={onFileUploadComplete}
                        maxSize={maxSize}
                        acceptedFileTypes={acceptedFileTypes}
                    />
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-4">
            {/* 数据集选择器 */}
            {renderDatasetSelection()}

            {/* 数据集信息展示 */}
            {selectedDataset && renderDatasetInformation()}

            {/* 成果类型选择 */}
            {selectedDataset && (
                <div className="space-y-2">
                    <Label htmlFor="outputType" className="flex items-center gap-1">
                        成果类型 <Asterisk className="h-3 w-3 text-red-500" />
                    </Label>
                    <Select
                        value={formData.type}
                        onValueChange={handleTypeChange}
                        disabled={disableTypeSelect}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="请选择成果类型" />
                        </SelectTrigger>
                        <SelectContent>
                            {Object.entries(OutputTypes) .map(([key, value]) => (
                                <SelectItem key={key} value={key}>
                                    {value}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            )}

            {/* 根据类型显示相应字段 */}
            {formData.type && (
                <FormValidator onSubmit={() => {}} className="space-y-4">
                    {renderPubMedSection()}
                    {renderTitleField()}
                    {renderTypeSpecificFields()}
                    {renderAbstractField()}
                    {renderUrlField()}
                    {renderFileUploadSection()}
                </FormValidator>
            )}
        </div>
    );
};

export default ResearchOutputForm;