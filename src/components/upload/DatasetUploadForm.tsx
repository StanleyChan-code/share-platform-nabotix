import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Checkbox } from "@/components/ui/checkbox.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Upload, Loader2, Plus, X, FileText, Info, Asterisk, Building, User, Mail, Phone, Calendar, Tag, Shield, File, CheckCircle, AlertCircle } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import FileUploader, { FileUploaderHandles } from "@/components/fileuploader/FileUploader.tsx";
import { formatFileSize } from "@/lib/utils.ts";
import { BaselineDatasetSelector } from "@/components/upload/BaselineDatasetSelector.tsx";
import { InstitutionSelector } from "@/components/dataset/InstitutionSelector";
import { AdminInstitutionSelector } from "@/components/admin/institution/AdminInstitutionSelector.tsx";
import { datasetApi } from "@/integrations/api/datasetApi.ts";
import { institutionApi } from "@/integrations/api/institutionApi.ts";
import { getCurrentUserRoles } from "@/lib/authUtils";
import { PermissionRoles } from "@/lib/permissionUtils";
import { FileInfo } from "@/integrations/api/fileApi";
import { toast } from "sonner";
import { useDebounce } from "@/hooks/useDebounce";
import { FormValidator, InputWrapper } from "@/components/ui/FormValidator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DatasetUploadFormProps {
  onSuccess?: () => void;
}

interface ResearchSubject {
  id: string;
  name: string;
}

interface Institution {
  id: string;
  fullName: string;
}

export function DatasetUploadForm({ onSuccess }: DatasetUploadFormProps) {
  const [uploading, setUploading] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
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
    noInstitutionRestriction: true,
    institutionId: ''
  });

  const [newKeyword, setNewKeyword] = useState('');
  const [agreements, setAgreements] = useState({
    dataSharing: false,
    ethics: false,
    ownership: false,
    privacy: false,
  });

  const [researchSubjects, setResearchSubjects] = useState<ResearchSubject[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [dateError, setDateError] = useState<string>('');

  // 机构搜索相关状态
  const [institutionSearchTerm, setInstitutionSearchTerm] = useState("");
  const [institutionSearchResults, setInstitutionSearchResults] = useState<Institution[]>([]);
  const [institutionSearchLoading, setInstitutionSearchLoading] = useState(false);

  const debouncedInstitutionSearchTerm = useDebounce(institutionSearchTerm, 550);

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

  // 检查表单是否有内容
  const hasFormData = () => {
    return (
        formData.titleCn.trim() !== '' ||
        formData.description.trim() !== '' ||
        formData.type !== '' ||
        formData.principalInvestigator.trim() !== '' ||
        formData.datasetLeader.trim() !== '' ||
        formData.dataCollectionUnit.trim() !== '' ||
        formData.contactPerson.trim() !== '' ||
        formData.contactInfo.trim() !== '' ||
        formData.samplingMethod.trim() !== '' ||
        formData.startDate !== '' ||
        formData.endDate !== '' ||
        formData.keywords.length > 0 ||
        formData.subjectAreaId !== '' ||
        formData.versionNumber.trim() !== '' ||
        formData.versionDescription.trim() !== '' ||
        formData.applicationInstitutionIds.length > 0 ||
        formData.institutionId !== '' ||
        dataFileInfo !== null ||
        dictFileInfo !== null ||
        termsFileInfo !== null ||
        sharingFileInfo !== null ||
        Object.values(agreements).some(Boolean)
    );
  };

  // 检查用户权限
  useEffect(() => {
    const roles = getCurrentUserRoles();
    setUserRoles(roles);
  }, []);

  // 检查是否为平台管理员
  const isPlatformAdmin = useCallback(() => {
    return userRoles.includes(PermissionRoles.PLATFORM_ADMIN);
  }, [userRoles]);

  // 验证日期
  const validateDates = useCallback(() => {
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);

      if (start > end) {
        setDateError('开始日期不能晚于结束日期');
        return false;
      } else {
        setDateError('');
        return true;
      }
    }
    setDateError('');
    return true;
  }, [formData.startDate, formData.endDate]);

  useEffect(() => {
    validateDates();
  }, [formData.startDate, formData.endDate, validateDates]);

  // 加载研究学科领域
  const loadResearchSubjects = async () => {
    if (researchSubjects.length > 0) return;

    setLoadingSubjects(true);
    try {
      const apiResponse = await datasetApi.getResearchSubjects();
      const subjects = apiResponse.data;
      setResearchSubjects(subjects.map((s: any) => ({ id: s.id, name: s.name })));
    } catch (error) {
      console.error('获取研究学科领域失败:', error);
      toast.error('获取研究学科领域失败');
    } finally {
      setLoadingSubjects(false);
    }
  };

  // 搜索机构
  useEffect(() => {
    if (debouncedInstitutionSearchTerm.trim() === '') {
      setInstitutionSearchResults([]);
      return;
    }

    const searchInstitutions = async () => {
      setInstitutionSearchLoading(true);
      try {
        const response = await institutionApi.searchInstitutions(debouncedInstitutionSearchTerm);
        setInstitutionSearchResults(response.data.content.map((i: any) => ({
          id: i.id,
          fullName: i.fullName
        })));
      } catch (error) {
        console.error('搜索机构失败:', error);
        toast.error('搜索机构失败');
      } finally {
        setInstitutionSearchLoading(false);
      }
    };

    searchInstitutions();
  }, [debouncedInstitutionSearchTerm]);

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

  // 文件上传完成回调
  const handleDataFileUpload = (fileInfo: FileInfo) => {
    setDataFileInfo(fileInfo);
  };

  const handleDictFileUpload = (fileInfo: FileInfo) => {
    setDictFileInfo(fileInfo);
  };

  const handleTermsFileUpload = (fileInfo: FileInfo) => {
    setTermsFileInfo(fileInfo);
  };

  const handleSharingFileUpload = (fileInfo: FileInfo) => {
    setSharingFileInfo(fileInfo);
  };

  // 文件重置回调
  const handleDataFileReset = () => {
    setDataFileInfo(null);
  };

  const handleDictFileReset = () => {
    setDictFileInfo(null);
  };

  const handleTermsFileReset = () => {
    setTermsFileInfo(null);
  };

  const handleSharingFileReset = () => {
    setSharingFileInfo(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 基本验证
    if (!formData.titleCn.trim()) {
      toast.error('请填写数据集标题');
      return;
    }

    if (!formData.description.trim()) {
      toast.error('请填写数据集描述');
      return;
    }

    if (!formData.type) {
      toast.error('请选择研究类型');
      return;
    }

    if (!formData.principalInvestigator.trim()) {
      toast.error('请填写首席研究员（PI）');
      return;
    }

    if (!formData.datasetLeader.trim()) {
      toast.error('请填写数据集负责人');
      return;
    }

    if (!formData.dataCollectionUnit.trim()) {
      toast.error('请填写数据采集单位');
      return;
    }

    if (!formData.contactPerson.trim()) {
      toast.error('请填写联系人');
      return;
    }

    if (!formData.contactInfo.trim()) {
      toast.error('请填写联系方式');
      return;
    }

    if (!formData.samplingMethod.trim()) {
      toast.error('请填写抽样方法');
      return;
    }

    if (!formData.startDate) {
      toast.error('请填写采集开始时间');
      return;
    }

    if (!formData.endDate) {
      toast.error('请填写采集结束时间');
      return;
    }

    // 日期验证
    if (!validateDates()) {
      toast.error('请检查日期设置');
      return;
    }

    if (!formData.subjectAreaId) {
      toast.error('请选择学科领域');
      return;
    }

    if (!formData.versionNumber.trim()) {
      toast.error('请填写版本号');
      return;
    }

    if (!formData.versionDescription.trim()) {
      toast.error('请填写版本描述');
      return;
    }

    // 平台管理员验证
    if (isPlatformAdmin() && !formData.institutionId) {
      toast.error('请选择数据集所属机构');
      return;
    }

    // 随访数据集验证
    if (formData.isFollowup && !formData.parentDatasetId) {
      toast.error('请选择基线数据集');
      return;
    }

    // 机构限制验证
    if (!formData.noInstitutionRestriction && formData.applicationInstitutionIds.length === 0) {
      toast.error('请至少选择一个开放申请机构');
      return;
    }

    // 关键词验证
    if (formData.keywords.length === 0) {
      toast.error('请至少添加一个关键词');
      return;
    }

    // 文件验证
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

    // 协议验证
    if (!areAllAgreementsSelected) {
      toast.error('请阅读并同意所有条款和协议');
      return;
    }

    setUploading(true);

    try {
      const subjectArea = researchSubjects.find(s => s.id === formData.subjectAreaId);

      const datasetData = {
        titleCn: formData.titleCn.trim(),
        description: formData.description.trim(),
        type: formData.type,
        datasetLeader: formData.datasetLeader.trim(),
        principalInvestigator: formData.principalInvestigator.trim(),
        dataCollectionUnit: formData.dataCollectionUnit.trim(),
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString(),
        keywords: formData.keywords.length > 0 ? formData.keywords : null,
        subjectAreaId: formData.subjectAreaId,
        category: subjectArea?.name || null,
        samplingMethod: formData.samplingMethod.trim(),
        published: true,
        shareAllData: true,
        contactPerson: formData.contactPerson.trim(),
        contactInfo: formData.contactInfo.trim(),
        demographicFields: null,
        outcomeFields: null,
        parentDatasetId: formData.isFollowup && formData.parentDatasetId ? formData.parentDatasetId : null,
        applicationInstitutionIds: formData.noInstitutionRestriction ? null : formData.applicationInstitutionIds,
        versionNumber: formData.versionNumber.trim(),
        versionDescription: formData.versionDescription.trim(),
        fileRecordId: dataFileInfo.id,
        dataDictRecordId: dictFileInfo.id,
        termsAgreementRecordId: termsFileInfo.id,
        dataSharingRecordId: sharingFileInfo.id,
        recordCount: 0,
        variableCount: 0,
        ...(isPlatformAdmin() && formData.institutionId && { institutionId: formData.institutionId })
      };

      const response = await datasetApi.createDataset(datasetData);

      if (response.success) {
        toast.success("数据集创建成功", {
          description: "您的数据集已成功提交，正在等待审核。"
        });

        // 重置表单
        resetForm();
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

  const resetForm = () => {
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
      institutionId: ''
    });

    // 重置文件上传
    dataFileRef.current?.handleReset(false);
    dictFileRef.current?.handleReset(false);
    termsFileRef.current?.handleReset(false);
    sharingFileRef.current?.handleReset(false);

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

    setDateError('');
    setNewKeyword('');

    // 关闭确认对话框
    setShowResetConfirm(false);
  };

  const handleResetClick = () => {
    if (hasFormData()) {
      // 如果有表单数据，显示确认对话框
      setShowResetConfirm(true);
    } else {
      // 如果没有数据，直接重置
      resetForm();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
      <>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              上传数据集
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FormValidator onSubmit={handleSubmit} className="space-y-6" showAllErrorsOnSubmit={true}>
              {/* 基本信息 */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  基本信息
                </h3>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* 左列 */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="titleCn" className="flex items-center gap-1">
                        数据集标题 <Asterisk className="h-3 w-3 text-red-500" />
                      </Label>
                      <InputWrapper required validationType="custom">
                        <Input
                            id="titleCn"
                            name="titleCn"
                            value={formData.titleCn}
                            onChange={handleInputChange}
                            placeholder="请输入数据集标题"
                            maxLength={200}
                        />
                      </InputWrapper>
                      <p className="text-xs text-muted-foreground">请输入数据集的完整标题，最多200个字符</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="type" className="flex items-center gap-1">
                        研究类型 <Asterisk className="h-3 w-3 text-red-500" />
                      </Label>
                      <Select value={formData.type} onValueChange={(value) => handleSelectChange("type", value)}>
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
                      <p className="text-xs text-muted-foreground">选择最适合您数据集的研究类型</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="principalInvestigator" className="flex items-center gap-1">
                        首席研究员（PI） <Asterisk className="h-3 w-3 text-red-500" />
                      </Label>
                      <InputWrapper required>
                        <Input
                            id="principalInvestigator"
                            name="principalInvestigator"
                            value={formData.principalInvestigator}
                            onChange={handleInputChange}
                            placeholder="请输入首席研究员姓名"
                            maxLength={100}
                        />
                      </InputWrapper>
                      <p className="text-xs text-muted-foreground">项目或研究的首席研究员姓名</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="datasetLeader" className="flex items-center gap-1">
                        数据集负责人 <Asterisk className="h-3 w-3 text-red-500" />
                      </Label>
                      <InputWrapper required>
                        <Input
                            id="datasetLeader"
                            name="datasetLeader"
                            value={formData.datasetLeader}
                            onChange={handleInputChange}
                            placeholder="数据集负责人姓名"
                            maxLength={100}
                        />
                      </InputWrapper>
                      <p className="text-xs text-muted-foreground">负责此数据集的主要人员姓名</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="contactPerson" className="flex items-center gap-1">
                        联系人 <Asterisk className="h-3 w-3 text-red-500" />
                      </Label>
                      <InputWrapper required>
                        <Input
                            id="contactPerson"
                            name="contactPerson"
                            value={formData.contactPerson}
                            onChange={handleInputChange}
                            placeholder="联系人姓名"
                            maxLength={100}
                        />
                      </InputWrapper>
                      <p className="text-xs text-muted-foreground">负责数据申请和咨询的联系人</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="startDate" className="flex items-center gap-1">
                        开始日期 <Asterisk className="h-3 w-3 text-red-500" />
                      </Label>
                      <Input
                          id="startDate"
                          name="startDate"
                          type="date"
                          value={formData.startDate}
                          onChange={handleInputChange}
                          required
                      />
                      {dateError && (
                          <p className="text-xs text-red-500 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {dateError}
                          </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="versionNumber" className="flex items-center gap-1">
                        版本号 <Asterisk className="h-3 w-3 text-red-500" />
                      </Label>
                      <InputWrapper required>
                        <Input
                            id="versionNumber"
                            name="versionNumber"
                            value={formData.versionNumber}
                            onChange={handleInputChange}
                            placeholder="如：1.0"
                            maxLength={50}
                        />
                      </InputWrapper>
                      <p className="text-xs text-muted-foreground">数据集的版本标识，如1.0、2.1等</p>
                    </div>
                  </div>

                  {/* 右列 */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="description" className="flex items-center gap-1">
                        数据集描述 <Asterisk className="h-3 w-3 text-red-500" />
                      </Label>
                      <InputWrapper required>
                        <Textarea
                            id="description"
                            name="description"
                            rows={4}
                            value={formData.description}
                            onChange={handleInputChange}
                            placeholder="详细描述数据集内容、采集方法、质量控制等"
                            maxLength={2000}
                        />
                      </InputWrapper>
                      <p className="text-xs text-muted-foreground">详细描述数据集的内容、用途、采集方法等信息，最多2000字符</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="subjectAreaId" className="flex items-center gap-1">
                        学科领域 <Asterisk className="h-3 w-3 text-red-500" />
                      </Label>
                      <Select
                          value={formData.subjectAreaId}
                          onValueChange={(value) => handleSelectChange("subjectAreaId", value)}
                          onOpenChange={(open) => open && loadResearchSubjects()}
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
                      <p className="text-xs text-muted-foreground">选择数据集所属的主要学科领域</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="dataCollectionUnit" className="flex items-center gap-1">
                        数据采集单位 <Asterisk className="h-3 w-3 text-red-500" />
                      </Label>
                      <InputWrapper required>
                        <Input
                            id="dataCollectionUnit"
                            name="dataCollectionUnit"
                            value={formData.dataCollectionUnit}
                            onChange={handleInputChange}
                            placeholder="如：某某医院"
                            maxLength={200}
                        />
                      </InputWrapper>
                      <p className="text-xs text-muted-foreground">负责数据采集的具体单位名称</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="contactInfo" className="flex items-center gap-1">
                        联系方式 <Asterisk className="h-3 w-3 text-red-500" />
                      </Label>
                      <InputWrapper required validationType="custom">
                        <Input
                            id="contactInfo"
                            name="contactInfo"
                            value={formData.contactInfo}
                            onChange={handleInputChange}
                            placeholder="电话或邮箱"
                            maxLength={200}
                        />
                      </InputWrapper>
                      <p className="text-xs text-muted-foreground">联系人的电话或邮箱地址</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="samplingMethod" className="flex items-center gap-1">
                        抽样方法 <Asterisk className="h-3 w-3 text-red-500" />
                      </Label>
                      <InputWrapper required>
                        <Input
                            id="samplingMethod"
                            name="samplingMethod"
                            value={formData.samplingMethod}
                            onChange={handleInputChange}
                            placeholder="如：随机抽样、分层抽样等"
                            maxLength={200}
                        />
                      </InputWrapper>
                      <p className="text-xs text-muted-foreground">描述数据采集时使用的抽样方法</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="endDate" className="flex items-center gap-1">
                        结束日期 <Asterisk className="h-3 w-3 text-red-500" />
                      </Label>
                      <Input
                          id="endDate"
                          name="endDate"
                          type="date"
                          value={formData.endDate}
                          onChange={handleInputChange}
                          required
                      />
                      {dateError && (
                          <p className="text-xs text-red-500 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {dateError}
                          </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="versionDescription" className="flex items-center gap-1">
                        版本描述 <Asterisk className="h-3 w-3 text-red-500" />
                      </Label>
                      <InputWrapper required>
                        <Input
                            id="versionDescription"
                            name="versionDescription"
                            value={formData.versionDescription}
                            onChange={handleInputChange}
                            placeholder="如：初始版本"
                            maxLength={500}
                        />
                      </InputWrapper>
                      <p className="text-xs text-muted-foreground">简要描述此版本的主要更新内容</p>
                    </div>
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
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1">
                        基线数据集 <Asterisk className="h-3 w-3 text-red-500" />
                      </Label>
                      <BaselineDatasetSelector
                          value={formData.parentDatasetId}
                          onChange={(value) => setFormData(prev => ({ ...prev, parentDatasetId: value }))}
                      />
                      <p className="text-xs text-muted-foreground">选择此随访数据集对应的基线数据集</p>
                    </div>
                )}
              </div>

              {/* 机构选择 - 仅对平台管理员可见 */}
              {isPlatformAdmin() && (
                  <div className="space-y-4 p-4 border rounded-lg bg-purple-50/50">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      数据集所属机构
                    </h3>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1">
                        选择机构 <Asterisk className="h-3 w-3 text-red-500" />
                      </Label>
                      <AdminInstitutionSelector
                          value={formData.institutionId}
                          onChange={(value) => setFormData(prev => ({ ...prev, institutionId: value }))}
                      />
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Info className="h-3 w-3" />
                        作为平台管理员，您可以为数据集指定所属机构。
                      </p>
                    </div>
                  </div>
              )}

              {/* 开放申请机构设置 */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  开放申请机构
                </h3>
                <InstitutionSelector
                    value={formData.noInstitutionRestriction ? null : formData.applicationInstitutionIds}
                    onChange={(value) => {
                      if (value === null) {
                        setFormData(prev => ({
                          ...prev,
                          noInstitutionRestriction: true,
                          applicationInstitutionIds: []
                        }));
                      } else {
                        setFormData(prev => ({
                          ...prev,
                          noInstitutionRestriction: false,
                          applicationInstitutionIds: value
                        }));
                      }
                    }}
                />
                <p className="text-xs text-muted-foreground">
                  选择可以申请此数据集的机构。如果不限制机构，则所有机构都可以申请。
                </p>

                {!formData.noInstitutionRestriction && formData.applicationInstitutionIds.length === 0 && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      请至少选择一个开放申请机构
                    </p>
                )}
              </div>

              {/* 关键词 */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Tag className="h-5 w-5" />
                  关键词 <Asterisk className="h-3 w-3 text-red-500" />
                </h3>

                <div className="space-y-2">
                  <Label htmlFor="newKeyword">添加关键词</Label>
                  <div className="flex gap-2">
                    <Input
                        id="newKeyword"
                        value={newKeyword}
                        onChange={(e) => setNewKeyword(e.target.value)}
                        placeholder="输入关键词后按回车或点击添加"
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
                        maxLength={100}
                    />
                    <Button type="button" onClick={addKeyword} size="sm">
                      <Plus className="h-4 w-4" />
                      添加
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">输入关键词后按回车或点击添加按钮</p>
                </div>

                {formData.keywords.length > 0 ? (
                    <div className="space-y-2">
                      <Label>已添加的关键词 ({formData.keywords.length}个)</Label>
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
                    </div>
                ) : (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      请至少添加一个关键词
                    </p>
                )}
              </div>

              {/* 文件上传 */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <File className="h-5 w-5" />
                  文件上传
                </h3>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1">
                        完整数据集文件 <Asterisk className="h-3 w-3 text-red-500" />
                      </Label>
                      <FileUploader
                          ref={dataFileRef}
                          onUploadComplete={handleDataFileUpload}
                          onResetComplete={handleDataFileReset}
                          maxSize={10 * 1024 * 1024 * 1024}
                          acceptedFileTypes={['.csv', '.xlsx', '.xls']}
                      />
                      {dataFileInfo ? (
                          <div className="flex items-center gap-2 text-sm text-green-600">
                            <CheckCircle className="h-4 w-4" />
                            {dataFileInfo.fileName} ({formatFileSize(dataFileInfo.fileSize)})
                          </div>
                      ) : (
                          <p className="text-xs text-muted-foreground">
                            支持 CSV、Excel 格式，最大 10GB。包含完整的数据集内容。
                          </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-1">
                        数据分享文件 <Asterisk className="h-3 w-3 text-red-500" />
                      </Label>
                      <FileUploader
                          ref={sharingFileRef}
                          onUploadComplete={handleSharingFileUpload}
                          onResetComplete={handleSharingFileReset}
                          maxSize={500 * 1024 * 1024}
                          acceptedFileTypes={['.csv', '.xlsx', '.xls']}
                      />
                      {sharingFileInfo ? (
                          <div className="flex items-center gap-2 text-sm text-green-600">
                            <CheckCircle className="h-4 w-4" />
                            {sharingFileInfo.fileName} ({formatFileSize(sharingFileInfo.fileSize)})
                          </div>
                      ) : (
                          <p className="text-xs text-muted-foreground">
                            支持 CSV、Excel 格式，最大 500MB。用户申请后可下载的文件。
                          </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1">
                        数据字典文件 <Asterisk className="h-3 w-3 text-red-500" />
                      </Label>
                      <FileUploader
                          ref={dictFileRef}
                          onUploadComplete={handleDictFileUpload}
                          onResetComplete={handleDictFileReset}
                          maxSize={100 * 1024 * 1024}
                          acceptedFileTypes={['.csv', '.xlsx', '.xls']}
                      />
                      {dictFileInfo ? (
                          <div className="flex items-center gap-2 text-sm text-green-600">
                            <CheckCircle className="h-4 w-4" />
                            {dictFileInfo.fileName} ({formatFileSize(dictFileInfo.fileSize)})
                          </div>
                      ) : (
                          <p className="text-xs text-muted-foreground">
                            支持 CSV、Excel 格式，最大 100MB。描述数据字段含义和结构的文件。
                          </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-1">
                        数据使用协议 <Asterisk className="h-3 w-3 text-red-500" />
                      </Label>
                      <FileUploader
                          ref={termsFileRef}
                          onUploadComplete={handleTermsFileUpload}
                          onResetComplete={handleTermsFileReset}
                          maxSize={20 * 1024 * 1024}
                          acceptedFileTypes={['.pdf', '.doc', '.docx']}
                      />
                      {termsFileInfo ? (
                          <div className="flex items-center gap-2 text-sm text-green-600">
                            <CheckCircle className="h-4 w-4" />
                            {termsFileInfo.fileName} ({formatFileSize(termsFileInfo.fileSize)})
                          </div>
                      ) : (
                          <p className="text-xs text-muted-foreground">
                            支持 PDF、Word 格式，最大 20MB。数据使用的条款和协议文档。
                          </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* 协议与条款 */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  协议与条款
                </h3>

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

              <div className="flex justify-end gap-4 pt-6 border-t">
                <Button
                    type="button"
                    variant="outline"
                    onClick={handleResetClick}
                    disabled={uploading}
                >
                  重置
                </Button>
                <Button
                    type="submit"
                    disabled={uploading || !areAllAgreementsSelected}
                    className="min-w-32"
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
            </FormValidator>
          </CardContent>
        </Card>

        {/* 重置确认对话框 */}
        <AlertDialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>确认重置表单</AlertDialogTitle>
              <AlertDialogDescription>
                此操作将清除所有已填写的内容和已上传的文件，且无法恢复。您确定要重置表单吗？
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>取消</AlertDialogCancel>
              <AlertDialogAction onClick={resetForm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                确认重置
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
  );
}