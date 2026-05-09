import { Button } from "@/components/ui/button"
import { ArrowRight, Sparkles, Zap, Globe } from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  return (
    <>
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-accent/20" />
        
        <div className="container relative mx-auto px-4 py-32">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-8">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">Africa&apos;s #1 AI Software Company</span>
            </div>
            
            <h1 className="font-bold text-4xl md:text-6xl lg:text-7xl mb-6">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-accent to-primary">
                Engineering
              </span>{" "}
              the Future with{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-accent to-primary">
                AI
              </span>
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Building Africa&apos;s Global AI Giant. Enterprise SaaS, Cloud Infrastructure, 
              AI Agents, and Custom Software Solutions trusted by 450,000+ businesses worldwide.
            </p>
            
            <div className="flex gap-4 justify-center mb-12">
              <Link href="/contact">
                <Button size="lg" className="bg-primary hover:bg-primary/90">
                  Start Your Project
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="/services">
                <Button size="lg" variant="outline">
                  Explore Services
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">450K+</div>
                <div className="text-sm text-muted-foreground">Active Users</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">100+</div>
                <div className="text-sm text-muted-foreground">Countries</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">500+</div>
                <div className="text-sm text-muted-foreground">AI Engineers</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 bg-gradient-to-b from-background to-secondary/20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Global{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
                Intelligence
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              We have the world&apos;s largest buyer and investor community. 
              Join 450,000+ successful business owners.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Build the Future?</h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join 450,000+ businesses already growing with Intelliwave
          </p>
          <Link href="/contact">
            <Button size="lg" className="bg-primary hover:bg-primary/90">
              Get Started Today
              <ArrowRight className="ml-2" />
            </Button>
          </Link>
        </div>
      </section>
    </>
  )
}