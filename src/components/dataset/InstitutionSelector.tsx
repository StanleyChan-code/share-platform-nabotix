import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Search, ChevronsUpDown, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { institutionApi } from "@/integrations/api/institutionApi";
import { toast } from "sonner";

interface InstitutionSelectorProps {
  value: string[] | null;
  onChange: (value: string[] | null) => void;
  disabled?: boolean;
}

export function InstitutionSelector({ value, onChange, disabled }: InstitutionSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Array<{ id: string; fullName: string }>>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [noRestriction, setNoRestriction] = useState(value === null);
  const [selectedInstitutions, setSelectedInstitutions] = useState<Array<{ id: string; fullName: string }>>([]);

  // 获取已选择机构的详细信息
  useEffect(() => {
    const fetchSelectedInstitutions = async () => {
      if (!value || value.length === 0) {
        setSelectedInstitutions([]);
        return;
      }

      try {
        // 获取已选择机构的详细信息
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

  // 搜索机构
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setSearchResults([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const response = await institutionApi.searchInstitutions(searchTerm);
        setSearchResults(response.data.content || []);
      } catch (error) {
        console.error("搜索机构失败:", error);
        toast.error("搜索机构失败");
      } finally {
        setSearchLoading(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  // 切换机构选择
  const toggleInstitutionSelection = (institutionId: string) => {
    // 如果是无限制状态，先切换为有限制状态
    if (noRestriction) {
      setNoRestriction(false);
      onChange([institutionId]);
      return;
    }

    // 如果当前值为null，初始化为空数组
    const currentValue = value === null ? [] : [...value];
    
    const isSelected = currentValue.includes(institutionId);
    if (isSelected) {
      onChange(currentValue.filter(id => id !== institutionId));
    } else {
      onChange([...currentValue, institutionId]);
    }
  };

  // 检查机构是否已选择
  const isInstitutionSelected = (institutionId: string) => {
    if (noRestriction || value === null) return false;
    return value.includes(institutionId);
  };

  // 切换无限制状态
  const toggleNoRestriction = () => {
    const newNoRestriction = !noRestriction;
    setNoRestriction(newNoRestriction);
    onChange(newNoRestriction ? null : []);
  };

  // 获取机构显示名称
  const getInstitutionDisplayName = (institutionId: string) => {
    // 先在搜索结果中查找
    const fromSearch = searchResults.find(i => i.id === institutionId);
    if (fromSearch) return fromSearch.fullName;
    
    // 再在已选择机构中查找
    const fromSelected = selectedInstitutions.find(i => i.id === institutionId);
    if (fromSelected) return fromSelected.fullName;
    
    // 默认返回未知机构
    return "未知机构";
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Checkbox
          id="noInstitutionRestriction"
          checked={noRestriction}
          onCheckedChange={toggleNoRestriction}
          disabled={disabled}
        />
        <label htmlFor="noInstitutionRestriction" className="text-sm font-medium">
          不限制申请机构（任何机构均可申请）
        </label>
      </div>

      {!noRestriction && (
        <div className="space-y-2">
          <label className="text-sm font-medium">可申请此数据集的机构</label>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="w-full justify-between"
                disabled={disabled}
              >
                {value && value.length > 0
                  ? `${value.length} 个机构已选择`
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
                    value={searchTerm}
                    onValueChange={setSearchTerm}
                    className="pl-10"
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

          {value && value.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {value.map((institutionId) => {
                return (
                  <Badge key={institutionId} variant="secondary" className="gap-1 text-sm">
                    {getInstitutionDisplayName(institutionId)}
                    {!disabled && (
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => toggleInstitutionSelection(institutionId)}
                      />
                    )}
                  </Badge>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}