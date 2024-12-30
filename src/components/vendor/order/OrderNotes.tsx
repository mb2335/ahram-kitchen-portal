interface OrderNotesProps {
  notes: string | null;
  rejectionReason: string | null;
}

export function OrderNotes({ notes, rejectionReason }: OrderNotesProps) {
  return (
    <>
      {notes && (
        <div className="border-t pt-4">
          <h4 className="font-medium mb-2">Order Notes</h4>
          <p className="text-sm text-gray-600">{notes}</p>
        </div>
      )}

      {rejectionReason && (
        <div className="border-t pt-4">
          <h4 className="font-medium mb-2 text-red-600">Rejection Reason</h4>
          <p className="text-sm text-red-600">{rejectionReason}</p>
        </div>
      )}
    </>
  );
}