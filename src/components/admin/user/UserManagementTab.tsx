import {useEffect, useState} from "react";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";
import {Badge} from "@/components/ui/badge";
import {useToast} from "@/hooks/use-toast";
import {getPermissionRoleDisplayName, getUserPermissionRoleDisplayNames, PermissionRoles} from "@/lib/permissionUtils";
import {formatDateTime} from "@/lib/utils.ts";
import {userApi} from "@/integrations/api/userApi.ts";
import {Button} from "@/components/ui/button.tsx";
import {
    PlusCircle,
    Eye,
    Pencil,
    ChevronRightIcon,
    ChevronLeftIcon,
    Phone,
    Shield,
    Search,
    Asterisk
} from "lucide-react";
import {AdminInstitutionSelector} from "@/components/admin/institution/AdminInstitutionSelector.tsx";
import {getCurrentUserInfoFromSession} from "@/lib/authUtils.ts";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog.tsx";
import AddUserToInstitutionForm from "@/components/admin/user/AddUserToInstitutionForm.tsx";
import {
    Dialog as InfoDialog,
    DialogContent as InfoDialogContent,
    DialogHeader as InfoDialogHeader,
    DialogTitle as InfoDialogTitle,
    DialogTrigger as InfoDialogTrigger,
} from "@/components/ui/dialog.tsx";
import {EducationLevels, ID_TYPES} from "@/lib/enums";
import ReactPaginate from "react-paginate";
import EditUserDialog from "@/components/admin/user/EditUserDialog.tsx";
import EditPhoneDialog from "@/components/admin/user/EditPhoneDialog.tsx";
import EditUserAuthoritiesDialog from "@/components/admin/user/EditUserAuthoritiesDialog.tsx";
import {ScrollArea} from "@radix-ui/react-scroll-area";
import {institutionApi} from "@/integrations/api/institutionApi.ts";
import {useDebounce} from "@/hooks/useDebounce";
import {Input} from "@/components/ui/FormValidator.tsx";

const UserManagementTab = () => {
    const [users, setUsers] = useState<any[]>([]);
    const [userRoles, setUserRoles] = useState<Record<string, string[]>>({});
    const [loading, setLoading] = useState(false);
    const [showAddUserDialog, setShowAddUserDialog] = useState(false);
    const [selectedInstitutionId, setSelectedInstitutionId] = useState<string | null>(null);
    const [isPlatformAdmin, setIsPlatformAdmin] = useState<boolean>(false);
    const [userInstitutionId, setUserInstitutionId] = useState<string | null>(null);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [showUserInfoDialog, setShowUserInfoDialog] = useState(false);
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0); // 新增总元素数状态
    const [showEditUserDialog, setShowEditUserDialog] = useState(false);
    const [showEditPhoneDialog, setShowEditPhoneDialog] = useState(false);
    const [showEditAuthoritiesDialog, setShowEditAuthoritiesDialog] = useState(false);
    const [searchPhone, setSearchPhone] = useState(""); // 新增手机号搜索状态
    const [searchResultUser, setSearchResultUser] = useState<any>(null); // 存储搜索结果用户
    // 存储机构信息的状态
    const [institutionMap, setInstitutionMap] = useState<Record<string, { fullName: string }>>({});
    const {toast} = useToast();
    
    // 添加防抖处理，延迟550ms
    const debouncedSearchPhone = useDebounce(searchPhone, 550);

    // 检查用户是否为平台管理员并获取用户所属机构，同时初始化用户列表
    useEffect(() => {
        const userInfo = getCurrentUserInfoFromSession();
        if (userInfo) {
            const isPlatformAdminUser = userInfo.roles.includes(PermissionRoles.PLATFORM_ADMIN);
            setIsPlatformAdmin(isPlatformAdminUser);
            setUserInstitutionId(userInfo.user.institutionId);

            // 设置初始机构
            if (!isPlatformAdminUser) {
                setSelectedInstitutionId(userInfo.user.institutionId);
            }
        }
    }, []);

    // 自动获取用户列表
    useEffect(() => {
        // 平台管理员：可以立即获取（不选机构时获取所有用户）
        // 非平台管理员：需要等待机构设置
        if (isPlatformAdmin || selectedInstitutionId) {
            setCurrentPage(0);
            fetchUsers(0);
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

    const fetchUsers = async (page: number = 0) => {
        if (!selectedInstitutionId && !isPlatformAdmin) {
            setUsers([]);
            setUserRoles({});
            return;
        }

        setLoading(true);
        try {
            // 获取用户列表
            const size = 5;
            let response;
            
            if (isPlatformAdmin && !selectedInstitutionId) {
                // 平台管理员且未选择机构时，获取所有用户
                response = await userApi.getAllUsers(page, size);
            } else {
                // 获取指定机构的用户列表
                response = await userApi.getUsers(page, size, selectedInstitutionId!);
            }

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
        const searchPhoneValue = phone || debouncedSearchPhone;
        
        // 如果搜索框为空，清空搜索结果并重新加载用户列表
        if (!searchPhoneValue.trim()) {
            setSearchResultUser(null);
            setSearchPhone(""); // 清空搜索框
            fetchUsers(0); // 重置到第一页
            setCurrentPage(0);
            return;
        }

        // 权限检查
        if (!isPlatformAdmin && !selectedInstitutionId) {
            toast({
                title: "错误",
                description: "请先选择机构",
                variant: "destructive"
            });
            return;
        }

        setLoading(true);
        try {
            const apiResponse = await userApi.getUserByPhone(searchPhoneValue);
            const user = apiResponse.data;
            
            if (user) {
                // 机构权限检查
                if (isPlatformAdmin) {
                    // 平台管理员可以查看任何用户，但显示提示
                    if (selectedInstitutionId && user.institutionId !== selectedInstitutionId) {
                        toast({
                            title: "提示",
                            description: "该用户不属于当前机构",
                        });
                    }
                } else {
                    // 非平台管理员只能查看本机构用户
                    if (user.institutionId !== userInstitutionId) {
                        toast({
                            title: "提示",
                            description: "该用户不属于当前机构",
                        });
                        setLoading(false);
                        return;
                    }
                }

                setSearchResultUser(user);
                
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
            } else {
                setSearchResultUser(null);
                toast({
                    title: "提示",
                    description: "未找到该手机号对应的用户",
                });
            }
        } catch (error: any) {
            console.error("搜索用户失败:", error);
            setSearchResultUser(null);
            toast({
                title: "错误",
                description: error.response?.data?.message || "搜索用户失败，请确认手机号是否正确",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    // 修改清空搜索的逻辑
    const handleClearSearch = () => {
        setSearchPhone("");
        setSearchResultUser(null);
        setCurrentPage(0);
        fetchUsers(0);
    };

    // 初始化获取用户列表
    useEffect(() => {
        setCurrentPage(0);
        fetchUsers(0);
    }, [selectedInstitutionId]);

    // 监听刷新事件
    useEffect(() => {
        const handleRefreshUsers = () => {
            if (debouncedSearchPhone.trim() && !searchResultUser) {
                // 如果正在搜索但还没有结果，执行搜索
                handleSearchByPhone();
            } else if (debouncedSearchPhone.trim() && searchResultUser) {
                // 如果有搜索结果，重新执行搜索来刷新
                handleSearchByPhone();
            } else {
                // 否则正常刷新用户列表
                fetchUsers(currentPage);
            }
        };

        window.addEventListener('refresh-users', handleRefreshUsers);

        return () => {
            window.removeEventListener('refresh-users', handleRefreshUsers);
        };
    }, [selectedInstitutionId, currentPage, debouncedSearchPhone, searchResultUser]);

    // 监听防抖后的搜索值变化，执行搜索
    useEffect(() => {
        // 只有当搜索值不为空时才执行搜索
        if (debouncedSearchPhone.trim()) {
            handleSearchByPhone();
        }
    }, [debouncedSearchPhone]);

    const handleUserAdded = () => {
        // 根据是否有搜索条件决定刷新方式
        if (searchPhone.trim()) {
            handleSearchByPhone();
        } else {
            fetchUsers(currentPage);
        }
        setShowAddUserDialog(false);
    };

    const showUserDetails = (user: any) => {
        setSelectedUser(user);
        setShowUserInfoDialog(true);

        // 确保机构信息已加载
        if (user.institutionId && !institutionMap[user.institutionId]) {
            fetchInstitutionDetails(user.institutionId);
        }
    };

    const handleUserUpdated = () => {
        // 根据是否有搜索条件决定刷新方式
        if (searchPhone.trim()) {
            handleSearchByPhone();
        } else {
            fetchUsers(currentPage);
        }
        setShowEditUserDialog(false);
    };

    const handlePhoneUpdated = (newPhone: string) => {
        // 根据是否有搜索条件决定刷新方式
        if (searchPhone.trim()) {
            setSearchPhone(newPhone);
            handleSearchByPhone(newPhone);
        } else {
            fetchUsers(currentPage);
        }
        setShowEditPhoneDialog(false);
    };

    const handleAuthoritiesUpdated = () => {
        // 根据是否有搜索条件决定刷新方式
        if (searchPhone.trim()) {
            handleSearchByPhone();
        } else {
            fetchUsers(currentPage);
        }
        setShowEditAuthoritiesDialog(false);
    };

    // 对证件号码进行脱敏处理
    const maskIdNumber = (idType: string, idNumber: string) => {
        if (!idNumber) return "未填写";

        switch (idType) {
            case 'NATIONAL_ID':
                // 身份证：显示前6位和后4位，中间用*代替
                return idNumber.replace(/(\d{6})\d+(\d{4})/, '$1**********$2');
            case 'PASSPORT':
                // 护照：显示前2位和后2位，中间用*代替
                return idNumber.replace(/(.{2}).*(.{2})/, '$1******$2');
            default:
                // 其他类型：显示前1/3和后1/3，中间用*代替
                const showLength = Math.max(1, Math.floor(idNumber.length / 3));
                const regExp = new RegExp(`(.{${showLength}}).*?(.{${showLength}})$`);
                return idNumber.replace(regExp, `$1${'*'.repeat(Math.max(3, idNumber.length - showLength * 2))}$2`);
        }
    };

    // 处理页面更改
    const handlePageClick = (event: { selected: number }) => {
        const page = event.selected;
        setCurrentPage(page);
        fetchUsers(page);
    };

    // 渲染信息字段的辅助函数
    const renderInfoField = (label: string, value: string) => (
        <div className="grid grid-cols-4 items-center gap-4">
            <span className="text-right col-span-1 font-medium">{label}</span>
            <span className="col-span-3">{value}</span>
        </div>
    );

    return (
        <div className="space-y-6">
                    {isPlatformAdmin && (
                        <div className="mb-6 p-4 border rounded-lg bg-muted/50">
                            <AdminInstitutionSelector
                                value={selectedInstitutionId}
                                onChange={setSelectedInstitutionId}
                                placeholder="选择要管理的机构（可选）"
                            />
                        </div>
                    )}
                    <div className="mb-6 p-4 border rounded-lg bg-muted/50  flex justify-between items-center">
                        {/* 添加手机号搜索框 */}
                        <div className="flex gap-2 max-w-lg">
                            <div className="relative flex-1">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground"/>
                                <Input
                                    placeholder="输入完整手机号搜索用户"
                                    value={searchPhone}
                                    onChange={(e) => {
                                        setSearchPhone(e.target.value);
                                        // 如果清空搜索框，立即清空搜索结果
                                        if (!e.target.value.trim()) {
                                            handleClearSearch();
                                        }
                                    }}
                                    className="pl-8 w-72"
                                    onKeyDown={async (e) => {
                                        if (e.key === 'Enter') {
                                            await handleSearchByPhone();
                                        }
                                    }}
                                    maxLength={20}
                                />
                            </div>
                            <Button 
                                onClick={() => handleSearchByPhone()}
                                disabled={loading || !searchPhone.trim()}
                            >
                                {loading ? "搜索中..." : "搜索"}
                            </Button>
                            {(searchResultUser || searchPhone) && (
                                <Button
                                    variant="outline"
                                    onClick={handleClearSearch}
                                    disabled={loading}
                                >
                                    清空搜索
                                </Button>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <Dialog open={showAddUserDialog} onOpenChange={setShowAddUserDialog}>
                                <DialogTrigger asChild>
                                    <Button
                                        onClick={() => setShowAddUserDialog(true)}
                                        disabled={!selectedInstitutionId}
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
                                            <Asterisk className="h-3 w-3 text-red-500" />
                                            <span>标记的字段为必填项</span>
                                        </div>
                                    </div>
                                    <div className="flex-1 overflow-hidden overflow-y-auto">
                                        <ScrollArea className="h-full w-full pr-4">
                                            <div className="h-[calc(85vh-100px)]">
                                                {selectedInstitutionId && (
                                                    <AddUserToInstitutionForm
                                                        institutionId={selectedInstitutionId}
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
                        <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                    ) : (selectedInstitutionId || isPlatformAdmin) ? (
                        <>

                            <Table className="border rounded-md">
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>姓名</TableHead>
                                        <TableHead>手机号</TableHead>
                                        <TableHead>角色</TableHead>
                                        <TableHead>注册时间</TableHead>
                                        <TableHead>操作</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {searchResultUser ? (
                                        // 显示单个搜索结果
                                        <TableRow key={searchResultUser.id}>
                                            {/* 表格内容保持不变 */}
                                            <TableCell className="font-medium">{searchResultUser.realName}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    {searchResultUser.phone || '-'}
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="p-1 h-auto"
                                                        onClick={() => {
                                                            setSelectedUser(searchResultUser);
                                                            setShowEditPhoneDialog(true);
                                                        }}
                                                    >
                                                        <Phone className="h-4 w-4 text-muted-foreground hover:text-foreground"/>
                                                    </Button>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <div>
                                                        {userRoles[searchResultUser.id]?.map((role, index) => (
                                                            <Badge key={index} variant="outline" className="mr-1">
                                                                {getPermissionRoleDisplayName(role)}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                    {(isPlatformAdmin || !searchResultUser.authorities.includes(PermissionRoles.PLATFORM_ADMIN)) && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="p-1 h-auto"
                                                            onClick={() => {
                                                                setSelectedUser(searchResultUser);
                                                                setShowEditAuthoritiesDialog(true);
                                                            }}
                                                        >
                                                            <Shield className="h-4 w-4 text-muted-foreground hover:text-foreground"/>
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>{formatDateTime(searchResultUser.createdAt)}</TableCell>
                                            <TableCell className="flex gap-2">
                                                <InfoDialog open={showUserInfoDialog && selectedUser?.id === searchResultUser.id}
                                                            onOpenChange={setShowUserInfoDialog}>
                                                    <InfoDialogTrigger asChild>
                                                        <Button variant="outline" size="sm"
                                                                onClick={() => showUserDetails(searchResultUser)}>
                                                            <Eye className="h-4 w-4"/>
                                                        </Button>
                                                    </InfoDialogTrigger>
                                                    <InfoDialogContent className="max-w-2xl">
                                                        <InfoDialogHeader>
                                                            <InfoDialogTitle>用户详细信息</InfoDialogTitle>
                                                        </InfoDialogHeader>
                                                        {selectedUser && (
                                                            <div className="grid gap-4 py-4">
                                                                {renderInfoField("ID:", selectedUser.id)}
                                                                {renderInfoField("用户名:", selectedUser.username)}
                                                                {renderInfoField("真实姓名:", selectedUser.realName)}
                                                                {renderInfoField("邮箱:", selectedUser.email)}
                                                                {renderInfoField("手机号:", selectedUser.phone || "-")}
                                                                {renderInfoField(
                                                                    "所属机构:",
                                                                    selectedUser.institutionId
                                                                        ? (institutionMap[selectedUser.institutionId]?.fullName || selectedUser.institutionId)
                                                                        : "未分配"
                                                                )}
                                                                {renderInfoField("注册时间:", formatDateTime(selectedUser.createdAt))}
                                                                {renderInfoField(
                                                                    "证件类型:",
                                                                    selectedUser.idType
                                                                        ? (ID_TYPES[selectedUser.idType] || selectedUser.idType)
                                                                        : "未填写"
                                                                )}

                                                                {renderInfoField(
                                                                    "证件号码:",
                                                                    maskIdNumber(selectedUser.idType, selectedUser.idNumber)
                                                                )}

                                                                {renderInfoField(
                                                                    "学历:",
                                                                    selectedUser.education
                                                                        ? (EducationLevels[selectedUser.education as keyof typeof EducationLevels] || selectedUser.education)
                                                                        : "未填写"
                                                                )}

                                                                {renderInfoField("职称:", selectedUser.title || "未填写")}
                                                                {renderInfoField("专业领域:", selectedUser.field || "未填写")}

                                                                {/* 角色字段特殊处理 */}
                                                                <div className="grid grid-cols-4 items-start gap-4">
                                                                    <span
                                                                        className="text-right font-medium">角色:</span>
                                                                    <div className="col-span-3">
                                                                        {userRoles[selectedUser.id]?.map((role, index) => (
                                                                            <Badge key={index} variant="outline"
                                                                                   className="mr-1 mb-1">
                                                                                {getPermissionRoleDisplayName(role)}
                                                                            </Badge>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </InfoDialogContent>
                                                </InfoDialog>

                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => {
                                                        setSelectedUser(searchResultUser);
                                                        setShowEditUserDialog(true);
                                                    }}
                                                >
                                                    <Pencil className="h-4 w-4"/>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        // 显示正常用户列表
                                        users?.map((user) => (
                                            <TableRow key={user.id}>
                                                <TableCell className="font-medium">{user.realName}</TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        {user.phone || '-'}
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
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <div>
                                                            {userRoles[user.id]?.map((role, index) => (
                                                                <Badge key={index} variant="outline" className="mr-1">
                                                                    {getPermissionRoleDisplayName(role)}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                        {(isPlatformAdmin || !user.authorities.includes(PermissionRoles.PLATFORM_ADMIN)) && (
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
                                                <TableCell>{formatDateTime(user.createdAt)}</TableCell>
                                                <TableCell className="flex gap-2">
                                                    <InfoDialog open={showUserInfoDialog && selectedUser?.id === user.id}
                                                                onOpenChange={setShowUserInfoDialog}>
                                                        <InfoDialogTrigger asChild>
                                                            <Button variant="outline" size="sm"
                                                                    onClick={() => showUserDetails(user)}>
                                                                <Eye className="h-4 w-4"/>
                                                            </Button>
                                                        </InfoDialogTrigger>
                                                        <InfoDialogContent className="max-w-2xl">
                                                            <InfoDialogHeader>
                                                                <InfoDialogTitle>用户详细信息</InfoDialogTitle>
                                                            </InfoDialogHeader>
                                                            {selectedUser && (
                                                                <div className="grid gap-4 py-4">
                                                                    {renderInfoField("ID:", selectedUser.id)}
                                                                    {renderInfoField("用户名:", selectedUser.username)}
                                                                    {renderInfoField("真实姓名:", selectedUser.realName)}
                                                                    {renderInfoField("邮箱:", selectedUser.email)}
                                                                    {renderInfoField("手机号:", selectedUser.phone || "-")}
                                                                    {renderInfoField(
                                                                        "所属机构:",
                                                                        selectedUser.institutionId
                                                                            ? (institutionMap[selectedUser.institutionId]?.fullName || selectedUser.institutionId)
                                                                            : "未分配"
                                                                    )}
                                                                    {renderInfoField("注册时间:", formatDateTime(selectedUser.createdAt))}
                                                                    {renderInfoField(
                                                                        "证件类型:",
                                                                        selectedUser.idType
                                                                            ? (ID_TYPES[selectedUser.idType] || selectedUser.idType)
                                                                            : "未填写"
                                                                    )}

                                                                    {renderInfoField(
                                                                        "证件号码:",
                                                                        maskIdNumber(selectedUser.idType, selectedUser.idNumber)
                                                                    )}

                                                                    {renderInfoField(
                                                                        "学历:",
                                                                        selectedUser.education
                                                                            ? (EducationLevels[selectedUser.education as keyof typeof EducationLevels] || selectedUser.education)
                                                                            : "未填写"
                                                                    )}

                                                                    {renderInfoField("职称:", selectedUser.title || "未填写")}
                                                                    {renderInfoField("专业领域:", selectedUser.field || "未填写")}

                                                                    {/* 角色字段特殊处理 */}
                                                                    <div className="grid grid-cols-4 items-start gap-4">
                                                                        <span
                                                                            className="text-right font-medium">角色:</span>
                                                                        <div className="col-span-3">
                                                                            {userRoles[selectedUser.id]?.map((role, index) => (
                                                                                <Badge key={index} variant="outline"
                                                                                       className="mr-1 mb-1">
                                                                                    {getPermissionRoleDisplayName(role)}
                                                                                </Badge>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </InfoDialogContent>
                                                    </InfoDialog>

                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => {
                                                            setSelectedUser(user);
                                                            setShowEditUserDialog(true);
                                                        }}
                                                    >
                                                        <Pencil className="h-4 w-4"/>
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                            
                            {/* 显示总数信息 */}
                            {!searchResultUser && (
                                <div className="mt-4 text-sm text-muted-foreground flex justify-between items-center">
                                    <div>
                                        共 {totalElements} 条记录
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
                            )}
                        </>
                    ) : (
                        <div className="text-center py-8 text-muted-foreground">
                            {isPlatformAdmin 
                                ? "请选择一个机构以查看其用户列表，或不选择机构查看所有用户" 
                                : "请选择一个机构以查看其用户列表"}
                        </div>
                    )}
            {selectedUser && (
                <>
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