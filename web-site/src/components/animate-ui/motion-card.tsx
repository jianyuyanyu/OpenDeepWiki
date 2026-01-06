import { motion, type HTMLMotionProps } from 'motion/react'
import { cn } from '@/lib/utils'

interface MotionCardProps extends HTMLMotionProps<'div'> {
  hoverEffect?: 'lift' | 'glow' | 'scale' | 'tilt' | 'none'
  delay?: number
}

export function MotionCard({
  children,
  className,
  hoverEffect = 'lift',
  delay = 0,
  ...props
}: MotionCardProps) {
  const hoverEffects = {
    lift: {
      whileHover: {
        y: -8,
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        transition: { type: 'spring', stiffness: 300, damping: 20 }
      }
    },
    glow: {
      whileHover: {
        boxShadow: '0 0 20px rgba(99, 102, 241, 0.3)',
        transition: { duration: 0.3 }
      }
    },
    scale: {
      whileHover: {
        scale: 1.03,
        transition: { type: 'spring', stiffness: 300, damping: 20 }
      }
    },
    tilt: {
      whileHover: {
        rotateY: 5,
        rotateX: 5,
        transition: { type: 'spring', stiffness: 300, damping: 20 }
      }
    },
    none: {}
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay,
        ease: [0.4, 0, 0.2, 1]
      }}
      className={cn(className)}
      {...(hoverEffect !== 'none' && hoverEffects[hoverEffect])}
      {...props}
    >
      {children}
    </motion.div>
  )
}
