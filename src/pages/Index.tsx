import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageSwitcher } from '../components/ui/language-switcher';
import {
  Users,
  FileText,
  Shield,
  Phone,
  Mail,
  MapPin,
  Clock,
  CheckCircle,
  ArrowRight,
  Zap,
  Star,
  Sparkles
} from 'lucide-react';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  // Interactive state
  const [isLogoHovered, setIsLogoHovered] = useState(false);
  const [clickEffects, setClickEffects] = useState<Array<{id: number, x: number, y: number}>>([]);
  const [floatingElements, setFloatingElements] = useState<Array<{id: number, x: number, y: number, delay: number}>>([]);

  // Initialize floating elements
  useEffect(() => {
    const elements = Array.from({ length: 6 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 2
    }));
    setFloatingElements(elements);
  }, []);

  // Click effect handler
  const handleLogoClick = (event: React.MouseEvent) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const newEffect = {
      id: Date.now(),
      x,
      y
    };

    setClickEffects(prev => [...prev, newEffect]);

    // Remove effect after animation
    setTimeout(() => {
      setClickEffects(prev => prev.filter(effect => effect.id !== newEffect.id));
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 relative overflow-hidden">
      {/* Floating Background Elements */}
      {floatingElements.map((element) => (
        <div
          key={element.id}
          className="absolute w-2 h-2 bg-eeu-orange/20 rounded-full animate-float"
          style={{
            left: `${element.x}%`,
            top: `${element.y}%`,
            animationDelay: `${element.delay}s`,
            animationDuration: '6s'
          }}
        />
      ))}

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-eeu-orange/30 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                <p className="font-medium text-eeu-green">{t('login.title')}</p>
                <p className="text-xs text-eeu-orange">የኢትዮጵያ ኤሌክትሪክ አገልግሎት</p>
              </div>
            </div>
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      {/* Centered Logo Hero Section */}
      <section className="py-16 flex flex-col items-center justify-center min-h-[70vh] relative">
        <div className="text-center mb-12 animate-fade-in">
          {/* Centered Interactive Logo */}
          <div
            className="w-80 h-80 lg:w-96 lg:h-96 flex items-center justify-center group cursor-pointer relative mx-auto mb-8"
            onClick={handleLogoClick}
            onMouseEnter={() => setIsLogoHovered(true)}
            onMouseLeave={() => setIsLogoHovered(false)}
          >
            {/* Enhanced Glow Effects */}
            <div className={`absolute inset-0 bg-gradient-eeu rounded-full blur-3xl opacity-30 group-hover:opacity-60 transition-all duration-700 ${isLogoHovered ? 'animate-pulse-glow' : 'animate-pulse'}`}></div>
            <div className="absolute inset-6 bg-gradient-eeu-reverse rounded-full blur-xl opacity-20 group-hover:opacity-40 transition-all duration-500"></div>

            <img
              src="/eeu-logo-new.png"
              alt="Ethiopian Electric Utility Logo"
              className={`w-full h-full object-contain transform group-hover:scale-110 group-hover:rotate-1 transition-all duration-700 relative z-10 ${isLogoHovered ? 'animate-float' : ''}`}
            />

            {/* Multiple Rotating Rings */}
            <div className="absolute inset-0 border-4 border-transparent border-t-eeu-orange border-r-eeu-green rounded-full animate-spin opacity-30 group-hover:opacity-60 transition-opacity duration-500"></div>
            <div className="absolute inset-6 border-3 border-transparent border-b-eeu-green border-l-eeu-orange rounded-full animate-spin opacity-25 group-hover:opacity-50 transition-opacity duration-500" style={{ animationDirection: 'reverse', animationDuration: '4s' }}></div>
            <div className="absolute inset-12 border-2 border-transparent border-t-eeu-green border-b-eeu-orange rounded-full animate-spin opacity-20 group-hover:opacity-40 transition-opacity duration-500" style={{ animationDuration: '6s' }}></div>

            {/* Enhanced Sparkle Effects */}
            <div className="absolute top-12 right-12 w-4 h-4 bg-white rounded-full opacity-0 group-hover:opacity-100 animate-ping transition-opacity duration-300 shadow-lg">
              <Star className="w-4 h-4 text-eeu-orange" />
            </div>
            <div className="absolute bottom-16 left-16 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 animate-ping transition-opacity duration-300 shadow-lg" style={{ animationDelay: '0.4s' }}>
              <Sparkles className="w-3 h-3 text-eeu-green" />
            </div>
            <div className="absolute top-20 left-20 w-2 h-2 bg-yellow-400 rounded-full opacity-0 group-hover:opacity-100 animate-ping transition-opacity duration-300" style={{ animationDelay: '0.8s' }}></div>
            <div className="absolute bottom-20 right-20 w-2 h-2 bg-blue-400 rounded-full opacity-0 group-hover:opacity-100 animate-ping transition-opacity duration-300" style={{ animationDelay: '1.2s' }}></div>

            {/* Click Effects */}
            {clickEffects.map((effect) => (
              <div
                key={effect.id}
                className="absolute w-8 h-8 border-2 border-eeu-orange rounded-full animate-ping opacity-75"
                style={{
                  left: effect.x - 16,
                  top: effect.y - 16,
                  animationDuration: '1s'
                }}
              />
            ))}

            {/* Energy Pulse Effect */}
            <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500">
              <div className="absolute inset-0 rounded-full bg-gradient-eeu animate-ping opacity-20"></div>
              <div className="absolute inset-3 rounded-full bg-gradient-eeu-reverse animate-ping opacity-15" style={{ animationDelay: '0.5s' }}></div>
            </div>
          </div>

          {/* Modern Title Section with EEU Brand Colors */}
          <div className="space-y-6">
            <div className="relative">
              <h1 className="text-5xl lg:text-6xl font-bold text-eeu-orange drop-shadow-2xl shadow-black/50 relative z-10">
                {t('login.title')}
              </h1>
              {/* Enhanced shadow effect */}
              <h1 className="absolute inset-0 text-5xl lg:text-6xl font-bold text-black/30 blur-sm transform translate-x-1 translate-y-1">
                {t('login.title')}
              </h1>
            </div>
            <p className="text-xl lg:text-2xl text-eeu-green font-semibold">
              የኢትዮጵያ ኤሌክትሪክ አገልግሎት
            </p>
            <p className="text-lg text-gray-700 max-w-2xl mx-auto font-medium">
              {t('landing.welcome_description')}
            </p>
          </div>
        </div>
      </section>

      {/* Interactive Service Options */}
      <section className="py-16 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-eeu-orange mb-4">
              Choose Your Portal
            </h2>
            <p className="text-xl text-eeu-green font-medium">
              Select the appropriate portal for your needs
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Customer Portal */}
            <Card
              className="shadow-xl border-2 border-eeu-orange bg-white cursor-pointer hover:shadow-2xl transition-shadow duration-300"
              onClick={() => navigate('/customer-portal')}
            >
              <CardHeader className="text-center pb-6 bg-white border-b-4 border-eeu-orange rounded-t-lg">
                <div className="w-24 h-24 bg-eeu-orange/10 border-2 border-eeu-orange rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <FileText className="w-12 h-12 text-eeu-orange" />
                </div>
                <div className="relative">
                  <CardTitle className="text-3xl font-bold text-eeu-orange drop-shadow-lg relative z-10">
                    {t('landing.customer_portal')}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="text-center p-8">
                <p className="text-gray-700 mb-8 text-lg font-medium">
                  {t('landing.customer_portal_description')}
                </p>
                <ul className="text-left space-y-4 mb-8">
                  <li className="flex items-center text-gray-800 font-medium">
                    <div className="w-8 h-8 bg-eeu-green/10 border-2 border-eeu-green rounded-full flex items-center justify-center mr-4 shadow-md">
                      <CheckCircle className="w-5 h-5 text-eeu-green" />
                    </div>
                    {t('landing.feature.file_complaints')}
                  </li>
                  <li className="flex items-center text-gray-800 font-medium">
                    <div className="w-8 h-8 bg-eeu-green/10 border-2 border-eeu-green rounded-full flex items-center justify-center mr-4 shadow-md">
                      <CheckCircle className="w-5 h-5 text-eeu-green" />
                    </div>
                    {t('landing.feature.track_status')}
                  </li>
                  <li className="flex items-center text-gray-800 font-medium">
                    <div className="w-8 h-8 bg-eeu-green/10 border-2 border-eeu-green rounded-full flex items-center justify-center mr-4 shadow-md">
                      <CheckCircle className="w-5 h-5 text-eeu-green" />
                    </div>
                    {t('landing.feature.account_lookup')}
                  </li>
                  <li className="flex items-center text-gray-800 font-medium">
                    <div className="w-8 h-8 bg-eeu-green/10 border-2 border-eeu-green rounded-full flex items-center justify-center mr-4 shadow-md">
                      <CheckCircle className="w-5 h-5 text-eeu-green" />
                    </div>
                    {t('landing.feature.multilingual')}
                  </li>
                </ul>
                <Button className="w-full bg-white border-2 border-eeu-orange text-eeu-orange hover:bg-eeu-orange hover:text-white font-bold py-4 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 text-lg" size="lg">
                  {t('landing.access_customer_portal')}
                  <ArrowRight className="ml-3 w-6 h-6" />
                </Button>
              </CardContent>
            </Card>

            {/* Staff Login */}
            <Card
              className="shadow-xl border-2 border-eeu-green bg-white cursor-pointer hover:shadow-2xl transition-shadow duration-300"
              onClick={() => navigate('/login')}
            >
              <CardHeader className="text-center pb-6 bg-white border-b-4 border-eeu-green rounded-t-lg">
                <div className="w-24 h-24 bg-eeu-green/10 border-2 border-eeu-green rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <Shield className="w-12 h-12 text-eeu-green" />
                </div>
                <div className="relative">
                  <CardTitle className="text-3xl font-bold text-eeu-green drop-shadow-lg relative z-10">
                    {t('landing.staff_portal')}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="text-center p-8">
                <p className="text-gray-700 mb-8 text-lg font-medium">
                  {t('landing.staff_portal_description')}
                </p>
                <ul className="text-left space-y-4 mb-8">
                  <li className="flex items-center text-gray-800 font-medium">
                    <div className="w-8 h-8 bg-eeu-orange/10 border-2 border-eeu-orange rounded-full flex items-center justify-center mr-4 shadow-md">
                      <CheckCircle className="w-5 h-5 text-eeu-orange" />
                    </div>
                    {t('landing.feature.manage_complaints')}
                  </li>
                  <li className="flex items-center text-gray-800 font-medium">
                    <div className="w-8 h-8 bg-eeu-orange/10 border-2 border-eeu-orange rounded-full flex items-center justify-center mr-4 shadow-md">
                      <CheckCircle className="w-5 h-5 text-eeu-orange" />
                    </div>
                    {t('landing.feature.analytics_reports')}
                  </li>
                  <li className="flex items-center text-gray-800 font-medium">
                    <div className="w-8 h-8 bg-eeu-orange/10 border-2 border-eeu-orange rounded-full flex items-center justify-center mr-4 shadow-md">
                      <CheckCircle className="w-5 h-5 text-eeu-orange" />
                    </div>
                    {t('landing.feature.user_management')}
                  </li>
                  <li className="flex items-center text-gray-800 font-medium">
                    <div className="w-8 h-8 bg-eeu-orange/10 border-2 border-eeu-orange rounded-full flex items-center justify-center mr-4 shadow-md">
                      <CheckCircle className="w-5 h-5 text-eeu-orange" />
                    </div>
                    {t('landing.feature.role_permissions')}
                  </li>
                </ul>
                <Button className="w-full bg-white border-2 border-eeu-green text-eeu-green hover:bg-eeu-green hover:text-white font-bold py-4 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 text-lg" size="lg">
                  {t('landing.staff_login')}
                  <ArrowRight className="ml-3 w-6 h-6" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Contact Information */}
      <section className="py-16 bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-4xl font-bold text-eeu-green mb-4">
              {t('landing.contact_title')}
            </h3>
            <p className="text-xl text-eeu-orange font-medium">
              {t('landing.contact_description')}
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
            <div className="text-center bg-white rounded-xl p-8 shadow-lg border-2 border-eeu-orange/20 hover:border-eeu-orange hover:shadow-xl transition-all duration-300">
              <div className="w-20 h-20 bg-eeu-orange/10 border-2 border-eeu-orange rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Phone className="w-10 h-10 text-eeu-orange" />
              </div>
              <h4 className="text-2xl font-bold text-eeu-orange mb-4">
                {t('landing.contact.phone')}
              </h4>
              <p className="text-gray-700 font-semibold text-lg">+251-11-123-4567</p>
              <p className="text-gray-700 font-semibold text-lg">+251-11-123-4568</p>
            </div>

            <div className="text-center bg-white rounded-xl p-8 shadow-lg border-2 border-eeu-green/20 hover:border-eeu-green hover:shadow-xl transition-all duration-300">
              <div className="w-20 h-20 bg-eeu-green/10 border-2 border-eeu-green rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Mail className="w-10 h-10 text-eeu-green" />
              </div>
              <h4 className="text-2xl font-bold text-eeu-green mb-4">
                {t('landing.contact.email')}
              </h4>
              <p className="text-gray-700 font-semibold text-lg">complaints@eeu.gov.et</p>
              <p className="text-gray-700 font-semibold text-lg">support@eeu.gov.et</p>
            </div>

            <div className="text-center bg-white rounded-xl p-8 shadow-lg border-2 border-eeu-orange/20 hover:border-eeu-orange hover:shadow-xl transition-all duration-300">
              <div className="w-20 h-20 bg-eeu-orange/10 border-2 border-eeu-orange rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Clock className="w-10 h-10 text-eeu-orange" />
              </div>
              <h4 className="text-2xl font-bold text-eeu-orange mb-4">
                {t('landing.contact.hours')}
              </h4>
              <p className="text-gray-700 font-semibold text-lg">{t('landing.contact.weekdays')}</p>
              <p className="text-gray-700 font-semibold text-lg">{t('landing.contact.weekend')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t-4 border-eeu-orange py-4 relative">
        {/* Gradient border effect */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-eeu-green to-eeu-orange"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="border-t border-gray-200 pt-4 space-y-2">
              <div className="flex flex-col md:flex-row justify-center items-center gap-1 text-xs">
                <span className="text-gray-600">System Designed by:</span>
                <span className="font-semibold text-eeu-orange">WORKU MESAFINT ADDIS [504530]</span>
              </div>
              <p className="text-gray-700 text-sm font-medium">
                © 2025 Ethiopian Electric Utility. All rights reserved.
              </p>
              <p className="text-gray-600 text-xs font-medium">
                Version 1.0.0
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
