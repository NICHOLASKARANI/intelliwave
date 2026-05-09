# 🚀 Intelliwave - Engineering the Future with AI

<div align="center">

![Intelliwave Logo](public/logo.png)

**Building Africa's Global AI Giant**

[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC)](https://tailwindcss.com/)
[![Prisma](https://img.shields.io/badge/Prisma-5.9-2D3748)](https://www.prisma.io/)
[![Stripe](https://img.shields.io/badge/Stripe-Payments-008CDD)](https://stripe.com/)
[![License](https://img.shields.io/badge/License-Proprietary-red)](LICENSE)

</div>

## 🌟 Overview

Intelliwave is East Africa's leading AI software engineering company, building enterprise-grade SaaS platforms, AI agents, cloud infrastructure, and custom web solutions. Trusted by Fortune 500 companies and over 450,000 businesses globally.

### 🎯 Mission
Build Intelliwave as a trillion-dollar global AI and software company similar to Stripe, Vercel, OpenAI, and Microsoft.

## ✨ Features

### Core Platform
- 🤖 **AI Chatbot Assistant** - 24/7 intelligent customer support
- 🌐 **AI Website Recommendation Engine** - Smart project matching
- 📊 **AI Project Estimator** - Accurate cost predictions
- 🛡️ **Enterprise Security** - Bank-grade encryption & compliance
- 📱 **Fully Responsive** - Mobile-first design
- 🌓 **Dark/Light Mode** - Adaptive user experience

### Services
- 💻 Custom AI Development
- 🏢 Enterprise Applications
- ☁️ Cloud Infrastructure
- 🛒 E-commerce Platforms
- 📱 Mobile Apps
- 🔌 API Integrations
- 🔒 Cybersecurity
- 🎨 UI/UX Design

### Business Features
- 💳 Multi-currency Payments (Stripe + M-Pesa)
- 📊 Real-time Analytics Dashboard
- 💼 Client Portal with Project Tracking
- 📝 Blog with AI Content
- 🎫 Support Ticket System
- 📅 Event Management
- 💼 Career Portal
- 📈 Marketing Automation

## 🏗️ Tech Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS
- **Framer Motion** - Advanced animations
- **ShadCN UI** - Premium UI components
- **React Hook Form** - Form management
- **Zustand** - State management
- **React Query** - Server state

### Backend
- **Next.js API Routes** - Serverless functions
- **PostgreSQL** - Primary database
- **Prisma ORM** - Type-safe database access
- **NextAuth.js** - Authentication
- **Stripe** - Payment processing
- **M-Pesa API** - Mobile money integration
- **Redis** - Caching & sessions

### DevOps & Tools
- **Vercel** - Deployment platform
- **GitHub Actions** - CI/CD
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Husky** - Git hooks

## 📦 Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL 14+
- npm or bun
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/intelliwave/intelliwave.git
cd intelliwave

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Set up the database
npx prisma db push
npx prisma generate

# Seed the database (optional)
npx prisma db seed

# Run development server
npm run dev