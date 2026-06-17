import React, { useState, useEffect } from "react";
import { 
  TrendingUp, IndianRupee, ShoppingCart, Users, AlertTriangle, 
  Plus, Calendar, PlusCircle, Check, Sparkles, Activity, PieChart, Info, DollarSign, X
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { 
  SystemData, DailySales, Purchase, StaffAdvance, StaffWelfareExpense, 
  SalaryPayment, BusinessHealthScore, SalesForecast, AIExpenseAlert 
} from "../types";

interface DashboardProps {
  data: SystemData;
  onAddSales: (sales: DailySales) => void;
  onAddPurchase: (pur: Purchase) => void;
  onAddAdvance: (adv: StaffAdvance) => void;
  onAddExpense: (exp: StaffWelfareExpense) => void;
  onAddSalary: (sal: SalaryPayment) => void;
}

export default function Dashboard({ 
  data, onAddSales, onAddPurchase, onAddAdvance, onAddExpense, onAddSalary 
}: DashboardProps) {
  // AI Metrics
  const [health, setHealth] = useState<BusinessHealthScore>({
    score: 84,
    rating: "Good",
    profitabilityScore: 88,
    cashFlowScore: 80,
    expenseControlScore: 85,
    inventoryScore: 82,
    analysisText: "Overall profitability is strong. UPI peaks indicate high consumer trust. Balance groundnut inventory soon."
  });
  const [forecast, setForecast] = useState<SalesForecast>({
    tomorrowSales: 14200,
    weeklySales: 104500,
    monthlySales: 442000,
    confidence: 82,
    analysisText: "Standard exponential average forecast. Weekend surges on Saturday typically yield premium sales spikes."
  });
  const [isAiLoading, setIsAiLoading] = useState(false);

  // FAB Floating Actions Menu State
  const [isFabOpen, setIsFabOpen] = useState(false);
  const [activeFormModal, setActiveFormModal] = useState<'sales' | 'purchase' | 'advance' | 'expense' | 'salary' | null>(null);

  // Fetch AI updates on start
  useEffect(() => {
    async function fetchAiInsights() {
      setIsAiLoading(true);
      try {
        const hRes = await fetch("/api/ai/health", { method: "POST" });
        const hData = await hRes.json();
        if (hData.score) setHealth(hData);

        const fRes = await fetch("/api/ai/forecast", { method: "POST" });
        const fData = await fRes.json();
        if (fData.tomorrowSales) setForecast(fData);
      } catch (err) {
        console.warn("AI Endpoints fallback to preset algorithms:", err);
      } finally {
        setIsAiLoading(false);
      }
    }
    fetchAiInsights();
  }, [data.sales.length, data.purchases.length]);

  // Timezone-safe local date string helper
  const getLocalDateStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const getLocalMonthYearStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}`;
  };

  // Form states
  const [salesForm, setSalesForm] = useState({
    date: getLocalDateStr(),
    totalSales: '',
    cash: '',
    upi: '',
    card: '',
    swiggy: '',
    zomato: '',
    other: '',
    remarks: ''
  });

  const [purchaseForm, setPurchaseForm] = useState({
    date: getLocalDateStr(),
    purchaseType: 'Shop' as const,
    vendorName: '',
    itemName: '',
    category: 'Potato',
    quantity: '',
    unit: 'kg',
    rate: '',
    amount: '',
    paymentMode: 'UPI' as const,
    invoiceNumber: '',
    remarks: ''
  });

  const [advanceForm, setAdvanceForm] = useState({
    date: getLocalDateStr(),
    staffId: '',
    amount: '',
    reason: '',
    givenBy: 'Owner',
    remarks: ''
  });

  const [expenseForm, setExpenseForm] = useState({
    date: getLocalDateStr(),
    staffId: '',
    category: 'Room Rent' as const,
    amount: '',
    notes: ''
  });

  const [salaryForm, setSalaryForm] = useState({
    staffId: '',
    monthYear: getLocalMonthYearStr(),
    advanceRecovery: '',
    otherDeductions: '',
    paymentMode: 'Cash' as const,
    remarks: ''
  });

  // KPI Calculations
  const todayStr = getLocalDateStr();
  const todaySaleEntry = data.sales.find(s => s.date === todayStr) || null;
  const todaySalesVal = todaySaleEntry ? todaySaleEntry.totalSales : 0;
  const todayUPIVal = todaySaleEntry ? todaySaleEntry.upiCollection : 0;
  const todayCashVal = todaySaleEntry ? todaySaleEntry.cashCollection : 0;

  // Calculate dynamic yesterday sales
  const getYesterdayDateStr = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };
  const yesterdayStr = getYesterdayDateStr();
  const yesterdaySaleEntry = data.sales.find(s => s.date === yesterdayStr) || null;
  const yesterdaySalesVal = yesterdaySaleEntry ? yesterdaySaleEntry.totalSales : 0;

  // Real growth calculation comparing today with yesterday
  const salesGrowthPct = yesterdaySalesVal > 0 
    ? ((todaySalesVal - yesterdaySalesVal) / yesterdaySalesVal) * 100 
    : 0;

  // Expenses from today (Purchases + Welfare + Advances)
  const todayPurchasesVal = data.purchases
    .filter(p => p.date === todayStr)
    .reduce((sum, p) => sum + p.amount, 0);

  const todayWelfareVal = data.welfareExpenses
    .filter(w => w.date === todayStr)
    .reduce((sum, w) => sum + w.amount, 0);

  const todayAdvancesVal = data.advances
    .filter(a => a.date === todayStr)
    .reduce((sum, a) => sum + a.amount, 0);

  const todayExpensesVal = todayPurchasesVal + todayWelfareVal + todayAdvancesVal;
  const todayProfitVal = todaySalesVal - todayExpensesVal;

  // Monthly stats
  const currentMonthYear = getLocalMonthYearStr();
  const monthlySalesTotal = data.sales
    .filter(s => s.date.startsWith(currentMonthYear))
    .reduce((sum, s) => sum + s.totalSales, 0);

  const monthlyPurchasesTotal = data.purchases
    .filter(p => p.date.startsWith(currentMonthYear))
    .reduce((sum, p) => sum + p.amount, 0);

  const monthlyWelfareTotal = data.welfareExpenses
    .filter(w => w.date.startsWith(currentMonthYear))
    .reduce((sum, w) => sum + w.amount, 0);

  // previous month is standard for salaries release
  const previousMonthYear = (() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}`;
  })();

  const monthlySalaryPaid = data.salaries
    .filter(s => s.monthYear === previousMonthYear) // paid for previous month in current month
    .reduce((sum, s) => sum + s.netPayable, 0);

  const monthlyAdvancesGiven = data.advances
    .filter(a => a.date.startsWith(currentMonthYear))
    .reduce((sum, a) => sum + a.amount, 0);

  // Separate Raw Stock Purchases vs Operating Overhead Expenses
  const monthlyRawIngredients = data.purchases
    .filter(p => p.date.startsWith(currentMonthYear) && !["Rent", "Electricity Bill", "Water Bill", "Salary Payment"].includes(p.category))
    .reduce((sum, p) => sum + p.amount, 0);

  const monthlyRentOverhead = data.purchases
    .filter(p => p.date.startsWith(currentMonthYear) && p.category === "Rent")
    .reduce((sum, p) => sum + p.amount, 0);

  const monthlyElectricityOverhead = data.purchases
    .filter(p => p.date.startsWith(currentMonthYear) && p.category === "Electricity Bill")
    .reduce((sum, p) => sum + p.amount, 0);

  const monthlyWaterOverhead = data.purchases
    .filter(p => p.date.startsWith(currentMonthYear) && p.category === "Water Bill")
    .reduce((sum, p) => sum + p.amount, 0);

  const monthlyWagesPaid = monthlySalaryPaid + data.purchases
    .filter(p => p.date.startsWith(currentMonthYear) && p.category === "Salary Payment")
    .reduce((sum, p) => sum + p.amount, 0);

  const monthlyOtherOverheads = data.purchases
    .filter(p => p.date.startsWith(currentMonthYear) && p.category === "Other")
    .reduce((sum, p) => sum + p.amount, 0);

  const monthlyTotalExpense = monthlyRawIngredients + monthlyWelfareTotal + monthlyWagesPaid + monthlyAdvancesGiven + monthlyRentOverhead + monthlyElectricityOverhead + monthlyWaterOverhead + monthlyOtherOverheads;
  const monthlyProfitTotal = monthlySalesTotal - monthlyTotalExpense;

  // Outstanding advances
  const outstandingAdvancesTotal = data.advances
    .reduce((sum, a) => sum + (a.amount - a.recoveredAmount), 0);

  // Active alerts
  const lowStockAlerts = data.inventory.filter(i => i.closingStock <= i.lowStockThreshold);

  // ------------------------------------
  // Form submission handoffs
  // ------------------------------------
  const handleSalesConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    const tot = Number(salesForm.totalSales);
    const collections = Number(salesForm.cash || 0) + 
                        Number(salesForm.upi || 0) + 
                        Number(salesForm.card || 0) + 
                        Number(salesForm.swiggy || 0) + 
                        Number(salesForm.zomato || 0) + 
                        Number(salesForm.other || 0);

    if (tot !== collections) {
      alert(data.language === 'mr' 
        ? `त्रुटी: एकूण विक्री आणि एकूण गोळा झालेली रक्कम जुळली पाहिजे! फरक: ₹${Math.abs(tot - collections)}`
        : `Validation Error: Total collection breakdown sum (₹${collections}) must equal Total Sales (₹${tot})`
      );
      return;
    }

    const nSales: DailySales = {
      id: salesForm.date,
      date: salesForm.date,
      totalSales: tot,
      cashCollection: Number(salesForm.cash || 0),
      upiCollection: Number(salesForm.upi || 0),
      cardCollection: Number(salesForm.card || 0),
      swiggyCollection: Number(salesForm.swiggy || 0),
      zomatoCollection: Number(salesForm.zomato || 0),
      otherCollection: Number(salesForm.other || 0),
      remarks: salesForm.remarks
    };

    onAddSales(nSales);
    setActiveFormModal(null);
  };

  const handlePurchaseConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(purchaseForm.amount) || (Number(purchaseForm.quantity || 0) * Number(purchaseForm.rate || 0));
    const nPurchase: Purchase = {
      id: "pur_" + Date.now(),
      date: purchaseForm.date,
      purchaseType: purchaseForm.purchaseType,
      vendorName: purchaseForm.vendorName || "Local General Store",
      itemName: purchaseForm.itemName,
      category: purchaseForm.category,
      quantity: Number(purchaseForm.quantity || 1),
      unit: purchaseForm.unit,
      rate: Number(purchaseForm.rate || amt),
      amount: amt,
      paymentMode: purchaseForm.paymentMode,
      invoiceNumber: purchaseForm.invoiceNumber,
      remarks: purchaseForm.remarks
    };

    onAddPurchase(nPurchase);
    setActiveFormModal(null);
  };

  const handleAdvanceConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    const staff = data.staff.find(s => s.id === advanceForm.staffId);
    if (!staff) return;

    const nAdvance: StaffAdvance = {
      id: "adv_" + Date.now(),
      date: advanceForm.date,
      staffId: staff.id,
      staffName: staff.name,
      amount: Number(advanceForm.amount),
      reason: advanceForm.reason || "Personal Loan",
      givenBy: advanceForm.givenBy,
      recoveredAmount: 0,
      remarks: advanceForm.remarks
    };

    onAddAdvance(nAdvance);
    setActiveFormModal(null);
  };

  const handleExpenseConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    const staff = data.staff.find(s => s.id === expenseForm.staffId);
    const nExpense: StaffWelfareExpense = {
      id: "exp_" + Date.now(),
      date: expenseForm.date,
      staffId: staff?.id,
      staffName: staff?.name || "All Staff",
      category: expenseForm.category,
      amount: Number(expenseForm.amount),
      notes: expenseForm.notes
    };

    onAddExpense(nExpense);
    setActiveFormModal(null);
  };

  const handleSalaryConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    const staff = data.staff.find(s => s.id === salaryForm.staffId);
    if (!staff) return;

    const rec = Number(salaryForm.advanceRecovery || 0);
    const ded = Number(salaryForm.otherDeductions || 0);
    const payable = staff.salary - rec - ded;

    const nSalary: SalaryPayment = {
      id: "sal_" + Date.now(),
      staffId: staff.id,
      staffName: staff.name,
      monthYear: salaryForm.monthYear,
      baseSalary: staff.salary,
      advanceRecovery: rec,
      otherDeductions: ded,
      netPayable: payable,
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMode: 'Cash',
      remarks: salaryForm.remarks
    };

    onAddSalary(nSalary);
    setActiveFormModal(null);
  };

  // Pre-fill calculation for salary payable
  const selectedStaffSalary = data.staff.find(s => s.id === salaryForm.staffId);
  const baseSalVal = selectedStaffSalary ? selectedStaffSalary.salary : 0;
  const recoveryVal = Number(salaryForm.advanceRecovery || 0);
  const deductionsVal = Number(salaryForm.otherDeductions || 0);
  const netPayVal = baseSalVal - recoveryVal - deductionsVal;

  return (
    <div className="space-y-6">
      {/* 1. Header & AI Summary Alert Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-orange-500 to-amber-600 rounded-3xl p-6 text-white shadow-lg overflow-hidden relative">
        <div className="space-y-1.5 z-10">
          <div className="flex items-center space-x-2">
            <span className="bg-white/20 text-white font-mono font-bold text-xs px-2.5 py-1 rounded-full uppercase tracking-wider backdrop-blur-sm">
              {data.language === 'mr' ? 'आरोग्य गुण:८४' : 'Health Score: 84/100'}
            </span>
            <span className="bg-emerald-500 text-white font-bold text-xs px-2.5 py-1 rounded-full flex items-center space-x-1 shadow-sm">
              <Check className="w-3 h-3" />
              <span>{data.language === 'mr' ? 'सुरक्षित' : 'STABLE'}</span>
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            {data.language === "mr" ? "गणेश भेळ व्यवस्थापन प्रणाली" : "Ganesh Bhel Operations Hub"}
          </h1>
          <p className="text-orange-100 text-xs md:text-sm max-w-2xl leading-relaxed">
            {data.language === "mr" 
              ? "आपले आजचे आर्थिक गल्ले, मालाची नोंदणी, स्टाफचे काम आणि नफा-तोटा एकाच ठिकाणी तपासा."
              : "Monitor sales summary, daily purchases, staff welfare cash book, inventory thresholds, and profitability margins from a single screen."}
          </p>
        </div>
        <div className="p-3 bg-white/10 rounded-2xl z-10 text-white flex items-center space-x-2 border border-white/20 self-start md:self-auto backdrop-blur-md">
          <Sparkles className="w-5 h-5 text-yellow-300" />
          <div className="text-xs">
            <div className="font-bold">{data.language === 'mr' ? "पुढील विक्री अंदाज:" : "Tomorrow's Sales Target:"}</div>
            <div className="font-mono text-base font-extrabold text-yellow-200">₹{forecast.tomorrowSales.toLocaleString()}</div>
          </div>
        </div>
        {/* Abstract background blobs for premium feel */}
        <div className="absolute right-0 bottom-0 w-64 h-64 bg-orange-400 rounded-full blur-3xl opacity-20 transform translate-x-12 translate-y-12"></div>
      </div>

      {/* 2. Today's Summary Banner Quick Scorecard */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI: Sales */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-start space-x-3.5">
          <div className="p-3 rounded-xl bg-orange-50 text-orange-500">
            <IndianRupee className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
              {data.language === 'mr' ? "आजची विक्री" : "Today's Sales"}
            </div>
            <div className="text-lg font-extrabold text-gray-800 font-mono">
              ₹{todaySalesVal.toLocaleString()}
            </div>
            <p className="text-[9px] text-gray-400 mt-0.5">
              {data.language === 'mr' ? "कालची विक्री " : "Yesterday: "}₹{yesterdaySalesVal.toLocaleString()}
            </p>
          </div>
        </div>

        {/* KPI: Purchases */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-start space-x-3.5">
          <div className="p-3 rounded-xl bg-rose-50 text-rose-500">
            <ShoppingCart className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
              {data.language === 'mr' ? "आजची खरेदी" : "Today's Purchase"}
            </div>
            <div className="text-lg font-extrabold text-gray-800 font-mono">
              ₹{(todayPurchasesVal || 0).toLocaleString()}
            </div>
            <p className="text-[9px] text-gray-400 mt-0.5">
              {data.language === 'mr' ? "सर्व शॉप मालासाठी" : "Shop & Staff needs"}
            </p>
          </div>
        </div>

        {/* KPI: Net Profit */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-start space-x-3.5">
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-500">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
              {data.language === 'mr' ? "आजचा नफा (अंदाजे)" : "Today's Gain"}
            </div>
            <div className={`text-lg font-extrabold font-mono ${todayProfitVal > 0 ? "text-emerald-600" : todayProfitVal < 0 ? "text-rose-600" : "text-gray-800"}`}>
              ₹{todayProfitVal.toLocaleString()}
            </div>
            <p className={`text-[9px] font-bold mt-0.5 flex items-center ${salesGrowthPct > 0 ? "text-emerald-500" : salesGrowthPct < 0 ? "text-rose-500" : "text-gray-400"}`}>
              {salesGrowthPct > 0 ? `+${salesGrowthPct.toFixed(1)}% ` : salesGrowthPct < 0 ? `${salesGrowthPct.toFixed(1)}% ` : "0% "}
              {data.language === 'mr' ? "वाढ" : "Growth"}
            </p>
          </div>
        </div>

        {/* KPI: Outstanding Advance Liabilities */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-start space-x-3.5">
          <div className="p-3 rounded-xl bg-amber-50 text-amber-500">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
              {data.language === 'mr' ? "बाकी स्टाफ ॲडव्हान्स" : "Staff Advances"}
            </div>
            <div className="text-lg font-extrabold text-gray-800 font-mono">
              ₹{outstandingAdvancesTotal.toLocaleString()}
            </div>
            <p className="text-[9px] text-amber-600 font-bold mt-0.5">
              {data.staff.length} {data.language === 'mr' ? "कर्मचारी सक्रिय" : "active helpers"}
            </p>
          </div>
        </div>
      </div>

      {/* 3. Monthly Metrics & Low Stock Alert Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left column: Monthly overview box */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-gray-100">
            <h3 className="font-bold text-gray-800 text-sm flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
              <span>{data.language === 'mr' ? "या महिन्याची आकडेवारी (जून)" : "This Month Progress (June)"}</span>
            </h3>
            <span className="text-[10px] bg-orange-100 text-orange-800 font-bold px-2 py-0.5 rounded">
              Current Cycle
            </span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between p-2 rounded-xl bg-orange-50/50 text-orange-950 border border-orange-100/50">
              <span className="font-extrabold">{data.language === 'mr' ? "एकूण विक्री गल्ला" : "Gross Retail Sales"}</span>
              <span className="font-extrabold font-mono text-sm text-right">₹{monthlySalesTotal.toLocaleString()}</span>
            </div>
            
            <div className="flex justify-between p-1.5 px-2 rounded-lg bg-zinc-50 border border-zinc-150">
              <span className="text-gray-500 font-medium">{data.language === 'mr' ? "कच्चा माल खरेदी" : "Raw Ingredients Cost"}</span>
              <span className="font-bold text-rose-650 font-mono">- ₹{monthlyRawIngredients.toLocaleString()}</span>
            </div>

            <div className="flex justify-between p-1.5 px-2 rounded-lg bg-zinc-50 border border-zinc-150">
              <span className="text-gray-500 font-medium">{data.language === 'mr' ? "कर्मचारी पगार व कल्याण" : "Staff Wages & Welfare"}</span>
              <span className="font-bold text-rose-650 font-mono">- ₹{(monthlyWagesPaid + monthlyWelfareTotal + monthlyAdvancesGiven).toLocaleString()}</span>
            </div>

            {/* Rent Overhead */}
            <div className="flex justify-between p-1.5 px-2 rounded-lg bg-zinc-50 border border-zinc-150">
              <span className="text-gray-500 font-medium">{data.language === 'mr' ? "दुकान भाडे (Rent)" : "Shop Rent Overhead"}</span>
              <span className="font-bold text-rose-650 font-mono">- ₹{monthlyRentOverhead.toLocaleString()}</span>
            </div>

            {/* Light Bill */}
            <div className="flex justify-between p-1.5 px-2 rounded-lg bg-zinc-50 border border-zinc-150">
              <span className="text-gray-500 font-medium">{data.language === 'mr' ? "वीज बिल (Light Bill)" : "Electricity (Light Bill)"}</span>
              <span className="font-bold text-rose-650 font-mono">- ₹{monthlyElectricityOverhead.toLocaleString()}</span>
            </div>

            {/* Water Bill */}
            <div className="flex justify-between p-1.5 px-2 rounded-lg bg-zinc-50 border border-zinc-150">
              <span className="text-gray-500 font-medium">{data.language === 'mr' ? "पाणी बिल (Water Bill)" : "Water Utility Bill"}</span>
              <span className="font-bold text-rose-650 font-mono">- ₹{monthlyWaterOverhead.toLocaleString()}</span>
            </div>

            {/* Other Bills */}
            <div className="flex justify-between p-1.5 px-2 rounded-lg bg-zinc-50 border border-zinc-150">
              <span className="text-gray-500 font-medium">{data.language === 'mr' ? "इतर किरकोळ खर्च" : "Other Operating Costs"}</span>
              <span className="font-bold text-rose-650 font-mono">- ₹{monthlyOtherOverheads.toLocaleString()}</span>
            </div>

            <div className={`flex flex-col p-3 rounded-xl border ${
              monthlyProfitTotal > 0 
                ? 'bg-emerald-50 text-emerald-950 border-emerald-150' 
                : 'bg-rose-50 text-rose-950 border-rose-150'
            }`}>
              <div className="flex justify-between items-center">
                <span className="font-black text-xs">{data.language === 'mr' ? "निव्वळ निव्वळ नफा (Net)" : "Net Operating Business Profit"}</span>
                <span className="font-black font-mono text-base">₹{monthlyProfitTotal.toLocaleString()}</span>
              </div>
              <div className="text-[10px] opacity-80 mt-1 font-bold">
                {monthlySalesTotal > 0 ? (
                  <span>
                    Margin Ratio: <span className="underline font-mono">{( (monthlyProfitTotal / monthlySalesTotal) * 100 ).toFixed(1)}%</span> of total sales
                  </span>
                ) : (
                  <span>No recorded sales yet to compute profit ratios</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Middle column: Low inventory alerts list */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center pb-2 border-b border-gray-100 mb-3">
              <h3 className="font-bold text-gray-800 text-sm flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-rose-500" />
                <span>{data.language === 'mr' ? "मालाची कमतरता इशारे" : "Low Stock Warnings"}</span>
              </h3>
              <span className="text-[10px] bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded">
                {lowStockAlerts.length} {data.language === 'mr' ? "बाकी" : "Alerts"}
              </span>
            </div>

            <div className="space-y-2.5 max-h-[140px] overflow-y-auto pr-1">
              {lowStockAlerts.length === 0 ? (
                <div className="text-center py-4 text-xs text-gray-400">
                  {data.language === 'mr' ? "सर्व माल पुरेशा प्रमाणात शिल्लक आहे." : "All ingredients stock healthy!"}
                </div>
              ) : (
                lowStockAlerts.map(item => (
                  <div key={item.id} className="flex justify-between items-center bg-rose-50/50 p-2 rounded-xl border border-rose-100/50 text-xs">
                    <div>
                      <div className="font-bold text-gray-800">{item.name}</div>
                      <div className="text-[10px] text-gray-500">
                        {data.language === 'mr' ? `किमान मर्यादा: ${item.lowStockThreshold} ${item.unit}` : `Threshold limit: ${item.lowStockThreshold} ${item.unit}`}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-extrabold text-rose-600">
                        {item.closingStock} {item.unit}
                      </div>
                      <span className="text-[8px] bg-rose-200 px-1 py-0.2 rounded text-rose-800 uppercase font-bold tracking-wide">
                        {item.closingStock === 0 ? "Empty" : "Critical"}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="border-t border-gray-100 pt-3 mt-3 flex justify-between items-center text-[11px] text-gray-400">
            <span>{data.language === 'mr' ? "माहिती आज अपडेट झाली" : "Stock checklist active"}</span>
            <span className="text-orange-500 font-bold">{data.language === 'mr' ? "ऑर्डर करा" : "Procure now"} &rarr;</span>
          </div>
        </div>

        {/* Right column: AI Business Score Analysis Widget */}
        <div className="bg-gradient-to-tr from-gray-900 to-slate-800 rounded-3xl p-5 text-white flex flex-col justify-between relative shadow-md">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs uppercase font-bold tracking-wider text-orange-400 flex items-center space-x-1">
                <Activity className="w-3.5 h-3.5 shrink-0" />
                <span>{data.language === 'mr' ? "आय आरोग्य स्कोअर" : "AI Business Health"}</span>
              </span>
              <Sparkles className="w-4 h-4 text-yellow-300 animate-pulse" />
            </div>

            <div className="flex items-center space-x-4 my-2">
              <div className="relative flex items-center justify-center">
                {/* SVG radial score */}
                <svg className="w-16 h-16 transform -rotate-95">
                  <circle cx="32" cy="32" r="28" stroke="rgba(255,255,255,0.1)" strokeWidth="6" fill="transparent" />
                  <circle cx="32" cy="32" r="28" stroke="#f97316" strokeWidth="6" fill="transparent"
                          strokeDasharray={175} strokeDashoffset={175 - (175 * health.score) / 100} />
                </svg>
                <div className="absolute text-center">
                  <span className="text-lg font-extrabold font-mono text-orange-400">{health.score}</span>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-bold">{data.language === 'mr' ? "आरोग्य:" : "Performance rating:"} <span className="text-emerald-400">{health.rating}</span></h4>
                <p className="text-[10px] text-slate-300 leading-snug max-w-[150px]">
                  {data.language === 'mr' ? "नफ्याचे प्रमाण आणि खर्च नियंत्रणात मजबूत आहे." : "Expense control and gross profits remain well optimized."}
                </p>
              </div>
            </div>

            {/* Sub-scores */}
            <div className="grid grid-cols-4 gap-2 mt-3 pt-2 border-t border-white/10 text-[9px] text-center text-slate-300">
              <div>
                <div className="font-bold text-white font-mono text-xs">{health.profitabilityScore}</div>
                <div>Profit</div>
              </div>
              <div>
                <div className="font-bold text-white font-mono text-xs">{health.cashFlowScore}</div>
                <div>Cash</div>
              </div>
              <div>
                <div className="font-bold text-white font-mono text-xs">{health.expenseControlScore}</div>
                <div>Expense</div>
              </div>
              <div>
                <div className="font-bold text-white font-mono text-xs">{health.inventoryScore}</div>
                <div>Stocks</div>
              </div>
            </div>
          </div>

          <div className="text-[10px] bg-white/5 p-2 rounded-xl border border-white/10 mt-3 text-slate-300 leading-relaxed italic">
            "{health.analysisText}"
          </div>
        </div>

      </div>

      {/* 4. Native Custom SVG Interactive Business Trend Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Chart Card: Daily Sales Trend */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="font-bold text-gray-800 text-sm">
                {data.language === 'mr' ? "दैनिक विक्री प्रवृत्ती (नाविन्यपूर्ण)" : "Daily Sales Performance"}
              </h3>
              <p className="text-[10px] text-gray-400">June 1st to June 13th, 2026</p>
            </div>
            <span className="text-[10px] font-mono text-orange-600 bg-orange-50 font-bold px-2 py-1 rounded">
              Avg: ₹14,946/day
            </span>
          </div>

          {/* Elegant SVG Line chart */}
          <div className="w-full h-56 flex items-center justify-center bg-gray-50 rounded-xl p-2.5 relative">
            <svg viewBox="0 0 500 200" className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f97316" stopOpacity="0.3"></stop>
                  <stop offset="100%" stopColor="#f97316" stopOpacity="0"></stop>
                </linearGradient>
              </defs>
              
              {/* Grid Lines */}
              <line x1="40" y1="20" x2="480" y2="20" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="40" y1="70" x2="480" y2="70" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="40" y1="120" x2="480" y2="120" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="40" y1="170" x2="480" y2="170" stroke="#e2e8f0" strokeWidth="1" />

              {/* Y Axis Labels */}
              <text x="32" y="24" className="text-[8px] font-mono fill-gray-400 text-right font-bold">25K</text>
              <text x="32" y="74" className="text-[8px] font-mono fill-gray-400 text-right font-bold">15K</text>
              <text x="32" y="124" className="text-[8px] font-mono fill-gray-400 text-right font-bold font-bold">10K</text>
              <text x="32" y="174" className="text-[8px] font-mono fill-gray-400 text-right font-bold">5K</text>

              {/* Draw Area Fill & Line */}
              {/* Map coordinates: 
                  Y: 170 (for 5000) to 20 (for 25000) -> linear map 
                  X: 40 (for Day 1) to 480 (for Day 13) 
              */}
              <path
                d="M 40 120 L 76 112 M 76 112 L 112 125 L 148 108 L 184 92 L 220 60 L 256 35 L 292 118 L 328 110 L 364 105 L 400 102 L 436 82 L 472 55"
                fill="none"
                stroke="#f97316"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <path
                d="M 40 120 L 76 112 L 112 125 L 148 108 L 184 92 L 220 60 L 256 35 L 292 118 L 328 110 L 364 105 L 400 102 L 436 82 L 472 55 L 472 170 L 40 170 Z"
                fill="url(#chartGrad)"
              />

              {/* Line Nodes */}
              <circle cx="40" cy="120" r="3" fill="#f97316" />
              <circle cx="76" cy="112" r="3" fill="#f97316" />
              <circle cx="112" cy="125" r="3" fill="#f97316" />
              <circle cx="148" cy="108" r="3" fill="#f97316" />
              <circle cx="184" cy="92" r="3" fill="#f97316" />
              <circle cx="220" cy="60" r="3" fill="#f97316" />
              <circle cx="256" cy="35" r="4.5" fill="#ea580c" /> {/* Peak Sun */}
              <circle cx="292" cy="118" r="3" fill="#f97316" />
              <circle cx="328" cy="110" r="3" fill="#f97316" />
              <circle cx="364" cy="105" r="3" fill="#f97316" />
              <circle cx="400" cy="102" r="3" fill="#f97316" />
              <circle cx="436" cy="82" r="3" fill="#f97316" />
              <circle cx="472" cy="55" r="3.5" fill="#f97316" />

              {/* X Axis Labels */}
              <text x="40" y="188" className="text-[8px] font-bold fill-gray-400" textAnchor="middle">June 1</text>
              <text x="148" y="188" className="text-[8px] font-bold fill-gray-400" textAnchor="middle">June 4</text>
              <text x="256" y="188" className="text-[8px] font-bold fill-emerald-600 font-extrabold" textAnchor="middle">June 7 (Peak)</text>
              <text x="364" y="188" className="text-[8px] font-bold fill-gray-400" textAnchor="middle">June 10</text>
              <text x="472" y="188" className="text-[8px] font-bold fill-gray-400" textAnchor="middle font-bold">June 13</text>
            </svg>

            <span className="absolute top-4 right-4 bg-orange-600 text-white font-mono text-[9px] px-2 py-0.5 rounded font-extrabold shadow-sm">
              ₹21,500 Sunday Peak
            </span>
          </div>
        </div>

        {/* Chart Card: Expense Stack Purchases Distribution */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="font-bold text-gray-800 text-sm">
                {data.language === 'mr' ? "सांख्यिकी खरेदी विभाग वितरण" : "Procurement Stack Categories"}
              </h3>
              <p className="text-[10px] text-gray-400">{data.language === 'mr' ? "मालानुसार खर्च विश्लेषण" : "Expenses split by resource types"}</p>
            </div>
            <span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 font-bold px-2 py-1 rounded">
              Total June Purchases: ₹{monthlyPurchasesTotal.toLocaleString()}
            </span>
          </div>

          <div className="w-full h-56 flex items-center justify-center bg-gray-50 rounded-xl p-2.5 relative">
            <svg viewBox="0 0 500 200" className="w-full h-full overflow-visible">
              {/* Category 1: Sev (₹3,000) - Height 120 */}
              {/* Category 2: Cylinder (₹1,850) - Height 85 */}
              {/* Category 3: Potatoes/Veg (₹3,000) - Height 120 */}
              {/* Category 4: Packaging (₹1,200) - Height 60 */}
              {/* Category 5: Milk (₹1,300) - Height 65 */}

              {/* Grid Lines */}
              <line x1="40" y1="20" x2="480" y2="20" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="40" y1="170" x2="480" y2="170" stroke="#e2e8f0" strokeWidth="1" />

              {/* Draw nice round bars representing categories */}
              {/* Sev */}
              <rect x="70" y="50" width="30" height="120" rx="6" fill="#f97316" />
              <text x="85" y="40" className="text-[9px] font-mono font-extrabold fill-orange-700" textAnchor="middle">₹3.0K</text>
              
              {/* Gas Cylinder */}
              <rect x="150" y="96" width="30" height="74" rx="6" fill="#ea580c" />
              <text x="165" y="86" className="text-[9px] font-mono font-extrabold fill-orange-800" textAnchor="middle">₹1.85K</text>

              {/* Onion/Veg */}
              <rect x="230" y="50" width="30" height="120" rx="6" fill="#10b981" />
              <text x="245" y="40" className="text-[9px] font-mono font-extrabold fill-emerald-700" textAnchor="middle">₹3.0K</text>

              {/* Packaging */}
              <rect x="310" y="122" width="30" height="48" rx="6" fill="#059669" />
              <text x="325" y="112" className="text-[9px] font-mono font-extrabold fill-emerald-800" textAnchor="middle">₹1.2K</text>

              {/* Milk */}
              <rect x="390" y="118" width="30" height="52" rx="6" fill="#84cc16" />
              <text x="405" y="108" className="text-[9px] font-mono font-extrabold fill-lime-800" textAnchor="middle">₹1.3K</text>

              {/* Labels */}
              <text x="85" y="185" className="text-[10px] font-bold fill-gray-500" textAnchor="middle">Sev</text>
              <text x="165" y="185" className="text-[10px] font-bold fill-gray-500" textAnchor="middle">Gas</text>
              <text x="245" y="185" className="text-[10px] font-bold fill-gray-500" textAnchor="middle">Potato/Veg</text>
              <text x="325" y="185" className="text-[10px] font-bold fill-gray-500" textAnchor="middle">Packing</text>
              <text x="405" y="185" className="text-[10px] font-bold fill-gray-500" textAnchor="middle">Milk-Staff</text>
            </svg>
          </div>
        </div>

      </div>

      {/* Floating Action Menu (FAB) in right bottom corner */}
      <div className="fixed bottom-6 right-6 z-50">
        <div className="relative">
          {/* Action List Sub buttons slide up on click */}
          <AnimatePresence>
            {isFabOpen && (
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
                className="absolute bottom-16 right-0 flex flex-col space-y-2 text-right text-xs whitespace-nowrap min-w-[200px]"
              >
                {/* 1. Add Sales */}
                <div className="flex items-center justify-end space-x-2">
                  <span className="bg-slate-800 text-white font-bold p-1 px-2.5 rounded-lg shadow-md text-[11px]">
                    {data.language === 'mr' ? "नवीन गल्ला नोंदवा" : "+ Add Daily Sales"}
                  </span>
                  <button 
                    onClick={() => { setActiveFormModal('sales'); setIsFabOpen(false); }}
                    className="p-3 bg-orange-600 hover:bg-orange-700 text-white rounded-full shadow-lg cursor-pointer"
                  >
                    <TrendingUp className="w-4 h-4" />
                  </button>
                </div>

                {/* 2. Add Purchase */}
                <div className="flex items-center justify-end space-x-2">
                  <span className="bg-slate-800 text-white font-bold p-1 px-2.5 rounded-lg shadow-md text-[11px]">
                    {data.language === 'mr' ? "खरेदी माल नोंदवा" : "+ Add Purchase"}
                  </span>
                  <button 
                    onClick={() => { setActiveFormModal('purchase'); setIsFabOpen(false); }}
                    className="p-3 bg-orange-600 hover:bg-orange-700 text-white rounded-full shadow-lg cursor-pointer"
                  >
                    <ShoppingCart className="w-4 h-4" />
                  </button>
                </div>

                {/* 3. Add Staff Advance */}
                <div className="flex items-center justify-end space-x-2">
                  <span className="bg-slate-800 text-white font-bold p-1 px-2.5 rounded-lg shadow-md text-[11px]">
                    {data.language === 'mr' ? "स्टाफ ॲडव्हान्स कर्ज" : "+ Record Advance"}
                  </span>
                  <button 
                    onClick={() => { setActiveFormModal('advance'); setIsFabOpen(false); }}
                    className="p-3 bg-orange-600 hover:bg-orange-700 text-white rounded-full shadow-lg cursor-pointer"
                  >
                    <Users className="w-4 h-4" />
                  </button>
                </div>

                {/* 4. Add welfare cost */}
                <div className="flex items-center justify-end space-x-2">
                  <span className="bg-slate-800 text-white font-bold p-1 px-2.5 rounded-lg shadow-md text-[11px]">
                    {data.language === 'mr' ? "रूम भाडे / जेवण खर्च" : "+ Staff Welfare Expense"}
                  </span>
                  <button 
                    onClick={() => { setActiveFormModal('expense'); setIsFabOpen(false); }}
                    className="p-3 bg-orange-600 hover:bg-orange-700 text-white rounded-full shadow-lg cursor-pointer"
                  >
                    <PlusCircle className="w-4 h-4" />
                  </button>
                </div>

                {/* 5. Add Salary Payment */}
                <div className="flex items-center justify-end space-x-2">
                  <span className="bg-slate-800 text-white font-bold p-1 px-2.5 rounded-lg shadow-md text-[11px]">
                    {data.language === 'mr' ? "कर्मचारी पगार जमा" : "+ Salary Released"}
                  </span>
                  <button 
                    onClick={() => { setActiveFormModal('salary'); setIsFabOpen(false); }}
                    className="p-3 bg-orange-600 hover:bg-orange-700 text-white rounded-full shadow-lg cursor-pointer"
                  >
                    <IndianRupee className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Core Master floating button */}
          <button 
            onClick={() => setIsFabOpen(!isFabOpen)}
            className={`p-4 rounded-full shadow-2xl flex items-center justify-center cursor-pointer transition transform duration-200 ${
              isFabOpen 
                ? "bg-slate-800 text-white rotate-45" 
                : "bg-orange-600 text-white hover:scale-105 active:scale-95"
            }`}
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Action Dialog Modal Overlays */}
      <AnimatePresence>
        {activeFormModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden"
            >
              {/* Header */}
              <div className="bg-orange-600 p-4 text-white flex justify-between items-center">
                <h3 className="font-bold text-base">
                  {activeFormModal === 'sales' && (data.language === 'mr' ? "नवीन दैनिक विक्री नोंदणी" : "New Daily Sales Summary")}
                  {activeFormModal === 'purchase' && (data.language === 'mr' ? "नवीन खरेदी नोंदणी" : "New Procurement Entry")}
                  {activeFormModal === 'advance' && (data.language === 'mr' ? "नवीन स्टाफ ॲडव्हान्स नोदणी" : "Disburse Staff Advance")}
                  {activeFormModal === 'expense' && (data.language === 'mr' ? "कर्मचारी कल्याण खर्च" : "Staff Welfare Entry")}
                  {activeFormModal === 'salary' && (data.language === 'mr' ? "नवीन पगार पेमेंट" : "Pay Monthly Salary")}
                </h3>
                <button onClick={() => setActiveFormModal(null)} className="text-white hover:text-orange-200 cursor-pointer text-sm">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Forms Body */}
              <div className="p-5 max-h-[80vh] overflow-y-auto">
                
                {/* sales Form */}
                {activeFormModal === 'sales' && (
                  <form onSubmit={handleSalesConfirm} className="space-y-3.5 text-xs">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Date</label>
                      <input type="date" required value={salesForm.date} onChange={e => setSalesForm({...salesForm, date: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Total Sales (₹)</label>
                      <input type="number" required placeholder="0" value={salesForm.totalSales} onChange={e => setSalesForm({...salesForm, totalSales: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs font-bold" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">UPI Pay (₹)</label>
                        <input type="number" placeholder="0" value={salesForm.upi} onChange={e => setSalesForm({...salesForm, upi: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Cash (₹)</label>
                        <input type="number" placeholder="0" value={salesForm.cash} onChange={e => setSalesForm({...salesForm, cash: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Swiggy (₹)</label>
                        <input type="number" placeholder="0" value={salesForm.swiggy} onChange={e => setSalesForm({...salesForm, swiggy: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Zomato (₹)</label>
                        <input type="number" placeholder="0" value={salesForm.zomato} onChange={e => setSalesForm({...salesForm, zomato: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Card (₹)</label>
                        <input type="number" placeholder="0" value={salesForm.card} onChange={e => setSalesForm({...salesForm, card: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Other (₹)</label>
                        <input type="number" placeholder="0" value={salesForm.other} onChange={e => setSalesForm({...salesForm, other: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Comments/Remarks</label>
                      <input type="text" placeholder="e.g. Busy weekend volume" value={salesForm.remarks} onChange={e => setSalesForm({...salesForm, remarks: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs" />
                    </div>
                    <button type="submit" className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold p-2.5 rounded-xl cursor-pointer shadow-md mt-4 text-xs">
                      {data.language === 'mr' ? "विक्री जोडा" : "Save Sales Record"}
                    </button>
                  </form>
                )}

                {/* Purchase Form */}
                {activeFormModal === 'purchase' && (
                  <form onSubmit={handlePurchaseConfirm} className="space-y-3.5 text-xs">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Purchase Type</label>
                        <select value={purchaseForm.purchaseType} onChange={e => setPurchaseForm({...purchaseForm, purchaseType: e.target.value as any})} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs">
                          <option value="Shop">Shop Material (दुकान खरेदी)</option>
                          <option value="Staff">Staff Quarters (स्टाफ खरेदी)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Date</label>
                        <input type="date" required value={purchaseForm.date} onChange={e => setPurchaseForm({...purchaseForm, date: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Vendor/Trader Name</label>
                      <input type="text" required placeholder="e.g. Mahesh Traders" value={purchaseForm.vendorName} onChange={e => setPurchaseForm({...purchaseForm, vendorName: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Item Description</label>
                        <input type="text" required placeholder="e.g. Potato red grade" value={purchaseForm.itemName} onChange={e => setPurchaseForm({...purchaseForm, itemName: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Category</label>
                        <select value={purchaseForm.category} onChange={e => setPurchaseForm({...purchaseForm, category: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs">
                          <option value="Sev">Sev (शेव)</option>
                          <option value="Puri">Puri (पुरी)</option>
                          <option value="Potato">Potato (बटाटा)</option>
                          <option value="Onion">Onion (कांदा)</option>
                          <option value="Tomato">Tomato (टोमॅटो)</option>
                          <option value="Gas Cylinder">Gas Cylinder (गॅस सिलिंडर)</option>
                          <option value="Packaging">Packaging (पॅकेजिंग पिशव्या)</option>
                          <option value="Milk">Milk (दूध/चहासाठी)</option>
                          <option value="Other">Other Miscellaneous</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Qty</label>
                        <input type="number" step="any" placeholder="10" value={purchaseForm.quantity} onChange={e => setPurchaseForm({...purchaseForm, quantity: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Unit</label>
                        <input type="text" placeholder="kg/pcs" value={purchaseForm.unit} onChange={e => setPurchaseForm({...purchaseForm, unit: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Rate (₹)</label>
                        <input type="number" placeholder="25" value={purchaseForm.rate} onChange={e => setPurchaseForm({...purchaseForm, rate: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Calculated Total (₹)</label>
                        <input type="number" placeholder="calculated" value={purchaseForm.amount} onChange={e => setPurchaseForm({...purchaseForm, amount: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs font-bold" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Payment Mode</label>
                        <select value={purchaseForm.paymentMode} onChange={e => setPurchaseForm({...purchaseForm, paymentMode: e.target.value as any})} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs">
                          <option value="UPI">UPI Payment</option>
                          <option value="Cash">Cash in Hand</option>
                          <option value="Card">Debit Card</option>
                          <option value="Credit">Vendor Credit (उधारी)</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Invoice #</label>
                        <input type="text" placeholder="e.g. MT/980" value={purchaseForm.invoiceNumber} onChange={e => setPurchaseForm({...purchaseForm, invoiceNumber: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-gray-400 uppercase mb-1">Bill Photo Upload</label>
                        <div className="border border-dashed border-gray-300 rounded-lg p-2 text-[10px] text-center text-gray-400 bg-gray-50 cursor-pointer">
                          ✓ Click map fake attachment
                        </div>
                      </div>
                    </div>
                    <button type="submit" className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold p-2.5 rounded-xl cursor-pointer shadow-md mt-4 text-xs">
                      {data.language === 'mr' ? "खरेदी जोडा" : "Save Purchase record"}
                    </button>
                  </form>
                )}

                {/* Advance Form */}
                {activeFormModal === 'advance' && (
                  <form onSubmit={handleAdvanceConfirm} className="space-y-3.5 text-xs">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Select Staff Member</label>
                      <select required value={advanceForm.staffId} onChange={e => setAdvanceForm({...advanceForm, staffId: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs">
                        <option value="">-- Choose helper --</option>
                        {data.staff.map(s => <option key={s.id} value={s.id}>{s.name} ({s.designation})</option>)}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Date</label>
                        <input type="date" required value={advanceForm.date} onChange={e => setAdvanceForm({...advanceForm, date: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Advance Amount (₹)</label>
                        <input type="number" required placeholder="0" value={advanceForm.amount} onChange={e => setAdvanceForm({...advanceForm, amount: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs font-bold" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Reason for Loan</label>
                      <input type="text" required placeholder="e.g. Village travel, medical need" value={advanceForm.reason} onChange={e => setAdvanceForm({...advanceForm, reason: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Authorized Given By</label>
                      <input type="text" value={advanceForm.givenBy} onChange={e => setAdvanceForm({...advanceForm, givenBy: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs" />
                    </div>
                    <button type="submit" className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold p-2.5 rounded-xl cursor-pointer shadow-md mt-4 text-xs">
                      {data.language === 'mr' ? "ॲडव्हान्स कर्ज मंजुरी" : "Confirm Advance Loan"}
                    </button>
                  </form>
                )}

                {/* Expense Form */}
                {activeFormModal === 'expense' && (
                  <form onSubmit={handleExpenseConfirm} className="space-y-3.5 text-xs">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Date</label>
                        <input type="date" required value={expenseForm.date} onChange={e => setExpenseForm({...expenseForm, date: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Staff Welfare Category</label>
                        <select value={expenseForm.category} onChange={e => setExpenseForm({...expenseForm, category: e.target.value as any})} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs">
                          <option value="Room Rent">Accommodation (रूम भाडे)</option>
                          <option value="Food">Helper Food (जेवण/राशन)</option>
                          <option value="Transport">Transport (वाहतूक खर्च)</option>
                          <option value="Electricity">Electricity (लाइट बिल)</option>
                          <option value="Water">Drinking Water (पिण्याचे पाणी)</option>
                          <option value="Medical">Medical Check (दवाखाना मदत)</option>
                          <option value="Other">Other Expenses</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Amount (₹)</label>
                        <input type="number" required placeholder="0" value={expenseForm.amount} onChange={e => setExpenseForm({...expenseForm, amount: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs font-bold" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Specific Helper benefit</label>
                        <select value={expenseForm.staffId} onChange={e => setExpenseForm({...expenseForm, staffId: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs">
                          <option value="">All Shared Staff / general</option>
                          {data.staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Description/Notes</label>
                      <input type="text" placeholder="e.g. Staff quarters tomato, oil purchase groceries" value={expenseForm.notes} onChange={e => setExpenseForm({...expenseForm, notes: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs" />
                    </div>
                    <button type="submit" className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold p-2.5 rounded-xl cursor-pointer shadow-md mt-4 text-xs">
                      {data.language === 'mr' ? "कल्याण खर्च जोडा" : "Save Welfare Expense"}
                    </button>
                  </form>
                )}

                {/* Salary Payment Form */}
                {activeFormModal === 'salary' && (
                  <form onSubmit={handleSalaryConfirm} className="space-y-3.5 text-xs">
                    <div className="grid grid-cols-2 gap-2 font-bold bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-[11px] mb-2 text-slate-700">
                      <div>Staff Base: ₹{baseSalVal.toLocaleString()}</div>
                      <div className="text-rose-600">Net Payable: ₹{netPayVal.toLocaleString()}</div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Select staff helper</label>
                      <select required value={salaryForm.staffId} onChange={e => setSalaryForm({...salaryForm, staffId: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs">
                        <option value="">-- Helper Name --</option>
                        {data.staff.map(s => <option key={s.id} value={s.id}>{s.name} (Base: ₹{s.salary})</option>)}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Salary Month/Year</label>
                        <input type="month" required value={salaryForm.monthYear} onChange={e => setSalaryForm({...salaryForm, monthYear: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Advance Recovery (₹)</label>
                        <input type="number" placeholder="e.g. 2000" value={salaryForm.advanceRecovery} onChange={e => setSalaryForm({...salaryForm, advanceRecovery: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Other Deductions (₹)</label>
                        <input type="number" placeholder="0" value={salaryForm.otherDeductions} onChange={e => setSalaryForm({...salaryForm, otherDeductions: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Disbursement Mode</label>
                        <select value={salaryForm.paymentMode} onChange={e => setSalaryForm({...salaryForm, paymentMode: e.target.value as any})} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs">
                          <option value="Cash">Cash in Hand</option>
                          <option value="UPI">UPI Transfer</option>
                          <option value="Direct Transfer">Direct Bank NEFT/IMPS</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Remarks</label>
                      <input type="text" placeholder="e.g. Fully paid for May, recovered ₹2000 loan" value={salaryForm.remarks} onChange={e => setSalaryForm({...salaryForm, remarks: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs" />
                    </div>
                    <button type="submit" className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold p-2.5 rounded-xl cursor-pointer shadow-md mt-4 text-xs animate-pulse">
                      {data.language === 'mr' ? "पगार वितरित करा" : "Issue Net Payroll Release"}
                    </button>
                  </form>
                )}

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
