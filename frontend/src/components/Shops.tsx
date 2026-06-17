import React, { useState } from "react";
import { Store, Plus, MapPin, CheckCircle, AlertTriangle, Trash2, Edit3, Building, TrendingUp, Users } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { SystemData, Shop } from "../types";

interface ShopsProps {
  data: SystemData;
  onAddShop: (shop: Shop) => void;
  onUpdateShop: (shop: Shop) => void;
  onDeleteShop: (id: string) => void;
  language: "en" | "mr";
}

export default function ShopsManager({ data, onAddShop, onUpdateShop, onDeleteShop, language }: ShopsProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingShop, setEditingShop] = useState<Shop | null>(null);

  const [formName, setFormName] = useState("");
  const [formLocation, setFormLocation] = useState("");
  const [formStatus, setFormStatus] = useState<"Active" | "Inactive">("Active");

  const list = data.shops || [];

  const handleOpenAdd = () => {
    setEditingShop(null);
    setFormName("");
    setFormLocation("");
    setFormStatus("Active");
    setShowAddForm(true);
  };

  const handleOpenEdit = (shop: Shop) => {
    setEditingShop(shop);
    setFormName(shop.name);
    setFormLocation(shop.location || "");
    setFormStatus(shop.status);
    setShowAddForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    if (editingShop) {
      onUpdateShop({
        ...editingShop,
        name: formName.trim(),
        location: formLocation.trim() || undefined,
        status: formStatus,
      });
    } else {
      const generatedId = "shop_" + Date.now().toString(36);
      onAddShop({
        id: generatedId,
        name: formName.trim(),
        location: formLocation.trim() || undefined,
        status: formStatus,
      });
    }

    setShowAddForm(false);
    setEditingShop(null);
  };

  // Aggregation stats per shop
  const getShopStats = (shopId: string) => {
    const shopSales = data.sales.filter((s) => s.shopId === shopId || (!s.shopId && shopId === "main"));
    const shopStaff = data.staff.filter((st) => st.shopId === shopId || (!st.shopId && shopId === "main"));
    const totalSalesSum = shopSales.reduce((acc, s) => acc + s.totalSales, 0);

    return {
      salesCount: shopSales.length,
      revenue: totalSalesSum,
      staffCount: shopStaff.filter((st) => st.status === "Active").length,
    };
  };

  return (
    <div className="space-y-6">
      {/* Upper banner section */}
      <div className="bg-white border border-gray-150 p-6 rounded-3xl shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-950 tracking-tight flex items-center space-x-2">
            <Store className="w-6 h-6 text-orange-650" />
            <span>{language === "mr" ? "शाखा व्यवस्थापन" : "Outlets & Branches"}</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1 uppercase font-bold tracking-wider">
            {language === "mr"
              ? "गणेश भेलच्या सर्व शाखा आणि फ्रँचायझींचे निरीक्षण व नियंत्रण करा"
              : "Monitor and coordinate all Ganesh Bhel franchises and outlets"}
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="self-start md:self-auto flex items-center space-x-1.5 bg-orange-600 hover:bg-orange-700 text-white font-extrabold p-3 px-5 rounded-2xl cursor-pointer shadow-sm hover:shadow transition text-xs uppercase tracking-wider"
        >
          <Plus className="w-4 h-4" />
          <span>{language === "mr" ? "नवीन शाखा जोडा" : "Add New Outlet"}</span>
        </button>
      </div>

      {/* Grid of shops */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <AnimatePresence mode="popLayout">
          {list.map((shop) => {
            const stats = getShopStats(shop.id);
            const isDefault = shop.id === "main";

            return (
              <motion.div
                key={shop.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white border border-gray-150 rounded-3xl p-5 hover:shadow-md transition flex flex-col justify-between space-y-4"
              >
                <div>
                  {/* Title and Active indicator */}
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-extrabold text-slate-900 tracking-tight text-base flex items-center space-x-1.5">
                        <span>{shop.name}</span>
                        {isDefault && (
                          <span className="text-[9px] bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.2 rounded font-black uppercase tracking-wider">
                            Primary
                          </span>
                        )}
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5 flex items-center space-x-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{shop.location || (language === "mr" ? "पत्ता दिलेला नाही" : "No location custom configured")}</span>
                      </p>
                    </div>

                    <span
                      className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                        shop.status === "Active"
                          ? "bg-emerald-50 text-emerald-800 border border-emerald-150"
                          : "bg-rose-50 text-rose-800 border border-rose-150"
                      }`}
                    >
                      {shop.status === "Active" ? (language === "mr" ? "सक्रिय" : "Active") : (language === "mr" ? "निष्क्रिय" : "Inactive")}
                    </span>
                  </div>

                  {/* Operational indicators */}
                  <div className="grid grid-cols-2 gap-3 mt-4 border-t border-b border-slate-50 py-3">
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">
                        {language === "mr" ? "एकूण विक्री" : "Revenue"}
                      </span>
                      <span className="font-mono text-xs font-black text-slate-800 flex items-center">
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-600 mr-1" />
                        ₹{stats.revenue.toLocaleString()}
                      </span>
                    </div>

                    <div className="space-y-0.5">
                      <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">
                        {language === "mr" ? "सक्रिय कर्मचारी" : "Active Staff"}
                      </span>
                      <span className="text-xs font-black text-slate-800 flex items-center">
                        <Users className="w-3.5 h-3.5 text-orange-500 mr-1" />
                        {stats.staffCount} {language === "mr" ? "कर्मचारी" : "Helpers"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Edit & Delete operations */}
                <div className="flex items-center justify-end space-x-2">
                  <button
                    onClick={() => handleOpenEdit(shop)}
                    className="p-1 px-3 text-slate-650 hover:bg-slate-50 rounded-lg text-xs font-extrabold flex items-center space-x-1 cursor-pointer transition border border-slate-100"
                    title="Edit Properties"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>{language === "mr" ? "बदला" : "Edit"}</span>
                  </button>

                  {!isDefault && (
                    <button
                      onClick={() => {
                        if (confirm(language === "mr" ? "तुम्हाला या शाखा काढून टाकायची आहे का?" : "Are you sure you want to delete this outlet?")) {
                          onDeleteShop(shop.id);
                        }
                      }}
                      className="p-1.5 text-rose-650 hover:bg-rose-50 rounded-lg cursor-pointer transition"
                      title="Delete Branch"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Form Dialog Modal */}
      <AnimatePresence>
        {showAddForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100"
            >
              <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
                <h3 className="font-black text-slate-900 text-lg uppercase tracking-tight flex items-center space-x-1.5">
                  <Building className="w-5 h-5 text-orange-600" />
                  <span>
                    {editingShop
                      ? language === "mr"
                        ? "शाखेचे तपशील सुधारा"
                        : "Edit Branch details"
                      : language === "mr"
                      ? "नवीन शाखा जोडा"
                      : "Add New Franchise"}
                  </span>
                </h3>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="p-1 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-500 cursor-pointer"
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide block">
                    {language === "mr" ? "शाखेचे नाव" : "Outlet Name"}
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Pune Central, Kothrud Branch"
                    className="w-full text-xs font-medium p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-1 focus:ring-orange-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide block">
                    {language === "mr" ? "पत्ता / ठिकाण" : "Location / Region"}
                  </label>
                  <input
                    type="text"
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    placeholder="e.g. Tilak Road, Pune"
                    className="w-full text-xs font-medium p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-1 focus:ring-orange-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide block">
                    {language === "mr" ? "शाखेची स्थिती" : "Status"}
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full text-xs font-medium p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-1 focus:ring-orange-500 focus:outline-none cursor-pointer"
                  >
                    <option value="Active">{language === "mr" ? "सक्रिय (Active)" : "Active Outlet"}</option>
                    <option value="Inactive">{language === "mr" ? "निष्क्रिय (Inactive)" : "Inactive Outlet"}</option>
                  </select>
                </div>

                <div className="flex items-center justify-end space-x-2 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="p-3 text-xs font-bold text-slate-500 hover:bg-slate-55 bg-slate-50 rounded-xl cursor-pointer uppercase tracking-wider"
                  >
                    {language === "mr" ? "रद्द करा" : "Cancel"}
                  </button>

                  <button
                    type="submit"
                    className="p-3 bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xs rounded-xl cursor-pointer uppercase tracking-wider flex items-center space-x-1"
                  >
                    <span>{language === "mr" ? "जतन करा" : "Save Changes"}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
