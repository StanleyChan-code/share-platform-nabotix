import { useEffect, useState } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

interface BaselineDatasetSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export function BaselineDatasetSelector({ value, onChange }: BaselineDatasetSelectorProps) {
  const [baselineDatasets, setBaselineDatasets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBaselineDatasets = async () => {
      setLoading(true);
      try {
        const { data: user } = await supabase.auth.getUser();
        
        // Fetch datasets without parent_dataset_id (baseline datasets) from current user
        const { data, error } = await supabase
          .from('datasets')
          .select('id, title_cn, type, created_at')
          .eq('provider_id', user.user?.id || '')
          .is('parent_dataset_id', null)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching baseline datasets:', error);
        } else {
          setBaselineDatasets(data || []);
        }
      } catch (err) {
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBaselineDatasets();
  }, []);

  if (loading) {
    return (
      <div className="space-y-2">
        <Label>选择对应的基线数据集 *</Label>
        <div className="flex items-center gap-2 p-3 border rounded-md">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm text-muted-foreground">加载基线数据集...</span>
        </div>
      </div>
    );
  }

  if (baselineDatasets.length === 0) {
    return (
      <div className="space-y-2">
        <Label>选择对应的基线数据集 *</Label>
        <div className="p-3 border rounded-md bg-muted/50">
          <p className="text-sm text-muted-foreground">
            您还没有基线数据集。请先上传基线数据集，然后再上传随访数据集。
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="parent_dataset">选择对应的基线数据集 *</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder="请选择基线数据集" />
        </SelectTrigger>
        <SelectContent>
          {baselineDatasets.map((dataset) => (
            <SelectItem key={dataset.id} value={dataset.id}>
              {dataset.title_cn} ({new Date(dataset.created_at).toLocaleDateString('zh-CN')})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">
        只显示您上传的基线数据集（没有父数据集的数据集）
      </p>
    </div>
  );
}
