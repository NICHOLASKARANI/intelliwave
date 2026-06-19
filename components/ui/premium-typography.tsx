import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface TypographyProps {
  children: ReactNode
  className?: string
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'span'
  variant?: 'display' | 'heading' | 'subheading' | 'body' | 'caption' | 'label'
  gradient?: boolean
  animate?: boolean
}

export function PremiumTypography({
  children,
  className,
  as: Component = 'p',
  variant = 'body',
  gradient = false,
  animate = false,
}: TypographyProps) {
  const variants = {
    display: 'font-display text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[1.1]',
    heading: 'font-display text-3xl md:text-5xl font-bold tracking-tight',
    subheading: 'font-display text-xl md:text-2xl font-semibold tracking-tight',
    body: 'text-base md:text-lg leading-relaxed text-neutral-600 dark:text-neutral-400',
    caption: 'text-sm text-neutral-500 dark:text-neutral-500',
    label: 'text-xs font-semibold tracking-widest uppercase text-neutral-500',
  }

  return (
    <Component
      className={cn(
        variants[variant],
        gradient && 'bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400',
        animate && 'animate-fade-in-up',
        className
      )}
    >
      {children}
    </Component>
  )
}