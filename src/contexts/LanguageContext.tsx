
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
    'menu.description': 'Made from scratch, made with love!',
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
    // Checkout process translations
    'checkout.title': 'Checkout',
    'checkout.summary': 'Order Summary',
    'checkout.subtotal': 'Subtotal',
    'checkout.tax': 'Tax',
    'checkout.discount': 'Discount',
    'checkout.total': 'Total',
    'checkout.quantity': 'Quantity',
    'checkout.customer.info': 'Customer Information',
    'checkout.customer.fullName': 'Full Name',
    'checkout.customer.email': 'Email',
    'checkout.customer.phone': 'Phone Number',
    'checkout.fulfillment': 'Fulfillment Method',
    'checkout.fulfillment.delivery': 'Delivery',
    'checkout.fulfillment.pickup': 'Pickup',
    'checkout.delivery.address': 'Delivery Address (Required)',
    'checkout.delivery.address.placeholder': 'Enter your complete delivery address',
    'checkout.date': 'Select Date',
    'checkout.date.select': 'Pick a date',
    'checkout.pickup.title': 'Pickup Details',
    'checkout.pickup.options': 'Pickup Options',
    'checkout.pickup.time': 'Select pickup time and location',
    'checkout.categories.methods': 'Select delivery time and specify address',
    'checkout.notes': 'Special Instructions (Optional)',
    'checkout.notes.placeholder': 'Any special requests or dietary requirements?',
    'checkout.payment.title': 'Payment Instructions',
    'checkout.payment.proof': 'Upload Payment Proof',
    'checkout.submit': 'Place Order',
    'checkout.processing': 'Processing...',
    'checkout.error.date': 'Please select a valid date',
    'checkout.error.payment': 'Please upload proof of payment',
    'checkout.error.address': 'Please enter a delivery address for delivery items',
    'checkout.error.pickup': 'Please select pickup time and location',
    'checkout.thankyou.title': 'Thanks, your order has been placed.',
    'checkout.thankyou.details': 'Here is a detailed summary of your order.',
    'checkout.thankyou.id': 'Order #',
    'checkout.thankyou.placed': 'Placed on',
    'checkout.thankyou.pickup': 'Pickup Details',
    'checkout.thankyou.return': 'Return to Menu',
    'checkout.thankyou.vieworders': 'View Order History',
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
    'menu.description': 'Made from scratch, made with love!',
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
    // Checkout process translations
    'checkout.title': '결제',
    'checkout.summary': '주문 요약',
    'checkout.subtotal': '소계',
    'checkout.tax': '세금',
    'checkout.discount': '할인',
    'checkout.total': '총계',
    'checkout.quantity': '수량',
    'checkout.customer.info': '고객 정보',
    'checkout.customer.fullName': '이름',
    'checkout.customer.email': '이메일',
    'checkout.customer.phone': '전화번호',
    'checkout.fulfillment': '주문 수령 방법',
    'checkout.fulfillment.delivery': '배달',
    'checkout.fulfillment.pickup': '픽업',
    'checkout.delivery.address': '배달 주소 (필수)',
    'checkout.delivery.address.placeholder': '전체 배달 주소를 입력하세요',
    'checkout.date': '날짜 선택',
    'checkout.date.select': '날짜 선택',
    'checkout.pickup.title': '픽업 상세정보',
    'checkout.pickup.options': '픽업 옵션',
    'checkout.pickup.time': '픽업 시간과 장소 선택',
    'checkout.categories.methods': '배송 시간을 선택하고 주소를 지정하세요',
    'checkout.notes': '특별 요청 (선택사항)',
    'checkout.notes.placeholder': '특별한 요청이나 식이 요구사항이 있으신가요?',
    'checkout.payment.title': '결제 안내',
    'checkout.payment.proof': '결제 증명 업로드',
    'checkout.submit': '주문하기',
    'checkout.processing': '처리 중...',
    'checkout.error.date': '유효한 날짜를 선택해주세요',
    'checkout.error.payment': '결제 증명을 업로드해주세요',
    'checkout.error.address': '배달 항목에 대한 배달 주소를 입력해주세요',
    'checkout.error.pickup': '픽업 시간과 장소를 선택해주세요',
    'checkout.thankyou.title': '감사합니다, 주문이 완료되었습니다.',
    'checkout.thankyou.details': '주문에 대한 자세한 요약입니다.',
    'checkout.thankyou.id': '주문 번호 #',
    'checkout.thankyou.placed': '주문 일시',
    'checkout.thankyou.pickup': '픽업 상세정보',
    'checkout.thankyou.return': '메뉴로 돌아가기',
    'checkout.thankyou.vieworders': '주문 내역 보기',
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
