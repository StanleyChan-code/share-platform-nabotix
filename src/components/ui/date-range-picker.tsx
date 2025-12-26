// components/ui/date-range-picker.tsx
import React from 'react';
import { Calendar, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { CustomDatePicker } from './date-picker';

export interface DateRangePickerProps {
    /** 开始日期 */
    startDate?: Date | null;
    /** 结束日期 */
    endDate?: Date | null;
    /** 开始日期变化回调 */
    onStartDateChange: (date: Date | null) => void;
    /** 结束日期变化回调 */
    onEndDateChange: (date: Date | null) => void;
    /** 开始日期占位符 */
    startDatePlaceholder?: string;
    /** 结束日期占位符 */
    endDatePlaceholder?: string;
    /** 是否禁用 */
    disabled?: boolean;
    /** 自定义类名 */
    className?: string;
    /** 是否显示清除按钮 */
    showClearButtons?: boolean;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
                                                                    startDate,
                                                                    endDate,
                                                                    onStartDateChange,
                                                                    onEndDateChange,
                                                                    startDatePlaceholder = "开始日期",
                                                                    endDatePlaceholder = "结束日期",
                                                                    disabled = false,
                                                                    className,
                                                                    showClearButtons = true,
                                                                }) => {
    const handleClearStartDate = () => {
        onStartDateChange(null);
    };

    const handleClearEndDate = () => {
        onEndDateChange(null);
    };

    const handleClearAll = () => {
        onStartDateChange(null);
        onEndDateChange(null);
    };

    return (
        <div className={cn("flex items-center space-x-2", className)}>
            <div className="relative">
                <CustomDatePicker
                    selected={startDate}
                    onChange={onStartDateChange}
                    placeholder={startDatePlaceholder}
                    maxDate={endDate || new Date()}
                    disabled={disabled}
                    showClearButton={showClearButtons}
                    selectsStart
                    startDate={startDate}
                    endDate={endDate}
                />
            </div>

            <span className="text-muted-foreground text-sm">至</span>

            <div className="relative">
                <CustomDatePicker
                    selected={endDate}
                    onChange={onEndDateChange}
                    placeholder={endDatePlaceholder}
                    minDate={startDate}
                    maxDate={new Date()}
                    disabled={disabled || !startDate}
                    showClearButton={showClearButtons}
                    selectsEnd
                    startDate={startDate}
                    endDate={endDate}
                />
            </div>

            {showClearButtons && (startDate || endDate) && (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearAll}
                    disabled={disabled}
                    className="h-8 px-2"
                    title="清除日期范围"
                >
                    <X className="h-3 w-3" />
                </Button>
            )}
        </div>
    );
};

export default DateRangePicker;