
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export function MenuManagementHeader() {
  const [isDiscountDialogOpen, setIsDiscountDialogOpen] = useState(false);
  const [discountPercentage, setDiscountPercentage] = useState("");
  const [isApplying, setIsApplying] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleApplyDiscount = async () => {
    const discount = parseInt(discountPercentage);
    if (isNaN(discount) || discount < 0 || discount > 100) {
      toast({
        title: "Invalid discount",
        description: "Please enter a valid discount percentage between 0 and 100",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsApplying(true);
      
      const { error } = await supabase
        .from('menu_items')
        .update({ discount_percentage: discount })
        .not('is_available', 'is', false);

      if (error) throw error;

      // Invalidate all relevant queries to refresh data
      await queryClient.invalidateQueries({ queryKey: ['menu-items'] });
      
      toast({
        title: "Success",
        description: discount > 0 
          ? `Applied ${discount}% discount to all available menu items` 
          : "Removed discount from all menu items",
      });
      
      setIsDiscountDialogOpen(false);
      setDiscountPercentage("");
    } catch (error) {
      console.error('Error applying menu-wide discount:', error);
      toast({
        title: "Error",
        description: "Failed to apply menu-wide discount",
        variant: "destructive",
      });
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="flex justify-between items-center mb-6">
      <h2 className="text-2xl font-bold">Menu Management</h2>
      <div>
        <Button
          variant="outline"
          onClick={() => setIsDiscountDialogOpen(true)}
        >
          Apply Menu-wide Discount
        </Button>
      </div>

      <Dialog open={isDiscountDialogOpen} onOpenChange={setIsDiscountDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apply Menu-wide Discount</DialogTitle>
            <DialogDescription>
              Enter a discount percentage to apply to all available menu items. 
              This will override any existing individual discounts. 
              Enter 0 to remove all discounts.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Input
                type="number"
                min="0"
                max="100"
                placeholder="Enter discount percentage"
                value={discountPercentage}
                onChange={(e) => setDiscountPercentage(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDiscountDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleApplyDiscount} disabled={isApplying}>
              {isApplying ? "Applying..." : "Apply Discount"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
