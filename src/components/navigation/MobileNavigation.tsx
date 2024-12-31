import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu as MenuIcon } from "lucide-react";
import { LanguageToggle } from "./LanguageToggle";
import { NavigationItems } from "./NavigationItems";

interface MobileNavigationProps {
  isVendor: boolean;
  session: any;
  handleSignOut: () => Promise<void>;
}

export function MobileNavigation({ isVendor, session, handleSignOut }: MobileNavigationProps) {
  return (
    <div className="sm:hidden">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="sm" className="flex items-center">
            <MenuIcon className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[80%] sm:w-[385px]">
          <div className="flex flex-col space-y-4 mt-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-lg font-semibold">Menu</span>
              <LanguageToggle />
            </div>
            
            <NavigationItems
              isVendor={isVendor}
              session={session}
              handleSignOut={handleSignOut}
              isMobile={true}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}