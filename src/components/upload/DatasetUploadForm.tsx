import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Upload, File, X, Plus, Loader2, Search } from 'lucide-react';
import { toast } from 'sonner';
import { BaselineDatasetSelector } from './BaselineDatasetSelector';
import { datasetApi } from '@/integrations/api/datasetApi';
import { fileApi, FileInfo } from '@/integrations/api/fileApi';
import { institutionApi } from '@/integrations/api/institutionApi';
import FileUploader, { FileUploaderHandles } from './FileUploader';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface DatasetUploadFormProps {
  onSuccess?: () => void;
}

export function DatasetUploadForm({ onSuccess }: DatasetUploadFormProps) {
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    titleCn: '',
    description: '',
    type: '',
    category: '',
    principalInvestigator: '',
    datasetLeader: '',
    dataCollectionUnit: '',
    contactPerson: '',
    contactInfo: '',
    samplingMethod: '',
    startDate: '',
    endDate: '',
    keywords: [] as string[],
    shareAllData: false,
    demographicFields: [] as Array<{name: string, label: string, type: string}>,
    outcomeFields: [] as Array<{name: string, label: string, type: string}>,
    isFollowup: false,
    parentDatasetId: '',
    subjectAreaId: '',
    versionNumber: '',
    versionDescription: '',
    applicationInstitutionIds: [] as string[],
    noInstitutionRestriction: true, // 新增字段，控制是否限制机构
  });
  const [newKeyword, setNewKeyword] = useState('');
  const [agreements, setAgreements] = useState({
    dataSharing: false,
    ethics: false,
    ownership: false,
    privacy: false,
  });
  const [researchSubjects, setResearchSubjects] = useState<Array<{id: string, name: string}>>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);

  // 机构搜索相关状态
  const [openInstitutionSelector, setOpenInstitutionSelector] = useState(false);
  const [institutionSearchTerm, setInstitutionSearchTerm] = useState("");
  const [institutionSearchResults, setInstitutionSearchResults] = useState<Array<{id: string, fullName: string}>>([]);
  const [institutionSearchLoading, setInstitutionSearchLoading] = useState(false);

  // 文件上传引用
  const dataFileRef = useRef<FileUploaderHandles>(null);
  const dictFileRef = useRef<FileUploaderHandles>(null);
  const termsFileRef = useRef<FileUploaderHandles>(null);
  const sharingFileRef = useRef<FileUploaderHandles>(null);

  // 上传的文件信息
  const [dataFileInfo, setDataFileInfo] = useState<FileInfo | null>(null);
  const [dictFileInfo, setDictFileInfo] = useState<FileInfo | null>(null);
  const [termsFileInfo, setTermsFileInfo] = useState<FileInfo | null>(null);
  const [sharingFileInfo, setSharingFileInfo] = useState<FileInfo | null>(null);

  // 加载研究学科领域
  const loadResearchSubjects = async () => {
    if (researchSubjects.length > 0) return;

    setLoadingSubjects(true);
    try {
      const apiResponse = await datasetApi.getResearchSubjects();
      const subjects = apiResponse.data;
      setResearchSubjects(subjects.map(s => ({ id: s.id, name: s.name })));
    } catch (error) {
      console.error('获取研究学科领域失败:', error);
      toast.error('获取研究学科领域失败');
    } finally {
      setLoadingSubjects(false);
    }
  };

  // 搜索机构
  useEffect(() => {
    if (institutionSearchTerm.trim() === '') {
      setInstitutionSearchResults([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setInstitutionSearchLoading(true);
      try {
        const response = await institutionApi.searchInstitutions(institutionSearchTerm);
        setInstitutionSearchResults(response.data.content.map(i => ({ id: i.id, fullName: i.fullName })));
      } catch (error) {
        console.error('搜索机构失败:', error);
        toast.error('搜索机构失败');
      } finally {
        setInstitutionSearchLoading(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [institutionSearchTerm]);

  // 切换机构选择
  const toggleInstitutionSelection = (institutionId: string) => {
    setFormData(prev => {
      const isSelected = prev.applicationInstitutionIds.includes(institutionId);
      if (isSelected) {
        return {
          ...prev,
          applicationInstitutionIds: prev.applicationInstitutionIds.filter(id => id !== institutionId)
        };
      } else {
        return {
          ...prev,
          applicationInstitutionIds: [...prev.applicationInstitutionIds, institutionId]
        };
      }
    });
  };

  // 检查机构是否已选择
  const isInstitutionSelected = (institutionId: string) => {
    return formData.applicationInstitutionIds.includes(institutionId);
  };

  // 全选协议条款
  const toggleAllAgreements = (checked: boolean) => {
    setAgreements({
      dataSharing: checked,
      ethics: checked,
      ownership: checked,
      privacy: checked,
    });
  };

  // 检查是否所有协议都已选中
  const areAllAgreementsSelected = Object.values(agreements).every(Boolean);

  const addKeyword = () => {
    if (newKeyword.trim() && !formData.keywords.includes(newKeyword.trim())) {
      setFormData(prev => ({
        ...prev,
        keywords: [...prev.keywords, newKeyword.trim()]
      }));
      setNewKeyword('');
    }
  };

  const removeKeyword = (keyword: string) => {
    setFormData(prev => ({
      ...prev,
      keywords: prev.keywords.filter(k => k !== keyword)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 检查必要字段是否已填写
    if (!formData.startDate) {
      toast.error('请填写采集开始时间');
      return;
    }

    if (!formData.endDate) {
      toast.error('请填写采集结束时间');
      return;
    }

    if (!formData.subjectAreaId) {
      toast.error('请选择学科领域');
      return;
    }

    // 检查必要文件是否已上传
    if (!dataFileInfo) {
      toast.error('请上传数据文件');
      return;
    }

    if (!dictFileInfo) {
      toast.error('请上传数据字典文件');
      return;
    }

    if (!termsFileInfo) {
      toast.error('请上传数据使用协议');
      return;
    }

    if (!sharingFileInfo) {
      toast.error('请上传数据分享文件');
      return;
    }

    // 检查是否同意所有协议
    const allAgreementsAccepted = Object.values(agreements).every(Boolean);
    if (!allAgreementsAccepted) {
      toast.error('请阅读并同意所有条款和协议');
      return;
    }

    setUploading(true);

    try {
      // 获取学科领域名称作为category
      const subjectArea = researchSubjects.find(s => s.id === formData.subjectAreaId);

      // 创建数据集
      const datasetData = {
        titleCn: formData.titleCn,
        description: formData.description,
        type: formData.type,
        datasetLeader: formData.datasetLeader,
        principalInvestigator: formData.principalInvestigator || null,
        dataCollectionUnit: formData.dataCollectionUnit,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString(),
        keywords: formData.keywords.length > 0 ? formData.keywords : null,
        subjectAreaId: formData.subjectAreaId,
        category: subjectArea?.name || null,
        samplingMethod: formData.samplingMethod || null,
        published: true,
        shareAllData: true,
        contactPerson: formData.contactPerson,
        contactInfo: formData.contactInfo,
        demographicFields: null,
        outcomeFields: null,
        parentDatasetId: formData.isFollowup && formData.parentDatasetId ? formData.parentDatasetId : null,
        applicationInstitutionIds: formData.noInstitutionRestriction ? null : (formData.applicationInstitutionIds.length > 0 ? formData.applicationInstitutionIds : []),
        versionNumber: formData.versionNumber,
        versionDescription: formData.versionDescription,
        fileRecordId: dataFileInfo.id,
        dataDictRecordId: dictFileInfo.id,
        termsAgreementRecordId: termsFileInfo.id,
        dataSharingRecordId: sharingFileInfo.id,
        recordCount: 0,
        variableCount: 0
      };

      const response = await datasetApi.createDataset(datasetData)

      if (response.success) {
        toast.success('数据集创建成功');

        // 重置表单
        setFormData({
          titleCn: '',
          description: '',
          type: '',
          category: '',
          principalInvestigator: '',
          datasetLeader: '',
          dataCollectionUnit: '',
          contactPerson: '',
          contactInfo: '',
          samplingMethod: '',
          startDate: '',
          endDate: '',
          keywords: [],
          shareAllData: false,
          demographicFields: [],
          outcomeFields: [],
          isFollowup: false,
          parentDatasetId: '',
          subjectAreaId: '',
          versionNumber: '',
          versionDescription: '',
          applicationInstitutionIds: [],
          noInstitutionRestriction: true,
        });

        // 重置文件上传组件
        dataFileRef.current?.handleReset(false);
        dictFileRef.current?.handleReset(false);
        termsFileRef.current?.handleReset(false);
        sharingFileRef.current?.handleReset(false);

        // 重置文件信息
        setDataFileInfo(null);
        setDictFileInfo(null);
        setTermsFileInfo(null);
        setSharingFileInfo(null);

        setAgreements({
          dataSharing: false,
          ethics: false,
          ownership: false,
          privacy: false,
        });

        onSuccess?.();
      } else {
        throw new Error(response.message || '创建数据集失败');
      }
    } catch (error: any) {
      console.error('创建数据集失败:', error);
      toast.error('创建数据集失败: ' + (error.response?.data?.message || error.message || '未知错误'));
    } finally {
      setUploading(false);
    }
  };

  return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            上传数据集
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 基本信息 - 优化为两列布局 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">基本信息</h3>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">数据集标题 *</Label>
                    <Input
                        id="title"
                        value={formData.titleCn}
                        onChange={(e) => setFormData(prev => ({ ...prev, titleCn: e.target.value }))}
                        placeholder="请输入数据集标题"
                        required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="type">研究类型 *</Label>
                    <Select value={formData.type} onValueChange={(value) =>
                        setFormData(prev => ({ ...prev, type: value }))
                    }>
                      <SelectTrigger>
                        <SelectValue placeholder="选择研究类型" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="COHORT">队列研究</SelectItem>
                        <SelectItem value="CASE_CONTROL">病例对照研究</SelectItem>
                        <SelectItem value="CROSS_SECTIONAL">横断面研究</SelectItem>
                        <SelectItem value="RCT">随机对照试验</SelectItem>
                        <SelectItem value="REGISTRY">登记研究</SelectItem>
                        <SelectItem value="BIOBANK">生物样本库</SelectItem>
                        <SelectItem value="OMICS">组学数据</SelectItem>
                        <SelectItem value="WEARABLE">可穿戴设备</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="datasetLeader">数据集负责人 *</Label>
                    <Input
                        id="datasetLeader"
                        value={formData.datasetLeader}
                        onChange={(e) => setFormData(prev => ({ ...prev, datasetLeader: e.target.value }))}
                        placeholder="数据集负责人姓名"
                        required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contactPerson">联系人 *</Label>
                    <Input
                        id="contactPerson"
                        value={formData.contactPerson}
                        onChange={(e) => setFormData(prev => ({ ...prev, contactPerson: e.target.value }))}
                        placeholder="联系人姓名"
                        required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="startDate">开始日期 *</Label>
                      <Input
                          id="startDate"
                          type="date"
                          value={formData.startDate}
                          onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                          required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="endDate">结束日期 *</Label>
                      <Input
                          id="endDate"
                          type="date"
                          value={formData.endDate}
                          onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                          required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="versionNumber">版本号 *</Label>
                    <Input
                        id="versionNumber"
                        value={formData.versionNumber}
                        onChange={(e) => setFormData(prev => ({ ...prev, versionNumber: e.target.value }))}
                        placeholder="如：1.0"
                        required
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="description">数据集描述 *</Label>
                    <Textarea
                        id="description"
                        rows={4}
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="详细描述数据集内容、采集方法、质量控制等"
                        required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subjectAreaId">学科领域 *</Label>
                    <Select
                        value={formData.subjectAreaId}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, subjectAreaId: value }))}
                        onOpenChange={(open) => open && loadResearchSubjects()}
                        required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="选择学科领域" />
                      </SelectTrigger>
                      <SelectContent>
                        {loadingSubjects ? (
                            <div className="flex items-center justify-center p-2">
                              <Loader2 className="h-4 w-4 animate-spin" />
                            </div>
                        ) : (
                            researchSubjects.map(subject => (
                                <SelectItem key={subject.id} value={subject.id}>
                                  {subject.name}
                                </SelectItem>
                            ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dataCollectionUnit">数据采集单位 *</Label>
                    <Input
                        id="dataCollectionUnit"
                        value={formData.dataCollectionUnit}
                        onChange={(e) => setFormData(prev => ({ ...prev, dataCollectionUnit: e.target.value }))}
                        placeholder="如：某某医院"
                        required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contactInfo">联系方式 *</Label>
                    <Input
                        id="contactInfo"
                        value={formData.contactInfo}
                        onChange={(e) => setFormData(prev => ({ ...prev, contactInfo: e.target.value }))}
                        placeholder="电话或邮箱"
                        required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="samplingMethod">抽样方法</Label>
                    <Input
                        id="samplingMethod"
                        value={formData.samplingMethod}
                        onChange={(e) => setFormData(prev => ({ ...prev, samplingMethod: e.target.value }))}
                        placeholder="如：随机抽样、分层抽样等"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="versionDescription">版本描述 *</Label>
                    <Input
                        id="versionDescription"
                        value={formData.versionDescription}
                        onChange={(e) => setFormData(prev => ({ ...prev, versionDescription: e.target.value }))}
                        placeholder="如：初始版本"
                        required
                    />
                  </div>
                </div>
              </div>

              {/* 基线/随访部分 */}
              <div className="space-y-4 p-4 border rounded-lg bg-blue-50/50">
                <div className="flex items-center space-x-3">
                  <Checkbox
                      id="isFollowup"
                      checked={formData.isFollowup}
                      onCheckedChange={(checked) => {
                        setFormData(prev => ({
                          ...prev,
                          isFollowup: checked as boolean,
                          parentDatasetId: checked ? prev.parentDatasetId : ''
                        }));
                      }}
                  />
                  <div>
                    <Label htmlFor="isFollowup" className="text-sm font-medium">
                      这是随访数据集
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      如果此数据集是某个基线数据集的随访数据，请勾选此项并选择对应的基线数据集
                    </p>
                  </div>
                </div>

                {formData.isFollowup && (
                    <BaselineDatasetSelector
                        value={formData.parentDatasetId}
                        onChange={(value) => setFormData(prev => ({ ...prev, parentDatasetId: value }))}
                    />
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="principalInvestigator">首席研究员（PI）</Label>
                <Input
                    id="principalInvestigator"
                    value={formData.principalInvestigator}
                    onChange={(e) => setFormData(prev => ({ ...prev, principalInvestigator: e.target.value }))}
                    placeholder="请输入首席研究员姓名"
                />
              </div>
            </div>

            {/* 开放申请机构设置 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">开放申请机构</h3>

              <div className="flex items-center space-x-2 pt-2">
                <Checkbox
                    id="noInstitutionRestriction"
                    checked={formData.noInstitutionRestriction}
                    onCheckedChange={(checked) => {
                      setFormData(prev => ({
                        ...prev,
                        noInstitutionRestriction: checked as boolean,
                        applicationInstitutionIds: checked ? [] : prev.applicationInstitutionIds
                      }));
                    }}
                />
                <Label htmlFor="noInstitutionRestriction" className="text-sm font-medium">
                  不限制申请机构（任何机构均可申请）
                </Label>
              </div>

              {!formData.noInstitutionRestriction && (
                  <div className="space-y-2">
                    <Label>可申请此数据集的机构</Label>
                    <Popover open={openInstitutionSelector} onOpenChange={setOpenInstitutionSelector}>
                      <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={openInstitutionSelector}
                            className="w-full justify-between"
                        >
                          {formData.applicationInstitutionIds.length > 0
                              ? `${formData.applicationInstitutionIds.length} 个机构已选择`
                              : "选择机构（可多选）"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                        <Command shouldFilter={false}>
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <CommandInput
                                placeholder="搜索机构..."
                                value={institutionSearchTerm}
                                onValueChange={setInstitutionSearchTerm}
                                className="pl-10"
                            />
                          </div>
                          <CommandList>
                            <CommandEmpty>
                              {institutionSearchLoading ? "搜索中..." : "未找到相关机构"}
                            </CommandEmpty>
                            <CommandGroup>
                              {institutionSearchResults.map((institution) => (
                                  <CommandItem
                                      key={institution.id}
                                      value={institution.id}
                                      onSelect={() => toggleInstitutionSelection(institution.id)}
                                  >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            isInstitutionSelected(institution.id) ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    {institution.fullName}
                                  </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>

                    {formData.applicationInstitutionIds.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-2">
                          {formData.applicationInstitutionIds.map((institutionId) => {
                            const institution = institutionSearchResults.find(i => i.id === institutionId) ||
                                { fullName: "未知机构" };
                            return (
                                <Badge key={institutionId} variant="secondary" className="gap-1 text-sm">
                                  {institution.fullName}
                                  <X
                                      className="h-3 w-3 cursor-pointer"
                                      onClick={() => toggleInstitutionSelection(institutionId)}
                                  />
                                </Badge>
                            );
                          })}
                        </div>
                    )}
                  </div>
              )}
            </div>

            {/* 关键词 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">关键词</h3>

              <div className="flex gap-2">
                <Input
                    value={newKeyword}
                    onChange={(e) => setNewKeyword(e.target.value)}
                    placeholder="添加关键词"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
                />
                <Button type="button" onClick={addKeyword} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {formData.keywords.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.keywords.map((keyword) => (
                        <Badge key={keyword} variant="secondary" className="gap-1 text-sm">
                          {keyword}
                          <X
                              className="h-3 w-3 cursor-pointer"
                              onClick={() => removeKeyword(keyword)}
                          />
                        </Badge>
                    ))}
                  </div>
              )}
            </div>

            {/* 文件上传 - 优化为两列布局 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">文件上传</h3>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="dataFile">完整数据集文件 *</Label>
                    <FileUploader
                        ref={dataFileRef}
                        onUploadComplete={setDataFileInfo}
                        maxSize={10 * 1024 * 1024 * 1024} // 10GB
                    />
                    {dataFileInfo && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <File className="h-4 w-4" />
                          {dataFileInfo.fileName} ({(dataFileInfo.fileSize / 1024 / 1024).toFixed(2)} MB)
                        </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sharingFile">数据分享文件（用户申请后可下载） *</Label>
                    <FileUploader
                        ref={sharingFileRef}
                        onUploadComplete={setSharingFileInfo}
                    />
                    {sharingFileInfo && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <File className="h-4 w-4" />
                          {sharingFileInfo.fileName} ({(sharingFileInfo.fileSize / 1024 / 1024).toFixed(2)} MB)
                        </div>
                    )}
                    <p className="text-xs text-muted-foreground">
                      请上传数据分享文件
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="dictFile">数据字典文件 *</Label>
                    <FileUploader
                        ref={dictFileRef}
                        onUploadComplete={setDictFileInfo}
                    />
                    {dictFileInfo && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <File className="h-4 w-4" />
                          {dictFileInfo.fileName} ({(dictFileInfo.fileSize / 1024 / 1024).toFixed(2)} MB)
                        </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="termsFile">数据使用协议 *</Label>
                    <FileUploader
                        ref={termsFileRef}
                        onUploadComplete={setTermsFileInfo}
                    />
                    {termsFileInfo && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <File className="h-4 w-4" />
                          {termsFileInfo.fileName} ({(termsFileInfo.fileSize / 1024 / 1024).toFixed(2)} MB)
                        </div>
                    )}
                    <p className="text-xs text-muted-foreground">
                      请上传数据集所属单位制定的数据使用协议（PDF或Word格式）
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 协议与条款 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">协议与条款</h3>
              <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                {/* 全选选项 */}
                <div className="flex items-start space-x-3 pb-3 border-b">
                  <Checkbox
                      id="selectAll"
                      checked={areAllAgreementsSelected}
                      onCheckedChange={(checked) => toggleAllAgreements(checked as boolean)}
                  />
                  <Label htmlFor="selectAll" className="text-sm font-medium leading-5">
                    全选（同意以下所有协议与条款）
                  </Label>
                </div>

                <div className="flex items-start space-x-3">
                  <Checkbox
                      id="dataSharing"
                      checked={agreements.dataSharing}
                      onCheckedChange={(checked) =>
                          setAgreements(prev => ({ ...prev, dataSharing: checked as boolean }))
                      }
                  />
                  <Label htmlFor="dataSharing" className="text-sm leading-5">
                    我同意《数据共享协议》，理解数据将用于科学研究目的，并遵守相关的数据使用规范。
                  </Label>
                </div>

                <div className="flex items-start space-x-3">
                  <Checkbox
                      id="ethics"
                      checked={agreements.ethics}
                      onCheckedChange={(checked) =>
                          setAgreements(prev => ({ ...prev, ethics: checked as boolean }))
                      }
                  />
                  <Label htmlFor="ethics" className="text-sm leading-5">
                    我确认所提交的数据已通过伦理委员会审批，并且符合相关法律法规要求。
                  </Label>
                </div>

                <div className="flex items-start space-x-3">
                  <Checkbox
                      id="ownership"
                      checked={agreements.ownership}
                      onCheckedChange={(checked) =>
                          setAgreements(prev => ({ ...prev, ownership: checked as boolean }))
                      }
                  />
                  <Label htmlFor="ownership" className="text-sm leading-5">
                    我确认拥有此数据的合法使用权，有权限将其用于科学研究合作。
                  </Label>
                </div>

                <div className="flex items-start space-x-3">
                  <Checkbox
                      id="privacy"
                      checked={agreements.privacy}
                      onCheckedChange={(checked) =>
                          setAgreements(prev => ({ ...prev, privacy: checked as boolean }))
                      }
                  />
                  <Label htmlFor="privacy" className="text-sm leading-5">
                    我确认已对数据进行适当的去标识化处理，保护了受试者的隐私权益。
                  </Label>
                </div>

                <p className="text-xs text-muted-foreground mt-4">
                  * 提交数据即表示您同意平台的服务条款和隐私政策。所有数据将经过严格审核后方可共享。
                </p>
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                  type="submit"
                  disabled={uploading || !Object.values(agreements).every(Boolean)}
                  className="w-full sm:w-auto"
              >
                {uploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      上传中...
                    </>
                ) : (
                    '提交审核'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
  );
}