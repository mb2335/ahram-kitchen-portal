import { Order } from '../types';

interface CustomerDetailsProps {
  customer?: NonNullable<Order['customer']> | null;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
}

export function CustomerDetails({ 
  customer, 
  customerName, 
  customerEmail, 
  customerPhone 
}: CustomerDetailsProps) {
  // If there's a linked customer record, use that data
  // Otherwise use the direct order customer information
  const name = customer?.full_name || customerName;
  const email = customer?.email || customerEmail;
  const phone = customer?.phone || customerPhone;
  
  return (
    <div className="bg-gray-50 p-4 rounded-md">
      <h4 className="font-medium mb-2">Customer Details</h4>
      <div className="space-y-1">
        <p className="text-sm">Name: {name}</p>
        <p className="text-sm">Email: {email}</p>
        {phone && (
          <p className="text-sm">Phone: {phone}</p>
        )}
        {customer && (
          <p className="text-xs text-blue-600">Registered Customer</p>
        )}
      </div>
    </div>
  );
}
