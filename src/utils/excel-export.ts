import * as XLSX from 'xlsx';
import type { Invoice } from '@/api/invoices';
import type { Lead } from '@/api/leads';

export interface ExportInvoice extends Omit<Invoice, 'id' | 'createdById' | 'updatedAt'> {
  createdByName: string;
}

export function exportInvoicesToExcel(invoices: ExportInvoice[], filename: string = 'invoices.xlsx'): void {
  // Prepare data for export
  const exportData = invoices.map((invoice) => ({
    'Invoice #': invoice.invoiceNumber,
    'Customer Name': invoice.customerName,
    'Customer Email': invoice.customerEmail || '-',
    'Customer Phone': invoice.customerPhone || '-',
    'Template': invoice.templateName,
    'Date': new Date(invoice.invoiceDate).toLocaleDateString('en-IN'),
    'Due Date': invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('en-IN') : '-',
    'Status': invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1),
    'Subtotal': invoice.subtotal,
    'Discount': invoice.discount,
    'Tax Amount': invoice.taxAmount,
    'CGST': invoice.taxAmount / 2,
    'SGST': invoice.taxAmount / 2,
    'Total': invoice.total,
    'Currency': invoice.currency,
    'Created By': invoice.createdByName,
    'Created At': new Date(invoice.createdAt).toLocaleDateString('en-IN'),
  }));

  // Create workbook and worksheet
  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Invoices');

  // Set column widths
  const columnWidths = [
    { wch: 12 }, // Invoice #
    { wch: 20 }, // Customer Name
    { wch: 25 }, // Customer Email
    { wch: 15 }, // Customer Phone
    { wch: 20 }, // Template
    { wch: 12 }, // Date
    { wch: 12 }, // Due Date
    { wch: 12 }, // Status
    { wch: 12 }, // Subtotal
    { wch: 12 }, // Discount
    { wch: 12 }, // Tax Amount
    { wch: 12 }, // CGST
    { wch: 12 }, // SGST
    { wch: 12 }, // Total
    { wch: 10 }, // Currency
    { wch: 15 }, // Created By
    { wch: 12 }, // Created At
  ];
  worksheet['!cols'] = columnWidths;

  // Format header row
  const headerRange = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
  for (let C = headerRange.s.c; C <= headerRange.e.c; ++C) {
    const address = XLSX.utils.encode_col(C) + '1';
    if (!worksheet[address]) continue;
    worksheet[address].s = {
      font: { bold: true, color: { rgb: 'FFFFFF' } },
      fill: { fgColor: { rgb: '4B5563' } },
      alignment: { horizontal: 'center', vertical: 'center' },
    };
  }

  // Write file
  XLSX.writeFile(workbook, filename);
}

export interface ExportLead extends Lead {}

export function exportLeadsToExcel(leads: ExportLead[], filename: string = 'leads.xlsx'): void {
  const exportData = leads.map((lead) => ({
    'Lead ID': lead.id,
    'First Name': lead.firstName,
    'Last Name': lead.lastName || '-',
    'Phone': lead.phone || '-',
    'Email': lead.email || '-',
    'Status': lead.status || '-',
    'Priority': lead.priority || '-',
    'Source': lead.source || '-',
    'Assigned To': lead.assignedToName || '-',
    'City': lead.city || '-',
    'State': lead.state || '-',
    'Address': lead.address || '-',
    'Pincode': lead.pincode || '-',
    'Tags': (lead.tags ?? []).join(', '),
    'Deal Value': lead.dealValue ?? 0,
    'Created At': new Date(lead.createdAt).toLocaleDateString('en-IN'),
    'Updated At': new Date(lead.updatedAt).toLocaleDateString('en-IN'),
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Leads');

  worksheet['!cols'] = [
    { wch: 38 }, // Lead ID
    { wch: 16 }, // First Name
    { wch: 16 }, // Last Name
    { wch: 14 }, // Phone
    { wch: 24 }, // Email
    { wch: 12 }, // Status
    { wch: 12 }, // Priority
    { wch: 16 }, // Source
    { wch: 18 }, // Assigned To
    { wch: 14 }, // City
    { wch: 14 }, // State
    { wch: 28 }, // Address
    { wch: 12 }, // Pincode
    { wch: 24 }, // Tags
    { wch: 12 }, // Deal Value
    { wch: 12 }, // Created At
    { wch: 12 }, // Updated At
  ];

  XLSX.writeFile(workbook, filename);
}
