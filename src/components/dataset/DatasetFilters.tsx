import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Search, Calendar, X } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { DatasetTypes } from "@/lib/enums";
import {ResearchSubject} from "@/integrations/api/datasetApi.ts";

interface DatasetFiltersProps {
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  selectedType: string;
  onSelectedTypeChange: (value: string) => void;
  selectedCategory: string;
  onSelectedCategoryChange: (value: string) => void;
  dateFrom: Date | undefined;
  onDateFromChange: (value: Date | undefined) => void;
  dateTo: Date | undefined;
  onDateToChange: (value: Date | undefined) => void;
  researchSubjects: ResearchSubject[];
  onResetFilters: () => void;
}

const typeLabels = DatasetTypes;

export function DatasetFilters({
  searchTerm,
  onSearchTermChange,
  selectedType,
  onSelectedTypeChange,
  selectedCategory,
  onSelectedCategoryChange,
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange,
  researchSubjects,
  onResetFilters
}: DatasetFiltersProps) {
  return (
    <div className="flex flex-col md:flex-row gap-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="搜索数据集标题或关键词..."
          value={searchTerm}
          onChange={(e) => onSearchTermChange(e.target.value)}
          className="pl-10"
        />
        {searchTerm && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-0 top-1/2 transform -translate-y-1/2 h-full px-3 rounded-l-none"
            onClick={() => onSearchTermChange("")}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      
      <div className="flex flex-wrap gap-2">
        <div className="relative">
          <Select value={selectedType} onValueChange={onSelectedTypeChange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="研究类型" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部类型</SelectItem>
              <SelectItem value="COHORT">队列研究</SelectItem>
              <SelectItem value="CROSS_SECTIONAL">横断面研究</SelectItem>
              <SelectItem value="CASE_CONTROL">病例对照研究</SelectItem>
              <SelectItem value="RCT">随机对照试验</SelectItem>
              <SelectItem value="REGISTRY">登记研究</SelectItem>
              <SelectItem value="BIOBANK">生物样本库</SelectItem>
              <SelectItem value="OMICS">组学数据</SelectItem>
              <SelectItem value="WEARABLE">可穿戴设备</SelectItem>
            </SelectContent>
          </Select>
          {selectedType !== "all" && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute -top-2 -right-2 h-5 w-5 p-0 rounded-full"
              onClick={() => onSelectedTypeChange("all")}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
        
        <div className="relative">
          <Select value={selectedCategory} onValueChange={onSelectedCategoryChange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="学科领域" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部领域</SelectItem>
              {researchSubjects.map((subject) => (
                <SelectItem key={subject.id} value={subject.name}>
                  {subject.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedCategory !== "all" && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute -top-2 -right-2 h-5 w-5 p-0 rounded-full"
              onClick={() => onSelectedCategoryChange("all")}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
        
        {/* Date From */}
        <div className="relative">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "justify-start text-left font-normal w-[140px]",
                  !dateFrom && "text-muted-foreground"
                )}
              >
                <Calendar className="mr-2 h-4 w-4" />
                {dateFrom ? format(dateFrom, "yyyy-MM-dd") : "开始日期"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={dateFrom}
                onSelect={onDateFromChange}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
          {dateFrom && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute -top-2 -right-2 h-5 w-5 p-0 rounded-full"
              onClick={() => onDateFromChange(undefined)}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* Date To */}
        <div className="relative">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "justify-start text-left font-normal w-[140px]",
                  !dateTo && "text-muted-foreground"
                )}
              >
                <Calendar className="mr-2 h-4 w-4" />
                {dateTo ? format(dateTo, "yyyy-MM-dd") : "结束日期"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={dateTo}
                onSelect={onDateToChange}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
          {dateTo && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute -top-2 -right-2 h-5 w-5 p-0 rounded-full"
              onClick={() => onDateToChange(undefined)}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
        
        <Button variant="outline" onClick={onResetFilters} className="gap-2">
          <Search className="h-4 w-4" />
          重置筛选
        </Button>
      </div>
    </div>
  );
}