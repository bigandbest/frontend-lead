import type { InvoiceDetail } from "@/api/invoices";
import type { InvoiceTemplateSettings } from "@/api/invoice-templates";

interface Props {
  invoice: InvoiceDetail;
  templateSettings?: InvoiceTemplateSettings & {
    gstin?: string;
    website?: string;
    companyPhone?: string;
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const RECEIPT_WIDTH = 36; // characters wide

function pad(left: string, right: string, total = RECEIPT_WIDTH): string {
  const gap = total - left.length - right.length;
  return gap > 0 ? left + " ".repeat(gap) + right : left.slice(0, total - right.length - 1) + " " + right;
}

function divider(char = "-", len = RECEIPT_WIDTH): string {
  return char.repeat(len);
}

function center(text: string, len = RECEIPT_WIDTH): string {
  const pad = Math.max(0, Math.floor((len - text.length) / 2));
  return " ".repeat(pad) + text;
}

function formatAmt(n: number): string {
  return n.toFixed(2);
}

function formatDate(d: string | Date | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatTime(d: string | Date | null): string {
  if (!d) return "";
  return new Date(d).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function truncate(s: string, max: number): string {
  return s.length > max ? s.slice(0, max - 1) + "…" : s;
}

function Rule({ marginTop = "4px" }: { marginTop?: string }) {
  return (
    <div
      style={{
        borderTop: "1px dashed #000",
        width: "100%",
        marginTop,
      }}
    />
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ThermalReceiptView({ invoice, templateSettings }: Props) {
  const s = templateSettings ?? {};
  const companyName = "BIG & BEST MART (OPC) PVT LTD";
  const companyAddress =
    "37/1, Central Road, K B Sarani, Uttapara, Madhyamgram, North 24 Parganas, Barasat - II, West Bengal, India, 700129";
  const companyPhone = "+91 7059911480";
  const companyEmail = "bigandbestmart@gmail.com";
  const gstin = (s as any).gstin ?? "";
  const website = (s as any).website ?? "";
  const currency = invoice.currency ?? "INR";
  const symbol = currency === "INR" ? "₹" : currency + " ";

  // Tax calculation
  const taxableAmount = invoice.subtotal - (invoice.discount ?? 0);
  const taxAmount = invoice.taxAmount;
  const cgstAmt = taxAmount / 2;
  const sgstAmt = taxAmount / 2;

  const totalQty = invoice.lineItems.reduce((sum, li) => sum + li.quantity, 0);

  // Transaction/timestamp
  const invoiceTs = new Date(invoice.invoiceDate);
  const transNo = invoice.invoiceNumber.replace(/[^A-Z0-9]/g, "").padEnd(10, "0").slice(0, 10);

  // Customer info
  const customer = invoice.customer;
  const customerGstin =
    (invoice.customerSnapshot as any)?.gstin ??
    (invoice.formData as any)?.gstin ??
    "";

  return (
    <>
      <style>
        {`
          @media print {
            @page {
              size: 58mm auto;
              margin: 0;
            }

            html, body {
              margin: 0 !important;
              padding: 0 !important;
              background: #fff !important;
            }

            .thermal-receipt {
              width: 58mm !important;
              max-width: 58mm !important;
              margin: 0 !important;
              padding: 2mm 1.5mm !important;
              box-sizing: border-box !important;
              font-size: 11px !important;
              line-height: 1.35 !important;
            }
          }
        `}
      </style>
      <div
        className="thermal-receipt"
        style={{
          fontFamily: "'Courier New', Courier, monospace",
          fontSize: "12px",
          lineHeight: "1.5",
          background: "#fff",
          color: "#000",
          width: "min(100%, 340px)",
          padding: "16px 12px",
          margin: "0 auto",
          boxSizing: "border-box",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}
      >
      {/* ── Header ── */}
      {s.logoUrl && (
        <div style={{ textAlign: "center", marginBottom: "8px" }}>
          <img
            src={s.logoUrl}
            alt="logo"
            style={{ maxHeight: "56px", maxWidth: "120px", objectFit: "contain" }}
          />
        </div>
      )}

      <div style={{ textAlign: "center", fontWeight: "bold", fontSize: "14px" }}>
        {companyName}
      </div>

      {companyAddress && (
        <div style={{ textAlign: "center", fontSize: "11px", marginTop: "2px" }}>
          {companyAddress}
        </div>
      )}
      <div style={{ textAlign: "center", fontSize: "11px" }}>
        {companyPhone}
      </div>
      <div style={{ textAlign: "center", fontSize: "11px" }}>
        {companyEmail}
      </div>

      {gstin && (
        <div style={{ textAlign: "center", fontSize: "11px" }}>
          GSTIN: {gstin}
        </div>
      )}

      {/* ── Official Receipt header ── */}
      <Rule marginTop="8px" />
      <div style={{ textAlign: "center", fontWeight: "bold" }}>
        OFFICIAL RECEIPT
      </div>
      <div>
        {pad("DATE: " + formatDate(invoice.invoiceDate), "TIME: " + formatTime(invoice.invoiceDate))}
      </div>
      <div>{"INVOICE NO: " + invoice.invoiceNumber}</div>
      <Rule />

      {website && (
        <div style={{ textAlign: "center", fontWeight: "bold", margin: "4px 0" }}>
          {website.replace(/^https?:\/\//i, "").toUpperCase()}
        </div>
      )}

      {/* ── Bill To ── */}
      <Rule />
      <div style={{ fontWeight: "bold" }}>BILL TO:</div>
      <div>
        {"Name:    "}
        {customer.firstName}
        {customer.lastName ? " " + customer.lastName : ""}
      </div>
      {customerGstin && <div>{"GSTIN:   " + customerGstin}</div>}
      {customer.phone && <div>{"Phone:   " + customer.phone}</div>}
      {customer.email && <div>{"Email:   " + truncate(customer.email, 28)}</div>}
      {(customer.address || customer.city) && (
        <div style={{ wordBreak: "break-word" }}>
          {"Address: "}
          {[customer.address, customer.city, customer.state, customer.pincode]
            .filter(Boolean)
            .join(", ")}
        </div>
      )}

      {/* ── Items Table ── */}
      <Rule />
      <div style={{ fontWeight: "bold", display: "flex", justifyContent: "space-between" }}>
        <span style={{ flex: "2", overflow: "hidden" }}>ITEM</span>
        <span style={{ width: "48px", textAlign: "right" }}>HSN</span>
        <span style={{ width: "32px", textAlign: "right" }}>QTY</span>
        <span style={{ width: "56px", textAlign: "right" }}>PRICE</span>
        <span style={{ width: "60px", textAlign: "right" }}>AMT</span>
      </div>
      <Rule />

      {invoice.lineItems.map((li) => {
        const hsn = li.hsnCode ?? (li as any).metadata?.hsnCode ?? (li as any).metadata?.hsn ?? "";
        return (
          <div key={li.id}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <span
                style={{
                  flex: "2",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  paddingRight: "4px",
                }}
              >
                {li.description}
              </span>
              <span style={{ width: "48px", textAlign: "right", flexShrink: 0, fontSize: "11px" }}>
                {hsn || "—"}
              </span>
              <span style={{ width: "32px", textAlign: "right", flexShrink: 0 }}>
                {li.quantity % 1 === 0 ? li.quantity : li.quantity.toFixed(2)}
              </span>
              <span style={{ width: "56px", textAlign: "right", flexShrink: 0 }}>
                {formatAmt(li.unitPrice)}
              </span>
              <span style={{ width: "60px", textAlign: "right", flexShrink: 0, fontWeight: "600" }}>
                {formatAmt(li.amount)}
              </span>
            </div>
          </div>
        );
      })}

      {/* ── Tax ── */}
      <Rule />
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span>TAXABLE VALUE:</span>
        <span>{formatAmt(taxableAmount)}</span>
      </div>
      {invoice.discount > 0 && (
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>DISCOUNT:</span>
          <span>-{formatAmt(invoice.discount)}</span>
        </div>
      )}
      {taxAmount > 0 && (
        <>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>CGST:</span>
            <span>{formatAmt(cgstAmt)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>SGST:</span>
            <span>{formatAmt(sgstAmt)}</span>
          </div>
        </>
      )}

      <Rule />
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontWeight: "bold",
          fontSize: "14px",
        }}
      >
        <span>TOTAL AMOUNT:</span>
        <span>
          {symbol}
          {formatAmt(invoice.total)}
        </span>
      </div>
      <Rule />

      {/* ── Summary ── */}
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span>TOTAL ITEMS: {invoice.lineItems.length}</span>
        <span>TOTAL QTY: {totalQty % 1 === 0 ? totalQty : totalQty.toFixed(2)}</span>
      </div>
      <Rule />

      {/* ── Payment ── */}
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span>PAYMENT RECEIVED:</span>
        <span>
          {symbol}
          {formatAmt(invoice.total)}
        </span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span>CHANGE:</span>
        <span>{symbol}0.00</span>
      </div>
      <Rule />

      {/* ── Footer ── */}
      <div style={{ textAlign: "center", fontWeight: "bold", marginTop: "4px" }}>
        THANK YOU FOR YOUR BUSINESS!
      </div>
      {website && (
        <div style={{ textAlign: "center", fontSize: "11px" }}>
          For more details, visit our website
        </div>
      )}
      {website && (
        <div style={{ textAlign: "center", fontSize: "11px" }}>{website}</div>
      )}

      {invoice.notes && (
        <>
          <Rule />
          <div style={{ fontSize: "11px" }}>Note: {invoice.notes}</div>
        </>
      )}

      {/* ── VAT Summary ── */}
      <Rule />
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px" }}>
        <span>Zero-Rated Sales:</span>
        <span>0.00</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px" }}>
        <span>Total Sales (Taxable):</span>
        <span>{formatAmt(taxableAmount)}</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px" }}>
        <span>Total VAT/GST:</span>
        <span>{formatAmt(taxAmount)}</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px" }}>
        <span>Total Amount:</span>
        <span>{formatAmt(invoice.total)}</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px" }}>
        <span>Total Discount:</span>
        <span>{formatAmt(invoice.discount)}</span>
      </div>

      {/* ── Transaction ── */}
      <Rule />
      <div style={{ fontSize: "10px" }}>
        Trans No. {transNo} {formatDate(invoice.invoiceDate)} {formatTime(invoice.invoiceDate)}
      </div>
      <Rule />
      <div style={{ textAlign: "center", fontWeight: "bold", fontSize: "11px" }}>
        THIS IS YOUR OFFICIAL TAX INVOICE.
      </div>
      </div>
    </>
  );
}
