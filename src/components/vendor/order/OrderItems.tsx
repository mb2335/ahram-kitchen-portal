import { useLanguage } from '@/contexts/LanguageContext';
import { OrderItem } from '../types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface OrderItemsProps {
  items: OrderItem[];
}

export function OrderItems({ items }: OrderItemsProps) {
  const { language } = useLanguage();

  return (
    <div>
      <h4 className="font-medium mb-2">Order Items</h4>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Item</TableHead>
            <TableHead>Category</TableHead>
            <TableHead className="text-right">Quantity</TableHead>
            <TableHead className="text-right">Unit Price</TableHead>
            <TableHead className="text-right">Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items?.map((item) => (
            <TableRow key={item.id}>
              <TableCell>
                {language === 'en' ? item.menu_item?.name : item.menu_item?.name_ko}
              </TableCell>
              <TableCell>
                {language === 'en' 
                  ? item.menu_item?.category?.name 
                  : item.menu_item?.category?.name_ko || 'Uncategorized'}
              </TableCell>
              <TableCell className="text-right">{item.quantity}</TableCell>
              <TableCell className="text-right">${item.unit_price.toFixed(2)}</TableCell>
              <TableCell className="text-right">
                ${(item.quantity * item.unit_price).toFixed(2)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}