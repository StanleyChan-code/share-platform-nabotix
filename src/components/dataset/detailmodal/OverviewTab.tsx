import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Checkbox } from "@/components/ui/checkbox.tsx";
import {
  Users,
  Database,
  Calendar,
  TrendingUp,
  Building,
  Link,
  Pen,
  User,
  Mail,
  MapPin,
  Share,
  Layers2, SwatchBook, Phone, Eye
} from "lucide-react";
import { formatDate } from "@/lib/utils.ts";
import { Button } from "@/components/ui/button.tsx";
import { useState, useEffect } from "react";
import { DatasetDetailModal } from "@/components/dataset/DatasetDetailModal.tsx";
import { institutionApi } from "@/integrations/api/institutionApi.ts";
import { datasetApi } from "@/integrations/api/datasetApi.ts";
import { toast } from "sonner";
import { InstitutionSelector } from "@/components/admin/institution/InstitutionSelector.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import {canUploadDataset} from "@/lib/permissionUtils.ts";
import { CopyButton } from "@/components/ui/CopyButton.tsx";

interface OverviewTabProps {
  dataset: any;
  recordCount?: number;
  variableCount?: number;
  institution?: any;
  parentDataset?: any;
  onViewParentDataset?: () => void;
  useAdvancedQuery?: boolean;
  onEditDataset?: (updatedDataset: any) => void;
  onDatasetUpdated?: () => void;
}

export function OverviewTab({
                              dataset,
                              recordCount,
                              variableCount,
                              institution,
                              parentDataset,
                              onViewParentDataset,
                              useAdvancedQuery = false,
                              onEditDataset,
                              onDatasetUpdated
                            }: OverviewTabProps) {
  const [isParentDatasetModalOpen, setIsParentDatasetModalOpen] = useState(false);
  const [applicationInstitutions, setApplicationInstitutions] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [loadingInstitutions, setLoadingInstitutions] = useState(false);
  const [editableFields, setEditableFields] = useState({
    description: dataset.description || "",
    contactPerson: dataset.contactPerson || "",
    contactInfo: dataset.contactInfo || "",
    applicationInstitutionIds: dataset.applicationInstitutionIds || null
  });

  // 获取允许申请的机构信息
  useEffect(() => {
    const fetchApplicationInstitutions = async () => {
      if (useAdvancedQuery && dataset.applicationInstitutionIds && dataset.applicationInstitutionIds.length > 0) {
        setLoadingInstitutions(true);
        try {
          const institutions = await Promise.all(
              dataset.applicationInstitutionIds.map((id: string) => institutionApi.getInstitutionById(id))
          );
          setApplicationInstitutions(institutions.map(response => response.data));
        } catch (error) {
          console.error("获取申请机构信息失败:", error);
          toast.error("获取申请机构信息失败");
        } finally {
          setLoadingInstitutions(false);
        }
      } else {
        setApplicationInstitutions([]);
      }
    };

    fetchApplicationInstitutions();
  }, [dataset.applicationInstitutionIds, useAdvancedQuery]);

  const handleEditClick = () => {
    setIsEditing(true);
    setEditableFields({
      description: dataset.description || "",
      contactPerson: dataset.contactPerson || "",
      contactInfo: dataset.contactInfo || "",
      applicationInstitutionIds: dataset.applicationInstitutionIds || null
    });
  };

  const handleSaveChanges = async () => {
    if (!useAdvancedQuery || !onEditDataset) return;

    try {
      const updateData = {
        description: editableFields.description,
        contactPerson: editableFields.contactPerson,
        contactInfo: editableFields.contactInfo,
        applicationInstitutionIds: editableFields.applicationInstitutionIds,
        keywords: dataset.keywords || [],
        published: true,
        shareAllData: true,
        samplingMethod: dataset.samplingMethod || ""
      };

      const response = await datasetApi.updateDatasetBasicInfo(dataset.id, updateData);

      if (response.success) {
        toast.success("数据集信息更新成功");
        onEditDataset(response.data);
        setIsEditing(false);
        onDatasetUpdated?.();
      } else {
        throw new Error(response.message || "更新失败");
      }
    } catch (error) {
      console.error("更新数据集信息失败:", error);
      toast.error("更新数据集信息失败: " + (error as Error).message);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  // 统计信息卡片 - 保持与图片一致的布局
  const StatCard = ({ icon: Icon, label, value, className = "" }) => (
      <div className={`flex flex-col items-center text-center p-2 bg-white rounded-lg border shadow-sm ${className}`}>
        <div className="p-1.5 bg-gray-100 rounded-full mb-3 mt-1">
          <Icon className="h-4 w-4 text-gray-600" />
        </div>
        <p className="text-sm text-gray-600 mb-1">{label}</p>
        <div className="text-sm font-semibold text-gray-900">
          {typeof value === 'string' || typeof value === 'number' ? value : value}
        </div>
      </div>
  );

  // 信息项组件
  const InfoItem = ({ icon: Icon, label, value, className = "" }) => (
      <div className={`flex items-start gap-2 ${className}`}>
        <Icon className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted-foreground mb-1">{label}</p>
          <p className="text-sm font-medium whitespace-pre-wrap break-all">{value || '未设置'}</p>
        </div>
      </div>
  );

  return (
      <div className="space-y-6 p-2">
        {/* 统计信息卡片组 - 按照图片样式 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
              icon={Users}
              label="样本量"
              value={recordCount?.toLocaleString() || '0'}
          />
          <StatCard
              icon={Database}
              label="变量数"
              value={variableCount?.toLocaleString() || '0'}
          />
          <StatCard
              icon={Calendar}
              label="采集时间"
              value={dataset.startDate && dataset.endDate
                  ? `${formatDate(dataset.startDate)} 至 ${formatDate(dataset.endDate)}`
                  : '未设置'
              }
          />
          <StatCard
              icon={TrendingUp}
              label="访问热度"
              value={dataset.weeklyPopularity?.toLocaleString() || '0'}
          />
        </div>

        {/* 基本信息卡片 */}
        <Card className="shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Database className="h-5 w-5 text-primary" />
                基本信息
              </CardTitle>
                <div className="flex space-x-2">
                  <CopyButton
                    text={`${window.location.origin}/datasets?id=${dataset.id}`}
                    title="分享数据集"
                    description="点击下方文本框复制数据集链接"
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2 hover:bg-green-50 hover:text-green-600 border-green-200"
                  >
                    <Share className="h-4 w-4" />
                    复制分享链接
                  </CopyButton>
                  {canUploadDataset() && useAdvancedQuery && (
                      <div className="flex space-x-2">
                          {isEditing ? (
                              <>
                                  <Button variant="outline" onClick={handleCancelEdit} size="sm">
                                      取消
                                  </Button>
                                  <Button onClick={handleSaveChanges} size="sm">
                                      保存更改
                                  </Button>
                              </>
                          ) : (
                              <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={handleEditClick}
                                  className="flex items-center gap-2"
                              >
                                  <Pen className="h-4 w-4" />
                                  编辑
                              </Button>
                          )}
                      </div>
                  )}
                </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* 标题和学科分类 */}
            <div className="p-4 bg-muted/20 rounded-lg">
              <h3 className="font-semibold text-lg mb-6">{dataset.titleCn}</h3>
              
              {/* 学科分类、抽样方法、基线数据集水平排列 */}
              <div className="flex flex-wrap gap-6 mb-3">
                {dataset.subjectArea && (
                    <InfoItem
                        icon={Layers2}
                        label="学科分类"
                        value={dataset.subjectArea.name}
                        className="flex-shrink-0"
                    />
                )}

                {dataset.samplingMethod && (
                    <InfoItem
                        icon={SwatchBook}
                        label="抽样方法"
                        value={dataset.samplingMethod}
                        className="flex-shrink-0"
                    />
                )}

                {parentDataset && (
                    <InfoItem
                        icon={Link}
                        label="基线数据集"
                        value={
                          <p
                              className="p-0 justify-start text-left line-clamp-2 whitespace-pre-wrap break-all cursor-pointer hover:text-blue-600"
                              onClick={() => setIsParentDatasetModalOpen(true)}
                          >
                            {parentDataset.titleCn}
                          </p>}
                        className="flex-shrink-0"
                    />
                )}
              </div>
              
              {/* 描述文本单独一行 */}
              <div>
                {isEditing ? (
                    <textarea
                        value={editableFields.description}
                        onChange={(e) => setEditableFields(prev => ({...prev, description: e.target.value}))}
                        className="w-full min-h-[100px] p-3 border rounded-md text-sm bg-white"
                        placeholder="请输入数据集描述..."
                        maxLength={2000}
                    />
                ) : (
                    <div className="text-sm leading-relaxed whitespace-pre-wrap break-all">
                      {dataset.description || "暂无描述"}
                    </div>
                )}
              </div>
            </div>

            {/* 关键词 */}
            {dataset.keywords && dataset.keywords.length > 0 && (
                <div className="p-4 border rounded-lg">
                  <p className="text-sm font-medium mb-3">关键词</p>
                  <div className="flex flex-wrap gap-2">
                    {dataset.keywords.map((keyword: string, index: number) => (
                        <Badge key={index} variant="outline" className="px-3 py-1">
                          {keyword}
                        </Badge>
                    ))}
                  </div>
                </div>
            )}

            {/* 负责人和联系信息 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-4">
                <h4 className="font-medium text-sm text-muted-foreground">负责人信息</h4>
                <div className="space-y-3">
                  {dataset.datasetLeader && (
                      <InfoItem
                          icon={User}
                          label="数据集负责人"
                          value={dataset.datasetLeader}
                      />
                  )}
                  {dataset.principalInvestigator && (
                      <InfoItem
                          icon={User}
                          label="首席研究员（PI）"
                          value={dataset.principalInvestigator}
                      />
                  )}
                  {dataset.dataCollectionUnit && (
                      <InfoItem
                          icon={MapPin}
                          label="数据采集单位"
                          value={dataset.dataCollectionUnit}
                      />
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium text-sm text-muted-foreground">联系信息</h4>
                <div className="space-y-3">
                  {isEditing ? (
                      <>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">数据集联系人</p>
                          <input
                              type="text"
                              value={editableFields.contactPerson}
                              onChange={(e) => setEditableFields(prev => ({...prev, contactPerson: e.target.value}))}
                              className="w-full p-2 border rounded text-sm"
                              placeholder="请输入数据集联系人"
                              maxLength={100}
                          />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">数据集联系方式</p>
                          <input
                              type="text"
                              value={editableFields.contactInfo}
                              onChange={(e) => setEditableFields(prev => ({...prev, contactInfo: e.target.value}))}
                              className="w-full p-2 border rounded text-sm"
                              placeholder="请输入联系方式"
                              maxLength={200}
                          />
                        </div>
                      </>
                  ) : (
                      <>
                        {dataset.contactPerson && (
                            <InfoItem
                                icon={User}
                                label="数据集联系人"
                                value={dataset.contactPerson}
                            />
                        )}
                        {dataset.contactInfo && (
                            <InfoItem
                                icon={Mail}
                                label="数据集联系方式"
                                value={dataset.contactInfo}
                            />
                        )}
                        {dataset.provider && (
                            <>
                              <InfoItem
                                  icon={User}
                                  label="数据集提供者"
                                  value={dataset.provider.realName}
                              />
                              <InfoItem
                                  icon={Mail}
                                  label="数据集提供者邮箱"
                                  value={dataset.provider.email}
                              />
                            </>
                        )}
                      </>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium text-sm text-muted-foreground">机构信息</h4>
                <div className="space-y-3">
                  {institution && (
                      <>
                        <InfoItem
                            icon={Building}
                            label="归属机构"
                            value={institution.fullName}
                        />
                        <InfoItem
                            label={"机构联系人"}
                            value={institution.contactPerson || "-"}
                            icon={User}
                        />
                        <InfoItem
                            label={"机构联系电话"}
                            value={institution.contactPhone || "-"}
                            icon={Phone}
                        />
                        <InfoItem
                            label={"机构联系邮箱"}
                            value={institution.contactEmail || "-"}
                            icon={Mail}
                        />
                      </>
                  )}
                </div>
              </div>
            </div>

            {/* 允许申请的机构 */}
            {useAdvancedQuery && (
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-sm">申请权限设置</h4>
                  </div>

                  {isEditing ? (
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">允许申请的机构</p>
                        <div className="space-y-4">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="noInstitutionRestriction"
                              checked={editableFields.applicationInstitutionIds === null}
                              onCheckedChange={(checked) => {
                                setEditableFields(prev => ({
                                  ...prev,
                                  applicationInstitutionIds: checked ? null : []
                                }));
                              }}
                            />
                            <label htmlFor="noInstitutionRestriction" className="text-sm font-medium">
                              不限制申请机构（任何机构均可申请）
                            </label>
                          </div>

                          {editableFields.applicationInstitutionIds !== null && (
                            <InstitutionSelector
                              value={editableFields.applicationInstitutionIds}
                              onChange={(value) => {
                                setEditableFields(prev => ({
                                  ...prev,
                                  applicationInstitutionIds: value || []
                                }));
                              }}
                              allowMultiple={true}
                              placeholder="请选择允许申请的机构（可多选）"
                            />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          {editableFields.applicationInstitutionIds === null || editableFields.applicationInstitutionIds?.length === 0
                              ? "任何机构均可申请此数据集"
                              : `仅限 ${editableFields.applicationInstitutionIds.length} 个机构申请`}
                        </p>
                      </div>
                  ) : (
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">允许申请的机构</p>
                        {dataset.applicationInstitutionIds === null || dataset.applicationInstitutionIds?.length === 0 ? (
                            <p className="text-sm font-medium text-green-600">无限制（任何机构均可申请）</p>
                        ) : (
                            <div>
                              {loadingInstitutions ? (
                                  <div className="flex flex-wrap gap-2">
                                    {[1, 2, 3].map(i => (
                                        <Skeleton key={i} className="h-6 w-20 rounded-full" />
                                    ))}
                                  </div>
                              ) : (
                                  <div className="flex flex-wrap gap-2">
                                    {applicationInstitutions.map((inst, index) => (
                                        <Badge key={index} variant="secondary" className="px-3 py-1">
                                          {inst.abbreviation || inst.fullName}
                                        </Badge>
                                    ))}
                                  </div>
                              )}
                              <p className="text-xs text-muted-foreground mt-2">
                                仅限以上 {applicationInstitutions.length} 个机构可申请
                              </p>
                            </div>
                        )}
                      </div>
                  )}
                </div>
            )}

            {/* 版本信息 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/20 rounded-lg">
              <InfoItem
                  icon={Calendar}
                  label="首次发布日期"
                  value={dataset.firstPublishedDate  ? formatDate(dataset.firstPublishedDate) : '未发布'}
              />
              <InfoItem
                  icon={Calendar}
                  label="当前版本日期"
                  value={dataset.currentVersionDate ? formatDate(dataset.currentVersionDate) : '未发布'}
              />
              <InfoItem
                  icon={Eye}
                  label="历史访问量"
                  value={dataset.historyVisits.toString()}
              />
            </div>
          </CardContent>
        </Card>

        {/* 父数据集详情模态框 */}
        {parentDataset && (
            <DatasetDetailModal
                dataset={parentDataset}
                open={isParentDatasetModalOpen}
                useAdvancedQuery={useAdvancedQuery}
                onOpenChange={setIsParentDatasetModalOpen}
                onDatasetUpdated={onDatasetUpdated}
            />
        )}
      </div>
  );
}