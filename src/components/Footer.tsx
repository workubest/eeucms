import { useLanguage } from '@/contexts/LanguageContext';

export function Footer() {
  const { language } = useLanguage();

  const footerText = {
    en: {
      designedBy: "System Designed by:",
      designer: "WORKU MESAFINT ADDIS [504530]",
      copyright: "© 2025 Ethiopian Electric Utility. All rights reserved.",
      version: "Version 1.0.0"
    },
    am: {
      designedBy: "ሲስተሙ የተዘጋጀው በ:",
      designer: "ወርቁ መሳፍንት አዲስ [504530]",
      copyright: "© 2025 የኢትዮጵያ ኤሌክትሪክ ኮርፖሬሽን። ሁሉም መብቶች የተጠበቁ ናቸው።",
      version: "ስሪት 1.0.0"
    }
  };

  const text = footerText[language];

  return (
    <footer className="bg-background border-t-2 border-primary/20 mt-auto relative">
      {/* Gradient accent line */}
      <div className="absolute top-0 left-0 right-0 h-1 gradient-brand"></div>

      <div className="container mx-auto px-4 py-2">
        <div className="flex flex-col md:flex-row justify-between items-center text-xs space-y-1 md:space-y-0">
          <div className="flex flex-col md:flex-row items-center gap-1 text-center md:text-left">
            <span className="text-muted-foreground">{text.designedBy}</span>
            <span className="font-semibold text-primary">{text.designer}</span>
          </div>
          <div className="flex flex-col md:flex-row items-center gap-1 text-center md:text-right">
            <span className="text-muted-foreground">{text.copyright}</span>
            <span className="font-medium text-secondary">{text.version}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
