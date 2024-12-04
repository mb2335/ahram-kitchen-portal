import { Link } from "react-router-dom";
import { useSession, useSupabaseClient } from "@supabase/auth-helpers-react";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { ShoppingCart, History, LogOut, Store } from "lucide-react";
import { useToast } from "./ui/use-toast";
import { useEffect, useState } from "react";

export function Navigation() {
  const session = useSession();
  const supabase = useSupabaseClient();
  const { items } = useCart();
  const { toast } = useToast();
  const [isVendor, setIsVendor] = useState(false);
  const cartItemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  useEffect(() => {
    const checkVendorStatus = async () => {
      if (session?.user) {
        const { data: vendor } = await supabase
          .from('vendors')
          .select('id')
          .eq('user_id', session.user.id)
          .single();
        
        setIsVendor(!!vendor);
      }
    };

    checkVendorStatus();
  }, [session, supabase]);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Signed out successfully",
        description: "You have been signed out of your account.",
      });
    } catch (error) {
      console.error('Error signing out:', error);
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <nav className="bg-white shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="text-xl font-bold">
            Food Order
          </Link>

          <div className="flex items-center space-x-4">
            <Link to="/cart" className="relative">
              <Button variant="ghost" size="sm">
                <ShoppingCart className="h-4 w-4 mr-2" />
                Cart
                {cartItemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {cartItemCount}
                  </span>
                )}
              </Button>
            </Link>
            
            {session ? (
              <>
                <Link to="/orders">
                  <Button variant="ghost" size="sm">
                    <History className="h-4 w-4 mr-2" />
                    Orders
                  </Button>
                </Link>
                {isVendor && (
                  <Link to="/vendor/summary">
                    <Button variant="ghost" size="sm">
                      <Store className="h-4 w-4 mr-2" />
                      Vendor Dashboard
                    </Button>
                  </Link>
                )}
                <Button variant="ghost" size="sm" onClick={handleSignOut}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </>
            ) : (
              <Link to="/auth">
                <Button variant="default" size="sm">
                  Sign In
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}