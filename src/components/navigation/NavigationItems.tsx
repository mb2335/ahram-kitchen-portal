
import { useLanguage } from "@/contexts/LanguageContext";

export function NavigationItems() {
  const { t } = useLanguage();

  return {
    home: t('nav.home'),
    menu: t('nav.menu'),
    cart: t('nav.cart'),
    orders: t('nav.orders'),
    faq: t('nav.faq'),
    signin: t('nav.signin'),
    signout: t('nav.signout'),
    vendor: t('nav.vendor'),
    profile: t('nav.profile'),
  };
}
