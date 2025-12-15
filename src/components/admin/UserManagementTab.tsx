import {useRealtimeQuery} from "@/hooks/useRealtimeQuery";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";
import {Badge} from "@/components/ui/badge";
import {supabase} from "@/integrations/supabase/client";
import {useEffect, useState} from "react";
import {getPermissionRoleDisplayName} from "@/lib/permissionUtils";
import AddUserToInstitutionForm from "@/components/admin/AddUserToInstitutionForm";

const UserManagementTab = ({institutionId}: { institutionId?: string }) => {
    // If institutionId is provided, filter users by institution
    const queryOptions = institutionId
        ? {
            select: 'id, real_name, email, created_at, institution_id',
            eq: ["institution_id", institutionId]
        }
        : {
            select: 'id, real_name, email, created_at'
        };

    const {data: users, loading: usersLoading, refresh: refreshUsers} = useRealtimeQuery('users', queryOptions);
    const [userRoles, setUserRoles] = useState<Record<string, string[]>>({});

    // Fetch user roles
    useEffect(() => {
        if (users && users.length > 0) {
            const fetchUserRoles = async () => {
                const userIds = users.map(user => user.id);
                
                // TODO: 迁移到新的API端点获取用户权限角色
                const {data: rolesData, error} = await supabase
                    .from('user_roles')
                    .select('user_id, role')
                    .in('user_id', userIds);

                if (!error && rolesData) {
                    const rolesMap: Record<string, string[]> = {};
                    rolesData.forEach(item => {
                        if (!rolesMap[item.user_id]) {
                            rolesMap[item.user_id] = [];
                        }
                        rolesMap[item.user_id].push(item.role);
                    });
                    setUserRoles(rolesMap);
                }
            };

            fetchUserRoles();
        }
    }, [users]);

    // 监听刷新事件
    useEffect(() => {
        const handleRefreshUsers = () => {
            refreshUsers();
        };

        window.addEventListener('refresh-users', handleRefreshUsers);

        return () => {
            window.removeEventListener('refresh-users', handleRefreshUsers);
        };
    }, [refreshUsers]);

    const handleUserAdded = () => {
        // 刷新用户列表
        refreshUsers();
    };

    return (
        <div className="space-y-6">
            {institutionId && (
                <AddUserToInstitutionForm
                    institutionId={institutionId}
                    onUserAdded={handleUserAdded}
                />
            )}

            <Card>
                <CardHeader>
                    <CardTitle>用户管理</CardTitle>
                    <CardDescription>
                        管理平台用户及其权限角色
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {usersLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>姓名</TableHead>
                                    <TableHead>邮箱</TableHead>
                                    <TableHead>角色</TableHead>
                                    <TableHead>注册时间</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users && users.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell className="font-medium">{user.real_name}</TableCell>
                                        <TableCell>{user.email}</TableCell>
                                        <TableCell>
                                            {userRoles[user.id]?.map((role, index) => (
                                                <Badge key={index} variant="outline" className="mr-1">
                                                    {getPermissionRoleDisplayName(role)}
                                                </Badge>
                                            ))}
                                        </TableCell>
                                        <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default UserManagementTab;