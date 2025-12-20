// 权限角色枚举
export const PermissionRoles = {
  PLATFORM_ADMIN: 'PLATFORM_ADMIN',
  INSTITUTION_SUPERVISOR: 'INSTITUTION_SUPERVISOR',
  INSTITUTION_USER_MANAGER: 'INSTITUTION_USER_MANAGER',
  DATASET_UPLOADER: 'DATASET_UPLOADER',
  DATASET_APPROVER: 'DATASET_APPROVER',
  RESEARCH_OUTPUT_APPROVER: 'RESEARCH_OUTPUT_APPROVER'
} as const;

// 权限角色中文映射
export const PERMISSION_ROLE_DISPLAY_NAMES: Record<string, string> = {
  'PLATFORM_ADMIN': '平台管理员',
  'INSTITUTION_SUPERVISOR': '机构管理员',
  'INSTITUTION_USER_MANAGER': '机构用户管理员',
  'DATASET_UPLOADER': '数据集上传员',
  'DATASET_APPROVER': '数据集审核员',
  'RESEARCH_OUTPUT_APPROVER': '研究成果审核员'
};

/**
 * 将英文权限角色名转换为中文显示名称
 * @param role 英文权限角色名
 * @returns 中文显示名称，如果未定义则返回原始英文名
 */
export function getPermissionRoleDisplayName(role: string): string {
  return PERMISSION_ROLE_DISPLAY_NAMES[role] || role;
}

/**
 * 获取用户的所有权限角色并转换为中文显示名称
 * @param roles 英文权限角色名数组
 * @returns 中文显示名称数组
 */
export function getUserPermissionRoleDisplayNames(roles: string[]): string[] {
  if (!roles) return [];
  return roles.map(role => getPermissionRoleDisplayName(role));
}