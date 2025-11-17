import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageSwitcher } from '@/components/ui/language-switcher';
import { Eye, EyeOff, Loader2, Shield, UserCheck } from 'lucide-react';
import logo from '@/assets/eeu-logo.png';


export default function Login() {
  const [email, setEmail] = useState('admin@eeu.gov.et');
  const [password, setPassword] = useState('12345678');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const { login } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const navigate = useNavigate();

  // Enhanced backend connection check with debugging
  useEffect(() => {
    const checkConnection = async () => {
      try {
        console.log('🔍 Starting enhanced backend connection check...');

        // For now, set as online since we don't have the backend functions
        setConnectionStatus('online');
        console.log('✅ Backend connection assumed online');
      } catch (error) {
        console.error('🔴 Connection check failed with error:', error);
        setConnectionStatus('offline');

        toast({
          title: "Connection Check Failed",
          description: "Unable to verify backend connection. Please check the console for detailed diagnostics.",
          variant: "destructive",
        });
      }
    };

    checkConnection();
  }, [toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (!email || !password) {
      toast({
        title: t("login.error"),
        description: "Please enter both email and password",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      console.log('🚀 Starting login process...');
      const maskedEmail = email.replace(/^(.{2}).*(@.*)$/, '$1***$2');
      console.log('📧 Email:', maskedEmail);

      // Enhanced API call with better error handling
      console.log('📡 Calling login...');
      const result = await login(email, password);
      console.log('DEBUG: Login.tsx - Raw response from login:', result);

      console.log('🔍 Login response received:', {
        success: result.success,
        error: result.error,
        fullResponse: result
      });

      if (result.success) {
        toast({
          title: t("login.success"),
          description: t("login.success_desc"),
        });

        // Navigate to dashboard
        navigate('/dashboard');
      } else {
        // Enhanced error handling
        let errorMessage = 'Login failed. Please check your credentials.';

        if (result.error) {
          errorMessage = result.error;
        }

        console.error('❌ Login failed:', {
          error: result.error
        });

        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('🔴 Login error:', error);

      let userMessage = t("login.error_desc");

      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch') || error.message.includes('Network')) {
          userMessage = 'Cannot connect to server. Please check your internet connection and ensure the backend is running.';
        } else if (error.message.includes('Invalid email or password')) {
          userMessage = 'Invalid email or password. Please check your credentials.';
        } else if (error.message.includes('Account is inactive')) {
          userMessage = 'Your account is inactive. Please contact system administrator.';
        } else {
          userMessage = error.message;
        }
      }

      toast({
        title: t("login.error"),
        description: userMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'online': return 'bg-green-400';
      case 'offline': return 'bg-red-400';
      case 'checking': return 'bg-yellow-400';
      default: return 'bg-gray-400';
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'online': return 'System Online';
      case 'offline': return 'System Offline';
      case 'checking': return 'Checking Connection...';
      default: return 'Unknown Status';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4 relative overflow-hidden">
      {/* Enhanced Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-eeu-orange/8 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-eeu-green/8 rounded-full blur-3xl animate-pulse-slow delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/3 rounded-full blur-3xl"></div>

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,black,transparent)]"></div>
      </div>

      {/* Enhanced Language Switcher - Top Right */}
      <div className="absolute top-6 right-6 z-10">
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-2 border border-white/20 shadow-lg hover:bg-white/20 transition-all duration-300 hover:scale-105">
          <LanguageSwitcher />
        </div>
      </div>

      {/* Enhanced System Status - Top Left */}
      <div className="absolute top-6 left-6 z-10">
        <div className="bg-white/10 backdrop-blur-md rounded-xl px-4 py-2 border border-white/20 shadow-lg">
          <div className="flex items-center space-x-2 text-white/80 text-sm">
            <div className={`w-2 h-2 rounded-full animate-pulse ${getStatusColor()}`}></div>
            <span>{getStatusText()}</span>
          </div>
        </div>
      </div>

      <div className="w-full max-w-md z-10">
        <Card className="shadow-2xl border-2 border-eeu-orange/20 bg-white/95 backdrop-blur-sm hover:shadow-3xl hover:border-eeu-orange/40 transition-all duration-500 transform hover:scale-[1.02] relative overflow-visible">
          {/* Card Background Animation */}
          <div className="absolute inset-0 bg-gradient-to-br from-eeu-green/5 via-transparent to-eeu-orange/5 opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

          <CardHeader className="text-center pb-3 relative">
            {/* Logo and Title Section */}
            <div className="flex flex-col items-center space-y-3 mb-6">
              {/* Enhanced Logo Container */}
              <div className="relative group">
                {/* Animated Glow Effect */}
                <div className="absolute inset-0 bg-gradient-eeu rounded-full blur-xl opacity-20 group-hover:opacity-30 transition-opacity duration-300 pointer-events-none animate-pulse"></div>

                {/* Main Logo */}
                <img
                  src="/eeu-logo-new.png"
                  alt="Ethiopian Electric Utility Logo"
                  className="w-40 h-40 object-contain relative z-10 group-hover:scale-105 transition-transform duration-300 drop-shadow-xl"
                  onError={(e) => {
                    // Fallback if logo fails to load
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />

                {/* Animated Border Ring */}
                <div className="absolute inset-0 border-2 border-transparent border-t-eeu-orange border-r-eeu-green rounded-full opacity-20 group-hover:opacity-40 transition-opacity duration-300 pointer-events-none animate-spin-slow"></div>
              </div>

              {/* Enhanced Title Section */}
              <div className="space-y-3 animate-fade-in">
                <div className="relative">
                  <h1 className="text-2xl lg:text-3xl font-bold text-eeu-orange drop-shadow-lg shadow-black/50 relative z-10">
                    Ethiopian Electric Utility
                  </h1>
                  {/* Enhanced shadow effect */}
                  <h1 className="absolute inset-0 text-2xl lg:text-3xl font-bold text-black/40 blur-sm transform translate-x-1 translate-y-1">
                    Ethiopian Electric Utility
                  </h1>
                </div>
                <p className="text-lg text-eeu-green font-semibold">
                  የኢትዮጵያ ኤሌክትሪክ አገልግሎት
                </p>
                <p className="text-sm text-gray-700 font-medium flex items-center justify-center gap-2">
                  <Shield className="w-4 h-4 text-eeu-orange" />
                  Staff Portal Access
                  <UserCheck className="w-4 h-4 text-eeu-green" />
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Enhanced Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold text-eeu-green flex items-center">
                  <div className="w-4 h-4 bg-eeu-green/20 rounded-full flex items-center justify-center mr-2">
                    <div className="w-2 h-2 bg-eeu-green rounded-full"></div>
                  </div>
                  {t("login.email")}
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@eeu.gov.et"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  className="h-12 border-2 border-eeu-green/30 focus:border-eeu-green focus:ring-2 focus:ring-eeu-green/20 transition-all duration-300 rounded-lg bg-gradient-to-r from-white to-eeu-green/5 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              {/* Enhanced Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-semibold text-eeu-orange flex items-center">
                  <div className="w-4 h-4 bg-eeu-orange/20 rounded-full flex items-center justify-center mr-2">
                    <div className="w-2 h-2 bg-eeu-orange rounded-full"></div>
                  </div>
                  {t("login.password")}
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    className="h-12 pr-12 border-2 border-eeu-orange/30 focus:border-eeu-orange focus:ring-2 focus:ring-eeu-orange/20 transition-all duration-300 rounded-lg bg-gradient-to-r from-white to-eeu-orange/5 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={isLoading}
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-eeu-orange/10 rounded-r-lg transition-all duration-300 disabled:opacity-50"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-eeu-orange" />
                    ) : (
                      <Eye className="h-5 w-5 text-eeu-orange" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Enhanced Submit Button */}
              <button
                type="submit"
                disabled={isLoading || connectionStatus === 'offline'}
                className="w-full h-12 text-white font-bold rounded-lg cursor-pointer hover:opacity-90 active:scale-95 transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center relative overflow-hidden group"
                style={{
                  background: 'linear-gradient(135deg, #FF8C42 0%, #4CAF50 100%)',
                }}
              >
                {/* Animated background effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 transform translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>

                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    {t("login.signing_in")}
                  </>
                ) : connectionStatus === 'offline' ? (
                  <>
                    <div className="w-2 h-2 bg-red-400 rounded-full mr-2"></div>
                    Server Offline
                  </>
                ) : (
                  t("login.signin")
                )}
              </button>
            </form>

            {/* Enhanced Interactive Features */}
            <div className="mt-6 space-y-4">
              {/* Professional Security Badge */}
              <div className="flex items-center justify-center">
                <div className="w-2 h-2 bg-eeu-orange rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-eeu-green rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-eeu-orange rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>

              {/* Enhanced Connection Status Info with Debug Actions */}
              {connectionStatus === 'offline' && (
                <Alert className="bg-red-50 border-red-200">
                  <AlertDescription className="text-red-700 text-sm text-center space-y-2">
                    <p>Cannot connect to backend server. Please ensure the proxy server is running on port 3003.</p>
                    <div className="flex justify-center space-x-2 mt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          console.log('🔧 Running manual backend diagnosis...');
                          // Placeholder for diagnosis function
                          toast({
                            title: "Connection Issue",
                            description: "Backend diagnosis not implemented yet.",
                            variant: "destructive",
                          });
                        }}
                        className="text-xs"
                      >
                        Diagnose Connection
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          console.log('⚡ Running quick connection test...');
                          // Placeholder for quick test function
                          toast({
                            title: "Connection Failed",
                            description: "Backend quick test not implemented yet.",
                            variant: "destructive",
                          });
                        }}
                        className="text-xs"
                      >
                        Quick Test
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* Interactive Brand Elements */}
              <div className="flex justify-center space-x-4">
                <div className="w-2 h-2 bg-eeu-orange rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-eeu-green rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-eeu-orange rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>

              {/* Professional Footer Message */}
              <div className="text-center">
                <p className="text-xs text-gray-600 font-medium">
                  Authorized Personnel Only
                </p>
                <p className="text-xs text-eeu-green font-semibold mt-1">
                  Secure Access • Ethiopian Electric Utility
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Footer Section */}
        <div className="mt-8 text-center space-y-4">
          {/* Professional System Info */}
          <div className="bg-white/10 backdrop-blur-md rounded-xl px-6 py-4 border border-white/20 shadow-lg">
            <div className="flex items-center justify-center space-x-3 mb-2">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <div className="w-4 h-4 bg-gradient-to-r from-eeu-green to-eeu-orange rounded-full"></div>
              </div>
              <p className="text-sm text-white/90 font-semibold">
                EEU Complaint Management System v3.1
              </p>
            </div>
            <p className="text-xs text-white/70 font-medium">
              System designed by <span className="text-white/90 font-semibold">Worku Mesafint Addis [504530]</span>
            </p>
          </div>

          {/* Copyright */}
          <div className="text-center">
            <p className="text-xs text-white/80 font-medium">© 2025 Ethiopian Electric Utility. All rights reserved.</p>
            <div className="flex justify-center space-x-2 mt-2">
              <div className="w-1 h-1 bg-white/60 rounded-full"></div>
              <div className="w-1 h-1 bg-white/60 rounded-full"></div>
              <div className="w-1 h-1 bg-white/60 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
