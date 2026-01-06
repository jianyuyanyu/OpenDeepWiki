import { motion, type HTMLMotionProps } from 'motion/react'
import { cn } from '@/lib/utils'

// 预定义的动画变体
export const fadeInVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.4, ease: 'easeOut' }
  }
}

export const slideUpVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] }
  }
}

export const slideDownVariants = {
  hidden: { opacity: 0, y: -20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] }
  }
}

export const slideLeftVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] }
  }
}

export const slideRightVariants = {
  hidden: { opacity: 0, x: 20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] }
  }
}

export const scaleVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] }
  }
}

export const zoomInVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }
  }
}

// 淡入动画组件
interface FadeInProps extends HTMLMotionProps<'div'> {
  delay?: number
}

export function FadeIn({ children, className, delay = 0, ...props }: FadeInProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeInVariants}
      transition={{ delay }}
      className={cn(className)}
      {...props}
    >
      {children}
    </motion.div>
  )
}

// 滑入动画组件
interface SlideInProps extends HTMLMotionProps<'div'> {
  direction?: 'up' | 'down' | 'left' | 'right'
  delay?: number
}

export function SlideIn({
  children,
  className,
  direction = 'up',
  delay = 0,
  ...props
}: SlideInProps) {
  const variants = {
    up: slideUpVariants,
    down: slideDownVariants,
    left: slideLeftVariants,
    right: slideRightVariants,
  }[direction]

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={variants}
      transition={{ delay }}
      className={cn(className)}
      {...props}
    >
      {children}
    </motion.div>
  )
}

// 缩放动画组件
interface ScaleInProps extends HTMLMotionProps<'div'> {
  delay?: number
}

export function ScaleIn({ children, className, delay = 0, ...props }: ScaleInProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={scaleVariants}
      transition={{ delay }}
      className={cn(className)}
      {...props}
    >
      {children}
    </motion.div>
  )
}

// 缩放+弹跳动画组件
interface ZoomInProps extends HTMLMotionProps<'div'> {
  delay?: number
}

export function ZoomIn({ children, className, delay = 0, ...props }: ZoomInProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={zoomInVariants}
      transition={{ delay }}
      className={cn(className)}
      {...props}
    >
      {children}
    </motion.div>
  )
}

// 渐进式列表动画
interface StaggerContainerProps extends HTMLMotionProps<'div'> {
  staggerDelay?: number
}

export function StaggerContainer({
  children,
  className,
  staggerDelay = 0.1,
  ...props
}: StaggerContainerProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        visible: {
          transition: {
            staggerChildren: staggerDelay
          }
        }
      }}
      className={cn(className)}
      {...props}
    >
      {children}
    </motion.div>
  )
}

// 渐进式列表子项
export function StaggerItem({ children, className, ...props }: HTMLMotionProps<'div'>) {
  return (
    <motion.div
      variants={slideUpVariants}
      className={cn(className)}
      {...props}
    >
      {children}
    </motion.div>
  )
}
