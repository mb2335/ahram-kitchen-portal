import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

interface Category {
  id: string;
  name: string;
  name_ko: string;
  order_index: number;
}

interface CategoryFormData {
  name: string;
  name_ko: string;
}

export function CategoryManagement() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    name_ko: '',
  });

  const { data: categories = [], isLoading, refetch } = useQuery({
    queryKey: ['menu-categories'],
    queryFn: async () => {
      // First get the vendor id
      const { data: vendorData, error: vendorError } = await supabase
        .from('vendors')
        .select('id')
        .single();

      if (vendorError) {
        console.error('Error fetching vendor:', vendorError);
        throw vendorError;
      }

      const { data, error } = await supabase
        .from('menu_categories')
        .select('*')
        .eq('vendor_id', vendorData.id)
        .order('order_index');
      
      if (error) throw error;
      return data;
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // First get the vendor id
      const { data: vendorData, error: vendorError } = await supabase
        .from('vendors')
        .select('id')
        .single();

      if (vendorError) throw vendorError;

      const { error } = await supabase
        .from('menu_categories')
        .insert([
          {
            name: formData.name,
            name_ko: formData.name_ko,
            vendor_id: vendorData.id,
            order_index: (categories?.length || 0) + 1,
          },
        ]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Category added successfully",
      });

      setIsDialogOpen(false);
      setFormData({ name: '', name_ko: '' });
      refetch();
    } catch (error) {
      console.error('Error adding category:', error);
      toast({
        title: "Error",
        description: "Failed to add category",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Categories</h3>
        <Button onClick={() => setIsDialogOpen(true)}>
          Add Category
        </Button>
      </div>

      <div className="space-y-2">
        {categories.map((category) => (
          <div
            key={category.id}
            className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm"
          >
            <div>
              <p className="font-medium">{category.name}</p>
              <p className="text-sm text-gray-600">{category.name_ko}</p>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Category</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name (English)</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Name (Korean)</label>
              <Input
                value={formData.name_ko}
                onChange={(e) => setFormData({ ...formData, name_ko: e.target.value })}
                required
              />
            </div>
            <Button type="submit" className="w-full">
              Add Category
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}