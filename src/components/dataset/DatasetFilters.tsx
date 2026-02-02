import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, X } from "lucide-react";
import { ResearchSubject } from "@/integrations/api/datasetApi.ts";
import { DatasetTypes } from "@/lib/enums.ts";
import { Input } from "@/components/ui/FormValidator.tsx";
import { CustomDatePicker } from "@/components/ui/date-picker";
import { InstitutionSelector } from "@/components/admin/institution/InstitutionSelector.tsx";

interface DatasetFiltersProps {
    searchTerm: string;
    onSearchTermChange: (value: string) => void;
    selectedType: string;
    onSelectedTypeChange: (value: string) => void;
    selectedCategory: string;
    onSelectedCategoryChange: (value: string) => void;
    selectedInstitution: string[] | null;
    onSelectedInstitutionChange: (value: string[] | null) => void;
    dateFrom: Date | undefined;
    onDateFromChange: (value: Date | undefined) => void;
    dateTo: Date | undefined;
    onDateToChange: (value: Date | undefined) => void;
    researchSubjects: ResearchSubject[];
}

export function DatasetFilters({
                                   searchTerm,
                                   onSearchTermChange,
                                   selectedType,
                                   onSelectedTypeChange,
                                   selectedCategory,
                                   onSelectedCategoryChange,
                                   selectedInstitution,
                                   onSelectedInstitutionChange,
                                   dateFrom,
                                   onDateFromChange,
                                   dateTo,
                                   onDateToChange,
                                   researchSubjects,
                               }: DatasetFiltersProps) {

    return (
        <div className="flex flex-col lg:flex-row gap-2">
            {/* 搜索框 - 占据主要宽度 */}
            <div className="relative flex-1 min-w-[150px]">
                <Input
                    placeholder="搜索数据集标题或关键词..."
                    value={searchTerm}
                    onChange={(e) => onSearchTermChange(e.target.value)}
                    className="pl-8 pr-8"
                />
                <Search className="absolute left-2 top-5 transform -translate-y-1/2 text-muted-foreground h-4 w-4"/>
                {searchTerm && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-2.5 h-5 w-5 p-1 rounded-full"
                        onClick={() => {
                            onSearchTermChange("");
                        }}
                    >
                        <X className="h-3 w-3"/>
                    </Button>
                )}
            </div>

            <div className="relative w-[250px]">
                <InstitutionSelector
                    value={selectedInstitution}
                    onChange={onSelectedInstitutionChange}
                    placeholder="全部机构"
                    allowMultiple={false}
                />
            </div>

            {/* 筛选器区域 - 优化布局 */}
            <div className="flex flex-col sm:flex-row gap-2 flex-wrap">
                {/* 第一行：类型和学科选择器 */}

                <div className="flex gap-2 flex-wrap">
                    <div className="relative">
                        <Select value={selectedType} onValueChange={onSelectedTypeChange}>
                            <SelectTrigger className="w-[150px]">
                                <SelectValue placeholder="研究类型"/>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">全部数据集类型</SelectItem>
                                {Object.entries(DatasetTypes).map(([key, value]) => (
                                    <SelectItem key={key} value={value}>{value}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {selectedType !== "all" && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="absolute -top-2 -right-2 h-5 w-5 p-0 rounded-full bg-gray-50 border border-gray-300 hover:bg-gray-200"
                                onClick={() => onSelectedTypeChange("all")}
                            >
                                <X className="h-3 w-3"/>
                            </Button>
                        )}
                    </div>

                    <div className="relative">
                        <Select value={selectedCategory} onValueChange={onSelectedCategoryChange}>
                            <SelectTrigger className="w-[150px]">
                                <SelectValue placeholder="学科领域"/>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">全部学科</SelectItem>
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
                                className="absolute -top-2 -right-2 h-5 w-5 p-0 rounded-full bg-gray-50 border border-gray-300 hover:bg-gray-200"
                                onClick={() => onSelectedCategoryChange("all")}
                            >
                                <X className="h-3 w-3"/>
                            </Button>
                        )}
                    </div>
                </div>

                {/* 第二行：日期选择器和重置按钮 */}
                <div className="flex gap-2 flex-wrap items-center">
                    {/* 开始日期选择器 */}
                    <div className="relative w-[150px]">
                        <CustomDatePicker
                            selected={dateFrom}
                            onChange={(date) => onDateFromChange(date || undefined)}
                            placeholder="采集开始时间"
                            maxDate={dateTo || undefined}
                            dateFormat="yyyy-MM-dd"
                            className="w-full"
                        />
                    </div>

                    {/* 结束日期选择器 */}
                    <div className="relative w-[150px]">
                        <CustomDatePicker
                            selected={dateTo}
                            onChange={(date) => onDateToChange(date || undefined)}
                            placeholder="采集结束时间"
                            minDate={dateFrom}
                            dateFormat="yyyy-MM-dd"
                            className="w-full"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}