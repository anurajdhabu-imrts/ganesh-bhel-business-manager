import React, { useState } from "react";
import { Product, InventoryItem, RecipeIngredient } from "../types";
import { X, Plus, Trash2, ChefHat, Save, AlertCircle } from "lucide-react";

interface RecipeModalProps {
  product: Product;
  inventoryItems: InventoryItem[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (productId: string, recipe: RecipeIngredient[]) => void;
  language: string;
}

export default function RecipeModal({
  product,
  inventoryItems,
  isOpen,
  onClose,
  onSave,
  language,
}: RecipeModalProps) {
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>(() => {
    try {
      return product.recipeJson ? JSON.parse(product.recipeJson) : [];
    } catch {
      return [];
    }
  });

  const [selectedItemId, setSelectedItemId] = useState("");
  const [quantity, setQuantity] = useState("");

  if (!isOpen) return null;

  const currentItem = inventoryItems.find((item) => item.id === selectedItemId);

  const handleAddIngredient = () => {
    if (!selectedItemId || !quantity || Number(quantity) <= 0) return;

    // Check if food already contains this raw material
    if (ingredients.some((ing) => ing.inventoryItemId === selectedItemId)) {
      alert(
        language === "mr"
          ? "हा कच्चा माल आधीच जोडला गेला आहे!"
          : "This raw material is already added to the recipe!"
      );
      return;
    }

    const newIng: RecipeIngredient = {
      inventoryItemId: selectedItemId,
      quantity: Number(quantity),
    };

    setIngredients([...ingredients, newIng]);
    setSelectedItemId("");
    setQuantity("");
  };

  const handleRemoveIngredient = (itemId: string) => {
    setIngredients(ingredients.filter((ing) => ing.inventoryItemId !== itemId));
  };

  const handleSave = () => {
    onSave(product.id, ingredients);
    onClose();
  };

  // Get available/unused items for dropdown
  const availableInventoryItems = inventoryItems.filter(
    (item) => !ingredients.some((ing) => ing.inventoryItemId === item.id)
  );

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-lg bg-orange-50 text-orange-600">
              <ChefHat className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">
                {language === "mr" ? "खाद्यपदार्थ साहित्य सूत्र" : "Dish Dish Recipe Formula"}
              </h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                {product.name} — ₹{product.sellingPrice}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1 text-xs">
          {/* Explanation */}
          <div className="p-3 bg-slate-50 rounded-xl border border-gray-200 text-slate-950 flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">
                {language === "mr" ? "हे कसे काम करते?" : "How does this work?"}
              </p>
              <p className="text-[11px] text-slate-600 leading-relaxed mt-0.5">
                {language === "mr"
                  ? "येथे १ प्लेट / डिश बनवण्यासाठी लागणारा कच्चा माल आणि त्याची अचूक मात्रा भरा. जेव्हा तुम्ही या खाद्यपदार्थाची विक्री नोंदवाल, तेव्हा या प्रमाणानुसार कच्चा माल आपोआप स्टॉकमधून कापला जाईल."
                  : "Specify raw material requirement for 1 serving dish. Whenever you record sales of this item, specified raw stocks will adjust down automatically."}
              </p>
            </div>
          </div>

          {/* Gross Plate Profit & Loss Summary Card */}
          {ingredients.length > 0 && (() => {
            const totalDishCost = ingredients.reduce((sum, ing) => {
              const item = inventoryItems.find(x => x.id === ing.inventoryItemId);
              return sum + (Number(ing.quantity) * (item?.costPerUnit || 0));
            }, 0);
            const profitPerPlate = Number(product.sellingPrice) - totalDishCost;
            const profitPercent = product.sellingPrice > 0 ? (profitPerPlate / Number(product.sellingPrice)) * 100 : 0;
            const isProfit = profitPerPlate > 0;

            return (
              <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                isProfit ? 'bg-emerald-50/70 border-emerald-150 text-emerald-950' : 'bg-rose-50/50 border-rose-150 text-rose-950'
              }`}>
                <div>
                  <h4 className="font-extrabold text-[9px] uppercase tracking-wider text-slate-400">
                    {language === "mr" ? "प्रति प्लेट ढोबळ नफा-तोटा विश्लेषण" : "Per Plate Gross Profit Analysis"}
                  </h4>
                  <div className="flex items-baseline space-x-1.5 mt-1">
                    <span className="text-lg font-black font-mono">
                      ₹{profitPerPlate.toFixed(2)}
                    </span>
                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md ${
                      isProfit ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {isProfit ? (language === 'mr' ? 'ढोबळ नफा' : 'GROSS PROFIT') : (language === 'mr' ? 'तोटा' : 'LOSS')} ({profitPercent.toFixed(1)}%)
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px] font-bold border-t sm:border-t-0 sm:border-l border-zinc-200/60 sm:pl-4 pt-2 sm:pt-0">
                  <div className="text-slate-400 font-medium">{language === 'mr' ? 'विक्री किंमत:' : 'Plate Price:'}</div>
                  <div className="font-mono text-slate-800 text-right">₹{product.sellingPrice}</div>
                  <div className="text-slate-400 font-medium">{language === 'mr' ? 'कच्चा माल खर्च:' : 'Raw Cost:'}</div>
                  <div className={`font-mono text-right ${totalDishCost > 0 ? 'text-red-600' : 'text-slate-800'}`}>
                    ₹{totalDishCost.toFixed(2)}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Add Form */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
            <h4 className="font-bold text-slate-800 uppercase text-[10px] tracking-wider">
              {language === "mr" ? "साहित्य जोडा" : "Add Recipe Ingredient"}
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Select Raw Stock */}
              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">
                  {language === "mr" ? "कच्चा माल" : "Raw Material Ingredient"}
                </label>
                <select
                  value={selectedItemId || ""}
                  onChange={(e) => setSelectedItemId(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-lg p-2 text-xs font-semibold"
                >
                  <option value="">
                    {language === "mr" ? "-- साहित्य निवडा --" : "-- Select Ingredient --"}
                  </option>
                  {availableInventoryItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} ({item.unit})
                    </option>
                  ))}
                </select>
              </div>

              {/* Quantity input */}
              <div className="flex items-end space-x-2">
                <div className="flex-1">
                  <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">
                    {language === "mr" ? "प्रमाण (प्रति १ प्लेट)" : "Quantity (per 1 plate)"}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="any"
                      placeholder="e.g. 0.05"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-lg p-2 pr-12 text-xs font-bold font-mono outline-none focus:border-orange-500"
                    />
                    <span className="absolute right-3 top-2.5 text-[9px] font-bold text-slate-400 uppercase font-mono">
                      {currentItem ? currentItem.unit : ""}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAddIngredient}
                  className="bg-orange-600 hover:bg-orange-700 text-white font-bold p-2.5 rounded-lg flex items-center justify-center cursor-pointer shadow-xs"
                  title="Add ingredient"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Current Ingredients List */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-800 uppercase text-[10px] tracking-wider">
              {language === "mr" ? "सध्याचे घटक साहित्य" : "Configured Recipe Composition"}
            </h4>

            {ingredients.length === 0 ? (
              <p className="text-center p-6 text-slate-400 italic">
                {language === "mr"
                  ? "कोणतेही साहित्य घटक जोडलेले नाहीत"
                  : "No ingredients added to this recipe formula yet."}
              </p>
            ) : (
              <div className="border border-gray-150 rounded-xl divide-y divide-gray-100 overflow-hidden">
                {ingredients.map((ing) => {
                  const invItem = inventoryItems.find((item) => item.id === ing.inventoryItemId);
                  const itemCost = Number(ing.quantity) * (invItem?.costPerUnit || 0);
                  return (
                    <div
                      key={ing.inventoryItemId}
                      className="p-3 flex justify-between items-center bg-white hover:bg-slate-50/50"
                    >
                      <div>
                        <span className="font-extrabold text-slate-800">
                          {invItem ? invItem.name : "Unknown Raw Stock"}
                        </span>
                        <div className="text-[10px] text-gray-400 font-bold mt-0.5 flex flex-wrap items-center gap-x-2">
                          <span className="font-mono text-amber-600">
                            {ing.quantity} {invItem ? invItem.unit : ""} per serving
                          </span>
                          {invItem && invItem.costPerUnit ? (
                            <span className="text-emerald-700 font-mono">
                              • {language === 'mr' ? 'खर्च:' : 'Cost:'} ₹{itemCost.toFixed(2)} (@ ₹{invItem.costPerUnit}/{invItem.unit})
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">
                              • {language === 'mr' ? 'खर्च जोडला नाही' : 'No rate added'}
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => handleRemoveIngredient(ing.inventoryItemId)}
                        className="text-slate-350 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition"
                        title="Remove ingredient"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-gray-100 flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-200 text-slate-700 hover:bg-gray-100 font-extrabold rounded-xl text-xs cursor-pointer transition"
          >
            {language === "mr" ? "बंद करा" : "Cancel"}
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-850 text-white font-extrabold rounded-xl text-xs flex items-center space-x-1.5 cursor-pointer shadow transition"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{language === "mr" ? "सूत्र जतन करा" : "Save Recipe Formula"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
