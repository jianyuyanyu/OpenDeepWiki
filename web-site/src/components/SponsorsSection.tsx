// 赞助商展示组件

import { useTranslation } from 'react-i18next'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { sponsors } from '@/data/sponsors'
import type { Sponsor } from '@/data/sponsors'
import { motion } from 'motion/react'
import { ExternalLink } from 'lucide-react'

interface SponsorsSectionProps {
  title?: string
  className?: string
}

export const SponsorsSection: React.FC<SponsorsSectionProps> = ({
  title,
  className = ''
}) => {
  const { t } = useTranslation()
  const displayTitle = title || t('home.sponsors.title')
  
  const handleSponsorClick = (sponsor: Sponsor) => {
    window.open(sponsor.url, '_blank', 'noopener,noreferrer')
  }

  return (
    <section className={`py-20 ${className}`}>
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h3 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
            {displayTitle}
          </h3>
          <div className="w-20 h-1 bg-gradient-to-r from-primary to-secondary mx-auto rounded-full" />
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {sponsors.map((sponsor, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -8 }}
            >
              <Card
                className="group cursor-pointer h-full border-2 hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/20 transition-all duration-300 overflow-hidden"
                onClick={() => handleSponsorClick(sponsor)}
              >
                <CardContent className="p-8 relative">
                  {/* Background Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  <div className="relative flex flex-col md:flex-row items-center gap-6">
                    <Avatar className="h-20 w-20 border-2 border-primary/20 group-hover:border-primary/50 group-hover:scale-110 transition-all duration-300 shadow-lg flex-shrink-0">
                      <AvatarImage
                        src={sponsor.logo}
                        alt={sponsor.name}
                        className="object-contain p-2"
                      />
                      <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20 text-primary text-xl font-bold">
                        {sponsor.name.slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 text-center md:text-left space-y-3">
                      <div className="flex items-center justify-center md:justify-start gap-2">
                        <h4 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                          {sponsor.name}
                        </h4>
                        <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary opacity-0 group-hover:opacity-100 transition-all" />
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed group-hover:text-foreground transition-colors">
                        {sponsor.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-center mt-16"
        >
          <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20">
            <span className="text-sm font-medium text-foreground">
              {t('home.sponsors.thanks')}
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default SponsorsSection