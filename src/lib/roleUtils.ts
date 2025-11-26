// 角色中文映射
export const ROLE_DISPLAY_NAMES: Record<string, string> = {
  'public_visitor': '公共访客',
  'registered_researcher': '注册研究员',
  'data_provider': '数据提供者',
  'institution_supervisor': '机构管理员',
  'platform_admin': '平台管理员'
};

/**
 * 将英文角色名转换为中文显示名称
 * @param role 英文角色名
 * @returns 中文显示名称，如果未定义则返回原始英文名
 */
export function getRoleDisplayName(role: string): string {
  return ROLE_DISPLAY_NAMES[role] || role;
}

/**
 * 获取用户的所有角色并转换为中文显示名称
 * @param roles 英文角色名数组
 * @returns 中文显示名称数组
 */
export function getUserRoleDisplayNames(roles: string[]): string[] {
  return roles.map(role => getRoleDisplayName(role));
}