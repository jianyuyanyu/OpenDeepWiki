import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Search, Loader2, ArrowRight, Plus } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Header } from '@/components/layout/Header'
import { warehouseService } from '@/services/warehouse.service'
import { RepositoryForm, type RepositoryFormValues } from '@/components/repository/RepositoryForm/index'
import { WarehouseStatus, type RepositoryInfo } from '@/types/repository'
import { useTranslation } from 'react-i18next'
import { useDebounce } from '@/hooks/useDebounce'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'motion/react'
import { cn } from '@/lib/utils'

const RepositoriesPage = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const urlQuery = searchParams.get('q') || ''

  const [repositories, setRepositories] = useState<RepositoryInfo[]>([])
  const [loading, setLoading] = useState(true)
  // Initialize search keyword from URL parameter
  const [searchKeyword, setSearchKeyword] = useState(urlQuery)
  const [currentPage, setCurrentPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [showAddModal, setShowAddModal] = useState(false)
  const pageSize = 12

  const debouncedSearch = useDebounce(searchKeyword, 500)

  // Sync URL query to search keyword (for back/forward navigation)
  useEffect(() => {
    if (urlQuery !== searchKeyword) {
      setSearchKeyword(urlQuery)
    }
  }, [urlQuery])

  // Update URL when search keyword changes
  useEffect(() => {
    const params = new URLSearchParams(searchParams)
    if (debouncedSearch) {
      params.set('q', debouncedSearch)
    } else {
      params.delete('q')
    }
    // Only update if different to avoid infinite loops or unnecessary history entries
    if (searchParams.get('q') !== (debouncedSearch || null)) {
      setSearchParams(params, { replace: true })
    }
  }, [debouncedSearch, setSearchParams])

  // Sort repositories by status: Completed -> Processing -> Pending -> Failed/Canceled/Unauthorized
  const sortedRepositories = useMemo(() => {
    const statusOrder = {
      [WarehouseStatus.Completed]: 1,
      [WarehouseStatus.Processing]: 2,
      [WarehouseStatus.Pending]: 3,
      [WarehouseStatus.Failed]: 4,
      [WarehouseStatus.Canceled]: 5,
      [WarehouseStatus.Unauthorized]: 6,
    }

    return [...repositories].sort((a, b) => {
      const orderA = statusOrder[a.status] ?? 99
      const orderB = statusOrder[b.status] ?? 99
      return orderA - orderB
    })
  }, [repositories])

  const fetchRepositories = useCallback(async (page: number, keyword?: string) => {
    try {
      setLoading(true)
      const response = await warehouseService.getWarehouseList(
        page,
        pageSize,
        keyword || undefined
      )
      // Ensure we handle the response structure safely
      const items = response?.items || []
      const totalCount = response?.total || 0
      
      setRepositories(items)
      setTotal(totalCount)
    } catch (error) {
      console.error('Failed to fetch repositories:', error)
      toast.error(t('common.failed'))
      setRepositories([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [t])

  // Trigger fetch when search or page changes
  useEffect(() => {
    fetchRepositories(currentPage, debouncedSearch)
  }, [currentPage, debouncedSearch, fetchRepositories])

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1)
  }, [debouncedSearch])

  const handleRepositoryClick = useCallback((repository: RepositoryInfo) => {
    navigate(`/${repository.organizationName}/${repository.name}`)
  }, [navigate])

  const handleAddRepository = async (values: RepositoryFormValues) => {
    try {
      let response

      if (values.submitType === 'custom') {
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
        if (values.uploadMethod === 'file' && values.fileUpload) {
          const formData = new FormData()
          formData.append('organization', values.organizationName || '')
          formData.append('repositoryName', values.repositoryName || '')
          formData.append('file', values.fileUpload)
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
        fetchRepositories(currentPage, debouncedSearch)
        setShowAddModal(false)
      } else {
        toast.error(response?.message || t('repository.form.submitFailed'))
      }
    } catch (error: any) {
      toast.error(error.message || t('repository.form.submitFailed'))
    }
  }

  const totalPages = Math.ceil(total / pageSize)

  const getStatusColor = (status: WarehouseStatus) => {
    switch (status) {
      case WarehouseStatus.Completed: return 'text-green-500'
      case WarehouseStatus.Processing: return 'text-blue-500 animate-pulse'
      case WarehouseStatus.Failed: return 'text-red-500'
      case WarehouseStatus.Pending: return 'text-yellow-500'
      default: return 'text-muted-foreground'
    }
  }

  const getStatusText = (status: WarehouseStatus) => {
    return t(`home.repository_card.status.${status}`)
  }

  // Animation variants
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8 md:py-12 max-w-[1600px]">
        {/* Minimalist Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              {t('nav.repositories')}
            </h1>
            <p className="text-muted-foreground mt-1 text-sm md:text-base">
              {t('repositories.subtitle', 'Manage and browse your knowledge bases')}
            </p>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative w-full md:w-80 group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              </div>
              <Input
                type="text"
                placeholder={t('common.search')}
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="pl-10 bg-muted/40 border-transparent focus:bg-background focus:border-input transition-all duration-300 rounded-xl h-11"
              />
            </div>
            <Button 
              onClick={() => setShowAddModal(true)}
              className="rounded-xl px-6 h-11 shadow-sm hover:shadow-md transition-all shrink-0"
            >
              <Plus className="h-4 w-4 mr-2" />
              {t('repository.form.addRepository')}
            </Button>
          </div>
        </div>

        {/* Content Grid */}
        <div className="relative min-h-[400px]">
            {loading && repositories.length === 0 ? (
                 <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                 </div>
            ) : null}
            
            {!loading && sortedRepositories.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[400px] text-center">
                <div className="p-4 rounded-full bg-muted/50 mb-4">
                  <Search className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {t('home.repository_list.not_found')}
                </h3>
                <p className="text-muted-foreground max-w-sm">
                  {t('home.repository_list.empty_description')}
                </p>
              </div>
            ) : (
              <AnimatePresence mode="wait">
                  <motion.div 
                      key={currentPage}
                      variants={container}
                      initial="hidden"
                      animate="show"
                      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                  >
                  {/* Repository Cards */}
                  {sortedRepositories.map((repo) => (
                      <motion.div
                      key={repo.id}
                      variants={item}
                      onClick={() => handleRepositoryClick(repo)}
                      className="group relative flex flex-col justify-between h-48 p-6 rounded-xl border border-border/40 bg-card hover:bg-muted/30 hover:border-border/80 transition-all duration-300 cursor-pointer overflow-hidden"
                      >
                      {/* Hover Gradient Effect */}
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                      <div className="relative z-10">
                          <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold text-lg text-foreground truncate pr-2 w-full">
                              <span className="text-muted-foreground/70 font-normal">{repo.organizationName}</span>
                              <span className="mx-1 text-muted-foreground/40">/</span>
                              <span>{repo.name}</span>
                          </h3>
                          </div>
                          
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-2 leading-relaxed h-10">
                          {repo.description || t('repository.layout.no_description')}
                          </p>
                      </div>

                      <div className="relative z-10 flex items-center justify-between mt-4">
                          <div className="flex items-center gap-3">
                              <div className={cn("flex items-center gap-1.5 text-xs font-medium", getStatusColor(repo.status))}>
                              <div className="w-2 h-2 rounded-full bg-current" />
                              <span>{getStatusText(repo.status)}</span>
                              </div>
                          </div>

                          <button className="h-8 w-8 rounded-full bg-transparent hover:bg-foreground/5 flex items-center justify-center text-muted-foreground group-hover:text-foreground transition-all duration-300 -mr-2">
                              <ArrowRight className="h-4 w-4 transform group-hover:translate-x-0.5 transition-transform" />
                          </button>
                      </div>
                      </motion.div>
                  ))}
                  </motion.div>
              </AnimatePresence>
            )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-12 pb-8">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="rounded-full px-4"
            >
              {t('common.prev')}
            </Button>
            <div className="text-sm text-muted-foreground mx-2">
               {currentPage} / {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="rounded-full px-4"
            >
              {t('common.next')}
            </Button>
          </div>
        )}
      </main>

      <RepositoryForm
        open={showAddModal}
        onCancel={() => setShowAddModal(false)}
        onSubmit={handleAddRepository}
      />
    </div>
  )
}

export default RepositoriesPage
