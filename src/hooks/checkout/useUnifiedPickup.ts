
import { useMemo } from 'react';
import { PickupDetail } from '@/types/pickup';
import { FULFILLMENT_TYPE_PICKUP } from '@/types/order';

interface Category {
  id: string;
  name: string;
  name_ko: string;
  has_custom_pickup: boolean | null;
  pickup_details: any[];
  pickup_days: number[] | null;
  fulfillment_types: string[] | null;
}

export function useUnifiedPickup(
  categories: Category[],
  categoryFulfillmentTypes: Record<string, string>,
  itemsByCategory: Record<string, any[]>
) {
  return useMemo(() => {
    const relevantCategories = categories.filter(
      category => itemsByCategory[category.id]
    );

    const allPickup = relevantCategories.every(
      category => 
        categoryFulfillmentTypes[category.id] === FULFILLMENT_TYPE_PICKUP ||
        (category.fulfillment_types?.length === 1 && 
         category.fulfillment_types[0] === FULFILLMENT_TYPE_PICKUP)
    );

    if (!allPickup) return { shouldUnify: false };

    const hasConflictingPickupDays = relevantCategories.some((category, _, arr) => {
      const firstCategoryDays = arr[0].pickup_days || [];
      const currentCategoryDays = category.pickup_days || [];
      return !arrayEquals(firstCategoryDays, currentCategoryDays);
    });

    const hasCustomPickupConfigs = relevantCategories.some(
      category => category.has_custom_pickup
    );

    const shouldUnify = allPickup && !hasConflictingPickupDays && !hasCustomPickupConfigs;

    const pickupDays = shouldUnify ? 
      relevantCategories[0]?.pickup_days || [] : 
      [];

    return {
      shouldUnify,
      pickupDays,
      relevantCategoryIds: shouldUnify ? 
        relevantCategories.map(cat => cat.id) : 
        []
    };
  }, [categories, categoryFulfillmentTypes, itemsByCategory]);
}

function arrayEquals(a: number[], b: number[]) {
  return a.length === b.length && 
         a.every((val, index) => val === b[index]);
}
