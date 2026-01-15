// 批量删除确认对话框

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
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from 'sonner'
import { userService, UserInfo } from '@/services/admin.service'
import { Loader2, AlertTriangle, Trash2 } from 'lucide-react'

interface BatchDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  users: UserInfo[]
  onSuccess?: () => void
}

const BatchDeleteDialog: React.FC<BatchDeleteDialogProps> = ({
  open,
  onOpenChange,
  users,
  onSuccess
}) => {
  const { t } = useTranslation('admin')
  const [loading, setLoading] = useState(false)

  // 提交批量删除
  const handleSubmit = async () => {
    if (users.length === 0) return

    try {
      setLoading(true)

      const userIds = users.map(user => user.id)
      await userService.batchDeleteUsers(userIds)

      toast.success(t('users.messages.deleteSuccess'), {
        description: t('users.messages.batchDeleteSuccessDescription', { count: users.length })
      })

      onOpenChange(false)
      onSuccess?.()
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || t('users.messages.deleteFailed')
      toast.error(t('users.messages.deleteFailed'), {
        description: message
      })
    } finally {
      setLoading(false)
    }
  }

  if (users.length === 0) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Trash2 className="h-5 w-5 text-red-500" />
            <span>{t('users.dialogs.batchDeleteTitle')}</span>
          </DialogTitle>
          <DialogDescription>
            {t('users.dialogs.batchDeleteDescription', { count: users.length })}
          </DialogDescription>
        </DialogHeader>

        {/* 安全警告 */}
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>{t('users.dialogs.deleteWarningTitle')}:</strong> {t('users.dialogs.deleteWarningContent')}
            <ul className="mt-2 ml-4 list-disc space-y-1">
              <li>{t('users.dialogs.deleteWarningItem1')}</li>
              <li>{t('users.dialogs.deleteWarningItem2')}</li>
              <li>{t('users.dialogs.deleteWarningItem3')}</li>
            </ul>
          </AlertDescription>
        </Alert>

        {/* 用户列表 */}
        <div className="space-y-3 max-h-64 overflow-y-auto">
          <div className="font-medium text-sm text-gray-700">
            {t('users.dialogs.usersToDelete')}
          </div>
          {users.map((user) => (
            <div
              key={user.id}
              className="flex items-center space-x-3 p-3 bg-red-50 border border-red-200 rounded-lg"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.avatar} />
                <AvatarFallback>{user.name[0]?.toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">{user.name}</div>
                <div className="text-xs text-gray-500 truncate">{user.email}</div>
              </div>
              <div className="text-xs text-red-600 font-medium">
                {t('users.dialogs.willBeDeleted')}
              </div>
            </div>
          ))}
        </div>

        {/* 确认提示 */}
        <div className="p-4 bg-gray-50 border rounded-lg">
          <div className="font-medium text-sm mb-2">{t('users.dialogs.operationConfirmation')}</div>
          <div className="text-sm text-gray-600">
            {t('users.dialogs.deleteConfirmation', { count: users.length })}
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
            variant="destructive"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                {t('users.dialogs.deleting')}
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                {t('users.dialogs.confirmDelete', { count: users.length })}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default BatchDeleteDialog