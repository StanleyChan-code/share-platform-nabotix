import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Upload, AlertTriangle, Asterisk, ClockIcon, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { createApplication, CreateApplicationRequest, Application } from "@/integrations/api/applicationApi";
import { Dataset } from "@/integrations/api/datasetApi";
import { DatasetSelector } from "@/components/dataset/DatasetSelector.tsx";
import { DatasetTypes } from "@/lib/enums";
import { formatDate } from "@/lib/utils";
import FileUploader, { FileUploaderHandles } from "@/components/fileuploader/FileUploader.tsx";
import { FileInfo } from "@/integrations/api/fileApi";
import { ScrollArea } from "@radix-ui/react-scroll-area";
import { getCurrentUserInfo } from "@/lib/authUtils.ts";
import { FormValidator, InputWrapper } from "@/components/ui/FormValidator";
import { api } from "@/integrations/api/client";

interface ApplyDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    datasetId?: string;
}

const ApplyDialog = ({ open, onOpenChange, datasetId }: ApplyDialogProps) => {
    const [formData, setFormData] = useState({
        datasetId: datasetId || "",
        projectTitle: "",
        projectDescription: "",
        fundingSource: "",
        purpose: "",
        projectLeader: "",
        applicantRole: "",
        applicantType: "",
        agreeToTerms: false,
    });

    const [submitting, setSubmitting] = useState(false);
    const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);
    const [uploadedFile, setUploadedFile] = useState<FileInfo | null>(null);
    const [applicationStatus, setApplicationStatus] = useState<Application | null>(null);
    const [pendingApplication, setPendingApplication] = useState<Application | null>(null);
    const [loadingApplication, setLoadingApplication] = useState(false);
    const fileUploaderRef = useRef<FileUploaderHandles>(null);

    // 重置表单
    const resetForm = () => {
        setFormData({
            datasetId: datasetId || "",
            projectTitle: "",
            projectDescription: "",
            fundingSource: "",
            purpose: "",
            projectLeader: "",
            applicantRole: "",
            applicantType: "",
            agreeToTerms: false
        });
        setUploadedFile(null);
        setSelectedDataset(null);
        fileUploaderRef.current?.handleReset(false);
    };

    // 当对话框关闭时重置表单
    useEffect(() => {
        if (!open) {
            resetForm();
        }
    }, [open]);

    const handleDatasetSelect = async (dataset: Dataset) => {
        setSelectedDataset(dataset);
        setFormData(prev => ({ ...prev, datasetId: dataset.id }));
        
        // 检查用户对该数据集的申请状态
        await checkApplicationStatus(dataset.id);
    };
    
    // 检查用户对该数据集的申请状态
    const checkApplicationStatus = async (datasetId: string) => {
        if (!datasetId) return;
        
        setLoadingApplication(true);
        try {
            const response = await api.get<Application[]>(`/applications/by-dataset/${datasetId}`);
            if (response.data.success && response.data.data.length > 0) {
                // 获取最新的审核状态为APPROVED的申请记录
                const applications = response.data.data;
                const approvedApplication = applications.find(app => app.status === "APPROVED");
                
                // 检查是否有待审核的申请
                const pendingApplication = applications.find(app => 
                    app.status === "SUBMITTED" || 
                    app.status === "PENDING_PROVIDER_REVIEW" || 
                    app.status === "PENDING_INSTITUTION_REVIEW"
                );
                
                // 检查是否所有申请都被拒绝
                const allDenied = applications.every(app => app.status === "DENIED");
                
                if (approvedApplication) {
                    setApplicationStatus(approvedApplication);
                    setPendingApplication(null); // 有批准的申请时，不需要显示待审核的申请
                } else if (allDenied) {
                    // 所有申请都被拒绝，允许重新申请，但显示提示
                    setApplicationStatus(null);
                    setPendingApplication(null);
                } else if (pendingApplication) {
                    // 有待审核的申请，不允许重新申请
                    setApplicationStatus(null);
                    setPendingApplication(pendingApplication);
                } else {
                    // 没有批准的申请，也没有待审核的申请，但有被拒绝的申请
                    setApplicationStatus(null);
                    setPendingApplication(null);
                }
            } else {
                // 没有任何申请记录
                setApplicationStatus(null);
                setPendingApplication(null);
            }
        } catch (error) {
            console.error("检查申请状态时出错:", error);
            toast({
                title: "检查申请状态失败",
                description: "无法获取您的申请状态，请稍后重试",
                variant: "destructive",
            });
        } finally {
            setLoadingApplication(false);
        }
    };

    const isDatasetAvailableToUser = () => {
        if (!selectedDataset) return false;

        // 如果数据集没有设置申请机构限制，则所有人都可以申请
        if (!selectedDataset.applicationInstitutionIds) return true;

        // 如果用户不属于任何机构，则无法申请有限制的数据集
        const userInstitutionId = getCurrentUserInfo().user.institutionId;
        if (!userInstitutionId) return false;

        // 检查用户所属机构是否在数据集允许申请的机构列表中
        return selectedDataset.applicationInstitutionIds.includes(userInstitutionId);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // 验证必填字段
        if (!formData.agreeToTerms) {
            toast.error("请同意数据使用协议");
            return;
        }

        if (!uploadedFile) {
            toast.error("请上传审批表签字扫描文档");
            return;
        }

        if (!formData.datasetId) {
            toast.error("请选择要申请的数据集");
            return;
        }

        if (!isDatasetAvailableToUser()) {
            toast.error("该数据集暂未对用户所属机构开放申请");
            return;
        }

        if (!formData.applicantRole) {
            toast.error("请选择申请者角色类型");
            return;
        }

        if (formData.applicantRole === "TEAM_RESEARCHER" && !formData.applicantType) {
            toast.error("请选择研究者类型");
            return;
        }

        if (!formData.projectTitle.trim()) {
            toast.error("请填写项目标题");
            return;
        }

        if (!formData.projectDescription.trim()) {
            toast.error("请填写项目描述");
            return;
        }

        if (!formData.purpose.trim()) {
            toast.error("请填写数据使用目的");
            return;
        }

        if (!formData.projectLeader.trim()) {
            toast.error("请填写项目负责人");
            return;
        }

        setSubmitting(true);

        try {
            // 准备申请数据
            const requestData: CreateApplicationRequest = {
                datasetId: formData.datasetId,
                applicantRole: formData.applicantRole,
                applicantType: formData.applicantType,
                projectTitle: formData.projectTitle.trim(),
                projectDescription: formData.projectDescription.trim(),
                fundingSource: formData.fundingSource.trim(),
                purpose: formData.purpose.trim(),
                projectLeader: formData.projectLeader.trim(),
                approvalDocumentId: uploadedFile.id
            };

            // 提交申请
            await createApplication(requestData);

            toast.success("申请提交成功");

            // 关闭对话框
            onOpenChange(false);
        } catch (error: any) {
            console.error("Error submitting application:", error);
            toast.error("提交失败: " + (error.response?.data?.message || error.message || "未知错误"));
        } finally {
            setSubmitting(false);
        }
    };

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    // 验证项目标题
    const validateProjectTitle = (value: string): string | true => {
        if (!value.trim()) return "项目标题为必填项";
        if (value.trim().length < 5) return "项目标题至少需要5个字符";
        if (value.trim().length > 200) return "项目标题不能超过200个字符";
        return true;
    };

    // 验证项目描述
    const validateProjectDescription = (value: string): string | true => {
        if (!value.trim()) return "项目描述为必填项";
        if (value.trim().length < 20) return "项目描述至少需要20个字符";
        if (value.trim().length > 2000) return "项目描述不能超过2000个字符";
        return true;
    };

    // 验证数据使用目的
    const validatePurpose = (value: string): string | true => {
        if (!value.trim()) return "数据使用目的为必填项";
        if (value.trim().length < 10) return "数据使用目的至少需要10个字符";
        if (value.trim().length > 1000) return "数据使用目的不能超过1000个字符";
        return true;
    };

    // 验证项目负责人
    const validateProjectLeader = (value: string): string | true => {
        if (!value.trim()) return "项目负责人为必填项";
        if (value.trim().length < 2) return "请输入有效的姓名";
        if (value.trim().length > 50) return "姓名不能超过50个字符";
        if (!/^[\u4e00-\u9fa5a-zA-Z\s·]+$/.test(value.trim())) {
            return "姓名只能包含中文、英文字母、空格和间隔号";
        }
        return true;
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px] md:max-w-[500px] lg:max-w-[700px] max-h-[85vh] min-h-[20vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle>数据集申请</DialogTitle>
                    <DialogDescription>
                        请填写以下信息，并提交您的申请。
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-hidden overflow-y-auto p-2">
                    <ScrollArea className="h-full w-full pr-4">
                        <FormValidator onSubmit={handleSubmit} className="space-y-6" showAllErrorsOnSubmit={true}>
                            {/* Dataset Selection */}
                            <div className="space-y-2">
                                <DatasetSelector
                                    selectedDataset={selectedDataset}
                                    onDatasetSelect={handleDatasetSelect}
                                    datasetId={datasetId}
                                    disabled={datasetId != null && datasetId !== ""}
                                    label="选择数据集"
                                    required
                                />
                            </div>

                            {/* 只有选择了数据集才显示后续内容 */}
                            {formData.datasetId && selectedDataset && (
                                <>
                                    {/* 显示选中的数据集信息 */}
                                    <div className="border rounded-lg p-4 bg-muted/50">
                                        <h3 className="font-semibold mb-2">数据集信息</h3>
                                        <div className="space-y-1 text-sm">
                                            <div className="flex">
                                                <span className="font-medium w-24 flex-shrink-0">标题:</span>
                                                <span className="truncate whitespace-normal break-words"
                                                      title={selectedDataset.titleCn}>{selectedDataset.titleCn}</span>
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

                                        {/* 机构限制提示 */}
                                        {!isDatasetAvailableToUser() && (
                                            <Alert variant="destructive" className="mt-3">
                                                <AlertTriangle className="h-4 w-4" />
                                                <AlertDescription>
                                                    该数据集暂未对用户所属机构开放申请
                                                </AlertDescription>
                                            </Alert>
                                        )}
                                    </div>

                                    {/* 申请状态提醒 */}
                                    {loadingApplication ? (
                                        <div className="p-4 text-center text-muted-foreground">
                                            正在检查您的申请状态...
                                        </div>
                                    ) : (
                                        <>
                                            {/* 显示待审核的申请提醒 */}
                                            {pendingApplication && (
                                                <Alert variant="default" className="border-yellow-200 bg-yellow-50">
                                                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                                                    <AlertDescription className="text-yellow-800">
                                                        <div className="flex flex-col">
                                                            <span className="font-semibold">存在待审核的申请</span>
                                                            <span>您有一个申请正在审核中: "{pendingApplication.projectTitle}"，请等待审核完成。</span>
                                                        </div>
                                                    </AlertDescription>
                                                </Alert>
                                            )}

                                            {/* 显示已批准的申请提醒 */}
                                            {applicationStatus && (
                                                <Alert variant="default" className="border-green-200 bg-green-50">
                                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                                    <AlertDescription className="text-green-800">
                                                        <div className="flex flex-col">
                                                            <span className="font-semibold">已获得数据集访问权限</span>
                                                            <span>您的申请已获批准: "{applicationStatus.projectTitle}"。您可以直接下载数据文件。</span>
                                                        </div>
                                                    </AlertDescription>
                                                </Alert>
                                            )}
                                        </>
                                    )}

                                    {isDatasetAvailableToUser() && !pendingApplication && !applicationStatus && (
                                        <>
                                            {/* Applicant Role Selection */}
                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="applicantRole" className="flex items-center gap-1">
                                                        申请者角色类型 <Asterisk className="h-3 w-3 text-red-500" />
                                                    </Label>
                                                    <Select
                                                        value={formData.applicantRole}
                                                        onValueChange={(value) => {
                                                            setFormData(prev => ({
                                                                ...prev,
                                                                applicantRole: value,
                                                                applicantType: ""
                                                            }));
                                                        }}
                                                        required
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="请选择申请者角色" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="TEAM_RESEARCHER">团队研究者</SelectItem>
                                                            <SelectItem
                                                                value="COLLABORATIVE_RESEARCHER">合作团队研究者</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                {formData.applicantRole === "TEAM_RESEARCHER" && (
                                                    <div className="space-y-2">
                                                        <Label htmlFor="applicantType" className="flex items-center gap-1">
                                                            研究者类型 <Asterisk className="h-3 w-3 text-red-500" />
                                                        </Label>
                                                        <Select
                                                            value={formData.applicantType}
                                                            onValueChange={(value) => setFormData(prev => ({
                                                                ...prev,
                                                                applicantType: value
                                                            }))}
                                                            required
                                                        >
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="请选择类型" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="employee">在职工作人员</SelectItem>
                                                                <SelectItem value="student">学生</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Project Information */}
                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="projectTitle" className="flex items-center gap-1">
                                                        项目标题 <Asterisk className="h-3 w-3 text-red-500" />
                                                    </Label>
                                                    <InputWrapper
                                                        name="projectTitle"
                                                        required
                                                        validationType="custom"
                                                        customValidator={validateProjectTitle}
                                                    >
                                                        <Input
                                                            id="projectTitle"
                                                            value={formData.projectTitle}
                                                            onChange={(e) => handleInputChange("projectTitle", e.target.value)}
                                                            placeholder="请输入研究项目标题"
                                                            maxLength={200}
                                                        />
                                                    </InputWrapper>
                                                </div>

                                                <div className="space-y-2">
                                                    <Label htmlFor="projectDescription" className="flex items-center gap-1">
                                                        项目描述 <Asterisk className="h-3 w-3 text-red-500" />
                                                    </Label>
                                                    <InputWrapper
                                                        name="projectDescription"
                                                        required
                                                        validationType="custom"
                                                        customValidator={validateProjectDescription}
                                                    >
                                                        <Textarea
                                                            id="projectDescription"
                                                            rows={4}
                                                            value={formData.projectDescription}
                                                            onChange={(e) => handleInputChange("projectDescription", e.target.value)}
                                                            placeholder="详细描述研究背景、目标、方法和预期成果"
                                                            maxLength={2000}
                                                        />
                                                    </InputWrapper>
                                                </div>

                                                <div className="space-y-2">
                                                    <Label htmlFor="purpose" className="flex items-center gap-1">
                                                        数据使用目的 <Asterisk className="h-3 w-3 text-red-500" />
                                                    </Label>
                                                    <InputWrapper
                                                        name="purpose"
                                                        required
                                                        validationType="custom"
                                                        customValidator={validatePurpose}
                                                    >
                                                        <Textarea
                                                            id="purpose"
                                                            rows={3}
                                                            value={formData.purpose}
                                                            onChange={(e) => handleInputChange("purpose", e.target.value)}
                                                            placeholder="说明申请数据的具体用途和分析计划"
                                                            maxLength={1000}
                                                        />
                                                    </InputWrapper>
                                                </div>

                                                <div className="space-y-2">
                                                    <Label htmlFor="fundingSource">资助来源</Label>
                                                    <Input
                                                        id="fundingSource"
                                                        value={formData.fundingSource}
                                                        onChange={(e) => handleInputChange("fundingSource", e.target.value)}
                                                        placeholder="国家自然科学基金、省部级基金等（选填）"
                                                        maxLength={200}
                                                    />
                                                    <p className="text-xs text-muted-foreground">选填字段</p>
                                                </div>

                                                <div className="space-y-2">
                                                    <Label htmlFor="projectLeader" className="flex items-center gap-1">
                                                        项目负责人 <Asterisk className="h-3 w-3 text-red-500" />
                                                    </Label>
                                                    <InputWrapper
                                                        name="projectLeader"
                                                        required
                                                        validationType="custom"
                                                        customValidator={validateProjectLeader}
                                                    >
                                                        <Input
                                                            id="projectLeader"
                                                            value={formData.projectLeader}
                                                            onChange={(e) => handleInputChange("projectLeader", e.target.value)}
                                                            placeholder="请输入项目负责人的姓名"
                                                            maxLength={50}
                                                        />
                                                    </InputWrapper>
                                                </div>
                                            </div>

                                            {/* Approval Document Upload */}
                                            <div className="space-y-4">
                                                <h3 className="text-lg font-semibold flex items-center gap-2">
                                                    <Upload className="h5 w-5" />
                                                    审批表上传
                                                </h3>

                                                <div className="space-y-2">
                                                    <Label htmlFor="approvalDocument" className="flex items-center gap-1">
                                                        审批表签字扫描文档 <Asterisk className="h-3 w-3 text-red-500" />
                                                    </Label>
                                                    <FileUploader
                                                        ref={fileUploaderRef}
                                                        onResetComplete={() => {
                                                            setUploadedFile(null);
                                                        }}
                                                        onUploadComplete={(fileInfo) => {
                                                            setUploadedFile(fileInfo);
                                                        }}
                                                        maxSize={20 * 1024 * 1024} // 20MB限制
                                                        acceptedFileTypes={['.pdf']} // 只允许PDF格式
                                                    />
                                                    <p className="text-xs text-muted-foreground">支持PDF格式，最大20MB</p>
                                                </div>
                                            </div>

                                            {/* Agreement */}
                                            <Alert variant="destructive" className="border-amber-200 bg-amber-50">
                                                <AlertCircle className="h-4 w-4 text-amber-800" />
                                                <AlertDescription className="text-amber-800 space-y-2">
                                                    <h4 className="font-semibold">数据使用协议</h4>
                                                    <p>申请数据前，请仔细阅读以下条款：</p>
                                                    <ul className="list-disc list-inside space-y-1 ml-4">
                                                        <li>数据仅用于学术研究，不得用于商业用途</li>
                                                        <li>严格保护数据隐私，不得尝试重新识别患者身份</li>
                                                        <li>研究成果发表时需注明数据来源</li>
                                                        <li>不得将数据转让给第三方</li>
                                                        <li>使用结束后需删除本地数据副本</li>
                                                    </ul>

                                                    <div className="flex items-center space-x-2 mt-4">
                                                        <Checkbox
                                                            id="agree"
                                                            checked={formData.agreeToTerms}
                                                            onCheckedChange={(checked) => setFormData(prev => ({
                                                                ...prev,
                                                                agreeToTerms: checked as boolean
                                                            }))}
                                                        />
                                                        <Label htmlFor="agree" className="text-sm text-amber-800 flex items-center gap-1">
                                                            我已阅读并同意遵守数据使用协议 <Asterisk className="h-3 w-3 text-red-500" />
                                                        </Label>
                                                    </div>
                                                </AlertDescription>
                                            </Alert>
                                        </>
                                    )}
                                </>
                            )}

                            <div className="flex justify-end space-x-4 pt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => onOpenChange(false)}
                                    disabled={submitting}
                                >
                                    取消
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={
                                        submitting ||
                                        !formData.agreeToTerms ||
                                        !uploadedFile ||
                                        !formData.datasetId ||
                                        !isDatasetAvailableToUser() ||
                                        !!pendingApplication || // 如果有待审核的申请，则禁用提交
                                        !formData.applicantRole ||
                                        (formData.applicantRole === "TEAM_RESEARCHER" && !formData.applicantType) ||
                                        !formData.projectTitle.trim() ||
                                        !formData.projectDescription.trim() ||
                                        !formData.purpose.trim() ||
                                        !formData.projectLeader.trim()
                                    }
                                >
                                    {submitting ? (
                                        <>
                                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                                            提交中...
                                        </>
                                    ) : (
                                        '提交申请'
                                    )}
                                </Button>
                            </div>
                        </FormValidator>
                    </ScrollArea>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ApplyDialog;