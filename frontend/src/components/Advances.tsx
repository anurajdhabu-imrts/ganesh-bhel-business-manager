import React, { useState } from "react";
import { StaffAdvance, SystemData } from "../types";
import { PlusCircle, Trash2, ShieldAlert, Sparkles, UserMinus, UserPlus, HeartHandshake } from "lucide-react";

interface AdvancesProps {
  data: SystemData;
  onAddAdvance: (adv: StaffAdvance) => void;
  onRecoverAdvance: (id: string, amount: number) => void;
  onDeleteAdvance: (id: string) => void;
}

export default function StaffAdvancesManager({ data, onAddAdvance, onRecoverAdvance, onDeleteAdvance }: AdvancesProps) {
  const [showForm, setShowForm] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [staffId, setStaffId] = useState("");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [givenBy, setGivenBy] = useState("Owner");
  const [remarks, setRemarks] = useState("");

  const [recoveryId, setRecoveryId] = useState<string | null>(null);
  const [recoveryAmount, setRecoveryAmount] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffId || !amount) return;

    const staffMember = data.staff.find(s => s.id === staffId);
    if (!staffMember) return;

    const newAdv: StaffAdvance = {
      id: "adv_" + Date.now(),
      date,
      staffId,
      staffName: staffMember.name,
      amount: Number(amount),
      reason,
      givenBy,
      recoveredAmount: 0,
      remarks
    };

    onAddAdvance(newAdv);
    setAmount("");
    setReason("");
    setRemarks("");
    setShowForm(false);
  };

  const handleRecoverConfirm = (id: string, maxLimit: number) => {
    const amt = Number(recoveryAmount);
    if (!amt || amt <= 0) return;
    if (amt > maxLimit) {
      alert(`Error: Recovery amount cannot exceed outstanding balance of ₹${maxLimit}`);
      return;
    }

    onRecoverAdvance(id, amt);
    setRecoveryId(null);
    setRecoveryAmount("");
  };

  // Calculations
  const totalGiven = data.advances.reduce((sum, a) => sum + a.amount, 0);
  const totalRecovered = data.advances.reduce((sum, a) => sum + a.recoveredAmount, 0);
  const outstandingTotal = totalGiven - totalRecovered;

  return (
    <div className="space-y-6">
      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center space-x-3.5">
          <div className="p-3 bg-red-50 text-red-500 rounded-xl">
            <UserPlus className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-gray-400">Total Advances Granted</div>
            <div className="text-base font-extrabold text-gray-850 font-mono">₹{totalGiven.toLocaleString()}</div>
            <p className="text-[9px] text-gray-400">All historical assistant loans</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center space-x-3.5">
          <div className="p-3 bg-emerald-50 text-emerald-500 rounded-xl">
            <UserMinus className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-gray-400">Recoveries Cleared</div>
            <div className="text-base font-extrabold text-emerald-600 font-mono">₹{totalRecovered.toLocaleString()}</div>
            <p className="text-[9px] text-gray-400">Deducted from monthly pay roll</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center space-x-3.5">
          <div className="p-3 bg-amber-50 text-amber-550 rounded-xl">
            <HeartHandshake className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-gray-400">Outstanding advances</div>
            <div className="text-base font-extrabold text-amber-600 font-mono">₹{outstandingTotal.toLocaleString()}</div>
            <p className="text-[9px] text-amber-600 font-bold">Outstanding credit balance</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
          <div>
            <h3 className="font-extrabold text-gray-800 text-sm">
              {data.language === 'mr' ? "स्टाफ ॲडव्हान्स आणि कर्ज खाते पुस्तक" : "Staff Credit & Advance Ledger"}
            </h3>
            <p className="text-[10px] text-gray-400">
              {data.language === 'mr' ? "कर्मचाऱ्यांना दिलेले ॲडव्हान्स उचल आणि परतफेड" : "Manage loans granted, outstanding debit limits, and repayments."}
            </p>
          </div>

          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-3.5 py-1.5 rounded-lg text-xs flex items-center space-x-1 cursor-pointer transition shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{showForm ? 'Hide Form' : (data.language === 'mr' ? 'नवीन उचल नोंदवा' : 'Disburse Advance')}</span>
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="p-5 border-b border-gray-100 grid grid-cols-1 md:grid-cols-4 gap-4 items-end bg-gray-50/30 text-xs">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Select staff helper</label>
              <select required value={staffId} onChange={e => setStaffId(e.target.value)} className="w-full bg-white border border-gray-200 rounded-lg p-2.5 outline-none font-bold">
                <option value="">-- Choose Staff Member --</option>
                {data.staff.map(s => <option key={s.id} value={s.id}>{s.name} ({s.designation})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Date Granted</label>
              <input type="date" required value={date} onChange={e => setDate(e.target.value)} className="w-full bg-white border border-gray-200 rounded-lg p-2.5 outline-none font-bold" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Disbursement Amount (₹)</label>
              <input type="number" required placeholder="0" value={amount} onChange={e => setAmount(e.target.value)} className="w-full bg-white border border-gray-200 rounded-lg p-2.5 outline-none font-bold font-mono" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 font-semibold">Sanctioned By</label>
              <input type="text" value={givenBy} onChange={e => setGivenBy(e.target.value)} className="w-full bg-white border border-gray-200 rounded-lg p-2.5 outline-none" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Reason for Loan Advance</label>
              <input type="text" required placeholder="e.g. Traveling to village, medical aid, family needs" value={reason} onChange={e => setReason(e.target.value)} className="w-full bg-white border border-gray-200 rounded-lg p-2.5 outline-none" />
            </div>
            <div className="md:col-span-2">
              <button type="submit" className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold p-2.5 rounded-lg text-xs cursor-pointer shadow transition">
                Approve & Record Loan
              </button>
            </div>
          </form>
        )}

        {/* Ledger Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-gray-400 font-bold uppercase text-[9px] tracking-wider">
                <th className="p-3">Disbursed Date</th>
                <th className="p-3">Staff Helper Name</th>
                <th className="p-3">Loan Amount</th>
                <th className="p-3">Cumulative Recovered</th>
                <th className="p-3">Outstanding Balance</th>
                <th className="p-3">Reason</th>
                <th className="p-3">Authorized By</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 font-medium text-gray-700">
              {data.advances.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-gray-400 block w-full">
                    No active staff loan advances requested yet.
                  </td>
                </tr>
              ) : (
                [...data.advances].reverse().map(a => {
                  const outstanding = a.amount - a.recoveredAmount;
                  return (
                    <tr key={a.id} className="hover:bg-gray-50/50 transition">
                      <td className="p-3 font-semibold text-gray-900">{a.date}</td>
                      <td className="p-3 font-bold text-gray-800">{a.staffName}</td>
                      <td className="p-3 font-mono font-bold text-gray-800">₹{a.amount.toLocaleString()}</td>
                      <td className="p-3 font-mono text-emerald-600">₹{a.recoveredAmount.toLocaleString()}</td>
                      <td className="p-3 font-mono">
                        {outstanding === 0 ? (
                          <span className="bg-emerald-100 text-emerald-800 text-[9px] font-black uppercase px-2 py-0.5 rounded border border-emerald-200">
                            Fully Settled
                          </span>
                        ) : (
                          <span className="font-extrabold text-rose-600">₹{outstanding.toLocaleString()}</span>
                        )}
                      </td>
                      <td className="p-3 text-gray-500 italic">{a.reason || "-"}</td>
                      <td className="p-3 font-semibold text-slate-800">{a.givenBy || "Owner"}</td>
                      <td className="p-3 text-right">
                        <div className="flex items-center space-x-1.5 justify-end">
                          {outstanding > 0 && (
                            <>
                              {recoveryId === a.id ? (
                                <div className="flex items-center space-x-1">
                                  <input
                                    type="number"
                                    placeholder="Amount"
                                    value={recoveryAmount}
                                    onChange={e => setRecoveryAmount(e.target.value)}
                                    className="w-16 p-1 bg-white border border-gray-350 text-xs font-bold"
                                  />
                                  <button
                                    onClick={() => handleRecoverConfirm(a.id, outstanding)}
                                    className="bg-emerald-500 text-white font-bold p-1 px-1.5 rounded hover:bg-emerald-600"
                                  >
                                    Save
                                  </button>
                                  <button onClick={() => setRecoveryId(null)} className="text-gray-400 p-1">
                                    X
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => { setRecoveryId(a.id); setRecoveryAmount(""); }}
                                  className="text-xs bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-2.5 py-1 rounded font-bold transition border border-emerald-100 cursor-pointer"
                                >
                                  Recover Pay
                                </button>
                              )}
                            </>
                          )}

                          {data.userRole === "owner" ? (
                            <button onClick={() => onDeleteAdvance(a.id)} className="text-rose-500 hover:text-rose-700 p-1.5 rounded hover:bg-rose-50 transition cursor-pointer">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          ) : (
                            <ShieldAlert className="w-4 h-4 text-gray-300 ml-auto" title="Limited manager access" />
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
