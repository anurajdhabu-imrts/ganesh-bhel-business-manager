"""initial schema

Revision ID: 0001
Revises:
Create Date: 2026-06-17

Creates the full Ganesh Bhel Business Manager schema: users plus all
user-scoped business tables.
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _user_fk() -> sa.Column:
    return sa.Column(
        "user_id",
        sa.Integer(),
        sa.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("uid", sa.Text(), nullable=False, unique=True),
        sa.Column("email", sa.Text(), nullable=False),
        sa.Column("user_role", sa.Text(), nullable=False, server_default="owner"),
        sa.Column("language", sa.Text(), nullable=False, server_default="en"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    op.create_table(
        "sales",
        sa.Column("id", sa.Text(), primary_key=True),
        _user_fk(),
        sa.Column("date", sa.Text(), nullable=False),
        sa.Column("total_sales", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("cash_collection", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("upi_collection", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("card_collection", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("swiggy_collection", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("zomato_collection", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("other_collection", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("remarks", sa.Text(), nullable=True),
        sa.Column("shop_id", sa.Text(), nullable=True),
    )

    op.create_table(
        "products",
        sa.Column("id", sa.Text(), primary_key=True),
        _user_fk(),
        sa.Column("name", sa.Text(), nullable=False),
        sa.Column("category", sa.Text(), nullable=False),
        sa.Column("selling_price", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("status", sa.Text(), nullable=False, server_default="Active"),
        sa.Column("shop_id", sa.Text(), nullable=True),
        sa.Column("recipe_json", sa.Text(), nullable=True),
    )

    op.create_table(
        "purchases",
        sa.Column("id", sa.Text(), primary_key=True),
        _user_fk(),
        sa.Column("date", sa.Text(), nullable=False),
        sa.Column("purchase_type", sa.Text(), nullable=False),
        sa.Column("vendor_name", sa.Text(), nullable=False),
        sa.Column("item_name", sa.Text(), nullable=False),
        sa.Column("category", sa.Text(), nullable=False),
        sa.Column("quantity", sa.Float(), nullable=False, server_default="0"),
        sa.Column("unit", sa.Text(), nullable=False),
        sa.Column("rate", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("amount", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("payment_mode", sa.Text(), nullable=False),
        sa.Column("invoice_number", sa.Text(), nullable=True),
        sa.Column("remarks", sa.Text(), nullable=True),
        sa.Column("is_custom_voice_entry", sa.Boolean(), server_default=sa.false()),
        sa.Column("shop_id", sa.Text(), nullable=True),
    )

    op.create_table(
        "staff",
        sa.Column("id", sa.Text(), primary_key=True),
        _user_fk(),
        sa.Column("name", sa.Text(), nullable=False),
        sa.Column("mobile", sa.Text(), nullable=False),
        sa.Column("address", sa.Text(), nullable=False),
        sa.Column("joining_date", sa.Text(), nullable=False),
        sa.Column("salary", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("designation", sa.Text(), nullable=False),
        sa.Column("emergency_contact", sa.Text(), nullable=False),
        sa.Column("status", sa.Text(), nullable=False, server_default="Active"),
        sa.Column("shop_id", sa.Text(), nullable=True),
    )

    op.create_table(
        "advances",
        sa.Column("id", sa.Text(), primary_key=True),
        _user_fk(),
        sa.Column("date", sa.Text(), nullable=False),
        sa.Column("staff_id", sa.Text(), nullable=False),
        sa.Column("staff_name", sa.Text(), nullable=False),
        sa.Column("amount", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("reason", sa.Text(), nullable=False),
        sa.Column("given_by", sa.Text(), nullable=False),
        sa.Column("recovered_amount", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("remarks", sa.Text(), nullable=True),
        sa.Column("shop_id", sa.Text(), nullable=True),
    )

    op.create_table(
        "welfare_expenses",
        sa.Column("id", sa.Text(), primary_key=True),
        _user_fk(),
        sa.Column("date", sa.Text(), nullable=False),
        sa.Column("staff_id", sa.Text(), nullable=True),
        sa.Column("staff_name", sa.Text(), nullable=True),
        sa.Column("category", sa.Text(), nullable=False),
        sa.Column("amount", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("shop_id", sa.Text(), nullable=True),
    )

    op.create_table(
        "salaries",
        sa.Column("id", sa.Text(), primary_key=True),
        _user_fk(),
        sa.Column("staff_id", sa.Text(), nullable=False),
        sa.Column("staff_name", sa.Text(), nullable=False),
        sa.Column("month_year", sa.Text(), nullable=False),
        sa.Column("base_salary", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("advance_recovery", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("other_deductions", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("net_payable", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("payment_date", sa.Text(), nullable=False),
        sa.Column("payment_mode", sa.Text(), nullable=False),
        sa.Column("remarks", sa.Text(), nullable=True),
        sa.Column("shop_id", sa.Text(), nullable=True),
    )

    op.create_table(
        "inventory",
        sa.Column("id", sa.Text(), primary_key=True),
        _user_fk(),
        sa.Column("name", sa.Text(), nullable=False),
        sa.Column("opening_stock", sa.Float(), nullable=False, server_default="0"),
        sa.Column("purchased_stock", sa.Float(), nullable=False, server_default="0"),
        sa.Column("consumed_stock", sa.Float(), nullable=False, server_default="0"),
        sa.Column("closing_stock", sa.Float(), nullable=False, server_default="0"),
        sa.Column("unit", sa.Text(), nullable=False),
        sa.Column("low_stock_threshold", sa.Float(), nullable=False, server_default="0"),
        sa.Column("shop_id", sa.Text(), nullable=True),
        sa.Column("cost_per_unit", sa.Float(), nullable=True, server_default="0"),
    )

    op.create_table(
        "closing_logs",
        sa.Column("id", sa.Text(), primary_key=True),
        _user_fk(),
        sa.Column("date", sa.Text(), nullable=False),
        sa.Column("sales_entered", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("purchases_entered", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("expenses_entered", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("cash_verified", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("actual_cash", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("system_cash", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("discrepancies", sa.Text(), nullable=True),
        sa.Column("closed_at", sa.Text(), nullable=True),
        sa.Column("closed_by", sa.Text(), nullable=True),
        sa.Column("shop_id", sa.Text(), nullable=True),
    )

    op.create_table(
        "notifications",
        sa.Column("id", sa.Text(), primary_key=True),
        _user_fk(),
        sa.Column("type", sa.Text(), nullable=False),
        sa.Column("text", sa.Text(), nullable=False),
        sa.Column("severity", sa.Text(), nullable=False),
        sa.Column("date", sa.Text(), nullable=False),
        sa.Column("read", sa.Boolean(), nullable=False, server_default=sa.false()),
    )

    op.create_table(
        "categories",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        _user_fk(),
        sa.Column("name", sa.Text(), nullable=False),
    )

    op.create_table(
        "shops",
        sa.Column("id", sa.Text(), primary_key=True),
        _user_fk(),
        sa.Column("name", sa.Text(), nullable=False),
        sa.Column("location", sa.Text(), nullable=True),
        sa.Column("status", sa.Text(), nullable=False, server_default="Active"),
    )


def downgrade() -> None:
    for table in (
        "shops", "categories", "notifications", "closing_logs", "inventory",
        "salaries", "welfare_expenses", "advances", "staff", "purchases",
        "products", "sales", "users",
    ):
        op.drop_table(table)
