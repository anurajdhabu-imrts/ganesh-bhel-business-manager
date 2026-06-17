import React, { useState } from "react";
import { DailySales, SystemData } from "../types";
import { PlusCircle, Trash2, ShieldAlert, Sparkles, CreditCard, ChefHat, ShoppingBag, ArrowRight, TrendingUp } from "lucide-react";

interface DailySalesProps {
  data: SystemData;
  onAddSales: (sales: DailySales) => void;
  onDeleteSales: (id: string) => void;
  onAddItemizedSales?: (sales: DailySales, rawStockDeductions: { inventoryItemId: string; quantity: number }[]) => void;
}

export default function DailySalesManager({ data, onAddSales, onDeleteSales, onAddItemizedSales }: DailySalesProps) {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [totalSales, setTotalSales] = useState("");
  const [cash, setCash] = useState("");
  const [upi, setUpi] = useState("");
  const [card, setCard] = useState("");
  const [swiggy, setSwiggy] = useState("");
  const [zomato, setZomato] = useState("");
  const [other, setOther] = useState("");
  const [remarks, setRemarks] = useState("");
  const [showForm, setShowForm] = useState(false);

  // Unified Dish wise sales quantities
  const [itemizedQuantities, setItemizedQuantities] = useState<Record<string, number>>({});

  // Totals calculations
  const totalUPI = data.sales.reduce((sum, s) => sum + s.upiCollection, 0);
  const totalCash = data.sales.reduce((sum, s) => sum + s.cashCollection, 0);
  const grossTotal = data.sales.reduce((sum, s) => sum + s.totalSales, 0);

  // Active products for plate sales entry
  const activeProducts = (data.products || []).filter((p) => p.status === "Active");

  // Real-time calculation of estimated gross sales
  const calculatedItemizedGross = Object.entries(itemizedQuantities).reduce((sum, [prodId, qty]) => {
    const prod = activeProducts.find((p) => p.id === prodId);
    return sum + (prod ? Number(prod.sellingPrice) * Number(qty) : 0);
  }, 0);

  // Real-time calculation of daily raw stocks composition to be adjusted
  const groupedDeductions = (() => {
    const deductions: Record<string, { name: string; quantity: number; unit: string }> = {};
    Object.entries(itemizedQuantities).forEach(([prodId, qty]) => {
      const numQty = Number(qty);
      if (!qty || numQty <= 0) return;
      const prod = activeProducts.find((p) => p.id === prodId);
      if (!prod || !prod.recipeJson) return;
      try {
        const recipe = JSON.parse(prod.recipeJson);
        recipe.forEach((ing: any) => {
          const invItem = (data.inventory || []).find((inv) => inv.id === ing.inventoryItemId);
          if (!invItem) return;
          const totalDeductionNeeded = Number(ing.quantity) * numQty;
          if (!deductions[invItem.id]) {
            deductions[invItem.id] = {
              name: invItem.name,
              quantity: 0,
              unit: invItem.unit,
            };
          }
          deductions[invItem.id].quantity += totalDeductionNeeded;
        });
      } catch (err) {}
    });
    return Object.entries(deductions).map(([id, val]) => ({ id, ...val }));
  })();

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const tot = Number(totalSales);
    const cVal = Number(cash || 0);
    const uVal = Number(upi || 0);
    const crVal = Number(card || 0);
    const sVal = Number(swiggy || 0);
    const zVal = Number(zomato || 0);
    const oVal = Number(other || 0);
    
    const splitSum = cVal + uVal + crVal + sVal + zVal + oVal;

    if (tot !== splitSum) {
      alert(data.language === 'mr'
        ? `तपासणी त्रुटी: एकूण विक्री (₹${tot}) आणि सर्व भरणा पद्धतींची बेरीज (₹${splitSum}) जुळली पाहिजे. फरक: ₹${Math.abs(tot - splitSum)}`
        : `Validation Error: Collection breakdown total (₹${splitSum}) must equal gross Total Sales (₹${tot}). Difference: ₹${Math.abs(tot - splitSum)}`
      );
      return;
    }

    // Build raw stock deductions list for food recipes linked
    const rawStockDeductions: { inventoryItemId: string; quantity: number }[] = [];
    Object.entries(itemizedQuantities).forEach(([prodId, qty]) => {
      const numQty = Number(qty);
      if (!qty || numQty <= 0) return;
      const prod = activeProducts.find((p) => p.id === prodId);
      if (!prod || !prod.recipeJson) return;
      try {
        const recipe = JSON.parse(prod.recipeJson);
        recipe.forEach((ing: any) => {
          rawStockDeductions.push({
            inventoryItemId: ing.inventoryItemId,
            quantity: Number(ing.quantity) * numQty,
          });
        });
      } catch (err) {}
    });

    // Automatically construct notes explaining plates
    let plateSummary = "";
    const soldItems = Object.entries(itemizedQuantities)
      .map(([id, qty]) => {
        const p = activeProducts.find(x => x.id === id);
        const numQty = Number(qty);
        return p && numQty > 0 ? `${numQty} ${p.name}` : null;
      })
      .filter(Boolean);
    if (soldItems.length > 0) {
      plateSummary = ` [Plates: ${soldItems.join(", ")}]`;
    }

    const newSales: DailySales = {
      id: date,
      date,
      totalSales: tot,
      cashCollection: cVal,
      upiCollection: uVal,
      cardCollection: crVal,
      swiggyCollection: sVal,
      zomatoCollection: zVal,
      otherCollection: oVal,
      remarks: remarks ? `${remarks}${plateSummary}` : (plateSummary ? `Automated recipe stock adjustment:${plateSummary}` : "")
    };

    if (onAddItemizedSales) {
      onAddItemizedSales(newSales, rawStockDeductions);
    } else {
      onAddSales(newSales);
    }

    // Reset Form fields
    setTotalSales("");
    setCash("");
    setUpi("");
    setCard("");
    setSwiggy("");
    setZomato("");
    setOther("");
    setRemarks("");
    setItemizedQuantities({});
    setShowForm(false);
  };

  const copyEstimatedToTotal = () => {
    setTotalSales(String(calculatedItemizedGross));
  };

  const hasItemizedSales = Object.values(itemizedQuantities).some(v => Number(v) > 0);
  const currentSplitSum = Number(cash || 0) + Number(upi || 0) + Number(card || 0) + Number(swiggy || 0) + Number(zomato || 0) + Number(other || 0);
  const splitDiff = Number(totalSales || 0) - currentSplitSum;

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center space-x-3">
          <div className="p-3 rounded-xl bg-orange-50 text-orange-500">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-extrabold text-gray-400">Gross Sales Volume</div>
            <div className="text-lg font-black text-gray-800 font-mono">₹{grossTotal.toLocaleString()}</div>
            <p className="text-[9px] text-gray-400">Total reported cycles</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center space-x-3">
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-500">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-extrabold text-gray-400">UPI Collection Fraction</div>
            <div className="text-lg font-black text-emerald-600 font-mono">
              {grossTotal > 0 ? ((totalUPI / grossTotal) * 100).toFixed(1) : 0}%
            </div>
            <p className="text-[9px] text-gray-400">₹{totalUPI.toLocaleString()} UPI Volume</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center space-x-3">
          <div className="p-3 rounded-xl bg-amber-50 text-amber-500">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-extrabold text-gray-400">Cash Collection Fraction</div>
            <div className="text-lg font-black text-amber-600 font-mono">
              {grossTotal > 0 ? ((totalCash / grossTotal) * 100).toFixed(1) : 0}%
            </div>
            <p className="text-[9px] text-gray-400">₹{totalCash.toLocaleString()} Cash in hand</p>
          </div>
        </div>
      </div>

      {/* Daily Galla Single Form Container */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
          <div>
            <h3 className="font-extrabold text-gray-800 text-sm">
              {data.language === 'mr' ? "दैनिक विक्री नोंद वही व कट्टा साठा" : "Daily Sales Entry Drawer"}
            </h3>
            <p className="text-[10px] text-gray-400">
              {data.language === 'mr' ? "विक्री झालेल्या प्लेट्स टाका - कच्चा माल आपोआप कमी होईल आणि गल्ला नोंदवा." : "Enter total dishes sold for recipe stock deduction, and enter actual cash registry collections."}
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center space-x-1.5 cursor-pointer shadow-sm transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{showForm ? (data.language === 'mr' ? 'बंद करा' : 'Collapse Drawer') : (data.language === 'mr' ? 'नवीन गल्ला नोंदवा' : 'Record Galla')}</span>
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleFormSubmit} className="p-5 border-b border-gray-100 bg-gray-50/10 space-y-6">
            
            {/* SECTION 1: Dish Plate Sales */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-y-2 border-b border-gray-100 pb-2">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-xs">1</div>
                  <h4 className="font-extrabold text-gray-800 text-xs uppercase tracking-wider">
                    {data.language === 'mr' ? "खाद्यपदार्थ प्लेट्स विक्री (कच्चा माल वजा करण्यासाठी)" : "Step 1: Dish Plate Sales (For Stock Deduction)"}
                  </h4>
                </div>
                {calculatedItemizedGross > 0 && (
                  <div className="flex items-center space-x-2 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100 shrink-0">
                    <span className="text-[10px] text-emerald-800 font-extrabold">
                      {data.language === 'mr' ? `अंदाज विक्री: ₹${calculatedItemizedGross}` : `Estimated: ₹${calculatedItemizedGross}`}
                    </span>
                    <button
                      type="button"
                      onClick={copyEstimatedToTotal}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-2 py-0.5 rounded text-[9px] transition cursor-pointer flex items-center space-x-1"
                    >
                      <span>{data.language === 'mr' ? "येथे भरा" : "Use this amount"}</span>
                      <ArrowRight className="w-2.5 h-2.5" />
                    </button>
                  </div>
                )}
              </div>

              {activeProducts.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No active products. Please add products first.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  {activeProducts.map((p) => {
                    let recLength = 0;
                    try {
                      if (p.recipeJson) {
                        recLength = JSON.parse(p.recipeJson).length;
                      }
                    } catch {}

                    return (
                      <div key={p.id} className="p-2.5 bg-white border border-gray-200 hover:border-orange-200 rounded-xl transition flex justify-between items-center shadow-xs">
                        <div className="truncate pr-1">
                          <span className="font-extrabold text-slate-900 text-[11px] block truncate leading-snug">
                            {p.name}
                          </span>
                          <span className="text-[9px] font-bold text-slate-400 font-mono shrink-0">
                            ₹{p.sellingPrice} • {recLength > 0 ? `${recLength} items` : 'no recipe'}
                          </span>
                        </div>
                        <input
                          type="number"
                          min="0"
                          placeholder="0"
                          value={itemizedQuantities[p.id] || ""}
                          onChange={(e) => {
                            const val = e.target.value === "" ? 0 : Number(e.target.value);
                            setItemizedQuantities({
                              ...itemizedQuantities,
                              [p.id]: val,
                            });
                          }}
                          className="w-14 bg-slate-50 border border-gray-200 hover:border-gray-300 focus:bg-white focus:border-orange-500 rounded-md p-1.5 py-1 text-center font-bold text-xs outline-none"
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* SECTION 2: Galla Sales & Register Breakdown */}
            <div className="space-y-4 border-t border-gray-200/60 pt-5">
              <div className="flex items-center space-x-2 border-b border-gray-100 pb-2">
                <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-xs">2</div>
                <h4 className="font-extrabold text-gray-800 text-xs uppercase tracking-wider">
                  {data.language === 'mr' ? "दैनिक प्रत्यक्ष गल्ला व बँक जमा तपशील" : "Step 2: Collect Daily Cash & Digital Collections"}
                </h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase mb-1">Receipt Date</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-xs outline-none focus:border-orange-500 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase mb-1">
                    {data.language === 'mr' ? "एकूण गल्ला विक्री (₹)" : "Gross Total Sales (₹)"}
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 15000"
                    value={totalSales}
                    onChange={(e) => setTotalSales(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-xs font-black text-slate-900 outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <div className="bg-amber-50 rounded-xl p-2 px-3 border border-amber-100 flex items-center justify-between h-full">
                    <span className="text-[10px] font-bold text-amber-900">{data.language === 'mr' ? 'गोळा जमा तपासणी:' : 'Sum of payment methods:'}</span>
                    <span className="text-sm font-black text-amber-700 font-mono">₹{currentSplitSum.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Six Key Breakdown Inputs */}
              <div className="grid grid-cols-2 md:grid-cols-6 gap-3 pt-1">
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Cash In Hand (₹)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={cash}
                    onChange={(e) => setCash(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-xs font-bold outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">UPI (GPay / PhonePe)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={upi}
                    onChange={(e) => setUpi(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-xs font-bold outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Card Swipes (₹)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={card}
                    onChange={(e) => setCard(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-xs font-bold outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Swiggy Orders (₹)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={swiggy}
                    onChange={(e) => setSwiggy(e.target.value)}
                    className="w-full bg-white border border-gray-250 rounded-lg p-2.5 text-xs font-extrabold text-orange-600 outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Zomato Orders (₹)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={zomato}
                    onChange={(e) => setZomato(e.target.value)}
                    className="w-full bg-white border border-gray-250 rounded-lg p-2.5 text-xs font-extrabold text-rose-600 outline-none focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Other Pay (₹)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={other}
                    onChange={(e) => setOther(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-xs font-bold outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* Live Stocks Deduction Preview */}
            {hasItemizedSales && (
              <div className="bg-slate-50 p-4 rounded-xl border border-gray-200 text-xs">
                <span className="block text-[10px] font-extrabold text-slate-400 uppercase mb-1.5">
                  🧪 Auto Stock Deductions Preview (कच्चा माल साठा कपात पूर्वावलोकन):
                </span>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {groupedDeductions.map((ded) => (
                    <div key={ded.id} className="flex justify-between items-center bg-white p-1.5 px-2.5 rounded-lg border border-gray-150 font-bold">
                      <span className="text-slate-600 truncate">{ded.name}</span>
                      <span className="font-mono text-xs text-red-600">-{ded.quantity.toFixed(3)} {ded.unit}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Validation Alerts and Submit */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center border-t border-gray-150 pt-4">
              <div className="md:col-span-2">
                <input
                  type="text"
                  placeholder="Daily Remarks / Notes (एकूण नोंदींचे टिपण)"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-xs outline-none focus:border-orange-500 font-medium"
                />
              </div>
              <div className="flex flex-col">
                {splitDiff !== 0 && totalSales ? (
                  <div className="text-[10px] text-red-600 font-extrabold text-center mb-1 bg-red-50 p-1 rounded border border-red-100">
                    {data.language === 'mr' ? `तफावत: ₹${splitDiff} जुळवणे शिल्लक आहे` : `Difference: ₹${splitDiff} to match Gross`}
                  </div>
                ) : (
                  totalSales && (
                    <div className="text-[10px] text-emerald-700 font-black text-center mb-1 bg-emerald-50 p-1 rounded border border-emerald-100">
                      ✓ Everything Matches Perfectly!
                    </div>
                  )
                )}
                <button
                  type="submit"
                  disabled={totalSales ? splitDiff !== 0 : false}
                  className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-extrabold p-3 rounded-xl text-xs cursor-pointer shadow-md transition"
                >
                  {data.language === 'mr' ? 'दैनिक नोंद जतन करा व साठा कपात करा' : 'Deduct Stock & Save Daily Voucher'}
                </button>
              </div>
            </div>
          </form>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-gray-400 font-bold uppercase text-[9px] tracking-wider">
                <th className="p-3">{data.language === 'mr' ? "तारीख" : "Date"}</th>
                <th className="p-3">{data.language === 'mr' ? "एकूण विक्री" : "Gross Total"}</th>
                <th className="p-3">Cash Collection</th>
                <th className="p-3">UPI Pay</th>
                <th className="p-3">Swiggy & Zomato</th>
                <th className="p-3">Remarks</th>
                <th className="p-3 text-right">{data.language === 'mr' ? 'कृती' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 font-medium text-gray-700">
              {data.sales.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-gray-400">
                    No daily summary entries reported yet. Use the record button above.
                  </td>
                </tr>
              ) : (
                [...data.sales].reverse().map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50/50 transition">
                    <td className="p-3 font-semibold text-gray-900">{s.date}</td>
                    <td className="p-3 font-extrabold text-orange-600 font-mono">₹{s.totalSales.toLocaleString()}</td>
                    <td className="p-3 font-mono">₹{s.cashCollection.toLocaleString()}</td>
                    <td className="p-3 text-emerald-600 font-extrabold font-mono">₹{s.upiCollection.toLocaleString()}</td>
                    <td className="p-3 text-red-600 font-mono">₹{((s.swiggyCollection || 0) + (s.zomatoCollection || 0)).toLocaleString()}</td>
                    <td className="p-3 text-gray-500 italic max-w-xs truncate" title={s.remarks}>{s.remarks || "-"}</td>
                    <td className="p-3 text-right">
                      {data.userRole === "owner" ? (
                        <button
                          onClick={() => onDeleteSales(s.id)}
                          className="text-rose-500 hover:text-rose-700 p-1.5 rounded hover:bg-rose-50 transition cursor-pointer"
                        >
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
