'use client'

import { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Users,
  Plus,
  Search,
  Filter,
  Mail,
  Phone,
  Building,
  DollarSign,
  Calendar,
  TrendingUp,
  Edit,
  Trash2,
  MessageSquare,
  UserPlus,
  ArrowRight,
  Eye,
  MoreHorizontal,
  Star,
  Clock
} from 'lucide-react'
import { crmAPI } from '@/lib/api'
import { toast } from 'sonner'

interface Lead {
  _id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  company?: string
  position?: string
  stage: 'New' | 'Contacted' | 'Qualified' | 'Proposal' | 'Negotiation' | 'Won' | 'Lost'
  status: 'Active' | 'Inactive' | 'Converted' | 'Dead'
  source: 'Website' | 'Referral' | 'Cold Call' | 'Email Campaign' | 'Social Media' | 'Trade Show' | 'Other'
  value?: number
  expectedCloseDate?: string
  notes?: string
  assignedTo?: any
  createdAt: string
  lastContactDate?: string
}

interface Customer {
  _id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  company?: string
  position?: string
  type: 'Individual' | 'Business'
  status: 'Active' | 'Inactive' | 'Suspended'
  priority: 'Low' | 'Medium' | 'High' | 'VIP'
  industry?: string
  website?: string
  totalValue?: number
  lifetimeValue?: number
  customerSince?: string
  lastContactDate?: string
  assignedTo?: any
  tags: string[]
  createdAt: string
}

interface Contact {
  _id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  company?: string
  position?: string
  notes?: string
  createdAt: string
}

interface Communication {
  _id: string
  type: 'Email' | 'Phone' | 'Meeting' | 'Note' | 'Task' | 'SMS' | 'Video Call' | 'Social Media'
  direction: 'Inbound' | 'Outbound'
  subject?: string
  content: string
  status: 'Pending' | 'Completed' | 'Cancelled' | 'Scheduled'
  leadId?: any
  customerId?: any
  contactId?: any
  userId: any
  scheduledDate?: string
  completedDate?: string
  duration?: number
  tags: string[]
  isImportant?: boolean
  followUpRequired?: boolean
  followUpDate?: string
  createdAt: string
}

export default function CRMPage() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [isCreateLeadOpen, setIsCreateLeadOpen] = useState(false)
  const [isCreateCustomerOpen, setIsCreateCustomerOpen] = useState(false)
  const [isCreateContactOpen, setIsCreateContactOpen] = useState(false)
  const [isCreateCommunicationOpen, setIsCreateCommunicationOpen] = useState(false)
  const [selectedEntity, setSelectedEntity] = useState<any>(null)

  // Debounce search term to avoid too many API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchTerm])

  // Memoized handlers to prevent unnecessary re-renders
  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value)
  }, [])

  const handleStatusFilterChange = useCallback((value: string) => {
    setStatusFilter(value)
  }, [])

  // Fetch CRM dashboard data
  const { data: dashboardData, isLoading: dashboardLoading } = useQuery({
    queryKey: ['crm-dashboard'],
    queryFn: async () => {
      const response = await crmAPI.getDashboard()
      return response.data.data
    }
  })

  // Fetch leads
  const { data: leadsData, isLoading: leadsLoading } = useQuery({
    queryKey: ['leads', { stage: statusFilter, search: debouncedSearchTerm }],
    queryFn: async () => {
      const response = await crmAPI.getLeads({
        page: 1,
        limit: 50,
        stage: statusFilter === 'all' ? undefined : statusFilter,
      })
      return response.data.data
    },
    enabled: activeTab === 'leads' || activeTab === 'dashboard'
  })

  // Fetch customers
  const { data: customersData, isLoading: customersLoading } = useQuery({
    queryKey: ['customers', { search: debouncedSearchTerm }],
    queryFn: async () => {
      const response = await crmAPI.getCustomers({
        page: 1,
        limit: 50,
      })
      return response.data.data
    },
    enabled: activeTab === 'customers' || activeTab === 'dashboard'
  })

  // Fetch contacts
  const { data: contactsData, isLoading: contactsLoading } = useQuery({
    queryKey: ['contacts', { search: debouncedSearchTerm }],
    queryFn: async () => {
      const response = await crmAPI.getContacts({
        page: 1,
        limit: 50,
        search: debouncedSearchTerm || undefined,
      })
      return response.data.data
    },
    enabled: activeTab === 'contacts' || activeTab === 'dashboard'
  })

  // Fetch communications
  const { data: communicationsData, isLoading: communicationsLoading } = useQuery({
    queryKey: ['communications'],
    queryFn: async () => {
      const response = await crmAPI.getCommunications({
        page: 1,
        limit: 50,
      })
      return response.data.data
    },
    enabled: activeTab === 'communications' || activeTab === 'dashboard'
  })

  // Mutations
  const createLeadMutation = useMutation({
    mutationFn: crmAPI.createLead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      queryClient.invalidateQueries({ queryKey: ['crm-dashboard'] })
      setIsCreateLeadOpen(false)
      toast.success('Lead created successfully')
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Failed to create lead'
      console.error('Lead creation error:', error.response?.data || error.message || error)
      toast.error(errorMessage)
    }
  })

  const createCustomerMutation = useMutation({
    mutationFn: crmAPI.createCustomer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      queryClient.invalidateQueries({ queryKey: ['crm-dashboard'] })
      setIsCreateCustomerOpen(false)
      toast.success('Customer created successfully')
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Failed to create customer'
      console.error('Customer creation error:', error.response?.data || error.message || error)
      toast.error(errorMessage)
    }
  })

  const createContactMutation = useMutation({
    mutationFn: crmAPI.createContact,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
      queryClient.invalidateQueries({ queryKey: ['crm-dashboard'] })
      setIsCreateContactOpen(false)
      toast.success('Contact created successfully')
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Failed to create contact'
      console.error('Contact creation error:', error.response?.data || error.message || error)
      toast.error(errorMessage)
    }
  })

  const createCommunicationMutation = useMutation({
    mutationFn: crmAPI.createCommunication,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communications'] })
      setIsCreateCommunicationOpen(false)
      toast.success('Communication logged successfully')
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Failed to log communication'
      console.error('Communication logging error:', error.response?.data || error.message || error)
      toast.error(errorMessage)
    }
  })

  const convertLeadMutation = useMutation({
    mutationFn: crmAPI.convertLeadToCustomer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      queryClient.invalidateQueries({ queryKey: ['crm-dashboard'] })
      toast.success('Lead converted to customer successfully')
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Failed to convert lead'
      console.error('Lead conversion error:', error.response?.data || error.message || error)
      
      // Check if it's a duplicate customer error
      if (errorMessage.includes('Customer with email') && errorMessage.includes('already exists')) {
        toast.error(`Conversion failed: ${errorMessage}. Please check existing customers.`)
      } else {
        toast.error(errorMessage)
      }
    }
  })

  const deleteLeadMutation = useMutation({
    mutationFn: crmAPI.deleteLead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      queryClient.invalidateQueries({ queryKey: ['crm-dashboard'] })
      toast.success('Lead deleted successfully')
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Failed to delete lead'
      console.error('Lead deletion error:', error.response?.data || error.message || error)
      toast.error(errorMessage)
    }
  })

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'New': return 'bg-blue-100 text-blue-800'
      case 'Contacted': return 'bg-yellow-100 text-yellow-800'
      case 'Qualified': return 'bg-green-100 text-green-800'
      case 'Proposal': return 'bg-purple-100 text-purple-800'
      case 'Negotiation': return 'bg-orange-100 text-orange-800'
      case 'Won': return 'bg-green-100 text-green-800'
      case 'Lost': return 'bg-red-100 text-red-800'
      case 'Active': return 'bg-green-100 text-green-800'
      case 'Inactive': return 'bg-gray-100 text-gray-800'
      case 'Suspended': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case 'VIP': return 'bg-purple-100 text-purple-800'
      case 'High': return 'bg-red-100 text-red-800'
      case 'Medium': return 'bg-yellow-100 text-yellow-800'
      case 'Low': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatCurrency = (amount?: number) => {
    if (!amount) return '-'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatDate = (date?: string) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString()
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">CRM</h1>
          <p className="text-muted-foreground">
            Manage your leads, customers, and communications
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="leads">Leads</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
          <TabsTrigger value="communications">Communications</TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-6">
          {dashboardLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <Card key={i}>
                  <CardHeader className="pb-2">
                    <div className="h-4 bg-gray-200 rounded animate-pulse" />
                  </CardHeader>
                  <CardContent>
                    <div className="h-8 bg-gray-200 rounded animate-pulse" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{dashboardData?.statistics?.totalLeads || 0}</div>
                    <p className="text-xs text-muted-foreground">
                      +{dashboardData?.statistics?.recentLeads || 0} this month
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Qualified Leads</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{dashboardData?.statistics?.qualifiedLeads || 0}</div>
                    <p className="text-xs text-muted-foreground">
                      {dashboardData?.statistics?.totalLeads > 0 
                        ? Math.round((dashboardData?.statistics?.qualifiedLeads / dashboardData?.statistics?.totalLeads) * 100)
                        : 0}% conversion rate
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
                    <Building className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{dashboardData?.statistics?.totalCustomers || 0}</div>
                    <p className="text-xs text-muted-foreground">
                      {dashboardData?.statistics?.closedWonLeads || 0} from leads
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Contacts</CardTitle>
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{dashboardData?.statistics?.totalContacts || 0}</div>
                    <p className="text-xs text-muted-foreground">
                      {dashboardData?.statistics?.recentCommunications || 0} recent activities
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Lead Status Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {dashboardData?.charts?.leadStatusDistribution?.map((item: any) => (
                        <div key={item._id} className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Badge className={getStatusBadgeColor(item._id)}>
                              {item._id}
                            </Badge>
                          </div>
                          <span className="font-semibold">{item.count}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Lead Sources</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {dashboardData?.charts?.leadSourceAnalysis?.map((item: any) => (
                        <div key={item._id} className="flex items-center justify-between">
                          <span className="capitalize">{item._id}</span>
                          <span className="font-semibold">{item.count}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        {/* Leads Tab */}
        <TabsContent value="leads" className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search leads..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by stage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stages</SelectItem>
                  <SelectItem value="New">New</SelectItem>
                  <SelectItem value="Contacted">Contacted</SelectItem>
                  <SelectItem value="Qualified">Qualified</SelectItem>
                  <SelectItem value="Proposal">Proposal</SelectItem>
                  <SelectItem value="Negotiation">Negotiation</SelectItem>
                  <SelectItem value="Won">Won</SelectItem>
                  <SelectItem value="Lost">Lost</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Dialog open={isCreateLeadOpen} onOpenChange={setIsCreateLeadOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Lead
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Create New Lead</DialogTitle>
                  <DialogDescription>
                    Add a new lead to your CRM pipeline
                  </DialogDescription>
                </DialogHeader>
                <CreateLeadForm onSubmit={(data) => createLeadMutation.mutate(data)} />
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Stage</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leadsLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 8 }).map((_, j) => (
                          <TableCell key={j}>
                            <div className="h-4 bg-gray-200 rounded animate-pulse" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : leadsData?.leads?.length > 0 ? (
                    leadsData.leads.map((lead: Lead) => (
                      <TableRow key={lead._id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{lead.firstName} {lead.lastName}</div>
                            <div className="text-sm text-muted-foreground">{lead.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>{lead.company || '-'}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            {lead.email && (
                              <Mail className="h-3 w-3 text-muted-foreground" />
                            )}
                            {lead.phone && (
                              <Phone className="h-3 w-3 text-muted-foreground" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusBadgeColor(lead.stage)}>
                            {lead.stage}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatCurrency(lead.value)}</TableCell>
                        <TableCell className="capitalize">{lead.source}</TableCell>
                        <TableCell>{formatDate(lead.createdAt)}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {lead.stage !== 'Won' && lead.stage !== 'Lost' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => convertLeadMutation.mutate(lead._id)}
                                disabled={convertLeadMutation.isPending}
                              >
                                <UserPlus className="h-3 w-3 mr-1" />
                                Convert
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => deleteLeadMutation.mutate(lead._id)}
                              disabled={deleteLeadMutation.isPending}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-6">
                        No leads found. Create your first lead to get started.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Customers Tab */}
        <TabsContent value="customers" className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search customers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            <Dialog open={isCreateCustomerOpen} onOpenChange={setIsCreateCustomerOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Customer
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Create New Customer</DialogTitle>
                  <DialogDescription>
                    Add a new customer to your database
                  </DialogDescription>
                </DialogHeader>
                <CreateCustomerForm onSubmit={(data) => createCustomerMutation.mutate(data)} />
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Since</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customersLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 8 }).map((_, j) => (
                          <TableCell key={j}>
                            <div className="h-4 bg-gray-200 rounded animate-pulse" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : customersData?.customers?.length > 0 ? (
                    customersData.customers.map((customer: Customer) => (
                      <TableRow key={customer._id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {customer.firstName} {customer.lastName}
                            </div>
                            <div className="text-sm text-muted-foreground">{customer.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>{customer.company || '-'}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            {customer.email && (
                              <Mail className="h-3 w-3 text-muted-foreground" />
                            )}
                            {customer.phone && (
                              <Phone className="h-3 w-3 text-muted-foreground" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{customer.type}</TableCell>
                        <TableCell>
                          <Badge className={getStatusBadgeColor(customer.status)}>
                            {customer.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getPriorityBadgeColor(customer.priority)}>
                            {customer.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatCurrency(customer.lifetimeValue)}</TableCell>
                        <TableCell>{formatDate(customer.customerSince)}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-6">
                        No customers found. Convert leads or create customers manually.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contacts Tab */}
        <TabsContent value="contacts" className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search contacts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            <Dialog open={isCreateContactOpen} onOpenChange={setIsCreateContactOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Contact
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Create New Contact</DialogTitle>
                  <DialogDescription>
                    Add a new contact to your database
                  </DialogDescription>
                </DialogHeader>
                <CreateContactForm onSubmit={(data) => createContactMutation.mutate(data)} />
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contactsLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 6 }).map((_, j) => (
                          <TableCell key={j}>
                            <div className="h-4 bg-gray-200 rounded animate-pulse" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : contactsData?.contacts?.length > 0 ? (
                    contactsData.contacts.map((contact: Contact) => (
                      <TableRow key={contact._id}>
                        <TableCell>
                          <div className="font-medium">
                            {contact.firstName} {contact.lastName}
                          </div>
                        </TableCell>
                        <TableCell>{contact.company || '-'}</TableCell>
                        <TableCell>{contact.position || '-'}</TableCell>
                        <TableCell>{contact.email}</TableCell>
                        <TableCell>{contact.phone || '-'}</TableCell>
                        <TableCell>{formatDate(contact.createdAt)}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-6">
                        No contacts found. Create your first contact to get started.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Communications Tab */}
        <TabsContent value="communications" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Communication History</h2>
            <Dialog open={isCreateCommunicationOpen} onOpenChange={setIsCreateCommunicationOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Log Communication
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Log Communication</DialogTitle>
                  <DialogDescription>
                    Record a communication with a lead, customer, or contact
                  </DialogDescription>
                </DialogHeader>
                <CreateCommunicationForm
                  onSubmit={(data) => createCommunicationMutation.mutate(data)}
                  leads={leadsData?.leads || []}
                  customers={customersData?.customers || []}
                  contacts={contactsData?.contacts || []}
                />
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Direction</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Related To</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {communicationsLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 6 }).map((_, j) => (
                          <TableCell key={j}>
                            <div className="h-4 bg-gray-200 rounded animate-pulse" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : communicationsData?.communications?.length > 0 ? (
                    communicationsData.communications.map((comm: Communication) => (
                      <TableRow key={comm._id}>
                        <TableCell>
                          <Badge variant="outline">{comm.type}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={comm.direction === 'Outbound' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}>
                            {comm.direction}
                          </Badge>
                        </TableCell>
                        <TableCell>{comm.subject || comm.content.substring(0, 50) + '...'}</TableCell>
                        <TableCell>
                          {comm.leadId && (
                            <span>Lead: {comm.leadId.name}</span>
                          )}
                          {comm.customerId && (
                            <span>Customer: {comm.customerId.firstName} {comm.customerId.lastName}</span>
                          )}
                          {comm.contactId && (
                            <span>Contact: {comm.contactId.firstName} {comm.contactId.lastName}</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusBadgeColor(comm.status)}>
                            {comm.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(comm.createdAt)}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-6">
                        No communications found. Log your first communication to get started.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Create Lead Form Component
function CreateLeadForm({ onSubmit }: { onSubmit: (data: any) => void }) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    position: '',
    stage: 'New',
    source: 'Website',
    value: '',
    notes: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      ...formData,
      value: formData.value ? parseFloat(formData.value) : undefined
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="firstName">First Name *</Label>
          <Input
            id="firstName"
            value={formData.firstName}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="lastName">Last Name *</Label>
          <Input
            id="lastName"
            value={formData.lastName}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            required
          />
        </div>
      </div>
      <div>
        <Label htmlFor="email">Email *</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
        />
      </div>
      <div>
        <Label htmlFor="phone">Phone</Label>
        <Input
          id="phone"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
        />
      </div>
      <div>
        <Label htmlFor="company">Company</Label>
        <Input
          id="company"
          value={formData.company}
          onChange={(e) => setFormData({ ...formData, company: e.target.value })}
        />
      </div>
      <div>
        <Label htmlFor="position">Position</Label>
        <Input
          id="position"
          value={formData.position}
          onChange={(e) => setFormData({ ...formData, position: e.target.value })}
        />
      </div>
      <div>
        <Label htmlFor="source">Source</Label>
        <Select value={formData.source} onValueChange={(value) => setFormData({ ...formData, source: value })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Website">Website</SelectItem>
            <SelectItem value="Referral">Referral</SelectItem>
            <SelectItem value="Social Media">Social Media</SelectItem>
            <SelectItem value="Cold Call">Cold Call</SelectItem>
            <SelectItem value="Email Campaign">Email Campaign</SelectItem>
            <SelectItem value="Trade Show">Trade Show</SelectItem>
            <SelectItem value="Other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="value">Potential Value ($)</Label>
        <Input
          id="value"
          type="number"
          value={formData.value}
          onChange={(e) => setFormData({ ...formData, value: e.target.value })}
        />
      </div>
      <div>
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
        />
      </div>
      <DialogFooter>
        <Button type="submit">Create Lead</Button>
      </DialogFooter>
    </form>
  )
}

// Create Customer Form Component
function CreateCustomerForm({ onSubmit }: { onSubmit: (data: any) => void }) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    type: 'Individual',
    priority: 'Medium',
    notes: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="firstName">First Name *</Label>
          <Input
            id="firstName"
            value={formData.firstName}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="lastName">Last Name *</Label>
          <Input
            id="lastName"
            value={formData.lastName}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            required
          />
        </div>
      </div>
      <div>
        <Label htmlFor="email">Email *</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
        />
      </div>
      <div>
        <Label htmlFor="phone">Phone</Label>
        <Input
          id="phone"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
        />
      </div>
      <div>
        <Label htmlFor="company">Company</Label>
        <Input
          id="company"
          value={formData.company}
          onChange={(e) => setFormData({ ...formData, company: e.target.value })}
        />
      </div>
      <div>
        <Label htmlFor="type">Type</Label>
        <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Individual">Individual</SelectItem>
            <SelectItem value="Business">Business</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="priority">Priority</Label>
        <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Low">Low</SelectItem>
            <SelectItem value="Medium">Medium</SelectItem>
            <SelectItem value="High">High</SelectItem>
            <SelectItem value="VIP">VIP</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
        />
      </div>
      <DialogFooter>
        <Button type="submit">Create Customer</Button>
      </DialogFooter>
    </form>
  )
}

// Create Contact Form Component
function CreateContactForm({ onSubmit }: { onSubmit: (data: any) => void }) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    position: '',
    notes: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="firstName">First Name *</Label>
          <Input
            id="firstName"
            value={formData.firstName}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="lastName">Last Name *</Label>
          <Input
            id="lastName"
            value={formData.lastName}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            required
          />
        </div>
      </div>
      <div>
        <Label htmlFor="email">Email *</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
        />
      </div>
      <div>
        <Label htmlFor="phone">Phone</Label>
        <Input
          id="phone"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
        />
      </div>
      <div>
        <Label htmlFor="company">Company</Label>
        <Input
          id="company"
          value={formData.company}
          onChange={(e) => setFormData({ ...formData, company: e.target.value })}
        />
      </div>
      <div>
        <Label htmlFor="position">Position</Label>
        <Input
          id="position"
          value={formData.position}
          onChange={(e) => setFormData({ ...formData, position: e.target.value })}
        />
      </div>
      <div>
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
        />
      </div>
      <DialogFooter>
        <Button type="submit">Create Contact</Button>
      </DialogFooter>
    </form>
  )
}

// Create Communication Form Component
function CreateCommunicationForm({ 
  onSubmit, 
  leads, 
  customers, 
  contacts 
}: { 
  onSubmit: (data: any) => void
  leads: Lead[]
  customers: Customer[]
  contacts: Contact[]
}) {
  const [formData, setFormData] = useState({
    type: 'Note',
    direction: 'Outbound',
    subject: '',
    content: '',
    status: 'Completed',
    entityType: '',
    entityId: '',
    duration: '',
    isImportant: false,
    followUpRequired: false,
    followUpDate: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const submitData: any = {
      type: formData.type,
      direction: formData.direction,
      subject: formData.subject,
      content: formData.content,
      status: formData.status,
      duration: formData.duration ? parseInt(formData.duration) : undefined,
      isImportant: formData.isImportant,
      followUpRequired: formData.followUpRequired,
      followUpDate: formData.followUpDate || undefined
    }

    if (formData.entityType === 'lead' && formData.entityId) {
      submitData.leadId = formData.entityId
    } else if (formData.entityType === 'customer' && formData.entityId) {
      submitData.customerId = formData.entityId
    } else if (formData.entityType === 'contact' && formData.entityId) {
      submitData.contactId = formData.entityId
    }

    onSubmit(submitData)
  }

  const getEntityOptions = () => {
    switch (formData.entityType) {
      case 'lead':
        return leads.map(lead => ({ value: lead._id, label: `${lead.firstName} ${lead.lastName}` }))
      case 'customer':
        return customers.map(customer => ({ 
          value: customer._id, 
          label: `${customer.firstName} ${customer.lastName}` 
        }))
      case 'contact':
        return contacts.map(contact => ({ 
          value: contact._id, 
          label: `${contact.firstName} ${contact.lastName}` 
        }))
      default:
        return []
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="type">Type</Label>
          <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Email">Email</SelectItem>
              <SelectItem value="Phone">Phone</SelectItem>
              <SelectItem value="Meeting">Meeting</SelectItem>
              <SelectItem value="Note">Note</SelectItem>
              <SelectItem value="Task">Task</SelectItem>
              <SelectItem value="SMS">SMS</SelectItem>
              <SelectItem value="Video Call">Video Call</SelectItem>
              <SelectItem value="Social Media">Social Media</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="direction">Direction</Label>
          <Select value={formData.direction} onValueChange={(value) => setFormData({ ...formData, direction: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Inbound">Inbound</SelectItem>
              <SelectItem value="Outbound">Outbound</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div>
        <Label htmlFor="subject">Subject</Label>
        <Input
          id="subject"
          value={formData.subject}
          onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
        />
      </div>
      
      <div>
        <Label htmlFor="content">Content *</Label>
        <Textarea
          id="content"
          value={formData.content}
          onChange={(e) => setFormData({ ...formData, content: e.target.value })}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="entityType">Related To</Label>
          <Select value={formData.entityType} onValueChange={(value) => setFormData({ ...formData, entityType: value, entityId: '' })}>
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="lead">Lead</SelectItem>
              <SelectItem value="customer">Customer</SelectItem>
              <SelectItem value="contact">Contact</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {formData.entityType && (
          <div>
            <Label htmlFor="entityId">Entity</Label>
            <Select value={formData.entityId} onValueChange={(value) => setFormData({ ...formData, entityId: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select entity" />
              </SelectTrigger>
              <SelectContent>
                {getEntityOptions().map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="status">Status</Label>
          <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
              <SelectItem value="Cancelled">Cancelled</SelectItem>
              <SelectItem value="Scheduled">Scheduled</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="duration">Duration (minutes)</Label>
          <Input
            id="duration"
            type="number"
            value={formData.duration}
            onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
          />
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="isImportant"
            checked={formData.isImportant}
            onCheckedChange={(checked) => setFormData({ ...formData, isImportant: !!checked })}
          />
          <Label htmlFor="isImportant">Important</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="followUpRequired"
            checked={formData.followUpRequired}
            onCheckedChange={(checked) => setFormData({ ...formData, followUpRequired: !!checked })}
          />
          <Label htmlFor="followUpRequired">Follow-up Required</Label>
        </div>
      </div>

      {formData.followUpRequired && (
        <div>
          <Label htmlFor="followUpDate">Follow-up Date</Label>
          <Input
            id="followUpDate"
            type="datetime-local"
            value={formData.followUpDate}
            onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })}
          />
        </div>
      )}

      <DialogFooter>
        <Button type="submit">Log Communication</Button>
      </DialogFooter>
    </form>
  )
}
