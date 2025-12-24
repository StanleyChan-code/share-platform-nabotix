/**
 * 用户认证工具类
 * 提供读取已加载的用户信息、所属机构信息和权限列表的方法
 */
import {institutionApi} from "@/integrations/api/institutionApi.ts";
import {getCurrentUser, getCurrentUserRoles} from "@/integrations/api/authApi.ts";

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
export function getCurrentUserInfoFromSession(): UserInfo | null {
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
export function getCurrentUserFromSession(){
  const userInfo = getCurrentUserInfoFromSession();
  return userInfo ? userInfo.user : null;
}

/**
 * 获取当前用户的角色权限列表
 * @returns 用户角色数组，如果未登录则返回空数组
 */
export function getCurrentUserRolesFromSession() {
  const userInfo = getCurrentUserInfoFromSession();
  return userInfo ? userInfo.roles : [];
}

/**
 * 刷新用户信息
 */
export async function refreshUserInfo() {
  // 并行获取用户信息和角色
  const [userResponse, rolesResponse] = await Promise.all([
    getCurrentUser(),
    getCurrentUserRoles()
  ]);

  if (!userResponse.data.success || !rolesResponse.data.success) {
    throw new Error("获取用户信息失败");
  }

  const userProfile = userResponse.data.data;
  const userRoles = rolesResponse.data.data;

  // 获取机构信息（如果有）
  let institution = null;
  if (userProfile.institutionId) {
    try {
      const institutionResponse = await institutionApi.getInstitutionById(userProfile.institutionId);
      if (institutionResponse.success) {
        institution = institutionResponse.data;
      }
    } catch (error) {
      console.warn("获取机构信息失败:", error);
    }
  }

  // 存储用户信息
  const userInfo = {
    user: userProfile,
    roles: userRoles,
    institution: institution
  };

  sessionStorage.setItem('userInfo', JSON.stringify(userInfo));
  return userInfo;
}