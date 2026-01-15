// 用户创建/编辑对话框

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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from 'sonner'
import { userService, roleService, UserInfo, RoleInfo } from '@/services/admin.service'
import { Upload, X } from 'lucide-react'

interface UserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user?: UserInfo | null
  onSuccess?: () => void
}

const UserDialog: React.FC<UserDialogProps> = ({
  open,
  onOpenChange,
  user,
  onSuccess
}) => {
  const { t } = useTranslation('admin')
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [roles, setRoles] = useState<RoleInfo[]>([])
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    avatar: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const isEdit = !!user

  // 重置表单
  const resetForm = () => {
    setForm({
      name: user?.name || '',
      email: user?.email || '',
      password: '',
      confirmPassword: '',
      avatar: user?.avatar || ''
    })
    setErrors({})
  }

  // 加载角色列表
  const loadRoles = async () => {
    try {
      const response = await roleService.getAllRoles()
      setRoles(response || [])
    } catch (error) {
      console.error('Failed to load roles:', error)
    }
  }

  useEffect(() => {
    if (open) {
      resetForm()
      loadRoles()
    }
  }, [open, user])

  // 表单验证
  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!form.name.trim()) {
      newErrors.name = t('users.validation.nameRequired')
    } else if (form.name.length < 2) {
      newErrors.name = t('users.validation.nameMinLength')
    }

    if (!form.email.trim()) {
      newErrors.email = t('users.validation.emailRequired')
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = t('users.validation.emailInvalid')
    }

    if (!isEdit) {
      if (!form.password) {
        newErrors.password = t('users.validation.passwordRequired')
      } else if (form.password.length < 6) {
        newErrors.password = t('users.validation.passwordMinLength')
      }

      if (!form.confirmPassword) {
        newErrors.confirmPassword = t('users.validation.confirmPasswordRequired')
      } else if (form.password !== form.confirmPassword) {
        newErrors.confirmPassword = t('users.validation.passwordMismatch')
      }
    } else if (form.password && form.password !== form.confirmPassword) {
      newErrors.confirmPassword = t('users.validation.passwordMismatch')
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // 提交表单
  const handleSubmit = async () => {
    if (!validateForm()) return

    try {
      setLoading(true)

      if (isEdit) {
        await userService.updateUser(user.id, {
          name: form.name,
          email: form.email,
          avatar: form.avatar,
          password: form.password || undefined
        })
        toast.success(t('users.messages.updateSuccess'), {
          description: t('users.messages.updateSuccessDescription')
        })
      } else {
        await userService.createUser({
          name: form.name,
          email: form.email,
          password: form.password,
          avatar: form.avatar
        })
        toast.success(t('users.messages.createSuccess'), {
          description: t('users.messages.createSuccessDescription')
        })
      }

      onOpenChange(false)
      onSuccess?.()
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || t('common.operationFailed')
      toast.error(isEdit ? t('users.messages.updateFailed') : t('users.messages.createFailed'), {
        description: message
      })
    } finally {
      setLoading(false)
    }
  }

  // 上传头像
  const handleAvatarUpload = async (file: File) => {
    if (!file) return

    // 验证文件类型
    if (!['image/jpeg', 'image/png', 'image/gif'].includes(file.type)) {
      toast.error(t('users.validation.formatError'), {
        description: t('users.validation.imageFormat')
      })
      return
    }

    // 验证文件大小 (2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error(t('users.validation.fileTooLarge'), {
        description: t('users.validation.imageSizeLimit')
      })
      return
    }

    try {
      setUploading(true)
      // 这里需要实现头像上传接口
      // const response = await userService.uploadAvatar(file)
      // setForm(prev => ({ ...prev, avatar: response.data }))

      // 临时使用本地预览
      const reader = new FileReader()
      reader.onload = (e) => {
        if (e.target?.result) {
          setForm(prev => ({ ...prev, avatar: e.target.result as string }))
        }
      }
      reader.readAsDataURL(file)

      toast.success(t('users.messages.uploadSuccess'), {
        description: t('users.messages.avatarUpdated')
      })
    } catch (error) {
      toast.error(t('users.messages.uploadFailed'), {
        description: t('users.messages.uploadFailedDescription')
      })
    } finally {
      setUploading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? t('users.dialogs.edit_title') : t('users.dialogs.create_title')}
          </DialogTitle>
          <DialogDescription>
            {isEdit ? t('users.dialogs.edit_description') : t('users.dialogs.create_description')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 头像上传 */}
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={form.avatar} />
              <AvatarFallback>{form.name[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <Label htmlFor="avatar" className="cursor-pointer">
                <div className="flex items-center space-x-2 px-3 py-2 border border-dashed border-gray-300 rounded-md hover:border-gray-400 transition-colors">
                  {uploading ? (
                    <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  <span className="text-sm">
                    {uploading ? t('users.form.uploading') : t('users.form.uploadAvatar')}
                  </span>
                </div>
              </Label>
              <input
                id="avatar"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    handleAvatarUpload(file)
                  }
                }}
              />
              {form.avatar && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setForm(prev => ({ ...prev, avatar: '' }))}
                >
                  <X className="h-3 w-3 mr-1" />
                  {t('users.form.removeAvatar')}
                </Button>
              )}
            </div>
          </div>

          {/* 用户名 */}
          <div className="space-y-2">
            <Label htmlFor="name">{t('users.form.username')}</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
              placeholder={t('users.form.usernamePlaceholder')}
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          {/* 邮箱 */}
          <div className="space-y-2">
            <Label htmlFor="email">{t('users.form.email')}</Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
              placeholder={t('users.form.emailPlaceholder')}
              className={errors.email ? 'border-red-500' : ''}
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email}</p>
            )}
          </div>

          {/* 密码 */}
          <div className="space-y-2">
            <Label htmlFor="password">
              {t('users.form.password')}
              {isEdit && <span className="text-sm text-gray-500 ml-1">({t('users.form.leaveBlankNoChange')})</span>}
            </Label>
            <Input
              id="password"
              type="password"
              value={form.password}
              onChange={(e) => setForm(prev => ({ ...prev, password: e.target.value }))}
              placeholder={isEdit ? t('users.form.passwordPlaceholderEdit') : t('users.form.passwordPlaceholder')}
              className={errors.password ? 'border-red-500' : ''}
            />
            {errors.password && (
              <p className="text-sm text-red-500">{errors.password}</p>
            )}
          </div>

          {/* 确认密码 */}
          {(!isEdit || form.password) && (
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">
                {t('users.form.confirm_password')}
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                value={form.confirmPassword}
                onChange={(e) => setForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                placeholder={t('users.form.confirmPasswordPlaceholder')}
                className={errors.confirmPassword ? 'border-red-500' : ''}
              />
              {errors.confirmPassword && (
                <p className="text-sm text-red-500">{errors.confirmPassword}</p>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            {t('common.cancel')}
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? t('common.submitting') : (isEdit ? t('common.update') : t('common.create'))}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default UserDialog