import {useEffect, useState} from 'react';

/**
 * 防抖Hook - 对值进行防抖处理
 * @param value 需要防抖的值
 * @param delay 防抖延迟时间（毫秒）
 * @returns 防抖后的值
 */
export function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        // 如果value为空，则不进行防抖处理，立即更新
        if (value === null || value === undefined || (typeof value === 'string' && value.trim() === '')) {
            setDebouncedValue(value);
            return;
        }

        // 设置一个定时器，在delay时间后更新防抖值
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        // 清理函数，取消之前的定时器
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
}