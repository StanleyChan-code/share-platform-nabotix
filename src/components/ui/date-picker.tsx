import React from 'react';
import DatePicker from "react-datepicker";
import { registerLocale } from "react-datepicker";
import {zhCN} from "date-fns/locale/zh-CN";
import {Calendar, ChevronLeft, ChevronRight, X} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import "react-datepicker/dist/react-datepicker.css";

// 注册中文本地化
registerLocale("zh-cn", zhCN);

export interface DatePickerProps {
  /** 选中的日期 */
  selected?: Date | null;
  /** 日期变化回调 */
  onChange: (date: Date | null) => void;
  /** 占位符文本 */
  placeholder?: string;
  /** 最小日期 */
  minDate?: Date;
  /** 最大日期 */
  maxDate?: Date;
  /** 是否显示清除按钮 */
  showClearButton?: boolean;
  /** 是否禁用 */
  disabled?: boolean;
  /** 自定义类名 */
  className?: string;
  /** 日期格式 */
  dateFormat?: string;
  /** 是否显示时间选择 */
  showTimeSelect?: boolean;
  /** 时间格式 */
  timeFormat?: string;
  /** 时间间隔（分钟） */
  timeIntervals?: number;
  /** 开始日期（用于范围选择） */
  startDate?: Date | null;
  /** 结束日期（用于范围选择） */
  endDate?: Date | null;
  /** 选择开始日期 */
  selectsStart?: boolean;
  /** 选择结束日期 */
  selectsEnd?: boolean;
}

export const CustomDatePicker = React.forwardRef<HTMLButtonElement, DatePickerProps>(
  (
    {
      selected,
      onChange,
      placeholder = "选择日期",
      minDate,
      maxDate,
      showClearButton = true,
      disabled = false,
      className,
      dateFormat = "yyyy年MM月dd日",
      showTimeSelect = false,
      timeFormat = "HH:mm",
      timeIntervals = 30,
      startDate,
      endDate,
      selectsStart = false,
      selectsEnd = false,
    },
    ref
  ) => {
    // 自定义输入框组件
    const CustomInput = React.forwardRef<HTMLButtonElement, any>(
      ({ value, onClick }, inputRef) => (
        <Button
          variant="outline"
          onClick={onClick}
          ref={inputRef}
          disabled={disabled}
          className={cn(
            "justify-start text-left font-normal w-[140px]",
            !value && "text-muted-foreground",
            disabled && "opacity-50 cursor-not-allowed",
            className
          )}
        >
          <Calendar className="mr-2 h-4 w-4 flex-shrink-0" />
          <span className="truncate">{value || placeholder}</span>
        </Button>
      )
    );

    CustomInput.displayName = 'CustomInput';

    const finalDateFormat = showTimeSelect
      ? `${dateFormat} ${timeFormat}`
      : dateFormat;

    return (
      <div className="relative inline-block">
        <DatePicker
          selected={selected}
          onChange={onChange}
          locale="zh-cn"
          dateFormat={finalDateFormat}
          showMonthDropdown
          showYearDropdown
          dropdownMode="select"
          yearDropdownItemNumber={10}
          isClearable={false} // 我们使用自定义清除按钮
          disabled={disabled}
          customInput={<CustomInput />}
          popperClassName="custom-datepicker-spacing"
          popperPlacement="bottom-start"
          minDate={minDate}
          maxDate={maxDate}
          showTimeSelect={showTimeSelect}
          timeFormat={timeFormat}
          timeIntervals={timeIntervals}
          timeCaption="时间"
          startDate={startDate}
          endDate={endDate}
          selectsStart={selectsStart}
          selectsEnd={selectsEnd}
          ref={ref as any}
          renderCustomHeader={({
                                   date,
                                   changeYear,
                                   changeMonth,
                                   decreaseMonth,
                                   increaseMonth,
                                   prevMonthButtonDisabled,
                                   nextMonthButtonDisabled,
                               }) => (
              <div className="flex items-center justify-between px-4 py-2">
                  {/* 上月按钮 */}
                  <button
                      type="button"
                      onClick={decreaseMonth}
                      disabled={prevMonthButtonDisabled}
                      className="p-1 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                      <ChevronLeft className="h-4 w-4" />
                  </button>

                  <div className="flex items-center gap-2 flex-1 justify-center">

                      {/* 年份下拉框 */}
                      <select
                          value={date.getFullYear()}
                          onChange={({ target: { value } }) => changeYear(parseInt(value))}
                          className="px-2 py-1 border rounded text-sm"
                      >
                          {Array.from({ length: 42 }, (_, i) => {
                              const year = new Date().getFullYear() - 40 + i;
                              return (
                                  <option key={year} value={year}>
                                      {year} 年
                                  </option>
                              );
                          })}
                      </select>

                      {/* 月份下拉框 */}
                      <select
                          value={date.getMonth()}
                          onChange={({ target: { value } }) => changeMonth(parseInt(value))}
                          className="px-2 py-1 border rounded text-sm"
                      >
                          {Array.from({ length: 12 }, (_, i) => (
                              <option key={i} value={i}>
                                  {i + 1} 月
                              </option>
                          ))}
                      </select>
                  </div>

                  {/* 下月按钮 */}
                  <button
                      type="button"
                      onClick={increaseMonth}
                      disabled={nextMonthButtonDisabled}
                      className="p-1 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                      <ChevronRight className="h-4 w-4" />
                  </button>
              </div>
          )}
        />

        {showClearButton && selected && !disabled && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute -top-2 -right-2 h-5 w-5 p-0 rounded-full  bg-gray-50 border border-gray-300 hover:bg-gray-200"
            onClick={() => onChange(null)}
            type="button"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
    );
  }
);

CustomDatePicker.displayName = "CustomDatePicker";

export default CustomDatePicker;