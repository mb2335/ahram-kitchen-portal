import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { WifiOff } from "lucide-react";

export function OfflineAlert() {
  return (
    <Alert variant="destructive" className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50">
      <WifiOff className="h-4 w-4" />
      <AlertTitle>You're offline</AlertTitle>
      <AlertDescription>
        Please check your internet connection. This app requires an internet connection to function.
      </AlertDescription>
    </Alert>
  );
}