"""ORM models for the Ganesh Bhel Business Manager.

Schema mirrors the original Drizzle definition: every business record is scoped
to a `user_id`. Money fields are stored as integers (whole rupees) and stock
quantities as floats, matching the frontend types.
"""
from __future__ import annotations

from datetime import datetime

from sqlalchemy import (
    Boolean,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    uid: Mapped[str] = mapped_column(Text, unique=True, nullable=False)  # Firebase UID
    email: Mapped[str] = mapped_column(Text, nullable=False)
    user_role: Mapped[str] = mapped_column(Text, default="owner", nullable=False)
    language: Mapped[str] = mapped_column(Text, default="en", nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    sales: Mapped[list["Sale"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    products: Mapped[list["Product"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    purchases: Mapped[list["Purchase"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    staff: Mapped[list["Staff"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    advances: Mapped[list["Advance"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    welfare_expenses: Mapped[list["WelfareExpense"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    salaries: Mapped[list["Salary"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    inventory: Mapped[list["Inventory"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    closing_logs: Mapped[list["ClosingLog"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    notifications: Mapped[list["Notification"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    categories: Mapped[list["Category"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    shops: Mapped[list["Shop"]] = relationship(back_populates="user", cascade="all, delete-orphan")


class Sale(Base):
    __tablename__ = "sales"

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    date: Mapped[str] = mapped_column(Text, nullable=False)
    total_sales: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    cash_collection: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    upi_collection: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    card_collection: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    swiggy_collection: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    zomato_collection: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    other_collection: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    remarks: Mapped[str | None] = mapped_column(Text)
    shop_id: Mapped[str | None] = mapped_column(Text)

    user: Mapped["User"] = relationship(back_populates="sales")


class Product(Base):
    __tablename__ = "products"

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[str] = mapped_column(Text, nullable=False)
    selling_price: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    status: Mapped[str] = mapped_column(Text, nullable=False, default="Active")
    shop_id: Mapped[str | None] = mapped_column(Text)
    recipe_json: Mapped[str | None] = mapped_column(Text)

    user: Mapped["User"] = relationship(back_populates="products")


class Purchase(Base):
    __tablename__ = "purchases"

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    date: Mapped[str] = mapped_column(Text, nullable=False)
    purchase_type: Mapped[str] = mapped_column(Text, nullable=False)
    vendor_name: Mapped[str] = mapped_column(Text, nullable=False)
    item_name: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[str] = mapped_column(Text, nullable=False)
    quantity: Mapped[float] = mapped_column(Float, nullable=False, default=0)
    unit: Mapped[str] = mapped_column(Text, nullable=False)
    rate: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    amount: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    payment_mode: Mapped[str] = mapped_column(Text, nullable=False)
    invoice_number: Mapped[str | None] = mapped_column(Text)
    remarks: Mapped[str | None] = mapped_column(Text)
    is_custom_voice_entry: Mapped[bool] = mapped_column(Boolean, default=False)
    shop_id: Mapped[str | None] = mapped_column(Text)

    user: Mapped["User"] = relationship(back_populates="purchases")


class Staff(Base):
    __tablename__ = "staff"

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    mobile: Mapped[str] = mapped_column(Text, nullable=False)
    address: Mapped[str] = mapped_column(Text, nullable=False)
    joining_date: Mapped[str] = mapped_column(Text, nullable=False)
    salary: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    designation: Mapped[str] = mapped_column(Text, nullable=False)
    emergency_contact: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(Text, nullable=False, default="Active")
    shop_id: Mapped[str | None] = mapped_column(Text)

    user: Mapped["User"] = relationship(back_populates="staff")


class Advance(Base):
    __tablename__ = "advances"

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    date: Mapped[str] = mapped_column(Text, nullable=False)
    staff_id: Mapped[str] = mapped_column(Text, nullable=False)
    staff_name: Mapped[str] = mapped_column(Text, nullable=False)
    amount: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    reason: Mapped[str] = mapped_column(Text, nullable=False)
    given_by: Mapped[str] = mapped_column(Text, nullable=False)
    recovered_amount: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    remarks: Mapped[str | None] = mapped_column(Text)
    shop_id: Mapped[str | None] = mapped_column(Text)

    user: Mapped["User"] = relationship(back_populates="advances")


class WelfareExpense(Base):
    __tablename__ = "welfare_expenses"

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    date: Mapped[str] = mapped_column(Text, nullable=False)
    staff_id: Mapped[str | None] = mapped_column(Text)
    staff_name: Mapped[str | None] = mapped_column(Text)
    category: Mapped[str] = mapped_column(Text, nullable=False)
    amount: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    notes: Mapped[str | None] = mapped_column(Text)
    shop_id: Mapped[str | None] = mapped_column(Text)

    user: Mapped["User"] = relationship(back_populates="welfare_expenses")


class Salary(Base):
    __tablename__ = "salaries"

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    staff_id: Mapped[str] = mapped_column(Text, nullable=False)
    staff_name: Mapped[str] = mapped_column(Text, nullable=False)
    month_year: Mapped[str] = mapped_column(Text, nullable=False)
    base_salary: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    advance_recovery: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    other_deductions: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    net_payable: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    payment_date: Mapped[str] = mapped_column(Text, nullable=False)
    payment_mode: Mapped[str] = mapped_column(Text, nullable=False)
    remarks: Mapped[str | None] = mapped_column(Text)
    shop_id: Mapped[str | None] = mapped_column(Text)

    user: Mapped["User"] = relationship(back_populates="salaries")


class Inventory(Base):
    __tablename__ = "inventory"

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    opening_stock: Mapped[float] = mapped_column(Float, nullable=False, default=0)
    purchased_stock: Mapped[float] = mapped_column(Float, nullable=False, default=0)
    consumed_stock: Mapped[float] = mapped_column(Float, nullable=False, default=0)
    closing_stock: Mapped[float] = mapped_column(Float, nullable=False, default=0)
    unit: Mapped[str] = mapped_column(Text, nullable=False)
    low_stock_threshold: Mapped[float] = mapped_column(Float, nullable=False, default=0)
    shop_id: Mapped[str | None] = mapped_column(Text)
    cost_per_unit: Mapped[float | None] = mapped_column(Float, default=0)

    user: Mapped["User"] = relationship(back_populates="inventory")


class ClosingLog(Base):
    __tablename__ = "closing_logs"

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    date: Mapped[str] = mapped_column(Text, nullable=False)
    sales_entered: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    purchases_entered: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    expenses_entered: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    cash_verified: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    actual_cash: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    system_cash: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    discrepancies: Mapped[str | None] = mapped_column(Text)
    closed_at: Mapped[str | None] = mapped_column(Text)
    closed_by: Mapped[str | None] = mapped_column(Text)
    shop_id: Mapped[str | None] = mapped_column(Text)

    user: Mapped["User"] = relationship(back_populates="closing_logs")


class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    type: Mapped[str] = mapped_column(Text, nullable=False)
    text: Mapped[str] = mapped_column(Text, nullable=False)
    severity: Mapped[str] = mapped_column(Text, nullable=False)
    date: Mapped[str] = mapped_column(Text, nullable=False)
    read: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    user: Mapped["User"] = relationship(back_populates="notifications")


class Category(Base):
    __tablename__ = "categories"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(Text, nullable=False)

    user: Mapped["User"] = relationship(back_populates="categories")


class Shop(Base):
    __tablename__ = "shops"

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    location: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(Text, nullable=False, default="Active")

    user: Mapped["User"] = relationship(back_populates="shops")
