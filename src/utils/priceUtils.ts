
/**
 * Calculate the discounted price of an item
 * @param originalPrice The original price of the item
 * @param discountPercentage The discount percentage (0-100)
 * @returns The discounted price, or null if no discount applies
 */
export const calculateDiscountedPrice = (
  originalPrice: number,
  discountPercentage?: number | null
): number | null => {
  if (!discountPercentage || discountPercentage <= 0 || discountPercentage >= 100) {
    return null;
  }

  const discountMultiplier = (100 - discountPercentage) / 100;
  return originalPrice * discountMultiplier;
};

/**
 * Format a price with the specified currency
 * @param price The price to format
 * @param currency The currency code (default: USD)
 * @returns The formatted price string
 */
export const formatPrice = (
  price: number | null | undefined,
  currency = 'USD'
): string => {
  if (price === null || price === undefined) {
    return '';
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(price);
};
