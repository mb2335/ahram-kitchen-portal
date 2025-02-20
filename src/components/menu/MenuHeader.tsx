import { useLanguage } from "@/contexts/LanguageContext";

export function MenuHeader() {
  const { t } = useLanguage();
  
  return (
    <div className="text-center mb-12">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">{t('menu.title')}</h1>
      <p className="text-lg text-gray-600 max-w-2xl mx-auto">
        {t('menu.description')}
      </p>
    </div>
  );
}