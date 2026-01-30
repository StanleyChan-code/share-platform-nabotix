import { ChunkTask, UploadState } from './types';
import {formatFileSize} from "@/lib/utils.ts";

export class FileValidator {
    static validateFile(
        file: File,
        acceptedTypes: string[] = [],
        allowAllTypes: boolean = false,
        maxSize: number = 10 * 1024 * 1024 * 1024
    ): { isValid: boolean; error?: string } {
        if (file.size > maxSize) {
            return {
                isValid: false,
                error: `文件大小不能超过 ${formatFileSize(maxSize)}`
            };
        }

        if (!allowAllTypes && acceptedTypes.length > 0) {
            const isValidType = this.validateFileType(file, acceptedTypes);
            if (!isValidType) {
                return {
                    isValid: false,
                    error: `文件类型不支持。支持的类型: ${acceptedTypes.join(', ')}`
                };
            }
        }

        return { isValid: true };
    }

    private static validateFileType(file: File, acceptedTypes: string[]): boolean {
        const fileName = file.name.toLowerCase();
        return acceptedTypes.some(type => {
            const normalizedType = type.toLowerCase().startsWith('.')
                ? type.toLowerCase()
                : `.${type.toLowerCase()}`;
            return fileName.endsWith(normalizedType);
        });
    }

    static getAcceptString(acceptedTypes: string[], allowAllTypes: boolean): string {
        if (allowAllTypes || acceptedTypes.length === 0) return '*';
        return acceptedTypes.join(',');
    }
}

export class UploadQueue {
    private queue: ChunkTask[] = [];
    private activeTasks: Set<number> = new Set();
    private completedTasks: Set<number> = new Set();
    private failedTasks: Set<number> = new Set();
    private maxConcurrent: number;

    constructor(maxConcurrent: number = 3) {
        this.maxConcurrent = maxConcurrent;
    }

    addTasks(tasks: ChunkTask[]): void {
        this.queue.push(...tasks);
    }

    getNextTask(): ChunkTask | undefined {
        if (this.activeTasks.size >= this.maxConcurrent) return undefined;

        // 优先处理非永久性错误的任务
        const normalTask = this.queue.find(task => !task.isPermanentError);
        if (normalTask) {
            this.queue = this.queue.filter(t => t !== normalTask);
            return normalTask;
        }

        // 如果没有正常任务，处理永久性错误的任务
        const permanentErrorTask = this.queue.find(task => task.isPermanentError);
        if (permanentErrorTask) {
            this.queue = this.queue.filter(t => t !== permanentErrorTask);
            return permanentErrorTask;
        }

        return undefined;
    }

    // 添加检查是否所有任务都已完成的方法
    isComplete(totalChunks: number): boolean {
        return this.completedTasks.size + this.failedTasks.size >= totalChunks;
    }

    // 获取剩余任务数量
    getRemainingCount(): number {
        return this.queue.length + this.activeTasks.size;
    }

    addActiveTask(chunkIndex: number): void {
        this.activeTasks.add(chunkIndex);
    }

    removeActiveTask(chunkIndex: number): void {
        this.activeTasks.delete(chunkIndex);
    }

    addCompletedTask(chunkIndex: number): void {
        this.completedTasks.add(chunkIndex);
        this.failedTasks.delete(chunkIndex);
    }

    addFailedTask(chunkIndex: number): void {
        this.failedTasks.add(chunkIndex);
    }

    getActiveCount(): number {
        return this.activeTasks.size;
    }

    get completedTasksSet(): Set<number> {
        return new Set(this.completedTasks); // 返回副本
    }

    get completedChunksArray(): number[] {
        return Array.from(this.completedTasks);
    }

    getCompletedCount(): number {
        return this.completedTasks.size;
    }

    getFailedCount(): number {
        return this.failedTasks.size;
    }

    getQueueLength(): number {
        return this.queue.length;
    }

    hasPendingTasks(): boolean {
        return this.queue.length > 0 || this.activeTasks.size > 0;
    }

    allTasksCompleted(): boolean {
        return this.completedCount + this.failedCount >= this.totalTasks;
    }

    get totalTasks(): number {
        return this.queue.length + this.activeTasks.size + this.completedTasks.size + this.failedTasks.size;
    }

    get completedCount(): number {
        return this.completedTasks.size;
    }

    get failedCount(): number {
        return this.failedTasks.size;
    }

    clear(): void {
        this.queue = [];
        this.activeTasks.clear();
        this.completedTasks.clear();
        this.failedTasks.clear();
    }
}

export class ProgressCalculator {
    // 只计算已完成分片的进度
    static calculateChunkedProgress(
        totalChunks: number,
        completedChunksCount: number,
        activeChunksProgress: { [chunkIndex: number]: number }
    ): number {
        if (totalChunks === 0) return 0;

        // 只计算已完成分片的进度，不考虑进行中分片的部分进度
        const progress = Math.round((completedChunksCount / totalChunks) * 100);
        return Math.min(progress, 100);
    }

    // 原有的方法保持不变，确保向后兼容
    static calculateProgressSafe(
        totalChunks: number,
        completedChunksCount: number,
        chunkProgress: { [key: number]: number } = {}
    ): number {
        return this.calculateChunkedProgress(totalChunks, completedChunksCount, chunkProgress);
    }
}

// 错误分类器
export class ErrorClassifier {
    static isPermanentError(error: any): boolean {
        // 4xx 和 5xx 错误视为永久性错误
        const status = error.response?.status;
        if (status >= 400 && status < 600) {
            return true;
        }

        // 权限相关的错误消息
        const message = error.message?.toLowerCase() || '';
        return message.includes('permission') ||
            message.includes('auth') ||
            message.includes('forbidden') ||
            message.includes('unauthorized');
    }

    static isNetworkError(error: any): boolean {
        const message = error.message?.toLowerCase() || '';
        return message.includes('network') ||
            message.includes('connection') ||
            message.includes('timeout') ||
            message.includes('refused') ||
            error.code === 'NETWORK_ERROR' ||
            error.code === 'ECONNREFUSED';
    }
}