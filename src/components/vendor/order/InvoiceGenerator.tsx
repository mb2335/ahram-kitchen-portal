
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
    const tax = 0; // Assuming no tax for now, can be modified later
    const total = order.total_amount;

    const invoiceHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice #${order.id.substring(0, 8)}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              max-width: 800px;
              margin: 0 auto;
              padding: 20px;
              line-height: 1.6;
              color: #333;
            }
            .invoice-header {
              border-bottom: 2px solid #333;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .invoice-title {
              font-size: 28px;
              font-weight: bold;
              margin: 0;
            }
            .invoice-info {
              display: flex;
              justify-content: space-between;
              margin-bottom: 30px;
            }
            .invoice-details, .customer-details {
              flex: 1;
            }
            .invoice-details h3, .customer-details h3 {
              margin-top: 0;
              font-size: 16px;
              font-weight: bold;
              color: #666;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            .items-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 30px;
            }
            .items-table th {
              background-color: #f8f9fa;
              padding: 12px;
              text-align: left;
              border-bottom: 2px solid #dee2e6;
              font-weight: bold;
            }
            .items-table td {
              padding: 12px;
              border-bottom: 1px solid #dee2e6;
            }
            .items-table tr:nth-child(even) {
              background-color: #f8f9fa;
            }
            .text-right {
              text-align: right;
            }
            .totals {
              margin-left: auto;
              width: 300px;
            }
            .totals table {
              width: 100%;
              border-collapse: collapse;
            }
            .totals td {
              padding: 8px 12px;
              border-bottom: 1px solid #dee2e6;
            }
            .totals .total-row {
              font-weight: bold;
              font-size: 18px;
              border-top: 2px solid #333;
            }
            .fulfillment-details {
              background-color: #f8f9fa;
              padding: 20px;
              border-radius: 8px;
              margin-bottom: 20px;
            }
            .fulfillment-details h3 {
              margin-top: 0;
              color: #666;
            }
            @media print {
              body {
                margin: 0;
                padding: 15px;
              }
              .no-print {
                display: none;
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
              <tr>
                <td>Tax:</td>
                <td class="text-right">${formatCurrency(tax)}</td>
              </tr>
              <tr class="total-row">
                <td>Total:</td>
                <td class="text-right">${formatCurrency(total)}</td>
              </tr>
            </table>
          </div>

          ${order.notes ? `
            <div style="margin-top: 30px; padding: 20px; background-color: #f8f9fa; border-radius: 8px;">
              <h3 style="margin-top: 0;">Notes</h3>
              <p>${order.notes}</p>
            </div>
          ` : ''}

          <div class="no-print" style="margin-top: 30px; text-align: center;">
            <button onclick="window.print()" style="background-color: #007bff; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; font-size: 16px;">Print Invoice</button>
            <button onclick="window.close()" style="background-color: #6c757d; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; font-size: 16px; margin-left: 10px;">Close</button>
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
