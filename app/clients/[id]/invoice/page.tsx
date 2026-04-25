"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowLeft, Receipt, Loader2, Plus, Trash2, DollarSign,
  Calendar, Send, Check,
} from "lucide-react";

interface Client {
  id: string;
  name: string;
  email?: string;
  company?: string;
}

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

export default function CreateInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  // Form state
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { id: "1", description: "", quantity: 1, unitPrice: 0 },
  ]);
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [sendEmail, setSendEmail] = useState(true);

  useEffect(() => {
    void fetchClient();
    // Set default due date to 30 days from now
    const defaultDue = new Date();
    defaultDue.setDate(defaultDue.getDate() + 30);
    setDueDate(defaultDue.toISOString().split("T")[0]);
  }, [id]);

  async function fetchClient() {
    try {
      const res = await fetch(`/api/clients/${id}`);
      const data = await res.json() as { ok: boolean; client?: Client };
      if (data.ok && data.client) {
        setClient(data.client);
      }
    } catch (err) {
      console.error("Failed to fetch client:", err);
    } finally {
      setLoading(false);
    }
  }

  function addLineItem() {
    setLineItems([
      ...lineItems,
      { id: Date.now().toString(), description: "", quantity: 1, unitPrice: 0 },
    ]);
  }

  function removeLineItem(itemId: string) {
    if (lineItems.length === 1) {
      toast.error("At least one line item is required");
      return;
    }
    setLineItems(lineItems.filter((item) => item.id !== itemId));
  }

  function updateLineItem(itemId: string, field: keyof LineItem, value: string | number) {
    setLineItems(
      lineItems.map((item) =>
        item.id === itemId ? { ...item, [field]: value } : item
      )
    );
  }

  function calculateTotal() {
    return lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  }

  async function handleCreateInvoice() {
    // Validation
    if (lineItems.some((item) => !item.description || item.quantity <= 0 || item.unitPrice <= 0)) {
      toast.error("Please fill in all line items with valid values");
      return;
    }

    if (!dueDate) {
      toast.error("Please set a due date");
      return;
    }

    setCreating(true);
    try {
      const total = calculateTotal();

      // Create invoice via Stripe
      const res = await fetch("/api/payments/create-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: id,
          lineItems: lineItems.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            amount: item.unitPrice * 100, // Convert to cents
          })),
          dueDate: new Date(dueDate).toISOString(),
          notes,
          sendEmail,
        }),
      });

      const data = await res.json() as { ok: boolean; invoiceId?: string; invoiceUrl?: string };

      if (data.ok) {
        // Log activity in CRM
        await fetch(`/api/clients/${id}/activities`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "invoice",
            title: `Invoice Created - $${total.toFixed(2)}`,
            description: sendEmail ? "Invoice sent to client" : "Invoice created (not sent)",
            status: "pending",
          }),
        });

        toast.success(sendEmail ? "Invoice created and sent!" : "Invoice created successfully!");
        router.push(`/clients/${id}`);
      } else {
        toast.error("Failed to create invoice");
      }
    } catch (err) {
      console.error("Invoice creation error:", err);
      toast.error("Failed to create invoice");
    } finally {
      setCreating(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-t-bg text-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-white/40" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen bg-t-bg text-white flex items-center justify-center">
        <p className="text-white/40">Client not found</p>
      </div>
    );
  }

  const total = calculateTotal();

  return (
    <div className="min-h-screen bg-t-bg text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Back */}
        <Link
          href={`/clients/${id}`}
          className="inline-flex items-center gap-1.5 text-xs text-white/30 hover:text-white/60 transition mb-6"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to {client.name}
        </Link>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-black text-white mb-2">Create Invoice</h1>
          <p className="text-sm text-white/40">
            Generate a Stripe invoice for {client.company || client.name}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Line Items */}
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-black text-white">Line Items</h2>
                <button
                  onClick={addLineItem}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/[0.07] text-xs font-bold text-white/60 hover:text-white hover:border-[#f5a623]/20 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Item
                </button>
              </div>

              <div className="space-y-3">
                {lineItems.map((item, index) => (
                  <div
                    key={item.id}
                    className="grid grid-cols-12 gap-3 p-4 rounded-xl border border-white/[0.07] bg-white/[0.02]"
                  >
                    {/* Description */}
                    <div className="col-span-12 sm:col-span-6">
                      <label className="block text-[10px] font-bold text-white/40 mb-1.5">
                        Description
                      </label>
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => updateLineItem(item.id, "description", e.target.value)}
                        placeholder="e.g., Website design"
                        className="w-full px-3 py-2 rounded-lg border border-white/[0.07] bg-white/[0.02] text-sm text-white placeholder-white/30 outline-none focus:border-[#f5a623]/50 transition"
                      />
                    </div>

                    {/* Quantity */}
                    <div className="col-span-6 sm:col-span-2">
                      <label className="block text-[10px] font-bold text-white/40 mb-1.5">
                        Qty
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateLineItem(item.id, "quantity", parseInt(e.target.value) || 1)}
                        className="w-full px-3 py-2 rounded-lg border border-white/[0.07] bg-white/[0.02] text-sm text-white outline-none focus:border-[#f5a623]/50 transition"
                      />
                    </div>

                    {/* Unit Price */}
                    <div className="col-span-6 sm:col-span-3">
                      <label className="block text-[10px] font-bold text-white/40 mb-1.5">
                        Price
                      </label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(e) => updateLineItem(item.id, "unitPrice", parseFloat(e.target.value) || 0)}
                          className="w-full pl-9 pr-3 py-2 rounded-lg border border-white/[0.07] bg-white/[0.02] text-sm text-white outline-none focus:border-[#f5a623]/50 transition"
                        />
                      </div>
                    </div>

                    {/* Delete */}
                    <div className="col-span-12 sm:col-span-1 flex items-end">
                      <button
                        onClick={() => removeLineItem(item.id)}
                        disabled={lineItems.length === 1}
                        className="w-full sm:w-auto px-3 py-2 rounded-lg border border-white/[0.07] bg-white/[0.02] text-white/60 hover:text-red-400 hover:border-red-400/20 transition disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Remove item"
                      >
                        <Trash2 className="w-4 h-4 mx-auto" />
                      </button>
                    </div>

                    {/* Subtotal */}
                    <div className="col-span-12 flex items-center justify-end gap-2 pt-2 border-t border-white/[0.05]">
                      <span className="text-xs text-white/40">Subtotal:</span>
                      <span className="text-sm font-bold text-white">
                        ${(item.quantity * item.unitPrice).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Due Date & Notes */}
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-white/60 mb-2">
                  Due Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-white/[0.07] bg-white/[0.02] text-white outline-none focus:border-[#f5a623]/50 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-white/60 mb-2">
                  Notes (optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add payment terms, thank you message, etc..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-white/[0.07] bg-white/[0.02] text-white placeholder-white/30 outline-none focus:border-[#f5a623]/50 transition resize-none"
                />
              </div>

              <label className="flex items-center gap-3 p-3 rounded-xl border border-white/[0.07] bg-white/[0.02] cursor-pointer hover:border-[#f5a623]/20 transition">
                <input
                  type="checkbox"
                  checked={sendEmail}
                  onChange={(e) => setSendEmail(e.target.checked)}
                  className="w-4 h-4 rounded accent-[#f5a623]"
                />
                <div>
                  <p className="text-sm font-bold text-white">Send invoice to client</p>
                  <p className="text-xs text-white/40">
                    Email invoice to {client.email || "client's email"}
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6 sticky top-6">
              <h2 className="text-sm font-black text-white mb-4">Invoice Summary</h2>

              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/40">Client</span>
                  <span className="text-xs font-bold text-white">{client.name}</span>
                </div>
                {client.company && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-white/40">Company</span>
                    <span className="text-xs font-bold text-white">{client.company}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/40">Items</span>
                  <span className="text-xs font-bold text-white">{lineItems.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/40">Due Date</span>
                  <span className="text-xs font-bold text-white">
                    {dueDate ? new Date(dueDate).toLocaleDateString() : "Not set"}
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-white/[0.07] mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-white/60">Subtotal</span>
                  <span className="text-sm font-bold text-white">${total.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-base font-black text-white">Total</span>
                  <span className="text-2xl font-black text-[#f5a623]">${total.toFixed(2)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <button
                  onClick={() => void handleCreateInvoice()}
                  disabled={creating || total === 0}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#f5a623] to-[#e07850] text-white font-bold hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {creating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      {sendEmail ? <Send className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                      {sendEmail ? "Create & Send" : "Create Invoice"}
                    </>
                  )}
                </button>
                <Link
                  href={`/clients/${id}`}
                  className="block w-full px-6 py-3 rounded-xl border border-white/[0.07] bg-white/[0.02] text-white font-bold text-center hover:bg-white/[0.04] transition"
                >
                  Cancel
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
