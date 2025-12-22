import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { userApi } from "@/integrations/api/userApi";
import {getPermissionRoleDisplayName, PERMISSION_ROLE_DISPLAY_NAMES, PermissionRoles} from "@/lib/permissionUtils";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2 } from "lucide-react";
import {getCurrentUserRoles} from "@/lib/authUtils.ts";
import { Label } from "@/components/ui/label.tsx";

interface EditUserAuthoritiesDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    user: any;
    onAuthoritiesUpdated: () => void;
}

const EditUserAuthoritiesDialog = ({ open, onOpenChange, user, onAuthoritiesUpdated }: EditUserAuthoritiesDialogProps) => {
    const { toast } = useToast();
    const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // 定义管理员角色
    const adminRoles: string[] = [PermissionRoles.PLATFORM_ADMIN, PermissionRoles.INSTITUTION_SUPERVISOR];

    // 定义普通角色
    const normalRoles: string[] = [
        PermissionRoles.INSTITUTION_USER_MANAGER,
        PermissionRoles.DATASET_UPLOADER,
        PermissionRoles.DATASET_APPROVER,
        PermissionRoles.RESEARCH_OUTPUT_APPROVER
    ];

    // 检查是否是管理员角色
    const isAdminRole = (roleId: string) => {
        return adminRoles.includes(roleId);
    };

    // 检查是否是普通角色
    const isNormalRole = (roleId: string) => {
        return normalRoles.includes(roleId);
    };

    // 检查当前是否选择了管理员角色
    const hasAdminRoleSelected = () => {
        return selectedRoles.some(role => isAdminRole(role));
    };

    // 检查当前是否选择了普通角色
    const hasNormalRoleSelected = () => {
        return selectedRoles.some(role => isNormalRole(role));
    };

    // 获取当前选择的管理员角色（如果有的话）
    const getSelectedAdminRole = () => {
        return selectedRoles.find(role => isAdminRole(role));
    };

    // 当用户数据变化时，获取用户当前权限
    useEffect(() => {
        if (user && open) {
            setLoading(true);
            userApi.getUserAuthorities(user.id)
                .then(roles => {
                    setSelectedRoles(roles.data);
                })
                .catch(error => {
                    console.error("获取用户权限失败:", error);
                    toast({
                        title: "错误",
                        description: "获取用户权限失败",
                        variant: "destructive",
                    });
                })
                .finally(() => {
                    setLoading(false);
                });
        }
    }, [user, open, toast]);

    const handleRoleToggle = (roleId: string) => {
        const isCurrentlySelected = selectedRoles.includes(roleId);
        const isRoleAdmin = isAdminRole(roleId);
        const isRoleNormal = isNormalRole(roleId);

        // 如果点击的是已经选中的角色，取消选择
        if (isCurrentlySelected) {
            setSelectedRoles(prev => prev.filter(id => id !== roleId));
            return;
        }

        // 如果点击的是管理员角色
        if (isRoleAdmin) {
            // 选择管理员角色时，清空所有其他角色（包括其他管理员角色）
            setSelectedRoles([roleId]);
            return;
        }

        // 如果点击的是普通角色
        if (isRoleNormal) {
            // 如果已经选择了管理员角色，先清空管理员角色
            let newRoles = selectedRoles.filter(role => !isAdminRole(role));
            // 然后添加当前点击的普通角色
            newRoles.push(roleId);
            setSelectedRoles(newRoles);
            return;
        }
    };

    // 检查角色是否可选
    const isRoleSelectable = (roleId: string) => {
        const hasAdmin = hasAdminRoleSelected();
        const hasNormal = hasNormalRoleSelected();
        const isRoleAdmin = isAdminRole(roleId);
        const isRoleNormal = isNormalRole(roleId);

        // 如果已经选择了管理员角色
        if (hasAdmin) {
            // 只有当前点击的管理员角色可以取消选择，其他角色都不可选
            return isRoleAdmin && selectedRoles.includes(roleId);
        }

        // 如果已经选择了普通角色（但没有选择管理员角色）
        if (hasNormal) {
            // 管理员角色不可选，普通角色可选
            return !isRoleAdmin;
        }

        // 如果没有任何选择，所有角色都可选
        return true;
    };

    const handleSave = async () => {
        if (!user) return;

        setSaving(true);
        try {
            await userApi.updateUserAuthorities({
                userId: user.id,
                authorities: selectedRoles
            });

            toast({
                title: "成功",
                description: "用户权限更新成功",
            });

            onAuthoritiesUpdated();
            onOpenChange(false);
        } catch (error: any) {
            console.error("更新用户权限失败:", error);
            toast({
                title: "错误",
                description: error.response.data.message || "更新用户权限失败",
                variant: "destructive",
            });
        } finally {
            setSaving(false);
        }
    };

    // 权限角色选项
    const roleOptions: { id: string; name: string; isAdmin: boolean }[] = [
        { id: PermissionRoles.INSTITUTION_SUPERVISOR, name: getPermissionRoleDisplayName(PermissionRoles.INSTITUTION_SUPERVISOR), isAdmin: true },
        { id: PermissionRoles.INSTITUTION_USER_MANAGER, name: getPermissionRoleDisplayName(PermissionRoles.INSTITUTION_USER_MANAGER), isAdmin: false },
        { id: PermissionRoles.DATASET_UPLOADER, name: getPermissionRoleDisplayName(PermissionRoles.DATASET_UPLOADER), isAdmin: false },
        { id: PermissionRoles.DATASET_APPROVER, name: getPermissionRoleDisplayName(PermissionRoles.DATASET_APPROVER), isAdmin: false },
        { id: PermissionRoles.RESEARCH_OUTPUT_APPROVER, name: getPermissionRoleDisplayName(PermissionRoles.RESEARCH_OUTPUT_APPROVER), isAdmin: false },
    ];

    // 如果是平台管理员，添加平台管理员选项到最前面
    if (getCurrentUserRoles().includes(PermissionRoles.PLATFORM_ADMIN)) {
        roleOptions.unshift({
            id: PermissionRoles.PLATFORM_ADMIN,
            name: getPermissionRoleDisplayName(PermissionRoles.PLATFORM_ADMIN),
            isAdmin: true
        });
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md max-h-[80vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle>修改用户权限</DialogTitle>
                </DialogHeader>

                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                ) : (
                    <div className="flex-grow overflow-hidden flex flex-col">
                        <Card className="mb-4">
                            <CardHeader className="p-4">
                                <CardTitle className="text-lg">用户信息</CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 pt-0">
                                <div className="text-sm">
                                    <div>姓名：{user?.realName}</div>
                                    <div>手机号：{user?.phone}</div>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="space-y-2 flex-grow overflow-hidden flex flex-col">
                            <Label className="text-sm text-muted-foreground">请选择用户权限角色：</Label>
                            <div className="text-xs text-muted-foreground mb-2">
                                <p>• 管理员角色与普通角色不能同时选择</p>
                            </div>

                            <ScrollArea className="flex-grow overflow-auto pr-2">
                                <div className="space-y-2">
                                    {roleOptions.map((role) => {
                                        const isSelectable = isRoleSelectable(role.id);
                                        const isChecked = selectedRoles.includes(role.id);
                                        const isAdmin = role.isAdmin;

                                        return (
                                            <div
                                                key={role.id}
                                                className={`flex items-center space-x-3 rounded-lg border p-4 transition-colors ${
                                                    isSelectable
                                                        ? "hover:bg-accent cursor-pointer"
                                                        : "opacity-50 bg-muted cursor-not-allowed"
                                                } ${isAdmin ? "border-blue-200" : ""}`}
                                            >
                                                <Checkbox
                                                    id={role.id}
                                                    checked={isChecked}
                                                    onCheckedChange={() => isSelectable && handleRoleToggle(role.id)}
                                                    disabled={!isSelectable}
                                                />
                                                <label
                                                    htmlFor={role.id}
                                                    className={`text-sm font-medium leading-none ${
                                                        !isSelectable ? "cursor-not-allowed opacity-70" : ""
                                                    } ${isAdmin ? "text-blue-700" : ""}`}
                                                >
                                                    {role.name} {isAdmin && "(管理员)"}
                                                </label>
                                            </div>
                                        );
                                    })}
                                </div>
                            </ScrollArea>
                        </div>
                    </div>
                )}

                <div className="text-sm text-muted-foreground">
                    <p>注意：修改权限后需要重新登录</p>
                </div>
                <div className="flex justify-end space-x-2 mt-4">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={saving}
                    >
                        取消
                    </Button>
                    <Button
                        type="button"
                        onClick={handleSave}
                        disabled={loading || saving}
                    >
                        {saving ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                保存中...
                            </>
                        ) : (
                            "保存"
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default EditUserAuthoritiesDialog;