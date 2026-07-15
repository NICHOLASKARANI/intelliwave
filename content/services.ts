// ========================================
// INTELLIWAVVE SERVICES
// ========================================

export interface Service {
  slug: string
  title: string
  description: string
  image: string
  href: string
  features: string[]
}

export const services: Service[] = [
  {
    slug: 'ai-engineering',
    title: 'AI Engineering',
    description: 'Custom machine learning models, NLP, and AI automation for enterprise operations.',
    image: '/images/ai-engineering.jpg',
    href: '/ai-engineering',
    features: ['Predictive Analytics', 'Natural Language Processing', 'Computer Vision', 'AI Agents'],
  },
  {
    slug: 'software-development',
    title: 'Software Development',
    description: 'Enterprise-grade web, mobile, and desktop applications built with modern stacks.',
    image: '/images/software-development.jpg',
    href: '/software-development',
    features: ['Web Applications', 'Mobile Apps', 'API Development', 'SaaS Platforms'],
  },
  {
    slug: 'cybersecurity',
    title: 'Cybersecurity',
    description: 'Security operations, threat monitoring, penetration testing, and compliance.',
    image: '/images/cybersecurity.jpg',
    href: '/cybersecurity',
    features: ['Threat Monitoring', 'Penetration Testing', 'Compliance Audits', 'Security Operations'],
  },
  {
    slug: 'cloud-devops',
    title: 'Cloud & DevOps',
    description: 'Cloud infrastructure, CI/CD pipelines, and managed hosting with enterprise reliability.',
    image: '/images/cloud-devops.jpg',
    href: '/cloud-devops',
    features: ['AWS / Azure / GCP', 'Docker & Kubernetes', 'CI/CD Pipelines', 'Managed Hosting'],
  },
  {
    slug: 'enterprise-solutions',
    title: 'Enterprise Solutions',
    description: 'Digital transformation, ERP systems, and IT consulting for large organizations.',
    image: '/images/enterprise-solutions.jpg',
    href: '/enterprise-solutions',
    features: ['Digital Transformation', 'ERP Systems', 'IT Consulting', 'Managed Services'],
  },
  {
    slug: 'iiot-automation',
    title: 'IIoT Automation',
    description: 'Industrial IoT systems, predictive maintenance, and smart manufacturing solutions.',
    image: '/images/iiot-automation.jpg',
    href: '/iiot-automation',
    features: ['Predictive Maintenance', 'Real-time Monitoring', 'Edge Computing', 'Digital Twins'],
  },
]