import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from '@/hooks/use-toast';
import {
  ArrowLeft,
  Save,
  Search,
  CheckCircle,
  AlertCircle,
  Wifi,
  WifiOff,
  Sparkles,
  User,
  Phone,
  Mail,
  MapPin,
  Building,
  FileText,
  AlertTriangle,
  Zap,
  Clock,
  Loader2,
  Shield,
  UserCheck,
  Eye,
  EyeOff
} from 'lucide-react';
import type { ComplaintCategory, ComplaintPriority } from '@/types';
import { gasApi } from '@/lib/gas-client';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

// Region and Service Center are now automatically populated from user data

export default function NewComplaint() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isMobile = useIsMobile();

  // Enhanced state management
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [customerType, setCustomerType] = useState<'existing' | 'new'>('new');
  const [customerFound, setCustomerFound] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    customerAddress: '',
    contractAccountNumber: '',
    businessPartnerNumber: '',
    title: '',
    description: '',
    category: 'power_outage' as ComplaintCategory,
    priority: 'medium' as ComplaintPriority,
    region: user?.region || '',
    serviceCenter: user?.serviceCenter || '',
  });

  // Modern connection monitoring
  useEffect(() => {
    const checkConnection = async () => {
      try {
        console.log('🌐 CONNECTION: Checking connection status');
        setConnectionStatus('checking');
        const response = await fetch('/api/test-connection');
        if (response.ok) {
          console.log('🌐 CONNECTION: Connection is online');
          setConnectionStatus('online');
        } else {
          console.log('🌐 CONNECTION: Connection check failed with status:', response.status);
          setConnectionStatus('offline');
        }
      } catch (error) {
        console.log('🌐 CONNECTION: Connection check error:', error);
        setConnectionStatus('offline');
      }
    };

    checkConnection();
    const interval = setInterval(checkConnection, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Modern form validation with real-time feedback
  const validateForm = useCallback(() => {
    console.log('🔍 VALIDATION: Starting form validation');
    console.log('🔍 VALIDATION: customerType:', customerType);
    console.log('🔍 VALIDATION: customerFound:', customerFound);
    console.log('🔍 VALIDATION: formData:', formData);

    const errors: Record<string, string> = {};

    if (!formData.customerName.trim()) {
      errors.customerName = 'Customer name is required';
      console.log('❌ VALIDATION: Customer name is empty');
    }

    if (!formData.customerPhone.trim()) {
      errors.customerPhone = 'Phone number is required';
      console.log('❌ VALIDATION: Phone number is empty');
    } else if (!/^(\+251|0)?[9|7][0-9]{8}$/.test(formData.customerPhone.replace(/\s+/g, ''))) {
      errors.customerPhone = 'Please enter a valid Ethiopian phone number';
      console.log('❌ VALIDATION: Invalid phone number format');
    }

    if (formData.customerEmail && !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(formData.customerEmail)) {
      errors.customerEmail = 'Please enter a valid email address';
      console.log('❌ VALIDATION: Invalid email format');
    }

    if (customerType === 'existing' && !customerFound && !formData.contractAccountNumber && !formData.businessPartnerNumber) {
      errors.search = 'Please search for an existing customer using Contract Account Number or Business Partner Number';
      console.log('❌ VALIDATION: Existing customer validation failed - no search criteria and customer not found');
    }

    if (!formData.title.trim()) {
      errors.title = 'Complaint title is required';
      console.log('❌ VALIDATION: Complaint title is empty');
    } else if (formData.title.trim().length < 5) {
      errors.title = 'Title must be at least 5 characters long';
      console.log('❌ VALIDATION: Complaint title is too short');
    }

    if (!formData.description.trim()) {
      errors.description = 'Complaint description is required';
      console.log('❌ VALIDATION: Complaint description is empty');
    } else if (formData.description.trim().length < 10) {
      errors.description = 'Description must be at least 10 characters long';
      console.log('❌ VALIDATION: Complaint description is too short');
    }

    // Region and service center are now automatically populated from user data

    console.log('🔍 VALIDATION: Final errors:', errors);
    console.log('🔍 VALIDATION: Validation result:', Object.keys(errors).length === 0);

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData, customerType, customerFound]);

  // Calculate form completion progress
  const completionProgress = useMemo(() => {
    const requiredFields = [
      'customerName', 'customerPhone', 'title', 'description'
    ];
    const completedFields = requiredFields.filter(field => formData[field as keyof typeof formData]?.toString().trim()).length;
    return Math.round((completedFields / requiredFields.length) * 100);
  }, [formData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log('🚀 SUBMIT: Form submission started');
    console.log('🚀 SUBMIT: user:', user);
    console.log('🚀 SUBMIT: connectionStatus:', connectionStatus);
    console.log('🚀 SUBMIT: customerType:', customerType);
    console.log('🚀 SUBMIT: customerFound:', customerFound);

    if (!user) {
      console.log('❌ SUBMIT: No user logged in');
      toast({
        title: 'Authentication Required',
        description: 'You must be logged in to create a complaint',
        variant: 'destructive',
      });
      return;
    }

    if (connectionStatus !== 'online') {
      console.log('❌ SUBMIT: Connection not online');
      toast({
        title: 'Connection Error',
        description: 'Please check your internet connection and try again',
        variant: 'destructive',
      });
      return;
    }

    console.log('🔍 SUBMIT: Running form validation');
    if (!validateForm()) {
      console.log('❌ SUBMIT: Form validation failed');
      toast({
        title: 'Validation Error',
        description: 'Please correct the highlighted errors and try again',
        variant: 'destructive',
      });
      return;
    }

    console.log('✅ SUBMIT: Form validation passed, proceeding with submission');

    setLoading(true);
    try {
      const complaintData = {
        customer_id: customerType === 'existing' && customerFound ? formData.contractAccountNumber || formData.businessPartnerNumber : user.id,
        customer_name: formData.customerName,
        customer_phone: formData.customerPhone,
        customer_email: formData.customerEmail || null,
        customer_address: formData.customerAddress || null,
        contract_account_number: formData.contractAccountNumber || null,
        business_partner_number: formData.businessPartnerNumber || null,
        title: formData.title,
        description: formData.description,
        category: formData.category,
        priority: formData.priority,
        region: formData.region,
        service_center: formData.serviceCenter,
        user_id: user.id,
        user_name: user.name,
        customer_type: customerType
      };

      console.log('🚀 SUBMIT: Creating complaint with optimized GAS client');
      const response = await gasApi.createComplaint(complaintData);
      console.log('✅ SUBMIT: Complaint created successfully with ID:', response.data?.id);

      if (!response.success) throw new Error(response.error || 'Failed to create complaint');

      toast({
        title: 'Success! 🎉',
        description: `Complaint "${formData.title}" created successfully`,
      });

      // Navigate with a slight delay for better UX
      setTimeout(() => navigate(`/complaints/${response.data.id}`), 1000);

    } catch (error: any) {
      console.error('Complaint creation error:', error);
      toast({
        title: 'Creation Failed',
        description: error.message || 'Failed to create complaint. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Reset customer found state when customer type changes
  useEffect(() => {
    console.log('🔄 STATE: Customer type changed to:', customerType, '- resetting customerFound to false');
    setCustomerFound(false);
  }, [customerType]);

  // Log customer found state changes
  useEffect(() => {
    console.log('🔄 STATE: customerFound changed to:', customerFound);
  }, [customerFound]);

  const handleSearchCustomer = async () => {
    const { contractAccountNumber, businessPartnerNumber } = formData;

    console.log('🔍 SEARCH: Starting customer search');
    console.log('🔍 SEARCH: contractAccountNumber:', contractAccountNumber);
    console.log('🔍 SEARCH: businessPartnerNumber:', businessPartnerNumber);

    if (!contractAccountNumber && !businessPartnerNumber) {
      console.log('❌ SEARCH: No search criteria provided');
      toast({
        title: 'Search Required',
        description: 'Please enter either Contract Account Number or Business Partner Number to search for customer.',
        variant: 'destructive',
      });
      return;
    }

    setSearching(true);
    console.log('🔄 SEARCH: Setting searching to true');

    try {
      console.log('📡 SEARCH: Calling gasApi.searchCustomer');
      const response = await gasApi.searchCustomer(contractAccountNumber, businessPartnerNumber);
      console.log('📡 SEARCH: API response:', response);

      if (response.success && response.data && response.data.length > 0) {
        console.log('✅ SEARCH: Customer found, data:', response.data);
        // Find the most recent complaint with this customer info
        const customerComplaint = response.data[response.data.length - 1]; // Get the last one (most recent)
        console.log('✅ SEARCH: Using customer data:', customerComplaint);

        setFormData((prev) => ({
          ...prev,
          customerName: customerComplaint['Customer Name'] || prev.customerName,
          customerPhone: customerComplaint.Phone || prev.customerPhone,
          customerEmail: customerComplaint.Email || prev.customerEmail,
          customerAddress: customerComplaint.Address || prev.customerAddress,
        }));

        console.log('✅ SEARCH: Setting customerFound to true');
        setCustomerFound(true);

        toast({
          title: 'Customer Found',
          description: 'Customer information has been filled. You can now proceed with the complaint details.',
        });
      } else {
        console.log('❌ SEARCH: No customer found in response');
        setCustomerFound(false);
        toast({
          title: 'Customer Not Found',
          description: 'No existing customer found with the provided numbers. Please try different numbers or select "New customer".',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.log('❌ SEARCH: Search failed with error:', error);
      setCustomerFound(false);
      toast({
        title: 'Search Failed',
        description: error.message || 'Failed to search for customer. Please try again.',
        variant: 'destructive',
      });
    } finally {
      console.log('🔄 SEARCH: Setting searching to false');
      setSearching(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Modern Header with Connection Status */}
      <div className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-slate-200 dark:border-slate-700">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/complaints')}
                className="hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Create New Complaint
                </h1>
                <p className="text-sm text-muted-foreground">File a customer complaint with modern validation</p>
              </div>
            </div>

            {/* Connection Status Indicator */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800">
                {connectionStatus === 'online' && <Wifi className="h-4 w-4 text-green-500" />}
                {connectionStatus === 'offline' && <WifiOff className="h-4 w-4 text-red-500" />}
                {connectionStatus === 'checking' && <Loader2 className="h-4 w-4 text-yellow-500 animate-spin" />}
                <span className="text-xs font-medium capitalize">{connectionStatus}</span>
              </div>

              {/* Progress Indicator */}
              <div className="hidden sm:flex items-center gap-2">
                <div className="w-24">
                  <Progress value={completionProgress} className="h-2" />
                </div>
                <span className="text-xs text-muted-foreground">{completionProgress}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={cn(
        'container mx-auto max-w-4xl',
        isMobile ? 'p-4' : 'p-6'
      )}>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Customer Type Selection with Modern Design */}
          <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="h-5 w-5 text-blue-600" />
                Customer Type Selection
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={customerType}
                onValueChange={(value: 'existing' | 'new') => setCustomerType(value)}
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                <div className={`relative p-4 rounded-lg border-2 transition-all cursor-pointer ${
                  customerType === 'existing'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950 shadow-md'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                }`}>
                  <RadioGroupItem value="existing" id="existing" className="sr-only" />
                  <label htmlFor="existing" className="cursor-pointer">
                    <div className="flex items-center gap-3">
                      <Search className="h-8 w-8 text-blue-600" />
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-slate-100">Existing Customer</div>
                        <div className="text-sm text-slate-600 dark:text-slate-400">Search by Contract or Business Partner Number</div>
                      </div>
                    </div>
                  </label>
                </div>

                <div className={`relative p-4 rounded-lg border-2 transition-all cursor-pointer ${
                  customerType === 'new'
                    ? 'border-green-500 bg-green-50 dark:bg-green-950 shadow-md'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                }`}>
                  <RadioGroupItem value="new" id="new" className="sr-only" />
                  <label htmlFor="new" className="cursor-pointer">
                    <div className="flex items-center gap-3">
                      <Sparkles className="h-8 w-8 text-green-600" />
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-slate-100">New Customer</div>
                        <div className="text-sm text-slate-600 dark:text-slate-400">Enter customer details manually</div>
                      </div>
                    </div>
                  </label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Customer Information Card */}
          <Card className="shadow-lg border-0 bg-white dark:bg-slate-900">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="h-5 w-5 text-indigo-600" />
                Customer Information
                {customerFound && (
                  <Badge variant="secondary" className="ml-2">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Validation Errors Display */}
              {Object.keys(validationErrors).length > 0 && (
                <Alert className="border-red-200 bg-red-50 dark:bg-red-950">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800 dark:text-red-200">
                    <div className="font-medium mb-1">Please correct the following errors:</div>
                    <ul className="list-disc list-inside space-y-1">
                      {Object.entries(validationErrors).map(([field, error]) => (
                        <li key={field} className="text-sm">{error}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {customerType === 'existing' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="contractAccountNumber" className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-blue-600" />
                        Contract Account Number
                      </Label>
                      <Input
                        id="contractAccountNumber"
                        value={formData.contractAccountNumber}
                        onChange={(e) => handleChange('contractAccountNumber', e.target.value)}
                        placeholder="CA-XXXXXX"
                        className={validationErrors.search ? "border-red-500 focus:border-red-500" : ""}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="businessPartnerNumber" className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-blue-600" />
                        Business Partner Number
                      </Label>
                      <Input
                        id="businessPartnerNumber"
                        value={formData.businessPartnerNumber}
                        onChange={(e) => handleChange('businessPartnerNumber', e.target.value)}
                        placeholder="BP-XXXXXX"
                        className={validationErrors.search ? "border-red-500 focus:border-red-500" : ""}
                      />
                    </div>
                  </div>
                  {validationErrors.search && (
                    <Alert className="border-red-200 bg-red-50 dark:bg-red-950">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <AlertDescription className="text-red-800 dark:text-red-200">
                        {validationErrors.search}
                      </AlertDescription>
                    </Alert>
                  )}
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleSearchCustomer}
                      disabled={searching || (!formData.contractAccountNumber && !formData.businessPartnerNumber)}
                      className="gap-2 hover:bg-blue-50 hover:border-blue-300 transition-colors"
                    >
                      {searching ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Search className="h-4 w-4" />
                      )}
                      {searching ? 'Searching...' : 'Search Customer'}
                    </Button>
                  </div>
                </div>
              )}

              {(customerType === 'new' || (customerType === 'existing' && (formData.customerName || searching))) && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="customerName" className="flex items-center gap-2">
                        <User className="h-4 w-4 text-indigo-600" />
                        Customer Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="customerName"
                        value={formData.customerName}
                        onChange={(e) => handleChange('customerName', e.target.value)}
                        placeholder="Enter full customer name"
                        required
                        disabled={customerFound}
                        className={`transition-colors ${
                          customerFound
                            ? "bg-slate-100 dark:bg-slate-800 cursor-not-allowed"
                            : validationErrors.customerName
                              ? "border-red-500 focus:border-red-500"
                              : "focus:border-indigo-500"
                        }`}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="customerPhone" className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-green-600" />
                        Phone Number <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="customerPhone"
                        type="tel"
                        value={formData.customerPhone}
                        onChange={(e) => handleChange('customerPhone', e.target.value)}
                        placeholder="+251911234567"
                        required
                        disabled={customerFound}
                        className={`transition-colors ${
                          customerFound
                            ? "bg-slate-100 dark:bg-slate-800 cursor-not-allowed"
                            : validationErrors.customerPhone
                              ? "border-red-500 focus:border-red-500"
                              : "focus:border-green-500"
                        }`}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="customerEmail" className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-blue-600" />
                        Email Address <span className="text-slate-500">(Optional)</span>
                      </Label>
                      <Input
                        id="customerEmail"
                        type="email"
                        value={formData.customerEmail}
                        onChange={(e) => handleChange('customerEmail', e.target.value)}
                        placeholder="customer@example.com"
                        disabled={customerFound}
                        className={`transition-colors ${
                          customerFound
                            ? "bg-slate-100 dark:bg-slate-800 cursor-not-allowed"
                            : validationErrors.customerEmail
                              ? "border-red-500 focus:border-red-500"
                              : "focus:border-blue-500"
                        }`}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="customerAddress" className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-purple-600" />
                        Address <span className="text-slate-500">(Optional)</span>
                      </Label>
                      <Input
                        id="customerAddress"
                        value={formData.customerAddress}
                        onChange={(e) => handleChange('customerAddress', e.target.value)}
                        placeholder="Street address, city, region"
                        disabled={customerFound}
                        className={`transition-colors ${
                          customerFound
                            ? "bg-slate-100 dark:bg-slate-800 cursor-not-allowed"
                            : "focus:border-purple-500"
                        }`}
                      />
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Complaint Details Card */}
          {(customerType === 'new' || (customerType === 'existing' && customerFound)) && (
            <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="h-5 w-5 text-orange-600" />
                  Complaint Details
                  <Badge variant="outline" className="ml-auto">
                    Step 2 of 2
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title" className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-orange-600" />
                    Complaint Title <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleChange('title', e.target.value)}
                    placeholder="Brief, descriptive title for the complaint"
                    required
                    className={`transition-colors ${
                      validationErrors.title
                        ? "border-red-500 focus:border-red-500"
                        : "focus:border-orange-500"
                    }`}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-blue-600" />
                    Detailed Description <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    placeholder="Provide detailed information about the issue, including when it started, what you've observed, and any relevant details..."
                    rows={6}
                    required
                    className={`transition-colors resize-none ${
                      validationErrors.description
                        ? "border-red-500 focus:border-red-500"
                        : "focus:border-blue-500"
                    }`}
                  />
                  <p className="text-xs text-muted-foreground">
                    Be as specific as possible to help our team resolve your issue quickly
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="category" className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-purple-600" />
                      Category <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => handleChange('category', value)}
                      required
                    >
                      <SelectTrigger id="category" className="focus:ring-purple-500">
                        <SelectValue placeholder="Select complaint category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="power_outage">
                          <div className="flex items-center gap-2">
                            <Zap className="h-4 w-4" />
                            Power Outage
                          </div>
                        </SelectItem>
                        <SelectItem value="billing">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            Billing Issue
                          </div>
                        </SelectItem>
                        <SelectItem value="connection">
                          <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4" />
                            Connection Problem
                          </div>
                        </SelectItem>
                        <SelectItem value="meter">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            Meter Issue
                          </div>
                        </SelectItem>
                        <SelectItem value="maintenance">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4" />
                            Maintenance
                          </div>
                        </SelectItem>
                        <SelectItem value="other">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            Other
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="priority" className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      Priority Level <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.priority}
                      onValueChange={(value) => handleChange('priority', value)}
                      required
                    >
                      <SelectTrigger id="priority" className="focus:ring-red-500">
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">
                          <Badge variant="secondary" className="mr-2">Low</Badge>
                          Minor issue, can wait
                        </SelectItem>
                        <SelectItem value="medium">
                          <Badge variant="outline" className="mr-2">Medium</Badge>
                          Moderate impact
                        </SelectItem>
                        <SelectItem value="high">
                          <Badge variant="default" className="mr-2">High</Badge>
                          Significant impact
                        </SelectItem>
                        <SelectItem value="critical">
                          <Badge variant="destructive" className="mr-2">Critical</Badge>
                          Emergency situation
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Display user's region and service center information */}
                <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 border">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Assigned Location</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-slate-600 dark:text-slate-400">Region:</span>
                      <span className="ml-2 font-medium text-slate-900 dark:text-slate-100">
                        {formData.region || 'Not assigned'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-600 dark:text-slate-400">Service Center:</span>
                      <span className="ml-2 font-medium text-slate-900 dark:text-slate-100">
                        {formData.serviceCenter || 'Not assigned'}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Modern Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-end pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/complaints')}
              disabled={loading}
              className="hover:bg-slate-50 transition-colors"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || searching || connectionStatus !== 'online'}
              className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating Complaint...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Create Complaint
                </>
              )}
            </Button>
          </div>

          {/* Connection Warning */}
          {connectionStatus !== 'online' && (
            <Alert className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950">
              <WifiOff className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800 dark:text-yellow-200">
                Please check your internet connection before submitting the form.
              </AlertDescription>
            </Alert>
          )}
        </form>
      </div>
    </div>
  );
}
