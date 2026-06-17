import React, { useState, useEffect } from "react";
import { SystemData, PurchaseType, PaymentMode } from "../types";
import { 
  Database, Download, Upload, RefreshCw, AlertTriangle, 
  CheckCircle2, HardDrive, Calendar, Clock, RotateCcw, 
  ShieldAlert, Sparkles, FileJson, Layers, FileSpreadsheet, Check, HelpCircle
} from "lucide-react";

interface Backup {
  filename: string;
  timestamp: string;
  size: number;
}

// --- CSV PARSING & MAPPING HELPERS ---
const salesMappingKeys: Record<string, string[]> = {
  date: ["date", "tarikh", "तारीख", "day", "sales date", "transaction date", "time"],
  totalSales: ["totalsales", "total sales", "sales", "revenue", "एकूण विक्री", "amount", "total"],
  cashCollection: ["cash", "cashcollection", "cash collection", "काँश", "रोख", "cash_collection"],
  upiCollection: ["upi", "upicollection", "upi collection", "gpay", "online", "फोनपे", "upi_collection"],
  cardCollection: ["card", "cardcollection", "card collection", "card_collection"],
  swiggyCollection: ["swiggy", "swiggycollection", "swiggy collection", "swiggy_collection"],
  zomatoCollection: ["zomato", "zomatocollection", "zomato collection", "zomato_collection"],
  otherCollection: ["other", "othercollection", "others", "other_collection"],
  remarks: ["remarks", "note", "description", "शेरा", "remark"]
};

const purchaseMappingKeys: Record<string, string[]> = {
  date: ["date", "tarikh", "तारीख", "day", "purchase date", "transaction date", "bill date"],
  purchaseType: ["type", "purchasetype", "shop or staff", "purchase_type"],
  vendorName: ["vendor", "vendorname", "supplier", "दुकान", "शॉप", "vendor_name", "merchant"],
  itemName: ["item", "itemname", "product", "material", "नाव", "साहित्य", "item_name"],
  category: ["category", "sub-category", "विभाग", "type_category"],
  quantity: ["quantity", "qty", "नग", "प्रमाण", "quantities"],
  unit: ["unit", "measure", "एकक", "kg", "grams"],
  rate: ["rate", "price", "दर", "unit price"],
  amount: ["amount", "total", "किंमत", "cost", "total_price"],
  paymentMode: ["mode", "paymentmode", "पेमेंट", "payment_mode", "pay mode"],
  invoiceNumber: ["invoice", "bill no", "billnumber", "बिल क्रमांक", "invoice_no", "invoice_number"],
  remarks: ["remarks", "note", "remark"]
};

function parseCSV(text: string): { headers: string[]; rows: string[][] } {
  const lines: string[][] = [];
  let row: string[] = [];
  let inQuotes = false;
  let currentToken = '';

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentToken += '"';
        i++; // skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      row.push(currentToken.trim());
      currentToken = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++; // skip \n
      }
      row.push(currentToken.trim());
      if (row.length > 1 || (row.length === 1 && row[0] !== '')) {
        lines.push(row);
      }
      row = [];
      currentToken = '';
    } else {
      currentToken += char;
    }
  }

  if (currentToken !== '' || row.length > 0) {
    row.push(currentToken.trim());
    lines.push(row);
  }

  if (lines.length === 0) {
    return { headers: [], rows: [] };
  }

  const headers = lines[0].map(h => h.replace(/^["']|["']$/g, '').trim());
  const rows = lines.slice(1).filter(r => r.some(cell => cell !== ''));
  return { headers, rows };
}

function parseDateString(str: string): string {
  if (!str) return new Date().toISOString().split("T")[0];
  const cleaned = str.trim();
  
  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) {
    return cleaned;
  }
  
  // DD/MM/YYYY or DD-MM-YYYY
  const matches = cleaned.match(/^(\d{1,2})[/\-](\d{1,2})[/\-](\d{4})$/);
  if (matches) {
    const day = matches[1].padStart(2, "0");
    const month = matches[2].padStart(2, "0");
    const year = matches[3];
    return `${year}-${month}-${day}`;
  }

  // YYYY/MM/DD
  const matchesReverse = cleaned.match(/^(\d{4})[/\-](\d{1,2})[/\-](\d{1,2})$/);
  if (matchesReverse) {
    const year = matchesReverse[1];
    const month = matchesReverse[2].padStart(2, "0");
    const day = matchesReverse[3].padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  try {
    const d = new Date(cleaned);
    if (!isNaN(d.getTime())) {
      return d.toISOString().split("T")[0];
    }
  } catch (e) {}

  return new Date().toISOString().split("T")[0];
}

function parseNumericValue(val: string): number {
  if (!val) return 0;
  const cleaned = val.replace(/[^0-9.\-]/g, "");
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

function autoInferredMapping(headers: string[], mappingKeys: Record<string, string[]>): Record<string, string> {
  const mapping: Record<string, string> = {};
  for (const [field, keywords] of Object.entries(mappingKeys)) {
    const match = headers.find(h => {
      const normalizedH = h.toLowerCase().replace(/[^a-z0-9\u0900-\u097F]/g, " ");
      return keywords.some(keyword => {
        const normKey = keyword.toLowerCase();
        return normalizedH === normKey || normalizedH.includes(normKey) || normKey.includes(normalizedH);
      });
    });
    mapping[field] = match || "";
  }
  return mapping;
}

interface DatabaseManagerProps {
  data: SystemData;
  onRestore: (newData: SystemData) => void;
}

export default function DatabaseManager({ data, onRestore }: DatabaseManagerProps) {
  const [backups, setBackups] = useState<Backup[]>([]);
  const [fetchingBackups, setFetchingBackups] = useState(false);
  const [actionPending, setActionPending] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // CSV Importer State Variables
  const [showCSVImporter, setShowCSVImporter] = useState(false);
  const [csvImportType, setCsvImportType] = useState<"sales" | "purchases">("sales");
  const [csvRawText, setCsvRawText] = useState("");
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvRows, setCsvRows] = useState<string[][]>([]);
  const [mappedFields, setMappedFields] = useState<Record<string, string>>({});
  const [conflictStrategy, setConflictStrategy] = useState<"overwrite" | "skip" | "merge">("overwrite");
  const [previewData, setPreviewData] = useState<any[]>([]);

  // Synchronous parser driver
  const parseCSVData = (text: string, type: "sales" | "purchases") => {
    if (!text.trim()) {
      setCsvHeaders([]);
      setCsvRows([]);
      setMappedFields({});
      setPreviewData([]);
      return;
    }
    try {
      const { headers, rows } = parseCSV(text);
      setCsvHeaders(headers);
      setCsvRows(rows);

      const mappingKeys = type === "sales" ? salesMappingKeys : purchaseMappingKeys;
      const inferred = autoInferredMapping(headers, mappingKeys);
      setMappedFields(inferred);
    } catch (e: any) {
      console.error("CSV parse error:", e);
    }
  };

  // CSV text field handler
  const handleCSVTextChange = (text: string) => {
    setCsvRawText(text);
    parseCSVData(text, csvImportType);
  };

  // CSV importer type driver
  const handleImportTypeChange = (type: "sales" | "purchases") => {
    setCsvImportType(type);
    setCsvRawText("");
    setCsvHeaders([]);
    setCsvRows([]);
    setMappedFields({});
    setPreviewData([]);
    setConflictStrategy(type === "sales" ? "overwrite" : "skip");
  };

  // File loading helper
  const handleCSVFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === "string") {
        setCsvRawText(content);
        parseCSVData(content, csvImportType);
        showFeedback(
          "success",
          data.language === "mr"
            ? "CSV फाईल यशस्वीरित्या लोड झाली आहे! खाली कॉलम मॅपिंग तपासा."
            : "CSV file parsed successfully! Review the mapped columns below."
        );
      }
    };
    reader.readAsText(file, "UTF-8");
    e.target.value = "";
  };

  // Sample injector
  const handleLoadSampleCSV = () => {
    if (csvImportType === "sales") {
      const sample = `Date,Total Sales,Cash,UPI,Card,Swiggy,Zomato,Remarks
2026-06-10,18500,6500,8000,500,1500,2000,Excellent Sunday collection
2026-06-11,14200,4200,7500,0,1000,1500,Regular business day
2026-06-12,15900,5000,8100,200,1200,1400,Steady weekday volume`;
      setCsvRawText(sample);
      parseCSVData(sample, "sales");
    } else {
      const sample = `Bill Date,Item Name,Vendor,Total Amount,Quantity,Unit,Rate,Payment Mode,Bill No
2026-06-11,Sev,Mahesh Traders,4500,15,kg,300,UPI,INV-9908
2026-06-12,Potato Stock,Puna Bazar,1200,3,bags,400,Cash,INV-091
2026-06-13,Cooking Oil,Swastik Oil,9000,6,tins,1500,Credit,INV-773`;
      setCsvRawText(sample);
      parseCSVData(sample, "purchases");
    }
  };

  // Map header variables to preview rows
  useEffect(() => {
    if (csvRows.length === 0) {
      setPreviewData([]);
      return;
    }

    const headersMap = csvHeaders.reduce((acc, h, idx) => {
      acc[h] = idx;
      return acc;
    }, {} as Record<string, number>);

    const parsed: any[] = csvRows.map((row, rIdx) => {
      const getVal = (field: string) => {
        const colHeader = mappedFields[field];
        if (!colHeader) return "";
        const colIdx = headersMap[colHeader];
        if (colIdx === undefined) return "";
        return row[colIdx];
      };

      if (csvImportType === "sales") {
        const dateRaw = getVal("date");
        const dateParsed = parseDateString(dateRaw);
        return {
          id: dateParsed,
          date: dateParsed,
          totalSales: parseNumericValue(getVal("totalSales")),
          cashCollection: parseNumericValue(getVal("cashCollection")),
          upiCollection: parseNumericValue(getVal("upiCollection")),
          cardCollection: parseNumericValue(getVal("cardCollection")),
          swiggyCollection: parseNumericValue(getVal("swiggyCollection")),
          zomatoCollection: parseNumericValue(getVal("zomatoCollection")),
          otherCollection: parseNumericValue(getVal("otherCollection")),
          remarks: getVal("remarks") || `CSV imported record (${rIdx + 1})`,
        };
      } else {
        const qty = parseNumericValue(getVal("quantity")) || 1;
        const rate = parseNumericValue(getVal("rate")) || 0;
        const amt = parseNumericValue(getVal("amount")) || (qty * rate);
        return {
          id: `pur_csv_${Date.now()}_${rIdx}`,
          date: parseDateString(getVal("date")),
          purchaseType: (getVal("purchaseType") || "Shop") as any,
          vendorName: getVal("vendorName") || "Mahesh Traders",
          itemName: getVal("itemName") || "Raw Supplies",
          category: getVal("category") || "Other",
          quantity: qty,
          unit: getVal("unit") || "kg",
          rate: rate,
          amount: amt,
          paymentMode: (getVal("paymentMode") || "Cash") as any,
          invoiceNumber: getVal("invoiceNumber") || "",
          remarks: getVal("remarks") || "CSV import",
        };
      }
    });

    setPreviewData(parsed);
  }, [csvRows, mappedFields, csvImportType, csvHeaders]);

  // Merge parser execution
  const handleExecuteCSVImport = async () => {
    if (previewData.length === 0) {
      showFeedback("error", "No valid entries detected. Paste CSV or load file.");
      return;
    }

    setActionPending(true);

    try {
      let updatedData = { ...data };

      if (csvImportType === "sales") {
        const salesList = [...data.sales];
        previewData.forEach((newSalesEntry) => {
          const duplicateIdx = salesList.findIndex((s) => s.date === newSalesEntry.date);
          if (duplicateIdx !== -1) {
            if (conflictStrategy === "overwrite") {
              salesList[duplicateIdx] = newSalesEntry;
            } else if (conflictStrategy === "merge") {
              const existing = salesList[duplicateIdx];
              salesList[duplicateIdx] = {
                ...existing,
                totalSales: existing.totalSales + newSalesEntry.totalSales,
                cashCollection: existing.cashCollection + newSalesEntry.cashCollection,
                upiCollection: existing.upiCollection + newSalesEntry.upiCollection,
                cardCollection: existing.cardCollection + newSalesEntry.cardCollection,
                swiggyCollection: existing.swiggyCollection + newSalesEntry.swiggyCollection,
                zomatoCollection: existing.zomatoCollection + newSalesEntry.zomatoCollection,
                otherCollection: existing.otherCollection + newSalesEntry.otherCollection,
                remarks: existing.remarks 
                  ? `${existing.remarks}; merged: ${newSalesEntry.remarks}`
                  : newSalesEntry.remarks,
              };
            }
          } else {
            salesList.push(newSalesEntry);
          }
        });
        updatedData.sales = salesList;
      } else {
        const purchaseList = [...data.purchases];
        previewData.forEach((newPurchaseEntry) => {
          const isDuplicate = purchaseList.some(
            (p) =>
              p.date === newPurchaseEntry.date &&
              p.itemName === newPurchaseEntry.itemName &&
              p.vendorName === newPurchaseEntry.vendorName &&
              p.amount === newPurchaseEntry.amount
          );

          if (conflictStrategy === "skip" && isDuplicate) {
            return;
          }
          purchaseList.push(newPurchaseEntry);
        });
        updatedData.purchases = purchaseList;
      }

      // Sync and save database on server
      const response = await fetch("/api/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData),
      });

      const resData = await response.json();
      if (resData.status === "success" || resData.success) {
        onRestore(updatedData);
        showFeedback(
          "success",
          data.language === "mr"
            ? `${previewData.length} नवीन डेटा नोंदी सुरक्षितरित्या सिस्टीममध्ये आयात करण्यात आल्या आहेत!`
            : `Fabulous! ${previewData.length} records successfully synced to live operations database!`
        );
        setCsvRawText("");
        setCsvHeaders([]);
        setCsvRows([]);
        setMappedFields({});
        setPreviewData([]);
        setShowCSVImporter(false);
        fetchBackups();
      } else {
        showFeedback("error", resData.error || "Failed to persist import");
      }
    } catch (err: any) {
      showFeedback("error", err.message || "Failed to save CSV data");
    } finally {
      setActionPending(false);
    }
  };

  const fetchBackups = async () => {
    setFetchingBackups(true);
    try {
      const response = await fetch("/api/backups");
      const resData = await response.json();
      if (resData.success) {
        setBackups(resData.backups);
      }
    } catch (e: any) {
      console.error("Error loading backups:", e.message);
    } finally {
      setFetchingBackups(false);
    }
  };

  useEffect(() => {
    fetchBackups();
  }, []);

  const showFeedback = (type: "success" | "error", message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 8000);
  };

  // 1. Export/Download Database to local device
  const handleExportData = () => {
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      
      const dateStr = new Date().toISOString().split("T")[0];
      downloadAnchor.setAttribute("download", `ganesh_bhel_backup_${dateStr}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      
      showFeedback(
        "success", 
        data.language === "mr" 
          ? "डेटा यशस्वीरित्या निर्यात केला! तुमची बॅकअप फाईल डाउनलोड झाली आहे." 
          : "Database backup file (.json) exported and downloaded successfully!"
      );
    } catch (err: any) {
      showFeedback("error", err.message || "Failed to export data");
    }
  };

  // 1.5 Wipe/Reset Database to 0 entries on demand
  const handleResetToZero = async () => {
    const confirmMsg = data.language === "mr"
      ? "तुम्हाला खात्री आहे का की तुम्हाला सर्व नोंदी (विक्री, खरेदी, कर्मचारी, पगार, ॲडव्हान्स, खर्च) काढून शून्यावर आणायचे आहेत? हा बदल पूर्ववत करता येणार नाही."
      : "Are you sure you want to wipe all transaction entries (sales, purchases, staff registry, salaries, advances, expenses) to zero? This action is permanent and cannot be undone.";
    
    if (!window.confirm(confirmMsg)) return;

    setActionPending(true);
    try {
      // Preserve system structure and settings but clean transaction queues
      const wipedData: SystemData = {
        ...data,
        sales: [],
        purchases: [],
        staff: [],
        advances: [],
        welfareExpenses: [],
        salaries: [],
        closingLogs: [],
        notifications: [],
        inventory: (data.inventory || []).map(item => ({
          ...item,
          openingStock: 0,
          purchasedStock: 0,
          consumedStock: 0,
          closingStock: 0
        }))
      };

      const response = await fetch("/api/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(wipedData),
      });

      const resData = await response.json();
      if (resData.status === "success" || resData.success || resData.status === "saved") {
        onRestore(wipedData);
        showFeedback(
          "success",
          data.language === "mr"
            ? "सर्व नोंदी यशस्वीरित्या हटवून सर्व विभाग शून्यावर आणले गेले आहेत!"
            : "Database successfully wiped! All modules reset to exactly 0."
        );
      } else {
        showFeedback("error", resData.error || "Failed raw reset write");
      }
    } catch (err: any) {
      showFeedback("error", err.message || "Wipe action crashed");
    } finally {
      setActionPending(false);
    }
  };

  // 2. Import/Upload from custom file
  const handleImportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    const files = e.target.files;
    if (!files || files.length === 0) return;

    fileReader.readAsText(files[0], "UTF-8");
    fileReader.onload = async (event) => {
      try {
        const fileContent = event.target?.result;
        if (!fileContent || typeof fileContent !== "string") {
          throw new Error("File content is empty or invalid format.");
        }
        
        const parsed = JSON.parse(fileContent);
        
        // Dynamic validations to check if parsing is consistent with SystemData schema
        if (!parsed.products || !parsed.inventory) {
          throw new Error(
            data.language === "mr"
              ? "अवैध बॅकअप फाईल्स! कृपया योग्य .json निवडा."
              : "Invalid backup file structure! Missing critical properties (products, inventory)."
          );
        }

        setActionPending(true);
        const response = await fetch("/api/backups/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(parsed)
        });

        const resData = await response.json();
        if (resData.success) {
          onRestore(parsed);
          showFeedback(
            "success",
            data.language === "mr"
              ? "डेटा यशस्वीरित्या अपलोड करण्यात आला असून संपूर्ण सिस्टिम अद्ययावत केली आहे!"
              : "Database successfully uploaded, initialized, and synchronized!"
          );
          fetchBackups();
        } else {
          showFeedback("error", resData.error || "Server upload failed");
        }
      } catch (err: any) {
        showFeedback("error", err.message || "Invalid JSON or structural errors.");
      } finally {
        setActionPending(false);
        e.target.value = ""; // clear
      }
    };
  };

  // 3. Trigger manual background backup
  const handleCreateManualBackup = async () => {
    setActionPending(true);
    try {
      const response = await fetch("/api/backups/create", { method: "POST" });
      const resData = await response.json();
      if (resData.success) {
        showFeedback(
          "success",
          data.language === "mr"
            ? "नवीन ऑटोमॅटिक सिस्टिम बॅकअप तयार करण्यात आला!"
            : "A new automated server-side backup point was created successfully!"
        );
        fetchBackups();
      } else {
        showFeedback("error", resData.error || "Failed to create manual backup");
      }
    } catch (err: any) {
      showFeedback("error", err.message);
    } finally {
      setActionPending(false);
    }
  };

  // 4. Restore selected server backup
  const handleRestoreBackup = async (filename: string) => {
    const confirmed = window.confirm(
      data.language === "mr" 
        ? `सावधगिरी! तुम्ही निवडलेला बॅकअप (${filename}) रिस्टोर करत आहात. यामुळे सध्याच्या नोंदी बदलल्या जातील. सुरू ठेवायचे का?`
        : `ATTENTION: You are about to restore the backup file "${filename}" to live. All entries added after this backup date will be overwritten. Proceed?`
    );
    if (!confirmed) return;

    setActionPending(true);
    try {
      const response = await fetch("/api/backups/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename })
      });
      const resData = await response.json();
      if (resData.success) {
        // Fetch fresh state from the server
        const dataResponse = await fetch("/api/data");
        const freshData = await dataResponse.json();
        onRestore(freshData);
        showFeedback(
          "success",
          data.language === "mr"
            ? `सिस्टिम बॅकअप यशस्वीरित्या रिस्टोर केलेला आहे!`
            : `System state has been successfully reverted to backup: ${filename}`
        );
      } else {
        showFeedback("error", resData.error || "Restore execution failed");
      }
    } catch (err: any) {
      showFeedback("error", err.message);
    } finally {
      setActionPending(false);
    }
  };

  // Standard conversions
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getStatsCount = () => {
    return {
      sales: data.sales?.length || 0,
      helpers: data.staff?.length || 0,
      purchases: data.purchases?.length || 0,
      products: data.products?.length || 0,
      salaries: data.salaries?.length || 0,
      closingLogs: data.closingLogs?.length || 0,
    };
  };

  const stats = getStatsCount();

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-orange-100 rounded-lg text-orange-600">
              <Database className="w-5 h-5 animate-pulse" />
            </div>
            <h3 className="font-extrabold text-gray-800 text-sm md:text-base">
              {data.language === "mr" ? "सुरक्षित डेटा आणि डिजिटल बॅकअप व्यवस्थापन" : "Secure Database & Cloud Backup Console"}
            </h3>
          </div>
          <p className="text-[11px] text-gray-500 mt-1 max-w-2xl font-medium leading-relaxed">
            {data.language === "mr" 
              ? "तुमच्या गणेश भेल प्रणालीतील प्रत्येक व्यवहार सुरक्षित ठेवा. इथे तुम्ही डेटा गोळा करून संगणकावर सुरक्षित फाईलमध्ये सेव्ह करू शकता, किंवा ऑटोमॅटिक सिस्टिम बॅकअपमधून तात्काळ जुना डेटा मागे आणू शकता."
              : "Safeguard every real-time transaction on your live instance. Generate instant manual or automated local snapshots, export data as a standard JSON ledger, or restore system state cleanly with 1-click controls."}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 shrink-0 md:self-center">
          <button
            onClick={() => setShowCSVImporter(!showCSVImporter)}
            className={`${
              showCSVImporter 
                ? "bg-slate-900 hover:bg-slate-800 text-orange-400 border border-slate-700 font-extrabold" 
                : "bg-slate-800 hover:bg-slate-900 text-white font-bold"
            } px-3 py-2 rounded-xl text-xs flex items-center space-x-1.5 cursor-pointer shadow transition-all select-none`}
            title="Import Excel or CSV dataset summaries"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>{data.language === "mr" ? "एक्सेल/CSV आयात करा" : "Import CSV/Excel"}</span>
          </button>

          <button
            onClick={handleExportData}
            disabled={actionPending}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-2 rounded-xl text-xs flex items-center space-x-1.5 cursor-pointer shadow transition-all disabled:opacity-50 select-none"
          >
            <Download className="w-4 h-4" />
            <span>{data.language === "mr" ? "डेटा फाईल डाउनलोड" : "Download JSON Snapshot"}</span>
          </button>

          <label className="bg-orange-650 hover:bg-orange-750 text-white font-bold px-3 py-2 rounded-xl text-xs flex items-center space-x-1.5 cursor-pointer shadow transition-all disabled:opacity-50 select-none">
            <Upload className="w-4 h-4" />
            <span>{data.language === "mr" ? "बॅकअप फाईल अपलोड" : "Upload Backup"}</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportFileChange}
              disabled={actionPending}
              className="hidden"
            />
          </label>

          <button
            onClick={handleResetToZero}
            disabled={actionPending}
            className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-3 py-2 rounded-xl text-xs flex items-center space-x-1.5 cursor-pointer shadow transition-all disabled:opacity-50 select-none"
            title="Wipe database tables to exactly 0 records"
          >
            <ShieldAlert className="w-4 h-4 text-rose-200" />
            <span>{data.language === "mr" ? "सर्व नोंदी पुन्हा सुन्या करा" : "Reset Database to 0"}</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div className={`p-4 rounded-xl flex items-start gap-3 border text-xs leading-relaxed ${
          feedback.type === "success" 
            ? "bg-emerald-50 text-emerald-800 border-emerald-150" 
            : "bg-rose-50 text-rose-800 border-rose-150"
        }`}>
          {feedback.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
          )}
          <span className="font-bold">{feedback.message}</span>
        </div>
      )}

      {/* 2. Database Stats Panel */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        {[
          { key: "sales", value: stats.sales, label: data.language === "mr" ? "दैनिक विक्री नोंदी" : "Sales Records", color: "text-orange-600 bg-orange-50 border-orange-100" },
          { key: "helpers", value: stats.helpers, label: data.language === "mr" ? "एकूण कर्मचारी" : "Active Workers", color: "text-blue-600 bg-blue-50 border-blue-100" },
          { key: "purchases", value: stats.purchases, label: data.language === "mr" ? "मालाची खरेदी पत्रके" : "Purchased Slips", color: "text-teal-600 bg-teal-50 border-teal-100" },
          { key: "products", value: stats.products, label: data.language === "mr" ? "मेन्यू मधील घटक" : "Active Menu Items", color: "text-indigo-600 bg-indigo-50 border-indigo-100" },
          { key: "salaries", value: stats.salaries, label: data.language === "mr" ? "पगाराच्या नोंदी" : "Paid Salaries", color: "text-rose-600 bg-rose-50 border-rose-100" },
          { key: "closings", value: stats.closingLogs, label: data.language === "mr" ? "गल्लाबंदी कुलूपे" : "Shift locks Sync", color: "text-amber-600 bg-amber-50 border-amber-100" },
        ].map((item, idx) => (
          <div key={idx} className={`sm:col-span-1 rounded-xl p-3 border flex flex-col justify-between ${item.color}`}>
            <span className="text-[10px] uppercase font-black tracking-wider text-slate-500">{item.label}</span>
            <div className="flex items-baseline space-x-1.5 mt-2.5">
              <span className="text-xl font-mono font-black text-gray-900">{item.value}</span>
              <span className="text-[9px] text-gray-400 font-bold uppercase">Active</span>
            </div>
          </div>
        ))}
      </div>

      {/* CSV IMPORTER INTEGRATED HUB */}
      {showCSVImporter && (
        <div className="bg-white rounded-2xl border border-gray-150 shadow-md p-6 space-y-6 animate-fadeIn">
          {/* Card Title */}
          <div className="flex justify-between items-center pb-4 border-b border-gray-100">
            <div>
              <h4 className="font-extrabold text-sm text-slate-900 flex items-center space-x-1.5">
                <FileSpreadsheet className="w-5 h-5 text-orange-500" />
                <span>
                  {data.language === "mr" 
                    ? "एक्सेल/CSV डेटा आयात केंद्र (Advanced CSV Importer)" 
                    : "Advanced Excel/CSV Operation Importer"}
                </span>
              </h4>
              <p className="text-[11px] text-gray-500 mt-1">
                {data.language === "mr" 
                  ? "तुमचा जुना विक्री आणि मालाच्या खरेदीचा डेटा बॅकअप एक्सपोर्ट फाईल्समधून तात्काळ लोड करा." 
                  : "Effortlessly load sales logs and wholesale lists directly from spreadsheet CSV exports."}
              </p>
            </div>
            
            <button 
              onClick={() => setShowCSVImporter(false)} 
              className="text-gray-400 hover:text-gray-600 font-extrabold text-xs bg-gray-50 p-1.5 rounded-lg border border-gray-100 cursor-pointer"
            >
              ✕
            </button>
          </div>

          {/* Tab Selection */}
          <div className="flex gap-2">
            <button
              onClick={() => handleImportTypeChange("sales")}
              className={`px-4 py-2 rounded-xl text-xs font-bold leading-none select-none cursor-pointer transition ${
                csvImportType === "sales" 
                  ? "bg-orange-500 text-white shadow-sm font-black" 
                  : "bg-gray-100 text-slate-600 hover:bg-gray-200"
              }`}
            >
              📊 {data.language === "mr" ? "दैनिक विक्री आयात (Daily Sales)" : "Import Daily Sales"}
            </button>
            <button
              onClick={() => handleImportTypeChange("purchases")}
              className={`px-4 py-2 rounded-xl text-xs font-bold leading-none select-none cursor-pointer transition ${
                csvImportType === "purchases" 
                  ? "bg-orange-500 text-white shadow-sm font-black" 
                  : "bg-gray-100 text-slate-600 hover:bg-gray-200"
              }`}
            >
              🛒 {data.language === "mr" ? "खरेदी नोंदी आयात (Material Purchases)" : "Import Material Purchases"}
            </button>
          </div>

          {/* Step 1: Upload or Paste Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="block text-[11px] uppercase tracking-wider font-extrabold text-slate-500">
                {data.language === "mr" ? "१. डेटा निवडा (पद्धत - १: फाईल अपलोड / पद्धत - २: कॉपी-पेस्ट)" : "Step 1: Provide Data (File Upload or Raw Paste)"}
              </label>

              {/* Upload Drag Box */}
              <div className="border-2 border-dashed border-gray-200 hover:border-orange-300 rounded-xl p-4 bg-gray-50/50 text-center transition relative">
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleCSVFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Database className="w-8 h-8 text-orange-400 mx-auto opacity-70 animate-pulse" />
                <p className="text-xs font-bold text-gray-700 mt-2">
                  {data.language === "mr" ? "संगणकावरील .csv फाईल निवडा किंवा ओढा" : "Select or Drag & Drop .csv spreadsheet file"}
                </p>
                <p className="text-[10px] text-gray-400 mt-1 uppercase font-semibold">
                  {data.language === "mr" ? "किंवा खाली मॅन्युअली डेटा पेस्ट करा" : "OR simply paste excel rows below"}
                </p>
              </div>

              {/* Paste Textbox */}
              <div>
                <textarea
                  value={csvRawText}
                  onChange={(e) => handleCSVTextChange(e.target.value)}
                  placeholder={
                    csvImportType === "sales"
                      ? "Date,Total Sales,Cash,UPI\n2026-06-11,14500,4500,10000"
                      : "Bill Date,Item Name,Vendor,Total Amount\n2026-06-11,Sev,Mahesh Traders,4500"
                  }
                  className="w-full h-28 font-mono text-xs p-3 border border-gray-200 rounded-xl focus:ring-1 focus:ring-orange-500/30 focus:border-orange-500 outline-none bg-slate-50 text-slate-800 leading-relaxed"
                />
                <div className="flex justify-between items-center mt-1">
                  <span className="text-[10px] text-gray-400 font-semibold uppercase">
                    {csvRows.length > 0 ? `Loaded ${csvRows.length} Rows` : "Raw CSV console"}
                  </span>
                  <button
                    onClick={handleLoadSampleCSV}
                    className="text-[10px] text-orange-600 hover:text-orange-700 font-bold uppercase select-none hover:underline cursor-pointer"
                  >
                    💡 {data.language === "mr" ? "नमुना डेटा लोड करा" : "Load Test Sample CSV"}
                  </button>
                </div>
              </div>
            </div>

            {/* Step 2: Mapping columns */}
            <div className="space-y-4">
              <label className="block text-[11px] uppercase tracking-wider font-extrabold text-slate-500 pb-1">
                {data.language === "mr" ? "२. कॉलम आणि डेटा मॅपिंग (Schema Mapping)" : "Step 2: Align Column Headers"}
              </label>

              {csvHeaders.length === 0 ? (
                <div className="border border-dashed border-gray-150 bg-gray-50/50 rounded-xl p-8 text-center text-xs text-gray-400 space-y-2">
                  <HelpCircle className="w-8 h-8 text-gray-300 mx-auto" />
                  <p className="font-bold">{data.language === "mr" ? "कॉलम मॅपिंगसाठी आधी डेटा निवडा." : "No columns detected yet."}</p>
                  <p className="text-[10px] text-gray-400 font-medium max-w-sm mx-auto">
                    {data.language === "mr" 
                      ? "जेव्हा तुम्ही CSV फाईल अपलोड कराल तेव्हा कॉलम आणि डेटा मॅपिंग पर्यायांची यादी इथे दर्शवली जाईल." 
                      : "Once you paste or select a CSV spreadsheet, we will auto-detect headers so you can match them to database fields."}
                  </p>
                </div>
              ) : (
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 space-y-3 max-h-[19.5rem] overflow-y-auto">
                  <div className="text-[11px] font-bold text-gray-500 flex justify-between uppercase pb-1 border-b border-gray-150">
                    <span>{data.language === "mr" ? "सिस्टम डेटा फील्ड" : "Target System Field"}</span>
                    <span>{data.language === "mr" ? "तुमचा CSV कॉलम" : "CSV Column Header"}</span>
                  </div>

                  {(csvImportType === "sales" 
                    ? [
                        { key: "date", label: "Date / तारीख *", req: true },
                        { key: "totalSales", label: "Total Sales Amount / एकूण विक्री *", req: true },
                        { key: "cashCollection", label: "Cash Collection / रोख", req: false },
                        { key: "upiCollection", label: "UPI / PhonePe", req: false },
                        { key: "cardCollection", label: "Card Collection", req: false },
                        { key: "swiggyCollection", label: "Swiggy Income", req: false },
                        { key: "zomatoCollection", label: "Zomato Income", req: false },
                        { key: "otherCollection", label: "Other Income channels", req: false },
                        { key: "remarks", label: "Remarks / शेरा / नोंद", req: false },
                      ]
                    : [
                        { key: "date", label: "Invoice Date / तारीख *", req: true },
                        { key: "itemName", label: "Material Name / साहित्य *", req: true },
                        { key: "amount", label: "Amount / एकूण मूल्य *", req: true },
                        { key: "vendorName", label: "Vendor / विक्रेता", req: false },
                        { key: "category", label: "Category / विभाग", req: false },
                        { key: "quantity", label: "Quantity / मात्रा", req: false },
                        { key: "unit", label: "Unit (kg/bags)", req: false },
                        { key: "rate", label: "Rate per Unit", req: false },
                        { key: "paymentMode", label: "Payment Mode (Cash/UPI)", req: false },
                        { key: "invoiceNumber", label: "Invoice/Bill Number", req: false },
                        { key: "purchaseType", label: "Type (Shop/Staff)", req: false },
                        { key: "remarks", label: "Remarks / शेरा", req: false },
                      ]
                  ).map((field) => {
                    const isMapped = !!mappedFields[field.key];
                    return (
                      <div key={field.key} className="flex justify-between items-center text-xs gap-3">
                        <span className="font-bold text-gray-700 flex items-center space-x-1.5 shrink-0">
                          {field.req ? (
                            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0"></span>
                          ) : (
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0"></span>
                          )}
                          <span>{field.label}</span>
                        </span>

                        <select
                          value={mappedFields[field.key] || ""}
                          onChange={(e) => {
                            setMappedFields({
                              ...mappedFields,
                              [field.key]: e.target.value,
                            });
                          }}
                          className={`text-slate-800 text-[11px] font-bold p-1 px-2 border border-gray-20 rounded bg-white max-w-xs focus:border-orange-400 outline-none cursor-pointer ${
                            isMapped ? "text-emerald-700 border-emerald-200 bg-emerald-50/20" : "text-gray-400"
                          }`}
                        >
                          <option value="">-- Skip / Ignore field --</option>
                          {csvHeaders.map((headerName) => (
                            <option key={headerName} value={headerName}>
                              {headerName}
                            </option>
                          ))}
                        </select>
                      </div>
                    );
                  })}
                  <p className="text-[9px] text-gray-400 font-bold uppercase leading-relaxed pt-1.5">
                    * {data.language === "mr" ? "तारेचे चिन्ह (*) असलेले फील्ड्स आवश्यक आहेत." : "Star fields (*) are required for importing."}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Step 3: Conflict Resolution & Preview Table */}
          {previewData.length > 0 && (
            <div className="space-y-4 pt-2 border-t border-gray-100">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                <div>
                  <h5 className="text-[11px] uppercase tracking-wider font-extrabold text-slate-500">
                    {data.language === "mr" ? "३. गुणवत्ता पडताळणी आणि परिणाम (Preview & Verification)" : "Step 3: Preview mapped data & policy config"}
                  </h5>
                  <p className="text-[10px] text-gray-400 font-semibold mt-0.5">
                    {data.language === "mr" 
                      ? `आयात करण्यायोग्य डेटा: एकूण ${previewData.length} नोंदी प्रक्रिया होण्यास तयार आहेत.` 
                      : `Live preview of first 4 rows. Ready to process ${previewData.length} total entries.`}
                  </p>
                </div>

                <div className="flex items-center space-x-3 shrink-0">
                  <span className="text-xs font-bold text-gray-600">
                    {data.language === "mr" ? "दुहेरी नोंदणी धोरण (Duplicates):" : "Duplicate resolution:"}
                  </span>
                  
                  {csvImportType === "sales" ? (
                    <select
                      value={conflictStrategy}
                      onChange={(e: any) => setConflictStrategy(e.target.value)}
                      className="text-xs font-bold p-1 px-3 border border-gray-200 rounded-lg bg-gray-50 focus:border-orange-500 outline-none cursor-pointer"
                    >
                      <option value="overwrite">🔄 {data.language === "mr" ? "नवीन डेटा ओव्हरराईट करा (Replace)" : "Replace existing log"}</option>
                      <option value="merge">➕ {data.language === "mr" ? "रक्कम एकत्र मिळवा (Add together)" : "Add amounts together"}</option>
                      <option value="skip">🚫 {data.language === "mr" ? "दुसरी नोद वगळा (Skip conflict)" : "Skip date collision"}</option>
                    </select>
                  ) : (
                    <select
                      value={conflictStrategy}
                      onChange={(e: any) => setConflictStrategy(e.target.value)}
                      className="text-xs font-bold p-1 px-3 border border-gray-205 rounded-lg bg-gray-50 focus:border-orange-500 outline-none cursor-pointer"
                    >
                      <option value="skip">🛡️ {data.language === "mr" ? "तंतोतंत मूळ तेच असल्यास थांबवा" : "Skip exact matches"}</option>
                      <option value="append">➕ {data.language === "mr" ? "सभी नोंदी जोडा (Append always)" : "Append all records"}</option>
                    </select>
                  )}
                </div>
              </div>

              {/* Mini Table Preview */}
              <div className="border border-gray-100 rounded-xl overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-[9px] border-b border-gray-150">
                    <tr>
                      <th className="p-2 pl-3">{data.language === "mr" ? "तारीख" : "Date"}</th>
                      {csvImportType === "sales" ? (
                        <>
                          <th className="p-2">{data.language === "mr" ? "एकूण विक्री" : "Total Sales"}</th>
                          <th className="p-2">{data.language === "mr" ? "रोख" : "Cash"}</th>
                          <th className="p-2">{data.language === "mr" ? "UPI" : "UPI"}</th>
                          <th className="p-2">{data.language === "mr" ? "Swiggy/Zomato" : "Delivery"}</th>
                        </>
                      ) : (
                        <>
                          <th className="p-2">{data.language === "mr" ? "साहित्य" : "Item"}</th>
                          <th className="p-2">{data.language === "mr" ? "व्यापारी" : "Vendor"}</th>
                          <th className="p-2">{data.language === "mr" ? "प्रमाण" : "Quantity"}</th>
                          <th className="p-2">{data.language === "mr" ? "एकूण रक्कम" : "Total Cost"}</th>
                        </>
                      )}
                      <th className="p-2 pr-3 text-right">{data.language === "mr" ? "स्टेटस" : "Status"}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 font-medium">
                    {previewData.slice(0, 4).map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="p-2 pl-3 font-mono text-[10px] text-gray-900">{row.date}</td>
                        {csvImportType === "sales" ? (
                          <>
                            <td className="p-2 font-mono text-gray-900">₹{row.totalSales.toLocaleString()}</td>
                            <td className="p-2 font-mono text-emerald-600">₹{row.cashCollection.toLocaleString()}</td>
                            <td className="p-2 font-mono text-blue-600">₹{row.upiCollection.toLocaleString()}</td>
                            <td className="p-2 font-mono text-gray-500">₹{(row.swiggyCollection + row.zomatoCollection).toLocaleString()}</td>
                          </>
                        ) : (
                          <>
                            <td className="p-2 font-bold text-gray-800">{row.itemName}</td>
                            <td className="p-2 text-gray-500 text-[11px]">{row.vendorName}</td>
                            <td className="p-2 font-mono text-gray-600">{row.quantity} {row.unit}</td>
                            <td className="p-2 font-mono font-bold text-slate-800">₹{row.amount.toLocaleString()}</td>
                          </>
                        )}
                        <td className="p-2 pr-3 text-right">
                          <span className="inline-flex items-center text-[10px] text-emerald-600 font-bold bg-emerald-50 border border-emerald-100 p-0.5 px-2 rounded-full">
                            ✓ {data.language === "mr" ? "योग्य" : "Validated"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Execution action triggers */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setCsvRawText("");
                    setCsvHeaders([]);
                    setCsvRows([]);
                    setMappedFields({});
                    setPreviewData([]);
                  }}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold px-4 py-2 rounded-xl text-xs select-none cursor-pointer"
                >
                  {data.language === "mr" ? "डेटा काढून टाका" : "Clear Input"}
                </button>
                <button
                  type="button"
                  onClick={handleExecuteCSVImport}
                  disabled={actionPending}
                  className="bg-orange-600 hover:bg-orange-700 text-white font-extrabold px-6 py-2 rounded-xl text-xs select-none cursor-pointer shadow flex items-center space-x-2"
                >
                  <Check className="w-4 h-4" />
                  <span>
                    {data.language === "mr" 
                      ? `${previewData.length} नोंदी थेट लोड करा` 
                      : `Execute Safe Load of ${previewData.length} records`}
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 3. Automatic Server Side Backups Column */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-gray-50">
            <div>
              <h4 className="font-extrabold text-sm text-gray-800 flex items-center space-x-1.5">
                <HardDrive className="w-4 h-4 text-orange-500" />
                <span>{data.language === "mr" ? "सिस्टिम अंतर्गत बॅकअप्स (Auto-Snapshots)" : "Automated Server-Side Snapshots"}</span>
              </h4>
              <p className="text-[10px] text-gray-400 mt-0.5">
                {data.language === "mr" 
                  ? "प्रत्येक नवीन नोंदणी किंवा दुरुस्तीनंतर स्वयंचलित सुरक्षित रेकॉर्ड्स तयार केले जातात (कमाल १२ बॅकअप)."
                  : "Automatic timestamped restore-points stored locally on data updates. Revert safe status anytime."}
              </p>
            </div>

            <button
              onClick={handleCreateManualBackup}
              disabled={actionPending}
              className="bg-orange-50 hover:bg-orange-100 text-orange-600 border border-orange-200 hover:border-orange-300 font-extrabold text-xs px-3 py-1.5 rounded-lg flex items-center space-x-1 cursor-pointer transition select-none disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{data.language === "mr" ? "आत्ता सेव्ह पॉईंट बनवा" : "Create Snapshot"}</span>
            </button>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center text-[10px] uppercase font-bold text-gray-400 bg-gray-50 p-2 rounded-lg px-3">
              <span>{data.language === "mr" ? "नोंद तारीख व वेळ" : "Backup Timestamp"}</span>
              <span className="text-right">{data.language === "mr" ? "आकार / कृती" : "Size & Actions"}</span>
            </div>

            {fetchingBackups && (
              <div className="text-center py-6 text-gray-400 flex items-center justify-center space-x-2 text-xs">
                <RefreshCw className="w-4 h-4 animate-spin text-orange-500" />
                <span className="font-medium">Loading system backups...</span>
              </div>
            )}

            {!fetchingBackups && backups.length === 0 && (
              <div className="text-center py-8 text-gray-400 border border-dashed border-gray-150 rounded-xl space-y-1">
                <FileJson className="w-8 h-8 text-gray-300 mx-auto" />
                <p className="text-xs font-bold">{data.language === "mr" ? "सिस्टीममध्ये कोणतेही स्वयंचलित बॅकअप्स सापडले नाहीत." : "No automated server snapshots generated yet."}</p>
                <p className="text-[9px] text-gray-400">{data.language === "mr" ? "तुम्ही एखादी नवीन नोंद करताच इथे स्वयंचलित बॅकअप तयार होईल!" : "Snapshots appear here automatically as soon as any live transactions are recorded."}</p>
              </div>
            )}

            {!fetchingBackups && backups.map((b) => {
              const bDate = new Date(b.timestamp);
              return (
                <div key={b.filename} className="flex justify-between items-center p-3 hover:bg-gray-50/50 rounded-xl border border-gray-50 transition text-xs">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-slate-50 text-slate-500 rounded-lg border border-slate-100">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-extrabold text-gray-800 text-[11px] font-mono leading-none">{b.filename}</p>
                      <div className="flex items-center space-x-2 text-[9px] text-gray-400 font-bold mt-1.5 uppercase leading-none">
                        <Clock className="w-3.5 h-3.5 text-orange-500" />
                        <span>{bDate.toLocaleDateString()} {bDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <span className="font-bold text-[10px] text-gray-400 font-mono bg-gray-50 border border-gray-100 px-2 py-0.5 rounded">
                      {formatBytes(b.size)}
                    </span>
                    
                    <button
                      onClick={() => handleRestoreBackup(b.filename)}
                      disabled={actionPending}
                      className="bg-slate-900 hover:bg-orange-600 text-white hover:text-white font-extrabold px-2.5 py-1.5 rounded-lg text-[10px] flex items-center space-x-1 cursor-pointer transition disabled:opacity-50 select-none shadow-sm"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>{data.language === "mr" ? "रिस्टोर" : "Restore"}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 4. Help Console Panel */}
        <div className="bg-slate-900 text-white rounded-2xl p-5 space-y-4 relative overflow-hidden shadow-md flex flex-col justify-between">
          <div className="space-y-3">
            <span className="bg-orange-500 text-white text-[8px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded border border-orange-400">
              {data.language === "mr" ? "विवेक आणि खबरदारी" : "LIVE SAFETY DIRECTIVES"}
            </span>

            <h4 className="font-black text-white text-sm tracking-tight pt-1">
              {data.language === "mr" ? "तुमचा डेटा कधीही गमावला जाणार नाही!" : "How Live Database Safety Functions"}
            </h4>

            <div className="space-y-3 text-[11px] text-slate-300 font-medium leading-relaxed pt-2">
              <div className="flex items-start gap-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0 mt-1.5"></div>
                <p>
                  {data.language === "mr"
                    ? "सिस्टीम तुमची प्रत्येक नोंद थेट मुख्य स्टोरेज फाईल 'db.json' मध्ये साठवते. त्यामुळे कोणताही सामान्य बदल डेटा घालवू शकत नाही."
                    : "The system writes and flushes active records instantly to 'db.json'. This holds true for all transaction logs."}
                </p>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0 mt-1.5"></div>
                <p>
                  {data.language === "mr"
                    ? "जेव्हा जेव्हा तुम्ही काही बदलता, किंवा एखादा नवीन रिपोर्ट बनवता, तेव्हा सर्व्हर आपोआप त्या क्षणाचा सुरक्षित ऑटो-बॅकअप बनवतो."
                    : "Every write triggers a companion server-side auto-snapshot, creating an immutable history of up to 12 active states."}
                </p>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0 mt-1.5"></div>
                <p>
                  {data.language === "mr"
                    ? "महत्वाची सुरक्षा टिप: संपूर्ण इंटरनेट बंद असल्यास किंवा सिस्टीम नवीन कोडवर अपडेट होत असताना, तुमच्या संगणकावर आजचा डेटा सुरक्षित डाऊनलोड करून ठेवा जेणेकरून तुम्ही कधीही तो परत आणू शकता."
                    : "Best Practice: Periodically trigger 'Download JSON Snapshot' to save a physical copy to your device. This acts as a secondary recovery ledger."}
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex items-center space-x-2 text-[10px] text-slate-400 font-bold uppercase">
            <Calendar className="w-4 h-4 text-orange-500 shrink-0" />
            <span>Active Server Ledger: Pune India</span>
          </div>

          {/* Background pattern */}
          <div className="absolute right-0 bottom-0 translate-x-5 translate-y-5 p-8 bg-orange-500/10 rounded-full blur-2xl pointer-events-none"></div>
        </div>
      </div>
    </div>
  );
}
