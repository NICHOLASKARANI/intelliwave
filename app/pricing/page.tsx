export default function PricingPage() {
  return (
    <div className="container py-20">
      <h1 className="font-display text-4xl font-bold mb-8">Transparent Pricing</h1>
      <div className="grid md:grid-cols-3 gap-8">
        <div className="p-6 border rounded-lg">
          <h3 className="text-2xl font-bold mb-4">Business Websites</h3>
          <p className="text-3xl font-bold text-primary">KSh 150,000+</p>
        </div>
        <div className="p-6 border rounded-lg">
          <h3 className="text-2xl font-bold mb-4">E-commerce</h3>
          <p className="text-3xl font-bold text-primary">KSh 100,000+</p>
        </div>
        <div className="p-6 border rounded-lg">
          <h3 className="text-2xl font-bold mb-4">Web Applications</h3>
          <p className="text-3xl font-bold text-primary">KSh 300,000+</p>
        </div>
      </div>
    </div>
  )
}