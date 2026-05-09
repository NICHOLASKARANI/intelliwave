// User Types
export interface User {
  id: string
  name: string | null
  email: string
  emailVerified: Date | null
  image: string | null
  role: 'USER' | 'CLIENT' | 'ADMIN' | 'SUPER_ADMIN'
  createdAt: Date
  updatedAt: Date
}

// Project Types
export interface Project {
  id: string
  title: string
  description: string
  status: 'PENDING' | 'IN_PROGRESS' | 'REVIEW' | 'COMPLETED' | 'ON_HOLD' | 'CANCELLED'
  budget: number | null
  currency: string
  startDate: Date | null
  endDate: Date | null
  createdAt: Date
  updatedAt: Date
  clientId: string
}

// Invoice Types
export interface Invoice {
  id: string
  number: string
  amount: number
  currency: string
  status: 'PENDING' | 'PROCESSING' | 'PAID' | 'FAILED' | 'REFUNDED' | 'CANCELLED'
  dueDate: Date
  paidAt: Date | null
  createdAt: Date
  userId: string
  projectId: string | null
}

// Blog Types
export interface BlogPost {
  id: string
  title: string
  slug: string
  content: string
  excerpt: string | null
  featuredImage: string | null
  category: string
  tags: string[]
  published: boolean
  metaTitle: string | null
  metaDesc: string | null
  views: number
  createdAt: Date
  updatedAt: Date
  authorId: string
}

// Service Types
export interface Service {
  id: string
  title: string
  description: string
  icon: string
  price: string
  features: string[]
  category: string
}

// Portfolio Types
export interface PortfolioItem {
  id: string
  title: string
  slug: string
  description: string
  category: string
  technologies: string[]
  thumbnail: string | null
  images: string[]
  results: any
  featured: boolean
  createdAt: Date
}

// Event Types
export interface Event {
  id: string
  title: string
  description: string
  type: 'WEBINAR' | 'WORKSHOP' | 'CONFERENCE' | 'HACKATHON' | 'MEETUP'
  location: string | null
  virtual: boolean
  startDate: Date
  endDate: Date
  image: string | null
  registrationUrl: string | null
}

// Job Types
export interface Job {
  id: string
  title: string
  department: string
  location: string
  type: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'REMOTE' | 'HYBRID'
  description: string
  requirements: string[]
  active: boolean
  createdAt: Date
}

// Chat Types
export interface Message {
  id: string
  content: string
  sender: 'client' | 'admin'
  createdAt: Date
  ticketId?: string
  projectId?: string
  userId?: string
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// Pagination Types
export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// Form Types
export interface ContactForm {
  name: string
  email: string
  phone?: string
  company?: string
  message: string
  service?: string
}

export interface NewsletterForm {
  email: string
}

// Theme Types
export type Theme = 'light' | 'dark' | 'system'

// Navigation Types
export interface NavItem {
  name: string
  href: string
  icon?: React.ReactNode
  children?: NavItem[]
  external?: boolean
}

// Stats Types
export interface Stat {
  value: number
  suffix: string
  prefix: string
  label: string
  icon?: string
  description?: string
}