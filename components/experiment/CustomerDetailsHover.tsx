'use client';

import { Ticket } from '@/types';

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
  const birthDate = details?.birthDate ?? 'N/A';
  const previousCases = details?.previousCases ?? [];
  const caseCount = details?.caseCount ?? previousCases.length;
  const caseTypes = details?.caseTypes?.length ? details.caseTypes.join(', ') : 'N/A';

  return (
    <div className="relative inline-flex items-center gap-2 group" tabIndex={0}>
      <span className={labelClassName ?? 'text-sm text-indigo-100'}>
        Customer: <span className={nameClassName ?? 'font-semibold text-white'}>{name}</span>{' '}
        <span className={emailClassName ?? 'text-indigo-200'}>({email})</span>
      </span>
      <span className={iconClassName ?? 'inline-flex h-5 w-5 items-center justify-center rounded-full border border-indigo-200 text-xs text-indigo-100'}>
        i
      </span>

      <div className="absolute left-0 top-full mt-2 w-96 rounded-lg border border-gray-200 bg-white p-4 text-gray-800 shadow-xl opacity-0 pointer-events-none transition-opacity duration-150 group-hover:opacity-100 group-hover:pointer-events-auto group-focus-within:opacity-100 group-focus-within:pointer-events-auto z-20">
        <div className="text-sm font-semibold text-gray-900 mb-2">Customer Profile</div>
        <div className="grid grid-cols-2 gap-3 text-xs text-gray-700">
          <div>
            <div className="text-gray-500">Name</div>
            <div className="font-medium text-gray-900">{name}</div>
          </div>
          <div>
            <div className="text-gray-500">Birth</div>
            <div className="font-medium text-gray-900">{birthDate}</div>
          </div>
          <div>
            <div className="text-gray-500">Email</div>
            <div className="font-medium text-gray-900 break-all">{email}</div>
          </div>
          <div>
            <div className="text-gray-500">Total Cases</div>
            <div className="font-medium text-gray-900">{caseCount}</div>
          </div>
          <div className="col-span-2">
            <div className="text-gray-500">Case Types</div>
            <div className="font-medium text-gray-900">{caseTypes}</div>
          </div>
        </div>

        {previousCases.length > 0 && (
          <div className="mt-3 border-t border-gray-100 pt-3">
            <div className="text-xs font-semibold text-gray-700 mb-2">Previous Cases</div>
            <div className="space-y-2">
              {previousCases.map((item) => (
                <div key={item.id} className="rounded-md border border-gray-100 bg-gray-50 p-2">
                  <div className="flex items-center justify-between text-xs text-gray-600">
                    <span className="font-medium text-gray-800">{item.id}</span>
                    <span>{item.date ?? 'Date unknown'}</span>
                  </div>
                  <div className="text-xs text-gray-700">
                    <span className="font-medium">{item.type}</span>
                    {item.status ? ` - ${item.status}` : ''}
                  </div>
                  {item.summary && (
                    <div className="text-xs text-gray-600 mt-1">{item.summary}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
