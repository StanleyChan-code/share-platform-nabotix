import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { File, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { datasetApi, AddDatasetVersionRequest } from '@/integrations/api/datasetApi';
import { FileInfo } from '@/integrations/api/fileApi';
import FileUploader, { FileUploaderHandles } from './FileUploader';

interface AddDatasetVersionFormProps {
  datasetId: string;
  onSuccess?: () => void;
}

export function AddDatasetVersionForm({ datasetId, onSuccess }: AddDatasetVersionFormProps) {
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    versionNumber: '',
    versionDescription: '',
  });

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 检查必要字段是否已填写
    if (!formData.versionNumber) {
      toast.error('请填写版本号');
      return;
    }

    if (!formData.versionDescription) {
      toast.error('请填写版本描述');
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

    setUploading(true);

    try {
      // 添加数据集新版本
      const versionData: AddDatasetVersionRequest = {
        versionNumber: formData.versionNumber,
        description: formData.versionDescription,
        fileRecordId: dataFileInfo.id,
        dataDictRecordId: dictFileInfo.id,
        termsAgreementRecordId: termsFileInfo.id,
        dataSharingRecordId: sharingFileInfo.id,
        recordCount: 0,
        variableCount: 0
      };

      const response = await datasetApi.addDatasetVersion(datasetId, versionData);

      if (response.success) {
        toast.success('数据集新版本添加成功');

        // 重置表单
        setFormData({
          versionNumber: '',
          versionDescription: '',
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

        onSuccess?.();
      } else {
        throw new Error(response.message || '添加数据集新版本失败');
      }
    } catch (error: any) {
      console.error('添加数据集新版本失败:', error);
      toast.error('添加数据集新版本失败: ' + (error.response?.data?.message || error.message || '未知错误'));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 版本信息 */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">版本信息</h3>
          
          <div className="space-y-2">
            <Label htmlFor="versionNumber">版本号 *</Label>
            <Input
              id="versionNumber"
              value={formData.versionNumber}
              onChange={(e) => setFormData(prev => ({ ...prev, versionNumber: e.target.value }))}
              placeholder="如：2.0"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="versionDescription">版本描述 *</Label>
            <Textarea
              id="versionDescription"
              rows={3}
              value={formData.versionDescription}
              onChange={(e) => setFormData(prev => ({ ...prev, versionDescription: e.target.value }))}
              placeholder="描述此版本的主要变更内容"
              required
            />
          </div>
        </div>

        {/* 文件上传 */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">文件上传</h3>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="dataFile">数据文件 * (CSV, Excel, etc.)</Label>
              <FileUploader
                ref={dataFileRef}
                onUploadComplete={setDataFileInfo}
                maxSize={10 * 1024 * 1024 * 1024} // 10GB
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dictFile">数据字典文件 * (PDF, Word, etc.)</Label>
              <FileUploader
                ref={dictFileRef}
                onUploadComplete={setDictFileInfo}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="termsFile">数据使用协议 * (PDF, Word, etc.)</Label>
              <FileUploader
                ref={termsFileRef}
                onUploadComplete={setTermsFileInfo}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sharingFile">数据分享文件 * (Excel, CSV, etc.)</Label>
              <FileUploader
                ref={sharingFileRef}
                onUploadComplete={setSharingFileInfo}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={uploading}
            className="w-full sm:w-auto"
          >
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                提交中...
              </>
            ) : (
              '提交新版本'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}