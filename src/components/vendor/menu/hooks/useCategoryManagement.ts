
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { CategoryFormData, PickupDetail } from '../types/category';
import { useToast } from '@/hooks/use-toast';
import { supabase } from "@/integrations/supabase/client";

export function useCategoryManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<{ id: string, itemCount: number } | null>(null);
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    name_ko: '',
    has_custom_pickup: false,
    pickup_details: [],
    fulfillment_types: [],
    pickup_days: [],
    delivery_settings: {
      activated_slots: [],
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      name_ko: '',
      has_custom_pickup: false,
      pickup_details: [],
      fulfillment_types: [],
      pickup_days: [],
      delivery_settings: {
        activated_slots: [],
      },
    });
    setEditingCategory(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { data: vendorData } = await supabase
        .from('vendors')
        .select('id')
        .single();

      if (!vendorData) throw new Error('Vendor not found');

      const { data: maxOrderData } = await supabase
        .from('menu_categories')
        .select('order_index')
        .order('order_index', { ascending: false })
        .limit(1);

      const nextOrderIndex = maxOrderData && maxOrderData.length > 0 
        ? (maxOrderData[0].order_index + 1) 
        : 1;

      // Only include pickup details if pickup is a fulfillment type and custom pickup is enabled
      const pickupDetails = formData.fulfillment_types.includes('pickup') && formData.has_custom_pickup
        ? formData.pickup_details
        : [];

      // Convert PickupDetail objects to plain objects for Supabase
      const pickupDetailsForDb = pickupDetails.map(detail => ({
        day: detail.day,
        time: detail.time,
        location: detail.location
      }));

      // Don't include delivery_settings in the category data since it's not a column
      const categoryData = {
        name: formData.name,
        name_ko: formData.name_ko,
        vendor_id: vendorData.id,
        order_index: editingCategory ? editingCategory.order_index : nextOrderIndex,
        has_custom_pickup: formData.fulfillment_types.includes('pickup') && formData.has_custom_pickup,
        pickup_details: pickupDetailsForDb,
        fulfillment_types: formData.fulfillment_types,
        pickup_days: formData.pickup_days,
      };

      // First save the category data
      let categoryId: string;
      
      if (editingCategory) {
        const { error, data } = await supabase
          .from('menu_categories')
          .update(categoryData)
          .eq('id', editingCategory.id)
          .select('id')
          .single();

        if (error) throw error;
        categoryId = editingCategory.id;
      } else {
        const { error, data } = await supabase
          .from('menu_categories')
          .insert([categoryData])
          .select('id')
          .single();

        if (error) throw error;
        categoryId = data.id;
      }

      // If delivery is a fulfillment type, update or create delivery schedule
      if (formData.fulfillment_types.includes('delivery')) {
        // First, check if there's already a schedule for this category
        const { data: existingSchedules } = await supabase
          .from('delivery_schedules')
          .select('id, day_of_week')
          .eq('category_id', categoryId);
          
        // Create a map of existing schedules by day
        const existingSchedulesByDay = new Map();
        if (existingSchedules) {
          existingSchedules.forEach(schedule => {
            existingSchedulesByDay.set(schedule.day_of_week, schedule.id);
          });
        }
        
        // Create or update schedules for each day
        for (let day = 0; day < 7; day++) {
          const isPickupDay = formData.pickup_days.includes(day);
          const active = !isPickupDay; // Active for delivery if not a pickup day
          
          const scheduleData = {
            category_id: categoryId,
            day_of_week: day,
            active,
            activated_slots: formData.delivery_settings?.activated_slots || []
          };
          
          if (existingSchedulesByDay.has(day)) {
            // Update existing schedule
            await supabase
              .from('delivery_schedules')
              .update(scheduleData)
              .eq('id', existingSchedulesByDay.get(day));
          } else {
            // Create new schedule
            await supabase
              .from('delivery_schedules')
              .insert([scheduleData]);
          }
        }
      }

      toast({
        title: "Success",
        description: `Category ${editingCategory ? 'updated' : 'added'} successfully`,
      });

      setIsDialogOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['menu-categories'] });
    } catch (error) {
      console.error('Error saving category:', error);
      toast({
        title: "Error",
        description: "Failed to save category",
        variant: "destructive",
      });
    }
  };
  
  return {
    isDialogOpen,
    setIsDialogOpen,
    editingCategory,
    setEditingCategory,
    categoryToDelete,
    setCategoryToDelete,
    formData,
    setFormData,
    resetForm,
    handleSubmit,
  };
}
