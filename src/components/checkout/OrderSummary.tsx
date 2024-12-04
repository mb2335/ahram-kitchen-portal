import { useCart } from '@/contexts/CartContext';

export function OrderSummary() {
  const { items, total } = useCart();
  const TAX_RATE = 0.1;
  const taxAmount = total * TAX_RATE;
  const finalTotal = total + taxAmount;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-4">Order Summary</h2>
      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.id} className="flex justify-between">
            <span>{item.quantity}x {item.name}</span>
            <span>${(item.price * item.quantity).toFixed(2)}</span>
          </div>
        ))}
        <div className="border-t pt-4">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>${total.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Tax (10%)</span>
            <span>${taxAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold mt-2">
            <span>Total</span>
            <span>${finalTotal.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}