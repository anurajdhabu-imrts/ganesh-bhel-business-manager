"""Pydantic schemas for the system-data sync contract.

The React frontend exchanges a single `SystemData` blob (camelCase keys) with
the backend. These models validate that blob while accepting/serialising
camelCase via field aliases.
"""
from typing import Any, Dict, List, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field


class CamelModel(BaseModel):
    """Base that serialises to camelCase and accepts both snake/camel input."""

    model_config = ConfigDict(populate_by_name=True, from_attributes=True)


class SaleSchema(CamelModel):
    id: str
    date: str
    total_sales: int = Field(0, alias="totalSales")
    cash_collection: int = Field(0, alias="cashCollection")
    upi_collection: int = Field(0, alias="upiCollection")
    card_collection: int = Field(0, alias="cardCollection")
    swiggy_collection: int = Field(0, alias="swiggyCollection")
    zomato_collection: int = Field(0, alias="zomatoCollection")
    other_collection: int = Field(0, alias="otherCollection")
    remarks: Optional[str] = None
    shop_id: Optional[str] = Field(None, alias="shopId")


class ProductSchema(CamelModel):
    id: str
    name: str
    category: str
    selling_price: int = Field(0, alias="sellingPrice")
    status: str = "Active"
    shop_id: Optional[str] = Field(None, alias="shopId")
    recipe_json: Optional[str] = Field(None, alias="recipeJson")


class PurchaseSchema(CamelModel):
    id: str
    date: str
    purchase_type: str = Field(..., alias="purchaseType")
    vendor_name: str = Field(..., alias="vendorName")
    item_name: str = Field(..., alias="itemName")
    category: str
    quantity: float = 0
    unit: str
    rate: int = 0
    amount: int = 0
    payment_mode: str = Field(..., alias="paymentMode")
    invoice_number: Optional[str] = Field(None, alias="invoiceNumber")
    remarks: Optional[str] = None
    is_custom_voice_entry: bool = Field(False, alias="isCustomVoiceEntry")
    shop_id: Optional[str] = Field(None, alias="shopId")


class StaffSchema(CamelModel):
    id: str
    name: str
    mobile: str
    address: str
    joining_date: str = Field(..., alias="joiningDate")
    salary: int = 0
    designation: str
    emergency_contact: str = Field(..., alias="emergencyContact")
    status: str = "Active"
    shop_id: Optional[str] = Field(None, alias="shopId")


class AdvanceSchema(CamelModel):
    id: str
    date: str
    staff_id: str = Field(..., alias="staffId")
    staff_name: str = Field(..., alias="staffName")
    amount: int = 0
    reason: str
    given_by: str = Field(..., alias="givenBy")
    recovered_amount: int = Field(0, alias="recoveredAmount")
    remarks: Optional[str] = None
    shop_id: Optional[str] = Field(None, alias="shopId")


class WelfareExpenseSchema(CamelModel):
    id: str
    date: str
    staff_id: Optional[str] = Field(None, alias="staffId")
    staff_name: Optional[str] = Field(None, alias="staffName")
    category: str
    amount: int = 0
    notes: Optional[str] = None
    shop_id: Optional[str] = Field(None, alias="shopId")


class SalarySchema(CamelModel):
    id: str
    staff_id: str = Field(..., alias="staffId")
    staff_name: str = Field(..., alias="staffName")
    month_year: str = Field(..., alias="monthYear")
    base_salary: int = Field(0, alias="baseSalary")
    advance_recovery: int = Field(0, alias="advanceRecovery")
    other_deductions: int = Field(0, alias="otherDeductions")
    net_payable: int = Field(0, alias="netPayable")
    payment_date: str = Field(..., alias="paymentDate")
    payment_mode: str = Field(..., alias="paymentMode")
    remarks: Optional[str] = None
    shop_id: Optional[str] = Field(None, alias="shopId")


class InventorySchema(CamelModel):
    id: str
    name: str
    opening_stock: float = Field(0, alias="openingStock")
    purchased_stock: float = Field(0, alias="purchasedStock")
    consumed_stock: float = Field(0, alias="consumedStock")
    closing_stock: float = Field(0, alias="closingStock")
    unit: str
    low_stock_threshold: float = Field(0, alias="lowStockThreshold")
    shop_id: Optional[str] = Field(None, alias="shopId")
    cost_per_unit: Optional[float] = Field(0, alias="costPerUnit")


class ClosingLogSchema(CamelModel):
    date: str
    sales_entered: bool = Field(False, alias="salesEntered")
    purchases_entered: bool = Field(False, alias="purchasesEntered")
    expenses_entered: bool = Field(False, alias="expensesEntered")
    cash_verified: bool = Field(False, alias="cashVerified")
    actual_cash: int = Field(0, alias="actualCash")
    system_cash: int = Field(0, alias="systemCash")
    discrepancies: Optional[str] = None
    closed_at: Optional[str] = Field(None, alias="closedAt")
    closed_by: Optional[str] = Field(None, alias="closedBy")
    shop_id: Optional[str] = Field(None, alias="shopId")


class NotificationSchema(CamelModel):
    id: str
    type: str
    text: str
    severity: str
    date: str
    read: bool = False


class ShopSchema(CamelModel):
    id: str
    name: str
    location: Optional[str] = None
    status: str = "Active"


class SystemData(CamelModel):
    """Full operational state exchanged with the frontend."""

    language: Literal["en", "mr"] = "en"
    user_role: Literal["owner", "manager"] = Field("owner", alias="userRole")
    sales: List[SaleSchema] = []
    products: List[ProductSchema] = []
    purchases: List[PurchaseSchema] = []
    staff: List[StaffSchema] = []
    advances: List[AdvanceSchema] = []
    welfare_expenses: List[WelfareExpenseSchema] = Field([], alias="welfareExpenses")
    salaries: List[SalarySchema] = []
    inventory: List[InventorySchema] = []
    closing_logs: List[ClosingLogSchema] = Field([], alias="closingLogs")
    notifications: List[NotificationSchema] = []
    categories: List[str] = []
    shops: List[ShopSchema] = []
    last_updated: Optional[int] = Field(None, alias="lastUpdated")


# --- Request / response helpers -------------------------------------------------

class AIChatRequest(BaseModel):
    messages: List[Dict[str, Any]]


class VoiceInputRequest(BaseModel):
    text: str


class BackupRestoreRequest(BaseModel):
    filename: str


class BackupInfo(BaseModel):
    filename: str
    timestamp: str
    size: int
