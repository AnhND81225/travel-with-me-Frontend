import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ClipboardList,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  ReceiptText,
  MessageSquareText,
  Clock3,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  RotateCcw,
  Package,
  Calendar,
  Building,
  Check,
  Info,
  ExternalLink,
  Ticket,
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { vnd } from '../equipment/catalogApi';
import { refunds, type TransactionHistory, type RefundPreview } from './paymentApi';
import { RefundTargetDetails } from './RefundTargetDetails';
import { Card, Button, Badge, Modal } from '../../components/ui';

const positiveId = (value: string | null) =>
  value && /^\d+$/.test(value) && Number.isSafeInteger(Number(value)) && Number(value) > 0
    ? Number(value)
    : null;

export function RefundsPage({ admin = false }: { admin?: boolean }) {
  const [params] = useSearchParams();
  const orderId = positiveId(params.get('orderId'));
  const participantId = positiveId(params.get('participantId'));

  const [rows, setRows] = useState<TransactionHistory[]>([]);
  const [reason, setReason] = useState('');
  const [transferReference, setTransferReference] = useState('');
  const [confirmationNote, setConfirmationNote] = useState('');
  const [preview, setPreview] = useState<RefundPreview | null>(null);
  const [previewError, setPreviewError] = useState('');
  const [submitted, setSubmitted] = useState<TransactionHistory | null>(null);
  const [page, setPage] = useState(0);
  const [refundStatus, setRefundStatus] = useState<'PENDING' | 'SUCCEEDED'>('PENDING');
  const [hasNext, setHasNext] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const inFlight = useRef(false);
  const [confirmation, setConfirmation] = useState<TransactionHistory | null>(null);

  const fetchPage = useCallback(async () => {
    const request = admin
      ? (pageNumber: number) => refunds.list(pageNumber, refundStatus)
      : refunds.mine;
    const data = await request(page);
    const next = data.length === 20 ? await request(page + 1) : [];
    return { data, hasNext: next.length > 0 };
  }, [admin, page, refundStatus]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchPage();
      if (!result.data.length && page > 0) {
        setPage((value) => value - 1);
        return;
      }
      setRows(result.data);
      setHasNext(result.hasNext);
    } finally {
      setLoading(false);
    }
  }, [fetchPage, page]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    setHasNext(false);

    fetchPage()
      .then((result) => {
        if (!active) return;
        if (!result.data.length && page > 0) {
          setPage((value) => value - 1);
          return;
        }
        setRows(result.data);
        setHasNext(result.hasNext);
      })
      .catch((e) => {
        if (active) {
          setRows([]);
          setError(e instanceof Error ? e.message : 'Unable to load refund requests.');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [fetchPage, page]);

  useEffect(() => {
    if (admin || (!orderId && !participantId) || (orderId && participantId)) return;
    let active = true;
    setPreview(null);
    setPreviewError('');
    setSubmitted(null);
    setReason('');

    refunds
      .preview(orderId ? { orderId } : { participantId: participantId! })
      .then((data) => {
        if (active) setPreview(data);
      })
      .catch((e) => {
        if (active)
          setPreviewError(e instanceof Error ? e.message : 'Unable to load the refundable amount.');
      });

    return () => {
      active = false;
    };
  }, [admin, orderId, participantId]);

  async function submit(id?: number) {
    if (inFlight.current) return;
    if (admin && !transferReference.trim()) {
      setError('Please enter the transfer reference number.');
      return;
    }
    if (!admin && !reason.trim()) {
      setError('Please enter a reason for your refund request.');
      return;
    }

    inFlight.current = true;
    setBusy(true);
    setError('');
    setNotice('');

    try {
      const result =
        admin && id
          ? await refunds.confirm(id, {
              transferReference: transferReference.trim(),
              note: confirmationNote.trim(),
            })
          : orderId && !participantId
          ? await refunds.request({ orderId, reason: reason.trim() })
          : participantId && !orderId
          ? await refunds.request({ participantId, reason: reason.trim() })
          : null;

      if (!result) throw new Error('Please select an order or tour ticket.');

      setNotice(
        result.status === 'SUCCEEDED'
          ? `Refund #${result.transactionId} confirmed · ${vnd(result.amount)} returned.`
          : `Refund request #${result.transactionId} submitted · ${vnd(result.amount)}. Awaiting branch review.`
      );

      if (!admin) setSubmitted(result);
      setConfirmation(null);
      await load().catch(() =>
        setError('Action completed, but list could not be refreshed. Please click Refresh.')
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to process refund.');
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }

  const targetRows = [...rows, ...(submitted ? [submitted] : [])].filter((row) =>
    orderId ? row.orderId === orderId : row.participantId === participantId
  );

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 font-label animate-fade-in">
      {/* Top Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs font-bold text-[#5C665F]">
        <Link to="/" className="hover:text-[#111D16]">Home</Link>
        <span>/</span>
        <Link to={admin ? "/admin/orders" : "/orders"} className="hover:text-[#111D16]">
          {admin ? "Admin Console" : "My Orders"}
        </Link>
        <span>/</span>
        <span className="text-[#111D16]">
          {admin ? "Refund Management" : "Refund Center"}
        </span>
      </div>

      {/* Hero Header Banner */}
      <div className="bg-[#152A20] text-white p-6 sm:p-8 rounded-xs space-y-3 relative overflow-hidden shadow-lg border border-[#2B4E3C]">
        <div className="relative z-10 max-w-3xl space-y-2">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-xs bg-[#2B4E3C] text-emerald-400 text-[10px] font-bold tracking-widest uppercase">
            <RotateCcw className="w-3.5 h-3.5" />
            <span>TERRAPEAK FINANCIAL ESCROW RESOLUTION</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-headline text-white tracking-tight">
            {admin ? 'Refund Request Management' : 'Expedition Refund & Escrow Settlement'}
          </h1>
          <p className="text-xs sm:text-sm text-[#ADCBBB] font-body leading-relaxed max-w-2xl">
            {admin
              ? 'Review pending customer refund requests. Confirm refunds only after completing manual electronic bank transfers to customer accounts.'
              : 'Submit cancellation and escrow refund requests for equipment orders or tour bookings. Refunds are verified against branch return audits and returned via electronic transfer.'}
          </p>

          {!admin && (
            <div className="flex items-center gap-2 pt-2">
              <Link to="/orders">
                <Button variant="secondary" size="sm" icon={<Package className="w-3.5 h-3.5" />}>
                  My Orders
                </Button>
              </Link>
              <Link to="/my-tours">
                <Button variant="secondary" size="sm" icon={<Ticket className="w-3.5 h-3.5" />}>
                  My Tours & Expeditions
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Global Alerts / Toasts */}
      {error && (
        <div className="p-4 bg-[#FEE2E2] border border-[#FCA5A5] rounded-xs text-xs text-[#B91C1C] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => setError('')}
            className="text-xs font-bold underline hover:text-black cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {notice && (
        <div className="p-4 bg-[#E0EFE6] border border-[#ADCBBB] rounded-xs text-xs text-[#065F46] flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2 font-bold">
            <CheckCircle2 className="w-5 h-5 text-[#059669] shrink-0" />
            <span>{notice}</span>
          </div>
          <button
            onClick={() => setNotice('')}
            className="text-xs font-bold underline hover:text-black cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Interactive Refund Request Section (When orderId or participantId is selected) */}
      {!admin && (orderId || participantId) && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Target Item Inspection & Reason Input Form */}
          <div className="lg:col-span-7 space-y-4">
            <RefundTargetDetails orderId={orderId} participantId={participantId} />

            <Card padding="md" className="bg-[#F8F6F1] border border-[#D8D2C5] space-y-4">
              <div className="border-b border-[#D8D2C5] pb-2.5">
                <h3 className="font-headline font-bold text-base text-[#111D16]">
                  Refund Justification & Details
                </h3>
                <p className="text-xs text-[#5C665F] font-body mt-0.5">
                  State the reason for cancellation or return so our outpost team can audit and approve your request.
                </p>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void submit();
                }}
                className="space-y-4"
              >
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <label htmlFor="refund-reason" className="font-bold text-[#111D16] uppercase text-[10px]">
                      Reason for Refund Request <span className="text-red-600">*</span>
                    </label>
                    <span className="text-[10px] text-[#737C75] font-mono-spec">
                      {reason.length}/2000
                    </span>
                  </div>

                  <textarea
                    id="refund-reason"
                    required
                    maxLength={2000}
                    rows={4}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="E.g. Travel schedule was modified due to weather, or unexpected personal conflict prevented equipment pickup..."
                    disabled={busy || targetRows.some((row) => row.status === 'PENDING')}
                    className="w-full p-3 bg-white border border-[#D8D2C5] rounded-xs text-xs text-[#111D16] focus:outline-none focus:border-[#152A20] leading-relaxed resize-y"
                  />
                </div>

                <div className="p-3 bg-[#FFF8F3] border border-[#F1BA9B] rounded-xs text-[11px] text-[#5C665F] space-y-1 font-body">
                  <div className="font-bold text-[#D97845] flex items-center gap-1.5 font-label uppercase text-[10px]">
                    <Info className="w-3.5 h-3.5 shrink-0" />
                    TerraPeak Escrow Terms
                  </div>
                  <p>
                    Refund requests are audited by depot armory staff. Order progress and active handovers are paused while this request is pending.
                  </p>
                </div>

                <Button
                  type="submit"
                  variant="accent"
                  size="md"
                  fullWidth
                  disabled={
                    busy ||
                    loading ||
                    !preview ||
                    preview.refundableAmount <= 0 ||
                    !reason.trim() ||
                    targetRows.some((row) => row.status === 'PENDING')
                  }
                  icon={<RotateCcw className="w-4 h-4" />}
                >
                  {busy
                    ? 'Submitting Request...'
                    : targetRows.some((row) => row.status === 'PENDING')
                    ? 'Refund Request Under Review'
                    : 'Submit Refund Request'}
                </Button>
              </form>
            </Card>
          </div>

          {/* Right Column: Financial Breakdown Summary */}
          <div className="lg:col-span-5 sticky top-24 space-y-4">
            <Card padding="md" className="bg-white border-2 border-[#152A20] space-y-4 shadow-sm font-label">
              <div className="border-b border-[#D8D2C5] pb-3">
                <span className="text-[10px] text-[#D97845] font-bold uppercase tracking-wider block">
                  ESCROW SETTLEMENT AUDIT
                </span>
                <h3 className="text-base font-bold text-[#111D16] font-headline mt-0.5">
                  Estimated Refund Valuation
                </h3>
              </div>

              {previewError ? (
                <div className="p-3 bg-[#FEE2E2] border border-[#FCA5A5] rounded-xs text-xs text-[#B91C1C]">
                  {previewError}
                </div>
              ) : !preview ? (
                <div className="p-4 text-center text-xs text-[#737C75]">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#D97845]" />
                  <span>Verifying payment gateway logs...</span>
                </div>
              ) : (
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between items-center text-[#5C665F]">
                    <span>Total paid amount:</span>
                    <span className="font-bold font-mono-spec text-[#111D16]">
                      {vnd(preview.receivedAmount)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-[#5C665F]">
                    <span>Previously refunded:</span>
                    <span className="font-bold font-mono-spec text-[#737C75]">
                      {vnd(preview.refundedAmount)}
                    </span>
                  </div>

                  <div className="pt-3 border-t border-[#D8D2C5] flex justify-between items-baseline">
                    <span className="font-bold text-xs uppercase text-[#111D16]">
                      NET REFUND AMOUNT:
                    </span>
                    <span className="text-2xl font-bold font-headline text-[#D97845]">
                      {vnd(preview.refundableAmount)}
                    </span>
                  </div>

                  <div className="pt-2 text-[11px] text-[#737C75] font-body flex items-start gap-1.5 border-t border-[#EBE6DC]">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>
                      Calculated directly from confirmed gateway transactions. Disbursement will be executed via manual banking transfer.
                    </span>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      )}

      {/* Guide Cards When No Order or Tour is Selected */}
      {!admin && !orderId && !participantId && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card padding="md" className="bg-[#F8F6F1] border border-[#D8D2C5] space-y-3">
            <div className="w-10 h-10 rounded-xs bg-[#152A20] text-[#D97845] flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-headline font-bold text-base text-[#111D16]">
                Equipment Order Refund
              </h3>
              <p className="text-xs text-[#5C665F] font-body mt-1">
                Select an order from your order log to request a return or cancellation refund.
              </p>
            </div>
            <Link to="/orders">
              <Button variant="secondary" size="sm" icon={<ArrowRight className="w-3.5 h-3.5" />}>
                Browse My Orders
              </Button>
            </Link>
          </Card>

          <Card padding="md" className="bg-[#F8F6F1] border border-[#D8D2C5] space-y-3">
            <div className="w-10 h-10 rounded-xs bg-[#152A20] text-emerald-400 flex items-center justify-center">
              <Ticket className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-headline font-bold text-base text-[#111D16]">
                Tour Ticket Cancellation
              </h3>
              <p className="text-xs text-[#5C665F] font-body mt-1">
                View your registered expedition tickets and initiate a cancellation request.
              </p>
            </div>
            <Link to="/my-tours">
              <Button variant="secondary" size="sm" icon={<ArrowRight className="w-3.5 h-3.5" />}>
                Browse My Tours
              </Button>
            </Link>
          </Card>
        </div>
      )}

      {/* Admin Confirmation Modal */}
      {confirmation && (
        <Modal
          isOpen={Boolean(confirmation)}
          onClose={() => {
            if (!inFlight.current) {
              setConfirmation(null);
              setError('');
            }
          }}
          title="Confirm Refund Disbursement"
          maxWidth="md"
        >
          <div className="space-y-4 font-label text-xs">
            <div className="p-4 bg-[#F8F6F1] border border-[#D8D2C5] rounded-xs text-center space-y-2">
              <ReceiptText className="w-10 h-10 text-[#D97845] mx-auto" />
              <h3 className="text-base font-bold text-[#111D16] font-headline">
                Have you transferred the refund to the customer?
              </h3>
              <p className="text-xs text-[#5C665F] font-body max-w-sm mx-auto">
                Confirm only after successfully transferring money via online banking or electronic payment gateway.
              </p>
              <div className="text-2xl font-bold font-headline text-[#D97845] pt-1">
                {vnd(confirmation.amount)}
              </div>
              <span className="text-[11px] text-[#737C75] block font-mono-spec">
                {confirmation.orderId ? `Order #${confirmation.orderId}` : `Tour Ticket #${confirmation.participantId}`}
              </span>
            </div>

            <div className="p-3 bg-[#EBE6DC] rounded-xs text-xs space-y-1">
              <span className="font-bold text-[#111D16] block uppercase text-[10px]">
                Customer Cancellation Reason:
              </span>
              <p className="text-[#5C665F] font-body italic">
                "{confirmation.refundReason || 'No specific reason recorded.'}"
              </p>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="font-bold text-[#111D16] uppercase text-[10px] block">
                  Bank Transfer Reference / Transaction ID *
                </label>
                <input
                  type="text"
                  required
                  maxLength={200}
                  value={transferReference}
                  onChange={(e) => setTransferReference(e.target.value)}
                  placeholder="E.g. FT26103198745612 or ZaloPay AppTransID"
                  className="w-full px-3 py-2 bg-white border border-[#D8D2C5] rounded-xs text-xs focus:outline-none focus:border-[#152A20]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#111D16] uppercase text-[10px] block">
                  Internal Confirmation Note
                </label>
                <textarea
                  rows={2}
                  maxLength={2000}
                  value={confirmationNote}
                  onChange={(e) => setConfirmationNote(e.target.value)}
                  placeholder="Optional internal administrative notes..."
                  className="w-full p-2.5 bg-white border border-[#D8D2C5] rounded-xs text-xs focus:outline-none focus:border-[#152A20]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#D8D2C5]">
              <Button
                variant="secondary"
                size="sm"
                disabled={busy}
                onClick={() => {
                  setConfirmation(null);
                  setError('');
                }}
              >
                Back
              </Button>
              <Button
                variant="accent"
                size="sm"
                disabled={busy || !transferReference.trim()}
                onClick={() => void submit(confirmation.transactionId)}
                icon={<CheckCircle2 className="w-3.5 h-3.5" />}
              >
                {busy ? 'Confirming...' : 'Confirm Money Returned'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Refund Tracking History Section */}
      <Card padding="md" className="space-y-5 bg-[#F8F6F1] border border-[#D8D2C5]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#D8D2C5] pb-4">
          <div>
            <span className="text-[10px] text-[#D97845] font-bold uppercase tracking-wider block">
              REFUND TRACKING LOG
            </span>
            <h2 className="text-lg font-bold text-[#111D16] font-headline mt-0.5">
              {admin
                ? refundStatus === 'PENDING'
                  ? 'Pending Review Requests'
                  : 'Completed Refund Disbursements'
                : 'My Refund Requests & Resolution Records'}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={busy || loading}
              onClick={() => {
                setError('');
                void load().catch((e) => setError(e instanceof Error ? e.message : 'Unable to refresh.'));
              }}
              icon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#D97845]' : ''}`} />}
            >
              Refresh
            </Button>
          </div>
        </div>

        {/* Admin Filter Tabs */}
        {admin && (
          <div className="flex items-center gap-2 border-b border-[#D8D2C5]/60 pb-3">
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                setRefundStatus('PENDING');
                setPage(0);
                setConfirmation(null);
              }}
              className={`px-3 py-1.5 rounded-xs text-xs font-bold uppercase tracking-wider transition cursor-pointer ${
                refundStatus === 'PENDING'
                  ? 'bg-[#152A20] text-white shadow-xs'
                  : 'bg-white text-[#5C665F] border border-[#D8D2C5] hover:bg-[#EBE6DC]'
              }`}
            >
              Pending Review
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                setRefundStatus('SUCCEEDED');
                setPage(0);
                setConfirmation(null);
              }}
              className={`px-3 py-1.5 rounded-xs text-xs font-bold uppercase tracking-wider transition cursor-pointer ${
                refundStatus === 'SUCCEEDED'
                  ? 'bg-[#152A20] text-white shadow-xs'
                  : 'bg-white text-[#5C665F] border border-[#D8D2C5] hover:bg-[#EBE6DC]'
              }`}
            >
              Completed Refunds
            </button>
          </div>
        )}

        {/* Requests List */}
        {loading ? (
          <div className="py-16 text-center space-y-2 text-[#737C75]">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#D97845]" />
            <p className="text-xs font-bold">Loading refund audit history...</p>
          </div>
        ) : rows.length === 0 ? (
          <div className="py-16 text-center space-y-3 bg-white border border-[#D8D2C5] rounded-xs">
            <ClipboardList className="w-12 h-12 text-[#A39B8D] mx-auto stroke-1" />
            <div className="space-y-1">
              <h3 className="text-base font-bold text-[#111D16] font-headline uppercase">
                {error
                  ? 'Unable to load refund requests'
                  : admin
                  ? refundStatus === 'PENDING'
                    ? 'No pending refund requests'
                    : 'No completed refunds yet'
                  : 'No refund requests found'}
              </h3>
              <p className="text-xs text-[#5C665F] font-body max-w-sm mx-auto">
                {admin
                  ? 'Customer requests submitted online will appear in this administrative ledger.'
                  : 'Submitted cancellation and refund requests will appear here with live tracking status.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {rows.map((row) => (
              <div
                key={row.transactionId}
                className="p-4 bg-white border border-[#D8D2C5] hover:border-[#152A20] rounded-xs transition-all space-y-3 font-label text-xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#EBE6DC] pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xs bg-[#F3EFE6] border border-[#D8D2C5] flex items-center justify-center text-[#152A20] shrink-0">
                      <ReceiptText className="w-5 h-5 text-[#D97845]" />
                    </div>
                    <div>
                      <span className="text-[10px] text-[#737C75] font-bold uppercase tracking-wider block">
                        REFUND RECORD #{row.transactionId}
                      </span>
                      <Link
                        to={
                          row.orderId
                            ? admin
                              ? '/admin/orders'
                              : '/orders'
                            : admin
                            ? '/admin/schedule-payment-reviews'
                            : `/my-tours/${row.participantId}`
                        }
                        className="font-bold text-sm text-[#111D16] font-headline hover:text-[#D97845] transition flex items-center gap-1"
                      >
                        <span>
                          {row.orderId
                            ? `Equipment Order #${row.orderId}`
                            : `Tour Participant #${row.participantId}`}
                        </span>
                        <ExternalLink className="w-3 h-3 text-[#A39B8D]" />
                      </Link>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center">
                    <div className="text-right">
                      <span className="text-[10px] text-[#737C75] uppercase block">Refund Value</span>
                      <span className="text-base font-bold text-[#D97845] font-headline">
                        {vnd(row.amount)}
                      </span>
                    </div>

                    <Badge
                      variant={row.status === 'SUCCEEDED' ? 'success' : 'warning'}
                      className="py-1 px-2.5 font-bold"
                    >
                      {row.status === 'SUCCEEDED' ? 'Refunded' : 'Pending Review'}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                  <div className="md:col-span-8 p-3 bg-[#F8F6F1] rounded-xs border border-[#EBE6DC] space-y-1">
                    <div className="flex items-center gap-1.5 text-[10px] text-[#737C75] font-bold uppercase">
                      <MessageSquareText className="w-3.5 h-3.5 text-[#D97845]" />
                      Reason for Request:
                    </div>
                    <p className="text-xs text-[#424844] font-body italic">
                      "{row.refundReason || 'No detailed reason was recorded.'}"
                    </p>
                  </div>

                  <div className="md:col-span-4 text-[11px] text-[#737C75] space-y-1 sm:text-right">
                    <div className="flex items-center gap-1 sm:justify-end">
                      <Clock3 className="w-3.5 h-3.5" />
                      <span>
                        Requested: {new Date(row.createdAt).toLocaleString('en-GB')}
                      </span>
                    </div>

                    {row.status === 'SUCCEEDED' && (
                      <div className="pt-1 text-emerald-700 font-medium">
                        {row.refundTransferReference && (
                          <div className="font-mono-spec">Ref: {row.refundTransferReference}</div>
                        )}
                        {row.succeededAt && (
                          <div>Completed: {new Date(row.succeededAt).toLocaleString('en-GB')}</div>
                        )}
                      </div>
                    )}

                    {admin && row.status === 'PENDING' && (
                      <div className="pt-2">
                        <Button
                          variant="accent"
                          size="sm"
                          disabled={busy}
                          onClick={() => {
                            setError('');
                            setTransferReference('');
                            setConfirmationNote('');
                            setConfirmation(row);
                          }}
                          icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                        >
                          Confirm Money Returned
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination Controls */}
        {!loading && (page > 0 || hasNext) && (
          <div className="flex items-center justify-between pt-4 border-t border-[#D8D2C5] text-xs">
            <span className="font-bold text-[#5C665F]">
              Page {page + 1}
            </span>

            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={page === 0 || busy}
                onClick={() => setPage((v) => v - 1)}
                icon={<ChevronLeft className="w-3.5 h-3.5" />}
              >
                Previous
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={!hasNext || busy}
                onClick={() => setPage((v) => v + 1)}
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </main>
  );
}
