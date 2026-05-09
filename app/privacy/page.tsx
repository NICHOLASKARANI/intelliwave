import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Intelliwave privacy policy - How we collect, use, and protect your data.',
}

export default function PrivacyPage() {
  return (
    <div className="py-20">
      <div className="container max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold mb-8">Privacy Policy</h1>
        <p className="text-muted-foreground mb-8">Last updated: January 1, 2024</p>

        <div className="prose prose-lg dark:prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-bold mb-4">1. Introduction</h2>
            <p className="text-muted-foreground leading-relaxed">
              Intelliwave Ltd ("we," "our," or "us") is committed to protecting your privacy. 
              This Privacy Policy explains how we collect, use, disclose, and safeguard your 
              information when you visit our website intelliwave.com or use our services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">2. Information We Collect</h2>
            
            <h3 className="text-xl font-semibold mb-2 mt-4">Personal Information</h3>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Name and contact information (email, phone number)</li>
              <li>Company name and job title</li>
              <li>Billing and payment information</li>
              <li>Project requirements and specifications</li>
            </ul>

            <h3 className="text-xl font-semibold mb-2 mt-4">Automatically Collected Information</h3>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>IP address and browser type</li>
              <li>Device information and operating system</li>
              <li>Usage data and browsing behavior</li>
              <li>Cookies and similar tracking technologies</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">3. How We Use Your Information</h2>
            <p className="text-muted-foreground">We use the collected information for:</p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Providing and maintaining our services</li>
              <li>Processing payments and transactions</li>
              <li>Communicating about your projects and support requests</li>
              <li>Sending important updates and marketing communications (with consent)</li>
              <li>Improving our website and services</li>
              <li>Complying with legal obligations</li>
              <li>Protecting against fraudulent or illegal activity</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">4. Data Protection Rights (GDPR & Kenya DPA)</h2>
            <p className="text-muted-foreground">Under data protection laws, you have the right to:</p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong>Access</strong> - Request copies of your personal data</li>
              <li><strong>Rectification</strong> - Correct inaccurate or incomplete data</li>
              <li><strong>Erasure</strong> - Request deletion of your personal data</li>
              <li><strong>Restrict Processing</strong> - Limit how we use your data</li>
              <li><strong>Data Portability</strong> - Receive your data in a structured format</li>
              <li><strong>Object</strong> - Object to processing of your personal data</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">5. Data Security</h2>
            <p className="text-muted-foreground">
              We implement industry-standard security measures including:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>256-bit SSL/TLS encryption for data transmission</li>
              <li>Encrypted database storage with AES-256</li>
              <li>Regular security audits and penetration testing</li>
              <li>Access controls and authentication mechanisms</li>
              <li>Compliance with ISO 27001 and SOC 2 standards</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">6. Cookies and Tracking</h2>
            <p className="text-muted-foreground">
              We use cookies and similar tracking technologies to enhance your experience. 
              You can control cookie preferences through your browser settings. 
              See our <a href="/cookies" className="text-primary hover:underline">Cookie Policy</a> for details.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">7. Third-Party Services</h2>
            <p className="text-muted-foreground">
              We may share data with trusted third-party service providers for:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Payment processing (Stripe, M-Pesa)</li>
              <li>Cloud hosting (Vercel, AWS)</li>
              <li>Analytics and performance monitoring</li>
              <li>Customer support and communication tools</li>
            </ul>
            <p className="text-muted-foreground mt-2">
              All third parties are bound by data processing agreements and confidentiality obligations.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">8. Data Retention</h2>
            <p className="text-muted-foreground">
              We retain personal data only as long as necessary for the purposes outlined in this policy 
              or as required by law. Upon request, we will delete or anonymize your data.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">9. Contact Information</h2>
            <div className="text-muted-foreground space-y-2">
              <p><strong>Data Controller:</strong> Intelliwave Ltd</p>
              <p><strong>Address:</strong> Nairobi CBD, Superior Centre, Shop F11, 1st Floor, Kenyatta Avenue, Kenya</p>
              <p><strong>Email:</strong> privacy@intelliwave.com</p>
              <p><strong>WhatsApp:</strong> +254 714 694 493</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}