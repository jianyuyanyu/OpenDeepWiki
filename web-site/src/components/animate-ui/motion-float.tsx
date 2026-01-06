import { motion, type HTMLMotionProps } from 'motion/react'
import { cn } from '@/lib/utils'

interface MotionFloatProps extends HTMLMotionProps<'div'> {
  duration?: number
  yOffset?: number
}

export function MotionFloat({
  children,
  className,
  duration = 3,
  yOffset = 10,
  ...props
}: MotionFloatProps) {
  return (
    <motion.div
      className={cn(className)}
      animate={{
        y: [0, -yOffset, 0],
      }}
      transition={{
        duration,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      {...props}
    >
      {children}
    </motion.div>
  )
}

// 脉冲动画
interface MotionPulseProps extends HTMLMotionProps<'div'> {
  duration?: number
}

export function MotionPulse({
  children,
  className,
  duration = 2,
  ...props
}: MotionPulseProps) {
  return (
    <motion.div
      className={cn(className)}
      animate={{
        scale: [1, 1.05, 1],
        opacity: [1, 0.8, 1],
      }}
      transition={{
        duration,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      {...props}
    >
      {children}
    </motion.div>
  )
}

// 旋转动画
interface MotionSpinProps extends HTMLMotionProps<'div'> {
  duration?: number
}

export function MotionSpin({
  children,
  className,
  duration = 2,
  ...props
}: MotionSpinProps) {
  return (
    <motion.div
      className={cn(className)}
      animate={{ rotate: 360 }}
      transition={{
        duration,
        repeat: Infinity,
        ease: 'linear',
      }}
      {...props}
    >
      {children}
    </motion.div>
  )
}
