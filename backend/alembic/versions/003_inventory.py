"""Add inventory tables.

Revision ID: 003
Revises: 002
Create Date: 2026-01-20
"""
from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "003"
down_revision: str | None = "002"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # Create inventory_lots table
    op.create_table(
        "inventory_lots",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "household_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("households.id"),
            nullable=False,
        ),
        sa.Column(
            "ingredient_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("ingredients.id"),
            nullable=False,
        ),
        sa.Column("quantity", sa.Numeric(10, 3), nullable=False),
        sa.Column("unit", sa.Text, nullable=False),
        sa.Column("location", sa.Text, server_default="pantry"),
        sa.Column("purchase_date", sa.DateTime, nullable=False),
        sa.Column("expiry_date", sa.DateTime, nullable=True),
        sa.Column("unit_cost", sa.Numeric(10, 2), nullable=False),
        sa.Column("total_cost", sa.Numeric(10, 2), nullable=False),
        sa.Column("currency", sa.Text, server_default="NOK"),
        sa.Column("confidence", sa.Numeric(3, 2), server_default="1.0"),
        sa.Column("source_type", sa.Text, nullable=False),
        sa.Column("source_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column(
            "created_at", sa.DateTime, server_default=sa.func.now(), nullable=False
        ),
        sa.Column(
            "updated_at", sa.DateTime, server_default=sa.func.now(), nullable=False
        ),
    )

    # Create inventory_events table
    op.create_table(
        "inventory_events",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "lot_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("inventory_lots.id"),
            nullable=False,
        ),
        sa.Column("event_type", sa.Text, nullable=False),
        sa.Column("quantity_delta", sa.Numeric(10, 3), nullable=False),
        sa.Column("unit", sa.Text, nullable=False),
        sa.Column("reason", sa.Text, nullable=True),
        sa.Column(
            "created_by",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id"),
            nullable=True,
        ),
        sa.Column(
            "created_at", sa.DateTime, server_default=sa.func.now(), nullable=False
        ),
    )

    # Create indexes for inventory_lots
    op.create_index("idx_inventory_lots_household", "inventory_lots", ["household_id"])
    op.create_index("idx_inventory_lots_ingredient", "inventory_lots", ["ingredient_id"])
    op.create_index("idx_inventory_lots_location", "inventory_lots", ["location"])
    op.create_index(
        "idx_inventory_lots_purchase_date", "inventory_lots", ["purchase_date"]
    )

    # Create indexes for inventory_events
    op.create_index("idx_inventory_events_lot", "inventory_events", ["lot_id"])
    op.create_index("idx_inventory_events_type", "inventory_events", ["event_type"])
    op.create_index("idx_inventory_events_created", "inventory_events", ["created_at"])

    # Add foreign key constraint for items.inventory_lot_id (deferred from migration 002)
    op.create_foreign_key(
        "fk_items_inventory_lot_id",
        "items",
        "inventory_lots",
        ["inventory_lot_id"],
        ["id"],
    )


def downgrade() -> None:
    # Drop the foreign key constraint first
    op.drop_constraint("fk_items_inventory_lot_id", "items", type_="foreignkey")
    op.drop_index("idx_inventory_events_created", "inventory_events")
    op.drop_index("idx_inventory_events_type", "inventory_events")
    op.drop_index("idx_inventory_events_lot", "inventory_events")
    op.drop_index("idx_inventory_lots_purchase_date", "inventory_lots")
    op.drop_index("idx_inventory_lots_location", "inventory_lots")
    op.drop_index("idx_inventory_lots_ingredient", "inventory_lots")
    op.drop_index("idx_inventory_lots_household", "inventory_lots")
    op.drop_table("inventory_events")
    op.drop_table("inventory_lots")
