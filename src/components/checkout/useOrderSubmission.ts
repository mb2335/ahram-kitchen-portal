
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '@supabase/auth-helpers-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { OrderSubmissionProps, FULFILLMENT_TYPE_DELIVERY, FULFILLMENT_TYPE_PICKUP } from '@/types/order';
import { getOrCreateCustomer } from '@/utils/customerManagement';
import { updateMenuItemQuantities } from '@/utils/menuItemQuantityManagement';

// Define types for our possible date formats
interface DateWithIso {
  iso: string;
  [key: string]: any;
}

interface DateWithNestedIso {
  value: {
    iso: string;
    [key: string]: any;
  };
  [key: string]: any;
}

type SerializedDateObject = Date | DateWithIso | DateWithNestedIso | any;

export function useOrderSubmission() {
  const session = useSession();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isUploading, setIsUploading] = useState(false);

  /**
   * Safely converts various date formats to a Date object
   */
  const safelyParseDate = (rawDate: any, categoryId: string): Date => {
    let dateObj: Date;
    
    if (rawDate instanceof Date) {
      return rawDate;
    } else if (typeof rawDate === 'string') {
      return new Date(rawDate);
    } else if (rawDate && typeof rawDate === 'object') {
      // Try different known date serialization formats
      try {
        if (rawDate.toISOString && typeof rawDate.toISOString === 'function') {
          return new Date(rawDate.toISOString());
        } else if (rawDate.iso && typeof rawDate.iso === 'string') {
          return new Date(rawDate.iso);
        } else if (
          rawDate.value && 
          typeof rawDate.value === 'object' && 
          rawDate.value.iso && 
          typeof rawDate.value.iso === 'string'
        ) {
          return new Date(rawDate.value.iso);
        } else {
          // Last resort - convert to string
          console.warn(`Using fallback date conversion for ${categoryId}:`, rawDate);
          return new Date(String(rawDate));
        }
      } catch (err) {
        console.error(`Error parsing date for category ${categoryId}:`, err);
        throw new Error(`Invalid date format for ${categoryId}`);
      }
    }
    
    // If we get here, we couldn't parse the date
    console.error(`Couldn't parse date for category ${categoryId}:`, rawDate);
    throw new Error(`Couldn't parse date for ${categoryId}`);
  };

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
      // Validate item IDs
      const invalidItems = items.filter(item => 
        item.id && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(item.id)
      );
      
      if (invalidItems.length > 0) {
        throw new Error('Invalid menu item IDs detected');
      }

      // Get all unique category IDs from items
      const itemCategoryIds = items
        .map(item => item.category_id)
        .filter(Boolean) as string[];
      
      const uniqueCategoryIds = [...new Set(itemCategoryIds)];
      
      console.log("All unique category IDs from cart items:", uniqueCategoryIds);
      
      // Get categories requiring delivery address
      const { data: categoriesData } = await supabase
        .from('menu_categories')
        .select('id, fulfillment_types')
        .in('id', uniqueCategoryIds);

      console.log("Categories data from database:", categoriesData);

      // Create a map of which categories require delivery
      const requiresDeliveryMap = new Map<string, boolean>();
      
      if (categoriesData) {
        categoriesData.forEach(category => {
          // Check if this category is being delivered (either by global setting or category-specific)
          const categoryFulfillment = categoryFulfillmentTypes[category.id] || fulfillmentType;
          
          // If category only supports pickup, never require delivery address
          if (category.fulfillment_types.length === 1 && 
              category.fulfillment_types[0] === FULFILLMENT_TYPE_PICKUP) {
            requiresDeliveryMap.set(category.id, false);
          } else {
            requiresDeliveryMap.set(category.id, categoryFulfillment === FULFILLMENT_TYPE_DELIVERY);
          }
        });
      }

      // Check if ANY categories require delivery address
      const hasDeliveryItems = Array.from(requiresDeliveryMap.values()).some(Boolean);
      
      // Validate customer data
      if (!customerData.fullName || !customerData.email) {
        throw new Error('Please provide your full name and email address');
      }

      // Validate delivery address ONLY if we have delivery items
      if (hasDeliveryItems && !customerData.address) {
        throw new Error('Delivery address is required for delivery orders');
      }

      // Process and validate delivery dates
      const processedDates: Record<string, Date> = {};
      
      console.log("Processing delivery dates:", deliveryDates);
      console.log("Unique category IDs:", uniqueCategoryIds);
      
      // Ensure we have a date for each category and convert any serialized dates to Date objects
      for (const categoryId of uniqueCategoryIds) {
        if (!deliveryDates[categoryId]) {
          console.error(`Missing delivery date for category ${categoryId}`);
          const { data: categoryData } = await supabase
            .from('menu_categories')
            .select('name')
            .eq('id', categoryId)
            .single();
          
          throw new Error(`Please select a date for ${categoryData?.name || 'items in your order'}`);
        }
        
        try {
          // Use our safe date parser
          const dateObj = safelyParseDate(deliveryDates[categoryId], categoryId);
          
          // Validate the date
          if (isNaN(dateObj.getTime())) {
            console.error(`Invalid date for category ${categoryId}:`, dateObj);
            throw new Error(`Please select a valid date for all items in your order`);
          }
          
          console.log(`Processed date for category ${categoryId}:`, dateObj.toISOString());
          processedDates[categoryId] = dateObj;
        } catch (error) {
          console.error(`Error processing date for category ${categoryId}:`, error);
          throw new Error(`Please select a valid date for all items in your order`);
        }
      }
      
      console.log("Sanitized delivery dates:", processedDates);

      // Get customer ID or create a new customer
      const customerId = await getOrCreateCustomer(customerData, session?.user?.id);

      // Upload payment proof
      const fileExt = paymentProof.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;

      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('payment_proofs')
        .upload(fileName, paymentProof, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      if (!uploadData?.path) {
        throw new Error('Failed to upload payment proof');
      }

      // Get all categories and their pickup days
      const { data: categories, error: categoriesError } = await supabase
        .from('menu_categories')
        .select('id, pickup_days, has_custom_pickup, fulfillment_types');
      
      if (categoriesError) throw categoriesError;
      
      // Create a map of category IDs to their pickup days
      const categoryPickupDays = new Map();
      const categoryCustomPickup = new Map();
      const categoryFulfillmentOptionsMap = new Map();
      
      if (categories) {
        categories.forEach(category => {
          if (category && category.id) {
            if (category.pickup_days) {
              categoryPickupDays.set(category.id, new Set(category.pickup_days));
            }
            categoryCustomPickup.set(category.id, category.has_custom_pickup);
            categoryFulfillmentOptionsMap.set(category.id, category.fulfillment_types || []);
          }
        });
      }

      // Identify pickup-only categories
      const pickupOnlyCategories = new Set<string>();
      
      for (const categoryId of uniqueCategoryIds) {
        const fulfillmentOptions = categoryFulfillmentOptionsMap.get(categoryId) || [];
        if (fulfillmentOptions.length === 1 && fulfillmentOptions[0] === FULFILLMENT_TYPE_PICKUP) {
          pickupOnlyCategories.add(categoryId);
        }
      }

      // For all-pickup orders with the same pickup time/location, ensure we check dates correctly
      const isAllPickup = uniqueCategoryIds.every(categoryId => {
        // Categories that only support pickup are always pickup
        if (pickupOnlyCategories.has(categoryId)) return true;
        
        // Otherwise, check the selected fulfillment type
        const categoryFulfillment = categoryFulfillmentTypes[categoryId] || fulfillmentType;
        return categoryFulfillment === FULFILLMENT_TYPE_PICKUP;
      });

      // Check if custom pickup is required for pickup items
      const needsCustomPickup = uniqueCategoryIds.some(categoryId => {
        // Skip categories not being picked up
        const categoryFulfillment = pickupOnlyCategories.has(categoryId) ? 
          FULFILLMENT_TYPE_PICKUP : 
          (categoryFulfillmentTypes[categoryId] || fulfillmentType);
          
        if (categoryFulfillment !== FULFILLMENT_TYPE_PICKUP) return false;
        
        // Check if this category requires custom pickup
        return categoryCustomPickup.get(categoryId);
      });
      
      // If pickup needs custom pickup details but none provided
      if (needsCustomPickup && !pickupDetail) {
        throw new Error('Please select pickup time and location');
      }

      // Skip date validation for pickup orders or if specific categories have pickup fulfillment type
      if (!isAllPickup) {
        // Validate each date against fulfillment type and pickup days
        Object.entries(processedDates).forEach(([categoryId, date]) => {
          // Skip if not a real category ID from our items
          if (!uniqueCategoryIds.includes(categoryId)) return;
          
          const dayOfWeek = date.getDay(); // 0=Sunday, 1=Monday, etc.
          const pickupDays = categoryPickupDays.get(categoryId);
          
          if (!pickupDays || pickupDays.size === 0) return; // Skip if category not found or no pickup days
          
          const isPickupDay = pickupDays.has(dayOfWeek);
          const categoryFulfillment = categoryFulfillmentTypes[categoryId] || fulfillmentType;
          
          if (categoryFulfillment === FULFILLMENT_TYPE_PICKUP && !isPickupDay) {
            throw new Error(`Pickup is only available on designated pickup days for ${categoryId}`);
          }
          
          if (categoryFulfillment === FULFILLMENT_TYPE_DELIVERY && isPickupDay) {
            throw new Error(`Delivery is not available on pickup days for ${categoryId}`);
          }
        });
      }

      // Group items by category and fulfillment type
      const groupedItems: Record<string, typeof items> = {};
      
      items.forEach(item => {
        if (!item.category_id) return;
        
        // Handle pickup-only categories
        let categoryFulfillment = categoryFulfillmentTypes[item.category_id] || fulfillmentType;
        
        // Override for pickup-only categories
        if (pickupOnlyCategories.has(item.category_id)) {
          categoryFulfillment = FULFILLMENT_TYPE_PICKUP;
        }
        
        const groupKey = `${categoryFulfillment}-${item.category_id}`;
        
        if (!groupedItems[groupKey]) {
          groupedItems[groupKey] = [];
        }
        
        groupedItems[groupKey].push(item);
      });

      // For all-pickup orders with the same pickup time, merge into a single order
      if (isAllPickup && pickupDetail) {
        // Calculate total for all items
        const orderTotal = items.reduce((sum, item) => {
          const originalPrice = item.price * item.quantity;
          const discountAmount = item.discount_percentage 
            ? (originalPrice * (item.discount_percentage / 100))
            : 0;
          return sum + (originalPrice - discountAmount);
        }, 0);
        
        // Use the first category's delivery date for the combined order
        const firstCategoryId = uniqueCategoryIds[0];
        const orderDate = processedDates[firstCategoryId];
        
        // Validate that we have a date
        if (!orderDate || !(orderDate instanceof Date)) {
          throw new Error('Please select a valid date for your order');
        }

        const orderData = {
          customer_id: customerId,
          total_amount: orderTotal + taxAmount,
          tax_amount: taxAmount,
          notes: notes,
          status: 'pending',
          delivery_date: orderDate.toISOString(),
          payment_proof_url: uploadData.path,
          pickup_time: pickupDetail.time,
          pickup_location: pickupDetail.location,
          fulfillment_type: FULFILLMENT_TYPE_PICKUP,
          delivery_address: null,
        };

        const { data: insertedOrder, error: orderError } = await supabase
          .from('orders')
          .insert([orderData])
          .select()
          .single();

        if (orderError) throw orderError;

        if (!insertedOrder) {
          throw new Error('Failed to create order');
        }

        const orderItems = items.map((item) => {
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

        await updateMenuItemQuantities(items);
        onOrderSuccess(insertedOrder.id);

        navigate('/thank-you', {
          state: {
            orderDetails: {
              id: insertedOrder.id,
              items: items.map(item => ({
                name: item.name,
                nameKo: item.nameKo,
                quantity: item.quantity,
                price: item.price,
                discount_percentage: item.discount_percentage
              })),
              total: orderTotal + taxAmount,
              taxAmount: taxAmount,
              createdAt: insertedOrder.created_at,
              pickupTime: insertedOrder.pickup_time,
              pickupLocation: insertedOrder.pickup_location,
              fulfillmentType: FULFILLMENT_TYPE_PICKUP,
              deliveryAddress: null,
              relatedOrderIds: []
            }
          },
          replace: true
        });
        
        return;
      }

      // Create orders for each group (handles mixed fulfillment types)
      const orderPromises = Object.entries(groupedItems).map(async ([groupKey, groupItems]) => {
        const [groupFulfillmentType, groupCategoryId] = groupKey.split('-', 2);
        
        if (!groupCategoryId) {
          console.error("Invalid group key:", groupKey);
          throw new Error(`Invalid category grouping`);
        }
        
        // Find the delivery date for this category
        const deliveryDate = processedDates[groupCategoryId];
        
        // Debug the delivery date for troubleshooting
        console.log(`Processing category ${groupCategoryId} with date:`, deliveryDate);
        
        if (!deliveryDate || !(deliveryDate instanceof Date)) {
          console.error(`Missing or invalid delivery date for category ${groupCategoryId}`);
          throw new Error(`Please select a valid date for all items in your order`);
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
          .eq('id', groupCategoryId)
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

        if (!insertedOrder) {
          throw new Error('Failed to create order');
        }

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
      console.error('Order submission error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit order',
        variant: 'destructive',
      });
      throw error; // Re-throw to let the calling component handle it
    } finally {
      setIsUploading(false);
    }
  };

  return {
    submitOrder,
    isUploading
  };
}
