import React, { useState } from "react";
import { SalaryPayment, SystemData } from "../types";
import { PlusCircle, ShieldAlert, Sparkles, Printer, DollarSign, Eye, UserCheck, Calendar } from "lucide-react";

interface SalariesProps {
  data: SystemData;
  onAddSalary: (sal: SalaryPayment) => void;
}

export default function SalariesManager({ data, onAddSalary }: SalariesProps) {
  const [showForm, setShowForm] = useState(false);
  const [staffId, setStaffId] = useState("");
  const [monthYear, setMonthYear] = useState("2026-06");
  const [advanceRecovery, setAdvanceRecovery] = useState("");
  const [otherDeductions, setOtherDeductions] = useState("");
  const [paymentMode, setPaymentMode] = useState<'Cash' | 'UPI' | 'Direct Transfer'>('Cash');
  const [remarks, setRemarks] = useState("");

  const [activeSlip, setActiveSlip] = useState<SalaryPayment | null>(null);

  const selectedStaff = data.staff.find(s => s.id === staffId);
  const baseSalary = selectedStaff ? selectedStaff.salary : 0;
  const recoveryAmt = Number(advanceRecovery || 0);
  const deductionsAmt = Number(otherDeductions || 0);
  const finalNetPayable = baseSalary - recoveryAmt - deductionsAmt;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffId || !monthYear) return;

    const staffMember = data.staff.find(s => s.id === staffId);
    if (!staffMember) return;

    if (finalNetPayable < 0) {
      alert("Error: Net payable cannot be negative. Check recoveries or deductions!");
      return;
    }

    const newSal: SalaryPayment = {
      id: "sal_" + Date.now(),
      staffId,
      staffName: staffMember.name,
      monthYear,
      baseSalary,
      advanceRecovery: recoveryAmt,
      otherDeductions: deductionsAmt,
      netPayable: finalNetPayable,
      paymentDate: new Date().toISOString().split("T")[0],
      paymentMode,
      remarks
    };

    onAddSalary(newSal);
    setAdvanceRecovery("");
    setOtherDeductions("");
    setRemarks("");
    setShowForm(false);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Selection layout */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden print:hidden" id="payroll-master-card">
        <div className="p-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
          <div>
            <h3 className="font-extrabold text-gray-800 text-sm">
              {data.language === 'mr' ? "कर्मचारी पगार पुस्तक (Payroll)" : "Monthly Payroll Register"}
            </h3>
            <p className="text-[10px] text-gray-400">
              {data.language === 'mr' ? "कर्मचाऱ्यांचा मासिक पगार हिशोब, कपात आणि उचल वजावट करा." : "Track base salary releases, offset advance settlements, and issue cash slips."}
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-3.5 py-1.5 rounded-lg text-xs flex items-center space-x-1 cursor-pointer transition shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{showForm ? 'Hide Form' : (data.language === 'mr' ? 'पगार नोंदवा' : 'Issue Payroll')}</span>
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="p-5 border-b border-gray-100 space-y-4 bg-gray-50/30 text-xs text-gray-700">
            <div className="bg-orange-50 border border-orange-100 p-3 rounded-lg grid grid-cols-3 gap-2 text-center text-[11px] font-bold text-orange-800 mb-2">
              <div>Base Pay: ₹{baseSalary.toLocaleString()}</div>
              <div>Recoveries: -₹{recoveryAmt.toLocaleString()}</div>
              <div className="text-orange-700">Net Payable: ₹{finalNetPayable.toLocaleString()}</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Select staff worker</label>
                <select required value={staffId} onChange={e => setStaffId(e.target.value)} className="w-full bg-white border border-gray-200 rounded-lg p-2.5 outline-none">
                  <option value="">-- Choose Name --</option>
                  {data.staff.map(s => <option key={s.id} value={s.id}>{s.name} (Base monthly: ₹{s.salary})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Payroll Cycle Month</label>
                <input type="month" required value={monthYear} onChange={e => setMonthYear(e.target.value)} className="w-full bg-white border border-gray-200 rounded-lg p-2.5 outline-none font-bold" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Advance repayment offset (₹)</label>
                <input type="number" placeholder="0" value={advanceRecovery} onChange={e => setAdvanceRecovery(e.target.value)} className="w-full bg-white border border-gray-200 rounded-lg p-2.5 outline-none font-bold font-mono text-emerald-600" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Deductions (late / leave) (₹)</label>
                <input type="number" placeholder="0" value={otherDeductions} onChange={e => setOtherDeductions(e.target.value)} className="w-full bg-white border border-gray-200 rounded-lg p-2.5 outline-none font-bold font-mono text-rose-600" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Disbursement Method</label>
                <select value={paymentMode} onChange={e => setPaymentMode(e.target.value as any)} className="w-full bg-white border border-gray-200 rounded-lg p-2.5 outline-none">
                  <option value="Cash">Cash in Hand</option>
                  <option value="UPI">UPI Transfer</option>
                  <option value="Direct Transfer">Direct Bank NEFT</option>
                </select>
              </div>
              <div className="md:col-span-2 flex gap-2">
                <div className="flex-1">
                  <label className="block text-[10px] font-bold text-gray-300 uppercase mb-1">Internal Remarks</label>
                  <input type="text" placeholder="e.g. Cleared fully, Rahul late deduction included" value={remarks} onChange={e => setRemarks(e.target.value)} className="w-full bg-white border border-gray-200 rounded-lg p-2.5 outline-none" />
                </div>
                <button type="submit" className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-6 py-2.5 rounded-lg text-xs cursor-pointer shadow transition h-[38px] self-end">
                  Disburse Payslip
                </button>
              </div>
            </div>
          </form>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-gray-400 font-bold uppercase text-[9px] tracking-wider">
                <th className="p-3">Payment Date</th>
                <th className="p-3">Salary Cyclical Month</th>
                <th className="p-3">Helper Name</th>
                <th className="p-3">Base Salary</th>
                <th className="p-3">Advance Recovery</th>
                <th className="p-3">Other Ded.</th>
                <th className="p-3">Net Released</th>
                <th className="p-3">Mode</th>
                <th className="p-3 text-right">Receipt slip</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 font-medium text-gray-700">
              {data.salaries.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-6 text-center text-gray-400 w-full block">
                    No Salaries issued yet. Log helper cycles above.
                  </td>
                </tr>
              ) : (
                [...data.salaries].reverse().map(sal => (
                  <tr key={sal.id} className="hover:bg-gray-50/50 transition">
                    <td className="p-3 font-semibold text-gray-950">{sal.paymentDate}</td>
                    <td className="p-3 font-semibold text-orange-600">{sal.monthYear}</td>
                    <td className="p-3 font-bold text-gray-800">{sal.staffName}</td>
                    <td className="p-3 font-mono">₹{sal.baseSalary.toLocaleString()}</td>
                    <td className="p-3 text-rose-500 font-mono">-₹{sal.advanceRecovery.toLocaleString()}</td>
                    <td className="p-3 text-rose-500 font-mono">-₹{sal.otherDeductions.toLocaleString()}</td>
                    <td className="p-3 font-extrabold text-emerald-600 font-mono">₹{sal.netPayable.toLocaleString()}</td>
                    <td className="p-3 font-bold text-gray-600">{sal.paymentMode}</td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => setActiveSlip(sal)}
                        className="bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-100 px-2.5 py-1 rounded font-bold text-[10px] flex items-center space-x-1 inline-flex cursor-pointer transition"
                      >
                        <Eye className="w-3 h-3" />
                        <span>View slip</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payslip preview dialog box - printable */}
      {activeSlip && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto print:static print:bg-transparent print:p-0">
          <div className="bg-white rounded-3xl shadow-2xl p-6 max-w-sm w-full border border-gray-100 relative print:shadow-none print:border-none print:w-full print:max-w-none print:p-0">
            {/* watermark style header */}
            <div className="text-center pb-4 border-b-2 border-dashed border-gray-200">
              <span className="font-extrabold text-xs text-orange-600 uppercase tracking-widest font-mono">
                GANESH BHEL OPERATIONS
              </span>
              <h2 className="text-lg font-black text-gray-900 tracking-tight mt-1">SALARY PAYSLIP CYCLE</h2>
              <p className="text-[9px] text-gray-400 font-bold font-mono">
                Ref ID: PAY_{activeSlip.id.toUpperCase()}
              </p>
            </div>

            {/* Slip Core Info */}
            <div className="space-y-3.5 my-4 text-xs font-semibold text-gray-700">
              <div className="flex justify-between p-2 bg-gray-50 rounded-xl">
                <span className="text-gray-400">Helper Name:</span>
                <span className="text-gray-950 font-bold">{activeSlip.staffName}</span>
              </div>
              <div className="flex justify-between p-2 bg-gray-50 rounded-xl">
                <span className="text-gray-400">Salary cycle month:</span>
                <span className="text-orange-600 font-bold text-right">{activeSlip.monthYear}</span>
              </div>
              <div className="flex justify-between p-2 bg-gray-50 rounded-xl">
                <span className="text-gray-400">Payment Release Date:</span>
                <span className="text-gray-950 font-mono text-right">{activeSlip.paymentDate}</span>
              </div>
              <div className="flex justify-between p-2 bg-gray-50 rounded-xl">
                <span className="text-gray-400">Disbursement Mode:</span>
                <span className="text-gray-800 font-bold text-right">{activeSlip.paymentMode}</span>
              </div>

              {/* Financial Breakdowns */}
              <div className="bg-amber-50/50 p-3 rounded-2xl border border-amber-100 text-[11px] font-bold space-y-1.5 font-mono">
                <div className="flex justify-between text-gray-600">
                  <span>Gross Base Pay:</span>
                  <span>₹{activeSlip.baseSalary.toLocaleString()}/mo</span>
                </div>
                <div className="flex justify-between text-rose-600">
                  <span>(-) Loan Advance recovery:</span>
                  <span>- ₹{activeSlip.advanceRecovery.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-rose-600">
                  <span>(-) Deductions / Offsets:</span>
                  <span>- ₹{activeSlip.otherDeductions.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-emerald-700 pt-2 border-t border-amber-300 font-black text-sm">
                  <span>Net Payable Amount:</span>
                  <span>₹{activeSlip.netPayable.toLocaleString()}</span>
                </div>
              </div>

              {/* Remarks */}
              <div className="p-2.5 bg-gray-50/50 rounded-xl italic text-[10px] text-gray-500 text-center">
                "{activeSlip.remarks || "Salary cleared for the operational cycle."}"
              </div>
            </div>

            {/* Signature fields */}
            <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-dashed border-gray-200 text-[9px] font-bold text-gray-400 text-center">
              <div>
                <div className="h-8 border-b border-gray-200"></div>
                <div className="mt-1 uppercase tracking-wider">Owner signature</div>
              </div>
              <div>
                <div className="h-8 border-b border-gray-200"></div>
                <div className="mt-1 uppercase tracking-wider">Helper receiver signature</div>
              </div>
            </div>

            {/* Close & Print CTA buttons */}
            <div className="mt-6 flex space-x-2 print:hidden justify-end">
              <button
                onClick={() => setActiveSlip(null)}
                className="px-3.5 py-1.5 text-xs text-gray-500 bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer font-bold"
              >
                Close
              </button>
              <button
                onClick={handlePrint}
                className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-4 py-1.5 rounded-lg text-xs flex items-center space-x-1 cursor-pointer shadow-sm"
              >
                <Printer className="w-4 h-4" />
                <span>Print slip</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
