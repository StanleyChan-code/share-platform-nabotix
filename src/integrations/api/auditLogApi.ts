import { api, Page } from './client';

// 审计日志接口
export interface AuditLog {
  id: string;
  instanceId: string;
  instanceType: string;
  action: string;
  resourceTitle: string;
  additionalParams: Record<string, any>;
  createdAt: string;
  ipAddress: string;
  operatorId: string;
}

// 审计日志查询参数
export interface AuditLogParams {
  startTime?: string;
  endTime?: string;
  userId?: string;
  action?: string;
  instanceType?: string;
  instanceId?: string;
  page: number;
  size: number;
  sortBy: string;
  sortDir: string;
}

// 审计日志API函数
export const auditLogApi = {
  /**
   * 查询审计日志（分页）
   */
  async getAuditLogs(params: AuditLogParams) {
    const response = await api.get<Page<AuditLog>>('/manage/audit-logs', {
      params,
    });
    
    // 检查API响应是否成功
    if (response.data.success) {
      return response.data.data;
    } else {
      // 如果响应失败，抛出错误
      throw new Error(response.data.message || '查询审计日志失败');
    }
  },
};