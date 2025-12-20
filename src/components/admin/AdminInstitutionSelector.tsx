import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Search, ChevronsUpDown, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { institutionApi } from "@/integrations/api/institutionApi";
import { toast } from "sonner";

interface AdminInstitutionSelectorProps {
  value: string | null;
  onChange: (value: string | null) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function AdminInstitutionSelector({ 
  value, 
  onChange, 
  disabled,
  placeholder = "选择机构"
}: AdminInstitutionSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Array<{ id: string; fullName: string }>>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedInstitution, setSelectedInstitution] = useState<{ id: string; fullName: string } | null>(null);

  // 获取已选择机构的详细信息
  useEffect(() => {
    const fetchSelectedInstitution = async () => {
      if (!value) {
        setSelectedInstitution(null);
        return;
      }

      try {
        const response = await institutionApi.getInstitutionById(value);
        setSelectedInstitution(response.data);
      } catch (error) {
        console.error("获取机构信息失败:", error);
        toast.error("获取机构信息失败");
      }
    };

    fetchSelectedInstitution();
  }, [value]);

  // 搜索机构（平台管理员专用）
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setSearchResults([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const response = await institutionApi.searchInstitutionsForAdmin(searchTerm);
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

  // 选择机构
  const selectInstitution = (institutionId: string) => {
    onChange(institutionId);
    setOpen(false);
  };

  // 清除选择
  const clearSelection = () => {
    onChange(null);
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
            {selectedInstitution 
              ? selectedInstitution.fullName 
              : placeholder}
            <div className="flex items-center gap-2">
              {selectedInstitution && !disabled && (
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
                    onSelect={() => selectInstitution(institution.id)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === institution.id ? "opacity-100" : "opacity-0"
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

      {selectedInstitution && (
        <Badge variant="secondary" className="gap-1 text-sm">
          {selectedInstitution.fullName}
          {!disabled && (
            <X
              className="h-3 w-3 cursor-pointer"
              onClick={clearSelection}
            />
          )}
        </Badge>
      )}
    </div>
  );
}