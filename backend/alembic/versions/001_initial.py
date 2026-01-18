"""Initial migration

Revision ID: 001
Revises:
Create Date: 2025-01-18

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Categories table
    op.create_table(
        "categories",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.Text(), nullable=False, unique=True),
        sa.Column("icon", sa.Text(), nullable=True),
        sa.Column("color", sa.Text(), nullable=True),
    )

    # Receipts table
    op.create_table(
        "receipts",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("merchant_name", sa.Text(), nullable=False),
        sa.Column("store_location", sa.Text(), nullable=True),
        sa.Column("purchase_date", sa.DateTime(), nullable=False),
        sa.Column("total_amount", sa.Numeric(10, 2), nullable=False),
        sa.Column("currency", sa.Text(), server_default="NOK"),
        sa.Column("payment_method", sa.Text(), nullable=True),
        sa.Column("warranty_months", sa.Integer(), nullable=True),
        sa.Column("return_window_days", sa.Integer(), nullable=True),
        sa.Column("image_path", sa.Text(), nullable=True),
        sa.Column("raw_ocr", postgresql.JSONB(), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now()),
    )
    op.create_index("idx_receipts_date", "receipts", [sa.text("purchase_date DESC")])

    # Items table
    op.create_table(
        "items",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "receipt_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("receipts.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("raw_name", sa.Text(), nullable=False),
        sa.Column("canonical_name", sa.Text(), nullable=True),
        sa.Column("quantity", sa.Numeric(10, 3), nullable=True),
        sa.Column("unit", sa.Text(), nullable=True),
        sa.Column("unit_price", sa.Numeric(10, 2), nullable=True),
        sa.Column("total_price", sa.Numeric(10, 2), nullable=False),
        sa.Column(
            "category_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("categories.id"),
            nullable=True,
        ),
        sa.Column("is_pant", sa.Boolean(), server_default="false"),
        sa.Column("discount_amount", sa.Numeric(10, 2), server_default="0"),
    )
    op.create_index("idx_items_receipt", "items", ["receipt_id"])
    op.create_index("idx_items_category", "items", ["category_id"])


def downgrade() -> None:
    op.drop_index("idx_items_category")
    op.drop_index("idx_items_receipt")
    op.drop_table("items")
    op.drop_index("idx_receipts_date")
    op.drop_table("receipts")
    op.drop_table("categories")
