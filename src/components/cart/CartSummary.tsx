import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

interface CartSummaryProps {
  total: number;
  onCheckout: () => void;
  isAuthenticated: boolean;
}

export function CartSummary({ total, onCheckout, isAuthenticated }: CartSummaryProps) {
  const { t } = useLanguage();

  return (
    <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-center mb-4">
        <span className="text-lg font-medium">{t('cart.total')}</span>
        <span className="text-2xl font-bold text-primary">${total.toFixed(2)}</span>
      </div>
      <Button 
        className="w-full bg-primary hover:bg-primary/90 text-lg py-6"
        onClick={onCheckout}
      >
        {isAuthenticated ? t('cart.checkout') : t('cart.guest_checkout')}
      </Button>
    </div>
  );
}