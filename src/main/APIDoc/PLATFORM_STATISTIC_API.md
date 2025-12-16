# 平台统计接口

平台统计信息接口，用于获取平台整体统计数据。

## 1. 平台统计信息接口

### 1.1 获取平台统计数据

**接口地址**: `GET /api/platform/statistics`

**权限要求**: 需要认证

**请求参数**: 无

**说明**: 
- 获取平台整体统计数据，包括已审核通过的数据集总数、注册用户总数、审核通过的研究成果总数、最近30天的申请总数以及各类数据集的数量统计

**响应示例**:
```json
{
  "success": true,
  "message": "平台统计数据获取成功",
  "data": {
    "approvedDatasetCount": 125,
    "registeredUserCount": 86,
    "approvedResearchOutputCount": 42,
    "recentApplicationCount": 18,
    "datasetCountByType": {
      "COHORT": 45,
      "CASE_CONTROL": 32,
      "CROSS_SECTIONAL": 28,
      "RCT": 20,
      "REGISTRY": 15,
      "BIOBANK": 10,
      "OMICS": 8,
      "WEARABLE": 5
    }
  },
  "timestamp": "2025-12-01T10:00:00Z"
}
```