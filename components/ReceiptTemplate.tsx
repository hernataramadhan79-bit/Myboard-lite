import React from 'react';
import { Transaction, StoreSettings } from '../types';

interface ReceiptTemplateProps {
  transaction: Transaction;
  settings: StoreSettings;
}

export const ReceiptTemplate: React.FC<ReceiptTemplateProps> = ({ transaction, settings }) => {
  // Fallback for older transactions that might not have tax data
  const subtotal = transaction.subtotal || transaction.total;
  const taxAmount = transaction.taxAmount || 0;

  return (
    <div className="font-mono text-[11px] leading-tight text-black bg-white w-[80mm] max-w-full mx-auto p-4 box-border shadow-sm border border-gray-100 print:shadow-none print:border-none print-receipt-container">
      <div className="text-center mb-5">
        <h1 className="font-bold text-base mb-1 tracking-tight uppercase">{settings.storeName}</h1>
        <p className="text-[10px] text-gray-600 mb-0.5">{settings.address}</p>
        <p className="text-[10px] text-gray-600">{settings.whatsappNumber}</p>
      </div>

      <div className="border-t border-b border-dashed border-gray-400 my-4 py-2 space-y-1">
        <div className="flex justify-between">
          <span className="text-gray-500">TGL:</span>
          <span>{new Date(transaction.date).toLocaleString('id-ID', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }).replace(/\//g, '/')}</span>
        </div>
        <div className="flex justify-between gap-2">
          <span className="text-gray-500 shrink-0">ID:</span>
          <span className="truncate">{transaction.id}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">KASIR:</span>
          <span>{settings.cashierName}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">METODE:</span>
          <span className="font-bold">{transaction.paymentMethod}</span>
        </div>
      </div>

      <div className="mb-4 space-y-3">
        {transaction.items.map((item, index) => (
          <div key={index} className="flex flex-col">
            <span className="font-bold text-gray-900 uppercase">{item.name}</span>
            <div className="flex justify-between mt-0.5">
              <span>{item.quantity} x {item.price.toLocaleString('id-ID')}</span>
              <span className="font-bold whitespace-nowrap">{(item.quantity * item.price).toLocaleString('id-ID')}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-dashed border-gray-400 pt-3 mb-6 space-y-1">
        <div className="flex justify-between">
          <span>SUBTOTAL</span>
          <span className="whitespace-nowrap">{subtotal.toLocaleString('id-ID')}</span>
        </div>
        {taxAmount > 0 && (
          <div className="flex justify-between">
            <span>PPN ({settings.taxRate}%)</span>
            <span className="whitespace-nowrap">{taxAmount.toLocaleString('id-ID')}</span>
          </div>
        )}
        <div className="flex justify-between items-center text-sm font-bold mt-2 pt-2 border-t border-double border-gray-800">
          <span>TOTAL</span>
          <span className="text-base whitespace-nowrap">Rp {transaction.total.toLocaleString('id-ID')}</span>
        </div>
      </div>

      <div className="text-center text-[10px] text-gray-500 mt-6 pb-2">
        <p className="mb-1 italic">Terima Kasih telah berbelanja!</p>
        <p className="text-[9px] opacity-60">Powered by MyBoard Lite</p>
      </div>
    </div>
  );
};