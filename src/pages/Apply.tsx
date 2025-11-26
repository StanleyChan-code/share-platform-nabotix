import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { FileText, User, Building, Clock, CheckCircle, AlertCircle, Upload, File } from "lucide-react";
import { useState } from "react";
import { useRealtimeQuery } from "@/hooks/useRealtimeQuery";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Mock data for application statuses
const mockApplications = [
  {
    id: "1",
    datasetTitle: "冠心病队列研究数据集",
    projectTitle: "基于机器学习的心血管风险预测模型研究",
    status: "approved",
    submittedAt: "2024-01-10",
    reviewedAt: "2024-01-15"
  },
  {
    id: "2", 
    datasetTitle: "糖尿病患者生物标志物数据",
    projectTitle: "糖尿病并发症早期预警指标筛选",
    status: "under_review",
    submittedAt: "2024-01-12",
    reviewedAt: null
  },
  {
    id: "3",
    datasetTitle: "脑卒中康复随访数据",
    projectTitle: "康复治疗效果评估体系建立",
    status: "submitted", 
    submittedAt: "2024-01-14",
    reviewedAt: null
  }
];

const statusLabels = {
  submitted: { label: "已提交", color: "bg-blue-100 text-blue-800" },
  under_review: { label: "审核中", color: "bg-yellow-100 text-yellow-800" },
  approved: { label: "已批准", color: "bg-green-100 text-green-800" },
  rejected: { label: "已拒绝", color: "bg-red-100 text-red-800" }
};

const Apply = () => {
  const [activeTab, setActiveTab] = useState<"new" | "status">("new");
  const [formData, setFormData] = useState({
    datasetId: "",
    projectTitle: "",
    projectDescription: "",
    fundingSource: "",
    purpose: "",
    supervisorId: "",
    applicantRole: "",
    applicantType: "",
    agreeToTerms: false
  });
  const [approvalDocument, setApprovalDocument] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { data: datasets } = useRealtimeQuery('datasets', {
    select: 'id, title_cn, published, approved',
    eq: ['published', true]
  });
  const { data: applications } = useRealtimeQuery('applications', {
    select: '*, datasets(title_cn)'
  });
  const { data: supervisors } = useRealtimeQuery('users', {
    select: 'id, real_name, title',
    eq: ['role', 'data_provider']
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.agreeToTerms) {
      toast.error('请同意数据使用协议');
      return;
    }

    if (!approvalDocument) {
      toast.error('请上传审批表签字扫描文档');
      return;
    }

    setSubmitting(true);

    try {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      if (!userId) throw new Error('用户未登录');

      // Upload approval document to storage
      const fileExt = approvalDocument.name.split('.').pop();
      const fileName = `${userId}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('application-documents')
        .upload(fileName, approvalDocument);

      if (uploadError) throw uploadError;

      // Get the public URL for the uploaded file
      const { data: { publicUrl } } = supabase.storage
        .from('application-documents')
        .getPublicUrl(fileName);

      // Insert application with document URL
      const { error } = await supabase.from('applications').insert({
        dataset_id: formData.datasetId,
        project_title: formData.projectTitle,
        project_description: formData.projectDescription,
        funding_source: formData.fundingSource || null,
        purpose: formData.purpose,
        supervisor_id: formData.supervisorId || null,
        applicant_id: userId,
        approval_document_url: publicUrl,
        applicant_role: formData.applicantRole as "team_researcher" | "collaborative_researcher",
        applicant_type: formData.applicantType || null,
      });

      if (error) throw error;

      toast.success('申请提交成功');
      
      // Reset form
      setFormData({
        datasetId: "",
        projectTitle: "",
        projectDescription: "",
        fundingSource: "",
        purpose: "",
        supervisorId: "",
        applicantRole: "",
        applicantType: "",
        agreeToTerms: false
      });
      setApprovalDocument(null);
      
      setActiveTab("status");
    } catch (error) {
      console.error('Error submitting application:', error);
      toast.error('提交失败: ' + (error instanceof Error ? error.message : '未知错误'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto py-6 space-y-6">
        {/* Header */}
        <div className="space-y-4">
          <h1 className="text-3xl font-bold">数据申请</h1>
          <p className="text-muted-foreground">
            申请访问临床研究数据集，提交研究计划并等待审核批准
          </p>
        </div>

        {/* Tabs */}
        <Card>
          <CardHeader>
            <div className="flex space-x-1">
              <Button 
                variant={activeTab === "new" ? "default" : "ghost"}
                onClick={() => setActiveTab("new")}
                className="gap-2"
              >
                <FileText className="h-4 w-4" />
                新建申请
              </Button>
              <Button 
                variant={activeTab === "status" ? "default" : "ghost"}
                onClick={() => setActiveTab("status")}
                className="gap-2"
              >
                <Clock className="h-4 w-4" />
                申请状态
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {activeTab === "new" ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Dataset Selection */}
                <div className="space-y-2">
                  <Label htmlFor="dataset">选择数据集 *</Label>
                  <Select value={formData.datasetId} onValueChange={(value) => 
                    setFormData(prev => ({ ...prev, datasetId: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="请选择要申请的数据集" />
                    </SelectTrigger>
                    <SelectContent>
                      {datasets.map((dataset: any) => (
                        <SelectItem key={dataset.id} value={dataset.id}>
                          {dataset.title_cn}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Applicant Role Selection */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <User className="h-5 w-5" />
                    申请者角色
                  </h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="applicantRole">角色类型 *</Label>
                    <Select value={formData.applicantRole} onValueChange={(value) => {
                      setFormData(prev => ({ ...prev, applicantRole: value, applicantType: "" }))
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="请选择申请者角色" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="team_researcher">团队研究者</SelectItem>
                        <SelectItem value="collaborative_researcher">合作团队研究者</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.applicantRole === "team_researcher" && (
                    <div className="space-y-2">
                      <Label htmlFor="applicantType">研究者类型 *</Label>
                      <Select value={formData.applicantType} onValueChange={(value) => 
                        setFormData(prev => ({ ...prev, applicantType: value }))
                      }>
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
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <User className="h-5 w-5" />
                    项目信息
                  </h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="projectTitle">项目标题 *</Label>
                    <Input
                      id="projectTitle"
                      value={formData.projectTitle}
                      onChange={(e) => setFormData(prev => ({ ...prev, projectTitle: e.target.value }))}
                      placeholder="请输入研究项目标题"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="projectDescription">项目描述 *</Label>
                    <Textarea
                      id="projectDescription"
                      rows={4}
                      value={formData.projectDescription}
                      onChange={(e) => setFormData(prev => ({ ...prev, projectDescription: e.target.value }))}
                      placeholder="详细描述研究背景、目标、方法和预期成果"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="purpose">数据使用目的 *</Label>
                    <Textarea
                      id="purpose"
                      rows={3}
                      value={formData.purpose}
                      onChange={(e) => setFormData(prev => ({ ...prev, purpose: e.target.value }))}
                      placeholder="说明申请数据的具体用途和分析计划"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fundingSource">资助来源</Label>
                    <Input
                      id="fundingSource"
                      value={formData.fundingSource}
                      onChange={(e) => setFormData(prev => ({ ...prev, fundingSource: e.target.value }))}
                      placeholder="国家自然科学基金、省部级基金等（可选）"
                    />
                  </div>
                </div>

                {/* Supervisor Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Building className="h-5 w-5" />
                    导师/单位负责人信息
                  </h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="supervisor">导师/负责人 *</Label>
                    <Select value={formData.supervisorId} onValueChange={(value) => 
                      setFormData(prev => ({ ...prev, supervisorId: value }))
                    }>
                      <SelectTrigger>
                        <SelectValue placeholder="选择您的导师或单位负责人" />
                      </SelectTrigger>
                    <SelectContent>
                      {supervisors.map((supervisor: any) => (
                        <SelectItem key={supervisor.id} value={supervisor.id}>
                          {supervisor.real_name} - {supervisor.title || ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Approval Document Upload */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    审批表上传
                  </h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="approvalDocument">审批表签字扫描文档 *</Label>
                    <div className="flex items-center gap-4">
                      <Input
                        id="approvalDocument"
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            // Check file size (max 10MB)
                            if (file.size > 10 * 1024 * 1024) {
                              toast.error('文件大小不能超过10MB');
                              e.target.value = '';
                              return;
                            }
                            setApprovalDocument(file);
                            toast.success('文件已选择');
                          }
                        }}
                        className="cursor-pointer"
                      />
                    </div>
                    {approvalDocument && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <File className="h-4 w-4" />
                        <span>{approvalDocument.name}</span>
                        <span className="text-xs">({(approvalDocument.size / 1024 / 1024).toFixed(2)} MB)</span>
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">
                      请上传盖章签字的审批表扫描件（支持PDF、JPG、PNG格式，最大10MB）
                    </p>
                  </div>
                </div>

                {/* Agreement */}
                <Card className="border-amber-200 bg-amber-50">
                  <CardHeader>
                    <CardTitle className="text-amber-800 flex items-center gap-2">
                      <AlertCircle className="h-5 w-5" />
                      数据使用协议
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-amber-800 space-y-2">
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
                        onCheckedChange={(checked) => 
                          setFormData(prev => ({ ...prev, agreeToTerms: checked as boolean }))
                        }
                      />
                      <Label htmlFor="agree" className="text-sm">
                        我已阅读并同意遵守数据使用协议 *
                      </Label>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-end space-x-4">
                  <Button type="button" variant="outline">
                    保存草稿
                  </Button>
                  <Button 
                    type="submit"
                    disabled={!formData.agreeToTerms || !approvalDocument || submitting}
                  >
                    {submitting ? '提交中...' : '提交申请'}
                  </Button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">我的申请记录</h3>
                
                <div className="space-y-4">
                  {applications.map((application: any) => (
                    <Card key={application.id}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2 flex-1">
                            <h4 className="font-semibold">{application.project_title}</h4>
                            <p className="text-sm text-muted-foreground">
                              申请数据集：{application.datasets?.title_cn || '未知数据集'}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span>提交时间：{new Date(application.submitted_at).toLocaleDateString('zh-CN')}</span>
                              {application.reviewed_at && (
                                <span>审核时间：{new Date(application.reviewed_at).toLocaleDateString('zh-CN')}</span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant="secondary"
                              className={statusLabels[application.status as keyof typeof statusLabels]?.color || 'bg-gray-100 text-gray-800'}
                            >
                              {statusLabels[application.status as keyof typeof statusLabels]?.label || application.status}
                            </Badge>
                            {application.status === "approved" && (
                              <CheckCircle className="h-5 w-5 text-green-600" />
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Apply;