// 首页组件

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Header } from '@/components/layout/Header'
import { SearchBar } from '@/components/SearchBar'
import { RepositoryCard } from '@/components/repository/RepositoryCard'
import { RepositoryForm, type RepositoryFormValues } from '@/components/repository/RepositoryForm/index'
import { Pagination } from '@/components/Pagination'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useRepositories } from '@/hooks/useRepositories'
import { warehouseService } from '@/services/warehouse.service'
import {
  Loader2,
  RefreshCw,
  AlertCircle,
  Plus,
  Sparkles,
  BookOpen
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { motion } from 'motion/react'

export const HomePage = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const {
    repositories,
    totalCount,
    currentPage,
    totalPages,
    loading,
    error,
    handleSearch,
    handlePageChange,
    refresh,
  } = useRepositories()

  const [searchValue, setSearchValue] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)

  const handleRepositoryClick = (repo: any) => {
    navigate(`/${repo.organizationName}/${repo.name}`)
  }

  const handleAddRepository = async (values: RepositoryFormValues) => {
    try {
      let response

      if (values.submitType === 'custom') {
        // 自定义仓库提交
        response = await warehouseService.customSubmitWarehouse({
          organization: values.organizationName!,
          repositoryName: values.repositoryName!,
          address: values.address!,
          branch: values.branch,
          gitUserName: values.enableGitAuth ? values.gitUserName : undefined,
          gitPassword: values.enableGitAuth ? values.gitPassword : undefined,
          email: values.enableGitAuth ? values.email : undefined
        })
      } else if (values.submitType === 'file') {
        // 文件上传
        if (values.uploadMethod === 'file' && values.fileUpload) {
          const formData = new FormData()
          formData.append('organization', values.organizationName || '')
          formData.append('repositoryName', values.repositoryName || '')
          formData.append('file', values.fileUpload)
          // 为文件上传添加Git认证参数
          if (values.enableGitAuth) {
            if (values.gitUserName) formData.append('gitUserName', values.gitUserName)
            if (values.gitPassword) formData.append('gitPassword', values.gitPassword)
            if (values.email) formData.append('email', values.email)
          }
          response = await warehouseService.uploadAndSubmitWarehouse(formData)
        } else {
          throw new Error('文件上传失败')
        }
      } else {
        // URL上传
        response = await warehouseService.submitWarehouse({
          address: values.address,
          branch: values.branch,
          gitUserName: values.enableGitAuth ? values.gitUserName : null,
          gitPassword: values.enableGitAuth ? values.gitPassword : null,
          email: values.enableGitAuth && values.email ? values.email : null
        })
      }

      if (response && response.code === 200) {
        toast.success(response.message)
        refresh()
        setShowAddModal(false)
      } else {
        toast.error(response?.message || t('repository.form.submitFailed'))
      }
    } catch (error: any) {
      toast.error(error.message || t('repository.form.submitFailed'))
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-secondary/5 py-24 px-4">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-pulse delay-700" />
        </div>

        <div className="container mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">AI-Powered Knowledge Base</span>
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 bg-gradient-to-r from-primary via-primary/80 to-secondary bg-clip-text text-transparent"
          >
            {t('home.title')}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed"
          >
            {t('home.subtitle')}
          </motion.p>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <SearchBar
              value={searchValue}
              onChange={setSearchValue}
              onSearch={handleSearch}
              placeholder={t('home.search_placeholder')}
              size="lg"
              className="max-w-3xl shadow-lg"
            />
          </motion.div>

          {/* Quick Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex items-center justify-center gap-2 mt-8 flex-wrap"
          >
            <Badge variant="secondary" className="cursor-pointer hover:bg-secondary/80 transition-all hover:scale-105">
              {t('common.search')}
            </Badge>
            <Badge variant="outline" className="cursor-pointer hover:bg-secondary/80 transition-all hover:scale-105">
              {t('home.repository_card.recommended')}
            </Badge>
            <Badge variant="outline" className="cursor-pointer hover:bg-secondary/80 transition-all hover:scale-105">
              {t('home.repository_card.recently_updated')}
            </Badge>
            <Badge variant="outline" className="cursor-pointer hover:bg-secondary/80 transition-all hover:scale-105">
              {t('home.repository_card.status.1')}
            </Badge>
            <Badge variant="outline" className="cursor-pointer hover:bg-secondary/80 transition-all hover:scale-105">
              {t('home.repository_card.status.2')}
            </Badge>
          </motion.div>
        </div>
      </section>

      {/* Repository List Section */}
      <section className="container mx-auto px-4 py-12">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
              {t('home.repository_list.title')}
            </h2>
            <p className="text-muted-foreground text-lg">
              {t('common.total', { count: totalCount })}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              size="default"
              onClick={() => setShowAddModal(true)}
              className="bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all hover:scale-105"
            >
              <Plus className="h-5 w-5" />
              <span className="ml-2">{t('repository.form.addRepository')}</span>
            </Button>

            <Button
              variant="outline"
              size="default"
              onClick={refresh}
              disabled={loading}
              className="hover:bg-secondary/80 transition-all hover:scale-105"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <RefreshCw className="h-5 w-5" />
              )}
              <span className="ml-2">{t('common.refresh')}</span>
            </Button>
          </div>
        </motion.div>

        {/* Error State */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-6 flex items-start">
            <AlertCircle className="h-5 w-5 text-destructive mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <p className="font-medium text-destructive">{t('common.failed')}</p>
              <p className="text-sm text-muted-foreground mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && repositories.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">{t('common.loading')}</span>
          </div>
        ) : (
          <>
            {/* Repository Grid */}
            {repositories.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-12">
                {repositories.map((repo, index) => (
                  <motion.div
                    key={repo.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: index * 0.05 }}
                  >
                    <RepositoryCard
                      repository={repo}
                      onClick={handleRepositoryClick}
                    />
                  </motion.div>
                ))}
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-20"
              >
                <div className="inline-flex p-4 rounded-full bg-muted/50 mb-4">
                  <BookOpen className="h-12 w-12 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground text-xl font-medium mb-2">
                  {t('home.repository_list.empty')}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t('home.repository_list.empty_description')}
                </p>
              </motion.div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                className="mt-8"
              />
            )}
          </>
        )}
      </section>

      {/* Footer */}
      <footer className="border-t mt-12">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between text-sm text-muted-foreground">
            <p>{t('footer.copyright', { year: new Date().getFullYear() })}</p>
            <div className="flex items-center gap-6 mt-4 md:mt-0">
              <a href="/privacy" className="hover:text-foreground transition-colors">
                {t('footer.privacy')}
              </a>
              <a href="/terms" className="hover:text-foreground transition-colors">
                {t('footer.terms')}
              </a>
              <a href="https://github.com/AIDotNet/OpenDeepWiki" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
                {t('footer.github')}
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Repository Form Modal */}
      <RepositoryForm
        open={showAddModal}
        onCancel={() => setShowAddModal(false)}
        onSubmit={handleAddRepository}
      />
    </div>
  )
}

export default HomePage
