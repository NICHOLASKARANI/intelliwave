import MainHeader from '@/components/main-header'
import HomeHero from '@/components/home-hero'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <MainHeader />
      <HomeHero />
    </div>
  )
}