
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
      // Validate item IDs
      const invalidItems = items.filter(item => 
        item.id && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(item.id)
      );
      
      if (invalidItems.length > 0) {
        throw new Error('Invalid menu item IDs detected');
      }

      // Extract all unique category IDs from items
      const itemCategoryIds = items
        .map(item => item.category_id)
        .filter(Boolean) as string[];
      
      const uniqueCategoryIds = [...new Set(itemCategoryIds)];
      
      // Get categories requiring delivery address
      const { data: categoriesData } = await supabase
        .from('menu_categories')
        .select('id, fulfillment_types')
        .in('id', uniqueCategoryIds);

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

      // Ensure we have proper Date objects for all delivery dates
      const sanitizedDeliveryDates: Record<string, Date> = {};
      
      for (const [categoryId, dateValue] of Object.entries(deliveryDates)) {
        if (!dateValue) continue;
        
        try {
          // Convert serialized date object to a proper Date object
          if (typeof dateValue === 'object' && dateValue !== null) {
            if ('_type' in dateValue && dateValue._type === 'Date') {
              // Handle the nested value structure from serialized date
              if ('value' in dateValue) {
                const valueObj = dateValue.value as Record<string, unknown>;
                
                if (valueObj && typeof valueObj === 'object' && 'iso' in valueObj && typeof valueObj.iso === 'string') {
                  sanitizedDeliveryDates[categoryId] = new Date(valueObj.iso);
                } else if (valueObj && typeof valueObj === 'object' && 'valueOf' in valueObj && typeof valueObj.valueOf === 'function') {
                  // Use valueOf method if available
                  sanitizedDeliveryDates[categoryId] = new Date(valueObj.valueOf() as number);
                } else if (valueObj && typeof valueObj === 'number') {
                  sanitizedDeliveryDates[categoryId] = new Date(valueObj);
                } else {
                  console.log("Complex date format - trying to convert:", valueObj);
                  // Last fallback, try to use the dateValue directly
                  sanitizedDeliveryDates[categoryId] = new Date();
                }
              } else if ('iso' in dateValue && typeof dateValue.iso === 'string') {
                sanitizedDeliveryDates[categoryId] = new Date(dateValue.iso);
              } else if (typeof dateValue.valueOf === 'function') {
                sanitizedDeliveryDates[categoryId] = new Date(dateValue.valueOf() as number);
              } else {
                console.log("Unusual date format:", dateValue);
                sanitizedDeliveryDates[categoryId] = new Date();
              }
            } else if (dateValue instanceof Date) {
              // For regular Date objects
              sanitizedDeliveryDates[categoryId] = dateValue;
            } else {
              // Try to convert unknown object to date
              console.log("Converting unknown object to date:", dateValue);
              
              // Use type assertion to help TypeScript understand we're checking properties
              const dateObj = dateValue as Record<string, unknown>;
              
              // Try various approaches to get a valid timestamp
              if ('timestamp' in dateObj && typeof dateObj.timestamp === 'number') {
                sanitizedDeliveryDates[categoryId] = new Date(dateObj.timestamp);
              } else if ('time' in dateObj && typeof dateObj.time === 'number') {
                sanitizedDeliveryDates[categoryId] = new Date(dateObj.time);
              } else if ('valueOf' in dateObj && typeof dateObj.valueOf === 'function') {
                sanitizedDeliveryDates[categoryId] = new Date(dateObj.valueOf() as number);
              } else if ('toISOString' in dateObj && typeof dateObj.toISOString === 'function') {
                sanitizedDeliveryDates[categoryId] = new Date(dateObj.toISOString() as string);
              } else {
                // Last resort - use current date as fallback
                console.warn(`Could not extract date from object for category ${categoryId}:`, dateObj);
                sanitizedDeliveryDates[categoryId] = new Date();
              }
            }
          } else if (typeof dateValue === 'string') {
            // For ISO string dates
            sanitizedDeliveryDates[categoryId] = new Date(dateValue);
          } else if (typeof dateValue === 'number') {
            // For timestamp dates
            sanitizedDeliveryDates[categoryId] = new Date(dateValue);
          } else {
            console.log(`Unhandled date type for ${categoryId}:`, typeof dateValue, dateValue);
            // Use current date as fallback
            sanitizedDeliveryDates[categoryId] = new Date();
          }
          
          // Verify the date is valid
          if (isNaN(sanitizedDeliveryDates[categoryId].getTime())) {
            console.error(`Generated an invalid date for category ${categoryId}:`, sanitizedDeliveryDates[categoryId]);
            // Use current date as fallback
            sanitizedDeliveryDates[categoryId] = new Date();
          }
        } catch (error) {
          console.error(`Error processing date for category ${categoryId}:`, error);
          console.error("Date value:", dateValue);
          // Don't throw here, we'll validate missing dates later
          sanitizedDeliveryDates[categoryId] = new Date(); // Fallback to current date
        }
      }

      // Add debug logging for date processing
      console.log("Sanitized delivery dates:", sanitizedDeliveryDates);
      console.log("Unique category IDs:", uniqueCategoryIds);
      for (const catId of uniqueCategoryIds) {
        console.log(`Category ${catId} date type:`, typeof sanitizedDeliveryDates[catId]);
        console.log(`Category ${catId} date value:`, sanitizedDeliveryDates[catId]);
        if (sanitizedDeliveryDates[catId] instanceof Date) {
          console.log(`Category ${catId} date constructor:`, sanitizedDeliveryDates[catId].constructor.name);
          console.log(`Category ${catId} valid Date:`, sanitizedDeliveryDates[catId].toISOString());
        } else {
          console.log(`Category ${catId} missing date`);
        }
      }

      // Validate we have dates for all categories in the cart
      const missingDates = uniqueCategoryIds.filter(categoryId => 
        !sanitizedDeliveryDates[categoryId]
      );
      
      if (missingDates.length > 0) {
        // Try to get category names
        const { data: categories } = await supabase
          .from('menu_categories')
          .select('id, name')
          .in('id', missingDates);
          
        const categoryNames = categories 
          ? categories.map(cat => cat.name).join(', ')
          : missingDates.join(', ');
          
        throw new Error(`Please select dates for all items in your order (Missing for: ${categoryNames})`);
      }

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
        Object.entries(sanitizedDeliveryDates).forEach(([categoryId, date]) => {
          if (!date) {
            throw new Error(`Missing delivery date for category ${categoryId}`);
          }
          
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
        // If no delivery dates are set, use today's date
        let orderDate;
        const firstCategoryId = Object.keys(sanitizedDeliveryDates)[0];
        
        if (firstCategoryId && sanitizedDeliveryDates[firstCategoryId]) {
          orderDate = sanitizedDeliveryDates[firstCategoryId];
        } else {
          // If no date is selected, use today
          orderDate = new Date();
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
        const [groupFulfillmentType, categoryId] = groupKey.split('-', 2);
        
        // Fix: Ensure we have a valid date for this category and cast it as a proper Date object
        let deliveryDate = sanitizedDeliveryDates[categoryId];
        
        if (!deliveryDate) {
          console.error(`Missing delivery date for category ${categoryId}`, sanitizedDeliveryDates);
          // Instead of throwing error, use current date as fallback
          deliveryDate = new Date();
        }
        
        // Ensure we actually have a Date object
        if (!(deliveryDate instanceof Date)) {
          console.error(`Invalid date object for category ${categoryId}:`, deliveryDate);
          deliveryDate = new Date();
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
          delivery_date: deliveryDate.toISOString(),  // Ensure it's an ISO string
          payment_proof_url: uploadData.path,
          pickup_time: needsCustomPickup ? pickupDetail?.time : null,
          pickup_location: needsCustomPickup ? pickupDetail?.location : null,
          fulfillment_type: groupFulfillmentType,
          delivery_address: groupFulfillmentType === FULFILLMENT_TYPE_DELIVERY ? customerData.address : null,
        };

        // Add debug logging
        console.log(`Creating order for category ${categoryId} with date:`, orderData.delivery_date);

        const { data: insertedOrder, error: orderError } = await supabase
          .from('orders')
          .insert([orderData])
          .select()
          .single();

        if (orderError) {
          console.error("Order insertion error:", orderError);
          throw orderError;
        }

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
