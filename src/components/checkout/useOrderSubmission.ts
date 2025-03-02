
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

      // Ensure we have proper Date objects for all delivery dates
      const sanitizedDeliveryDates: Record<string, Date> = {};
      
      // Debug log for deliveryDates
      console.log("Processing delivery dates:", deliveryDates);
      console.log("Unique category IDs:", uniqueCategoryIds);

      // Add more detailed logging about each categoryId
      uniqueCategoryIds.forEach(categoryId => {
        const fullCategoryId = categoryId;
        console.log(`Checking date for category ID: ${fullCategoryId}`);
        console.log(`Short category ID (first 8 chars): ${fullCategoryId.split('-')[0]}`);
        
        // Check if we have a date for this specific categoryId using both full id and short id
        const hasFullId = deliveryDates.hasOwnProperty(fullCategoryId);
        
        console.log(`Has date for full category ID ${fullCategoryId}: ${hasFullId}`);
        
        if (!hasFullId) {
          // Look for any keys that match the start of this ID (in case of truncation)
          const matchingKey = Object.keys(deliveryDates).find(key => 
            fullCategoryId.startsWith(key) || key.startsWith(fullCategoryId)
          );
          
          if (matchingKey) {
            console.log(`Found matching key ${matchingKey} for category ${fullCategoryId}`);
          } else {
            console.log(`No matching key found for category ${fullCategoryId}`);
          }
        }
      });

      for (const [categoryIdKey, dateValue] of Object.entries(deliveryDates)) {
        if (!dateValue) continue;
        
        // Try to match full ID or partial ID
        const matchedCategoryId = uniqueCategoryIds.find(id => 
          id === categoryIdKey || // exact match
          id.startsWith(categoryIdKey) || // partial match - beginning
          categoryIdKey.startsWith(id) || // partial match - beginning (reverse)
          id.includes(categoryIdKey) || // contains
          categoryIdKey.includes(id) // contains (reverse)
        );
        
        if (matchedCategoryId) {
          console.log(`Found matching category ID ${matchedCategoryId} for key ${categoryIdKey}`);
        } else {
          console.log(`No matching category ID found for key ${categoryIdKey}`);
        }
        
        const categoryId = matchedCategoryId || categoryIdKey;
        
        try {
          let finalDate: Date;
          
          // Handle different date formats
          if (dateValue instanceof Date) {
            finalDate = dateValue;
          } else if (typeof dateValue === 'string') {
            finalDate = new Date(dateValue);
          } else if (typeof dateValue === 'number') {
            finalDate = new Date(dateValue);
          } else if (typeof dateValue === 'object') {
            // Try to extract date from complex object
            const dateObj = dateValue as any;
            
            if (dateObj._type === 'Date' && dateObj.value) {
              if (typeof dateObj.value === 'string') {
                finalDate = new Date(dateObj.value);
              } else if (typeof dateObj.value === 'number') {
                finalDate = new Date(dateObj.value);
              } else if (typeof dateObj.value === 'object') {
                if (dateObj.value.iso) {
                  finalDate = new Date(dateObj.value.iso);
                } else if (dateObj.value.value) {
                  finalDate = new Date(dateObj.value.value);
                } else {
                  // Fallback to current date
                  console.warn(`Could not extract date from object for category ${categoryId}:`, dateObj);
                  finalDate = new Date();
                }
              } else {
                finalDate = new Date();
              }
            } else if (dateObj.iso) {
              finalDate = new Date(dateObj.iso);
            } else if (dateObj.timestamp) {
              finalDate = new Date(dateObj.timestamp);
            } else if (dateObj.time) {
              finalDate = new Date(dateObj.time);
            } else if (dateObj.valueOf && typeof dateObj.valueOf === 'function') {
              finalDate = new Date(dateObj.valueOf());
            } else if (dateObj.toISOString && typeof dateObj.toISOString === 'function') {
              finalDate = new Date(dateObj.toISOString());
            } else {
              // Last resort - use current date as fallback
              console.warn(`Could not extract date from object for category ${categoryId}:`, dateObj);
              finalDate = new Date();
            }
          } else {
            // Default to current date if all else fails
            console.warn(`Unhandled date type for ${categoryId}:`, typeof dateValue, dateValue);
            finalDate = new Date();
          }
          
          // Verify the date is valid
          if (isNaN(finalDate.getTime())) {
            console.error(`Generated an invalid date for category ${categoryId}:`, finalDate);
            finalDate = new Date(); // Use current date as fallback
          }
          
          // Store date for both the original key and possibly matched category ID
          sanitizedDeliveryDates[categoryId] = finalDate;
          
          // Also store with the original key if different
          if (categoryId !== categoryIdKey) {
            sanitizedDeliveryDates[categoryIdKey] = finalDate;
          }
          
          console.log(`Processed date for category ${categoryId}:`, sanitizedDeliveryDates[categoryId].toISOString());
        } catch (error) {
          console.error(`Error processing date for category ${categoryId}:`, error);
          console.error("Date value:", dateValue);
          // Fallback to current date
          sanitizedDeliveryDates[categoryId] = new Date();
        }
      }

      // Debug log for sanitized dates
      console.log("Sanitized delivery dates:", sanitizedDeliveryDates);
      
      // Cross-check and ensure all unique category IDs have dates
      for (const categoryId of uniqueCategoryIds) {
        if (!sanitizedDeliveryDates[categoryId]) {
          // Try a fallback approach - see if there's a partial match we can use
          const possibleMatchKey = Object.keys(sanitizedDeliveryDates).find(key => 
            categoryId.includes(key) || key.includes(categoryId)
          );
          
          if (possibleMatchKey) {
            console.log(`Using ${possibleMatchKey} as fallback for missing date for ${categoryId}`);
            sanitizedDeliveryDates[categoryId] = sanitizedDeliveryDates[possibleMatchKey];
          } else {
            console.log(`No fallback found for missing date for category ${categoryId}, using current date`);
            sanitizedDeliveryDates[categoryId] = new Date();
          }
        }
      }
      
      // Final validation - ensure we have dates for all categories
      const missingDates = uniqueCategoryIds.filter(categoryId => {
        if (!sanitizedDeliveryDates[categoryId]) {
          console.warn(`Still missing date for category ${categoryId} after all processing`);
          return true;
        }
        return false;
      });
      
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

      // Console logs for debugging
      console.log("Final sanitized delivery dates:", sanitizedDeliveryDates);
      console.log("Unique category IDs:", uniqueCategoryIds);
      for (const catId of uniqueCategoryIds) {
        if (sanitizedDeliveryDates[catId]) {
          console.log(`Category ${catId} date:`, sanitizedDeliveryDates[catId].toISOString());
        } else {
          console.warn(`No date for category ${catId}`);
        }
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
          // Skip if not a real category ID from our items
          if (!uniqueCategoryIds.includes(categoryId)) return;
          
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
        const firstCategoryId = uniqueCategoryIds[0];
        
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
        const [groupFulfillmentType, groupCategoryId] = groupKey.split('-', 2);
        
        if (!groupCategoryId) {
          console.error("Invalid group key:", groupKey);
          throw new Error(`Invalid category grouping`);
        }
        
        // Find the delivery date for this category
        const deliveryDate = sanitizedDeliveryDates[groupCategoryId];
        
        if (!deliveryDate) {
          console.error(`Missing delivery date for category ${groupCategoryId.substring(0, 8)}`, sanitizedDeliveryDates);
          
          // Check if we can find a partial match (in case of ID truncation)
          const partialMatch = Object.keys(sanitizedDeliveryDates).find(key => 
            key.includes(groupCategoryId) || groupCategoryId.includes(key)
          );
          
          if (partialMatch) {
            console.log(`Found partial match ${partialMatch} for category ${groupCategoryId}`);
            throw new Error(`Please ensure all items have delivery dates selected`);
          } else {
            throw new Error(`Missing delivery date for category ${groupCategoryId.substring(0, 8)}`);
          }
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
