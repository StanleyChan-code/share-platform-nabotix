import {useEffect, useState} from "react";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";
import {Badge} from "@/components/ui/badge";
import {useToast} from "@/hooks/use-toast";
import {
    getPermissionRoleDisplayName,
    getUserPermissionRoleDisplayNames,
    hasPermissionRole,
    PermissionRoles
} from "@/lib/permissionUtils";
import {formatDateTime, cn} from "@/lib/utils.ts";
import { Skeleton } from "@/components/ui/skeleton";
import {userApi} from "@/integrations/api/userApi.ts";
import {Button} from "@/components/ui/button.tsx";
import {
    PlusCircle,
    Pencil,
    ChevronRightIcon,
    ChevronLeftIcon,
    Phone,
    Shield,
    Search,
    Asterisk,
    AlertCircle,
    User,
    Eye,
    RefreshCw
} from "lucide-react";
import UserInfoDialog from "@/components/admin/user/UserInfoDialog.tsx";
import {Switch} from "@/components/ui/switch.tsx";
import {InstitutionSelector} from "@/components/admin/institution/InstitutionSelector.tsx";
import {getCurrentUserInfoFromSession, refreshUserInfo} from "@/lib/authUtils";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog.tsx";
import AddUserToInstitutionForm from "@/components/admin/user/AddUserToInstitutionForm.tsx";

import ReactPaginate from "react-paginate";
import EditUserDialog from "@/components/admin/user/EditUserDialog.tsx";
import EditPhoneDialog from "@/components/admin/user/EditPhoneDialog.tsx";
import EditUserAuthoritiesDialog from "@/components/admin/user/EditUserAuthoritiesDialog.tsx";
import {ScrollArea} from "@radix-ui/react-scroll-area";
import {institutionApi} from "@/integrations/api/institutionApi.ts";
import {useDebounce} from "@/hooks/useDebounce";
import {Input} from "@/components/ui/FormValidator.tsx";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";

const UserManagementTab = () => {
    const [users, setUsers] = useState<any[]>([]);
    const [userRoles, setUserRoles] = useState<Record<string, string[]>>({});
    const [loading, setLoading] = useState(false);
    const [showAddUserDialog, setShowAddUserDialog] = useState(false);
    const [selectedInstitutionId, setSelectedInstitutionId] = useState<string[] | null>(null);
    const [isPlatformAdmin, setIsPlatformAdmin] = useState<boolean>(false);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [showUserInfoDialog, setShowUserInfoDialog] = useState(false);
    const [currentPage, setCurrentPage] = useState(0);
    const [pageSize, setPageSize] = useState(5); // 每页显示的记录数
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0); // 新增总元素数状态
    const [showEditUserDialog, setShowEditUserDialog] = useState(false);
    const [showEditPhoneDialog, setShowEditPhoneDialog] = useState(false);
    const [showEditAuthoritiesDialog, setShowEditAuthoritiesDialog] = useState(false);
    const [searchType, setSearchType] = useState("realName"); // 搜索类型：realName 或 phone
    const [searchValue, setSearchValue] = useState(""); // 搜索值
    // 存储机构信息的状态
    const [institutionMap, setInstitutionMap] = useState<Record<string, { fullName: string }>>({});
    const {toast} = useToast();


    const userHasAnyAuthorityOf = (user: any, ...roles: string[]) => roles.some(role => user.authorities.includes(role));

    // 添加防抖处理，延迟550ms
    const debouncedSearchValue = useDebounce(searchValue, 550);
    // 检查用户是否为平台管理员并获取用户所属机构，同时初始化用户列表
    useEffect(() => {
        const userInfo = getCurrentUserInfoFromSession();
        if (userInfo) {
            const isPlatformAdminUser = userInfo.roles.includes(PermissionRoles.PLATFORM_ADMIN);
            setIsPlatformAdmin(isPlatformAdminUser);
            // 从 userInfo.institution 获取机构名称
            setInstitutionMap({
                [userInfo.user.institutionId]: {
                    fullName: userInfo.institution?.fullName || '未知机构'
                }
            })

            // 设置初始机构
            if (!isPlatformAdminUser) {
                setSelectedInstitutionId(userInfo.user.institutionId ? [userInfo.user.institutionId] : null);
            }
        }
    }, []);

    // 自动获取用户列表
    useEffect(() => {
        // 平台管理员：可以立即获取（不选机构时获取所有用户）
        // 非平台管理员：需要等待机构设置
        if (isPlatformAdmin || selectedInstitutionId?.length > 0) {
            handleClearSearch();
        }
    }, [isPlatformAdmin, selectedInstitutionId]);

    // 获取机构详细信息
    const fetchInstitutionDetails = async (institutionId: string) => {
        // 如果已经获取过该机构信息，则直接返回
        if (institutionMap[institutionId]) {
            return institutionMap[institutionId];
        }

        try {
            const response = await institutionApi.getInstitutionById(institutionId);
            setInstitutionMap(prev => ({
                ...prev,
                [institutionId]: {
                    fullName: response.data.fullName
                }
            }));
            return response.data;
        } catch (error) {
            console.error(`获取机构 ${institutionId} 信息失败:`, error);
            return null;
        }
    };

    const fetchUsers = async (page: number = 0, realName?: string) => {
        if (!selectedInstitutionId && !isPlatformAdmin) {
            setUsers([]);
            setUserRoles({});
            return;
        }

        setLoading(true);
        try {
            // 获取用户列表
            let response;

            // 使用统一的getUsers方法获取用户列表
            // 平台管理员未选择机构时，institutionId为undefined，将获取所有用户
            response = await userApi.getUsers(page, pageSize, selectedInstitutionId?.[0], realName);

            const userList = response.data.content;
            setUsers(userList);
            setTotalPages(response.data.page.totalPages);
            setTotalElements(response.data.page.totalElements); // 设置总元素数

            // 获取每个用户的角色
            const rolesMap: Record<string, string[]> = {};
            for (const user of userList) {
                try {
                    rolesMap[user.id] = getUserPermissionRoleDisplayNames(user.authorities);
                } catch (error) {
                    console.error(`获取用户 ${user.id} 的角色失败:`, error);
                    rolesMap[user.id] = [];
                }

                // 获取用户所属机构的详细信息
                if (user.institutionId && !institutionMap[user.institutionId]) {
                    fetchInstitutionDetails(user.institutionId);
                }
            }
            setUserRoles(rolesMap);
        } catch (error) {
            console.error("获取用户列表失败:", error);
            toast({
                title: "错误",
                description: "获取用户列表失败",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    // 根据手机号搜索用户
    const handleSearchByPhone = async (phone?: string) => {
        const phoneToSearch = phone || searchValue;

        // 如果搜索框为空，清空搜索结果并重新加载用户列表
        if (!phoneToSearch.trim()) {
            setSearchValue(""); // 清空搜索框
            fetchUsers(0); // 重置到第一页
            setCurrentPage(0);
            return;
        }

        // 验证手机号格式
        if (phoneToSearch.trim().length !== 11) {
            toast({
                title: "提示",
                description: "请输入11位有效手机号",
            });
            return;
        }

        // 权限检查
        if (!isPlatformAdmin && (!selectedInstitutionId || selectedInstitutionId.length === 0)) {
            toast({
                title: "错误",
                description: "请先选择机构",
                variant: "destructive"
            });
            return;
        }

        setLoading(true);
        try {
            const apiResponse = await userApi.getUserByPhone(phoneToSearch);
            const user = apiResponse.data;

            if (apiResponse.success) {

                // 更新用户角色信息
                const rolesMap = {...userRoles};
                try {
                    rolesMap[user.id] = getUserPermissionRoleDisplayNames(user.authorities);
                } catch (error) {
                    console.error(`获取用户 ${user.id} 的角色失败:`, error);
                    rolesMap[user.id] = [];
                }
                setUserRoles(rolesMap);

                // 获取机构信息
                if (user.institutionId && !institutionMap[user.institutionId]) {
                    fetchInstitutionDetails(user.institutionId);
                }
                setUsers([user]);
                setTotalPages(1);
                setTotalElements(1); // 设置总元素数为1
                setCurrentPage(0);

            } else {
                toast({
                    title: "提示",
                    description: apiResponse.message || "搜索用户失败，请确认手机号是否正确",
                });
                setUsers([]);
                setTotalPages(0);
                setTotalElements(0); // 设置总元素数为1
                setCurrentPage(0);
            }
        } catch (error: any) {
            console.error("搜索用户失败:", error);
            toast({
                title: "错误",
                description: error.response?.data?.message || "搜索用户失败，请确认手机号是否正确",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    // 统一的搜索和刷新函数
    const performSearch = (page: number = 0) => {
        
        // 根据搜索类型和搜索值执行不同的搜索逻辑
        if (searchType === "phone" && debouncedSearchValue.trim().length === 11) {
            handleSearchByPhone(debouncedSearchValue.trim());
        } else if (searchType === "realName") {
            // 姓名搜索或无搜索条件时，使用fetchUsers
            fetchUsers(page, searchType === "realName" && debouncedSearchValue.trim() ? debouncedSearchValue.trim() : undefined);
        }
    };

    // 优化的清空搜索逻辑
    const handleClearSearch = () => {
        if (debouncedSearchValue.trim() === '') {
            performSearch(0);
        } else {
            setSearchValue("");
        }
        // 不需要立即设置currentPage，让debounce自然触发刷新
    };

    // 监听切换的搜索类型变化
    useEffect(() => {
        if (debouncedSearchValue.trim()) {
            handleClearSearch();
        }
    }, [searchType]);

    // 监听搜索条件变化，统一触发搜索
    useEffect(() => {
        performSearch(0); // 搜索条件变化时回到第一页
        setCurrentPage(0);
    }, [debouncedSearchValue, selectedInstitutionId]);

    // 全局刷新事件监听
    useEffect(() => {
        const handleGlobalRefresh = () => {
            performSearch(currentPage);
        };
        
        window.addEventListener('refresh-users', handleGlobalRefresh);

        return () => {
            window.removeEventListener('refresh-users', handleGlobalRefresh);
        };
    }, [currentPage, debouncedSearchValue, selectedInstitutionId]);

    const handleUserAdded = () => {
        performSearch(currentPage);
        setShowAddUserDialog(false);
    };

   // 处理查看用户详情
    const showUserDetails = (userId: string) => {
        setSelectedUser(userId);
        setShowUserInfoDialog(true);
    };

    const handleUserUpdated = () => {
        performSearch(currentPage);
        // 如果修改了自己的信息，刷新当前cookie中的用户信息
        if (selectedUser?.id === getCurrentUserInfoFromSession()?.user?.id) {
            refreshUserInfo();
        }

        setShowEditUserDialog(false);
    };

    const handlePhoneUpdated = (newPhone: string) => {
        // 更新搜索值（如果是手机号搜索且当前搜索值是被修改的手机号）
        if (searchType === "phone" && searchValue.trim() === selectedUser?.phone) {
            setSearchValue(newPhone);
        }
        performSearch(currentPage);
        // 如果修改了自己的信息，刷新当前cookie中的用户信息
        if (selectedUser?.id === getCurrentUserInfoFromSession()?.user?.id) {
            refreshUserInfo();
        }

        setShowEditPhoneDialog(false);
    };

    const handleAuthoritiesUpdated = () => {
        performSearch(currentPage);
        setShowEditAuthoritiesDialog(false);
    };

    // 更新用户禁用状态
    const handleUpdateUserDisabled = async (userId: string, disabled: boolean) => {
        try {
            const currentUserInfo = getCurrentUserInfoFromSession();

            // 检查是否禁用自己
            if (currentUserInfo?.user?.id === userId) {
                toast({
                    title: "错误",
                    description: "不允许禁用当前登录用户",
                    variant: "destructive"
                });
                return;
            }

            // 检查是否禁用平台管理员
            const userToUpdate = users.find(u => u.id === userId);
            if (userToUpdate?.authorities?.includes(PermissionRoles.PLATFORM_ADMIN)) {
                toast({
                    title: "错误",
                    description: "不允许禁用平台管理员",
                    variant: "destructive"
                });
                return;
            }

            await userApi.updateUserDisabledStatus(userId, disabled);

            // 更新本地状态
            setUsers(prev => prev.map(u => u.id === userId ? {...u, disabled} : u));

            toast({
                title: "成功",
                description: disabled ? "用户已禁用" : "用户已启用",
                variant: "default"
            });
        } catch (error: any) {
            console.error("更新用户禁用状态失败:", error);
            toast({
                title: "错误",
                description: error.response?.data?.message || "更新用户状态失败",
                variant: "destructive"
            });
        }
    };

    // 处理页面更改
    const handlePageClick = (event: { selected: number }) => {
        const newPage = event.selected;
        setCurrentPage(newPage);
        performSearch(newPage);
    };

    {/* 用户列表骨架屏组件 */}
    const UserRowSkeleton = () => (
        <TableRow>
            <TableCell className="font-medium">
                <Skeleton className="h-5 w-20 rounded"/>
            </TableCell>
            <TableCell>
                <div className="flex items-center gap-2">
                    <Skeleton className="h-5 w-28 rounded"/>
                    <Skeleton className="h-8 w-8 rounded-full"/>
                </div>
            </TableCell>
            <TableCell>
                <div className="flex items-center gap-2">
                    <div className="flex flex-wrap gap-1">
                        <Skeleton className="h-5 w-20 rounded"/>
                        <Skeleton className="h-5 w-20 rounded"/>
                    </div>
                    <Skeleton className="h-8 w-8 rounded-full"/>
                </div>
            </TableCell>
            <TableCell>
                <Skeleton className="h-4 w-8 rounded"/>
            </TableCell>
            <TableCell>
                <Skeleton className="h-4 w-32 rounded"/>
            </TableCell>
            <TableCell>
                <div className="flex gap-2">
                    <Skeleton className="h-8 w-8 rounded-full"/>
                    <Skeleton className="h-8 w-8 rounded-full"/>
                </div>
            </TableCell>
        </TableRow>
    );

    return (
        <div className="space-y-6">
            {isPlatformAdmin && (
                <div className="mb-6 p-4 border rounded-lg bg-muted/50">
                    <InstitutionSelector
                        value={selectedInstitutionId}
                        onChange={setSelectedInstitutionId}
                        placeholder="选择要管理的机构（可选）"
                        allowMultiple={false}
                    />
                </div>
            )}
            {/* 搜索区域 */}
            <div className="mb-6 p-4 border rounded-lg bg-muted/50  flex justify-between items-center">
                <div className="flex gap-2 max-w-lg">
                    <div className="flex gap-2 items-center">
                        <Select value={searchType} onValueChange={setSearchType}>
                            <SelectTrigger className="w-28">
                                <SelectValue placeholder="搜索方式" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="realName">姓名</SelectItem>
                                <SelectItem value="phone">手机号</SelectItem>
                            </SelectContent>
                        </Select>
                        <div className="relative">
                            {searchType === "phone" ? (
                                <Phone className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground"/>
                            ) : (
                                <User className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground"/>
                            )}
                            <Input
                                placeholder={searchType === "phone" ? "请输入11位手机号搜索用户" : "请输入姓名模糊搜索用户"}
                                value={searchValue}
                                onChange={(e) => setSearchValue(e.target.value)}
                                className="pl-8 w-72"
                                maxLength={searchType === "phone" ? 11 : 20}
                            />
                        </div>
                        <Button
                            variant={'outline'}
                            onClick={() => performSearch(currentPage)}
                            disabled={loading}
                        >
                            <RefreshCw className={cn("h-4 w-4", loading ? "animate-spin" : "")} />
                            刷新
                        </Button>
                        <Button
                            variant="outline"
                            onClick={handleClearSearch}
                            disabled={loading || !searchValue.trim()}
                        >
                            重置
                        </Button>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Dialog open={showAddUserDialog} onOpenChange={setShowAddUserDialog}>
                        <DialogTrigger asChild>
                            <Button
                                onClick={() => setShowAddUserDialog(true)}
                                disabled={!selectedInstitutionId || selectedInstitutionId.length === 0}
                                className="gap-2"
                            >
                                <PlusCircle className="h-4 w-4"/>
                                新增用户
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-5xl" onInteractOutside={(e) => e.preventDefault()}>
                            <DialogHeader>
                                <DialogTitle>新增用户到机构</DialogTitle>
                            </DialogHeader>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                                <div className="flex items-center gap-1">
                                    <Asterisk className="h-3 w-3 text-red-500"/>
                                    <span>标记的字段为必填项</span>
                                </div>
                            </div>
                            <div className="flex-1 overflow-hidden overflow-y-auto">
                                <ScrollArea className="h-full w-full pr-4">
                                    <div className="h-[calc(85vh-100px)]">
                                        {selectedInstitutionId && selectedInstitutionId.length > 0 && (
                                            <AddUserToInstitutionForm
                                                institutionId={selectedInstitutionId![0]}
                                                onUserAdded={handleUserAdded}
                                            />
                                        )}
                                    </div>
                                </ScrollArea>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {loading ? (
                <Table className="border rounded-md">
                    <TableHeader>
                        <TableRow>
                            <TableHead>姓名</TableHead>
                            <TableHead>手机号</TableHead>
                            <TableHead>角色</TableHead>
                            <TableHead>启用状态</TableHead>
                            <TableHead>注册时间</TableHead>
                            <TableHead>个人信息</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {Array.from({ length: pageSize }).map((_, index) => (
                            <UserRowSkeleton key={index} />
                        ))}
                    </TableBody>
                </Table>
            ) : ((selectedInstitutionId && selectedInstitutionId.length > 0) || isPlatformAdmin) ? (
                <>

                    <Table className="border rounded-md">
                        <TableHeader>
                            <TableRow>
                                <TableHead>姓名</TableHead>
                                <TableHead>手机号</TableHead>
                                <TableHead>角色</TableHead>
                                <TableHead>启用状态</TableHead>
                                <TableHead>注册时间</TableHead>
                                <TableHead>个人信息</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {
                                // 显示正常用户列表
                                users?.map((user) => {
                                    // 不允许管理同级或更高级别的用户，除了修改基本信息外
                                    const canManageUser = isPlatformAdmin && !userHasAnyAuthorityOf(user, PermissionRoles.PLATFORM_ADMIN) ||
                                        hasPermissionRole(PermissionRoles.INSTITUTION_SUPERVISOR) &&
                                        !userHasAnyAuthorityOf(user, PermissionRoles.PLATFORM_ADMIN, PermissionRoles.INSTITUTION_SUPERVISOR) ||
                                        hasPermissionRole(PermissionRoles.INSTITUTION_USER_MANAGER) &&
                                        !userHasAnyAuthorityOf(user, PermissionRoles.PLATFORM_ADMIN, PermissionRoles.INSTITUTION_SUPERVISOR, PermissionRoles.INSTITUTION_USER_MANAGER)
                                    return (
                                        <TableRow key={user.id} className={user.id === getCurrentUserInfoFromSession()?.user?.id ? 'bg-yellow-50' : ''}>
                                            <TableCell className="font-medium">
                                                <a onClick={() => showUserDetails(user.id)} className="hover:underline hover:text-primary cursor-pointer">
                                                    {user.realName}
                                                </a>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    {user.phone || '-'}
                                                    {canManageUser && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="p-1 h-auto"
                                                            onClick={() => {
                                                                setSelectedUser(user);
                                                                setShowEditPhoneDialog(true);
                                                            }}
                                                        >
                                                            <Phone
                                                                className="h-4 w-4 text-muted-foreground hover:text-foreground"/>
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <div>
                                                        {userRoles[user.id]?.map((role, index) => (
                                                            <Badge key={index} variant="outline"
                                                                   className="mr-1">
                                                                {getPermissionRoleDisplayName(role)}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                    {canManageUser && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="p-1 h-auto"
                                                            onClick={() => {
                                                                setSelectedUser(user);
                                                                setShowEditAuthoritiesDialog(true);
                                                            }}
                                                        >
                                                            <Shield
                                                                className="h-4 w-4 text-muted-foreground hover:text-foreground"/>
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Switch
                                                        checked={!user.disabled}
                                                        onCheckedChange={(checked) => handleUpdateUserDisabled(user.id, !checked)}
                                                        disabled={!canManageUser}
                                                    />
                                                </div>
                                            </TableCell>
                                            <TableCell>{formatDateTime(user.createdAt)}</TableCell>
                                            <TableCell className="flex gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => showUserDetails(user.id)}
                                                    className="h-8 w-8 hover:bg-primary/10 hover:text-primary transition-all duration-200"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                    <span className="sr-only">查看用户信息</span>
                                                </Button>

                                                {(canManageUser || user.id === getCurrentUserInfoFromSession()?.user?.id) && (
                                                    <Button
                                                        variant="outline"
                                                        className="h-8 w-8 hover:bg-primary/10 hover:text-primary transition-all duration-200"
                                                        onClick={() => {
                                                            setSelectedUser(user);
                                                            setShowEditUserDialog(true);
                                                        }}
                                                    >
                                                        <Pencil className="h-4 w-4"/>
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    )
                                })
                            }
                        </TableBody>
                    </Table>

                </>
            ) : (
                <div className="text-center py-8 text-muted-foreground">
                    {isPlatformAdmin
                        ? "请选择一个机构以查看其用户列表，或不选择机构查看所有用户"
                        : "请选择一个机构以查看其用户列表"}
                </div>
            )}

            {/* 显示总数信息 */}
            <div className="mt-4 text-sm text-muted-foreground flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div>
                        共 {totalElements} 条记录
                    </div>
                    <div className="flex items-center gap-2">
                        每页显示：
                        <Select value={pageSize.toString()} onValueChange={(value) => {
                            setPageSize(parseInt(value));
                            setCurrentPage(0);
                        }}>
                            <SelectTrigger className="w-[100px]">
                                <SelectValue placeholder="显示条数" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="5">5条</SelectItem>
                                <SelectItem value="10">10条</SelectItem>
                                <SelectItem value="20">20条</SelectItem>
                                <SelectItem value="50">50条</SelectItem>
                                <SelectItem value="100">100条</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                {/* 只有在没有搜索结果且总页数大于1时才显示分页 */}
                {totalPages > 1 && (
                    <div className="flex justify-center">
                        <ReactPaginate
                            breakLabel="..."
                            nextLabel={
                                <span className="flex items-center gap-1">
                                                        下一页 <ChevronRightIcon className="h-4 w-4"/>
                                                    </span>
                            }
                            onPageChange={handlePageClick}
                            pageRangeDisplayed={3}
                            marginPagesDisplayed={1}
                            pageCount={totalPages}
                            previousLabel={
                                <span className="flex items-center gap-1">
                                                        <ChevronLeftIcon className="h-4 w-4"/> 上一页
                                                    </span>
                            }
                            renderOnZeroPageCount={null}
                            containerClassName="flex items-center justify-center gap-2"
                            pageClassName=""
                            pageLinkClassName="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-700 transition-all duration-200 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-blue-500 dark:hover:bg-blue-900/20"
                            previousClassName=""
                            previousLinkClassName="flex h-10 items-center justify-center rounded-lg border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700 transition-all duration-200 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-600 disabled:hover:border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-blue-500 dark:hover:bg-blue-900/20"
                            nextClassName=""
                            nextLinkClassName="flex h-10 items-center justify-center rounded-lg border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700 transition-all duration-200 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-600 disabled:hover:border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-blue-500 dark:hover:bg-blue-900/20"
                            breakClassName=""
                            breakLinkClassName="flex h-10 w-10 items-center justify-center text-gray-500 dark:text-gray-400"
                            activeClassName=""
                            activeLinkClassName="!border-blue-500 !bg-blue-500 !text-white hover:!bg-blue-600 hover:!border-blue-600 dark:!border-blue-500 dark:!bg-blue-500"
                            disabledClassName="opacity-40 cursor-not-allowed"
                            disabledLinkClassName="hover:border-gray-200 hover:bg-white hover:text-gray-700 dark:hover:border-gray-700 dark:hover:bg-gray-800"
                            forcePage={currentPage}
                        />
                    </div>
                )}
            </div>

            {selectedUser && (
                <>
                    <UserInfoDialog
                        open={showUserInfoDialog}
                        onOpenChange={setShowUserInfoDialog}
                        userId={selectedUser}
                        showUserId={isPlatformAdmin}
                    />
                    <EditUserDialog
                        open={showEditUserDialog}
                        onOpenChange={setShowEditUserDialog}
                        user={selectedUser}
                        onUserUpdated={handleUserUpdated}
                    />
                    <EditPhoneDialog
                        open={showEditPhoneDialog}
                        onOpenChange={setShowEditPhoneDialog}
                        user={selectedUser}
                        onPhoneUpdated={handlePhoneUpdated}
                    />
                    <EditUserAuthoritiesDialog
                        open={showEditAuthoritiesDialog}
                        onOpenChange={setShowEditAuthoritiesDialog}
                        user={selectedUser}
                        onAuthoritiesUpdated={handleAuthoritiesUpdated}
                    />
                </>
            )}
        </div>
    );
};

export default UserManagementTab;