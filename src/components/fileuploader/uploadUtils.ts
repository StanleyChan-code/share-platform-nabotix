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
    // 新增方法：专门处理分片上传的进度计算
    static calculateChunkedProgress(
        totalChunks: number,
        completedChunksCount: number,
        activeChunksProgress: { [chunkIndex: number]: number }
    ): number {
        if (totalChunks === 0) return 0;

        // 已完成的分片贡献100%
        const completedProgress = completedChunksCount * 100;

        // 进行中的分片贡献当前进度
        const activeProgress = Object.values(activeChunksProgress)
            .filter(progress => progress > 0 && progress < 100) // 只计算0-100之间的进度
            .reduce((sum, progress) => sum + progress, 0);

        const totalProgress = completedProgress + activeProgress;
        return Math.min(Math.round(totalProgress / totalChunks), 100);
    }

    // 原有的方法保持不变
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

export class SpeedCalculator {
    private lastLoaded: number = 0;
    private lastTime: number = 0;
    private speeds: number[] = [];
    private maxSamples: number = 5;
    private totalUploadedBytes: number = 0;
    private speedHistory: { time: number; bytes: number }[] = [];

    calculateSpeed(currentTotalBytes: number): string {
        const now = Date.now();

        // 添加当前数据点到历史记录
        this.speedHistory.push({
            time: now,
            bytes: currentTotalBytes
        });

        // 只保留最近2秒的数据
        const twoSecondsAgo = now - 2000;
        this.speedHistory = this.speedHistory.filter(point => point.time >= twoSecondsAgo);

        if (this.speedHistory.length < 2) {
            return '0 KB/s';
        }

        // 计算最近1秒的平均速度
        const oneSecondAgo = now - 1000;
        const recentPoints = this.speedHistory.filter(point => point.time >= oneSecondAgo);

        if (recentPoints.length < 2) {
            return '0 KB/s';
        }

        const oldestPoint = recentPoints[0];
        const newestPoint = recentPoints[recentPoints.length - 1];
        const timeDiff = (newestPoint.time - oldestPoint.time) / 1000; // 转换为秒
        const bytesDiff = newestPoint.bytes - oldestPoint.bytes;

        // 防止除零和负数
        if (timeDiff <= 0 || bytesDiff < 0) {
            return '0 KB/s';
        }

        const currentSpeed = bytesDiff / timeDiff;

        // 添加到速度数组进行平滑处理
        this.speeds.push(currentSpeed);
        if (this.speeds.length > this.maxSamples) {
            this.speeds.shift();
        }

        // 计算平均速度
        const avgSpeed = this.speeds.length > 0
            ? this.speeds.reduce((sum, speed) => sum + speed, 0) / this.speeds.length
            : 0;

        return this.formatSpeed(avgSpeed);
    }

    addUploadedBytes(bytes: number): void {
        this.totalUploadedBytes = this.safeAdd(this.totalUploadedBytes, bytes);
    }

    getTotalUploadedBytes(): number {
        return this.totalUploadedBytes;
    }

    setTotalUploadedBytes(bytes: number): void {
        this.totalUploadedBytes = Math.max(0, Math.min(bytes, Number.MAX_SAFE_INTEGER));
        this.lastLoaded = this.totalUploadedBytes;
    }

    private safeAdd(a: number, b: number): number {
        const result = a + b;
        if (result > Number.MAX_SAFE_INTEGER) {
            console.warn('Number overflow detected, resetting counter');
            return b;
        }
        if (result < 0) {
            console.warn('Negative number detected, resetting to 0');
            return 0;
        }
        return result;
    }

    private formatSpeed(speed: number): string {
        if (speed < 1024) {
            return `${Math.round(speed)} B/s`;
        } else if (speed < 1024 * 1024) {
            return `${(speed / 1024).toFixed(1)} KB/s`;
        } else if (speed < 1024 * 1024 * 1024) {
            return `${(speed / (1024 * 1024)).toFixed(1)} MB/s`;
        } else {
            return `${(speed / (1024 * 1024 * 1024)).toFixed(2)} GB/s`;
        }
    }

    reset(): void {
        this.lastLoaded = 0;
        this.lastTime = 0;
        this.speeds = [];
        this.totalUploadedBytes = 0;
        this.speedHistory = [];
    }

    getCurrentSpeed(): number {
        if (this.speeds.length === 0) return 0;
        return this.speeds.reduce((sum, speed) => sum + speed, 0) / this.speeds.length;
    }

    getEstimatedTime(totalBytes: number, uploadedBytes: number): string {
        const speed = this.getCurrentSpeed();
        if (speed === 0 || speed < 1) return '--:--';

        if (totalBytes <= uploadedBytes) return '完成';
        if (totalBytes <= 0 || uploadedBytes < 0) return '--:--';

        const remainingBytes = this.safeSubtract(totalBytes, uploadedBytes);
        const remainingSeconds = Math.round(remainingBytes / speed);

        if (remainingSeconds < 0) return '--:--';
        if (remainingSeconds < 60) {
            return `${remainingSeconds}秒`;
        } else if (remainingSeconds < 3600) {
            const minutes = Math.floor(remainingSeconds / 60);
            const seconds = remainingSeconds % 60;
            return `${minutes}分${seconds.toString().padStart(2, '0')}秒`;
        } else {
            const hours = Math.floor(remainingSeconds / 3600);
            const minutes = Math.floor((remainingSeconds % 3600) / 60);
            return `${hours}时${minutes.toString().padStart(2, '0')}分`;
        }
    }

    private safeSubtract(a: number, b: number): number {
        return Math.max(0, a - b);
    }
}