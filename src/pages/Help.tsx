import { Apple, Smartphone, ArrowDown, CheckCircle, Info } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card } from "@/components/ui/card";
import { InstallPWA } from "@/components/shared/InstallPWA";

export function Help() {
  const { language } = useLanguage();

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8 text-center">
        {language === 'en' ? 'Installation Guide' : '설치 가이드'}
      </h1>
      
      <div className="grid gap-10 md:grid-cols-2">
        {/* iOS Installation */}
        <Card className="p-8 space-y-6">
          <div className="flex items-center gap-3 mb-6">
            <Apple className="h-7 w-7" />
            <h2 className="text-2xl font-semibold">
              {language === 'en' ? 'iOS Installation' : 'iOS 설치'}
            </h2>
          </div>
          
          <div className="space-y-5">
            <div className="flex items-start gap-4">
              <div className="bg-muted rounded-full p-2.5 mt-0.5">
                <Info className="h-5 w-5" />
              </div>
              <p className="text-lg">
                {language === 'en' 
                  ? 'Open this website in Safari browser' 
                  : 'Safari 브라우저에서 이 웹사이트를 열어주세요'}
              </p>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="bg-muted rounded-full p-2.5 mt-0.5">
                <ArrowDown className="h-5 w-5" />
              </div>
              <p className="text-lg">
                {language === 'en'
                  ? 'Tap the Share button (box with arrow) at the bottom of the screen'
                  : '화면 하단의 공유 버튼을 탭하세요 (화살표가 있는 상자)'}
              </p>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="bg-muted rounded-full p-2.5 mt-0.5">
                <CheckCircle className="h-5 w-5" />
              </div>
              <p className="text-lg">
                {language === 'en'
                  ? 'Select "Add to Home Screen" from the options'
                  : '옵션에서 "홈 화면에 추가"를 선택하세요'}
              </p>
            </div>
          </div>
        </Card>

        {/* Android Installation */}
        <Card className="p-8">
          <div className="flex items-center gap-3 mb-6">
            <Smartphone className="h-7 w-7" />
            <h2 className="text-2xl font-semibold">
              {language === 'en' ? 'Android Installation' : '안드로이드 설치'}
            </h2>
          </div>
          
          <div className="space-y-5">
            <div className="flex items-start gap-4">
              <div className="bg-muted rounded-full p-2.5 mt-0.5">
                <Info className="h-5 w-5" />
              </div>
              <p className="text-lg">
                {language === 'en'
                  ? 'Open this website in Chrome browser'
                  : 'Chrome 브라우저에서 이 웹사이트를 열어주세요'}
              </p>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="bg-muted rounded-full p-2.5 mt-0.5">
                <ArrowDown className="h-5 w-5" />
              </div>
              <p className="text-lg">
                {language === 'en'
                  ? 'Click on the Install option near the address bar'
                  : '주소 표시줄 근처의 설치 옵션을 클릭하세요'}
              </p>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="bg-muted rounded-full p-2.5 mt-0.5">
                <CheckCircle className="h-5 w-5" />
              </div>
              <p className="text-lg">
                {language === 'en'
                  ? 'Follow the installation prompts that appear and the app will be installed automatically'
                  : '표시되는 설치 메시지를 따르면 앱이 자동으로 설치됩니다'}
              </p>
            </div>

            <div className="mt-8 space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                {language === 'en'
                  ? "If you don't see the install option, click the button below:"
                  : "설치 옵션이 보이지 않는 경우 아래 버튼을 클릭하세요:"}
              </p>
              <div className="flex justify-center">
                <InstallPWA />
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default Help;