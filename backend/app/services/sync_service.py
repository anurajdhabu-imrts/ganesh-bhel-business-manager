"""Load/save the full SystemData blob to PostgreSQL via SQLAlchemy.

The frontend works with one snapshot of operational state. On save we replace
the user's rows per table (delete + bulk insert) inside a single transaction,
matching the original sync semantics but with the ORM and proper transactions.
"""
from __future__ import annotations

from typing import Any, Dict

from sqlalchemy import select
from sqlalchemy.orm import Session

from app import models


def get_or_create_user(db: Session, uid: str, email: str) -> models.User:
    user = db.scalar(select(models.User).where(models.User.uid == uid))
    if user:
        return user
    user = models.User(uid=uid, email=email, language="en", user_role="owner")
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def load_system_data(db: Session, user: models.User) -> Dict[str, Any]:
    def rows(model):
        return db.scalars(select(model).where(model.user_id == user.id)).all()

    return {
        "language": user.language or "en",
        "userRole": user.user_role or "owner",
        "sales": [
            {
                "id": s.id, "date": s.date, "totalSales": s.total_sales,
                "cashCollection": s.cash_collection, "upiCollection": s.upi_collection,
                "cardCollection": s.card_collection, "swiggyCollection": s.swiggy_collection,
                "zomatoCollection": s.zomato_collection, "otherCollection": s.other_collection,
                "remarks": s.remarks, "shopId": s.shop_id,
            }
            for s in rows(models.Sale)
        ],
        "products": [
            {
                "id": p.id, "name": p.name, "category": p.category,
                "sellingPrice": p.selling_price, "status": p.status,
                "shopId": p.shop_id, "recipeJson": p.recipe_json,
            }
            for p in rows(models.Product)
        ],
        "purchases": [
            {
                "id": p.id, "date": p.date, "purchaseType": p.purchase_type,
                "vendorName": p.vendor_name, "itemName": p.item_name, "category": p.category,
                "quantity": p.quantity, "unit": p.unit, "rate": p.rate, "amount": p.amount,
                "paymentMode": p.payment_mode, "invoiceNumber": p.invoice_number,
                "remarks": p.remarks, "isCustomVoiceEntry": p.is_custom_voice_entry,
                "shopId": p.shop_id,
            }
            for p in rows(models.Purchase)
        ],
        "staff": [
            {
                "id": s.id, "name": s.name, "mobile": s.mobile, "address": s.address,
                "joiningDate": s.joining_date, "salary": s.salary, "designation": s.designation,
                "emergencyContact": s.emergency_contact, "status": s.status, "shopId": s.shop_id,
            }
            for s in rows(models.Staff)
        ],
        "advances": [
            {
                "id": a.id, "date": a.date, "staffId": a.staff_id, "staffName": a.staff_name,
                "amount": a.amount, "reason": a.reason, "givenBy": a.given_by,
                "recoveredAmount": a.recovered_amount, "remarks": a.remarks, "shopId": a.shop_id,
            }
            for a in rows(models.Advance)
        ],
        "welfareExpenses": [
            {
                "id": w.id, "date": w.date, "staffId": w.staff_id, "staffName": w.staff_name,
                "category": w.category, "amount": w.amount, "notes": w.notes, "shopId": w.shop_id,
            }
            for w in rows(models.WelfareExpense)
        ],
        "salaries": [
            {
                "id": s.id, "staffId": s.staff_id, "staffName": s.staff_name,
                "monthYear": s.month_year, "baseSalary": s.base_salary,
                "advanceRecovery": s.advance_recovery, "otherDeductions": s.other_deductions,
                "netPayable": s.net_payable, "paymentDate": s.payment_date,
                "paymentMode": s.payment_mode, "remarks": s.remarks, "shopId": s.shop_id,
            }
            for s in rows(models.Salary)
        ],
        "inventory": [
            {
                "id": i.id, "name": i.name, "openingStock": i.opening_stock,
                "purchasedStock": i.purchased_stock, "consumedStock": i.consumed_stock,
                "closingStock": i.closing_stock, "unit": i.unit,
                "lowStockThreshold": i.low_stock_threshold, "shopId": i.shop_id,
                "costPerUnit": i.cost_per_unit,
            }
            for i in rows(models.Inventory)
        ],
        "closingLogs": [
            {
                "date": c.date, "salesEntered": c.sales_entered,
                "purchasesEntered": c.purchases_entered, "expensesEntered": c.expenses_entered,
                "cashVerified": c.cash_verified, "actualCash": c.actual_cash,
                "systemCash": c.system_cash, "discrepancies": c.discrepancies,
                "closedAt": c.closed_at, "closedBy": c.closed_by, "shopId": c.shop_id,
            }
            for c in rows(models.ClosingLog)
        ],
        "notifications": [
            {
                "id": n.id, "type": n.type, "text": n.text,
                "severity": n.severity, "date": n.date, "read": n.read,
            }
            for n in rows(models.Notification)
        ],
        "categories": [c.name for c in rows(models.Category)],
        "shops": [
            {"id": sh.id, "name": sh.name, "location": sh.location, "status": sh.status}
            for sh in rows(models.Shop)
        ],
    }


def save_system_data(db: Session, user: models.User, data: Dict[str, Any]) -> None:
    """Replace all of the user's records with the supplied snapshot, atomically."""
    uid = user.id

    # 1. user settings
    user.language = data.get("language", user.language)
    user.user_role = data.get("userRole", user.user_role)

    def replace(model, items):
        db.query(model).filter(model.user_id == uid).delete(synchronize_session=False)
        db.add_all(items)

    replace(models.Sale, [
        models.Sale(
            id=s.get("id"), user_id=uid, date=s.get("date"),
            total_sales=s.get("totalSales", 0) or 0,
            cash_collection=s.get("cashCollection", 0) or 0,
            upi_collection=s.get("upiCollection", 0) or 0,
            card_collection=s.get("cardCollection", 0) or 0,
            swiggy_collection=s.get("swiggyCollection", 0) or 0,
            zomato_collection=s.get("zomatoCollection", 0) or 0,
            other_collection=s.get("otherCollection", 0) or 0,
            remarks=s.get("remarks"), shop_id=s.get("shopId"),
        ) for s in data.get("sales", [])
    ])

    replace(models.Product, [
        models.Product(
            id=p.get("id"), user_id=uid, name=p.get("name"), category=p.get("category"),
            selling_price=p.get("sellingPrice", 0) or 0, status=p.get("status", "Active"),
            shop_id=p.get("shopId"), recipe_json=p.get("recipeJson"),
        ) for p in data.get("products", [])
    ])

    replace(models.Purchase, [
        models.Purchase(
            id=p.get("id"), user_id=uid, date=p.get("date"),
            purchase_type=p.get("purchaseType"), vendor_name=p.get("vendorName"),
            item_name=p.get("itemName"), category=p.get("category"),
            quantity=p.get("quantity", 0) or 0, unit=p.get("unit"),
            rate=p.get("rate", 0) or 0, amount=p.get("amount", 0) or 0,
            payment_mode=p.get("paymentMode"), invoice_number=p.get("invoiceNumber"),
            remarks=p.get("remarks"), is_custom_voice_entry=bool(p.get("isCustomVoiceEntry", False)),
            shop_id=p.get("shopId"),
        ) for p in data.get("purchases", [])
    ])

    replace(models.Staff, [
        models.Staff(
            id=s.get("id"), user_id=uid, name=s.get("name"), mobile=s.get("mobile"),
            address=s.get("address"), joining_date=s.get("joiningDate"),
            salary=s.get("salary", 0) or 0, designation=s.get("designation"),
            emergency_contact=s.get("emergencyContact"), status=s.get("status", "Active"),
            shop_id=s.get("shopId"),
        ) for s in data.get("staff", [])
    ])

    replace(models.Advance, [
        models.Advance(
            id=a.get("id"), user_id=uid, date=a.get("date"), staff_id=a.get("staffId"),
            staff_name=a.get("staffName"), amount=a.get("amount", 0) or 0, reason=a.get("reason"),
            given_by=a.get("givenBy"), recovered_amount=a.get("recoveredAmount", 0) or 0,
            remarks=a.get("remarks"), shop_id=a.get("shopId"),
        ) for a in data.get("advances", [])
    ])

    replace(models.WelfareExpense, [
        models.WelfareExpense(
            id=w.get("id"), user_id=uid, date=w.get("date"), staff_id=w.get("staffId"),
            staff_name=w.get("staffName"), category=w.get("category"),
            amount=w.get("amount", 0) or 0, notes=w.get("notes"), shop_id=w.get("shopId"),
        ) for w in data.get("welfareExpenses", [])
    ])

    replace(models.Salary, [
        models.Salary(
            id=s.get("id"), user_id=uid, staff_id=s.get("staffId"), staff_name=s.get("staffName"),
            month_year=s.get("monthYear"), base_salary=s.get("baseSalary", 0) or 0,
            advance_recovery=s.get("advanceRecovery", 0) or 0,
            other_deductions=s.get("otherDeductions", 0) or 0,
            net_payable=s.get("netPayable", 0) or 0, payment_date=s.get("paymentDate"),
            payment_mode=s.get("paymentMode"), remarks=s.get("remarks"), shop_id=s.get("shopId"),
        ) for s in data.get("salaries", [])
    ])

    replace(models.Inventory, [
        models.Inventory(
            id=i.get("id"), user_id=uid, name=i.get("name"),
            opening_stock=i.get("openingStock", 0) or 0,
            purchased_stock=i.get("purchasedStock", 0) or 0,
            consumed_stock=i.get("consumedStock", 0) or 0,
            closing_stock=i.get("closingStock", 0) or 0, unit=i.get("unit"),
            low_stock_threshold=i.get("lowStockThreshold", 0) or 0,
            shop_id=i.get("shopId"), cost_per_unit=i.get("costPerUnit", 0) or 0,
        ) for i in data.get("inventory", [])
    ])

    replace(models.ClosingLog, [
        models.ClosingLog(
            id=c.get("date"), user_id=uid, date=c.get("date"),
            sales_entered=bool(c.get("salesEntered", False)),
            purchases_entered=bool(c.get("purchasesEntered", False)),
            expenses_entered=bool(c.get("expensesEntered", False)),
            cash_verified=bool(c.get("cashVerified", False)),
            actual_cash=c.get("actualCash", 0) or 0, system_cash=c.get("systemCash", 0) or 0,
            discrepancies=c.get("discrepancies"), closed_at=c.get("closedAt"),
            closed_by=c.get("closedBy"), shop_id=c.get("shopId"),
        ) for c in data.get("closingLogs", [])
    ])

    replace(models.Notification, [
        models.Notification(
            id=n.get("id"), user_id=uid, type=n.get("type"), text=n.get("text"),
            severity=n.get("severity"), date=n.get("date"), read=bool(n.get("read", False)),
        ) for n in data.get("notifications", [])
    ])

    db.query(models.Category).filter(models.Category.user_id == uid).delete(synchronize_session=False)
    db.add_all([models.Category(user_id=uid, name=c) for c in data.get("categories", [])])

    replace(models.Shop, [
        models.Shop(
            id=sh.get("id"), user_id=uid, name=sh.get("name"),
            location=sh.get("location"), status=sh.get("status", "Active"),
        ) for sh in data.get("shops", [])
    ])

    db.commit()
