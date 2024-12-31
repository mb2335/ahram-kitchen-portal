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
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Check if running as standalone PWA
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstallable(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      return;
    }

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        toast({
          title: language === 'en' ? 'App installed successfully!' : '앱이 성공적으로 설치되었습니다!',
          description: language === 'en' 
            ? 'You can now access the app from your home screen' 
            : '이제 홈 화면에서 앱에 액세스할 수 있습니다',
        });
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

    setDeferredPrompt(null);
  };

  if (!isInstallable) {
    return null;
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleInstallClick}
      className="flex items-center gap-2 w-full sm:w-auto justify-start sm:justify-center"
    >
      <Download className="h-4 w-4" />
      <span className="block">
        {language === 'en' ? 'Install App' : '앱 설치'}
      </span>
    </Button>
  );
}