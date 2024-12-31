import { useState, useEffect } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const { toast } = useToast();
  const { language } = useLanguage();

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      toast({
        title: language === 'en' ? 'App installed successfully!' : '앱이 성공적으로 설치되었습니다!',
        description: language === 'en' 
          ? 'You can now access the app from your home screen' 
          : '이제 홈 화면에서 앱에 액세스할 수 있습니다',
      });
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [language, toast]);

  const handleInstallClick = async () => {
    // Check if running as standalone PWA
    if (window.matchMedia('(display-mode: standalone)').matches) {
      toast({
        title: language === 'en' ? 'Unknown Error' : '알 수 없는 오류',
        description: language === 'en' 
          ? 'Unknown Error Message. Please contact us.' 
          : '알 수 없는 오류가 발생했습니다. 문의해 주세요.',
        variant: "destructive",
      });
      return;
    }

    // Check if it's an iOS device
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    if (isIOS) {
      toast({
        title: language === 'en' ? 'Unknown Error' : '알 수 없는 오류',
        description: language === 'en' 
          ? 'Unknown Error Message. Please contact us.' 
          : '알 수 없는 오류가 발생했습니다. 문의해 주세요.',
        variant: "destructive",
      });
      return;
    }

    // For Android users who already have the app installed but try to install again
    if (!deferredPrompt && !window.matchMedia('(display-mode: standalone)').matches) {
      toast({
        title: language === 'en' ? 'Unknown Error' : '알 수 없는 오류',
        description: language === 'en' 
          ? 'Unknown Error Message. Please contact us.' 
          : '알 수 없는 오류가 발생했습니다. 문의해 주세요.',
        variant: "destructive",
      });
      return;
    }

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } catch (error) {
      console.error('Error installing PWA:', error);
      toast({
        title: language === 'en' ? 'Unknown Error' : '알 수 없는 오류',
        description: language === 'en' 
          ? 'Unknown Error Message. Please contact us.' 
          : '알 수 없는 오류가 발생했습니다. 문의해 주세요.',
        variant: "destructive",
      });
    }
  };

  return (
    <Button
      onClick={handleInstallClick}
      className="w-full"
      variant="default"
    >
      <Download className="h-4 w-4 mr-2" />
      {language === 'en' ? 'Install App' : '앱 설치'}
    </Button>
  );
}