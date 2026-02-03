'use client';

import { Ticket } from '@/types';
import CustomerDetailsCard from '@/components/experiment/CustomerDetailsCard';

interface CustomerDetailsHoverProps {
  ticket: Ticket;
  labelClassName?: string;
  nameClassName?: string;
  emailClassName?: string;
  iconClassName?: string;
}

export default function CustomerDetailsHover({
  ticket,
  labelClassName,
  nameClassName,
  emailClassName,
  iconClassName,
}: CustomerDetailsHoverProps) {
  const details = ticket.customerDetails;
  const name = details?.name ?? ticket.customer;
  const email = details?.email ?? ticket.email;

  return (
    <div
      className="relative inline-flex items-center gap-2 group z-0 group-hover:z-50 group-focus-within:z-50"
      tabIndex={0}
    >
      <span className={labelClassName ?? 'text-sm text-indigo-100'}>
        Customer: <span className={nameClassName ?? 'font-semibold text-white'}>{name}</span>{' '}
        <span className={emailClassName ?? 'text-indigo-200'}>({email})</span>
      </span>
      <span className={iconClassName ?? 'inline-flex h-5 w-5 items-center justify-center rounded-full border border-indigo-200 text-xs text-indigo-100'}>
        i
      </span>

      <div className="absolute left-0 top-full mt-2 w-96 rounded-lg border border-gray-200 bg-white p-4 text-gray-800 shadow-xl opacity-0 pointer-events-none transition-opacity duration-150 group-hover:opacity-100 group-hover:pointer-events-auto group-focus-within:opacity-100 group-focus-within:pointer-events-auto z-50">
        <CustomerDetailsCard ticket={ticket} />
      </div>
    </div>
  );
}
