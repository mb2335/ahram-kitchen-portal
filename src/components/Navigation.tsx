import { Link } from "react-router-dom";
import { useAuthStatus } from "@/hooks/useAuthStatus";
import { LanguageToggle } from "./navigation/LanguageToggle";
import { NavigationItems } from "./navigation/NavigationItems";
import { MobileNavigation } from "./navigation/MobileNavigation";
import { DesktopNavigation } from "./navigation/DesktopNavigation";

export function Navigation() {
  const { session, isVendor, handleSignOut } = useAuthStatus();

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <Link to="/" className="text-xl font-bold text-primary hover:text-primary/90 transition-colors">
              Ahram Kitchen
            </Link>
            <div className="hidden sm:block">
              <LanguageToggle />
            </div>
          </div>

          <DesktopNavigation 
            isVendor={isVendor}
            session={session}
            handleSignOut={handleSignOut}
          />
          
          <MobileNavigation 
            isVendor={isVendor}
            session={session}
            handleSignOut={handleSignOut}
          />
        </div>
      </div>
    </nav>
  );
}