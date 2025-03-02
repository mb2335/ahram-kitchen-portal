
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '@supabase/auth-helpers-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { OrderSubmissionProps, FULFILLMENT_TYPE_DELIVERY, FULFILLMENT_TYPE_PICKUP } from '@/types/order';
import { getOrCreateCustomer } from '@/utils/customerManagement';
import { updateMenuItemQuantities } from '@/utils/menuItemQuantityManagement';

export function useOrderSubmission() {
  const session = useSession();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isUploading, setIsUploading] = useState(false);

  const submitOrder = async ({
    items,
    total,
    taxAmount,
    notes,
    deliveryDates,
    customerData,
    pickupDetail,
    fulfillmentType,
    categoryFulfillmentTypes = {},
    onOrderSuccess
  }: OrderSubmissionProps, paymentProof: File) => {
    setIsUploading(true);

    try {
      const invalidItems = items.filter(item => 
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(item.id)
      );
      
      if (invalidItems.length > 0) {
        throw new Error('Invalid menu item IDs detected');
      }

      // Validate delivery address for delivery orders
      const hasDeliveryItems = Object.values(categoryFulfillmentTypes).includes(FULFILLMENT_TYPE_DELIVERY) || 
        (fulfillmentType === FULFILLMENT_TYPE_DELIVERY && Object.keys(categoryFulfillmentTypes).length === 0);
        
      if (hasDeliveryItems && !customerData.address) {
        throw new Error('Delivery address is required for delivery orders');
      }

      const customerId = await getOrCreateCustomer(customerData, session?.user?.id);

      const fileExt = paymentProof.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;

      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('payment_proofs')
        .upload(fileName, paymentProof, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get all categories and their pickup days
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('menu_categories')
        .select('id, pickup_days');
      
      if (categoriesError) throw categoriesError;
      
      // Create a map of category IDs to their pickup days
      const categoryPickupDays = new Map();
      if (categoriesData) {
        categoriesData.forEach(category => {
          if (category && category.id && category.pickup_days) {
            categoryPickupDays.set(category.id, new Set(category.pickup_days));
          }
        });
      }

      // Validate each date against fulfillment type and pickup days
      Object.entries(deliveryDates).forEach(([categoryId, date]) => {
        const dayOfWeek = date.getDay(); // 0=Sunday, 1=Monday, etc.
        const pickupDays = categoryPickupDays.get(categoryId);
        
        if (!pickupDays) return; // Skip if category not found
        
        const isPickupDay = pickupDays.has(dayOfWeek);
        const categoryFulfillment = categoryFulfillmentTypes[categoryId] || fulfillmentType;
        
        if (categoryFulfillment === FULFILLMENT_TYPE_PICKUP && !isPickupDay) {
          throw new Error(`Pickup is only available on designated pickup days for ${categoryId}`);
        }
        
        if (categoryFulfillment === FULFILLMENT_TYPE_DELIVERY && isPickupDay) {
          throw new Error(`Delivery is not available on pickup days for ${categoryId}`);
        }
      });

      // Group items by category and fulfillment type
      const groupedItems: Record<string, typeof items> = {};
      
      items.forEach(item => {
        if (!item.category_id) return;
        
        const categoryFulfillment = categoryFulfillmentTypes[item.category_id] || fulfillmentType;
        const groupKey = `${categoryFulfillment}-${item.category_id}`;
        
        if (!groupedItems[groupKey]) {
          groupedItems[groupKey] = [];
        }
        
        groupedItems[groupKey].push(item);
      });

      // Create orders for each group
      const orderPromises = Object.entries(groupedItems).map(async ([groupKey, groupItems]) => {
        const [groupFulfillmentType, categoryId] = groupKey.split('-', 2);
        const deliveryDate = deliveryDates[categoryId];
        
        if (!deliveryDate) {
          throw new Error(`Missing delivery date for category ${categoryId}`);
        }
        
        const groupTotal = groupItems.reduce((sum, item) => {
          const originalPrice = item.price * item.quantity;
          const discountAmount = item.discount_percentage 
            ? (originalPrice * (item.discount_percentage / 100))
            : 0;
          return sum + (originalPrice - discountAmount);
        }, 0);
        
        const groupTaxAmount = groupTotal * (taxAmount / total);

        const { data: categoryData, error: categoryError } = await supabase
          .from('menu_categories')
          .select('*')
          .eq('id', categoryId)
          .single();

        if (categoryError) throw categoryError;

        const category = categoryData;
        const needsCustomPickup = groupFulfillmentType === FULFILLMENT_TYPE_PICKUP && (category?.has_custom_pickup ?? false);

        const orderData = {
          customer_id: customerId,
          total_amount: groupTotal + groupTaxAmount,
          tax_amount: groupTaxAmount,
          notes: notes,
          status: 'pending',
          delivery_date: deliveryDate.toISOString(),
          payment_proof_url: uploadData.path,
          pickup_time: needsCustomPickup ? pickupDetail?.time : null,
          pickup_location: needsCustomPickup ? pickupDetail?.location : null,
          fulfillment_type: groupFulfillmentType,
          delivery_address: groupFulfillmentType === FULFILLMENT_TYPE_DELIVERY ? customerData.address : null,
        };

        const { data: insertedOrder, error: orderError } = await supabase
          .from('orders')
          .insert([orderData])
          .select()
          .single();

        if (orderError) throw orderError;

        const orderItems = groupItems.map((item) => {
          const unitPrice = item.price * (1 - (item.discount_percentage || 0) / 100);
          return {
            order_id: insertedOrder.id,
            menu_item_id: item.id,
            quantity: item.quantity,
            unit_price: unitPrice,
          };
        });

        const { error: orderItemsError } = await supabase
          .from('order_items')
          .insert(orderItems);

        if (orderItemsError) throw orderItemsError;

        return insertedOrder;
      });

      const orders = await Promise.all(orderPromises);
      const validOrders = orders.filter(Boolean);

      if (validOrders.length === 0) {
        throw new Error('No valid orders could be created');
      }

      await updateMenuItemQuantities(items);
      onOrderSuccess(validOrders[0].id);

      const firstOrder = validOrders[0];
      
      navigate('/thank-you', {
        state: {
          orderDetails: {
            id: firstOrder.id,
            items: items.map(item => ({
              name: item.name,
              nameKo: item.nameKo,
              quantity: item.quantity,
              price: item.price,
              discount_percentage: item.discount_percentage
            })),
            total: total + taxAmount,
            taxAmount: taxAmount,
            createdAt: firstOrder.created_at,
            pickupTime: firstOrder.pickup_time,
            pickupLocation: firstOrder.pickup_location,
            fulfillmentType: fulfillmentType,
            deliveryAddress: firstOrder.delivery_address,
            relatedOrderIds: validOrders.length > 1 ? validOrders.slice(1).map(o => o.id) : []
          }
        },
        replace: true
      });

    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit order',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  return {
    submitOrder,
    isUploading
  };
}
