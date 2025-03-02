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

      // Mapping function to handle different ID formats and partial matches
      const findMatchingCategoryId = (categoryIdInput: string): string | null => {
        // For exact match
        if (uniqueCategoryIds.includes(categoryIdInput)) {
          return categoryIdInput;
        }
        
        // If the input is a prefix of any categoryId or vice versa
        for (const fullId of uniqueCategoryIds) {
          if (fullId.startsWith(categoryIdInput) || categoryIdInput.startsWith(fullId)) {
            console.log(`Found match: ${categoryIdInput} matches with ${fullId}`);
            return fullId;
          }
        }
        return null;
      };

      // Process all date entries, attempting to match with valid category IDs
      for (const [categoryIdKey, dateValue] of Object.entries(deliveryDates)) {
        if (!dateValue) continue;
        
        // Find matching full category ID
        const matchedCategoryId = findMatchingCategoryId(categoryIdKey);
        
        if (matchedCategoryId) {
          console.log(`Matched key ${categoryIdKey} to category ID ${matchedCategoryId}`);
          
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
                } else if (typeof dateObj.value === 'object' && dateObj.value.iso) {
                  finalDate = new Date(dateObj.value.iso);
                } else {
                  console.warn(`Could not extract date from object for category ${matchedCategoryId}:`, dateObj);
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
                console.warn(`Could not extract date from object for category ${matchedCategoryId}:`, dateObj);
                finalDate = new Date();
              }
            } else {
              console.warn(`Unhandled date type for ${matchedCategoryId}:`, typeof dateValue, dateValue);
              finalDate = new Date();
            }
            
            // Verify the date is valid
            if (isNaN(finalDate.getTime())) {
              console.error(`Generated an invalid date for category ${matchedCategoryId}:`, finalDate);
              finalDate = new Date(); // Use current date as fallback
            }
            
            // Store date for the matched category ID
            sanitizedDeliveryDates[matchedCategoryId] = finalDate;
            
            console.log(`Processed date for category ${matchedCategoryId}:`, sanitizedDeliveryDates[matchedCategoryId].toISOString());
          } catch (error) {
            console.error(`Error processing date for category ${matchedCategoryId}:`, error);
            console.error("Date value:", dateValue);
            // Fallback to current date
            sanitizedDeliveryDates[matchedCategoryId] = new Date();
          }
        } else {
          console.warn(`No matching category ID found for key ${categoryIdKey}`);
        }
      }

      // Debug log for sanitized dates
      console.log("Sanitized delivery dates:", sanitizedDeliveryDates);
      
      // Add additional safety - ensure all category IDs have dates
      for (const categoryId of uniqueCategoryIds) {
        if (!sanitizedDeliveryDates[categoryId]) {
          console.log(`No date found for category ${categoryId}, setting to current date`);
          sanitizedDeliveryDates[categoryId] = new Date();
        }
      }

      // Final validation - ensure we have dates for all categories
      // This check should now always pass due to the previous safety code
      const missingDates = uniqueCategoryIds.filter(categoryId => !sanitizedDeliveryDates[categoryId]);
      
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
        // Use the findMatchingCategoryId function to ensure we get the correct match
        const matchedCategoryId = findMatchingCategoryId(groupCategoryId);
        
        if (!matchedCategoryId || !sanitizedDeliveryDates[matchedCategoryId]) {
          throw new Error(`Please ensure all items have delivery dates selected`);
        }
        
        const deliveryDate = sanitizedDeliveryDates[matchedCategoryId];
        
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
