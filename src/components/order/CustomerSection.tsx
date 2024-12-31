interface CustomerSectionProps {
  customer: {
    full_name: string;
    email: string;
    phone?: string;
  };
}

export function CustomerSection({ customer }: CustomerSectionProps) {
  return (
    <div className="mb-4 p-4 bg-gray-50 rounded-md">
      <h3 className="font-medium mb-2">Customer Details</h3>
      <p className="text-sm">Name: {customer.full_name}</p>
      <p className="text-sm">Email: {customer.email}</p>
      {customer.phone && (
        <p className="text-sm">Phone: {customer.phone}</p>
      )}
    </div>
  );
}