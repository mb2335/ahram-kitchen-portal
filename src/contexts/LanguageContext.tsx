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
    'nav.faq': 'FAQ',
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
    'item.viewDetails': 'Click to View Details',
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
    'checkout.customer.smsOptIn': 'I agree to receive SMS updates about my order.',
    'checkout.customer.previouslyOptedIn': 'You have previously opted in to receive SMS updates.',
    'checkout.customer.smsRequired.title': 'SMS Opt-in Required',
    'checkout.customer.smsRequired.description': 'You must agree to receive SMS updates to place an order. This allows us to send you important updates about your order status.',
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
    'checkout.payment.total': 'Order Total',
    'checkout.payment.instructions': 'Please send payment via Zelle to: <strong>kyjuri@gmail.com</strong> or via Venmo to: <strong>@juri_y</strong>',
    'checkout.payment.file.selected': 'File selected: {filename}',
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
    'orders.page.title': 'Order History',
    'orders.loading': 'Loading your orders...',
    'category.settings.title': 'Category Settings',
    'profile.page.title': 'Customer Profile',
    'profile.fullName': 'Full Name',
    'profile.email': 'Email',
    'profile.phone': 'Phone',
    'profile.save': 'Save Changes',
    'profile.saving': 'Saving...',
    'profile.success': 'Profile updated successfully',
    'profile.error.load': 'Failed to load profile. Please try again.',
    'profile.error.update': 'Failed to update profile',
    'profile.loading': 'Loading your information...',
    'profile.noProfile': 'No profile found. Please create one.',
    'auth.signin': 'Sign In',
    'auth.signup': 'Create an Account',
    'auth.checkout': 'Sign in to Complete Your Order',
    'auth.reset': 'Reset Your Password',
    'auth.request': 'Request Password Reset',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.fullName': 'Full Name',
    'auth.phone': 'Phone Number',
    'auth.forgot': 'Forgot password?',
    'auth.noAccount': "Don't have an account?",
    'auth.hasAccount': 'Already have an account?',
    'auth.processing': 'Creating Account...',
    'auth.signingIn': 'Signing in...',
    // Additional fulfillment keys
    'fulfillment.title': 'Fulfillment Method',
    'fulfillment.pickup.title': 'Pickup',
    'fulfillment.pickup.description': 'Pick up your order at our location',
    'fulfillment.delivery.title': 'Delivery',
    'fulfillment.delivery.description': 'We\'ll deliver your order to you',
    'fulfillment.delivery.notEligible': 'Not Available',
    // Additional delivery keys
    'delivery.date': 'Delivery Date',
    'delivery.address': 'Delivery Address',
    'pickup.date': 'Pickup Date',
    'order.notes': 'Special Instructions',
  },
  ko: {
    'nav.menu': '메뉴',
    'nav.cart': '장바구니',
    'nav.orders': '주문 내역',
    'nav.profile': '프로필',
    'nav.vendor': '판매자 대시보드',
    'nav.signin': '로그인',
    'nav.signout': '로그아웃',
    'nav.faq': 'FAQ',
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
    'item.viewDetails': '클릭하여 상세보기',
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
    'checkout.customer.smsOptIn': '주문에 관한 SMS 업데이트를 받는 것에 동의합니다.',
    'checkout.customer.previouslyOptedIn': '이미 SMS 업데이트 수신에 동의하셨습니다.',
    'checkout.customer.smsRequired.title': 'SMS 동의 필요',
    'checkout.customer.smsRequired.description': '주문하시려면 SMS 업데이트를 받는 것에 동의하셔야 합니다. 이를 통해 주문 상태에 대한 중요한 업데이트를 보내드립니다.',
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
    'checkout.payment.total': '주문 총액',
    'checkout.payment.instructions': 'Zelle로 <strong>kyjuri@gmail.com</strong>에게 또는 Venmo로 <strong>@juri_y</strong>에게 결제해 주세요',
    'checkout.payment.file.selected': '선택된 파일: {filename}',
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
    'orders.page.title': '주문 내역',
    'orders.loading': '주문을 불러오는 중...',
    'category.settings.title': '카테고리 설정',
    'profile.page.title': '고객 프로필',
    'profile.fullName': '이름',
    'profile.email': '이메일',
    'profile.phone': '전화번호',
    'profile.save': '변경사항 저장',
    'profile.saving': '저장 중...',
    'profile.success': '프로필이 성공적으로 업데이트되었습니다',
    'profile.error.load': '프로필을 불러오는데 실패했습니다. 다시 시도해주세요.',
    'profile.error.update': '프로필 업데이트에 실패했습니다',
    'profile.loading': '정보를 불러오는 중...',
    'profile.noProfile': '프로필이 없습니다. 새로 만들어주세요.',
    'auth.signin': '로그인',
    'auth.signup': '계정 만들기',
    'auth.checkout': '주문을 완료하려면 로그인하세요',
    'auth.reset': '비밀번호 재설정',
    'auth.request': '비밀번호 재설정 요청',
    'auth.email': '이메일',
    'auth.password': '비밀번호',
    'auth.fullName': '이름',
    'auth.phone': '전화번호',
    'auth.forgot': '비밀번호를 잊으셨나요?',
    'auth.noAccount': '계정이 없으신가요?',
    'auth.hasAccount': '이미 계정이 있으신가요?',
    'auth.processing': '계정 생성 중...',
    'auth.signingIn': '로그인 중...',
    // Additional fulfillment keys
    'fulfillment.title': '주문 수령 방법',
    'fulfillment.pickup.title': '픽업',
    'fulfillment.pickup.description': '매장에서 직접 수령',
    'fulfillment.delivery.title': '배달',
    'fulfillment.delivery.description': '주문하신 곳으로 배달',
    'fulfillment.delivery.notEligible': '이용 불가',
    // Additional delivery keys
    'delivery.date': '배달 날짜',
    'delivery.address': '배달 주소',
    'pickup.date': '픽업 날짜',
    'order.notes': '특별 요청',
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
