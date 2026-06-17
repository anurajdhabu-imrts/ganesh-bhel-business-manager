import React, { useState } from "react";
import { SystemData } from "../types";
import { Download, Clipboard, FileText, Calendar, Search, CheckCircle } from "lucide-react";

interface ReportsProps {
  data: SystemData;
}

export default function ReportsManager({ data }: ReportsProps) {
  const [startDate, setStartDate] = useState("2026-06-01");
  const [endDate, setEndDate] = useState("2026-06-15");
  const [selectedModule, setSelectedModule] = useState<'sales' | 'purchases' | 'salaries' | 'advances' | 'welfare'>('sales');
  const [copied, setCopied] = useState(false);

  // Apply range filters
  const filteredSales = data.sales.filter(s => s.date >= startDate && s.date <= endDate);
  const filteredPurchases = data.purchases.filter(p => p.date >= startDate && p.date <= endDate);
  const filteredSalaries = data.salaries.filter(sal => sal.paymentDate >= startDate && sal.paymentDate <= endDate);
  const filteredAdvances = data.advances.filter(a => a.date >= startDate && a.date <= endDate);
  const filteredWelfare = data.welfareExpenses.filter(e => e.date >= startDate && e.date <= endDate);

  // CSV Generator
  const handleDownloadCSV = () => {
    let csvContent = "";
    let fileName = `GaneshBhel_${selectedModule}_Report.csv`;

    if (selectedModule === 'sales') {
      csvContent = "Date,Total Sales,Cash Collection,UPI Collection,Swiggy,Zomato,Remarks\n";
      filteredSales.forEach(s => {
        csvContent += `${s.date},${s.totalSales},${s.cashCollection},${s.upiCollection},${s.swiggyCollection},${s.zomatoCollection},"${s.remarks || ""}"\n`;
      });
    } else if (selectedModule === 'purchases') {
      csvContent = "Date,Type,Vendor,Item,Category,Quantity,Unit,Rate,Total Cost,PayMode,Invoice,Remarks\n";
      filteredPurchases.forEach(p => {
        csvContent += `${p.date},${p.purchaseType},"${p.vendorName}","${p.itemName}",${p.category},${p.quantity},${p.unit},${p.rate},${p.amount},${p.paymentMode},"${p.invoiceNumber || ""}","${p.remarks || ""}"\n`;
      });
    } else if (selectedModule === 'salaries') {
      csvContent = "Payment Date,Helper,MonthYear,Base Salary,Advance Recovery,Deductions,Net Paid,Mode\n";
      filteredSalaries.forEach(sal => {
        csvContent += `${sal.paymentDate},"${sal.staffName}",${sal.monthYear},${sal.baseSalary},${sal.advanceRecovery},${sal.otherDeductions},${sal.netPayable},${sal.paymentMode}\n`;
      });
    } else if (selectedModule === 'advances') {
      csvContent = "Date,Helper,Granted,Recovered,Outstanding,Reason,Authority\n";
      filteredAdvances.forEach(a => {
        csvContent += `${a.date},"${a.staffName}",${a.amount},${a.recoveredAmount},${a.amount - a.recoveredAmount},"${a.reason}",${a.givenBy}\n`;
      });
    } else if (selectedModule === 'welfare') {
      csvContent = "Date,Helper Name,Category,Amount Spend,Notes\n";
      filteredWelfare.forEach(we => {
        csvContent += `${we.date},"${we.staffName}",${we.category},${we.amount},"${we.notes || ""}"\n`;
      });
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Clipboard excel generator
  const handleCopyClipboard = () => {
    let bulkText = "";

    if (selectedModule === 'sales') {
      bulkText = "Date\tGross Sales\tCash\tUPI Pay\tAggregatory Dev\tRemarks\n";
      filteredSales.forEach(s => {
        bulkText += `${s.date}\t${s.totalSales}\t${s.cashCollection}\t${s.upiCollection}\t${s.swiggyCollection + s.zomatoCollection}\t${s.remarks || ""}\n`;
      });
    } else if (selectedModule === 'purchases') {
      bulkText = "Date\tType\tSupplier\tMaterial\tAmount\tPayMode\tInvoice\n";
      filteredPurchases.forEach(p => {
        bulkText += `${p.date}\t${p.purchaseType}\t${p.vendorName}\t${p.itemName}\t${p.amount}\t${p.paymentMode}\t${p.invoiceNumber}\n`;
      });
    } else if (selectedModule === 'salaries') {
      bulkText = "DatePaid\tHelper\tBase\tLoanRecovered\tNetReleased\n";
      filteredSalaries.forEach(sal => {
        bulkText += `${sal.paymentDate}\t${sal.staffName}\t${sal.baseSalary}\t${sal.advanceRecovery}\t${sal.netPayable}\n`;
      });
    } else if (selectedModule === 'advances') {
      bulkText = "Date\tHelper\tGranted\tRecovered\tOutstanding\tReason\n";
      filteredAdvances.forEach(a => {
        bulkText += `${a.date}\t${a.staffName}\t${a.amount}\t${a.recoveredAmount}\t${a.amount - a.recoveredAmount}\t${a.reason}\n`;
      });
    } else if (selectedModule === 'welfare') {
      bulkText = "Date\tStaffBeneficiary\tCategory\tAmount\tNotes\n";
      filteredWelfare.forEach(we => {
        bulkText += `${we.date}\t${we.staffName}\t${we.category}\t${we.amount}\t${we.notes || ""}\n`;
      });
    }

    navigator.clipboard.writeText(bulkText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="space-y-6">
      {/* Search Filter ribbon */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs w-full lg:w-auto">
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Reports Segment</label>
            <select 
              value={selectedModule} 
              onChange={e => setSelectedModule(e.target.value as any)} 
              className="bg-gray-50 border border-gray-200 rounded-lg p-2.5 font-bold text-gray-700 outline-none w-full"
            >
              <option value="sales">Receipts Summary (गल्ला विक्री)</option>
              <option value="purchases">Vouchers purchases (खरेदी)</option>
              <option value="salaries">Payroll released (पगार)</option>
              <option value="advances">Staff advance ledger (उचल)</option>
              <option value="welfare">Perks welfare (रूम/कल्याण)</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Start range Date</label>
            <input 
              type="date" 
              value={startDate} 
              onChange={e => setStartDate(e.target.value)} 
              className="bg-gray-50 border border-gray-200 rounded-lg p-2 font-mono outline-none w-full" 
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">End range Date</label>
            <input 
              type="date" 
              value={endDate} 
              onChange={e => setEndDate(e.target.value)} 
              className="bg-gray-50 border border-gray-200 rounded-lg p-2 font-mono outline-none w-full" 
            />
          </div>

          <div className="flex items-end justify-end space-x-1.5 pt-4">
            <button
              onClick={handleCopyClipboard}
              className="p-2.5 bg-slate-50 border border-gray-200 hover:bg-slate-100/50 rounded-lg cursor-pointer text-gray-600 font-bold flex items-center space-x-1 relative"
              title="Copy spreadsheet tab data"
            >
              <Clipboard className="w-4 h-4" />
              <span>{copied ? "Copied Excel!" : "Copy Tab"}</span>
            </button>
            <button
              onClick={handleDownloadCSV}
              className="p-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg cursor-pointer flex items-center space-x-1 font-bold"
              title="Download clean CSV sheet"
            >
              <Download className="w-4 h-4" />
              <span>Download csv</span>
            </button>
          </div>
        </div>

      </div>

      {/* Structured dynamic rendering sheet reports */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden" id="pdf-printable-grid">
        <div className="p-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/50 print:hidden">
          <h3 className="font-extrabold text-gray-800 text-sm uppercase tracking-tight flex items-center space-x-1">
            <FileText className="w-4 h-4 text-orange-500" />
            <span>Compiled reports segment: {selectedModule}</span>
          </h3>
          <span className="text-[10px] bg-slate-100 text-slate-800 font-bold px-2 rounded-full py-0.5 font-mono">
            Range: [{startDate} &middot; {endDate}]
          </span>
        </div>

        <div className="overflow-x-auto">
          {selectedModule === 'sales' && (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-gray-400 font-bold uppercase text-[9px] tracking-wider">
                  <th className="p-3">Reference Date</th>
                  <th className="p-3">Gross sales revenue</th>
                  <th className="p-3">Cash collection</th>
                  <th className="p-3 font-semibold">UPI pay fraction</th>
                  <th className="p-3">Swiggy & Zomato credits</th>
                  <th className="p-3">Remarks Summary</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 font-medium text-gray-700">
                {filteredSales.length === 0 ? (
                  <tr><td colSpan={6} className="p-6 text-center text-gray-400">No date range sales match parameters.</td></tr>
                ) : (
                  filteredSales.map(s => (
                    <tr key={s.id} className="hover:bg-gray-50/50 transition">
                      <td className="p-3 font-mono font-bold">{s.date}</td>
                      <td className="p-3 font-extrabold text-orange-600 font-mono">₹{s.totalSales.toLocaleString()}</td>
                      <td className="p-3 font-mono">₹{s.cashCollection.toLocaleString()}</td>
                      <td className="p-3 text-emerald-600 font-extrabold font-mono">₹{s.upiCollection.toLocaleString()}</td>
                      <td className="p-3 text-rose-500 font-mono">₹{(s.swiggyCollection + s.zomatoCollection).toLocaleString()}</td>
                      <td className="p-3 text-gray-505 italic max-w-xs truncate">{s.remarks || "-"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {selectedModule === 'purchases' && (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-gray-400 font-bold uppercase text-[9px] tracking-wider">
                  <th className="p-3">Date</th>
                  <th className="p-3">Voucher Type</th>
                  <th className="p-3">Material Vendor Name</th>
                  <th className="p-3">SKU Name</th>
                  <th className="p-3">Total cost</th>
                  <th className="p-3">PayMode</th>
                  <th className="p-3">Invoice Number</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 font-medium text-gray-700">
                {filteredPurchases.length === 0 ? (
                  <tr><td colSpan={7} className="p-6 text-center text-gray-400">No purchases matching inputs.</td></tr>
                ) : (
                  filteredPurchases.map(p => (
                    <tr key={p.id} className="hover:bg-gray-50/50">
                      <td className="p-3 font-mono font-bold">{p.date}</td>
                      <td className="p-3 font-black text-[10px] text-gray-400 uppercase">{p.purchaseType}</td>
                      <td className="p-3 font-extrabold text-gray-800">{p.vendorName}</td>
                      <td className="p-3">{p.itemName} ({p.quantity} {p.unit})</td>
                      <td className="p-3 font-bold text-orange-650 font-mono">₹{p.amount.toLocaleString()}</td>
                      <td className="p-3 font-semibold text-gray-650">{p.paymentMode}</td>
                      <td className="p-3 font-mono font-bold text-[10px] text-gray-400">{p.invoiceNumber || "-"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {selectedModule === 'salaries' && (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-gray-400 font-bold uppercase text-[9px] tracking-wider">
                  <th className="p-3">Payment Date</th>
                  <th className="p-3">Helper Name</th>
                  <th className="p-3">Reported Cycle Month</th>
                  <th className="p-3">Base payout</th>
                  <th className="p-3">Deducted advances</th>
                  <th className="p-3">Final Cash Net Paid</th>
                  <th className="p-3">Mode</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 font-medium text-gray-700">
                {filteredSalaries.length === 0 ? (
                  <tr><td colSpan={7} className="p-6 text-center text-gray-400">No salaries disbursed in range.</td></tr>
                ) : (
                  filteredSalaries.map(sal => (
                    <tr key={sal.id} className="hover:bg-gray-50/50">
                      <td className="p-3 font-mono font-bold">{sal.paymentDate}</td>
                      <td className="p-3 font-extrabold text-gray-800">{sal.staffName}</td>
                      <td className="p-3 font-bold text-orange-650 font-mono">{sal.monthYear}</td>
                      <td className="p-3 font-mono">₹{sal.baseSalary.toLocaleString()}</td>
                      <td className="p-3 text-rose-500 font-mono">-₹{sal.advanceRecovery.toLocaleString()}</td>
                      <td className="p-3 text-emerald-600 font-extrabold font-mono text-[13px]">₹{sal.netPayable.toLocaleString()}</td>
                      <td className="p-3">{sal.paymentMode}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {selectedModule === 'advances' && (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-gray-400 font-bold uppercase text-[9px] tracking-wider">
                  <th className="p-3">Date Released</th>
                  <th className="p-3">Helper Name</th>
                  <th className="p-3">Disbursed loan</th>
                  <th className="p-3">Deducted Recovered</th>
                  <th className="p-3">Outstanding balance</th>
                  <th className="p-3">Reason</th>
                  <th className="p-3">Authority Sanction</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 font-medium text-gray-700">
                {filteredAdvances.length === 0 ? (
                  <tr><td colSpan={7} className="p-6 text-center text-gray-400">No active advances in range.</td></tr>
                ) : (
                  filteredAdvances.map(a => (
                    <tr key={a.id} className="hover:bg-gray-50/50">
                      <td className="p-3 font-mono font-bold">{a.date}</td>
                      <td className="p-3 font-extrabold text-gray-800">{a.staffName}</td>
                      <td className="p-3 font-mono">₹{a.amount.toLocaleString()}</td>
                      <td className="p-3 text-emerald-600 font-mono">₹{a.recoveredAmount.toLocaleString()}</td>
                      <td className="p-3 text-rose-600 font-extrabold font-mono">₹{(a.amount - a.recoveredAmount).toLocaleString()}</td>
                      <td className="p-3 text-gray-505 italic">{a.reason}</td>
                      <td className="p-3 font-bold text-slate-700">{a.givenBy}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {selectedModule === 'welfare' && (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-gray-400 font-bold uppercase text-[9px] tracking-wider">
                  <th className="p-2">Date</th>
                  <th className="p-2">Welfare Recipient</th>
                  <th className="p-2">Category type</th>
                  <th className="p-2">Cost Spent</th>
                  <th className="p-2">Full Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 font-medium text-gray-700">
                {filteredWelfare.length === 0 ? (
                  <tr><td colSpan={5} className="p-6 text-center text-gray-400">No welfare costs registered.</td></tr>
                ) : (
                  filteredWelfare.map(we => (
                    <tr key={we.id} className="hover:bg-gray-50/50">
                      <td className="p-3 font-mono font-bold">{we.date}</td>
                      <td className="p-3 font-extrabold text-gray-800">{we.staffName}</td>
                      <td className="p-3 text-orange-700 font-bold">[ {we.category} ]</td>
                      <td className="p-3 font-extrabold font-mono text-orange-650">₹{we.amount.toLocaleString()}</td>
                      <td className="p-3 text-gray-505 italic">{we.notes || "-"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

        </div>
      </div>
    </div>
  );
}
