import { useState } from 'react';
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
  const { toast } = useToast();
  const { language } = useLanguage();

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
          toast({
            title: language === 'en' ? 'App installed successfully!' : '앱이 성공적으로 설치되었습니다!',
            description: language === 'en' 
              ? 'You can now access the app from your home screen' 
              : '이제 홈 화면에서 앱에 액세스할 수 있습니다',
            duration: 5000,
          });
        }
      } catch (error) {
        console.error('Error installing PWA:', error);
      }
      setDeferredPrompt(null);
    } else {
      // Show installation instructions based on platform
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isMacOS = navigator.platform.indexOf('Mac') !== -1;
      const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
      
      if (isIOS || (isMacOS && isSafari)) {
        toast({
          title: language === 'en' ? 'Install on iOS/Safari' : 'iOS/Safari에 설치',
          description: language === 'en' 
            ? 'Tap the share button and select "Add to Home Screen"' 
            : '공유 버튼을 탭하고 "홈 화면에 추가"를 선택하세요',
          duration: 5000,
        });
      } else {
        toast({
          title: language === 'en' ? 'Install instructions' : '설치 안내',
          description: language === 'en'
            ? 'Use Chrome or Edge browser and select "Install" from the menu'
            : 'Chrome 또는 Edge 브라우저를 사용하여 메뉴에서 "설치"를 선택하세요',
          duration: 5000,
        });
      }
    }
  };

  // Add event listener for beforeinstallprompt
  useState(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  });

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleInstallClick}
      className="flex items-center gap-2 w-full sm:w-auto justify-start sm:justify-center hover:bg-accent hover:text-accent-foreground transition-colors"
    >
      <Download className="h-4 w-4 sm:mr-2" />
      <span className="block">
        {language === 'en' ? 'Install App' : '앱 설치'}
      </span>
    </Button>
  );
}