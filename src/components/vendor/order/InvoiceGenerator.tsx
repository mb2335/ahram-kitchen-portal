
import React from 'react';
import { Order } from '@/components/vendor/types';
import { formatCurrency } from '@/utils/formatters';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';

interface InvoiceGeneratorProps {
  order: Order;
}

export function InvoiceGenerator({ order }: InvoiceGeneratorProps) {
  const generateInvoice = () => {
    const invoiceWindow = window.open('', '_blank');
    if (!invoiceWindow) return;

    const calculateItemTotal = (item: any) => {
      const basePrice = item.quantity * item.unit_price;
      const discountAmount = item.discount_percentage 
        ? (basePrice * (item.discount_percentage / 100))
        : 0;
      return basePrice - discountAmount;
    };

    const subtotal = order.order_items?.reduce((sum, item) => sum + calculateItemTotal(item), 0) || 0;
    const total = order.total_amount;

    const invoiceHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice #${order.id.substring(0, 8)}</title>
          <style>
            @page {
              size: 8.5in 11in;
              margin: 0.5in;
            }
            
            body {
              font-family: Arial, sans-serif;
              max-width: 7.5in;
              margin: 0 auto;
              padding: 0;
              line-height: 1.4;
              color: #333;
              font-size: 12px;
            }
            
            .invoice-header {
              border-bottom: 2px solid #333;
              padding-bottom: 15px;
              margin-bottom: 20px;
            }
            
            .invoice-title {
              font-size: 24px;
              font-weight: bold;
              margin: 0;
            }
            
            .invoice-info {
              display: flex;
              justify-content: space-between;
              margin-bottom: 20px;
            }
            
            .invoice-details, .customer-details {
              flex: 1;
            }
            
            .invoice-details h3, .customer-details h3 {
              margin: 0 0 8px 0;
              font-size: 14px;
              font-weight: bold;
              color: #666;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            
            .invoice-details p, .customer-details p {
              margin: 4px 0;
              font-size: 12px;
            }
            
            .fulfillment-details {
              background-color: #f8f9fa;
              padding: 15px;
              border-radius: 6px;
              margin-bottom: 15px;
            }
            
            .fulfillment-details h3 {
              margin: 0 0 8px 0;
              color: #666;
              font-size: 14px;
            }
            
            .fulfillment-details p {
              margin: 3px 0;
              font-size: 12px;
            }
            
            .items-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
              font-size: 11px;
            }
            
            .items-table th {
              background-color: #f8f9fa;
              padding: 8px 6px;
              text-align: left;
              border-bottom: 2px solid #dee2e6;
              font-weight: bold;
              font-size: 11px;
            }
            
            .items-table td {
              padding: 8px 6px;
              border-bottom: 1px solid #dee2e6;
              font-size: 11px;
            }
            
            .items-table tr:nth-child(even) {
              background-color: #f8f9fa;
            }
            
            .text-right {
              text-align: right;
            }
            
            .totals {
              margin-left: auto;
              width: 250px;
            }
            
            .totals table {
              width: 100%;
              border-collapse: collapse;
            }
            
            .totals td {
              padding: 6px 10px;
              border-bottom: 1px solid #dee2e6;
              font-size: 12px;
            }
            
            .totals .total-row {
              font-weight: bold;
              font-size: 16px;
              border-top: 2px solid #333;
            }
            
            .notes-section {
              margin-top: 15px;
              padding: 15px;
              background-color: #f8f9fa;
              border-radius: 6px;
            }
            
            .notes-section h3 {
              margin: 0 0 8px 0;
              font-size: 14px;
            }
            
            .notes-section p {
              margin: 0;
              font-size: 12px;
            }
            
            @media print {
              body {
                margin: 0;
                padding: 0;
                max-width: none;
              }
              
              .no-print {
                display: none;
              }
              
              .page-break {
                page-break-before: always;
              }
            }
          </style>
        </head>
        <body>
          <div class="invoice-header">
            <h1 class="invoice-title">INVOICE</h1>
            <p>Invoice #${order.id.substring(0, 8)}</p>
          </div>

          <div class="invoice-info">
            <div class="invoice-details">
              <h3>Invoice Details</h3>
              <p><strong>Date:</strong> ${format(new Date(order.created_at), 'MMMM d, yyyy')}</p>
              <p><strong>Order ID:</strong> ${order.id}</p>
              <p><strong>Status:</strong> ${order.status.charAt(0).toUpperCase() + order.status.slice(1)}</p>
            </div>

            <div class="customer-details">
              <h3>Bill To</h3>
              <p><strong>${order.customer?.full_name || order.customer_name}</strong></p>
              <p>${order.customer?.email || order.customer_email}</p>
              ${(order.customer?.phone || order.customer_phone) ? `<p>${order.customer?.phone || order.customer_phone}</p>` : ''}
            </div>
          </div>

          <div class="fulfillment-details">
            <h3>Fulfillment Details</h3>
            <p><strong>Type:</strong> ${order.fulfillment_type === 'pickup' ? 'Pickup' : 'Delivery'}</p>
            <p><strong>Date:</strong> ${new Date(order.delivery_date).toLocaleDateString(undefined, { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</p>
            ${order.fulfillment_type === 'pickup' ? `
              ${order.pickup_location ? `<p><strong>Pickup Location:</strong> ${order.pickup_location}</p>` : ''}
              ${order.pickup_time ? `<p><strong>Pickup Time:</strong> ${order.pickup_time}</p>` : ''}
            ` : `
              ${order.delivery_address ? `<p><strong>Delivery Address:</strong> ${order.delivery_address}</p>` : ''}
              ${order.delivery_time_slot ? `<p><strong>Delivery Time:</strong> ${order.delivery_time_slot}</p>` : ''}
            `}
          </div>

          <table class="items-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Category</th>
                <th class="text-right">Qty</th>
                <th class="text-right">Unit Price</th>
                <th class="text-right">Discount</th>
                <th class="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              ${order.order_items?.map(item => `
                <tr>
                  <td>${item.menu_item?.name || 'Unknown Item'}</td>
                  <td>${item.menu_item?.category?.name || 'N/A'}</td>
                  <td class="text-right">${item.quantity}</td>
                  <td class="text-right">${formatCurrency(item.unit_price)}</td>
                  <td class="text-right">${item.discount_percentage ? item.discount_percentage + '%' : '-'}</td>
                  <td class="text-right">${formatCurrency(calculateItemTotal(item))}</td>
                </tr>
              `).join('') || ''}
            </tbody>
          </table>

          <div class="totals">
            <table>
              <tr>
                <td>Subtotal:</td>
                <td class="text-right">${formatCurrency(subtotal)}</td>
              </tr>
              ${order.discount_amount && order.discount_amount > 0 ? `
                <tr>
                  <td>Discount:</td>
                  <td class="text-right">-${formatCurrency(order.discount_amount)}</td>
                </tr>
              ` : ''}
              <tr class="total-row">
                <td>Total:</td>
                <td class="text-right">${formatCurrency(total)}</td>
              </tr>
            </table>
          </div>

          ${order.notes ? `
            <div class="notes-section">
              <h3>Notes</h3>
              <p>${order.notes}</p>
            </div>
          ` : ''}

          <div class="no-print" style="margin-top: 20px; text-align: center;">
            <button onclick="window.print()" style="background-color: #007bff; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-size: 14px; margin-right: 10px;">Print Invoice</button>
            <button onclick="window.close()" style="background-color: #6c757d; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-size: 14px;">Close</button>
          </div>
        </body>
      </html>
    `;

    invoiceWindow.document.write(invoiceHTML);
    invoiceWindow.document.close();
  };

  return (
    <Button
      onClick={generateInvoice}
      variant="outline"
      size="sm"
      className="flex items-center gap-2"
    >
      <FileText className="h-4 w-4" />
      Generate Invoice
    </Button>
  );
}
