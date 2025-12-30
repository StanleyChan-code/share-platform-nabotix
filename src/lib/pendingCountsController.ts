import { api } from "@/integrations/api/client";
import {isAuthenticated} from "@/lib/authUtils";

// 定义待审核数量类型
interface PendingCounts {
  'research-outputs': number;
  applications: number;
  datasets: number;
  total: number;
}

// 定义事件类型
type PendingCountsEvent = 'refetchOutputPendingCount' | 'refetchApplicationPendingCount' | 'refetchDatasetPendingCount' | 'refetchAllPendingCounts';

class PendingCountsController {
  private counts: PendingCounts = {
    'research-outputs': 0,
    applications: 0,
    datasets: 0,
    total: 0
  };
  
  private listeners: Map<PendingCountsEvent, Array<() => void>> = new Map();
  
  constructor() {
    // 设置定时刷新，每10分钟刷新一次
    setInterval(() => {
      this.refreshAllPendingCounts();
    }, 10 * 60 * 1000); // 10分钟 = 10 * 60 * 1000毫秒
    setTimeout(() => {
      this.refreshAllPendingCounts()
    }, 100);
  }

  // 获取当前所有待审核数量
  getCounts(): PendingCounts {
    return { ...this.counts };
  }

  // 获取单个类型的待审核数量
  getCount(type: keyof Omit<PendingCounts, 'total'>): number {
    return this.counts[type] || 0;
  }

  // 获取总数
  getTotalCount(): number {
    return this.counts.total;
  }

  // 刷新成果待审核数量
  async refreshOutputPendingCount(): Promise<void> {
    try {
      const response = await api.get('/research-outputs/pending-review-count');
      const oldValue = this.counts['research-outputs'];
      this.counts['research-outputs'] = response.data.data?.pendingReviewCount || 0;
      this.updateTotal();
      // 只有当数量发生变化时才触发更新事件
      if (oldValue !== this.counts['research-outputs']) {
        // 触发更新事件，通知所有监听者
        this.notifyListeners('refetchOutputPendingCount');
        this.notifyListeners('refetchAllPendingCounts'); // 同时触发总数更新
      }
    } catch (error) {
      console.error('获取成果待审核数量失败:', error);
    }
  }

  // 刷新申请待审核数量
  async refreshApplicationPendingCount(): Promise<void> {
    try {
      const response = await api.get('/manage/applications/pending-review-count');
      const oldValue = this.counts.applications;
      this.counts.applications = response.data.data?.pendingReviewCount || 0;
      this.updateTotal();
      // 只有当数量发生变化时才触发更新事件
      if (oldValue !== this.counts.applications) {
        // 触发更新事件，通知所有监听者
        this.notifyListeners('refetchApplicationPendingCount');
        this.notifyListeners('refetchAllPendingCounts'); // 同时触发总数更新
      }
    } catch (error) {
      console.error('获取申请待审核数量失败:', error);
    }
  }

  // 刷新数据集待审核数量
  async refreshDatasetPendingCount(): Promise<void> {
    try {
      const response = await api.get('/manage/datasets/pending-review-count');
      const oldValue = this.counts.datasets;
      this.counts.datasets = response.data.data?.pendingReviewCount || 0;
      this.updateTotal();
      // 只有当数量发生变化时才触发更新事件
      if (oldValue !== this.counts.datasets) {
        // 触发更新事件，通知所有监听者
        this.notifyListeners('refetchDatasetPendingCount');
        this.notifyListeners('refetchAllPendingCounts'); // 同时触发总数更新
      }
    } catch (error) {
      console.error('获取数据集待审核数量失败:', error);
    }
  }

  // 刷新所有待审核数量
  async refreshAllPendingCounts(): Promise<void> {
    if (!isAuthenticated()) return;

    try {
      // 并行获取所有待审核数量
      const [outputResponse, applicationResponse, datasetResponse] = await Promise.allSettled([
        api.get('/research-outputs/pending-review-count'),
        api.get('/manage/applications/pending-review-count'),
        api.get('/manage/datasets/pending-review-count')
      ]);

      const oldCounts = { ...this.counts };

      // 处理成果数量
      if (outputResponse.status === 'fulfilled') {
        this.counts['research-outputs'] = outputResponse.value.data.data?.pendingReviewCount || 0;
      } else {
        console.error('获取成果待审核数量失败:', outputResponse.reason);
        this.counts['research-outputs'] = 0;
      }

      // 处理申请数量
      if (applicationResponse.status === 'fulfilled') {
        this.counts.applications = applicationResponse.value.data.data?.pendingReviewCount || 0;
      } else {
        console.error('获取申请待审核数量失败:', applicationResponse.reason);
        this.counts.applications = 0;
      }

      // 处理数据集数量
      if (datasetResponse.status === 'fulfilled') {
        this.counts.datasets = datasetResponse.value.data.data?.pendingReviewCount || 0;
      } else {
        console.error('获取数据集待审核数量失败:', datasetResponse.reason);
        this.counts.datasets = 0;
      }

      this.updateTotal();

      // 检查是否有任何数量发生变化，如果有则触发更新事件
      if (oldCounts['research-outputs'] !== this.counts['research-outputs'] ||
          oldCounts.applications !== this.counts.applications ||
          oldCounts.datasets !== this.counts.datasets) {
        // 触发更新事件，通知所有监听者
        this.notifyListeners('refetchAllPendingCounts');
      }
    } catch (error) {
      console.error('刷新所有待审核数量失败:', error);
    }
  }

  // 更新总数
  private updateTotal(): void {
    this.counts.total = this.counts['research-outputs'] + this.counts.applications + this.counts.datasets;
  }

  // 添加事件监听器
  addEventListener(event: PendingCountsEvent, callback: () => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    const eventListeners = this.listeners.get(event)!;
    eventListeners.push(callback);
  }

  // 移除事件监听器
  removeEventListener(event: PendingCountsEvent, callback: () => void): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      const index = eventListeners.indexOf(callback);
      if (index > -1) {
        eventListeners.splice(index, 1);
      }
    }
  }

  // 通知所有监听器
  private notifyListeners(event: PendingCountsEvent): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => {
        try {
          callback();
        } catch (error) {
          console.error(`执行监听器回调失败:`, error);
        }
      });
    }
  }
  
  // 在登录后立即刷新所有待审核数量
  public refreshAfterLogin(): void {
    this.refreshAllPendingCounts();
  }
}

// 创建全局单例
export const pendingCountsController = new PendingCountsController();

// 导出便捷方法，确保方法绑定到控制器实例
export const getCounts = pendingCountsController.getCounts.bind(pendingCountsController);
export const getCount = pendingCountsController.getCount.bind(pendingCountsController);
export const getTotalCount = pendingCountsController.getTotalCount.bind(pendingCountsController);
export const refreshOutputPendingCount = pendingCountsController.refreshOutputPendingCount.bind(pendingCountsController);
export const refreshApplicationPendingCount = pendingCountsController.refreshApplicationPendingCount.bind(pendingCountsController);
export const refreshDatasetPendingCount = pendingCountsController.refreshDatasetPendingCount.bind(pendingCountsController);
export const refreshAllPendingCounts = pendingCountsController.refreshAllPendingCounts.bind(pendingCountsController);
export const refreshAfterLogin = pendingCountsController.refreshAfterLogin.bind(pendingCountsController);