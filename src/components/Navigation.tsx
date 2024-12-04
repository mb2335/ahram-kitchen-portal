import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { ShoppingCart, Globe } from "lucide-react";
import { Link } from "react-router-dom";

export function Navigation() {
  const { language, setLanguage, t } = useLanguage();

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex-shrink-0 flex items-center">
            <Link to="/" className="text-2xl font-bold text-primary">
              Ahram Kitchen
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLanguage(language === 'en' ? 'ko' : 'en')}
              className="text-gray-600"
            >
              <Globe className="h-5 w-5 mr-1" />
              {language.toUpperCase()}
            </Button>
            <Link to="/cart">
              <Button variant="outline" size="sm">
                <ShoppingCart className="h-5 w-5 mr-1" />
                {t('nav.cart')}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}