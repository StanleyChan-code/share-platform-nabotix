import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover.tsx";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command.tsx";
import {Search, ChevronsUpDown, Check, X, Building} from "lucide-react";
import { cn } from "@/lib/utils.ts";
import {Institution, institutionApi} from "@/integrations/api/institutionApi.ts";
import { toast } from "sonner";
import { useDebounce } from "@/hooks/useDebounce";

interface AdminInstitutionSelectorProps {
  value: string[] | null;
  onChange: (value: string[] | null) => void;
  disabled?: boolean;
  placeholder?: string;
  disableUnverified?: boolean;
  allowMultiple?: boolean;
}

export function AdminInstitutionSelector({ 
  value, 
  onChange, 
  disabled,
  placeholder = "请选择机构",
  disableUnverified = false,
  allowMultiple = false // 默认是单选模式
}: AdminInstitutionSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Institution[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedInstitutions, setSelectedInstitutions] = useState<Institution[]>([]);
  
  // 添加防抖处理，延迟550ms
  const debouncedSearchTerm = useDebounce(searchTerm, 550);

  // 获取已选择机构的详细信息
  useEffect(() => {
    const fetchSelectedInstitutions = async () => {
      if (!value || value.length === 0) {
        setSelectedInstitutions([]);
        return;
      }

      try {
        const institutionDetails = await Promise.all(
          value.map(id => institutionApi.getInstitutionById(id))
        );
        setSelectedInstitutions(institutionDetails.map(response => response.data));
      } catch (error) {
        console.error("获取机构信息失败:", error);
        toast.error("获取机构信息失败");
      }
    };

    fetchSelectedInstitutions();
  }, [value]);

  // 搜索机构（平台管理员专用）
  useEffect(() => {
    if (debouncedSearchTerm.trim() === "") {
      setSearchResults([]);
      return;
    }

    const searchInstitutions = async () => {
      setSearchLoading(true);
      try {
        const response = await institutionApi.searchInstitutions(debouncedSearchTerm);
        setSearchResults(response.data.content || []);
      } catch (error) {
        console.error("搜索机构失败:", error);
        toast.error("搜索机构失败");
      } finally {
        setSearchLoading(false);
      }
    };

    searchInstitutions();
  }, [debouncedSearchTerm]);

  // 切换机构选择
  const toggleInstitutionSelection = (institutionId: string) => {
    // 如果当前值为null，初始化为空数组
    const currentValue = value === null ? [] : [...value];
    
    const isSelected = currentValue.includes(institutionId);
    if (isSelected) {
      onChange(currentValue.filter(id => id !== institutionId));
    } else {
      if (allowMultiple) {
        onChange([...currentValue, institutionId]);
      } else {
        onChange([institutionId]);
      }
    }
    // 如果是单选模式，选择后关闭弹窗
    if (!allowMultiple) {
      setOpen(false);
    }
  };

  // 检查机构是否已选择
  const isInstitutionSelected = (institutionId: string) => {
    if (value === null) return false;
    return value.includes(institutionId);
  };

  // 清除选择
  const clearSelection = () => {
    onChange(null);
  };

  // 清除单个选择
  const removeInstitution = (institutionId: string) => {
    if (value === null) return;
    onChange(value.filter(id => id !== institutionId));
  };

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            disabled={disabled}
          >
            <div className="flex items-center gap-2">
                <Building className="h-4 w-4" />
                {value && value.length > 0 
                  ? (allowMultiple ? `${value.length} 个机构已选择` : selectedInstitutions[0]?.fullName)
                  : placeholder}
              </div>
            <div className="flex items-center gap-2">
              {value && value.length > 0 && !disabled && (
                <X 
                  className="h-4 w-4 opacity-50 hover:opacity-100" 
                  onClick={(e) => {
                    e.stopPropagation();
                    clearSelection();
                  }}
                />
              )}
              <ChevronsUpDown className="h-4 w-4 opacity-50" />
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
          <Command shouldFilter={false}>
            <div className="relative">
              <CommandInput
                placeholder="搜索机构..."
                value={searchTerm}
                onValueChange={setSearchTerm}
                className="pl-2"
              />
            </div>
            <CommandList>
              <CommandEmpty>
                {searchLoading ? "搜索中..." : "未找到相关机构"}
              </CommandEmpty>
              <CommandGroup>
                {searchResults.map((institution) => (
                  <CommandItem
                    key={institution.id}
                    value={institution.id}
                    onSelect={() => toggleInstitutionSelection(institution.id)}
                    className="flex items-center space-x-2"
                    disabled={disableUnverified && !institution.verified}
                  >
                    <Check
                      className={cn(
                        "h-4 w-4",
                        isInstitutionSelected(institution.id) ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex flex-col flex-1">
                      <div className="flex items-center justify-between">
                        <span className={`font-medium ${disableUnverified && !institution.verified ? 'text-muted-foreground' : ''}`}>
                          {institution.fullName}
                        </span>
                        {!institution.verified && disableUnverified && (
                          <Badge variant="outline" className="text-xs text-amber-600 border-amber-300 bg-amber-50">
                            暂未公开
                          </Badge>
                        )}
                      </div>
                      {institution.shortName && (
                        <span className={`text-xs ${disableUnverified && !institution.verified ? 'text-muted-foreground' : 'text-muted-foreground'}`}>
                          {institution.shortName}
                        </span>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* 只有在多选模式且选中多个机构时才显示下方的Badge */}
      {value && value.length > 0 && allowMultiple && (
        <div className="flex flex-wrap gap-2">
          {selectedInstitutions.map((institution) => (
            <Badge key={institution.id} variant="secondary" className="gap-1 text-sm">
              {institution.fullName}
              {!disabled && (
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => removeInstitution(institution.id)}
                />
              )}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}