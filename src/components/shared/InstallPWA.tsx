import { useState, useEffect } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const { toast } = useToast();
  const { language } = useLanguage();

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setIsInstallable(false);
      toast({
        title: language === 'en' ? 'App installed successfully!' : '앱이 성공적으로 설치되었습니다!',
        description: language === 'en' 
          ? 'You can now access the app from your home screen' 
          : '이제 홈 화면에서 앱에 액세스할 수 있습니다',
      });
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Check if running as standalone PWA
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstallable(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [language, toast]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // Show instructions for iOS or when installation is not available
      toast({
        title: language === 'en' ? 'Installation not available' : '설치할 수 없음',
        description: language === 'en' 
          ? 'Please use your browser\'s install option or check if the app is already installed' 
          : '브라우저의 설치 옵션을 사용하거나 앱이 이미 설치되어 있는지 확인하세요',
        variant: "destructive",
      });
      return;
    }

    try {
      // Show the install prompt
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setIsInstallable(false);
      }
    } catch (error) {
      console.error('Error installing PWA:', error);
      toast({
        title: language === 'en' ? 'Installation failed' : '설치 실패',
        description: language === 'en' 
          ? 'Please try again or use your browser\'s install option' 
          : '다시 시도하거나 브라우저의 설치 옵션을 사용하세요',
        variant: "destructive",
      });
    }
  };

  // Only show the button if the app is installable
  if (!isInstallable) return null;

  return (
    <Button
      onClick={handleInstallClick}
      className="w-full mt-6 mb-2"
      variant="default"
    >
      <Download className="h-4 w-4 mr-2" />
      {language === 'en' ? 'Install App' : '앱 설치'}
    </Button>
  );
}