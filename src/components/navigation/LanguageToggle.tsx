import { Switch } from "@/components/ui/switch";
import { useLanguage } from "@/contexts/LanguageContext";

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'ko' : 'en');
  };

  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm text-gray-600">ENG</span>
      <Switch
        checked={language === 'ko'}
        onCheckedChange={toggleLanguage}
      />
      <span className="text-sm text-gray-600">KOR</span>
    </div>
  );
}