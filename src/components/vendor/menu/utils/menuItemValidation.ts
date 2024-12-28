export const validateMenuItemAvailability = (categoryId: string | null | undefined, isAvailable: boolean) => {
  if (!categoryId && isAvailable) {
    return "Items must be categorized before they can be made available";
  }
  return null;
};