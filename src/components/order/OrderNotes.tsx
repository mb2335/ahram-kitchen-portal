interface OrderNotesProps {
  notes?: string;
  rejectionReason?: string;
}

export function OrderNotes({ notes, rejectionReason }: OrderNotesProps) {
  if (!notes && !rejectionReason) return null;

  return (
    <div className="mt-4 pt-4 border-t space-y-4">
      {notes && (
        <p className="text-sm text-gray-600">
          <span className="font-medium">Notes:</span> {notes}
        </p>
      )}
      {rejectionReason && (
        <p className="text-sm text-red-600">
          <span className="font-medium">Rejection Reason:</span> {rejectionReason}
        </p>
      )}
    </div>
  );
}