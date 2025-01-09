interface OrderSummaryProps {
  subtotal: number;
  taxAmount: number;
  total: number;
}

export function OrderSummary({ subtotal, taxAmount, total }: OrderSummaryProps) {
  return (
    <div className="border-t pt-4">
      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-gray-600">Subtotal</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Tax</span>
          <span>${taxAmount.toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-medium">
          <span>Total</span>
          <span>${total.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}