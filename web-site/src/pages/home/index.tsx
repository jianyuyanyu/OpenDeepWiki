// 首页组件

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Header } from '@/components/layout/Header'
import { SearchBar } from '@/components/SearchBar'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import {
  Sparkles,
  BookOpen,
  Code2,
  Share2,
  ShieldCheck,
  Zap
} from 'lucide-react'

export const HomePage = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchValue, setSearchValue] = useState('')

  const handleSearch = (keyword: string) => {
    // Navigate to repositories page with search query
    if (keyword.trim()) {
      navigate(`/repositories?q=${encodeURIComponent(keyword.trim())}`)
    } else {
      navigate('/repositories')
    }
  }

  const features = [
    {
      icon: <Code2 className="h-6 w-6 text-blue-500" />,
      title: t('home.features.multi_language.title'),
      description: t('home.features.multi_language.description'),
    },
    {
      icon: <Zap className="h-6 w-6 text-yellow-500" />,
      title: t('home.features.ai_powered.title'),
      description: t('home.features.ai_powered.description'),
    },
    {
      icon: <BookOpen className="h-6 w-6 text-green-500" />,
      title: t('home.features.documentation.title'),
      description: t('home.features.documentation.description'),
    },
    {
      icon: <Share2 className="h-6 w-6 text-purple-500" />,
      title: t('home.features.knowledge_graph.title'),
      description: t('home.features.knowledge_graph.description'),
    },
    {
      icon: <ShieldCheck className="h-6 w-6 text-red-500" />,
      title: t('home.features.secure.title'),
      description: t('home.features.secure.description'),
    },
    {
      icon: <Sparkles className="h-6 w-6 text-indigo-500" />,
      title: t('home.features.multi_provider.title'),
      description: t('home.features.multi_provider.description'),
    }
  ]

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-grow flex flex-col">
        {/* Hero Section */}
        <section className="relative flex-grow flex items-center justify-center overflow-hidden py-32 px-4">
          {/* Background Gradients */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-secondary/5 rounded-full blur-[100px] animate-pulse delay-700" />
          </div>

          <div className="container mx-auto max-w-4xl text-center relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-8 flex justify-center"
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-sm">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-primary">AI-Powered Knowledge Base</span>
              </div>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-6xl md:text-7xl font-bold mb-6 tracking-tight bg-gradient-to-r from-foreground via-foreground/90 to-muted-foreground bg-clip-text text-transparent"
            >
              {t('home.title')}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed"
            >
              {t('home.subtitle')}
            </motion.p>

            {/* Central Search Bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="w-full max-w-2xl mx-auto"
            >
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative">
                  <SearchBar
                    value={searchValue}
                    onChange={setSearchValue}
                    onSearch={handleSearch}
                    placeholder={t('home.search_placeholder')}
                    size="lg"
                    className="w-full shadow-2xl border-primary/10 bg-background/80 backdrop-blur-xl h-14 text-lg"
                  />
                </div>
              </div>
            </motion.div>

            {/* Quick Actions / Suggestions */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="mt-8 flex flex-wrap justify-center gap-4 text-sm text-muted-foreground"
            >
              <span>{t('home.repository_card.recommended')}:</span>
              <button className="hover:text-primary transition-colors cursor-pointer">Start Guide</button>
              <span>•</span>
              <button className="hover:text-primary transition-colors cursor-pointer">API Documentation</button>
              <span>•</span>
              <button className="hover:text-primary transition-colors cursor-pointer">System Architecture</button>
            </motion.div>
          </div>
        </section>

        {/* Features Grid - Minimalist */}
        <section className="py-24 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="p-6 rounded-2xl bg-background border border-border/50 hover:border-border hover:shadow-lg transition-all duration-300"
                >
                  <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-8 bg-background">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between text-sm text-muted-foreground">
          <p>{t('footer.copyright', { year: new Date().getFullYear() })}</p>
          <div className="flex items-center gap-6 mt-4 md:mt-0">
            <div className="flex items-center gap-6">
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
            <span className="hidden md:inline text-muted-foreground/50">|</span>
            <span className="font-medium">Powered by .NET 10.0</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default HomePage
