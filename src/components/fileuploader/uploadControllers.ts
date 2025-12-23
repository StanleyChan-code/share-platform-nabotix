import { UploadState, UploadController } from './types';

class PauseController {
    private paused = false;
    private listeners: Array<() => void> = [];

    isPaused(): boolean {
        return this.paused;
    }

    setPaused(paused: boolean): void {
        if (this.paused !== paused) {
            this.paused = paused;
            this.notifyListeners();
        }
    }

    subscribe(listener: () => void): () => void {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    async waitForResume(): Promise<void> {
        if (!this.paused) return;

        return new Promise(resolve => {
            const unsubscribe = this.subscribe(() => {
                if (!this.paused) {
                    unsubscribe();
                    resolve();
                }
            });
        });
    }

    private notifyListeners(): void {
        this.listeners.forEach(listener => listener());
    }
}

class NetworkMonitor {
    private online = navigator.onLine;
    private listeners: Array<(online: boolean) => void> = [];

    constructor() {
        this.setupEventListeners();
    }

    private setupEventListeners(): void {
        window.addEventListener('online', () => {
            this.online = true;
            this.notifyListeners(true);
        });

        window.addEventListener('offline', () => {
            this.online = false;
            this.notifyListeners(false);
        });
    }

    isOnline(): boolean {
        return this.online;
    }

    subscribe(listener: (online: boolean) => void): () => void {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    private notifyListeners(online: boolean): void {
        this.listeners.forEach(listener => listener(online));
    }
}

export class UploadControllerImpl implements UploadController {
    private pauseController: PauseController;
    private networkMonitor: NetworkMonitor;
    private uploadState: UploadState;
    private isCancelledFlag = false;
    private maxNetworkErrors: number;
    private onStateChange?: (state: UploadState) => void;

    constructor(maxNetworkErrors: number = 5) {
        this.pauseController = new PauseController();
        this.networkMonitor = new NetworkMonitor();
        this.uploadState = {
            consecutiveNetworkErrors: 0,
            failedChunks: [],
            uploadedChunks: [],
            chunkProgress: {}
        };
        this.maxNetworkErrors = maxNetworkErrors;
    }

    setOnStateChange(callback: (state: UploadState) => void): void {
        this.onStateChange = callback;
    }

    // 网络状态
    isOnline(): boolean {
        return this.networkMonitor.isOnline();
    }

    subscribeToNetwork(callback: (online: boolean) => void): () => void {
        return this.networkMonitor.subscribe(callback);
    }

    // 暂停/恢复控制
    isPaused(): boolean {
        return this.pauseController.isPaused();
    }

    pause(): void {
        this.pauseController.setPaused(true);
    }

    resume(): void {
        this.pauseController.setPaused(false);
    }

    async waitForResume(): Promise<void> {
        return this.pauseController.waitForResume();
    }

    // 取消控制
    isCancelled(): boolean {
        return this.isCancelledFlag;
    }

    cancel(): void {
        this.isCancelledFlag = true;
        this.pauseController.setPaused(false); // 确保可以继续执行取消逻辑
    }

    resetCancelled(): void {
        this.isCancelledFlag = false;
    }

    // 网络错误处理
    handleNetworkError(): boolean {
        const currentErrors = (this.uploadState.consecutiveNetworkErrors || 0) + 1;
        this.updateState({ consecutiveNetworkErrors: currentErrors });

        if (currentErrors >= this.maxNetworkErrors) {
            this.cancel();
            return true; // 应该停止上传
        }
        return false;
    }

    resetNetworkErrorCount(): void {
        this.updateState({ consecutiveNetworkErrors: 0 });
    }

    // 状态管理
    updateState(updates: Partial<UploadState>): void {
        this.uploadState = { ...this.uploadState, ...updates };
        this.onStateChange?.(this.uploadState);
    }

    getState(): UploadState {
        return { ...this.uploadState };
    }

    // 分片管理
    addFailedChunk(chunkIndex: number): void {
        const failedChunks = [...(this.uploadState.failedChunks || []), chunkIndex];
        this.updateState({ failedChunks });
    }

    addUploadedChunk(chunkIndex: number): void {
        const uploadedChunks = [...(this.uploadState.uploadedChunks || []), chunkIndex];
        this.updateState({ uploadedChunks });
        this.resetNetworkErrorCount(); // 成功上传后重置错误计数
    }

    getFailedChunks(): number[] {
        return this.uploadState.failedChunks || [];
    }

    getUploadedChunks(): number[] {
        return this.uploadState.uploadedChunks || [];
    }
}