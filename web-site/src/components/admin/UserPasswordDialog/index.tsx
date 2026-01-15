// 用户密码重置对话框

import React, { useState } from 'react'
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
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'
import { userService, UserInfo } from '@/services/admin.service'
import { Loader2, AlertTriangle } from 'lucide-react'

interface UserPasswordDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user?: UserInfo | null
  onSuccess?: () => void
}

const UserPasswordDialog: React.FC<UserPasswordDialogProps> = ({
  open,
  onOpenChange,
  user,
  onSuccess
}) => {
  const { t } = useTranslation('admin')
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    newPassword: '',
    confirmPassword: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  // 重置表单
  const resetForm = () => {
    setForm({
      newPassword: '',
      confirmPassword: ''
    })
    setErrors({})
  }

  // 表单验证
  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!form.newPassword) {
      newErrors.newPassword = t('users.validation.passwordRequired')
    } else if (form.newPassword.length < 6) {
      newErrors.newPassword = t('users.validation.passwordMinLength')
    }

    if (!form.confirmPassword) {
      newErrors.confirmPassword = t('users.validation.confirmPasswordRequired')
    } else if (form.newPassword !== form.confirmPassword) {
      newErrors.confirmPassword = t('users.validation.passwordMismatch')
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // 提交重置
  const handleSubmit = async () => {
    if (!user?.id || !validateForm()) return

    try {
      setLoading(true)

      await userService.resetUserPassword(user.id, form.newPassword)

      toast.success(t('users.messages.resetSuccess'), {
        description: t('users.messages.resetSuccessDescription')
      })

      onOpenChange(false)
      onSuccess?.()
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || t('users.messages.resetFailed')
      toast.error(t('users.messages.resetFailed'), {
        description: message
      })
    } finally {
      setLoading(false)
    }
  }

  // 监听对话框开关
  React.useEffect(() => {
    if (open) {
      resetForm()
    }
  }, [open])

  if (!user) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>{t('users.dialogs.resetPasswordTitle')}</DialogTitle>
          <DialogDescription>
            {t('users.dialogs.resetPasswordDescription')}
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

        {/* 安全提示 */}
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {t('users.dialogs.resetPasswordWarning')}
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          {/* 新密码 */}
          <div className="space-y-2">
            <Label htmlFor="newPassword">{t('users.form.newPassword')}</Label>
            <Input
              id="newPassword"
              type="password"
              value={form.newPassword}
              onChange={(e) => setForm(prev => ({ ...prev, newPassword: e.target.value }))}
              placeholder={t('users.form.newPasswordPlaceholder')}
              className={errors.newPassword ? 'border-red-500' : ''}
            />
            {errors.newPassword && (
              <p className="text-sm text-red-500">{errors.newPassword}</p>
            )}
            <p className="text-xs text-gray-500">
              {t('users.form.passwordHint')}
            </p>
          </div>

          {/* 确认密码 */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">{t('users.form.confirmPassword')}</Label>
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
            variant="destructive"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                {t('users.dialogs.resetting')}
              </>
            ) : (
              t('users.dialogs.confirmReset')
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default UserPasswordDialog