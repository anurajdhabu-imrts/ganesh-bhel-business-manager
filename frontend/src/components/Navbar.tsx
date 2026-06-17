import React, { useState } from "react";
import { 
  Bell, Globe, UserCheck, Shield, ChevronDown, AlignJustify, X, 
  TrendingUp, ShoppingCart, Users, Package, FileText, HeartHandshake, 
  IndianRupee, Lock, Sparkles, LayoutDashboard, Layers, LogOut, Database, Store
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { SystemData } from "../types";

interface NavProps {
  data: SystemData;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  activeUserRole: "owner" | "manager";
  onUpdateLanguage: (lang: "en" | "mr") => void;
  activeShopId: string;
  onSelectShop: (shopId: string) => void;
}

export default function Navbar({ data, activeTab, setActiveTab, onLogout, activeUserRole, onUpdateLanguage, activeShopId, onSelectShop }: NavProps) {
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Notifications aggregation
  const notices: string[] = [];
  const lowStocksCount = data.inventory.filter(i => i.closingStock <= i.lowStockThreshold).length;
  if (lowStocksCount > 0) {
    notices.push(`${lowStocksCount} items are running below reorder levels! Ensure supplies.`);
  }
  const lastClose = data.closingLogs[data.closingLogs.length - 1];
  if (lastClose && Math.abs(Number(lastClose.discrepancies || 0)) > 1) {
    notices.push(`Vault discrepancy warning: ${lastClose.date} deficit was ₹${Math.abs(Number(lastClose.discrepancies))}`);
  }

  const navItems = [
    { id: "dashboard", label: data.language === 'mr' ? "मुख्य फलक" : "Dashboard", icon: LayoutDashboard },
    { id: "sales", label: data.language === 'mr' ? "दैनिक विक्री" : "Sales summary", icon: TrendingUp },
    { id: "purchases", label: data.language === 'mr' ? "मालाची खरेदी" : "Material purchases", icon: ShoppingCart },
    { id: "staff", label: data.language === 'mr' ? "कर्मचारी डायरेक्टरी" : "Helpers profiles", icon: Users },
    { id: "welfare", label: data.language === 'mr' ? "रूम/कल्याण" : "Welfare costs", icon: Layers },
    { id: "advances", label: data.language === 'mr' ? "स्टाफ कर्ज" : "Staff advances", icon: HeartHandshake },
    { id: "salaries", label: data.language === 'mr' ? "पगार व स्लिप" : "Release Payroll", icon: IndianRupee },
    { id: "stock", label: data.language === 'mr' ? "माल साठा" : "Stock Levels", icon: Package },
    { id: "cashflow", label: data.language === 'mr' ? "कॅश बुक" : "Cash Ledger", icon: FileText },
    { id: "closing", label: data.language === 'mr' ? "गल्ला बंदी" : "Shift lock check", icon: Lock },
    { id: "reports", label: data.language === 'mr' ? "अहवालपत्रक" : "Financial logs", icon: FileText },
    { id: "shops", label: data.language === 'mr' ? "शाखा व्यवस्थापन" : "Manage Outlets", icon: Store },
    { id: "backups", label: data.language === 'mr' ? "डेटा व बॅकअप" : "Data & Backups", icon: Database },
  ];

  return (
    <>
      {/* 1. Global top Header */}
      <nav className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-30 px-4 py-3.5 flex items-center justify-between">
        
        {/* Brand Signage */}
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-gradient-to-tr from-orange-500 to-amber-500 rounded-xl text-white shadow-md">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <div className="font-black text-gray-900 tracking-tight text-sm uppercase flex items-center space-x-1">
              <span>GANESH BHEL</span>
              <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1 py-0.2 rounded">GBMS</span>
            </div>
            <p className="text-[9px] text-gray-400 font-extrabold uppercase tracking-widest leading-none">
              Business Suite V2.4
            </p>
          </div>
        </div>

        {/* Global Toolbar */}
        <div className="flex items-center space-x-3 text-xs">
          {/* Shop Switcher */}
          <div className="flex items-center bg-gray-50 border border-gray-150 rounded-xl px-2.5 py-1.5 space-x-2">
            <Store className="w-3.5 h-3.5 text-orange-500 shrink-0" />
            <select
              value={activeShopId}
              onChange={(e) => onSelectShop(e.target.value)}
              className="bg-transparent border-none text-[11px] font-black uppercase text-gray-750 focus:outline-none cursor-pointer pr-1"
            >
              <option value="all">{data.language === 'mr' ? "सर्व शाखा" : "All Outlets"}</option>
              {(data.shops || []).map((shop) => (
                <option key={shop.id} value={shop.id}>
                  {shop.name}
                </option>
              ))}
            </select>
          </div>

          {/* Marathi / English Switcher */}
          <button 
            onClick={() => onUpdateLanguage(data.language === 'mr' ? 'en' : 'mr')}
            className="flex items-center space-x-1 p-2 bg-gray-50 border border-gray-150 rounded-xl text-gray-750 font-bold hover:bg-gray-100 cursor-pointer transition select-none"
          >
            <Globe className="w-3.5 h-3.5 text-orange-500" />
            <span className="text-[10px]">{data.language === 'mr' ? 'English' : 'मराठी'}</span>
          </button>

          {/* Active User session details and logout trigger */}
          <div className="flex items-center space-x-2">
            <span className="hidden sm:inline-flex items-center space-x-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase text-gray-700">
              <span className={`w-2.5 h-2.5 rounded-full ${activeUserRole === "owner" ? "bg-emerald-550" : "bg-orange-500"}`}></span>
              <span>
                {activeUserRole === "owner" ? (data.language === "mr" ? "मालक (Owner)" : "Owner") : (data.language === "mr" ? "व्यवस्थापक (Manager)" : "Manager")}
              </span>
            </span>
            <button
              onClick={onLogout}
              className="p-2 border border-rose-150 hover:bg-rose-50 text-rose-750/90 rounded-xl cursor-pointer font-extrabold flex items-center space-x-1 hover:border-rose-300 transition"
              title={data.language === "mr" ? "लॉग आउट करा" : "Log out session"}
            >
              <LogOut className="w-3.5 h-3.5 shrink-0" />
              <span className="text-[10px] hidden md:inline">{data.language === "mr" ? "बाहेर पडा" : "Logout"}</span>
            </button>
          </div>

          {/* Notification bell pane */}
          <div className="relative">
            <button 
              onClick={() => setNotificationOpen(!notificationOpen)}
              className="p-2.5 bg-gray-50 border border-gray-150 hover:bg-gray-100 rounded-xl cursor-pointer relative"
            >
              <Bell className="w-4 h-4 text-gray-600" />
              {notices.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full animate-ping"></span>
              )}
            </button>
            <AnimatePresence>
              {notificationOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  className="absolute right-0 mt-1.5 bg-white shadow-2xl border border-gray-150 rounded-2xl p-4 w-72 z-45 text-left text-xs text-gray-700 space-y-2"
                >
                  <div className="font-bold border-b border-gray-105 pb-1.5 text-gray-400 text-[10px] uppercase">
                    System messages alerts
                  </div>
                  {notices.length === 0 ? (
                    <div className="text-center text-gray-400 py-4 font-medium">All cycles operating cleanly!</div>
                  ) : (
                    notices.map((n, i) => (
                      <div key={i} className="p-2 bg-orange-50/50 rounded-xl border border-orange-100 text-[11px] font-medium leading-relaxed uppercase">
                        ✓ {n}
                      </div>
                    ))
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Mobile hamburger list toggle */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
            className="md:hidden p-2 bg-orange-50 text-orange-600 rounded-xl cursor-pointer"
          >
            <AlignJustify className="w-4 h-4" />
          </button>
        </div>
      </nav>

      {/* 2. Desktop Left Sidebar Navigation */}
      <div className="hidden md:flex flex-wrap gap-2 justify-center bg-gray-50 border-b border-gray-150 p-2.5 sticky top-[61px] z-20 text-xs font-bold text-gray-600">
        {navItems.map(item => {
          const IconComp = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`p-2 px-3 rounded-xl flex items-center space-x-1.5 cursor-pointer transition ${
                isActive 
                  ? 'bg-orange-600 text-white font-extrabold shadow-sm' 
                  : 'hover:bg-gray-200/50 hover:text-gray-900 border border-transparent'
              }`}
            >
              <IconComp className="w-3.5 h-3.5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. Slide Out Mobile Drawer overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/60 backdrop-blur-sm md:hidden">
            <motion.div 
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              className="bg-white w-2/3 h-full p-4 flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                  <span className="font-extrabold text-xs text-orange-600 uppercase">GBMS Menu Panel</span>
                  <button onClick={() => setMobileMenuOpen(false)} className="p-1 rounded bg-gray-100">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex flex-col space-y-1.5 text-xs text-gray-700 font-extrabold">
                  {navItems.map(item => {
                    const IconComp = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => { setActiveTab(item.id); setMobileMenuOpen(false); }}
                        className={`w-full p-3 rounded-xl flex items-center space-x-2.5 text-left border cursor-pointer ${
                          isActive 
                            ? 'bg-orange-650 text-white font-black border-orange-200 shadow-sm' 
                            : 'bg-slate-50 border-gray-100 hover:bg-slate-100'
                        }`}
                      >
                        <IconComp className="w-4 h-4 text-orange-500" />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="p-3 bg-orange-50 border border-orange-100 rounded-2xl text-[10px] text-orange-850 font-bold leading-relaxed">
                Ganesh Bhel Business Management System (GBMS). All data synchronized in server memory successfully.
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

// Flame icon dummy
function Flame(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
    </svg>
  );
}
