import { Order } from '../types';

interface CustomerDetailsProps {
  customer: NonNullable<Order['customer']>;
}

export function CustomerDetails({ customer }: CustomerDetailsProps) {
  return (
    <div className="bg-gray-50 p-4 rounded-md">
      <h4 className="font-medium mb-2">Customer Details</h4>
      <div className="space-y-1">
        <p className="text-sm">Name: {customer.full_name}</p>
        <p className="text-sm">Email: {customer.email}</p>
        {customer.phone && (
          <p className="text-sm">Phone: {customer.phone}</p>
        )}
      </div>
    </div>
  );
}