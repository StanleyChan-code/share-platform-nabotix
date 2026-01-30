/**
 * 审计日志常量类
 * 用于定义审计日志相关的常量，包括资源类型、操作类型等
 */
export class AuditLogConstants {
    /**
     * 资源类型常量
     */
    public static readonly RESOURCE_TYPE_DATASET = "DATASET";
    public static readonly RESOURCE_TYPE_DATASET_VERSION = "DATASET_VERSION";
    public static readonly RESOURCE_TYPE_APPLICATION = "APPLICATION";
    public static readonly RESOURCE_TYPE_USER = "USER";
    public static readonly RESOURCE_TYPE_INSTITUTION = "INSTITUTION";
    public static readonly RESOURCE_TYPE_RESEARCH_SUBJECT = "RESEARCH_SUBJECT";
    public static readonly RESOURCE_TYPE_RESEARCH_OUTPUT = "RESEARCH_OUTPUT";
    public static readonly RESOURCE_TYPE_FILE = "FILE";
    
    /**
     * 操作类型常量
     */
    public static readonly ACTION_UNKNOWN = "UNKNOWN";
    public static readonly ACTION_CREATE = "CREATE";
    public static readonly ACTION_UPDATE = "UPDATE";
    public static readonly ACTION_DELETE = "DELETE";

    public static readonly ACTION_RESET_APPROVAL_STATUS = "RESET_APPROVAL_STATUS";
    public static readonly ACTION_PROVIDER_APPROVE = "PROVIDER_APPROVE";
    public static readonly ACTION_INSTITUTION_APPROVE = "INSTITUTION_APPROVE";
    public static readonly ACTION_PLATFORM_APPROVE = "PLATFORM_APPROVE";
    public static readonly ACTION_PROVIDER_REJECT = "PROVIDER_REJECT";
    public static readonly ACTION_INSTITUTION_REJECT = "INSTITUTION_REJECT";
    public static readonly ACTION_PLATFORM_REJECT = "PLATFORM_REJECT";

    public static readonly ACTION_ANALYZE = "ANALYZE";

    public static readonly ACTION_UPLOAD = "UPLOAD";
    public static readonly ACTION_INIT_CHUNKED_UPLOAD = "INIT_CHUNKED_UPLOAD";
    public static readonly ACTION_MERGE_CHUNKED_UPLOAD = "MERGE_CHUNKED_UPLOAD";
    public static readonly ACTION_DOWNLOAD = "DOWNLOAD";

    public static readonly ACTION_SEND_VERIFICATION_CODE = "SEND_VERIFICATION_CODE";
    public static readonly ACTION_LOGIN = "LOGIN";
    public static readonly ACTION_LOGOUT = "LOGOUT";
    public static readonly ACTION_REGISTER = "REGISTER";

    public static readonly ACTION_UPDATE_AUTHORITIES = "UPDATE_AUTHORITIES";
    public static readonly ACTION_UPDATE_PHONE = "UPDATE_PHONE";
    public static readonly ACTION_UPDATE_USER_STATUS = "UPDATE_USER_STATUS";
}

/**
 * 操作类型显示名称映射
 */
export const ACTION_DISPLAY_NAMES: Record<string, string> = {
    [AuditLogConstants.ACTION_REGISTER]: "账号注册",
    [AuditLogConstants.ACTION_LOGIN]: "账号登录",
    [AuditLogConstants.ACTION_LOGOUT]: "账号登出",
    [AuditLogConstants.ACTION_SEND_VERIFICATION_CODE]: "发送验证码",

    [AuditLogConstants.ACTION_CREATE]: "创建",
    [AuditLogConstants.ACTION_UPDATE]: "更新",
    [AuditLogConstants.ACTION_DELETE]: "删除",

    // [AuditLogConstants.ACTION_RESET_APPROVAL_STATUS]: "重置审核状态",
    [AuditLogConstants.ACTION_PROVIDER_APPROVE]: "提供者审核通过",
    [AuditLogConstants.ACTION_PROVIDER_REJECT]: "提供者审核拒绝",
    [AuditLogConstants.ACTION_INSTITUTION_APPROVE]: "机构审核通过",
    [AuditLogConstants.ACTION_INSTITUTION_REJECT]: "机构审核拒绝",
    [AuditLogConstants.ACTION_PLATFORM_APPROVE]: "平台审核通过",
    [AuditLogConstants.ACTION_PLATFORM_REJECT]: "平台审核拒绝",

    [AuditLogConstants.ACTION_ANALYZE]: "临时数据分析",

    [AuditLogConstants.ACTION_UPLOAD]: "上传小文件",
    [AuditLogConstants.ACTION_INIT_CHUNKED_UPLOAD]: "初始化分片上传",
    [AuditLogConstants.ACTION_MERGE_CHUNKED_UPLOAD]: "合并分片上传",
    [AuditLogConstants.ACTION_DOWNLOAD]: "下载文件",

    [AuditLogConstants.ACTION_UPDATE_AUTHORITIES]: "更新用户权限",
    [AuditLogConstants.ACTION_UPDATE_PHONE]: "更新手机号",
    [AuditLogConstants.ACTION_UPDATE_USER_STATUS]: "更新用户状态",

    [AuditLogConstants.ACTION_UNKNOWN]: "未知操作",
};