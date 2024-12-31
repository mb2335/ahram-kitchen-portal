interface OrderTotalsProps {
  subtotal: number;
  taxAmount: number;
  total: number;
}

export function OrderTotals({ subtotal, taxAmount, total }: OrderTotalsProps) {
  return (
    <div className="mt-4 pt-4 border-t">
      <div className="flex justify-between">
        <span>Subtotal</span>
        <span>${subtotal.toFixed(2)}</span>
      </div>
      <div className="flex justify-between">
        <span>Tax</span>
        <span>${taxAmount.toFixed(2)}</span>
      </div>
      <div className="flex justify-between font-bold">
        <span>Total</span>
        <span>${total.toFixed(2)}</span>
      </div>
    </div>
  );
}