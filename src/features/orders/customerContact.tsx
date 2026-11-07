import { Link } from 'react-router-dom';
import { ArrowUpRight, CircleAlert, MapPin, Pencil, Phone, UserRound } from 'lucide-react';
import type { Account } from '../equipment/catalogApi';

type Contact = { customerName: string; customerPhone: string; customerAddress: string };
export function getCustomerContact(account: Account | null) {
  return { value: {
    customerName: account?.fullName ?? '',
    customerPhone: account?.phone ?? '',
    customerAddress: account?.address ?? '',
  } };
}
export function contactError(value: Contact) {
  if (!value.customerName.trim() || !value.customerPhone.trim() || !value.customerAddress.trim()) return 'Please update your profile with your full name, phone number and address before placing an order.';
  if (!/^[+\d\s().-]{7,30}$/.test(value.customerPhone.trim())) return 'Please update your profile with a valid phone number before placing an order.';
  return '';
}
export function CustomerContactSummary({ contact }: { contact: ReturnType<typeof getCustomerContact> }) {
  const error = contactError(contact.value);
  const { customerName, customerPhone, customerAddress } = contact.value;
  return (
    <section aria-label="Customer information" className="overflow-hidden rounded-xl border border-[#E3DED3] bg-[#FFFEFB] font-body text-[#152A20]">
      <div className="flex items-center justify-between gap-3 border-b border-[#EEEAE2] px-4 py-3">
        <h3 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#737C75]">Customer information</h3>
        <Link to="/passport" aria-label="Edit personal information" className="inline-flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-semibold text-[#526457] transition-colors hover:bg-[#EFF2EB] hover:text-[#152A20] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#526457]">
          <Pencil size={12} aria-hidden="true" /> Edit
        </Link>
      </div>
      <div className="space-y-3.5 p-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EDF1E9] text-[#526457]">
            <UserRound size={18} strokeWidth={1.6} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-[9px] font-medium uppercase tracking-[0.12em] text-[#899087]">Order contact</p>
            <p className="mt-0.5 break-words text-sm font-semibold leading-snug">{customerName.trim() || 'Add your name'}</p>
          </div>
        </div>
        <dl className="space-y-3 border-t border-[#EEEAE2] pt-3.5">
          <div className="flex items-start gap-2.5">
            <dt className="mt-0.5 shrink-0 text-[#899087]"><Phone size={14} strokeWidth={1.6} aria-hidden="true" /><span className="sr-only">Phone number</span></dt>
            <dd className="min-w-0 break-words text-xs leading-5 text-[#526055]">{customerPhone.trim() || 'Phone number not provided'}</dd>
          </div>
          <div className="flex items-start gap-2.5">
            <dt className="mt-0.5 shrink-0 text-[#899087]"><MapPin size={14} strokeWidth={1.6} aria-hidden="true" /><span className="sr-only">Address</span></dt>
            <dd className="min-w-0 break-words text-xs leading-5 text-[#526055]">{customerAddress.trim() || 'Address not provided'}</dd>
          </div>
        </dl>
      </div>
      {error && <div className="border-t border-[#EFDFCA] bg-[#FBF6EE] px-4 py-3">
        <p role="status" className="flex items-start gap-2 text-[11px] leading-relaxed text-[#936139]"><CircleAlert size={14} className="mt-0.5 shrink-0" aria-hidden="true" />{error}</p>
        <Link to="/passport" className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-[#80512F] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2">
          Complete your profile <ArrowUpRight size={12} aria-hidden="true" />
        </Link>
      </div>}
    </section>
  );
}
