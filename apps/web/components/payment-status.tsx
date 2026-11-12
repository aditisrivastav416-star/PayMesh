export function PaymentStatus({ status }: { status: string }) {
  const tone =
    status === 'COMPLETED'
      ? 'success'
      : status === 'REJECTED'
        ? 'error'
        : status === 'PENDING'
          ? 'wait'
          : 'progress';
  const label =
    (
      {
        AWAITING_BUYER: 'Awaiting buyer',
        READY: 'Ready for checkout',
        CAPTURING: 'Capturing',
        CREATING: 'Creating checkout',
      } as Record<string, string>
    )[status] ?? status.toLowerCase().replaceAll('_', ' ');
  return <span className={`status-pill status-${tone}`}>{label}</span>;
}
