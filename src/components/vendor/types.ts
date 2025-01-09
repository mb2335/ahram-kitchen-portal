export type OrderStatus = 'pending' | 'confirmed' | 'completed' | 'rejected';

export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id: string;
  quantity: number;
  unit_price: number;
  menu_item: {
    id: string;
    name: string;
    name_ko: string;
    category_id?: string;
    discount_percentage?: number;
    category?: {
      id: string;
      name: string;
      name_ko: string;
    };
  };
}