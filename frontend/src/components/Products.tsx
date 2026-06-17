import React, { useState } from "react";
import { Product, SystemData, RecipeIngredient } from "../types";
import { PlusCircle, ShieldAlert, Tag, Layers, Pencil, Trash2, FolderPlus, HelpCircle, ChefHat } from "lucide-react";
import RecipeModal from "./RecipeModal";

interface ProductsProps {
  data: SystemData;
  onAddProduct: (prod: Product) => void;
  onUpdateProduct: (prod: Product) => void;
  onDeleteProduct: (id: string) => void;
  onAddCategory: (catName: string) => void;
  onDeleteCategory: (catName: string) => void;
  userRole: "owner" | "manager";
}

export default function ProductsManager({
  data,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onAddCategory,
  onDeleteCategory,
  userRole,
}: ProductsProps) {
  const isOwner = userRole === "owner";
  const language = data.language;

  // Active categories list, default fallback
  const activeCategories = data.categories || ["Snacks", "Beverages", "Sweets"];

  // State management
  const [name, setName] = useState("");
  const [category, setCategory] = useState(activeCategories[0] || "Snacks");
  const [sellingPrice, setSellingPrice] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);

  // New Category creator state
  const [newCatName, setNewCatName] = useState("");
  const [isCatManagerOpen, setIsCatManagerOpen] = useState(false);

  // Item Price Edit mode
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState("");

  // Recipe Modal State
  const [recipeProduct, setRecipeProduct] = useState<Product | null>(null);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !sellingPrice || !isOwner) return;

    const newProd: Product = {
      id: "p_" + Date.now(),
      name: name.trim(),
      category: category,
      sellingPrice: Number(sellingPrice),
      status: "Active",
    };

    onAddProduct(newProd);
    setName("");
    setSellingPrice("");
    setIsFormOpen(false);
  };

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim() || !isOwner) return;

    onAddCategory(newCatName.trim());
    setCategory(newCatName.trim()); // Default selection to the newly built category
    setNewCatName("");
  };

  const handleSavePriceEdit = (p: Product) => {
    if (!isOwner) return;
    onUpdateProduct({
      ...p,
      sellingPrice: Number(editPrice),
    });
    setEditingId(null);
  };

  const handleToggleStatus = (p: Product) => {
    if (!isOwner) return;
    onUpdateProduct({
      ...p,
      status: p.status === "Active" ? "Inactive" : "Active",
    });
  };

  return (
    <div className="space-y-6">
      
      {/* Dynamic Header Badge for role check */}
      {!isOwner && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start space-x-3 text-amber-900">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs">
            <p className="font-extrabold">
              {language === "mr" 
                ? "मर्यादित व्यवस्थापक मोड - केवळ वाचन हक्क"
                : "Manager Read-Only Mode - View catalog items"}
            </p>
            <p className="text-amber-700/80 mt-0.5">
              {language === "mr"
                ? "नवीन दर्जेदार खाद्यपदार्थ जोडणे, किमती बदलणे किंवा वर्गवारी व्यवस्थापन हक्क केवळ 'मालक (Owner)' कडे आहेत."
                : "Adding products, rate revisions, and category configurations are restricted strictly to the Owner."}
            </p>
          </div>
        </div>
      )}

      {/* Primary Products wrapper */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-gray-50/50">
          <div>
            <h3 className="font-extrabold text-gray-900 text-sm flex items-center space-x-2">
              <Layers className="w-4 h-4 text-orange-500" />
              <span>
                {language === "mr" ? "मेनू व उत्पादन सूची पत्रक" : "Product & Menu Master"}
              </span>
            </h3>
            <p className="text-[10px] text-gray-500 font-medium">
              {language === "mr"
                ? "कार्यालयाचे सक्रीय खाद्यपदार्थ आणि दर. पेटपूजा बिलिंग API शी थेट संलग्न."
                : "Set price lists and item status. Active sync with Petpooja cash registers."}
            </p>
          </div>
          
          {isOwner && (
            <div className="flex items-center space-x-2 w-full sm:w-auto">
              {/* Category trigger */}
              <button
                onClick={() => {
                  setIsCatManagerOpen(!isCatManagerOpen);
                  setIsFormOpen(false);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1 cursor-pointer transition ${
                  isCatManagerOpen 
                    ? "bg-slate-800 text-white" 
                    : "bg-slate-100 hover:bg-slate-200 text-slate-800"
                }`}
              >
                <Tag className="w-3.5 h-3.5" />
                <span>{language === "mr" ? "वर्गवारी" : "Categories"}</span>
              </button>

              {/* Product trigger */}
              <button
                onClick={() => {
                  setIsFormOpen(!isFormOpen);
                  setIsCatManagerOpen(false);
                }}
                className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs flex items-center space-x-1 cursor-pointer transition shadow-sm"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>
                  {isFormOpen
                    ? (language === "mr" ? "बंद करा" : "Close")
                    : (language === "mr" ? "नवीन उत्पादन" : "Add Product")}
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Dynamic Category Manager Block (Owner Only) */}
        {isCatManagerOpen && isOwner && (
          <div className="p-5 border-b border-gray-100 bg-slate-50/30 space-y-4">
            <div className="flex items-center space-x-2 text-slate-800">
              <FolderPlus className="w-4 h-4 text-orange-600" />
              <span className="font-extrabold text-xs">
                {language === "mr" ? "खाद्यपदार्थ वर्गवारी व्यवस्थापन (Owner Only)" : "Custom Categories Engine (Owner Only)"}
              </span>
            </div>

            {/* Existing dynamic categories list */}
            <div className="flex flex-wrap gap-2">
              {activeCategories.map((cat) => {
                const isDefault = ["Snacks", "Beverages", "Sweets"].includes(cat);
                return (
                  <span
                    key={cat}
                    className="inline-flex items-center space-x-1.5 bg-white border border-slate-200 pl-3 pr-2 py-1 rounded-full text-xs font-bold text-gray-700 shadow-xs"
                  >
                    <span>{cat}</span>
                    {!isDefault && (
                      <button
                        onClick={() => onDeleteCategory(cat)}
                        className="text-gray-400 hover:text-red-650 cursor-pointer p-0.5 rounded-full hover:bg-red-50 transition"
                        title="Delete custom category"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </span>
                );
              })}
            </div>

            {/* Add Category Form */}
            <form onSubmit={handleCreateCategory} className="flex gap-2 max-w-md">
              <input
                type="text"
                required
                placeholder={language === "mr" ? "उदा. Juices (फळांचा रस)" : "e.g. Chat special, Ice Cream, Juices"}
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                className="flex-1 text-xs bg-white border border-gray-200 rounded-lg p-2 outline-none focus:border-orange-500"
              />
              <button
                type="submit"
                className="bg-slate-800 hover:bg-slate-900 text-white font-bold px-4 py-2 rounded-lg text-xs cursor-pointer transition shadow-xs"
              >
                {language === "mr" ? "वर्गवारी जोडा" : "Add Category"}
              </button>
            </form>
          </div>
        )}

        {/* Dynamic Add Product Form (Owner Only) */}
        {isFormOpen && isOwner && (
          <form
            onSubmit={handleCreate}
            className="p-5 border-b border-gray-100 grid grid-cols-1 md:grid-cols-4 gap-4 items-end bg-gray-50/20"
          >
            <div>
              <label className="block text-[10px] font-extrabold text-slate-400 uppercase mb-1">
                {language === "mr" ? "उत्पादनाचे नाव" : "Product & Pack Name"}
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Special Cheese Bhel"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full text-xs bg-white border border-gray-200 rounded-lg p-2.5 outline-none focus:border-orange-500 font-semibold"
              />
            </div>
            <div>
              <label className="block text-[10px] font-extrabold text-slate-400 uppercase mb-1">
                {language === "mr" ? "वर्गवारी" : "Food Category"}
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full text-xs bg-white border border-gray-200 rounded-lg p-2.5 outline-none focus:border-orange-500 font-semibold"
              >
                {activeCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-extrabold text-slate-400 uppercase mb-1">
                {language === "mr" ? "विक्री किंमत (₹)" : "Rent/Selling Price (₹)"}
              </label>
              <input
                type="number"
                required
                placeholder="0.00"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(e.target.value)}
                className="w-full text-xs bg-white border border-gray-200 rounded-lg p-2.5 outline-none focus:border-orange-500 font-bold"
              />
            </div>
            <div>
              <button
                type="submit"
                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-extrabold p-2.5 rounded-lg text-xs cursor-pointer shadow transition-all hover:shadow-md"
              >
                {language === "mr" ? "मेनूवर टाका" : "Register Menu Item"}
              </button>
            </div>
          </form>
        )}

        {/* Catalog Table */}
        <div className="overflow-x-auto text-slate-800">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-gray-100 text-slate-400 font-bold uppercase text-[9px] tracking-wider">
                <th className="p-3.5">{language === "mr" ? "खाद्यपदार्थ नाव" : "Product Item"}</th>
                <th className="p-3.5">{language === "mr" ? "वर्गवारी" : "Category"}</th>
                <th className="p-3.5">{language === "mr" ? "विक्री दर" : "Selling Rate"}</th>
                <th className="p-3.5">{language === "mr" ? "कच्चा माल खर्च व ढोबळ नफा" : "Cost & Margin Ratio"}</th>
                <th className="p-3.5">{language === "mr" ? "सद्य स्थिती" : "Status"}</th>
                <th className="p-3.5">POS API Integrator</th>
                {isOwner && <th className="p-3.5 text-right">{language === "mr" ? "कृती" : "Action"}</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 font-semibold">
              {data.products.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/40 transition">
                  {/* Name */}
                  <td className="p-3.5">
                    <div className="font-extrabold text-slate-900">{p.name}</div>
                    {p.recipeJson && (() => {
                      try {
                        const rec = JSON.parse(p.recipeJson);
                        if (rec && rec.length > 0) {
                          const names = rec.map((ing: any) => {
                            const matchItem = (data.inventory || []).find((inv: any) => inv.id === ing.inventoryItemId);
                            return matchItem ? `${matchItem.name} (${ing.quantity} ${matchItem.unit})` : "";
                          }).filter(Boolean);
                          if (names.length === 0) return null;
                          return (
                            <div className="text-[10px] text-slate-400 mt-1 flex flex-wrap gap-1">
                              {names.map((n: string, i: number) => (
                                <span key={i} className="bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold">
                                  {n}
                                </span>
                              ))}
                            </div>
                          );
                        }
                      } catch {
                        return null;
                      }
                      return null;
                    })()}
                  </td>
                  
                  {/* Category */}
                  <td className="p-3.5">
                    <span className="bg-orange-50/85 text-orange-950 px-2 py-0.5 rounded-md text-[10px] font-extrabold border border-orange-100/50">
                      {p.category}
                    </span>
                  </td>
                  
                  {/* Selling Price */}
                  <td className="p-3.5 font-mono">
                    {editingId === p.id && isOwner ? (
                      <div className="flex items-center space-x-1.5">
                        <input
                          type="number"
                          value={editPrice}
                          onChange={(e) => setEditPrice(e.target.value)}
                          className="w-16 p-1 bg-white border border-gray-300 rounded font-bold text-xs outline-none focus:border-orange-500"
                        />
                        <button
                          onClick={() => handleSavePriceEdit(p)}
                          className="bg-emerald-500 text-white font-bold p-1 px-1.5 rounded hover:bg-emerald-650 cursor-pointer text-[10px]"
                        >
                          Save
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-1.5">
                        <span className="font-black text-amber-600">₹{p.sellingPrice}</span>
                        {isOwner && (
                          <button
                            onClick={() => {
                              setEditingId(p.id);
                              setEditPrice(String(p.sellingPrice));
                            }}
                            className="text-slate-400 hover:text-slate-600 p-0.5"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                  
                  {/* Raw Material Cost & Gross Margin (%) */}
                  <td className="p-3.5 font-semibold text-slate-800">
                    {(() => {
                      let totalCost = 0;
                      let hasRecipe = false;
                      if (p.recipeJson) {
                        try {
                          const recipe = JSON.parse(p.recipeJson);
                          if (Array.isArray(recipe) && recipe.length > 0) {
                            hasRecipe = true;
                            recipe.forEach((ing: any) => {
                              const item = (data.inventory || []).find((x: any) => x.id === ing.inventoryItemId);
                              totalCost += Number(ing.quantity) * (item?.costPerUnit || 0);
                            });
                          }
                        } catch {}
                      }
                      const profit = Number(p.sellingPrice) - totalCost;
                      const profitPct = p.sellingPrice > 0 ? (profit / Number(p.sellingPrice)) * 100 : 0;

                      if (!hasRecipe) {
                        return (
                          <span className="text-gray-400 text-[10px] bg-slate-50 px-2 py-1 rounded italic font-medium">
                            {language === 'mr' ? 'कृती सूत्र नाही' : 'No formula entered'}
                          </span>
                        );
                      }

                      const isProfit = profit > 0;
                      return (
                        <div className="flex flex-col text-[11px] leading-tight">
                          <div className="flex items-center space-x-1">
                            <span className="text-slate-400 font-medium">{language === 'mr' ? 'खरेदी खर्च:' : 'COGS:'}</span>
                            <span className="text-slate-700 font-black font-mono">₹{totalCost.toFixed(2)}</span>
                          </div>
                          <div className="mt-1 flex items-center space-x-1">
                            <span className="text-slate-400 font-medium">{language === 'mr' ? 'नफा:' : 'Margin:'}</span>
                            <span className={`font-mono text-[10px] font-black shrink-0 px-1 py-0.5 rounded ${
                              isProfit ? 'text-emerald-800 bg-emerald-50/50' : 'text-red-700 bg-red-50/50'
                            }`}>
                              ₹{profit.toFixed(1)} ({profitPct.toFixed(0)}%)
                            </span>
                          </div>
                        </div>
                      );
                    })()}
                  </td>
                  
                  {/* Status Toggle */}
                  <td className="p-3.5">
                    <button
                      onClick={() => handleToggleStatus(p)}
                      disabled={!isOwner}
                      className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase transition border ${
                        p.status === "Active"
                          ? "bg-emerald-50 text-emerald-850 border-emerald-150"
                          : "bg-slate-50 text-slate-400 border-slate-200"
                      } ${isOwner ? "cursor-pointer hover:opacity-85" : "cursor-not-allowed"}`}
                    >
                      {p.status}
                    </button>
                  </td>
                  
                  {/* API Identity */}
                  <td className="p-3.5 font-mono text-[9px] text-slate-400 font-bold">
                    PP_API_{p.id.toUpperCase()}
                  </td>
                  
                  {/* Actions (Delete & Recipe) */}
                  {isOwner && (
                    <td className="p-3.5 text-right flex items-center justify-end space-x-1">
                      <button
                        onClick={() => setRecipeProduct(p)}
                        className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 p-1.5 rounded-lg transition cursor-pointer inline-flex items-center justify-center"
                        title={language === "mr" ? "साहित्य सूत्र कॉन्फिगर करा" : "Configure Recipe Formula"}
                      >
                        <ChefHat className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete ${p.name}?`)) {
                            onDeleteProduct(p.id);
                          }
                        }}
                        className="text-slate-350 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition cursor-pointer inline-flex items-center justify-center"
                        title="Delete product item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
              
              {data.products.length === 0 && (
                <tr>
                  <td colSpan={isOwner ? 6 : 5} className="p-8 text-center text-gray-400 font-semibold italic">
                    {language === "mr" ? "कोणतेही शोध खाद्यपदार्थ आढळले नाहीत." : "No menu products items found."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {recipeProduct && (
        <RecipeModal
          product={recipeProduct}
          inventoryItems={data.inventory || []}
          isOpen={!!recipeProduct}
          onClose={() => setRecipeProduct(null)}
          onSave={(productId, recipe) => {
            const prod = data.products.find(p => p.id === productId);
            if (prod) {
              onUpdateProduct({
                ...prod,
                recipeJson: JSON.stringify(recipe),
              });
            }
          }}
          language={language}
        />
      )}
    </div>
  );
}
