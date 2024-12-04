import { Button } from "@/components/ui/button";
import { RejectionDialog } from "./RejectionDialog";
import { OrderStatus } from "./types";

interface OrderStatusActionsProps {
  status: OrderStatus;
  onUpdateStatus: (status: OrderStatus, reason?: string) => void;
  rejectionReason: string;
  setRejectionReason: (reason: string) => void;
}

export function OrderStatusActions({ 
  status, 
  onUpdateStatus,
  rejectionReason,
  setRejectionReason
}: OrderStatusActionsProps) {
  return (
    <div className="flex gap-2">
      {status === 'pending' && (
        <>
          <Button 
            variant="outline"
            onClick={() => onUpdateStatus('confirmed')}
          >
            Confirm Order
          </Button>
          <RejectionDialog
            onReject={(reason) => onUpdateStatus('rejected', reason)}
            rejectionReason={rejectionReason}
            setRejectionReason={setRejectionReason}
          />
        </>
      )}
      {status === 'confirmed' && (
        <Button 
          variant="outline"
          onClick={() => onUpdateStatus('completed')}
        >
          Mark as Completed
        </Button>
      )}
    </div>
  );
}