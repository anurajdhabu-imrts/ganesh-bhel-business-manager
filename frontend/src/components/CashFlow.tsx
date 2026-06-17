import React, { useState } from "react";
import { SystemData } from "../types";
import { ArrowUpRight, ArrowDownLeft, IndianRupee, Layers, FileText, CheckCircle } from "lucide-react";

interface CashFlowProps {
  data: SystemData;
}

export default function CashFlowManager({ data }: CashFlowProps) {
  // Let's build a chronological list of Cash Ledger transactions
  // Cash book start balance. Seed: ₹72,500
  let runningCash = 72500;

  interface CashTransaction {
    id: string;
    date: string;
    type: 'Inflow' | 'Outflow';
    category: string;
    description: string;
    amount: number;
    runningBalance: number;
  }

  const cashList: CashTransaction[] = [];

  // 1. Gather Cash Sales (Inflow)
  data.sales.forEach(s => {
    if (s.cashCollection > 0) {
      cashList.push({
        id: "sales_" + s.id,
        date: s.date,
        type: 'Inflow',
        category: 'Sales Receipt',
        description: `Petpooja cash sales collection`,
        amount: s.cashCollection,
        runningBalance: 0
      });
    }
  });

  // 2. Gather Cash Purchases (Outflow)
  data.purchases.forEach(p => {
    if (p.paymentMode === 'Cash' || p.paymentMode === 'Credit') { // assuming cash settlement models
      cashList.push({
        id: "pur_" + p.id,
        date: p.date,
        type: 'Outflow',
        category: 'Procurement SKU',
        description: `Paid cash to ${p.vendorName || "supplier"} for ${p.itemName}`,
        amount: p.amount,
        runningBalance: 0
      });
    }
  });

  // 3. Gather Cash Advances given (Outflow)
  data.advances.forEach(a => {
    // loans are typically paid in cash
    cashList.push({
      id: "adv_" + a.id,
      date: a.date,
      type: 'Outflow',
      category: 'Staff Advance',
      description: `Loan advance released to ${a.staffName}`,
      amount: a.amount,
      runningBalance: 0
    });
  });

  // 4. Gather Cash Welfare Expenses (Outflow)
  data.welfareExpenses.forEach(we => {
    cashList.push({
      id: "welfare_" + we.id,
      date: we.date,
      type: 'Outflow',
      category: 'Welfare Perks',
      description: `Paid ${we.category} notes: ${we.notes || "groceries"}`,
      amount: we.amount,
      runningBalance: 0
    });
  });

  // 5. Gather Cash Salary released (Outflow)
  data.salaries.forEach(sal => {
    if (sal.paymentMode === 'Cash') {
      cashList.push({
        id: "sal_" + sal.id,
        date: sal.paymentDate,
        type: 'Outflow',
        category: 'Payroll Outlay',
        description: `Month salary released to ${sal.staffName}`,
        amount: sal.netPayable,
        runningBalance: 0
      });
    }
  });

  // Sort chronologically by date
  cashList.sort((a,b) => a.date.localeCompare(b.date));

  // Compute running balance
  cashList.forEach(t => {
    if (t.type === 'Inflow') {
      runningCash += t.amount;
    } else {
      runningCash -= t.amount;
    }
    t.runningBalance = runningCash;
  });

  const totalInflows = cashList.filter(t => t.type === 'Inflow').reduce((sum, t) => sum + t.amount, 0);
  const totalOutflows = cashList.filter(t => t.type === 'Outflow').reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="space-y-6">
      {/* KPI summaries */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center space-x-3.5">
          <div className="p-3 bg-emerald-50 text-emerald-550 rounded-xl">
            <ArrowUpRight className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-gray-400">Total cash inflow</div>
            <div className="text-base font-extrabold text-emerald-600 font-mono">₹{totalInflows.toLocaleString()}</div>
            <p className="text-[9px] text-gray-400">From counter cash retail collections</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center space-x-3.5">
          <div className="p-3 bg-rose-50 text-rose-550 rounded-xl">
            <ArrowDownLeft className="w-5 h-5 text-rose-500" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-gray-400">Total cash payment out</div>
            <div className="text-base font-extrabold text-rose-600 font-mono">₹{totalOutflows.toLocaleString()}</div>
            <p className="text-[9px] text-gray-400">Suppliers + Payroll + Welfare rents</p>
          </div>
        </div>

        <div className="bg-gradient-to-tr from-slate-900 to-gray-800 rounded-3xl p-4 text-white flex items-center space-x-3.5">
          <div className="p-3 bg-orange-500 text-white rounded-xl">
            <IndianRupee className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-extrabold text-orange-400">Available vault cash</div>
            <div className="text-lg font-black text-white font-mono">₹{runningCash.toLocaleString()}</div>
            <p className="text-[9px] text-slate-300">Target balance physical count</p>
          </div>
        </div>
      </div>

      {/* Cash ledger log */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
          <div>
            <h3 className="font-extrabold text-gray-800 text-sm">
              {data.language === 'mr' ? "गल्ला रोख खाते पुस्तक (Cash Book)" : "Cash In Hand Book (T-Ledger)"}
            </h3>
            <p className="text-[10px] text-gray-400">
              {data.language === 'mr' ? "वास्तवात आणि कॅश रजिस्ट्रर मधील रकमांची जुळवणी तपासा." : "Consolidated running balances of physical cash operations."}
            </p>
          </div>
          <span className="text-[10px] bg-orange-100 text-orange-800 font-bold px-2 py-0.5 rounded">
            Audit Ledger Active
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-gray-400 font-bold uppercase text-[9px] tracking-wider">
                <th className="p-3">Reference Date</th>
                <th className="p-3">Cash Flow Type</th>
                <th className="p-3">Account Category</th>
                <th className="p-3">Voucher Detail Description</th>
                <th className="p-3">Amount Action</th>
                <th className="p-3 text-right">Running cash bank Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 font-medium text-gray-700">
              {cashList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-gray-400">
                    No cash transactions recorded. Add sales or purchases!
                  </td>
                </tr>
              ) : (
                [...cashList].reverse().map((t, idx) => (
                  <tr key={t.id + idx} className="hover:bg-gray-50/50 transition">
                    <td className="p-3 font-semibold text-gray-950">{t.date}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wide tracking-wider ${
                        t.type === 'Inflow' ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' : 'bg-rose-50 text-rose-800 border border-rose-100'
                      }`}>
                        {t.type}
                      </span>
                    </td>
                    <td className="p-3 font-semibold text-gray-800">{t.category}</td>
                    <td className="p-3 text-gray-500 italic max-w-xs truncate">{t.description}</td>
                    <td className="p-3 font-mono">
                      {t.type === 'Inflow' ? (
                        <span className="text-emerald-600 font-extrabold">+ ₹{t.amount.toLocaleString()}</span>
                      ) : (
                        <span className="text-rose-600 font-extrabold">- ₹{t.amount.toLocaleString()}</span>
                      )}
                    </td>
                    <td className="p-3 font-mono font-extrabold text-slate-800 text-right">
                      ₹{t.runningBalance.toLocaleString()}
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
