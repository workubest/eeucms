import React, { createContext, useContext, useState, useEffect } from 'react';

interface LanguageContextType {
  language: string;
  setLanguage: (lang: string) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations = {
  en: {
    'login.title': 'Ethiopian Electric Utility',
    'login.email': 'Email',
    'login.password': 'Password',
    'login.signin': 'Sign In',
    'login.signing_in': 'Signing In...',
    'login.success': 'Login Successful',
    'login.success_desc': 'Welcome back!',
    'login.error': 'Login Failed',
    'login.error_desc': 'Please check your credentials and try again',
    'landing.welcome_description': 'Your trusted partner for reliable electricity services and complaint management',
    'landing.customer_portal': 'Customer Portal',
    'landing.customer_portal_description': 'Access your account, file complaints, and track their status',
    'landing.staff_portal': 'Staff Portal',
    'landing.staff_portal_description': 'Manage complaints, generate reports, and access administrative features',
    'landing.feature.file_complaints': 'File and track complaints',
    'landing.feature.track_status': 'Track complaint status',
    'landing.feature.account_lookup': 'Account lookup and history',
    'landing.feature.multilingual': 'Multilingual support',
    'landing.feature.manage_complaints': 'Manage customer complaints',
    'landing.feature.analytics_reports': 'Analytics and reporting',
    'landing.feature.user_management': 'User and role management',
    'landing.feature.role_permissions': 'Role-based permissions',
    'landing.access_customer_portal': 'Access Customer Portal',
    'landing.staff_login': 'Staff Login',
    'landing.contact_title': 'Contact Information',
    'landing.contact_description': 'Get in touch with our support team',
    'landing.contact.phone': 'Phone',
    'landing.contact.email': 'Email',
    'landing.contact.hours': 'Operating Hours',
    'landing.contact.weekdays': 'Mon-Fri: 8:00 AM - 5:00 PM',
    'landing.contact.weekend': 'Sat-Sun: 9:00 AM - 1:00 PM'
  },
  am: {
    'login.title': 'የኢትዮጵያ ኤሌክትሪክ አገልግሎት',
    'login.email': 'ኢሜይል',
    'login.password': 'የይለፍ ቃል',
    'login.signin': 'መግቢያ',
    'login.signing_in': 'በማስገባት ላይ...',
    'login.success': 'መግቢያ ተሳኗል',
    'login.success_desc': 'እንኳን ደህና መጡ!',
    'login.error': 'መግቢያ አልተሳካም',
    'login.error_desc': 'እባክዎ ምክክሮችን ያረጋግጡ እና እንደገና ይሞክሩ',
    'landing.welcome_description': 'ለኢትዮጵያ ኤሌክትሪክ አገልግሎት እና የቅሬታ አስተያየት ማስተያየት እምነት የሆነ አጋር ነን',
    'landing.customer_portal': 'የደንበኛ ቦርድ',
    'landing.customer_portal_description': 'የእርሶ መለያ መድረስ፣ ቅሬታ መስጠት እና ሁኔታን መከታተል',
    'landing.staff_portal': 'የሰራተኛ ቦርድ',
    'landing.staff_portal_description': 'የደንበኛ ቅሬታ ማስተያየት፣ ሪፖርት መስጠት እና የአስተያየት ባህሪያት መድረስ',
    'landing.feature.file_complaints': 'ቅሬታ መስጠት እና መከታተል',
    'landing.feature.track_status': 'የቅሬታ ሁኔታ መከታተል',
    'landing.feature.account_lookup': 'መለያ መፈለግ እና ታሪክ',
    'landing.feature.multilingual': 'ባህላዊ ድጋፍ',
    'landing.feature.manage_complaints': 'የደንበኛ ቅሬታ ማስተያየት',
    'landing.feature.analytics_reports': 'ትንታኔ እና ሪፖርት',
    'landing.feature.user_management': 'ተጠቃሚ እና ሚና ማስተያየት',
    'landing.feature.role_permissions': 'ተጠቃሚ ሚና መብቶች',
    'landing.access_customer_portal': 'የደንበኛ ቦርድ መድረስ',
    'landing.staff_login': 'ሰራተኛ መግቢያ',
    'landing.contact_title': 'የመረጃ መያዣ',
    'landing.contact_description': 'ከድጋፍ ቡድን ጋር መገናኘት',
    'landing.contact.phone': 'ስልክ',
    'landing.contact.email': 'ኢሜይል',
    'landing.contact.hours': 'የሥራ ሰዓት',
    'landing.contact.weekdays': 'ሰኞ-አርብ: 8:00 እለት - 5:00 ከሰዓት',
    'landing.contact.weekend': 'ቅዳሜ-እሁድ: 9:00 እለት - 1:00 ከሰዓት'
  }
};

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState('en');

  useEffect(() => {
    const savedLanguage = localStorage.getItem('language');
    if (savedLanguage) {
      setLanguage(savedLanguage);
    }
  }, []);

  const handleSetLanguage = (lang: string) => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
  };

  const t = (key: string): string => {
    return translations[language as keyof typeof translations]?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
