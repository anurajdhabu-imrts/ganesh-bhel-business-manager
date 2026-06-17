export interface DailySales {
  id: string; // Date formatted as 'YYYY-MM-DD' or UUID
  date: string; // 'YYYY-MM-DD'
  totalSales: number;
  cashCollection: number;
  upiCollection: number;
  cardCollection: number;
  swiggyCollection: number;
  zomatoCollection: number;
  otherCollection: number;
  remarks?: string;
  shopId?: string;
}

export type ProductStatus = 'Active' | 'Inactive';

export interface RecipeIngredient {
  inventoryItemId: string; // references InventoryItem.id
  quantity: number;        // amount used per single dish sold (e.g. 0.05 kg onion)
}

export interface Product {
  id: string;
  name: string;
  category: string;
  sellingPrice: number;
  status: ProductStatus;
  shopId?: string;
  recipeJson?: string; // Serialized string of RecipeIngredient[]
}

export type PurchaseType = 'Shop' | 'Staff';
export type PaymentMode = 'Cash' | 'UPI' | 'Card' | 'Credit';

export interface Purchase {
  id: string;
  date: string; // 'YYYY-MM-DD'
  purchaseType: PurchaseType;
  vendorName: string;
  itemName: string;
  category: string;
  quantity: number;
  unit: string;
  rate: number;
  amount: number;
  paymentMode: PaymentMode;
  invoiceNumber?: string;
  remarks?: string;
  isCustomVoiceEntry?: boolean;
  shopId?: string;
}

export interface Staff {
  id: string;
  name: string;
  mobile: string;
  address: string;
  joiningDate: string; // 'YYYY-MM-DD'
  salary: number; // monthly base
  designation: string;
  emergencyContact: string;
  status: 'Active' | 'Inactive';
  shopId?: string;
}

export interface StaffAdvance {
  id: string;
  date: string; // 'YYYY-MM-DD'
  staffId: string;
  staffName: string;
  amount: number;
  reason: string;
  givenBy: string;
  recoveredAmount: number;
  remarks?: string;
  shopId?: string;
}

export interface StaffWelfareExpense {
  id: string;
  date: string; // 'YYYY-MM-DD'
  staffId?: string; // Optional if general room rent
  staffName?: string;
  category: 'Food' | 'Room Rent' | 'Electricity' | 'Water' | 'Transport' | 'Medical' | 'Other';
  amount: number;
  notes?: string;
  shopId?: string;
}

export interface SalaryPayment {
  id: string;
  staffId: string;
  staffName: string;
  monthYear: string; // 'YYYY-MM'
  baseSalary: number;
  advanceRecovery: number;
  otherDeductions: number;
  netPayable: number;
  paymentDate: string; // 'YYYY-MM-DD'
  paymentMode: 'Cash' | 'UPI' | 'Direct Transfer';
  remarks?: string;
  shopId?: string;
}

export interface InventoryItem {
  id: string;
  name: string; // e.g. "Sev", "Puri"
  openingStock: number;
  purchasedStock: number;
  consumedStock: number;
  closingStock: number;
  unit: string; // kg, pcs, etc.
  lowStockThreshold: number;
  shopId?: string;
  costPerUnit?: number;
}

export interface CashBookEntry {
  id: string;
  date: string; // 'YYYY-MM-DD'
  type: 'IN' | 'OUT';
  category: string; // Sales, Purchase, Salary, Staff Advance, Staff Welfare, Other
  amount: number;
  paymentMode: PaymentMode;
  description: string;
}

export interface Notification {
  id: string;
  type: 'low_stock' | 'outstanding_advance' | 'closing_pending' | 'expense_spike' | 'sales_missing' | 'salary_due';
  text: string;
  severity: 'info' | 'warning' | 'danger';
  date: string; // 'YYYY-MM-DD'
  read: boolean;
}

export interface Shop {
  id: string;
  name: string;
  location?: string;
  status: 'Active' | 'Inactive';
}

export interface DailyClosingLog {
  date: string; // 'YYYY-MM-DD'
  salesEntered: boolean;
  purchasesEntered: boolean;
  expensesEntered: boolean;
  cashVerified: boolean;
  actualCash: number;
  systemCash: number;
  discrepancies: string;
  closedAt?: string; // ISO string
  closedBy?: string;
  shopId?: string;
}

export interface BusinessHealthScore {
  score: number;
  rating: 'Excellent' | 'Good' | 'Average' | 'Poor';
  profitabilityScore: number;
  cashFlowScore: number;
  expenseControlScore: number;
  inventoryScore: number;
  analysisText: string;
}

export interface SalesForecast {
  tomorrowSales: number;
  weeklySales: number;
  monthlySales: number;
  confidence: number;
  analysisText: string;
}

export interface AIExpenseAlert {
  alertMsg: string;
  isSpikeDetected: boolean;
  categoriesInvolved: string[];
  recommendation: string;
}

export interface SystemData {
  sales: DailySales[];
  products: Product[];
  purchases: Purchase[];
  staff: Staff[];
  advances: StaffAdvance[];
  welfareExpenses: StaffWelfareExpense[];
  salaries: SalaryPayment[];
  inventory: InventoryItem[];
  closingLogs: DailyClosingLog[];
  notifications: Notification[];
  userRole: 'owner' | 'manager';
  language: 'en' | 'mr'; // English & Marathi
  categories?: string[];
  shops?: Shop[];
  lastUpdated?: number;
}
