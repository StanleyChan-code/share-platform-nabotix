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
import { DatasetUploadForm } from './DatasetUploadForm';

interface DatasetUploadProps {
  onSuccess?: () => void;
}

export function DatasetUpload({ onSuccess }: DatasetUploadProps) {
  return <DatasetUploadForm onSuccess={onSuccess} />;
}
