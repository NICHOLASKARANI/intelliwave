import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Admin Dashboard',
  description: 'Intelliwave admin dashboard for client and project management.',
}

export default function AdminDashboard() {
  return (
    <div className="py-20">
      <div className="container">
        <h1 className="text-4xl font-bold mb-8">Admin Dashboard</h1>
        <div className="grid md:grid-cols-4 gap-6">
          <div className="p-6 border rounded-xl">
            <h3 className="text-lg font-semibold mb-2">Total Clients</h3>
            <p className="text-3xl font-bold text-primary">450K+</p>
          </div>
          <div className="p-6 border rounded-xl">
            <h3 className="text-lg font-semibold mb-2">Active Projects</h3>
            <p className="text-3xl font-bold text-primary">2,450</p>
          </div>
          <div className="p-6 border rounded-xl">
            <h3 className="text-lg font-semibold mb-2">Revenue</h3>
            <p className="text-3xl font-bold text-primary">KSh 850M+</p>
          </div>
          <div className="p-6 border rounded-xl">
            <h3 className="text-lg font-semibold mb-2">Team Members</h3>
            <p className="text-3xl font-bold text-primary">500+</p>
          </div>
        </div>
      </div>
    </div>
  )
}