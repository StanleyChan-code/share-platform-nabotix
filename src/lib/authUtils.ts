/**
 * 用户认证工具类
 * 提供读取已加载的用户信息、所属机构信息和权限列表的方法
 */

export interface UserInfo {
  user: {
    id: string;
    username: string;
    realName: string;
    email: string;
    phone: string;
    institutionId: string;
    password: string | null;
    idType: string | null;
    idNumber: string | null;
    education: string | null;
    title: string | null;
    field: string | null;
    supervisorId: string | null;
    createdAt: string;
    updatedAt: string;
  };
  roles: string[];
  institution: any | null;
}

/**
 * 从 sessionStorage 中获取当前用户信息
 * @returns 用户信息对象，如果未登录则返回 null
 */
export function getCurrentUserInfo(): UserInfo | null {
  try {
    const token = localStorage.getItem('authToken');
    const userInfoStr = sessionStorage.getItem('userInfo');
    
    // 只有当 authToken 和 userInfo 都存在时才返回用户信息
    if (token && userInfoStr) {
      return JSON.parse(userInfoStr);
    }
    
    return null;
  } catch (error) {
    console.error('解析用户信息失败:', error);
    return null;
  }
}

/**
 * 获取当前用户基本信息
 * @returns 用户基本信息对象，如果未登录则返回 null
 */
export function getCurrentUser(){
  const userInfo = getCurrentUserInfo();
  return userInfo ? userInfo.user : null;
}

/**
 * 获取当前用户的角色权限列表
 * @returns 用户角色数组，如果未登录则返回空数组
 */
export function getCurrentUserRoles() {
  const userInfo = getCurrentUserInfo();
  return userInfo ? userInfo.roles : [];
}

/**
 * 获取当前用户所属机构信息
 * @returns 机构信息对象，如果未登录或用户无机构则返回 null
 */
export function getCurrentUserInstitution() {
  const userInfo = getCurrentUserInfo();
  return userInfo ? userInfo.institution : null;
}

/**
 * 检查用户是否具有指定角色
 * @param role 要检查的角色
 * @returns 如果用户具有指定角色则返回 true，否则返回 false
 */
export function hasRole(role: string): boolean {
  const roles = getCurrentUserRoles();
  return roles.includes(role);
}

/**
 * 检查用户是否已登录
 * @returns 如果用户已登录则返回 true，否则返回 false
 */
export function isAuthenticated(): boolean {
  return getCurrentUserInfo() !== null;
}

/**
 * 检查用户是否为管理员
 * @returns 如果用户是管理员则返回 true，否则返回 false
 */
export function isAdmin(): boolean {
  const roles = getCurrentUserRoles();
  return roles.includes('PLATFORM_ADMIN') || roles.includes('INSTITUTION_SUPERVISOR');
}