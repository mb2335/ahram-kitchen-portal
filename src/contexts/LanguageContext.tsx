import React, { createContext, useContext, useState } from 'react';

type Language = 'en' | 'ko';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations = {
  en: {
    'nav.menu': 'Menu',
    'nav.cart': 'Cart',
    'nav.orders': 'Order History',
    'nav.profile': 'Profile',
    'nav.vendor': 'Vendor Dashboard',
    'nav.signin': 'Sign In',
    'nav.signout': 'Sign Out',
    'menu.title': 'Our Menu',
    'menu.description': 'Welcome to Ahram Kitchen! We hope that you enjoy our food! Please note that for Entres and Sidedishes, delivery must be on Thursdays or Fridays. For Lunchboxes, delivery cannot be on Thursdays or Fridays.',
    'cart.empty': 'Your cart is empty',
    'cart.total': 'Total',
    'cart.checkout': 'Proceed to Checkout',
    'cart.guest_checkout': 'Continue as Guest',
    'cart.uncategorized': 'Other Items',
    'item.add': 'Add to Cart',
    'item.soldOut': 'Sold Out',
    'item.inStock': 'No Limit',
    'item.remainingStock': 'Remaining',
    'orders.title': 'Order History',
    'orders.empty': 'No orders found',
    'orders.status.pending': 'Pending',
    'orders.status.processing': 'Processing',
    'orders.status.completed': 'Completed',
    'orders.status.rejected': 'Rejected',
    'profile.title': 'Profile',
    'vendor.dashboard': 'Vendor Dashboard',
    'vendor.menu': 'Menu Management',
    'vendor.orders': 'Orders',
    'vendor.profile': 'Profile',
  },
  ko: {
    'nav.menu': '메뉴',
    'nav.cart': '장바구니',
    'nav.orders': '주문 내역',
    'nav.profile': '프로필',
    'nav.vendor': '판매자 대시보드',
    'nav.signin': '로그인',
    'nav.signout': '로그아웃',
    'menu.title': '메뉴판',
    'menu.description': '아람 키친에 오신 것을 환영합니다! 저희 음식을 즐기시길 바랍니다! 주요리와 사이드 디시는 목요일이나 금요일에만 배송이 가능합니다. 런치박스는 목요일이나 금요일에는 배송이 불가능합니다.',
    'cart.empty': '장바구니가 비어 있습니다',
    'cart.total': '총액',
    'cart.checkout': '결제하기',
    'cart.guest_checkout': '게스트로 계속하기',
    'cart.uncategorized': '기타 항목',
    'item.add': '장바구니에 담기',
    'item.soldOut': '품절',
    'item.inStock': '무제한',
    'item.remainingStock': '남은',
    'orders.title': '주문 내역',
    'orders.empty': '주문 내역이 없습니다',
    'orders.status.pending': '대기 중',
    'orders.status.processing': '처리 중',
    'orders.status.completed': '완료',
    'orders.status.rejected': '거절됨',
    'profile.title': '프로필',
    'vendor.dashboard': '판매자 대시보드',
    'vendor.menu': '메뉴 관리',
    'vendor.orders': '주문',
    'vendor.profile': '프로필',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');

  const t = (key: string) => {
    return translations[language][key as keyof typeof translations['en']] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
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