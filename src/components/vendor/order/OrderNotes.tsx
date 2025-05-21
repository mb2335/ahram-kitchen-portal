
interface OrderNotesProps {
  notes: string | null;
  rejectionReason: string | null;
}

export function OrderNotes({ notes, rejectionReason }: OrderNotesProps) {
  // If there are no notes and no rejection reason, don't render anything
  if (!notes && !rejectionReason) return null;

  return (
    <div className="mt-4 border-t pt-4">
      {notes && (
        <div>
          <h4 className="font-medium mb-2">Order Notes</h4>
          <p className="text-sm text-gray-600">{notes}</p>
        </div>
      )}

      {rejectionReason && (
        <div className={notes ? "mt-4" : ""}>
          <h4 className="font-medium mb-2 text-red-600">Rejection Reason</h4>
          <p className="text-sm text-red-600">{rejectionReason}</p>
        </div>
      )}
    </div>
  );
}
