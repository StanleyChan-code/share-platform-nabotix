import {api} from "@/integrations/api/client";
import {Dataset} from "@/integrations/api/datasetApi.ts";
import {RelatedUsersDto, UserDto} from "@/integrations/api/userApi.ts";

// 定义研究成果相关接口
export interface ResearchOutput {
    id: string;
    dataset: Dataset | null;
    submitter: UserDto;
    type: string;
    otherType: string | null;
    title: string;
    abstractText: string;
    outputNumber: string;
    value: number;
    publicationUrl: string | null;
    fileId: string | null;
    createdAt: string;
    approved: boolean | null;
    approver: UserDto | null;
    approvedAt: string | null;
    rejectionReason: string | null;
    otherInfo: Record<string, any>;
}

export interface OutputStatistics {
    totalApprovedOutputs: number;
    academicPapers: number;
    patentOutputs: number;
    totalCitations: number;
}

export interface Pagination {
    size: number;
    number: number;
    totalElements: number;
    totalPages: number;
}

export interface PaginatedOutputs {
    content: ResearchOutput[];
    page: Pagination;
}

// 研究成果API函数
export const outputApi = {
    // 获取研究成果统计信息
    async getOutputStatistics() {
        const response = await api.get<OutputStatistics>('/research-outputs/statistics');
        return response.data;
    },

    // 获取高价值研究成果列表
    async getHighValueOutputs(params: {
        page?: number;
        size?: number;
        minValue?: number;
    } = {}) {
        const queryParams = new URLSearchParams();
        queryParams.append('page', params.page?.toString() || '0');
        queryParams.append('size', params.size?.toString() || '10');
        if (params.minValue !== undefined) queryParams.append('minValue', params.minValue.toString());

        const response = await api.get<PaginatedOutputs>(`/research-outputs/high-value-public?${queryParams.toString()}`);
        return response.data.data;
    },

    // 分页获取已审核通过的研究成果列表
    async getPublicOutputs(params: {
        page?: number;
        size?: number;
        sortBy?: string;
        sortDir?: string;
        type?: string;
        titleOrAbstract?: string;
    } = {}) {
        const queryParams = new URLSearchParams();
        queryParams.append('page', params.page?.toString() || '0');
        queryParams.append('size', params.size?.toString() || '10');
        if (params.sortBy) queryParams.append('sortBy', params.sortBy);
        if (params.sortDir) queryParams.append('sortDir', params.sortDir);
        if (params.type) queryParams.append('type', params.type.toUpperCase());
        if (params.titleOrAbstract) queryParams.append('titleOrAbstract', params.titleOrAbstract);

        const response = await api.get<PaginatedOutputs>(`/research-outputs/public?${queryParams.toString()}`);
        return response.data.data;
    },

    // 根据PubMed ID获取文章信息
    async getPubMedOutput(pubMedId: string) {
        const response = await api.get<ResearchOutput>(`/research-outputs/pubmed/${pubMedId}`);
        return response.data.data;
    },

    // 用户提交新的研究成果
    async submitOutput(output: {
        datasetId: string;
        type: string;
        otherType: string | null;
        title: string;
        abstractText: string;
        outputNumber: string;
        value: number;
        publicationUrl: string;
        fileId: string;
        otherInfo: Record<string, any>;
    }) {
        const response = await api.post<ResearchOutput>('/research-outputs', output);
        return response.data.data;
    },

    // 用户查询自己提交的研究成果列表
    async getMySubmissions(params: {
        status?: string;
        page?: number;
        size?: number;
        sortBy?: string;
        sortDir?: string;
    } = {}) {
        const queryParams = new URLSearchParams();
        if (params.status) queryParams.append('status', params.status);
        queryParams.append('page', params.page?.toString() || '0');
        queryParams.append('size', params.size?.toString() || '10');
        if (params.sortBy) queryParams.append('sortBy', params.sortBy);
        if (params.sortDir) queryParams.append('sortDir', params.sortDir);

        const response = await api.get<PaginatedOutputs>(`/research-outputs/my-submissions?${queryParams.toString()}`);
        return response.data.data;
    },

    // 用户更新自己提交的研究成果
    async updateOutput(id: string, output: {
        datasetId: string;
        type: string;
        otherType: string | null;
        title: string;
        abstractText: string;
        outputNumber: string;
        value: number;
        publicationUrl: string;
        fileId: string;
        otherInfo: Record<string, any>;
    }) {
        const response = await api.put<ResearchOutput>(`/research-outputs/${id}`, output);
        return response.data.data;
    },

    // 用户获取自己提交的研究成果文件下载令牌
    async getDownloadOutputFileToken(id: string, fileId: string) {
        return await api.getDownloadToken(`/research-outputs/my-submissions/${id}/files/${fileId}`);
    },

    // 管理员获取研究成果文件下载令牌
    async getDownloadManagedOutputFileToken(id: string, fileId: string) {
        return await api.getDownloadToken(`/manage/research-outputs/${id}/files/${fileId}`);
    },

    // 根据ID获取单个公开的研究成果
    async getPublicOutputById(id: string) {
        const response = await api.get<ResearchOutput>(`/research-outputs/${id}`);
        return response.data;
    },

    async getManagedOutputById(id: string) {
        const response = await api.get<ResearchOutput>(`/manage/research-outputs/${id}`);
        return response.data;
    },

    // 获取科研成果相关用户信息
    async getRelatedUsers(id: string) {
        const response = await api.get<RelatedUsersDto>(`/research-outputs/${id}/related-users`);
        return response.data;
    }

};