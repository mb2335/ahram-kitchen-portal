import { NavigationItems } from "./NavigationItems";

interface DesktopNavigationProps {
  isVendor: boolean;
  session: any;
  handleSignOut: () => Promise<void>;
}

export function DesktopNavigation({ isVendor, session, handleSignOut }: DesktopNavigationProps) {
  return (
    <div className="hidden sm:flex items-center space-x-1">
      <NavigationItems
        isVendor={isVendor}
        session={session}
        handleSignOut={handleSignOut}
      />
    </div>
  );
}