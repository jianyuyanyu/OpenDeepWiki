"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
  getUsers,
  getRoles,
  createUser,
  deleteUser,
  updateUserStatus,
  updateUserRoles,
  resetUserPassword,
  AdminUser,
  AdminRole,
  UserListResponse,
} from "@/lib/admin-api";
import {
  Loader2,
  Search,
  Trash2,
  Edit,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Plus,
  Key,
  Shield,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";

export default function AdminUsersPage() {
  const [data, setData] = useState<UserListResponse | null>(null);
  const [roles, setRoles] = useState<AdminRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showRolesDialog, setShowRolesDialog] = useState<AdminUser | null>(null);
  const [showPasswordDialog, setShowPasswordDialog] = useState<AdminUser | null>(null);
  
  const [newUser, setNewUser] = useState({ name: "", email: "", password: "" });
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [newPassword, setNewPassword] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [usersResult, rolesResult] = await Promise.all([
        getUsers(page, 20, search || undefined, roleFilter === "all" ? undefined : roleFilter),
        getRoles(),
      ]);
      setData(usersResult);
      setRoles(rolesResult);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      toast.error("获取用户列表失败");
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSearch = () => {
    setPage(1);
    fetchData();
  };

  const handleCreate = async () => {
    if (!newUser.name || !newUser.email || !newUser.password) {
      toast.error("请填写完整信息");
      return;
    }
    try {
      await createUser(newUser);
      toast.success("创建成功");
      setShowCreateDialog(false);
      setNewUser({ name: "", email: "", password: "" });
      fetchData();
    } catch (error) {
      toast.error("创建失败");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteUser(deleteId);
      toast.success("删除成功");
      setDeleteId(null);
      fetchData();
    } catch (error) {
      toast.error("删除失败");
    }
  };

  const handleStatusChange = async (id: string, newStatus: number) => {
    try {
      await updateUserStatus(id, newStatus);
      toast.success("状态更新成功");
      fetchData();
    } catch (error) {
      toast.error("状态更新失败");
    }
  };

  const handleRolesUpdate = async () => {
    if (!showRolesDialog) return;
    try {
      await updateUserRoles(showRolesDialog.id, selectedRoles);
      toast.success("角色更新成功");
      setShowRolesDialog(null);
      fetchData();
    } catch (error) {
      toast.error("角色更新失败");
    }
  };

  const handlePasswordReset = async () => {
    if (!showPasswordDialog || !newPassword) return;
    try {
      await resetUserPassword(showPasswordDialog.id, newPassword);
      toast.success("密码重置成功");
      setShowPasswordDialog(null);
      setNewPassword("");
    } catch (error) {
      toast.error("密码重置失败");
    }
  };

  const openRolesDialog = (user: AdminUser) => {
    setSelectedRoles(user.roles || []);
    setShowRolesDialog(user);
  };

  const totalPages = data ? Math.ceil(data.total / data.pageSize) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">用户管理</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchData}>
            <RefreshCw className="mr-2 h-4 w-4" />
            刷新
          </Button>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            新增用户
          </Button>
        </div>
      </div>

      {/* 搜索和筛选 */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex flex-1 gap-2">
            <Input
              placeholder="搜索用户名或邮箱..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="max-w-md"
            />
            <Button onClick={handleSearch}>
              <Search className="mr-2 h-4 w-4" />
              搜索
            </Button>
          </div>
          <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v); setPage(1); }}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="筛选角色" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部角色</SelectItem>
              {roles.map((role) => (
                <SelectItem key={role.id} value={role.id}>
                  {role.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* 用户列表 */}
      <Card>
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium">用户</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">邮箱</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">角色</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">状态</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">创建时间</th>
                    <th className="px-4 py-3 text-right text-sm font-medium">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data?.items.map((user) => (
                    <tr key={user.id} className="hover:bg-muted/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user.avatar} />
                            <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{user.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {user.email || "-"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {user.roles?.map((role) => (
                            <span
                              key={role}
                              className="inline-flex items-center rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary"
                            >
                              {role}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Select
                          value={user.status.toString()}
                          onValueChange={(v) => handleStatusChange(user.id, parseInt(v))}
                        >
                          <SelectTrigger className="w-[100px]">
                            <span className={`px-2 py-1 rounded text-xs ${
                              user.status === 1
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                            }`}>
                              {user.status === 1 ? "正常" : "禁用"}
                            </span>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">正常</SelectItem>
                            <SelectItem value="0">禁用</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {new Date(user.createdAt).toLocaleDateString("zh-CN")}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            title="分配角色"
                            onClick={() => openRolesDialog(user)}
                          >
                            <Shield className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="重置密码"
                            onClick={() => setShowPasswordDialog(user)}
                          >
                            <Key className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="删除"
                            onClick={() => setDeleteId(user.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 分页 */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t px-4 py-3">
                <p className="text-sm text-muted-foreground">共 {data?.total} 条记录</p>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm">{page} / {totalPages}</span>
                  <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(page + 1)}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      {/* 新增用户对话框 */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新增用户</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">用户名 *</label>
              <Input
                value={newUser.name}
                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                placeholder="请输入用户名"
              />
            </div>
            <div>
              <label className="text-sm font-medium">邮箱 *</label>
              <Input
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                placeholder="请输入邮箱"
              />
            </div>
            <div>
              <label className="text-sm font-medium">密码 *</label>
              <Input
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                placeholder="请输入密码"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>取消</Button>
            <Button onClick={handleCreate}>创建</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 角色分配对话框 */}
      <Dialog open={!!showRolesDialog} onOpenChange={() => setShowRolesDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>分配角色 - {showRolesDialog?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {roles.map((role) => (
              <div key={role.id} className="flex items-center gap-2">
                <Checkbox
                  id={role.id}
                  checked={selectedRoles.includes(role.name)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedRoles([...selectedRoles, role.name]);
                    } else {
                      setSelectedRoles(selectedRoles.filter((r) => r !== role.name));
                    }
                  }}
                />
                <label htmlFor={role.id} className="text-sm">
                  {role.name}
                  {role.description && (
                    <span className="ml-2 text-muted-foreground">({role.description})</span>
                  )}
                </label>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRolesDialog(null)}>取消</Button>
            <Button onClick={handleRolesUpdate}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 重置密码对话框 */}
      <Dialog open={!!showPasswordDialog} onOpenChange={() => setShowPasswordDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>重置密码 - {showPasswordDialog?.name}</DialogTitle>
          </DialogHeader>
          <div>
            <label className="text-sm font-medium">新密码</label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="请输入新密码"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPasswordDialog(null)}>取消</Button>
            <Button onClick={handlePasswordReset}>确认重置</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              此操作将删除该用户及其所有相关数据，且无法恢复。确定要继续吗？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
