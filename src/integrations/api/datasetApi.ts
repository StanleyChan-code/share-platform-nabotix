import {api} from "@/integrations/api/client";
import {Page} from "@/integrations/api/client";
import {formatISOString} from "@/lib/utils.ts";
import {RelatedUsersDto, UserDto} from "@/integrations/api/userApi.ts";

// 定义数据集相关接口
export interface Dataset {
    // 基本信息
    id: string;
    titleCn: string;
    description: string;
    type: string; // 数据集类型，如 "COHORT"
    datasetLeader: string;
    principalInvestigator: string;
    dataCollectionUnit: string;
    startDate: string; // ISO格式日期时间
    endDate: string; // ISO格式日期时间
    keywords: string[];
    category?: string; // 过时不用，请使用subjectArea
    samplingMethod: string;
    published: boolean;
    shareAllData: boolean;
    contactPerson: string;
    contactInfo: string;
    demographicFields: string[] | Record<string, string>; // 可能是数组或键值对对象
    outcomeFields: string[] | Record<string, string>; // 可能是数组或键值对对象
    firstPublishedDate: string; // ISO格式日期时间
    currentVersionDate: string; // ISO格式日期时间
    createdAt: string;
    updatedAt: string; // ISO格式日期时间
    searchCount: number;

    // 关联信息
    subjectArea: {
        id: string;
        name: string;
    };
    provider: UserDto;

    institutionId: string | null;

    // 父级数据集关系
    parentDatasetId?: string;

    // 版本信息
    versions: DatasetVersion[];

    // 时间轴视图中的随访数据集（在特定接口中提供）
    followUpDatasets?: Dataset[];

    // 申请机构限制
    applicationInstitutionIds?: string[] | null;
}

export interface DatasetVersion {
    id: string;
    datasetId: string;
    versionNumber: string;
    createdAt: string; // ISO格式日期时间
    publishedDate: string | null; // ISO格式日期时间或null
    description: string;
    recordCount: number;
    variableCount: number;
    approved: boolean | null;
    approvedAt: string | null; // ISO格式日期时间或null
    rejectReason: string | null;
    supervisor: UserDto | null;

    // 文件记录ID（管理接口中使用）
    fileRecordId?: string;
    dataDictRecordId?: string;
    termsAgreementRecordId?: string;
    dataSharingRecordId?: string;
}

// 定义研究学科结构
export interface ResearchSubject {
    id: string;
    name: string;
    nameEn: string;
    description: string;
    active: boolean;
    createdAt: string;
    updatedAt: string;
    searchCount: number;
}

// 分页查询参数
export interface Pageable {
    page?: number;
    size?: number;
    sortBy?: string;
    sortDir?: 'asc' | 'desc';
}

// 查询参数接口
export interface DatasetQueryParams {
    subjectAreaId?: string;
    titleCnOrKey?: string;
    providerId?: string;
    isTopLevel?: boolean;
    startDate?: string;
    endDate?: string;
    loadTimeline?: boolean;
}

// 创建数据集请求参数
export interface CreateDatasetRequest {
    titleCn: string;
    description: string;
    type: string;
    datasetLeader: string;
    principalInvestigator: string;
    dataCollectionUnit: string;
    startDate: string;
    endDate: string;
    keywords: string[];
    subjectAreaId: string;
    category?: string;
    samplingMethod: string;
    published: boolean;
    shareAllData: boolean;
    contactPerson: string;
    contactInfo: string;
    demographicFields: string[] | Record<string, string>;
    outcomeFields: string[] | Record<string, string>;
    parentDatasetId?: string;
    applicationInstitutionIds?: string[] | null;
    versionNumber: string;
    versionDescription: string;
    fileRecordId: string;
    dataDictRecordId: string;
    termsAgreementRecordId: string;
    dataSharingRecordId: string;
    recordCount: number;
    variableCount: number;
}

// 更新数据集基本信息请求参数
export interface UpdateDatasetBasicInfoRequest {
    description: string;
    keywords: string[];
    published: boolean;
    shareAllData: boolean;
    contactPerson: string;
    contactInfo: string;
    samplingMethod: string;
    applicationInstitutionIds: string[] | null;
}

// 添加数据集版本请求参数
export interface AddDatasetVersionRequest {
    versionNumber: string;
    description: string;
    fileRecordId: string;
    dataDictRecordId: string;
    termsAgreementRecordId: string;
    dataSharingRecordId: string;
    recordCount: number;
    variableCount: number;
}

// 更新数据集版本审核状态请求参数
export interface UpdateDatasetVersionApprovalRequest {
    approved: boolean;
    rejectionReason?: string;
}

// 数据集API函数
export const datasetApi = {
    // 获取数据集详情
    async getDatasetById(id: string) {
        const response = await api.get<Dataset>(`/datasets/${id}`);
        return response.data;
    },

    // 获取研究学科领域
    async getResearchSubjects() {
        const response = await api.get<ResearchSubject[]>('/research-subjects');
        return response.data;
    },

    // 根据条件查询数据集
    async queryDatasets(params: {
        page?: number;
        size?: number;
        searchTerm?: string;
        type?: string;
        isTopLevel?: boolean;
        providerId?: string;
        subjectAreaId?: string;
        institutionId?: string;
        dateFrom?: string | Date | null;
        dateTo?: string | Date | null;
        loadTimeline?: boolean;
        sortBy?: string;
    }) {
        const queryParams = new URLSearchParams();
        queryParams.append('loadTimeline', String(params.loadTimeline ?? true));

        if (params.page !== undefined) queryParams.append('page', params.page.toString());
        if (params.size !== undefined) queryParams.append('size', params.size.toString());
        if (params.searchTerm) queryParams.append('titleCnOrKey', params.searchTerm);
        if (params.type && params.type !== 'all') queryParams.append('type', params.type);
        if (params.isTopLevel !== undefined) queryParams.append('isTopLevel', params.isTopLevel.toString());
        if (params.providerId) queryParams.append('providerId', params.providerId);
        if (params.institutionId) queryParams.append('institutionId', params.institutionId);
        if (params.subjectAreaId) queryParams.append('subjectAreaId', params.subjectAreaId);
        if (params.dateFrom) queryParams.append('startDate', formatISOString(params.dateFrom));
        if (params.dateTo) queryParams.append('endDate', formatISOString(params.dateTo));
        if (params.sortBy) {
            queryParams.append('sortBy', params.sortBy)
        } else {
            queryParams.append('sortBy', 'firstPublishedDate')
        }

        const response = await api.get<Page<Dataset>>(`/datasets/query?${queryParams}`);
        return response.data;
    },

    // 获取数据集时间轴（随访数据集）
    async getDatasetTimeline(id: string) {
        const response = await api.get<Dataset[]>(`/datasets/${id}/timeline`);
        return response.data;
    },

    // 获取用户已审核通过申请的数据集列表
    async getMyApprovedDatasets(params?: Pageable) {
        const queryParams = new URLSearchParams();
        if (params?.page !== undefined) queryParams.append('page', params.page.toString());
        if (params?.size !== undefined) queryParams.append('size', params.size.toString());

        const response = await api.get<Page<Dataset>>(`/datasets/my-approved?${queryParams.toString()}`);
        return response.data;
    },

    // 管理接口 - 获取所有管理的数据集列表（分页）
    async getManageableDatasets(params?: Pageable) {
        const queryParams = new URLSearchParams();
        if (params?.page !== undefined) queryParams.append('page', params.page.toString());
        if (params?.size !== undefined) queryParams.append('size', params.size.toString());
        if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
        if (params?.sortDir) queryParams.append('sortDir', params.sortDir);

        const response = await api.get<Page<Dataset>>(`/manage/datasets?${queryParams.toString()}`);
        return response.data;
    },

    // 管理接口 - 根据ID获取特定管理的数据集
    async getManageableDatasetById(id: string) {
        const response = await api.get<Dataset>(`/manage/datasets/${id}`);
        return response.data;
    },
    // 高级搜索数据集接口
    async advancedSearchDatasets(params: {
        hasPendingVersion?: boolean;
        institutionId?: string;
        isTopLevel?: boolean;
        page?: number;
        providerId?: string;
        size?: number;
        sortBy?: string;
        sortDir?: "asc" | "desc";
        subjectAreaId?: string;
        titleCnOrKey?: string;
        startDate?: string;
        endDate?: string;
        type?: string;
        published?: boolean;
    }) {
        const queryParams = new URLSearchParams();

        if (params.institutionId) queryParams.append('institutionId', params.institutionId);
        if (params.subjectAreaId) queryParams.append('subjectAreaId', params.subjectAreaId);
        if (params.titleCnOrKey) queryParams.append('titleCnOrKey', params.titleCnOrKey);
        if (params.providerId) queryParams.append('providerId', params.providerId);
        if (params.isTopLevel !== undefined) queryParams.append('isTopLevel', String(params.isTopLevel));
        if (params.startDate) queryParams.append('startDate', params.startDate);
        if (params.endDate) queryParams.append('endDate', params.endDate);
        if (params.type) queryParams.append('type', params.type);
        if (params.published !== undefined) queryParams.append('published', String(params.published));
        if (params.hasPendingVersion !== undefined) queryParams.append('hasPendingVersion', String(params.hasPendingVersion));

        // 分页参数
        queryParams.append('page', (params.page ?? 0).toString());
        queryParams.append('size', (params.size ?? 10).toString());
        queryParams.append('sortBy', params.sortBy ?? 'firstPublishedDate');
        queryParams.append('sortDir', params.sortDir ?? 'desc');

        const response = await api.get<Page<Dataset>>(`/manage/datasets/advanced?${queryParams.toString()}`);
        return response.data;
    },


    // 管理接口 - 创建新的数据集
    async createDataset(data: CreateDatasetRequest) {
        const response = await api.post<Dataset>('/manage/datasets', data);
        return response.data;
    },

    // 管理接口 - 更新现有数据集基本信息
    async updateDatasetBasicInfo(id: string, data: UpdateDatasetBasicInfoRequest) {
        const response = await api.put<Dataset>(`/manage/datasets/${id}/basic-info`, data);
        return response.data;
    },

    // 管理接口 - 为现有数据集添加新版本
    async addDatasetVersion(id: string, data: AddDatasetVersionRequest) {
        const response = await api.post<DatasetVersion>(`/manage/datasets/${id}/versions`, data);
        return response.data;
    },

    // 管理接口 - 更新数据集版本审核状态
    async updateDatasetVersionApproval(
        datasetId: string,
        datasetVersionId: string,
        data: UpdateDatasetVersionApprovalRequest
    ) {
        const response = await api.put<DatasetVersion>(
            `/manage/datasets/${datasetId}/${datasetVersionId}/approval`,
            data
        );
        return response.data;
    },

    // 管理接口 - 根据标题模糊搜索数据集列表
    async searchManageableDatasets(title: string, params?: Pageable) {
        const queryParams = new URLSearchParams();
        queryParams.append('title', title);

        if (params?.page !== undefined) queryParams.append('page', params.page.toString());
        if (params?.size !== undefined) queryParams.append('size', params.size.toString());
        if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
        if (params?.sortDir) queryParams.append('sortDir', params.sortDir);

        const response = await api.get<Page<Dataset>>(`/manage/datasets/search?${queryParams.toString()}`);
        return response.data;
    },

    // 下载数据集版本的数据字典文件
    async downloadDataDictionary(datasetId: string, versionId: string) {
        const response = await api.downloadFile(`/datasets/${datasetId}/versions/${versionId}/data-dictionary`);
        return response.data;
    },

    // 下载数据集版本的使用协议文件
    async downloadTermsAgreement(datasetId: string, versionId: string) {
        const response = await api.downloadFile(`/datasets/${datasetId}/versions/${versionId}/terms-agreement`);
        return response.data;
    },

    // 下载数据集版本的数据分享文件
    async downloadDataSharing(datasetId: string, versionId: string) {
        const response = await api.downloadFile(`/datasets/${datasetId}/versions/${versionId}/data-sharing`);
        return response.data;
    },

    // 软删除数据集
    async deleteDataset(id: string) {
        const response = await api.delete<void>(`/datasets/${id}`);
        return response.data;
    },
    
    // 获取数据集关联的已批准研究成果
    async getApprovedResearchOutputs(datasetId: string, page: number = 0, size: number = 10) {
        const response = await api.get<Page<any>>(`/datasets/${datasetId}/approved-research-outputs?page=${page}&size=${size}`);
        return response.data;
    },

    // 获取数据集关联的用户（审核员、机构管理员、数据集提供者）
    async getDatasetRelatedUsers(id: string) {
        const response = await api.get<RelatedUsersDto>(`/datasets/${id}/related-users`);
        return response.data;
    }

};