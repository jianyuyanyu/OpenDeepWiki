// 用户角色分配对话框

import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from 'sonner'
import { userService, roleService, UserInfo, RoleInfo } from '@/services/admin.service'
import { Loader2 } from 'lucide-react'

interface UserRoleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user?: UserInfo | null
  onSuccess?: () => void
}

const UserRoleDialog: React.FC<UserRoleDialogProps> = ({
  open,
  onOpenChange,
  user,
  onSuccess
}) => {
  const { t } = useTranslation('admin')
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [roles, setRoles] = useState<RoleInfo[]>([])
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([])
  const [currentUserRoleIds, setCurrentUserRoleIds] = useState<string[]>([])

  // 加载角色列表
  const loadRoles = async () => {
    try {
      setLoading(true)
      const response = await roleService.getAllRoles()
      // 确保 response 是数组
      const rolesData = Array.isArray(response) ? response : (response?.data || [])
      setRoles(rolesData)
    } catch (error) {
      console.error('Failed to load roles:', error)
      toast.error(t('users.messages.loadFailed'), {
        description: t('users.messages.loadRolesFailed')
      })
    } finally {
      setLoading(false)
    }
  }

  // 加载用户当前角色
  const loadUserRoles = async () => {
    if (!user?.id) return

    try {
      const response = await userService.getUserRoles(user.id)
      const roleIds = Array.isArray(response.data) ? response.data : (Array.isArray(response) ? response : [])
      setCurrentUserRoleIds(roleIds)
      setSelectedRoleIds([...roleIds])
    } catch (error) {
      console.error('Failed to load user roles:', error)
      toast.error(t('users.messages.loadFailed'), {
        description: t('users.messages.loadUserRolesFailed')
      })
    }
  }

  useEffect(() => {
    if (open && user) {
      loadRoles()
      loadUserRoles()
    }
  }, [open, user])

  // 处理角色选择
  const handleRoleToggle = (roleId: string, checked: boolean) => {
    setSelectedRoleIds(prev => {
      if (checked) {
        return [...prev, roleId]
      } else {
        return prev.filter(id => id !== roleId)
      }
    })
  }

  // 提交角色分配
  const handleSubmit = async () => {
    if (!user?.id) return

    try {
      setSubmitting(true)

      await userService.assignUserRoles(user.id, selectedRoleIds)

      toast.success(t('users.messages.assignSuccess'), {
        description: t('users.messages.assignSuccessDescription')
      })

      onOpenChange(false)
      onSuccess?.()
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || t('users.messages.assignFailed')
      toast.error(t('users.messages.assignFailed'), {
        description: message
      })
    } finally {
      setSubmitting(false)
    }
  }

  // 检查是否有变更
  const hasChanges = () => {
    if (selectedRoleIds.length !== currentUserRoleIds.length) return true
    return selectedRoleIds.some(id => !currentUserRoleIds.includes(id))
  }

  // 获取角色变更状态
  const getRoleChangeStatus = (roleId: string) => {
    const wasSelected = currentUserRoleIds.includes(roleId)
    const isSelected = selectedRoleIds.includes(roleId)

    if (!wasSelected && isSelected) return 'added'
    if (wasSelected && !isSelected) return 'removed'
    return 'unchanged'
  }

  // 获取角色状态颜色
  const getRoleStatusColor = (status: string) => {
    switch (status) {
      case 'added':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'removed':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  if (!user) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{t('admin.users.assign_roles')}</DialogTitle>
          <DialogDescription>
            {t('users.dialogs.assignRolesDescription')}
          </DialogDescription>
        </DialogHeader>

        {/* 用户信息 */}
        <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user.avatar} />
            <AvatarFallback>{user.name[0]?.toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{user.name}</div>
            <div className="text-sm text-gray-500">{user.email}</div>
          </div>
        </div>

        {/* 角色列表 */}
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">{t('users.dialogs.loadingRoles')}</span>
            </div>
          ) : roles.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {t('users.dialogs.noRolesAvailable')}
            </div>
          ) : (
            <div className="space-y-3">
              {Array.isArray(roles) && roles.map((role) => {
                const isSelected = selectedRoleIds.includes(role.id)
                const changeStatus = getRoleChangeStatus(role.id)

                return (
                  <div
                    key={role.id}
                    className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50"
                  >
                    <Checkbox
                      id={role.id}
                      checked={isSelected}
                      onCheckedChange={(checked) => handleRoleToggle(role.id, checked as boolean)}
                      disabled={role.isSystemRole}
                    />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <label
                          htmlFor={role.id}
                          className="font-medium cursor-pointer"
                        >
                          {role.name}
                        </label>
                        {role.isSystemRole && (
                          <Badge variant="secondary" className="text-xs">
                            {t('roles.type.system')}
                          </Badge>
                        )}
                        {changeStatus !== 'unchanged' && (
                          <Badge
                            variant="outline"
                            className={`text-xs ${getRoleStatusColor(changeStatus)}`}
                          >
                            {changeStatus === 'added' ? t('common.added') : t('common.removed')}
                          </Badge>
                        )}
                      </div>
                      {role.description && (
                        <p className="text-sm text-gray-500 mt-1">
                          {role.description}
                        </p>
                      )}
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                        <span>{t('users.dialogs.userCount')}: {role.userCount || 0}</span>
                        <span>{t('users.dialogs.permissionCount')}: {role.warehousePermissionCount || 0}</span>
                        <span>{t('users.dialogs.status')}: {role.isActive ? t('common.enabled') : t('common.disabled')}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* 变更摘要 */}
        {hasChanges() && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">{t('users.dialogs.changeSummary')}</h4>
            <div className="space-y-1 text-sm">
              {roles
                .filter(role => getRoleChangeStatus(role.id) !== 'unchanged')
                .map(role => {
                  const status = getRoleChangeStatus(role.id)
                  return (
                    <div key={role.id} className="flex items-center space-x-2">
                      <span className={`inline-block w-2 h-2 rounded-full ${
                        status === 'added' ? 'bg-green-500' : 'bg-red-500'
                      }`} />
                      <span>
                        {status === 'added' ? t('common.add') : t('common.remove')} {t('users.dialogs.role')}: {role.name}
                      </span>
                    </div>
                  )
                })}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            {t('common.cancel')}
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || !hasChanges()}
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                {t('users.dialogs.assigning')}
              </>
            ) : (
              t('users.dialogs.confirmAssign')
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default UserRoleDialog