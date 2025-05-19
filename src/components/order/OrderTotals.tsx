
interface OrderTotalsProps {
  subtotal: number;
  total: number;
  discountAmount?: number;
}

export function OrderTotals({ subtotal, total, discountAmount = 0 }: OrderTotalsProps) {
  return (
    <div className="mt-4 pt-4 border-t">
      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-gray-600">Subtotal</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>
        {discountAmount > 0 && (
          <div className="flex justify-between text-red-500">
            <span>Discount</span>
            <span>-${discountAmount.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between font-bold">
          <span>Total</span>
          <span>${total.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}
