import { useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import {Loader2, X} from "lucide-react";
import { Dataset } from "@/integrations/api/datasetApi";
import { DatasetTypes } from "@/lib/enums";
import {formatDate, formatFileSize} from "@/lib/utils";
import { getOutputTypeDisplayName } from "@/lib/outputUtils";
import * as React from "react";

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
  FileUploaderComponent: React.ComponentType<any>; // 新增FileUploader组件prop
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
  FileUploaderComponent, // 接收FileUploader组件
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

  const renderDatasetInformation = () => {
    if (!showDatasetInfo || !selectedDataset) return null;
    
    return (
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
                  title={selectedDataset.subjectArea?.name || '无'}>
              {selectedDataset.subjectArea?.name || '无'}
            </span>
          </div>
          <div className="flex">
            <span className="font-medium w-24 flex-shrink-0">发布时间:</span>
            <span className="truncate">{formatDate(selectedDataset.firstPublishedDate)}</span>
          </div>
          <div className="flex">
            <span className="font-medium w-24 flex-shrink-0">提供者:</span>
            <span className="truncate"
                  title={selectedDataset.datasetLeader}>
              {selectedDataset.datasetLeader}
            </span>
          </div>
          <div className="flex">
            <span className="font-medium w-24 flex-shrink-0">采集单位:</span>
            <span className="truncate"
                  title={selectedDataset.dataCollectionUnit}>
              {selectedDataset.dataCollectionUnit}
            </span>
          </div>
        </div>
      </div>
    );
  };

  const renderDatasetSelection = () => {
    return (
      <DatasetSelectorComponent
        selectedDataset={selectedDataset}
        onDatasetSelect={onDatasetSelect}
        label="关联数据集"
        required
      />
    );
  };

  const renderPubMedSection = () => {
    if (formData.type !== "PAPER") return null;
    return (
      <div className="space-y-2">
        <Label htmlFor="pubmedId">PubMed ID</Label>
        <div className="flex gap-2">
          <Input
            id="pubmedId"
            value={formData.pubmedId}
            onChange={(e) => onPubmedIdChange?.(e.target.value)}
            placeholder="输入7-9位PubMed ID"
            disabled={isLoadingPubmed}
          />
          <Button
            type="button"
            onClick={handleFetchPubMedData}
            disabled={isLoadingPubmed}
          >
            {isLoadingPubmed ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              "搜索"
            )}
          </Button>
        </div>
        {pubmedError && (
          <p className="text-sm text-destructive">{pubmedError}</p>
        )}
      </div>
    );
  };

  const renderTitleField = () => {
    if (formData.type === "OTHER_REWARD") {
      return (
        <div className="space-y-2">
          <Label htmlFor="outputTitle">奖项名称 *</Label>
          <Input
            id="outputTitle"
            value={formData.title}
            onChange={(e) => handleInputChange("title", e.target.value)}
            placeholder="请输入奖项名称"
            disabled={isLoadingPubmed && formData.type === "PAPER"}
          />
        </div>
      );
    }
    
    return (
      <div className="space-y-2">
        <Label htmlFor="outputTitle">
          {getOutputTypeDisplayName(formData.type)}名称 *
        </Label>
        <Input
          id="outputTitle"
          value={formData.title}
          onChange={(e) => handleInputChange("title", e.target.value)}
          placeholder={`请输入${getOutputTypeDisplayName(formData.type)}名称`}
          disabled={isLoadingPubmed && formData.type === "PAPER"}
        />
      </div>
    );
  };

  const renderAbstractField = () => {
    if (formData.type === "OTHER_REWARD") {
      return (
        <div className="space-y-2">
          <Label htmlFor="abstract">成果简介 *</Label>
          <Textarea
            id="abstract"
            rows={4}
            value={formData.abstract}
            onChange={(e) => handleInputChange("abstract", e.target.value)}
            placeholder="请输入成果简介"
          />
        </div>
      );
    }
    
    return (
      <div className="space-y-2">
        <Label htmlFor="abstract">摘要 *</Label>
        <Textarea
          id="abstract"
          rows={4}
          value={formData.abstract}
          onChange={(e) => handleInputChange("abstract", e.target.value)}
          placeholder="简要描述研究内容、方法和主要发现"
          disabled={isLoadingPubmed && formData.type === "PAPER"}
        />
      </div>
    );
  };

  const renderTypeSpecificFields = () => {
    if (!formData.type) return null;
    console.log(formData)
    switch (formData.type.toUpperCase()) {
      case "PAPER":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="journal">发表期刊</Label>
              <Input
                id="journal"
                value={formData.journal}
                onChange={(e) => handleInputChange("journal", e.target.value)}
                placeholder="期刊名称"
                disabled={isLoadingPubmed}
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
                  <SelectGroup>
                    <SelectLabel>中科院分区</SelectLabel>
                    <SelectItem value="cas_1">中科院 一区</SelectItem>
                    <SelectItem value="cas_2">中科院 二区</SelectItem>
                    <SelectItem value="cas_3">中科院 三区</SelectItem>
                    <SelectItem value="cas_4">中科院 四区</SelectItem>
                  </SelectGroup>
                  <SelectGroup>
                    <SelectLabel>JCR分区</SelectLabel>
                    <SelectItem value="jcr_q1">JCR Q1</SelectItem>
                    <SelectItem value="jcr_q2">JCR Q2</SelectItem>
                    <SelectItem value="jcr_q3">JCR Q3</SelectItem>
                    <SelectItem value="jcr_q4">JCR Q4</SelectItem>
                  </SelectGroup>
                  <SelectGroup>
                    <SelectLabel>其他</SelectLabel>
                    <SelectItem value="other">其他</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="authors">作者 *</Label>
              <Input
                id="authors"
                value={formData.authors}
                onChange={(e) => handleInputChange("authors", e.target.value)}
                placeholder="作者姓名，多个作者请用逗号分隔"
                disabled={isLoadingPubmed}
              />
            </div>
          </>
        );
      
      case "PROJECT":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="projectId">项目编号/课题编号 *</Label>
              <Input
                id="projectId"
                value={formData.projectId}
                onChange={(e) => handleInputChange("projectId", e.target.value)}
                placeholder="请输入项目编号或课题编号"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="authors">项目/课题成员 *</Label>
              <Input
                id="authors"
                value={formData.authors}
                onChange={(e) => handleInputChange("authors", e.target.value)}
                placeholder="项目/课题成员，多个成员请用逗号分隔"
              />
            </div>
          </>
        );
        
      case "PUBLICATION":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="authors">作者 *</Label>
              <Input
                id="authors"
                value={formData.authors}
                onChange={(e) => handleInputChange("authors", e.target.value)}
                placeholder="作者姓名，多个作者请用逗号分隔"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="publicationNumber">出版物编号 *</Label>
              <Input
                id="publicationNumber"
                value={formData.publicationNumber}
                onChange={(e) => handleInputChange("publicationNumber", e.target.value)}
                placeholder="请输入出版物编号"
              />
            </div>
          </>
        );
        
      case "INVENTION_PATENT":
      case "UTILITY_PATENT":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="patentNumber">专利识别号 *</Label>
              <Input
                id="patentNumber"
                value={formData.patentNumber}
                onChange={(e) => handleInputChange("patentNumber", e.target.value)}
                placeholder="请输入公开号或者授权号"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="authors">发明人 *</Label>
              <Input
                id="authors"
                value={formData.authors}
                onChange={(e) => handleInputChange("authors", e.target.value)}
                placeholder="发明人姓名，多个发明人请用逗号分隔"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="legalStatus">法律状态 *</Label>
              <Input
                id="legalStatus"
                value={formData.legalStatus}
                onChange={(e) => handleInputChange("legalStatus", e.target.value)}
                placeholder="例如：实质性审查生效、专利权维持、专利权终止等"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="patentCountry">专利国别/地区</Label>
              <Input
                id="patentCountry"
                value={formData.patentCountry}
                onChange={(e) => handleInputChange("patentCountry", e.target.value)}
                placeholder="请输入专利国别或地区"
              />
            </div>
          </>
        );
        
      case "SOFTWARE_COPYRIGHT":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="patentNumber">登记号 *</Label>
              <Input
                id="patentNumber"
                value={formData.patentNumber}
                onChange={(e) => handleInputChange("patentNumber", e.target.value)}
                placeholder="请输入软件著作权登记号"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="softwareName">软件名称(全称) *</Label>
              <Input
                id="softwareName"
                value={formData.softwareName}
                onChange={(e) => handleInputChange("softwareName", e.target.value)}
                placeholder="请输入软件全称"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="authors">著作权人 *</Label>
              <Input
                id="authors"
                value={formData.authors}
                onChange={(e) => handleInputChange("authors", e.target.value)}
                placeholder="著作权人姓名，多个著作权人请用逗号分隔"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="registrationDate">登记日期</Label>
              <Input
                id="registrationDate"
                type="date"
                value={formData.registrationDate}
                onChange={(e) => handleInputChange("registrationDate", e.target.value)}
              />
            </div>
          </>
        );
        
      case "OTHER_AWARD":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="awardRecipient">获奖人/单位 *</Label>
              <Input
                id="awardRecipient"
                value={formData.awardRecipient}
                onChange={(e) => handleInputChange("awardRecipient", e.target.value)}
                placeholder="请输入获奖人或单位名称"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="awardIssuingAuthority">颁发单位 *</Label>
              <Input
                id="awardIssuingAuthority"
                value={formData.awardIssuingAuthority}
                onChange={(e) => handleInputChange("awardIssuingAuthority", e.target.value)}
                placeholder="请输入颁发单位名称"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="awardTime">获奖时间 *</Label>
              <Input
                id="awardTime"
                type="date"
                value={formData.awardTime}
                onChange={(e) => handleInputChange("awardTime", e.target.value)}
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
    return (
      <div className="space-y-2">
        <Label htmlFor="url">
          {formData.type === "PAPER" ? 'DOI链接' : 'URL链接'}
        </Label>
        <Input
          id="url"
          value={formData.publicationUrl}
          onChange={(e) => handleInputChange("publicationUrl", e.target.value)}
          placeholder={formData.type === "PAPER"
            ? '示例: doi.org/10.1038/s41586-025-09732-2' 
            : 'https://www.baidu.com'}
          disabled={isLoadingPubmed && formData.type === "PAPER"}
        />
      </div>
    );
  };

  const renderFileUploadSection = () => {
    // 使用通过props传入的FileUploader组件
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
              onClick={() => {onFileResetComplete(); fileUploaderRef.current.handleReset(true)}}
            ><X className="h-4 w-4" />
            </button>
          </div>
        )}
        
        <FileUploader
          ref={fileUploaderRef}
          onResetComplete={onFileResetComplete}
          onUploadComplete={onFileUploadComplete}
          maxSize={maxSize}
        />
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* 数据集选择器 */}
      {!selectedDataset && renderDatasetSelection()}
      
      {/* 数据集信息展示 */}
      {selectedDataset && renderDatasetInformation()}
      
      {/* 成果类型选择 */}
      {selectedDataset && (
        <div className="space-y-2">
          <Label htmlFor="outputType">成果类型 *</Label>
          <Select
            value={formData.type}
            onValueChange={handleTypeChange}
            disabled={disableTypeSelect}
          >
            <SelectTrigger>
              <SelectValue placeholder="请选择成果类型" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PROJECT">{getOutputTypeDisplayName("PROJECT")}</SelectItem>
              <SelectItem value="PAPER">{getOutputTypeDisplayName("PAPER")}</SelectItem>
              <SelectItem value="PUBLICATION">{getOutputTypeDisplayName("PUBLICATION")}</SelectItem>
              <SelectItem value="INVENTION_PATENT">{getOutputTypeDisplayName("INVENTION_PATENT")}</SelectItem>
              <SelectItem value="UTILITY_PATENT">{getOutputTypeDisplayName("UTILITY_PATENT")}</SelectItem>
              <SelectItem value="SOFTWARE_COPYRIGHT">{getOutputTypeDisplayName("SOFTWARE_COPYRIGHT")}</SelectItem>
              <SelectItem value="OTHER_AWARD">{getOutputTypeDisplayName("OTHER_AWARD")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
      
      {/* 根据类型显示相应字段 */}
      {formData.type && (
        <>
          {renderPubMedSection()}
          {renderTitleField()}
          {renderTypeSpecificFields()}
          {renderAbstractField()}
          {renderUrlField()}
          {renderFileUploadSection()}
        </>
      )}
    </div>
  );
};

export default ResearchOutputForm;