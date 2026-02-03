'use client';

import { Ticket } from '@/types';

interface CustomerDetailsCardProps {
  ticket: Ticket;
}

export default function CustomerDetailsCard({ ticket }: CustomerDetailsCardProps) {
  const details = ticket.customerDetails;
  const name = details?.name ?? ticket.customer;
  const email = details?.email ?? ticket.email;
  const birthDate = details?.birthDate ?? 'N/A';
  const previousCases = details?.previousCases ?? [];
  const caseCount = details?.caseCount ?? previousCases.length;
  const caseTypes = details?.caseTypes?.length ? details.caseTypes.join(', ') : 'N/A';

  return (
    <div>
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
  );
}
