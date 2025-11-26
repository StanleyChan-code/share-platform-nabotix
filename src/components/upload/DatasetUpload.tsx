import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Upload, File, X, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { BaselineDatasetSelector } from './BaselineDatasetSelector';

interface DatasetUploadProps {
  onSuccess?: () => void;
}

export function DatasetUpload({ onSuccess }: DatasetUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title_cn: '',
    description: '',
    type: '',
    category: '',
    principal_investigator: '',
    dataset_leader: '',
    data_collection_unit: '',
    contact_person: '',
    contact_info: '',
    sampling_method: '',
    start_date: '',
    end_date: '',
    keywords: [] as string[],
    record_count: '',
    variable_count: '',
    share_all_data: false,
    demographic_fields: [] as Array<{name: string, label: string, type: string}>,
    outcome_fields: [] as Array<{name: string, label: string, type: string}>,
    is_followup: false,
    parent_dataset_id: '',
  });
  const [newKeyword, setNewKeyword] = useState('');
  const [newDemoField, setNewDemoField] = useState({name: '', label: '', type: 'categorical'});
  const [newOutcomeField, setNewOutcomeField] = useState({name: '', label: '', type: 'binary'});
  const [dataFile, setDataFile] = useState<File | null>(null);
  const [dictFile, setDictFile] = useState<File | null>(null);
  const [termsFile, setTermsFile] = useState<File | null>(null);
  const [agreements, setAgreements] = useState({
    dataSharing: false,
    ethics: false,
    ownership: false,
    privacy: false,
  });

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

  const addDemographicField = () => {
    if (newDemoField.name && newDemoField.label) {
      setFormData(prev => ({
        ...prev,
        demographic_fields: [...prev.demographic_fields, newDemoField]
      }));
      setNewDemoField({name: '', label: '', type: 'categorical'});
    }
  };

  const removeDemographicField = (index: number) => {
    setFormData(prev => ({
      ...prev,
      demographic_fields: prev.demographic_fields.filter((_, i) => i !== index)
    }));
  };

  const addOutcomeField = () => {
    if (newOutcomeField.name && newOutcomeField.label) {
      setFormData(prev => ({
        ...prev,
        outcome_fields: [...prev.outcome_fields, newOutcomeField]
      }));
      setNewOutcomeField({name: '', label: '', type: 'binary'});
    }
  };

  const removeOutcomeField = (index: number) => {
    setFormData(prev => ({
      ...prev,
      outcome_fields: prev.outcome_fields.filter((_, i) => i !== index)
    }));
  };

  const uploadFile = async (file: File, folder: string): Promise<string | null> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    const { error } = await supabase.storage
      .from('datasets')
      .upload(filePath, file);

    if (error) {
      console.error('Upload error:', error);
      return null;
    }

    return filePath;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!dataFile) {
      toast.error('请选择数据文件');
      return;
    }

    // Check if all agreements are accepted
    const allAgreementsAccepted = Object.values(agreements).every(Boolean);
    if (!allAgreementsAccepted) {
      toast.error('请阅读并同意所有条款和协议');
      return;
    }

    setUploading(true);

    try {
      // Upload files
      const dataFilePath = await uploadFile(dataFile, 'data');
      if (!dataFilePath) {
        throw new Error('数据文件上传失败');
      }

      let dictFilePath = null;
      if (dictFile) {
        dictFilePath = await uploadFile(dictFile, 'dictionaries');
        if (!dictFilePath) {
          throw new Error('数据字典文件上传失败');
        }
      }

      let termsFilePath = null;
      if (termsFile) {
        termsFilePath = await uploadFile(termsFile, 'agreements');
        if (!termsFilePath) {
          throw new Error('数据使用协议上传失败');
        }
      }

      // Create dataset record
      const { data, error } = await supabase.from('datasets').insert({
        title_cn: formData.title_cn,
        description: formData.description,
        type: formData.type as any,
        category: formData.category || null,
        principal_investigator: formData.principal_investigator || null,
        dataset_leader: formData.dataset_leader || null,
        data_collection_unit: formData.data_collection_unit || null,
        contact_person: formData.contact_person || null,
        contact_info: formData.contact_info || null,
        sampling_method: formData.sampling_method || null,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        keywords: formData.keywords.length > 0 ? formData.keywords : null,
        record_count: formData.record_count ? parseInt(formData.record_count) : null,
        variable_count: formData.variable_count ? parseInt(formData.variable_count) : null,
        file_url: dataFilePath,
        data_dict_url: dictFilePath,
        terms_agreement_url: termsFilePath,
        demographic_fields: formData.demographic_fields.length > 0 ? formData.demographic_fields : null,
        outcome_fields: formData.outcome_fields.length > 0 ? formData.outcome_fields : null,
        share_all_data: formData.share_all_data,
        parent_dataset_id: formData.is_followup && formData.parent_dataset_id ? formData.parent_dataset_id : null,
        provider_id: (await supabase.auth.getUser()).data.user?.id || '',
      })
      .select();

      if (error) throw error;

      const datasetId = data?.[0]?.id;
      toast.success('数据集上传成功，正在分析数据...');
      
      // Trigger dataset analysis in background
      if (datasetId && dataFilePath) {
        try {
          const { error: analysisError } = await supabase.functions.invoke('analyze-dataset', {
            body: { datasetId, filePath: dataFilePath }
          });
          
          if (analysisError) {
            console.error('Analysis error:', analysisError);
            toast.error('数据分析失败，但数据集已保存');
          } else {
            toast.success('数据分析完成');
          }
        } catch (analysisErr) {
          console.error('Failed to trigger analysis:', analysisErr);
        }
      }
      
      // Reset form
      setFormData({
        title_cn: '',
        description: '',
        type: '',
        category: '',
        principal_investigator: '',
        dataset_leader: '',
        data_collection_unit: '',
        contact_person: '',
        contact_info: '',
        sampling_method: '',
        start_date: '',
        end_date: '',
        keywords: [],
        record_count: '',
        variable_count: '',
        share_all_data: false,
        demographic_fields: [],
        outcome_fields: [],
        is_followup: false,
        parent_dataset_id: '',
      });
      setDataFile(null);
      setDictFile(null);
      setTermsFile(null);
      setAgreements({
        dataSharing: false,
        ethics: false,
        ownership: false,
        privacy: false,
      });
      
      onSuccess?.();
    } catch (error) {
      console.error('Error uploading dataset:', error);
      toast.error('上传失败: ' + (error instanceof Error ? error.message : '未知错误'));
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
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">基本信息</h3>
            
            <div className="space-y-2">
              <Label htmlFor="title">数据集标题 *</Label>
              <Input
                id="title"
                value={formData.title_cn}
                onChange={(e) => setFormData(prev => ({ ...prev, title_cn: e.target.value }))}
                placeholder="请输入数据集标题"
                required
              />
            </div>

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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">研究类型 *</Label>
                <Select value={formData.type} onValueChange={(value) => 
                  setFormData(prev => ({ ...prev, type: value }))
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="选择研究类型" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cohort">队列研究</SelectItem>
                    <SelectItem value="case_control">病例对照研究</SelectItem>
                    <SelectItem value="cross_sectional">横断面研究</SelectItem>
                    <SelectItem value="rct">随机对照试验</SelectItem>
                    <SelectItem value="registry">登记研究</SelectItem>
                    <SelectItem value="biobank">生物样本库</SelectItem>
                    <SelectItem value="omics">组学数据</SelectItem>
                    <SelectItem value="wearable">可穿戴设备</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">学科领域</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  placeholder="如：心血管疾病、肿瘤学等"
                />
              </div>
            </div>

            {/* Baseline/Follow-up Section */}
            <div className="space-y-4 p-4 border rounded-lg bg-blue-50/50">
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="isFollowup"
                  checked={formData.is_followup}
                  onCheckedChange={(checked) => {
                    setFormData(prev => ({ 
                      ...prev, 
                      is_followup: checked as boolean,
                      parent_dataset_id: checked ? prev.parent_dataset_id : ''
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

              {formData.is_followup && (
                <BaselineDatasetSelector
                  value={formData.parent_dataset_id}
                  onChange={(value) => setFormData(prev => ({ ...prev, parent_dataset_id: value }))}
                />
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="principal_investigator">首席研究员（PI）</Label>
              <Input
                id="principal_investigator"
                value={formData.principal_investigator}
                onChange={(e) => setFormData(prev => ({ ...prev, principal_investigator: e.target.value }))}
                placeholder="请输入首席研究员姓名"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dataset_leader">数据集负责人 *</Label>
                <Input
                  id="dataset_leader"
                  value={formData.dataset_leader}
                  onChange={(e) => setFormData(prev => ({ ...prev, dataset_leader: e.target.value }))}
                  placeholder="数据集负责人姓名"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="data_collection_unit">数据采集单位 *</Label>
                <Input
                  id="data_collection_unit"
                  value={formData.data_collection_unit}
                  onChange={(e) => setFormData(prev => ({ ...prev, data_collection_unit: e.target.value }))}
                  placeholder="如：某某医院"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contact_person">联系人 *</Label>
                <Input
                  id="contact_person"
                  value={formData.contact_person}
                  onChange={(e) => setFormData(prev => ({ ...prev, contact_person: e.target.value }))}
                  placeholder="联系人姓名"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact_info">联系方式 *</Label>
                <Input
                  id="contact_info"
                  value={formData.contact_info}
                  onChange={(e) => setFormData(prev => ({ ...prev, contact_info: e.target.value }))}
                  placeholder="电话或邮箱"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sampling_method">抽样方法</Label>
              <Input
                id="sampling_method"
                value={formData.sampling_method}
                onChange={(e) => setFormData(prev => ({ ...prev, sampling_method: e.target.value }))}
                placeholder="如：随机抽样、分层抽样等"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">研究开始日期</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">研究结束日期</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="recordCount">记录数量</Label>
                <Input
                  id="recordCount"
                  type="number"
                  value={formData.record_count}
                  onChange={(e) => setFormData(prev => ({ ...prev, record_count: e.target.value }))}
                  placeholder="样本/患者数量"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="variableCount">变量数量</Label>
                <Input
                  id="variableCount"
                  type="number"
                  value={formData.variable_count}
                  onChange={(e) => setFormData(prev => ({ ...prev, variable_count: e.target.value }))}
                  placeholder="数据字段数量"
                />
              </div>
            </div>

            {/* Data Sharing Options */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">数据共享设置</h3>
              
              <div className="flex items-center space-x-3 p-4 border rounded-lg bg-blue-50/50">
                <Checkbox
                  id="shareAllData"
                  checked={formData.share_all_data}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({ ...prev, share_all_data: checked as boolean }))
                  }
                />
                <div>
                  <Label htmlFor="shareAllData" className="text-sm font-medium">
                    分享所有数据
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    勾选此项表示您愿意分享数据集中的所有数据供研究使用。如果不勾选，则只分享部分数据或统计摘要。
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Keywords */}
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
                  <Badge key={keyword} variant="secondary" className="gap-1">
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

          {/* Demographic Fields */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">人口统计学字段</h3>
            
            <div className="grid grid-cols-3 gap-2">
              <Input
                placeholder="字段名（如：age）"
                value={newDemoField.name}
                onChange={(e) => setNewDemoField(prev => ({...prev, name: e.target.value}))}
              />
              <Input
                placeholder="标签（如：年龄）"
                value={newDemoField.label}
                onChange={(e) => setNewDemoField(prev => ({...prev, label: e.target.value}))}
              />
              <div className="flex gap-2">
                <Select value={newDemoField.type} onValueChange={(value) => 
                  setNewDemoField(prev => ({...prev, type: value}))
                }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="categorical">分类型</SelectItem>
                    <SelectItem value="numerical">数值型</SelectItem>
                    <SelectItem value="ordinal">有序分类</SelectItem>
                  </SelectContent>
                </Select>
                <Button type="button" onClick={addDemographicField} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {formData.demographic_fields.length > 0 && (
              <div className="space-y-2">
                {formData.demographic_fields.map((field, index) => (
                  <div key={index} className="flex items-center justify-between p-2 border rounded">
                    <span className="text-sm">
                      <strong>{field.name}</strong>: {field.label} ({field.type})
                    </span>
                    <X 
                      className="h-4 w-4 cursor-pointer text-muted-foreground hover:text-foreground" 
                      onClick={() => removeDemographicField(index)}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Outcome Fields */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">结局指标字段</h3>
            
            <div className="grid grid-cols-3 gap-2">
              <Input
                placeholder="字段名（如：mace）"
                value={newOutcomeField.name}
                onChange={(e) => setNewOutcomeField(prev => ({...prev, name: e.target.value}))}
              />
              <Input
                placeholder="标签（如：主要心血管事件）"
                value={newOutcomeField.label}
                onChange={(e) => setNewOutcomeField(prev => ({...prev, label: e.target.value}))}
              />
              <div className="flex gap-2">
                <Select value={newOutcomeField.type} onValueChange={(value) => 
                  setNewOutcomeField(prev => ({...prev, type: value}))
                }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="binary">二分类</SelectItem>
                    <SelectItem value="numerical">数值型</SelectItem>
                    <SelectItem value="categorical">分类型</SelectItem>
                  </SelectContent>
                </Select>
                <Button type="button" onClick={addOutcomeField} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {formData.outcome_fields.length > 0 && (
              <div className="space-y-2">
                {formData.outcome_fields.map((field, index) => (
                  <div key={index} className="flex items-center justify-between p-2 border rounded">
                    <span className="text-sm">
                      <strong>{field.name}</strong>: {field.label} ({field.type})
                    </span>
                    <X 
                      className="h-4 w-4 cursor-pointer text-muted-foreground hover:text-foreground" 
                      onClick={() => removeOutcomeField(index)}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* File Uploads */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">文件上传</h3>
            
            <div className="space-y-2">
              <Label htmlFor="dataFile">数据文件 * (CSV, Excel, etc.)</Label>
              <Input
                id="dataFile"
                type="file"
                accept=".csv,.xlsx,.xls,.json"
                onChange={(e) => setDataFile(e.target.files?.[0] || null)}
                required
              />
              {dataFile && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <File className="h-4 w-4" />
                  {dataFile.name} ({(dataFile.size / 1024 / 1024).toFixed(2)} MB)
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="dictFile">数据字典文件 (可选)</Label>
              <Input
                id="dictFile"
                type="file"
                accept=".pdf,.doc,.docx,.csv,.xlsx"
                onChange={(e) => setDictFile(e.target.files?.[0] || null)}
              />
              {dictFile && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <File className="h-4 w-4" />
                  {dictFile.name} ({(dictFile.size / 1024 / 1024).toFixed(2)} MB)
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="termsFile">数据使用协议 *</Label>
              <Input
                id="termsFile"
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) => setTermsFile(e.target.files?.[0] || null)}
                required
              />
              {termsFile && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <File className="h-4 w-4" />
                  {termsFile.name} ({(termsFile.size / 1024 / 1024).toFixed(2)} MB)
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                请上传数据集所属单位制定的数据使用协议（PDF或Word格式）
              </p>
            </div>
          </div>

          {/* Agreements and Terms */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">协议与条款</h3>
            <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
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

          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" disabled={uploading}>
              保存草稿
            </Button>
            <Button 
              type="submit" 
              disabled={uploading || !Object.values(agreements).every(Boolean)}
            >
              {uploading ? '上传中...' : '提交审核'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}