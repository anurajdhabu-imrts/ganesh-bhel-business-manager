import React, { useState } from "react";
import { InventoryItem, SystemData } from "../types";
import { 
  PlusCircle, ShieldAlert, Sparkles, Check, Package, RotateCcw, 
  AlertTriangle, Pencil, Trash2, Search, X, Loader2, Building, Plus
} from "lucide-react";

interface InventoryProps {
  data: SystemData;
  onUpdateStock?: (id: string, closingStock: number) => void;
  onAddInventoryItem?: (item: any) => void;
  onUpdateInventoryItem?: (item: any) => void;
  onDeleteInventoryItem?: (id: string) => void;
  userRole?: "owner" | "manager";
  shops?: any[];
}

export default function InventoryManager({ 
  data, 
  onUpdateStock,
  onAddInventoryItem,
  onUpdateInventoryItem,
  onDeleteInventoryItem,
  userRole = "owner",
  shops = []
}: InventoryProps) {
  const isOwner = userRole === "owner";
  const language = data.language;

  // Search and local filters
  const [searchQuery, setSearchQuery] = useState("");
  const [shopFilter, setShopFilter] = useState("all");

  // Add Item slide-down states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addName, setAddName] = useState("");
  const [addOpening, setAddOpening] = useState("");
  const [addPurchased, setAddPurchased] = useState("");
  const [addConsumed, setAddConsumed] = useState("");
  const [addThreshold, setAddThreshold] = useState("");
  const [addCostPerUnit, setAddCostPerUnit] = useState("");
  const [addUnit, setAddUnit] = useState("kg");
  const [addCustomUnit, setAddCustomUnit] = useState("");
  const [addShopId, setAddShopId] = useState("");

  // Edit Item modal states
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [editName, setEditName] = useState("");
  const [editOpening, setEditOpening] = useState("");
  const [editPurchased, setEditPurchased] = useState("");
  const [editConsumed, setEditConsumed] = useState("");
  const [editClosing, setEditClosing] = useState("");
  const [editThreshold, setEditThreshold] = useState("");
  const [editCostPerUnit, setEditCostPerUnit] = useState("");
  const [editUnit, setEditUnit] = useState("kg");
  const [editCustomUnit, setEditCustomUnit] = useState("");
  const [editShopId, setEditShopId] = useState("");

  // Handler for quick refill
  const [quickRefillId, setQuickRefillId] = useState<string | null>(null);
  const [quickRefillValue, setQuickRefillValue] = useState("");

  // Compute stats
  const inventoryItems = data.inventory || [];
  const filteredItems = inventoryItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesShop = shopFilter === "all" || item.shopId === shopFilter;
    return matchesSearch && matchesShop;
  });

  const criticalIssues = filteredItems.filter(i => Number(i.closingStock) <= Number(i.lowStockThreshold));

  // Auto calculated fields in Add Form
  const tempAddOpening = Number(addOpening) || 0;
  const tempAddPurchased = Number(addPurchased) || 0;
  const tempAddConsumed = Number(addConsumed) || 0;
  const computedAddClosing = Math.max(0, tempAddOpening + tempAddPurchased - tempAddConsumed);

  const handleCreateItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addName.trim() || !onAddInventoryItem) return;

    const unitToSave = addUnit === "custom" ? (addCustomUnit.trim() || "pcs") : addUnit;
    const finalOpening = Number(addOpening) || 0;
    const finalPurchased = Number(addPurchased) || 0;
    const finalConsumed = Number(addConsumed) || 0;
    
    // closing defaults to opening + purchased - consumed
    const finalClosing = finalOpening + finalPurchased - finalConsumed;

    const newItem = {
      id: "inv_" + Date.now(),
      name: addName.trim(),
      openingStock: finalOpening,
      purchasedStock: finalPurchased,
      consumedStock: finalConsumed,
      closingStock: finalClosing,
      unit: unitToSave,
      lowStockThreshold: Number(addThreshold) || 5,
      shopId: addShopId || undefined,
      costPerUnit: Number(addCostPerUnit) || 0
    };

    onAddInventoryItem(newItem);
    
    // Reset add state
    setAddName("");
    setAddOpening("");
    setAddPurchased("");
    setAddConsumed("");
    setAddThreshold("");
    setAddCostPerUnit("");
    setAddCustomUnit("");
    setAddShopId("");
    setIsAddOpen(false);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !onUpdateInventoryItem) return;

    const unitToSave = editUnit === "custom" ? (editCustomUnit.trim() || "pcs") : editUnit;
    const opening = Number(editOpening) || 0;
    const purchased = Number(editPurchased) || 0;
    const consumed = Number(editConsumed) || 0;
    
    // User might manually overwrite closing, otherwise calculate
    let closing = Number(editClosing);
    if (isNaN(closing) || editClosing === "") {
      closing = Math.max(0, opening + purchased - consumed);
    }

    const updated = {
      ...editingItem,
      name: editName.trim(),
      openingStock: opening,
      purchasedStock: purchased,
      consumedStock: consumed,
      closingStock: closing,
      unit: unitToSave,
      lowStockThreshold: Number(editThreshold) || 1,
      shopId: editShopId || undefined,
      costPerUnit: Number(editCostPerUnit) || 0
    };

    onUpdateInventoryItem(updated);
    setEditingItem(null);
  };

  const handleQuickRefillSubmit = (id: string) => {
    const parsed = Number(quickRefillValue);
    if (isNaN(parsed) || parsed < 0) {
      alert(language === 'mr' ? "कृपया वैध संख्या टाका!" : "Please enter a valid stock level.");
      return;
    }

    if (onUpdateStock) {
      onUpdateStock(id, parsed);
    } else if (onUpdateInventoryItem) {
      // Fallback
      const target = inventoryItems.find(i => i.id === id);
      if (target) {
        onUpdateInventoryItem({ ...target, closingStock: parsed });
      }
    }
    setQuickRefillId(null);
    setQuickRefillValue("");
  };

  const triggerDelete = (item: InventoryItem) => {
    if (!onDeleteInventoryItem) return;
    const message = language === 'mr' 
      ? `तुम्हाली खात्री आहे का की तुम्ही "${item.name}" काढू इच्छिता?`
      : `Are you sure you want to delete "${item.name}" from inventory?`;
    if (confirm(message)) {
      onDeleteInventoryItem(item.id);
    }
  };

  const getShopName = (shId?: string) => {
    if (!shId) return language === 'mr' ? "मुख्य शाखा" : "Main Outlet";
    const match = shops.find(s => s.id === shId);
    return match ? match.name : shId;
  };

  return (
    <div className="space-y-6">
      
      {/* Alert check */}
      {!isOwner && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start space-x-3 text-amber-900">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs">
            <p className="font-extrabold">
              {language === "mr" ? "मर्यादित व्यवस्थापक मोड - केवळ वाचन हक्क" : "Manager Read-Only Mode"}
            </p>
            <p className="text-amber-700/80 mt-0.5">
              {language === "mr"
                ? "नवीन साठा तयार करणे किंवा मालाचे संपूर्ण तपशील संपादन काम केवळ मालक (Owner) करू शकतात. तुम्ही खालील साठा भरा बटण वापरू शकता."
                : "Adding stock items, name modifications, and threshold reviews are restricted to the Owner. Managers can perform count refills."}
            </p>
          </div>
        </div>
      )}

      {/* Critical Status banner */}
      {criticalIssues.length > 0 && (
        <div className="bg-rose-50 rounded-2xl p-4 border border-rose-100/50 text-xs text-rose-800 flex items-start space-x-3 shadow-xs">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 animate-pulse" />
          <div className="space-y-1">
            <h4 className="font-extrabold">
              {language === 'mr' ? "सावधगिरी! खालील मालाचा साठा कमी आहे" : "Critical Low Stock Action Required!"}
            </h4>
            <p className="text-rose-600 leading-snug">
              {language === 'mr' 
                ? `${criticalIssues.map(i => i.name).join(", ")} मालाचा आवश्यक साठा किमान मर्यादेपेक्षा कमी झाला आहे. त्वरित खरेदी ऑर्डर करा.`
                : `The inventory levels of: [ ${criticalIssues.map(i => i.name).join(", ")} ] have fallen below threshold. Procure soon to ensure uninterrupted operation.`}
            </p>
          </div>
        </div>
      )}

      {/* Filters & Control Area */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="font-extrabold text-gray-950 text-sm flex items-center space-x-2">
              <Package className="w-4 h-4 text-orange-500" />
              <span>{language === 'mr' ? "किचन कच्चा माल व स्टॉक" : "Kitchen Raw Materials & Stock"}</span>
            </h3>
            <p className="text-[10px] text-gray-400 font-medium">
              {language === 'mr' 
                ? "बटाटा, शेव, पुरी आणि इतर घटकांचे वास्तविक वेळ संपादन" 
                : "Real-time logging of Sev, Puri, Onions, and other key stock items"}
            </p>
          </div>
          
          {isOwner && onAddInventoryItem && (
            <button
              onClick={() => {
                setIsAddOpen(!isAddOpen);
              }}
              className="bg-orange-600 hover:bg-orange-700 text-white font-extrabold px-3 py-1.5 rounded-lg text-xs flex items-center space-x-1 cursor-pointer transition shadow-xs"
            >
              {isAddOpen ? (
                <>
                  <X className="w-3.5 h-3.5" />
                  <span>{language === 'mr' ? "बंद करा" : "Close"}</span>
                </>
              ) : (
                <>
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>{language === 'mr' ? "नवीन कच्चा माल जोडा" : "Add Stock Item"}</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Form panel */}
        {isAddOpen && isOwner && (
          <form onSubmit={handleCreateItem} className="p-4 bg-gray-50/50 rounded-xl border border-gray-200/55 space-y-4">
            <h4 className="text-xs font-bold text-gray-800 flex items-center space-x-2 pb-2 border-b border-gray-200">
              <Sparkles className="w-4 h-4 text-orange-600" />
              <span>{language === 'mr' ? "नवीन कच्चा माल नोंदणी" : "Add New Stock Item Configuration"}</span>
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">
                  {language === 'mr' ? "मालाचे नाव" : "Item Name"} *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Potato, Schezwan sauce, Puri"
                  value={addName}
                  onChange={e => setAddName(e.target.value)}
                  className="w-full text-xs bg-white border border-gray-200 rounded-lg p-2.5 outline-none focus:border-orange-500 font-semibold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">
                  {language === 'mr' ? "एकक (Unit)" : "Measurement Unit"}
                </label>
                <div className="flex gap-2">
                  <select
                    value={addUnit}
                    onChange={e => setAddUnit(e.target.value)}
                    className="flex-1 text-xs bg-white border border-gray-200 rounded-lg p-2 outline-none focus:border-orange-500 font-semibold"
                  >
                    <option value="kg">kg (किग्रॅ)</option>
                    <option value="pcs">pcs (नग)</option>
                    <option value="packet">packet (पाकीट)</option>
                    <option value="litre">litre (लिटर)</option>
                    <option value="box">box (बॉक्स)</option>
                    <option value="custom">Custom...</option>
                  </select>
                  {addUnit === "custom" && (
                    <input
                      type="text"
                      required
                      placeholder="e.g. bag"
                      value={addCustomUnit}
                      onChange={e => setAddCustomUnit(e.target.value)}
                      className="w-16 text-xs bg-white border border-gray-200 rounded-lg p-2 outline-none focus:border-orange-500 font-semibold text-center"
                    />
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">
                  {language === 'mr' ? "सुरुवातीचा साठा (Opening)" : "Opening Stock"}
                </label>
                <input
                  type="number"
                  step="any"
                  placeholder="0"
                  value={addOpening}
                  onChange={e => setAddOpening(e.target.value)}
                  className="w-full text-xs bg-white border border-gray-200 rounded-lg p-2.5 outline-none focus:border-orange-500 font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">
                  {language === 'mr' ? "साठा अलार्म पातळी (Alert Threshold)" : "Low Stock Alert Limit"}
                </label>
                <input
                  type="number"
                  step="any"
                  placeholder="5"
                  value={addThreshold}
                  onChange={e => setAddThreshold(e.target.value)}
                  className="w-full text-xs bg-white border border-gray-200 rounded-lg p-2.5 outline-none focus:border-orange-555 font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">
                  {language === 'mr' ? "खरेदी केलेला माल" : "Purchased Stock"}
                </label>
                <input
                  type="number"
                  step="any"
                  placeholder="0"
                  value={addPurchased}
                  onChange={e => setAddPurchased(e.target.value)}
                  className="w-full text-xs bg-white border border-gray-200 rounded-lg p-2.5 outline-none focus:border-orange-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">
                  {language === 'mr' ? "वापरलेला माल" : "Consumed Stock"}
                </label>
                <input
                  type="number"
                  step="any"
                  placeholder="0"
                  value={addConsumed}
                  onChange={e => setAddConsumed(e.target.value)}
                  className="w-full text-xs bg-white border border-gray-200 rounded-lg p-2.5 outline-none focus:border-orange-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">
                  {language === 'mr' ? "प्रति युनिट खरेदी दर (₹)" : "Standard Rate (₹ / Unit)"}
                </label>
                <input
                  type="number"
                  step="any"
                  placeholder="e.g. 50"
                  value={addCostPerUnit}
                  onChange={e => setAddCostPerUnit(e.target.value)}
                  className="w-full text-xs bg-white border border-gray-200 rounded-lg p-2.5 outline-none focus:border-orange-500 font-extrabold text-emerald-700"
                />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">
                  {language === 'mr' ? "शाखा / दुकान" : "Shop Location"}
                </label>
                <select
                  value={addShopId}
                  onChange={e => setAddShopId(e.target.value)}
                  className="w-full text-xs bg-white border border-gray-200 rounded-lg p-2.5 outline-none focus:border-orange-500 font-semibold"
                >
                  <option value="">Default (Active Outlet)</option>
                  {shops.map(sh => (
                    <option key={sh.id} value={sh.id}>{sh.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col justify-end">
                <div className="text-[10px] text-gray-500 font-bold mb-1">
                  {language === 'mr' ? `अनुमानित अखेरचा माल : ${computedAddClosing}` : `Calculated stock: ${computedAddClosing} ${addUnit === "custom" ? addCustomUnit : addUnit}`}
                </div>
                <button
                  type="submit"
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white font-extrabold p-2.5 rounded-lg text-xs cursor-pointer transition shadow"
                >
                  {language === 'mr' ? "माल जतन करा" : "Register Stock Item"}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Search, Filter bar */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={language === 'mr' ? "कच्चा मालाचे नाव शोध..." : "Search ingredients name..."}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-9 pr-4 py-2 bg-slate-50 hover:bg-slate-100/70 border border-gray-255 rounded-lg outline-none focus:border-orange-400 focus:bg-white transition"
            />
          </div>

          <div className="w-full sm:w-48">
            <select
              value={shopFilter}
              onChange={e => setShopFilter(e.target.value)}
              className="w-full text-xs bg-slate-50 hover:bg-slate-100/70 border border-gray-255 rounded-lg p-2 outline-none font-semibold"
            >
              <option value="all">🏢 {language === 'mr' ? "सर्व वितरक शाखा" : "All Outlets"}</option>
              {shops.map(sh => (
                <option key={sh.id} value={sh.id}>📍 {sh.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Grid of Inventory cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {filteredItems.map(item => {
          const isLow = Number(item.closingStock) <= Number(item.lowStockThreshold);
          return (
            <div 
              key={item.id} 
              className={`bg-white rounded-2xl p-4 shadow-sm border relative overflow-hidden flex flex-col justify-between min-h-48 group transition-all duration-300 hover:shadow-md ${
                isLow ? 'border-rose-250 bg-rose-50/5' : 'border-gray-100 hover:border-orange-200'
              }`}
            >
              {/* Header inside card */}
              <div>
                <div className="flex justify-between items-start">
                  <span className={`p-2.5 rounded-xl ${isLow ? 'bg-rose-50 text-rose-500' : 'bg-orange-50 text-orange-500'}`}>
                    <Package className="w-5 h-5" />
                  </span>
                  
                  <div className="flex items-center space-x-1">
                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                      isLow ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {isLow ? (language === 'mr' ? 'कमी साठा' : 'Low Stock') : (language === 'mr' ? 'पर्याप्त साठा' : 'Good Level')}
                    </span>

                    {/* Owner specific item edit/delete actions */}
                    {isOwner && (
                      <div className="opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity flex space-x-0.5 ml-1 bg-white p-0.5 rounded-lg shadow-xs border border-gray-200">
                        <button
                          onClick={() => {
                            setEditingItem(item);
                            setEditName(item.name);
                            setEditOpening(String(item.openingStock || 0));
                            setEditPurchased(String(item.purchasedStock || 0));
                            setEditConsumed(String(item.consumedStock || 0));
                            setEditClosing(String(item.closingStock || 0));
                            setEditThreshold(String(item.lowStockThreshold || 5));
                            setEditUnit(item.unit);
                            setEditShopId(item.shopId || "");
                            setEditCostPerUnit(String(item.costPerUnit || 0));
                          }}
                          className="p-1 hover:text-orange-600 hover:bg-orange-50 rounded"
                          title="Edit complete details"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => triggerDelete(item)}
                          className="p-1 hover:text-red-650 hover:bg-rose-50 rounded"
                          title="Delete stock item"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-extrabold text-gray-900 text-xs truncate mr-2">{item.name}</h4>
                    {item.costPerUnit ? (
                      <span className="text-[10px] font-extrabold text-emerald-800 font-mono bg-emerald-50/80 px-1.5 py-0.5 rounded-md shrink-0" title={language === 'mr' ? "किंमत दर" : "Standard rate per unit"}>
                        ₹{item.costPerUnit}/{item.unit}
                      </span>
                    ) : (
                      <span className="text-[8px] font-bold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded-md shrink-0 italic">
                        {language === 'mr' ? 'दर नाही' : 'No rate'}
                      </span>
                    )}
                  </div>
                  <div className="text-[9px] text-gray-400 mt-0.5 flex items-center space-x-1">
                    <Building className="w-2.5 h-2.5 text-gray-300" />
                    <span className="truncate">{getShopName(item.shopId)}</span>
                  </div>
                </div>
              </div>

              {/* Technical indicators in midcard */}
              <div className="grid grid-cols-3 gap-1 bg-slate-50/70 p-1.5 rounded-xl my-2 text-[9px] font-extrabold text-gray-500 font-mono">
                <div>
                  <div className="text-[7px] text-gray-400 uppercase">Open (सुरु)</div>
                  <span className="text-gray-705">{item.openingStock || 0}</span>
                </div>
                <div>
                  <div className="text-[7px] text-gray-400 uppercase">Buy (खरेदी)</div>
                  <span className="text-gray-750">+{item.purchasedStock || 0}</span>
                </div>
                <div>
                  <div className="text-[7px] text-gray-400 uppercase">Use (वापर)</div>
                  <span className="text-gray-750">-{item.consumedStock || 0}</span>
                </div>
              </div>

              {/* Footer inside card */}
              <div className="border-t border-gray-100 pt-2 flex justify-between items-center text-xs">
                <div>
                  <div className="text-[8px] uppercase font-bold text-gray-400">
                    {language === 'mr' ? "अखेरचा साठा" : "Net Closing"}
                  </div>
                  <div className={`font-mono text-sm font-extrabold flex items-baseline space-x-0.5 ${isLow ? 'text-rose-600 font-black' : 'text-slate-800'}`}>
                    <span>{item.closingStock}</span>
                    <span className="text-[10px] font-semibold text-gray-400 font-sans ml-0.5">{item.unit || "kg"}</span>
                  </div>
                </div>

                <div className="text-right">
                  {quickRefillId === item.id ? (
                    <div className="flex items-center space-x-1">
                      <input
                        type="number"
                        placeholder="Count"
                        autoFocus
                        value={quickRefillValue}
                        onChange={e => setQuickRefillValue(e.target.value)}
                        className="w-14 p-1 bg-white border border-orange-300 text-xs font-bold font-mono text-center rounded outline-none"
                      />
                      <button
                        onClick={() => handleQuickRefillSubmit(item.id)}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold p-1 rounded cursor-pointer"
                      >
                        ✓
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setQuickRefillId(item.id); setQuickRefillValue(String(item.closingStock)); }}
                      className="bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-100 text-[9px] font-bold px-2 py-1 rounded cursor-pointer transition animate-fade-in"
                    >
                      {language === 'mr' ? "भरून घ्या" : "Refill"}
                    </button>
                  )}
                </div>
              </div>
              
              {/* Threshold label */}
              <div className="text-[8px] text-gray-400/80 text-left pt-1 font-semibold flex items-center justify-between">
                <span>Limit: {item.lowStockThreshold} {item.unit}</span>
                {isLow && <span className="text-rose-500 font-extrabold animate-pulse">Needs refill!</span>}
              </div>
            </div>
          );
        })}

        {filteredItems.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-400 italic">
            {language === 'mr' ? "कोणताही स्टॉक कच्चा माल सापडला नाही." : "No kitchen raw stock levels match current query."}
          </div>
        )}
      </div>

      {/* Complete edit overlay dialog (Modal) */}
      {editingItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-gray-100 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-gray-100">
              <div className="flex items-center space-x-2">
                <Pencil className="w-4 h-4 text-orange-600" />
                <h4 className="font-extrabold text-slate-900 text-sm">
                  {language === 'mr' ? `संपादन: ${editingItem.name}` : `Edit Stock Details: ${editingItem.name}`}
                </h4>
              </div>
              <button 
                onClick={() => setEditingItem(null)}
                className="p-1 hover:bg-slate-100 rounded-full text-gray-400 hover:text-slate-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">
                    {language === 'mr' ? "मालाचे नाव" : "Item Name"}
                  </label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-gray-200 rounded-lg p-2.5 outline-none focus:border-orange-500 font-extrabold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">
                    {language === 'mr' ? "युनिट (Unit)" : "Measurement Unit"}
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={editUnit}
                      onChange={e => setEditUnit(e.target.value)}
                      className="flex-1 text-xs bg-slate-50 border border-gray-200 rounded-lg p-2 outline-none focus:border-orange-500 font-semibold"
                    >
                      <option value="kg">kg (किग्रॅ)</option>
                      <option value="pcs">pcs (नग)</option>
                      <option value="packet">packet (पाकीट)</option>
                      <option value="litre">litre (लिटर)</option>
                      <option value="box">box (बॉक्स)</option>
                      <option value="custom">Custom...</option>
                    </select>
                    {editUnit === "custom" && (
                      <input
                        type="text"
                        required
                        placeholder="e.g. bag"
                        value={editCustomUnit}
                        onChange={e => setEditCustomUnit(e.target.value)}
                        className="w-16 text-xs bg-white border border-gray-200 rounded-lg p-2 outline-none focus:border-orange-500 font-semibold text-center"
                      />
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">
                    {language === 'mr' ? "सुरुवातीचा" : "Opening Stock"}
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={editOpening}
                    onChange={e => setEditOpening(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-gray-200 rounded-lg p-2.5 outline-none focus:border-orange-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">
                    {language === 'mr' ? "खरेदी माल" : "Purchased Stock"}
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={editPurchased}
                    onChange={e => setEditPurchased(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-gray-200 rounded-lg p-2.5 outline-none focus:border-orange-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">
                    {language === 'mr' ? "वापरलेला माल" : "Consumed Stock"}
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={editConsumed}
                    onChange={e => setEditConsumed(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-gray-200 rounded-lg p-2.5 outline-none focus:border-orange-500 font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">
                    {language === 'mr' ? "थेट अखेरचा साठा" : "Overwrite Closing"}
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="Auto"
                    value={editClosing}
                    onChange={e => setEditClosing(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-gray-200 rounded-lg p-2 py-2.5 outline-none focus:border-orange-500 font-black text-orange-600 text-center"
                  />
                  <span className="text-[7px] text-gray-400 font-semibold block leading-tight mt-0.5">
                    {language === 'mr' ? 'कोरे ठेवल्यास स्वयंचलित मोजणी होईल' : 'Blank for auto calculate'}
                  </span>
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">
                    {language === 'mr' ? "कमीत कमी पातळी" : "Low Stock Limit"}
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={editThreshold}
                    onChange={e => setEditThreshold(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-gray-200 rounded-lg p-2.5 outline-none focus:border-orange-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">
                    {language === 'mr' ? "खरेदी दर प्रति युनिट (₹)" : "Standard Rate (₹ / Unit)"}
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="0"
                    value={editCostPerUnit}
                    onChange={e => setEditCostPerUnit(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-gray-200 rounded-lg p-2.5 outline-none focus:border-orange-500 font-extrabold text-emerald-755"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">
                    {language === 'mr' ? "शाखा / दुकान" : "Shop Location"}
                  </label>
                  <select
                    value={editShopId}
                    onChange={e => setEditShopId(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-gray-200 rounded-lg p-2.5 outline-none focus:border-orange-500 font-semibold"
                  >
                    <option value="">Default (Active Outlet)</option>
                    {shops.map(sh => (
                      <option key={sh.id} value={sh.id}>{sh.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition cursor-pointer"
                >
                  {language === 'mr' ? "रद्द करा" : "Cancel"}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-extrabold shadow cursor-pointer transition"
                >
                  {language === 'mr' ? "सुधारणा जतन करा" : "Update Database"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
