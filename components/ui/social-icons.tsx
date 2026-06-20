'use client'

import { motion } from 'framer-motion'
import { Instagram, Github, Linkedin, Twitter, MessageCircle } from 'lucide-react'
import { socialLinks } from '@/lib/social-links'

interface SocialIconsProps {
  variant?: 'default' | 'footer' | 'mobile' | 'team'
  size?: 'sm' | 'md' | 'lg'
}

const iconSizeMap = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
}

export function SocialIcons({ variant = 'default', size = 'md' }: SocialIconsProps) {
  const iconSize = iconSizeMap[size]

  const links = [
    { href: socialLinks.instagram, icon: Instagram, label: 'Instagram', color: 'hover:text-pink-500' },
    { href: socialLinks.github, icon: Github, label: 'GitHub', color: 'hover:text-purple-500' },
    { href: socialLinks.linkedin, icon: Linkedin, label: 'LinkedIn', color: 'hover:text-blue-500' },
    { href: socialLinks.twitter, icon: Twitter, label: 'Twitter', color: 'hover:text-sky-500' },
    { href: socialLinks.whatsapp, icon: MessageCircle, label: 'WhatsApp', color: 'hover:text-green-500' },
  ]

  if (variant === 'footer') {
    return (
      <div className="flex items-center gap-3">
        {links.map((link) => {
          const Icon = link.icon
          return (
            <motion.a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.2, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className={`p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 ${link.color} transition-colors`}
              aria-label={link.label}
            >
              <Icon className={iconSize} />
            </motion.a>
          )
        })}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      {links.map((link) => {
        const Icon = link.icon
        return (
          <motion.a
            key={link.label}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.95 }}
            className={`p-1.5 rounded-lg ${link.color} transition-colors`}
            aria-label={link.label}
          >
            <Icon className={iconSize} />
          </motion.a>
        )
      })}
    </div>
  )
}