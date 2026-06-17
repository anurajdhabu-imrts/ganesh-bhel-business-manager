import React, { useState } from "react";
import { StaffWelfareExpense, SystemData } from "../types";
import { PlusCircle, Trash2, ShieldAlert, Award, Coffee, Home, Activity } from "lucide-react";

interface WelfareProps {
  data: SystemData;
  onAddExpense: (exp: StaffWelfareExpense) => void;
  onDeleteExpense: (id: string) => void;
}

export default function StaffWelfareManager({ data, onAddExpense, onDeleteExpense }: WelfareProps) {
  const [showForm, setShowForm] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [staffId, setStaffId] = useState("");
  const [category, setCategory] = useState<'Room Rent' | 'Food' | 'Transport' | 'Electricity' | 'Water' | 'Medical' | 'Other'>('Room Rent');
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;

    const staffMember = data.staff.find(s => s.id === staffId);

    const newExp: StaffWelfareExpense = {
      id: "we_" + Date.now(),
      date,
      staffId: staffId || undefined,
      staffName: staffMember?.name || "All Staff",
      category,
      amount: Number(amount),
      notes
    };

    onAddExpense(newExp);
    setAmount("");
    setNotes("");
    setShowForm(false);
  };

  // Calculations
  const rentTotal = data.welfareExpenses.filter(e => e.category === 'Room Rent').reduce((sum, e) => sum + e.amount, 0);
  const foodTotal = data.welfareExpenses.filter(e => e.category === 'Food').reduce((sum, e) => sum + e.amount, 0);
  const grossTotal = data.welfareExpenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center space-x-3.5">
          <div className="p-3 bg-blue-50 text-blue-500 rounded-xl">
            <Home className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-gray-400">Helper Room Rent</div>
            <div className="text-base font-extrabold text-gray-850 font-mono">₹{rentTotal.toLocaleString()}</div>
            <p className="text-[9px] text-gray-400">Total shared apartments</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center space-x-3.5">
          <div className="p-3 bg-teal-50 text-teal-500 rounded-xl">
            <Coffee className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-gray-400">Helper Meals & Tea</div>
            <div className="text-base font-extrabold text-gray-850 font-mono">₹{foodTotal.toLocaleString()}</div>
            <p className="text-[9px] text-gray-400">Staff provisions grocery</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center space-x-3.5">
          <div className="p-3 bg-orange-50 text-orange-500 rounded-xl">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-gray-400">Gross Monthly Welfare</div>
            <div className="text-base font-extrabold text-orange-600 font-mono">₹{grossTotal.toLocaleString()}</div>
            <p className="text-[9px] text-gray-400">Overall non-salary perks</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
          <div>
            <h3 className="font-extrabold text-gray-800 text-sm">
              {data.language === 'mr' ? "कर्मचारी कल्याण व निवास खर्च नोंदणी" : "Welfare & Accommodation Register"}
            </h3>
            <p className="text-[10px] text-gray-400">
              {data.language === 'mr' ? "कर्मचाऱ्यांचे रूमचे भाडे, जेवण खर्च इ. नोंदवा." : "Track non-salary operational expenditures for staff helpers."}
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-3.5 py-1.5 rounded-lg text-xs flex items-center space-x-1 cursor-pointer transition shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{showForm ? 'Hide Form' : (data.language === 'mr' ? 'खर्च नोदवा' : 'Add Welfare Entry')}</span>
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="p-5 border-b border-gray-100 grid grid-cols-1 md:grid-cols-5 gap-4 items-end bg-gray-50/30 text-xs text-gray-700">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Date</label>
              <input type="date" required value={date} onChange={e => setDate(e.target.value)} className="w-full bg-white border border-gray-200 rounded-lg p-2.5 outline-none font-bold" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Benefit Recipient</label>
              <select value={staffId} onChange={e => setStaffId(e.target.value)} className="w-full bg-white border border-gray-200 rounded-lg p-2.5 outline-none">
                <option value="">All Shared Staff (सर्व कर्मचारी)</option>
                {data.staff.map(s => <option key={s.id} value={s.id}>{s.name} ({s.designation})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Expense Category</label>
              <select value={category} onChange={e => setCategory(e.target.value as any)} className="w-full bg-white border border-gray-200 rounded-lg p-2.5 outline-none font-bold">
                <option value="Room Rent">Accommodation (रूम भाडे)</option>
                <option value="Food">Meals & Tea (जेवण/राशन)</option>
                <option value="Transport">Transport (वाहतूक)</option>
                <option value="Electricity">Electricity (लाइट बिल)</option>
                <option value="Water">Drinking Water (पिण्याचे पाणी)</option>
                <option value="Medical">Medical Assitance (दवाखाना मदत)</option>
                <option value="Other">Other perk expense</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Amount Spent (₹)</label>
              <input type="number" required placeholder="0" value={amount} onChange={e => setAmount(e.target.value)} className="w-full bg-white border border-gray-200 rounded-lg p-2.5 outline-none font-bold font-mono" />
            </div>
            <div>
              <button type="submit" className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold p-2.5 rounded-lg text-xs cursor-pointer shadow transition">
                Record Entry
              </button>
            </div>
            <div className="md:col-span-5">
              <label className="block text-[10px] font-bold text-gray-300 uppercase mb-1">Remarks Description</label>
              <input type="text" placeholder="e.g. Month rent for helper block A, vegetable rice stock purchase" value={notes} onChange={e => setNotes(e.target.value)} className="w-full bg-white border border-gray-200 rounded-lg p-2.5 outline-none" />
            </div>
          </form>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-gray-400 font-bold uppercase text-[9px] tracking-wider">
                <th className="p-3">Date</th>
                <th className="p-3">Recipient Staff</th>
                <th className="p-3">Category</th>
                <th className="p-3">Cost Amount</th>
                <th className="p-3">Remarks Summary</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 font-medium text-gray-700">
              {data.welfareExpenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-gray-400">
                    No welfare expenses registered.
                  </td>
                </tr>
              ) : (
                [...data.welfareExpenses].reverse().map(e => (
                  <tr key={e.id} className="hover:bg-gray-50/50 transition">
                    <td className="p-3 font-semibold text-gray-900">{e.date}</td>
                    <td className="p-3 font-bold text-gray-800">{e.staffName}</td>
                    <td className="p-3">
                      <span className="bg-amber-50 text-amber-800 font-extrabold px-2 py-0.5 rounded text-[10px] uppercase border border-amber-100">
                        {e.category}
                      </span>
                    </td>
                    <td className="p-3 font-bold text-orange-600 font-mono">₹{e.amount.toLocaleString()}</td>
                    <td className="p-3 text-gray-500 italic">{e.notes || "-"}</td>
                    <td className="p-3 text-right">
                      {data.userRole === "owner" ? (
                        <button onClick={() => onDeleteExpense(e.id)} className="text-rose-500 hover:text-rose-700 p-1.5 rounded hover:bg-rose-50 transition cursor-pointer">
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
