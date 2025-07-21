import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Building2, 
  Users, 
  BarChart3, 
  Package, 
  Receipt, 
  ShoppingCart, 
  Calendar,
  Shield,
  Zap,
  Globe,
  ArrowRight,
  CheckCircle
} from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Navigation */}
      <nav className="border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Building2 className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">ERP Business Suite</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/auth/login">
                <Button variant="ghost">Login</Button>
              </Link>
              <Link href="/auth/signup">
                <Button>Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge className="mb-4" variant="secondary">
            🚀 Lightweight Odoo Alternative
          </Badge>
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Complete Business Management
            <span className="block text-blue-600">In One Platform</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Streamline your business operations with our comprehensive ERP suite. 
            Manage CRM, HR, inventory, accounting, and more - all in one beautiful, secure platform.
          </p>
          <div className="flex justify-center space-x-4">
            <Link href="/auth/signup">
              <Button size="lg" className="px-8">
                Start Free Trial
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="#features">
              <Button size="lg" variant="outline">
                Learn More
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Everything Your Business Needs
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Our modular ERP system grows with your business, providing powerful tools 
              for every aspect of your operations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* CRM */}
            <Card>
              <CardHeader>
                <Users className="h-10 w-10 text-blue-600 mb-2" />
                <CardTitle>Customer Management</CardTitle>
                <CardDescription>
                  Complete CRM with lead tracking, customer profiles, and communication history
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Lead pipeline management</li>
                  <li>• Customer relationship tracking</li>
                  <li>• Communication logs</li>
                  <li>• Sales opportunity management</li>
                </ul>
              </CardContent>
            </Card>

            {/* HRM */}
            <Card>
              <CardHeader>
                <Users className="h-10 w-10 text-green-600 mb-2" />
                <CardTitle>Human Resources</CardTitle>
                <CardDescription>
                  Employee management, attendance tracking, and payroll processing
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Employee profiles & departments</li>
                  <li>• Leave request management</li>
                  <li>• Attendance tracking</li>
                  <li>• Basic payroll processing</li>
                </ul>
              </CardContent>
            </Card>

            {/* Inventory */}
            <Card>
              <CardHeader>
                <Package className="h-10 w-10 text-purple-600 mb-2" />
                <CardTitle>Inventory Management</CardTitle>
                <CardDescription>
                  Stock tracking, warehouse management, and supplier relationships
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Product catalog management</li>
                  <li>• Real-time stock levels</li>
                  <li>• Supplier management</li>
                  <li>• Stock movement logs</li>
                </ul>
              </CardContent>
            </Card>

            {/* Accounting */}
            <Card>
              <CardHeader>
                <Receipt className="h-10 w-10 text-orange-600 mb-2" />
                <CardTitle>Accounting & Invoicing</CardTitle>
                <CardDescription>
                  Financial management with invoicing, payments, and basic ledger
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Invoice generation</li>
                  <li>• Payment tracking</li>
                  <li>• Tax configuration</li>
                  <li>• Financial reporting</li>
                </ul>
              </CardContent>
            </Card>

            {/* Sales */}
            <Card>
              <CardHeader>
                <ShoppingCart className="h-10 w-10 text-red-600 mb-2" />
                <CardTitle>Sales & Purchases</CardTitle>
                <CardDescription>
                  Order management, quotations, and vendor relationships
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Sales order processing</li>
                  <li>• Quotation management</li>
                  <li>• Purchase order creation</li>
                  <li>• Vendor management</li>
                </ul>
              </CardContent>
            </Card>

            {/* Events */}
            <Card>
              <CardHeader>
                <Calendar className="h-10 w-10 text-indigo-600 mb-2" />
                <CardTitle>Event Planning</CardTitle>
                <CardDescription>
                  Company event management with team RSVP and calendar integration
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Internal & external events</li>
                  <li>• Team RSVP management</li>
                  <li>• Calendar synchronization</li>
                  <li>• Event notifications</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Why Choose Our ERP Suite?
              </h2>
              <div className="space-y-4">
                <div className="flex items-start">
                  <Shield className="h-6 w-6 text-blue-600 mt-1 mr-3 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Enterprise Security</h3>
                    <p className="text-gray-600">Role-based access control, JWT authentication, and secure data handling</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Zap className="h-6 w-6 text-blue-600 mt-1 mr-3 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Lightning Fast</h3>
                    <p className="text-gray-600">Built with modern technologies for optimal performance and user experience</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Globe className="h-6 w-6 text-blue-600 mt-1 mr-3 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Cloud Ready</h3>
                    <p className="text-gray-600">Deploy anywhere with Docker support and cloud-native architecture</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="h-6 w-6 text-blue-600 mt-1 mr-3 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Complete Solution</h3>
                    <p className="text-gray-600">All business modules integrated seamlessly in one platform</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-indigo-100 p-8 rounded-2xl">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Tech Stack Highlights
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="font-semibold text-gray-800">Frontend</h4>
                  <ul className="text-gray-600 mt-1">
                    <li>• Next.js 14</li>
                    <li>• TypeScript</li>
                    <li>• Tailwind CSS</li>
                    <li>• Shadcn/UI</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800">Backend</h4>
                  <ul className="text-gray-600 mt-1">
                    <li>• Node.js & Express</li>
                    <li>• MongoDB</li>
                    <li>• JWT Auth</li>
                    <li>• Zod Validation</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Transform Your Business?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of businesses already using our ERP suite to streamline their operations.
          </p>
          <Link href="/auth/signup">
            <Button size="lg" variant="secondary" className="px-8">
              Start Your Free Trial Today
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <p className="text-sm text-blue-100 mt-4">
            No credit card required • 14-day free trial • Cancel anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <Building2 className="h-6 w-6 text-blue-400" />
              <span className="ml-2 text-lg font-semibold text-white">ERP Business Suite</span>
            </div>
            <div className="text-gray-400 text-sm">
              © 2025 ERP Business Suite. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
