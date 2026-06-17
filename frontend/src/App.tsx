import React, { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import Dashboard from "./components/Dashboard";
import DailySalesManager from "./components/DailySales";
import ProductsManager from "./components/Products";
import PurchasesManager from "./components/Purchases";
import StaffManager from "./components/Staff";
import StaffWelfareManager from "./components/StaffWelfare";
import StaffAdvancesManager from "./components/Advances";
import SalariesManager from "./components/Salaries";
import InventoryManager from "./components/Inventory";
import CashFlowManager from "./components/CashFlow";
import DailyClosingManager from "./components/DailyClosing";
import ReportsManager from "./components/Reports";
import HelpAssistant from "./components/HelpAssistant";
import LoginPortal from "./components/Login";
import DatabaseManager from "./components/DatabaseManager";
import ShopsManager from "./components/Shops";
import { SystemData, DailySales, Purchase, Staff, StaffAdvance, StaffWelfareExpense, SalaryPayment, DailyClosingLog, Product, Shop } from "./types";
import { Sparkles, Bot, Terminal, RefreshCw, Layers } from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [isLoading, setIsLoading] = useState(true);
  const [savePending, setSavePending] = useState(false);
  
  // Local session login states
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return sessionStorage.getItem("gbms_logged_in") === "true";
  });
  const [currentUserRole, setCurrentUserRole] = useState<"owner" | "manager">(() => {
    return (sessionStorage.getItem("gbms_role") as "owner" | "manager") || "owner";
  });
  const [authToken, setAuthToken] = useState<string | null>(() => {
    return sessionStorage.getItem("gbms_auth_token");
  });

  const [activeShopId, setActiveShopId] = useState<string>(() => {
    return sessionStorage.getItem("gbms_active_shop_id") || "all";
  });

  const [dbData, setDbData] = useState<SystemData>(() => {
    const saved = localStorage.getItem("gbms_local_db_state");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === "object" && parsed.hasOwnProperty("inventory")) {
          return parsed;
        }
      } catch (e) {
        console.error("Error reading initial state from localStorage:", e);
      }
    }
    return {
      language: "en",
      userRole: "owner",
      sales: [],
      purchases: [],
      staff: [],
      advances: [],
      welfareExpenses: [],
      salaries: [],
      inventory: [],
      closingLogs: [],
      notifications: [],
      shops: [
        { id: "main", name: "Chinchwad Outlet", location: "Chinchwad, Pune", status: "Active" },
        { id: "swargate", name: "Swargate Branch", location: "Swargate, Pune", status: "Active" }
      ],
      lastUpdated: 0
    };
  });

  const handleSelectShop = (shopId: string) => {
    sessionStorage.setItem("gbms_active_shop_id", shopId);
    setActiveShopId(shopId);
  };

  // Pull initial state from database
  const fetchInitialData = async (showLoader = false, tokenOverride?: string) => {
    if (showLoader) setIsLoading(true);
    try {
      const activeToken = tokenOverride || authToken || sessionStorage.getItem("gbms_auth_token");
      const headers: Record<string, string> = {};
      if (activeToken) {
        headers["Authorization"] = `Bearer ${activeToken}`;
      }
      const response = await fetch("/api/data", { headers });
      const json = await response.json();
      if (json && json.inventory) {
        // Initialize dynamic categories if not existing
        if (!json.categories || json.categories.length === 0) {
          json.categories = ["Snacks", "Beverages", "Sweets"];
        }
        // Initialize dynamic shops if not existing
        if (!json.shops || json.shops.length === 0) {
          json.shops = [
            { id: "main", name: "Chinchwad Outlet", location: "Chinchwad, Pune", status: "Active" },
            { id: "swargate", name: "Swargate Branch", location: "Swargate, Pune", status: "Active" }
          ];
        }
        // Align system state role with current session role if logged-in
        if (sessionStorage.getItem("gbms_logged_in") === "true") {
          const activeRole = sessionStorage.getItem("gbms_role") as "owner" | "manager";
          if (activeRole) {
            json.userRole = activeRole;
          }
        }

        // Compare and merge with local copy to prevent losing data if container/server was reset
        const localRaw = localStorage.getItem("gbms_local_db_state");
        let merged = { ...json };

        if (localRaw) {
          try {
            const localData = JSON.parse(localRaw);
            const localTime = Number(localData.lastUpdated || 0);
            const serverTime = Number(json.lastUpdated || 0);

            // Detect if server database returned an empty/reset template
            const serverIsEmpty = (!json.sales || json.sales.length === 0) && (!json.purchases || json.purchases.length === 0) && (!json.staff || json.staff.length === 0);
            const localHasData = (localData.sales && localData.sales.length > 0) || (localData.purchases && localData.purchases.length > 0) || (localData.staff && localData.staff.length > 0);

            if (localTime > serverTime || (serverIsEmpty && localHasData)) {
              console.log("Local browser data is fresher or was preserved across container restarts. Healing...");
              merged = { ...localData };
              // Restore and write back up to server immediately
              setTimeout(() => {
                const activeToken = tokenOverride || authToken || sessionStorage.getItem("gbms_auth_token");
                const syncHeaders: Record<string, string> = { "Content-Type": "application/json" };
                if (activeToken) syncHeaders["Authorization"] = `Bearer ${activeToken}`;
                fetch("/api/data", {
                  method: "POST",
                  headers: syncHeaders,
                  body: JSON.stringify(merged)
                }).catch(err => console.error("Self-healing background synchronization failed:", err));
              }, 1500);
            }
          } catch (e) {
            console.error("Local/Server synchronization check failed:", e);
          }
        }

        setDbData(merged);
        localStorage.setItem("gbms_local_db_state", JSON.stringify(merged));
      }
    } catch (error) {
      console.error("Connectivity issue loading DB:", error);
    } finally {
      if (showLoader) setIsLoading(false);
    }
  };

  // Synchronize Google Auth session on page load automatically!
  useEffect(() => {
    import("./lib/firebase.ts").then(({ auth }) => {
      const unsubscribe = auth.onAuthStateChanged(async (user) => {
        if (user) {
          const token = await user.getIdToken();
          sessionStorage.setItem("gbms_auth_token", token);
          sessionStorage.setItem("gbms_logged_in", "true");
          sessionStorage.setItem("gbms_role", "owner");
          setAuthToken(token);
          setIsLoggedIn(true);
          setCurrentUserRole("owner");
          // Reload the user dataset so they get their genuine private records instantly!
          fetchInitialData(false, token);
        }
      });
      return () => unsubscribe();
    });
  }, []);

  // Pull initial state on startup
  useEffect(() => {
    fetchInitialData(true);
  }, []);

  // Post update states to server to persist on disk with optimistic client update
  const persistChanges = async (updatedData: SystemData, tokenOverride?: string) => {
    const dataWithTs = { ...updatedData, lastUpdated: Date.now() };
    
    // 1. Snappy optimistic update so that the user interface refreshes immediately!
    setDbData(dataWithTs);
    localStorage.setItem("gbms_local_db_state", JSON.stringify(dataWithTs));
    setSavePending(true);

    try {
      const activeToken = tokenOverride || authToken || sessionStorage.getItem("gbms_auth_token");
      const headers: Record<string, string> = {
        "Content-Type": "application/json"
      };
      if (activeToken) {
        headers["Authorization"] = `Bearer ${activeToken}`;
      }
      const response = await fetch("/api/data", {
        method: "POST",
        headers,
        body: JSON.stringify(dataWithTs),
      });
      const result = await response.json();
      
      if (result.status !== "saved" && result.status !== "success") {
        console.error("Failed to persist data to backend:", result);
        // Sync back/rollback state if the back-end reported fail
        await fetchInitialData(false, activeToken || undefined);
      }
    } catch (error) {
      console.error("Failed to commit mutation to backend database:", error);
      // Sync back/rollback state if network fails
      await fetchInitialData(false);
    } finally {
      setSavePending(false);
    }
  };

  // Role & Session Control inside App.tsx
  const handleLogin = (role: "owner" | "manager", token?: string) => {
    sessionStorage.setItem("gbms_logged_in", "true");
    sessionStorage.setItem("gbms_role", role);
    if (token) {
      sessionStorage.setItem("gbms_auth_token", token);
      setAuthToken(token);
    }
    setIsLoggedIn(true);
    setCurrentUserRole(role);

    // Sync database's role to match the current viewer's active workspace session
    const nw = { ...dbData, userRole: role };
    persistChanges(nw, token);
  };

  const handleLogout = () => {
    sessionStorage.removeItem("gbms_logged_in");
    sessionStorage.removeItem("gbms_role");
    sessionStorage.removeItem("gbms_auth_token");
    setAuthToken(null);
    setIsLoggedIn(false);

    // Sign out from firebase too for clean session slate
    import("./lib/firebase.ts").then(({ auth }) => {
      auth.signOut().catch(console.error);
    });
  };

  // Category management lists (Owner Only)
  const handleAddCategory = (catName: string) => {
    const currentCats = dbData.categories || ["Snacks", "Beverages", "Sweets"];
    if (currentCats.map((c) => c.toLowerCase()).includes(catName.toLowerCase())) {
      return;
    }
    const nw = { ...dbData, categories: [...currentCats, catName] };
    persistChanges(nw);
  };

  const handleDeleteCategory = (catName: string) => {
    const currentCats = dbData.categories || ["Snacks", "Beverages", "Sweets"];
    const nw = { ...dbData, categories: currentCats.filter((c) => c !== catName) };
    persistChanges(nw);
  };

  // Shop management
  const handleAddShop = (sh: Shop) => {
    const currentShops = dbData.shops || [];
    if (currentShops.map((s) => s.id).includes(sh.id)) {
      return;
    }
    const nw = { ...dbData, shops: [...currentShops, sh] };
    persistChanges(nw);
  };

  const handleUpdateShop = (updated: Shop) => {
    const currentShops = dbData.shops || [];
    const nw = { ...dbData, shops: currentShops.map(s => s.id === updated.id ? updated : s) };
    persistChanges(nw);
  };

  const handleDeleteShop = (id: string) => {
    const currentShops = dbData.shops || [];
    const nw = { ...dbData, shops: currentShops.filter(s => s.id !== id) };
    persistChanges(nw);
  };

  const handleDeleteProduct = (id: string) => {
    const list = (dbData.products || []).filter((p) => p.id !== id);
    const nw = { ...dbData, products: list };
    persistChanges(nw);
  };

  // Language translation control
  const handleUpdateLanguage = (lang: "en" | "mr") => {
    const nw = { ...dbData, language: lang };
    persistChanges(nw);
  };

  // ------------------------------------
  // Module handlers
  // ------------------------------------

  const resolveShopId = (itemShopId?: string) => {
    if (itemShopId) return itemShopId;
    return activeShopId === "all" ? "main" : activeShopId;
  };

  // Sales receipts
  const handleAddSales = (sales: DailySales) => {
    const sWithShop = { ...sales, shopId: resolveShopId(sales.shopId) };
    // avoid duplicates on date with same shop
    const cleanList = dbData.sales.filter(s => !(s.date === sWithShop.date && s.shopId === sWithShop.shopId));
    const nw = { ...dbData, sales: [...cleanList, sWithShop] };
    persistChanges(nw);
  };

  const handleAddItemizedSales = (sales: DailySales, rawStockDeductions: { inventoryItemId: string; quantity: number }[]) => {
    const sWithShop = { ...sales, shopId: resolveShopId(sales.shopId) };
    // avoid duplicates on date with same shop
    const cleanList = dbData.sales.filter(s => !(s.date === sWithShop.date && s.shopId === sWithShop.shopId));
    const newSalesList = [...cleanList, sWithShop];

    // Adjust Inventory stock levels
    const updatedInventory = (dbData.inventory || []).map((item) => {
      const deductionForThisItem = rawStockDeductions.filter((d) => d.inventoryItemId === item.id);
      if (deductionForThisItem.length > 0) {
        const totalDeductedQuantity = deductionForThisItem.reduce((sum, d) => sum + d.quantity, 0);
        const newConsumed = item.consumedStock + totalDeductedQuantity;
        const newClosing = item.openingStock + item.purchasedStock - newConsumed;
        return {
          ...item,
          consumedStock: Number(newConsumed.toFixed(4)),
          closingStock: Number(newClosing.toFixed(4)),
        };
      }
      return item;
    });

    const nw = {
      ...dbData,
      sales: newSalesList,
      inventory: updatedInventory,
    };
    persistChanges(nw);
  };

  const handleDeleteSales = (id: string) => {
    const cleanList = dbData.sales.filter(s => s.id !== id);
    const nw = { ...dbData, sales: cleanList };
    persistChanges(nw);
  };

  // Product menu lists
  const handleAddProduct = (prod: Product) => {
    const pWithShop = { ...prod, shopId: resolveShopId(prod.shopId) };
    const nw = { ...dbData, products: [...(dbData.products || []), pWithShop] };
    persistChanges(nw);
  };

  const handleUpdateProduct = (updated: Product) => {
    const list = (dbData.products || []).map(p => p.id === updated.id ? updated : p);
    const nw = { ...dbData, products: list };
    persistChanges(nw);
  };

  // Material Purchases
  const handleAddPurchase = (pur: Purchase) => {
    const pWithShop = { ...pur, shopId: resolveShopId(pur.shopId) };
    const nw = { ...dbData, purchases: [...dbData.purchases, pWithShop] };
    persistChanges(nw);
  };

  const handleDeletePurchase = (id: string) => {
    const cleanList = dbData.purchases.filter(p => p.id !== id);
    const nw = { ...dbData, purchases: cleanList };
    persistChanges(nw);
  };

  // Staff registry
  const handleAddStaff = (member: Staff) => {
    const sWithShop = { ...member, shopId: resolveShopId(member.shopId) };
    const nw = { ...dbData, staff: [...dbData.staff, sWithShop] };
    persistChanges(nw);
  };

  const handleUpdateStaff = (updated: Staff) => {
    const list = dbData.staff.map(s => s.id === updated.id ? updated : s);
    const nw = { ...dbData, staff: list };
    persistChanges(nw);
  };

  const handleDeleteStaff = (id: string) => {
    const cleanList = dbData.staff.filter(s => s.id !== id);
    const nw = { ...dbData, staff: cleanList };
    persistChanges(nw);
  };

  // Welfare Perks
  const handleAddWelfareExpense = (exp: StaffWelfareExpense) => {
    const eWithShop = { ...exp, shopId: resolveShopId(exp.shopId) };
    const nw = { ...dbData, welfareExpenses: [...dbData.welfareExpenses, eWithShop] };
    persistChanges(nw);
  };

  const handleDeleteWelfareExpense = (id: string) => {
    const cleanList = dbData.welfareExpenses.filter(e => e.id !== id);
    const nw = { ...dbData, welfareExpenses: cleanList };
    persistChanges(nw);
  };

  // Staff Loan Advances
  const handleAddAdvance = (adv: StaffAdvance) => {
    const aWithShop = { ...adv, shopId: resolveShopId(adv.shopId) };
    const nw = { ...dbData, advances: [...dbData.advances, aWithShop] };
    persistChanges(nw);
  };

  const handleRecoverAdvance = (id: string, amount: number) => {
    const list = dbData.advances.map(a => {
      if (a.id === id) {
        return { ...a, recoveredAmount: a.recoveredAmount + amount };
      }
      return a;
    });
    const nw = { ...dbData, advances: list };
    persistChanges(nw);
  };

  const handleDeleteAdvance = (id: string) => {
    const cleanList = dbData.advances.filter(a => a.id !== id);
    const nw = { ...dbData, advances: cleanList };
    persistChanges(nw);
  };

  // Salary Payroll releases
  const handleAddSalary = (sal: SalaryPayment) => {
    const sWithShop = { ...sal, shopId: resolveShopId(sal.shopId) };
    // If salary handles advance recovery, automatically update the advance ledger recovered figures!
    let updatedAdvances = [...dbData.advances];
    if (sWithShop.advanceRecovery > 0) {
      // seek outstanding loans from same staff helper and offset
      let recoveryRemaining = sWithShop.advanceRecovery;
      updatedAdvances = dbData.advances.map(adv => {
        if (adv.staffId === sWithShop.staffId && recoveryRemaining > 0) {
          const outstanding = adv.amount - adv.recoveredAmount;
          if (outstanding > 0) {
            const deduct = Math.min(outstanding, recoveryRemaining);
            recoveryRemaining -= deduct;
            return { ...adv, recoveredAmount: adv.recoveredAmount + deduct };
          }
        }
        return adv;
      });
    }

    const nw = { 
      ...dbData, 
      salaries: [...dbData.salaries, sWithShop],
      advances: updatedAdvances 
    };
    persistChanges(nw);
  };

  // Kitchen Inventory stock update
  const handleUpdateStock = (id: string, closingStock: number) => {
    const list = dbData.inventory.map(item => {
      if (item.id === id) {
        return { ...item, closingStock };
      }
      return item;
    });
    const nw = { ...dbData, inventory: list };
    persistChanges(nw);
  };

  const handleAddInventoryItem = (item: any) => {
    const itemWithShop = { ...item, shopId: resolveShopId(item.shopId) };
    const nw = { ...dbData, inventory: [...(dbData.inventory || []), itemWithShop] };
    persistChanges(nw);
  };

  const handleUpdateInventoryItem = (updated: any) => {
    const list = (dbData.inventory || []).map(item => item.id === updated.id ? updated : item);
    const nw = { ...dbData, inventory: list };
    persistChanges(nw);
  };

  const handleDeleteInventoryItem = (id: string) => {
    const cleanList = (dbData.inventory || []).filter(item => item.id !== id);
    const nw = { ...dbData, inventory: cleanList };
    persistChanges(nw);
  };

  // Shift lock log checkin
  const handleCommitClosing = (log: DailyClosingLog) => {
    const lWithShop = { ...log, shopId: resolveShopId(log.shopId) };
    // check if closing for date already exists for same shop
    const cleanList = (dbData.closingLogs || []).filter(l => !(l.date === lWithShop.date && l.shopId === lWithShop.shopId));
    const nw = { ...dbData, closingLogs: [...cleanList, lWithShop] };
    persistChanges(nw);
  };

  // Handoff added variables on voice parsing
  const handleAddParsedPurchase = (part: Partial<Purchase>) => {
    const completePur: Purchase = {
      id: "raw_" + Date.now(),
      date: part.date || new Date().toISOString().split('T')[0],
      purchaseType: part.purchaseType || 'Shop',
      vendorName: part.vendorName || "Mahesh Traders",
      itemName: part.itemName || "Raw Materials stock",
      category: part.category || "Other",
      quantity: part.quantity || 1,
      unit: part.unit || "kg",
      rate: part.rate || Number(part.amount || 0),
      amount: Number(part.amount || 0),
      paymentMode: part.paymentMode || 'UPI',
      invoiceNumber: part.invoiceNumber,
      remarks: part.remarks || "Parsed voice voucher"
    };

    const nw = { ...dbData, purchases: [...dbData.purchases, completePur] };
    persistChanges(nw);
    alert(`Confirmed & Added Purchase: ${completePur.itemName} for ₹${completePur.amount}`);
  };

  const handleAddParsedSales = (sales: DailySales) => {
    handleAddSales(sales);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 text-gray-700 font-sans">
        <RefreshCw className="w-8 h-8 text-orange-600 animate-spin" />
        <span className="font-extrabold text-sm tracking-tight mt-3">Ganesh Bhel Loading...</span>
        <p className="text-[11px] text-gray-400 mt-1 uppercase font-bold tracking-widest">
          Mounting relational seed memory
        </p>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <LoginPortal 
        onLogin={handleLogin}
        language={dbData.language || "en"}
        onLanguageChange={handleUpdateLanguage}
      />
    );
  }

  const filteredData: SystemData = {
    ...dbData,
    sales: activeShopId === "all" ? dbData.sales : dbData.sales.filter(s => s.shopId === activeShopId || (!s.shopId && activeShopId === "main")),
    purchases: activeShopId === "all" ? dbData.purchases : dbData.purchases.filter(p => p.shopId === activeShopId || (!p.shopId && activeShopId === "main")),
    staff: activeShopId === "all" ? dbData.staff : dbData.staff.filter(st => st.shopId === activeShopId || (!st.shopId && activeShopId === "main")),
    advances: activeShopId === "all" ? dbData.advances : dbData.advances.filter(a => a.shopId === activeShopId || (!a.shopId && activeShopId === "main")),
    welfareExpenses: activeShopId === "all" ? dbData.welfareExpenses : dbData.welfareExpenses.filter(e => e.shopId === activeShopId || (!e.shopId && activeShopId === "main")),
    salaries: activeShopId === "all" ? dbData.salaries : dbData.salaries.filter(sal => sal.shopId === activeShopId || (!sal.shopId && activeShopId === "main")),
    inventory: activeShopId === "all" ? dbData.inventory : dbData.inventory.filter(i => i.shopId === activeShopId || (!i.shopId && activeShopId === "main")),
    closingLogs: activeShopId === "all" ? (dbData.closingLogs || []) : (dbData.closingLogs || []).filter(cl => cl.shopId === activeShopId || (!cl.shopId && activeShopId === "main")),
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20 text-slate-800 flex flex-col justify-between font-sans relative antialiased selection:bg-orange-150 selection:text-orange-900">
      
      {/* Top Banner & Sidebar Control */}
      <div>
        <Navbar 
          data={dbData} 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          onLogout={handleLogout}
          activeUserRole={currentUserRole}
          onUpdateLanguage={handleUpdateLanguage}
          activeShopId={activeShopId}
          onSelectShop={handleSelectShop}
        />

        {/* Sync loading status indicator */}
        {savePending && (
          <div className="bg-emerald-50 text-emerald-800 text-[10px] font-bold p-1 px-4 text-center border-b border-emerald-100 flex items-center justify-center space-x-1 font-mono uppercase tracking-wider print:hidden">
            <RefreshCw className="w-3 h-3 animate-spin text-emerald-600" />
            <span>Commit syncing to cloud memory safe...</span>
          </div>
        )}

        {/* Master workspace grids layout */}
        <div className="max-w-7xl mx-auto px-4 py-6 md:px-6">
          {activeTab === "dashboard" && (
            <div className="space-y-6">
              <Dashboard 
                data={filteredData}
                onAddSales={handleAddSales}
                onAddPurchase={handleAddPurchase}
                onAddAdvance={handleAddAdvance}
                onAddExpense={handleAddWelfareExpense}
                onAddSalary={handleAddSalary}
              />
              <HelpAssistant 
                data={filteredData}
                onAddParsedPurchase={handleAddParsedPurchase}
                onAddParsedSales={handleAddParsedSales}
              />
            </div>
          )}

          {activeTab === "sales" && (
            <div className="space-y-6">
              <DailySalesManager 
                data={filteredData}
                onAddSales={handleAddSales}
                onDeleteSales={handleDeleteSales}
                onAddItemizedSales={handleAddItemizedSales}
              />
              <ProductsManager 
                data={filteredData}
                onAddProduct={handleAddProduct}
                onUpdateProduct={handleUpdateProduct}
                onDeleteProduct={handleDeleteProduct}
                onAddCategory={handleAddCategory}
                onDeleteCategory={handleDeleteCategory}
                userRole={currentUserRole}
              />
            </div>
          )}

          {activeTab === "purchases" && (
            <PurchasesManager 
              data={filteredData}
              onAddPurchase={handleAddPurchase}
              onDeletePurchase={handleDeletePurchase}
            />
          )}

          {activeTab === "staff" && (
            <StaffManager 
              data={filteredData}
              onAddStaff={handleAddStaff}
              onUpdateStaff={handleUpdateStaff}
              onDeleteStaff={handleDeleteStaff}
            />
          )}

          {activeTab === "welfare" && (
            <StaffWelfareManager 
              data={filteredData}
              onAddExpense={handleAddWelfareExpense}
              onDeleteExpense={handleDeleteWelfareExpense}
            />
          )}

          {activeTab === "advances" && (
            <StaffAdvancesManager 
              data={filteredData}
              onAddAdvance={handleAddAdvance}
              onRecoverAdvance={handleRecoverAdvance}
              onDeleteAdvance={handleDeleteAdvance}
            />
          )}

          {activeTab === "salaries" && (
            <SalariesManager 
              data={filteredData}
              onAddSalary={handleAddSalary}
            />
          )}

          {activeTab === "stock" && (
            <InventoryManager 
              data={filteredData}
              onUpdateStock={handleUpdateStock}
              onAddInventoryItem={handleAddInventoryItem}
              onUpdateInventoryItem={handleUpdateInventoryItem}
              onDeleteInventoryItem={handleDeleteInventoryItem}
              userRole={dbData.userRole}
              shops={dbData.shops || []}
            />
          )}

          {activeTab === "cashflow" && (
            <CashFlowManager data={filteredData} />
          )}

          {activeTab === "closing" && (
            <DailyClosingManager 
              data={filteredData}
              onCommitClosing={handleCommitClosing}
            />
          )}

          {activeTab === "reports" && (
            <ReportsManager data={filteredData} />
          )}

          {activeTab === "shops" && (
            <ShopsManager 
              data={dbData}
              onAddShop={handleAddShop}
              onUpdateShop={handleUpdateShop}
              onDeleteShop={handleDeleteShop}
              language={dbData.language || "en"}
            />
          )}

          {activeTab === "backups" && (
            <DatabaseManager data={dbData} onRestore={(fresh) => setDbData(fresh)} />
          )}
        </div>
      </div>

      {/* Structured brand footer block */}
      <footer className="print:hidden border-t border-gray-100 bg-white py-4 text-center mt-12 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
        <span>Ganesh Bhel Operations Hub &middot; Powered by GBMS Enterprise Architecture</span>
      </footer>

    </div>
  );
}
