import { motion, type HTMLMotionProps } from 'motion/react'
import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface MotionButtonProps extends Omit<HTMLMotionProps<'button'>, 'ref'> {
  variant?: 'scale' | 'lift' | 'glow' | 'bounce'
}

export const MotionButton = forwardRef<HTMLButtonElement, MotionButtonProps>(
  ({ children, className, variant = 'scale', ...props }, ref) => {
    const variants = {
      scale: {
        whileHover: { scale: 1.05 },
        whileTap: { scale: 0.95 },
        transition: { type: 'spring', stiffness: 400, damping: 17 }
      },
      lift: {
        whileHover: { y: -2, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' },
        whileTap: { y: 0 },
        transition: { type: 'spring', stiffness: 400, damping: 17 }
      },
      glow: {
        whileHover: {
          boxShadow: '0 0 20px rgba(99, 102, 241, 0.5)',
          scale: 1.02
        },
        whileTap: { scale: 0.98 },
        transition: { duration: 0.2 }
      },
      bounce: {
        whileHover: { scale: 1.1 },
        whileTap: { scale: 0.9 },
        transition: { type: 'spring', stiffness: 500, damping: 15 }
      }
    }

    return (
      <motion.button
        ref={ref}
        className={cn(className)}
        {...variants[variant]}
        {...props}
      >
        {children}
      </motion.button>
    )
  }
)

MotionButton.displayName = 'MotionButton'
