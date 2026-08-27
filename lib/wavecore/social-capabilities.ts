// SOCIAL MEDIA PLATFORM CAPABILITY MATRIX
// Updated: August 2026

export const PLATFORM_CAPABILITIES = {
  facebook: {
    oauth: true,
    pages: true,
    publish: true,
    mediaUpload: true,
    videoUpload: true,
    scheduling: true,
    webhooks: true,
    analytics: true,
    contentTypes: ['text', 'image', 'video', 'link'],
    requiredPermissions: ['pages_manage_posts', 'pages_read_engagement', 'pages_show_list'],
    apiVersion: 'v21.0'
  },
  instagram: {
    oauth: true,
    pages: false,
    publish: true,
    mediaUpload: true,
    videoUpload: true,
    scheduling: true,
    webhooks: true,
    analytics: true,
    contentTypes: ['image', 'video', 'reels', 'stories'],
    requiredPermissions: ['instagram_basic', 'instagram_content_publish', 'instagram_manage_insights'],
    apiVersion: 'v21.0'
  },
  whatsapp: {
    oauth: false,
    pages: false,
    publish: true,
    mediaUpload: true,
    videoUpload: true,
    scheduling: true,
    webhooks: true,
    analytics: true,
    contentTypes: ['text', 'template', 'image', 'video'],
    requiredPermissions: ['whatsapp_business_messaging', 'whatsapp_business_management'],
    note: 'Requires WhatsApp Business API account and approved message templates',
    apiVersion: 'v21.0'
  },
  tiktok: {
    oauth: true,
    pages: false,
    publish: true,
    mediaUpload: true,
    videoUpload: true,
    scheduling: false,
    webhooks: true,
    analytics: true,
    contentTypes: ['video', 'photo'],
    requiredPermissions: ['user.info.basic', 'video.publish', 'video.upload'],
    apiVersion: 'v2'
  },
  x: {
    oauth: true,
    pages: false,
    publish: true,
    mediaUpload: true,
    videoUpload: true,
    scheduling: false,
    webhooks: false,
    analytics: true,
    contentTypes: ['text', 'image', 'video'],
    requiredPermissions: ['tweet.read', 'tweet.write', 'users.read'],
    apiVersion: 'v2'
  }
}

export const INTEGRATION_STATES = [
  'DISCONNECTED',
  'CONNECTING',
  'CONNECTED',
  'TOKEN_EXPIRING',
  'TOKEN_EXPIRED',
  'REAUTH_REQUIRED',
  'ERROR',
  'REVOKED'
]

export const POST_STATES = [
  'DRAFT',
  'QUEUED',
  'PUBLISHING',
  'PUBLISHED',
  'PARTIALLY_PUBLISHED',
  'FAILED',
  'CANCELLED',
  'SCHEDULED'
]

export const INDUSTRIES = [
  'retail',
  'real_estate',
  'healthcare',
  'legal',
  'restaurant',
  'fitness',
  'education',
  'beauty',
  'automotive',
  'construction'
]