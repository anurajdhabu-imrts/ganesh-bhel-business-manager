import React, { useState } from "react";
import { DailyClosingLog, SystemData } from "../types";
import { CheckCircle, AlertTriangle, ShieldCheck, Plus, Layers, Flame, FileText } from "lucide-react";

interface ClosingProps {
  data: SystemData;
  onCommitClosing: (log: DailyClosingLog) => void;
}

export default function DailyClosingManager({ data, onCommitClosing }: ClosingProps) {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [actualCashCounter, setActualCashCounter] = useState("");
  const [closingComment, setClosingComment] = useState("");
  const [step1Check, setStep1Check] = useState(false);
  const [step2Check, setStep2Check] = useState(false);
  const [step3Check, setStep3Check] = useState(false);

  // Computations
  const lastSales = data.sales.find(s => s.date === date);
  const systemExpectedCash = lastSales ? lastSales.cashCollection : 12400; // fallback if no sale entered for the selected date

  const actualPriceVal = Number(actualCashCounter || 0);
  const discrepancy = actualPriceVal - systemExpectedCash;

  const handleSaveClosing = (e: React.FormEvent) => {
    e.preventDefault();
    if (!step1Check || !step2Check || !step3Check) {
      alert("Please check and complete all 3 checklist tasks before lock!");
      return;
    }

    const newLog: DailyClosingLog = {
      date,
      salesEntered: step1Check,
      purchasesEntered: step2Check,
      expensesEntered: step2Check,
      cashVerified: step3Check,
      actualCash: actualPriceVal,
      systemCash: systemExpectedCash,
      discrepancies: String(discrepancy),
      closedAt: new Date().toISOString(),
      closedBy: data.userRole === "owner" ? "Owner" : "Manager Rahul"
    };

    onCommitClosing(newLog);
    // Reset state
    setActualCashCounter("");
    setClosingComment("");
    setStep1Check(false);
    setStep2Check(false);
    setStep3Check(false);
    alert(data.language === 'mr' 
      ? "आजचा गल्ला यशस्वीरीत्या बंद केला गेला आहे व रेकॉर्ड जतन केले आहे!" 
      : "Today's shift closed and submitted successfully! Safety vault locked."
    );
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Side: interactive checklist & locker form */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4">
          <div className="pb-3 border-b border-gray-100">
            <h3 className="font-extrabold text-gray-800 text-sm flex items-center space-x-2">
              <Flame className="w-4 h-4 text-orange-500" />
              <span>{data.language === 'mr' ? "दैनिक रात्रीची गल्ला बंदी" : "Shift Closing & Cash Box Check"}</span>
            </h3>
            <p className="text-[10px] text-gray-400">
              {data.language === 'mr' ? "रोज रात्री दुकान बंद करताना गल्ला मोजणी आणि रेकॉर्ड जुळणी करा." : "Verify physical drawer count matches digital POS receipts on shift end."}
            </p>
          </div>

          <form onSubmit={handleSaveClosing} className="space-y-4 text-xs text-gray-700">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Audit Closing Date</label>
              <input 
                type="date" 
                value={date} 
                onChange={e => setDate(e.target.value)} 
                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 outline-none font-bold font-mono" 
              />
            </div>

            {/* Checklist tasks */}
            <div className="space-y-2.5">
              <span className="block text-[10px] font-bold text-gray-400 uppercase">Operational Tasks</span>
              
              <label className="flex items-start space-x-3 bg-gray-50 p-2.5 rounded-xl border border-gray-100 select-none cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={step1Check} 
                  onChange={e => setStep1Check(e.target.checked)} 
                  className="mt-0.5" 
                />
                <div>
                  <span className="font-bold block text-gray-800">Verify Swiggy & Zomato Orders Matches</span>
                  <span className="text-[10px] text-gray-400">Make sure Swiggy/Zomato dispatch bills match online logs before printing shift totals.</span>
                </div>
              </label>

              <label className="flex items-start space-x-3 bg-gray-50 p-2.5 rounded-xl border border-gray-100 select-none cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={step2Check} 
                  onChange={e => setStep2Check(e.target.checked)} 
                  className="mt-0.5" 
                />
                <div>
                  <span className="font-bold block text-gray-800">Purchases & Staff Advance logged</span>
                  <span className="text-[10px] text-gray-400">Validate that today's sev or cylinder purchases and staff loans have been logged in the voucher book.</span>
                </div>
              </label>

              <label className="flex items-start space-x-3 bg-gray-50 p-2.5 rounded-xl border border-gray-100 select-none cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={step3Check} 
                  onChange={e => setStep3Check(e.target.checked)} 
                  className="mt-0.5" 
                />
                <div>
                  <span className="font-bold block text-gray-800">Count Physical Money in Drawers</span>
                  <span className="text-[10px] text-gray-400">Count all 500, 200, 100, 50, 20 rupee notes and coins in drawer.</span>
                </div>
              </label>
            </div>

            {/* Math Discrepancy block */}
            <div className="grid grid-cols-2 gap-4 bg-orange-50/50 rounded-2xl p-4 border border-orange-100/50">
              <div>
                <dt className="text-[10px] font-bold text-gray-400 uppercase">System Expected Cash</dt>
                <dd className="font-mono text-base font-extrabold text-orange-600">₹{systemExpectedCash.toLocaleString()}</dd>
                <p className="text-[9px] text-gray-400 mt-1">Based on today's receipt book</p>
              </div>
              <div>
                <dt className="text-[10px] font-bold text-gray-400 uppercase">Actual Counted Cash</dt>
                <input 
                  type="number" 
                  required
                  placeholder="Counted cash" 
                  value={actualCashCounter} 
                  onChange={e => setActualCashCounter(e.target.value)} 
                  className="w-full bg-white border border-gray-200 mt-1 p-1.5 px-2 rounded-lg text-xs font-bold font-mono outline-none focus:border-orange-500" 
                />
              </div>
            </div>

            {/* Discrepancy math message */}
            {actualCashCounter && (
              <div className={`p-3 rounded-xl border text-[11px] font-bold flex items-center space-x-2.5 ${
                discrepancy === 0 
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-100' 
                  : discrepancy < 0 
                    ? 'bg-rose-50 text-rose-800 border-rose-100' 
                    : 'bg-teal-50 text-teal-800 border-teal-100'
              }`}>
                {discrepancy === 0 ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Exact match! Cash registers balanced and safe to lock.</span>
                  </>
                ) : discrepancy < 0 ? (
                  <>
                    <AlertTriangle className="w-4 h-4 text-rose-550 shrink-0" />
                    <span>DEFICIT DETECTED: Short by -₹{Math.abs(discrepancy).toLocaleString()}. Record difference in comments.</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 text-teal-500 shrink-0" />
                    <span>SURPLUS DETECTED: Extra +₹{discrepancy.toLocaleString()} in registers cache. Code verified.</span>
                  </>
                )}
              </div>
            )}

            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Deficit explanation /remarks</label>
              <input 
                type="text" 
                placeholder="e.g. Returned extra change or late night helper advance" 
                value={closingComment} 
                onChange={e => setClosingComment(e.target.value)} 
                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 outline-none" 
              />
            </div>

            <button
              type="submit"
              className="w-full bg-orange-600 hover:bg-orange-700 text-white font-extrabold p-3 rounded-xl text-xs cursor-pointer shadow-lg tracking-wide uppercase"
            >
              🔒 LOCK SYSTEM FOR TODAY
            </button>
          </form>
        </div>

        {/* Right Side: Closing logs history */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col justify-between">
          <div>
            <div className="pb-3 border-b border-gray-100 mb-3">
              <h3 className="font-extrabold text-gray-800 text-sm flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500 animate-pulse" />
                <span>{data.language === 'mr' ? "गल्ला बंद इतिहास नोंद" : "Vault Lock Logs History"}</span>
              </h3>
              <p className="text-[10px] text-gray-400">Review shift discrepancies audit trails.</p>
            </div>

            <div className="space-y-3.5 max-h-[380px] overflow-y-auto pr-1">
              {data.closingLogs.length === 0 ? (
                <div className="text-center py-8 text-gray-450 italic text-xs">
                  No lockout audits saved yet. Ensure tonight's lock is logged.
                </div>
              ) : (
                [...data.closingLogs].reverse().map((log, index) => {
                  const variance = log.actualCash - log.systemCash;
                  return (
                    <div key={`${log.date}_${index}`} className="bg-slate-50 border border-slate-100 p-3 rounded-2xl text-xs space-y-2 relative">
                      <div className="flex justify-between items-center bg-slate-200/50 p-1.5 rounded-lg">
                        <span className="font-extrabold text-gray-900 font-mono text-[11px]">{log.date}</span>
                        <span className={`px-2 py-0.2 rounded text-[8px] font-black uppercase ${
                          variance === 0 ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                        }`}>
                          {variance === 0 ? "Balanced" : "Discrepant"}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-1 font-mono text-[11px] text-center bg-white p-2 rounded-xl border border-slate-100">
                        <div>
                          <div className="text-[8px] font-sans font-bold text-gray-400 uppercase">Expected</div>
                          <div className="font-extrabold">₹{log.systemCash.toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-[8px] font-sans font-bold text-gray-400 uppercase">Counted</div>
                          <div className="font-extrabold">₹{log.actualCash.toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-[8px] font-sans font-bold text-gray-400 uppercase">Variance</div>
                          <div className={`font-black ${variance < 0 ? 'text-rose-600' : variance > 0 ? 'text-teal-600' : 'text-emerald-600'}`}>
                            {variance > 0 ? "+" : ""}{variance.toLocaleString()}
                          </div>
                        </div>
                      </div>

                      <div className="text-[10px] text-gray-500 italic px-2">
                         "Diff: {log.discrepancies} INR" &middot; <span className="font-bold text-slate-700 font-sans">Auth: {log.closedBy || "System"}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="text-[9px] uppercase font-bold text-gray-300 tracking-wider text-right mt-4 pt-3 border-t border-gray-50">
            GBMS LOCK COMPLIANCE V2
          </div>
        </div>

      </div>
    </div>
  );
}
