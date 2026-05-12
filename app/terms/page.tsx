import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Intelliwave terms of service - Rules and guidelines for using our platform and services.',
}

export default function TermsPage() {
  return (
    <div className="py-20">
      <div className="container max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold mb-8">Terms of Service</h1>
        <p className="text-muted-foreground mb-8">Last updated: January 1, 2024</p>

        <div className="prose prose-lg dark:prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-bold mb-4">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              By accessing or using Intelliwave services, website, or platform ("Services"), 
              you agree to be bound by these Terms of Service. If you do not agree, 
              please do not use our Services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">2. Services Description</h2>
            <p className="text-muted-foreground">
              Intelliwave provides AI software engineering and enterprise web development services including:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>AI development and machine learning solutions</li>
              <li>Custom website and web application development</li>
              <li>Enterprise SaaS platforms</li>
              <li>Cloud infrastructure and hosting</li>
              <li>Mobile application development</li>
              <li>API integrations and fintech systems</li>
              <li>ERP systems and business automation</li>
              <li>Cybersecurity services</li>
              <li>UI/UX design and consulting</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">3. Client Obligations</h2>
            <p className="text-muted-foreground">As a client, you agree to:</p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Provide accurate and complete information</li>
              <li>Maintain the confidentiality of your account credentials</li>
              <li>Comply with all applicable laws and regulations</li>
              <li>Not use Services for illegal or unauthorized purposes</li>
              <li>Respect intellectual property rights</li>
              <li>Make timely payments according to agreed terms</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">4. Payment Terms</h2>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>All prices are in Kenyan Shillings (KSh) unless otherwise stated</li>
              <li>Payment schedules are defined in individual project agreements</li>
              <li>We accept payments via M-Pesa, Stripe, bank transfer, and other agreed methods</li>
              <li>Late payments may incur additional fees</li>
              <li>All payments are non-refundable unless stated in project agreement</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">5. Intellectual Property</h2>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong>Our IP:</strong> Intelliwave retains ownership of our proprietary tools, frameworks, and methodologies</li>
              <li><strong>Client IP:</strong> Upon full payment, clients own the delivered project code and assets</li>
              <li><strong>Portfolio Rights:</strong> We may showcase completed projects in our portfolio (with client consent)</li>
              <li><strong>Third-Party Components:</strong> Subject to their respective licenses</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">6. Confidentiality</h2>
            <p className="text-muted-foreground">
              Both parties agree to maintain confidentiality of proprietary information 
              shared during the engagement. This includes business strategies, technical 
              specifications, trade secrets, and client data.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">7. Limitation of Liability</h2>
            <p className="text-muted-foreground">
              Intelliwave shall not be liable for any indirect, incidental, special, or 
              consequential damages arising from the use of our Services. Our total liability 
              is limited to the amount paid for the specific service in question.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">8. Service Level Agreement (SLA)</h2>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong>Uptime:</strong> 99.9% guaranteed for hosted services</li>
              <li><strong>Support:</strong> 24/7 technical support via WhatsApp, email, and chat</li>
              <li><strong>Response Time:</strong> Within 1 hour for critical issues</li>
              <li><strong>Backup:</strong> Daily automated backups for all hosted services</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">9. Termination</h2>
            <p className="text-muted-foreground">
              Either party may terminate the agreement with 30 days written notice. 
              We reserve the right to immediately terminate Services for violation of these terms, 
              fraudulent activity, or non-payment.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">10. Governing Law</h2>
            <p className="text-muted-foreground">
              These terms shall be governed by and construed in accordance with the laws of 
              the Republic of Kenya. Any disputes shall be subject to the exclusive 
              jurisdiction of Kenyan courts.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">11. Contact</h2>
            <div className="text-muted-foreground space-y-2">
              <p><strong>Intelliwave Ltd</strong></p>
              <p>Nairobi CBD, Superior Centre, 1st Floor, Kenyatta Avenue, Kenya</p>
              <p><strong>Email:</strong> intelliwavehr@gmail.com</p>
              <p><strong>WhatsApp:</strong> +254 714 694 493</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}