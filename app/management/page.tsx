import { Metadata } from 'next'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Management & Team - Leadership at Intelliwave',
  description: 'Meet the visionary CEO and the expert team driving Intelliwave to become a global AI giant.',
}

export default function ManagementPage() {
  return (
    <div className="py-20">
      <div className="container">
        {/* CEO Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-6">Our Leadership</h1>
          <p className="text-xl text-muted-foreground">The visionaries behind Africa's Global AI Giant</p>
        </div>
        <div className="grid md:grid-cols-2 gap-12 items-center mb-24">
          <div className="relative w-full h-[400px] rounded-2xl overflow-hidden border">
            {/* Replace src with the actual path to your CEO's image */}
            <Image
              src="/ceo.jpg"
              alt="PhD, Eng. Nicholas Karani - CEO of Intelliwave"
              fill
              className="object-cover"
              priority
            />
          </div>
          <div>
            <h2 className="text-3xl font-bold mb-2">PhD, Eng. Nicholas Karani</h2>
            <p className="text-primary font-semibold mb-4">Chief Executive Officer & Founder</p>
            <p className="text-muted-foreground leading-relaxed">
              A pioneering software engineer with a vision to build Africa's first trillion-dollar AI company. 
              Nicholas combines deep technical expertise with strategic leadership to drive Intelliwave's 
              mission of democratizing AI across the continent and building enterprise-grade solutions 
              that rival the world's best.
            </p>
        </div>
        </div>

        {/* Team Section */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-6">The Intelliwave Team</h2>
          <p className="text-xl text-muted-foreground">500+ AI engineers dedicated to building the future</p>
        </div>
        <div className="grid md:grid-cols-2 gap-8 mb-24">
          <div className="relative w-full h-[300px] rounded-2xl overflow-hidden border">
            {/* Replace with your team image 1 */}
            <Image
              src="/team-member-1.jpg"
              alt="Intelliwave Team Members"
              fill
              className="object-cover"
            />
          </div>
          <div className="relative w-full h-[300px] rounded-2xl overflow-hidden border">
            {/* Replace with your team image 2 */}
            <Image
              src="/team-member-2.jpg"
              alt="Intelliwave Team Collaboration"
              fill
              className="object-cover"
            />
          </div>
        </div>

        {/* Hiring Section */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-6">Join Our Team</h2>
          <p className="text-xl text-muted-foreground">We're always looking for exceptional talent</p>
        </div>
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="relative w-full h-[300px] rounded-2xl overflow-hidden border">
            {/* Replace with your hiring image */}
            <Image
              src="/hiring.jpg"
              alt="Vacant Position Hiring at Intelliwave"
              fill
              className="object-cover"
            />
          </div>
          <div>
            <p className="text-muted-foreground mb-6">
              We are actively hiring AI engineers, software developers, and HR consultants to help us 
              achieve our ambitious goals. If you're passionate about technology and want to make an 
              impact on a global scale, we want to hear from you.
            </p>
            <Link href="/careers">
              <Button>View Open Positions & Apply</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}