import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Cookie Policy',
  description: 'Intelliwave cookie policy - How we use cookies and tracking technologies.',
}

export default function CookiesPage() {
  return (
    <div className="py-20">
      <div className="container max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold mb-8">Cookie Policy</h1>
        <p className="text-muted-foreground mb-8">Last updated: January 1, 2024</p>

        <div className="prose prose-lg dark:prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-bold mb-4">What Are Cookies?</h2>
            <p className="text-muted-foreground leading-relaxed">
              Cookies are small text files stored on your device when you visit websites. 
              They help websites remember your preferences, improve functionality, and 
              provide analytics to enhance your experience.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">How We Use Cookies</h2>
            
            <div className="space-y-6 mt-4">
              <div className="p-4 border rounded-lg">
                <h3 className="text-xl font-semibold mb-2">Essential Cookies</h3>
                <p className="text-muted-foreground">
                  Required for website functionality. These cannot be disabled.
                </p>
                <ul className="list-disc pl-6 mt-2 space-y-1 text-sm text-muted-foreground">
                  <li>Session management</li>
                  <li>Authentication</li>
                  <li>Security features</li>
                  <li>Load balancing</li>
                </ul>
              </div>

              <div className="p-4 border rounded-lg">
                <h3 className="text-xl font-semibold mb-2">Performance Cookies</h3>
                <p className="text-muted-foreground">
                  Help us understand how visitors interact with our website.
                </p>
                <ul className="list-disc pl-6 mt-2 space-y-1 text-sm text-muted-foreground">
                  <li>Google Analytics</li>
                  <li>Page load performance</li>
                  <li>Error tracking</li>
                  <li>User behavior analysis</li>
                </ul>
              </div>

              <div className="p-4 border rounded-lg">
                <h3 className="text-xl font-semibold mb-2">Functional Cookies</h3>
                <p className="text-muted-foreground">
                  Enable enhanced functionality and personalization.
                </p>
                <ul className="list-disc pl-6 mt-2 space-y-1 text-sm text-muted-foreground">
                  <li>Language preferences</li>
                  <li>Theme settings (dark/light mode)</li>
                  <li>Recently viewed items</li>
                  <li>Chat support preferences</li>
                </ul>
              </div>

              <div className="p-4 border rounded-lg">
                <h3 className="text-xl font-semibold mb-2">Marketing Cookies</h3>
                <p className="text-muted-foreground">
                  Used to deliver relevant advertisements and measure campaign effectiveness.
                </p>
                <ul className="list-disc pl-6 mt-2 space-y-1 text-sm text-muted-foreground">
                  <li>Facebook Pixel</li>
                  <li>Google Ads conversion tracking</li>
                  <li>LinkedIn Insights</li>
                  <li>Retargeting campaigns</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">Third-Party Cookies</h2>
            <p className="text-muted-foreground">
              Some cookies are placed by third-party services we use:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong>Stripe:</strong> Payment processing security</li>
              <li><strong>Vercel:</strong> Hosting and performance optimization</li>
              <li><strong>Google Analytics:</strong> Website analytics</li>
              <li><strong>Cloudflare:</strong> Security and CDN services</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">Managing Cookies</h2>
            <p className="text-muted-foreground">
              You can control and delete cookies through your browser settings:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong>Chrome:</strong> Settings → Privacy and Security → Cookies</li>
              <li><strong>Firefox:</strong> Options → Privacy & Security → Cookies</li>
              <li><strong>Safari:</strong> Preferences → Privacy → Cookies</li>
              <li><strong>Edge:</strong> Settings → Privacy → Cookies</li>
            </ul>
            <p className="text-muted-foreground mt-4">
              Note: Disabling certain cookies may affect website functionality.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">Cookie Consent</h2>
            <p className="text-muted-foreground">
              By continuing to use our website, you consent to the use of cookies as 
              described in this policy. You can withdraw consent at any time by clearing 
              cookies and adjusting browser settings.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">Updates to Cookie Policy</h2>
            <p className="text-muted-foreground">
              We may update this Cookie Policy periodically. Changes will be posted on 
              this page with an updated revision date. Continued use of the website 
              constitutes acceptance of changes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">Contact</h2>
            <div className="text-muted-foreground space-y-2">
              <p><strong>Questions about cookies?</strong></p>
              <p><strong>Email:</strong> privacy@intelliwave.com</p>
              <p><strong>Address:</strong> Nairobi CBD, Superior Centre, Shop F11, 1st Floor, Kenyatta Avenue, Kenya</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}