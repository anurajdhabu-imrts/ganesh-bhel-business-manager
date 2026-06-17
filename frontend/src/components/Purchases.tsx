import React, { useState } from "react";
import { Purchase, SystemData } from "../types";
import { PlusCircle, Trash2, ShieldAlert, ShoppingBag, Folder, DollarSign, Calendar } from "lucide-react";

interface PurchasesProps {
  data: SystemData;
  onAddPurchase: (pur: Purchase) => void;
  onDeletePurchase: (id: string) => void;
}

export default function PurchasesManager({ data, onAddPurchase, onDeletePurchase }: PurchasesProps) {
  const [showForm, setShowForm] = useState(false);

  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [purchaseType, setPurchaseType] = useState<'Shop' | 'Staff'>('Shop');
  const [vendorName, setVendorName] = useState("");
  const [itemName, setItemName] = useState("");
  const [category, setCategory] = useState("Potato");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("kg");
  const [rate, setRate] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentMode, setPaymentMode] = useState<'Cash' | 'UPI' | 'Card' | 'Credit'>('UPI');
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [remarks, setRemarks] = useState("");

  // Filters state
  const [filterType, setFilterType] = useState<string>("All");
  const [filterMode, setFilterMode] = useState<string>("All");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const totalAmount = Number(amount) || (Number(quantity || 0) * Number(rate || 0));

    const newPur: Purchase = {
      id: "pur_" + Date.now(),
      date,
      purchaseType,
      vendorName,
      itemName,
      category,
      quantity: Number(quantity || 1),
      unit,
      rate: Number(rate || totalAmount),
      amount: totalAmount,
      paymentMode,
      invoiceNumber: invoiceNumber,
      remarks: remarks
    };

    onAddPurchase(newPur);
    // Reset state
    setVendorName("");
    setItemName("");
    setQuantity("");
    setRate("");
    setAmount("");
    setInvoiceNumber("");
    setRemarks("");
    setShowForm(false);
  };

  const filteredPurchases = data.purchases.filter(p => {
    if (filterType !== "All" && p.purchaseType !== filterType) return false;
    if (filterMode !== "All" && p.paymentMode !== filterMode) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top filter ribbon */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div className="flex flex-wrap gap-2 text-xs">
          <div>
            <span className="text-[10px] font-bold text-gray-400 block mb-1">TYPE FILTER</span>
            <select value={filterType} onChange={e => setFilterType(e.target.value)} className="bg-gray-50 border border-gray-200 rounded p-1.5 font-bold text-gray-700">
              <option value="All">All Purchases (सर्व)</option>
              <option value="Shop">Shop Materials only (दुकान खरेदी)</option>
              <option value="Staff">Staff welfare supply (स्टाफ खरेदी)</option>
            </select>
          </div>
          <div>
            <span className="text-[10px] font-bold text-gray-400 block mb-1">PAYMENT FILTER</span>
            <select value={filterMode} onChange={e => setFilterMode(e.target.value)} className="bg-gray-50 border border-gray-200 rounded p-1.5 font-bold text-gray-700">
              <option value="All">All Payment Modes</option>
              <option value="UPI">UPI</option>
              <option value="Cash">Cash</option>
              <option value="Card">Card</option>
              <option value="Credit">Vendor Credit</option>
            </select>
          </div>
        </div>

        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-3.5 py-1.5 rounded-lg text-xs flex items-center space-x-1 cursor-pointer transition shadow-sm"
        >
          <PlusCircle className="w-4 h-4" />
          <span>{showForm ? 'Hide Form' : (data.language === 'mr' ? 'खरेदी नोंदवा' : 'Record Purchase')}</span>
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Purchase Type</label>
              <select value={purchaseType} onChange={e => setPurchaseType(e.target.value as any)} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 outline-none font-bold">
                <option value="Shop">Shop Material (दुकान माल)</option>
                <option value="Staff">Staff Welfare grocery (स्टाफ माल)</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Date</label>
              <input type="date" required value={date} onChange={e => setDate(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 outline-none font-bold" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Supplier / Vendor Name</label>
              <input type="text" required placeholder="e.g. Pune Veg Wholesale" value={vendorName} onChange={e => setVendorName(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 outline-none" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Item Name</label>
              <input type="text" required placeholder="e.g. Red onions" value={itemName} onChange={e => setItemName(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 outline-none" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Category</label>
              <select value={category} onChange={e => setCategory(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 outline-none font-bold">
                <option value="Sev">Sev (शेव)</option>
                <option value="Puri">Puri (पुरी)</option>
                <option value="Potato">Potato (बटाटा)</option>
                <option value="Onion">Onion (कांदा)</option>
                <option value="Tomato">Tomato (टोमॅटो)</option>
                <option value="Gas Cylinder">Gas Cylinder (गॅस सिलिंडर)</option>
                <option value="Packaging">Packaging (पॅकेजिंग)</option>
                <option value="Milk">Milk / Tea</option>
                <option value="Rent">Rent (दुकान भाडे)</option>
                <option value="Electricity Bill">Light Bill (वीज बिल)</option>
                <option value="Water Bill">Water Bill (पाणी बिल)</option>
                <option value="Salary Payment">Salary (कर्मचाऱ्यांचे वेतन)</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Quantity</label>
                <input type="number" step="any" placeholder="10" value={quantity} onChange={e => setQuantity(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 outline-none font-mono" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Unit</label>
                <input type="text" placeholder="kg" value={unit} onChange={e => setUnit(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 outline-none" />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Rate per unit (₹)</label>
              <input type="number" step="any" placeholder="25" value={rate} onChange={e => setRate(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 outline-none font-mono" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Total Bill Amount (₹)</label>
              <input type="number" required placeholder="calculated" value={amount} onChange={e => setAmount(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 outline-none font-bold font-mono text-orange-600" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Payment Mode</label>
              <select value={paymentMode} onChange={e => setPaymentMode(e.target.value as any)} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 outline-none">
                <option value="UPI">UPI Transfer</option>
                <option value="Cash">Cash in Hand</option>
                <option value="Card">Debit Card</option>
                <option value="Credit">Vendor Credit (उधारी)</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Invoice Number</label>
              <input type="text" placeholder="e.g. HP/885" value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 outline-none font-mono" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-300 uppercase mb-1">Bill Photo Template</label>
              <div className="border border-dashed border-gray-200 bg-gray-50 rounded-lg p-2 text-center text-gray-400 text-[10px] cursor-pointer">
                ✓ Ready for Mobile Shoot
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Remarks / Comments Summary</label>
            <input type="text" placeholder="e.g. Emergency purchase Potato shortage" value={remarks} onChange={e => setRemarks(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 outline-none" />
          </div>

          <button type="submit" className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-6 py-2.5 rounded-lg text-xs cursor-pointer shadow-md">
            Save Purchase Voucher
          </button>
        </form>
      )}

      {/* List Ledger */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-gray-400 font-bold uppercase text-[9px] tracking-wider">
                <th className="p-3">Date</th>
                <th className="p-3">Voucher Type</th>
                <th className="p-3">Vendor</th>
                <th className="p-3">Item Name</th>
                <th className="p-3">Qty & Unit</th>
                <th className="p-3">Cost Amount</th>
                <th className="p-3">Pay Mode</th>
                <th className="p-3">Invoice</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 font-medium text-gray-700">
              {filteredPurchases.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-6 text-center text-gray-400">
                    No procurement records match your filters.
                  </td>
                </tr>
              ) : (
                [...filteredPurchases].reverse().map(p => (
                  <tr key={p.id} className="hover:bg-gray-50/50 transition">
                    <td className="p-3 font-semibold text-gray-900">{p.date}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                        p.purchaseType === 'Shop' ? 'bg-orange-50 text-orange-700' : 'bg-blue-50 text-blue-700'
                      }`}>
                        {p.purchaseType}
                      </span>
                    </td>
                    <td className="p-3 font-bold text-gray-800">{p.vendorName}</td>
                    <td className="p-3">{p.itemName}</td>
                    <td className="p-3 font-mono">
                      {p.quantity} {p.unit} <span className="text-gray-400 font-semibold text-[10px]">@ {p.rate || 0}</span>
                    </td>
                    <td className="p-3 font-bold text-orange-600 font-mono">₹{p.amount.toLocaleString()}</td>
                    <td className="p-3 font-semibold text-gray-600">{p.paymentMode}</td>
                    <td className="p-3 font-mono text-[10px] text-gray-500">{p.invoiceNumber || "-"}</td>
                    <td className="p-3 text-right">
                      {data.userRole === "owner" ? (
                        <button onClick={() => onDeletePurchase(p.id)} className="text-rose-500 hover:text-rose-700 p-1.5 rounded hover:bg-rose-50 transition cursor-pointer">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      ) : (
                        <ShieldAlert className="w-4 h-4 text-gray-300 ml-auto" title="Limited manager access" />
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
