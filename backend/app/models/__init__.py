"""ORM models package.

Re-export every model so that `import app.models` registers them all on
`Base.metadata` for Alembic autogeneration.
"""
from app.models.entities import (  # noqa: F401
    Advance,
    Category,
    ClosingLog,
    Inventory,
    Notification,
    Product,
    Purchase,
    Salary,
    Sale,
    Shop,
    Staff,
    User,
    WelfareExpense,
)

__all__ = [
    "User",
    "Sale",
    "Product",
    "Purchase",
    "Staff",
    "Advance",
    "WelfareExpense",
    "Salary",
    "Inventory",
    "ClosingLog",
    "Notification",
    "Category",
    "Shop",
]
