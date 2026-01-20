"""Add household, user, ingredient, unit_conversion tables and extend receipt/item

Revision ID: 002
Revises: 001
Create Date: 2026-01-19

"""
from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "002"
down_revision: str | None = "001"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # Households table
    op.create_table(
        "households",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
    )

    # Users table
    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("email", sa.Text(), nullable=False, unique=True),
        sa.Column("name", sa.Text(), nullable=False),
        sa.Column(
            "household_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("households.id"),
            nullable=False,
        ),
        sa.Column("role", sa.Text(), server_default="member"),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
    )
    op.create_index("idx_users_household", "users", ["household_id"])

    # Ingredients table
    op.create_table(
        "ingredients",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.Text(), nullable=False),
        sa.Column("canonical_name", sa.Text(), nullable=False, unique=True),
        sa.Column("default_unit", sa.Text(), server_default="g"),
        sa.Column("aliases", postgresql.JSONB(), server_default="[]"),
        sa.Column(
            "category_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("categories.id"),
            nullable=True,
        ),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
    )
    op.create_index("idx_ingredients_canonical", "ingredients", ["canonical_name"])
    op.create_index("idx_ingredients_category", "ingredients", ["category_id"])

    # Unit conversions table
    op.create_table(
        "unit_conversions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("from_unit", sa.Text(), nullable=False),
        sa.Column("to_unit", sa.Text(), nullable=False),
        sa.Column("factor", sa.Numeric(10, 6), nullable=False),
        sa.Column(
            "ingredient_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("ingredients.id"),
            nullable=True,
        ),
    )
    op.create_index("idx_unit_conversions_from", "unit_conversions", ["from_unit"])
    op.create_index("idx_unit_conversions_ingredient", "unit_conversions", ["ingredient_id"])

    # Extend receipts table
    op.add_column(
        "receipts",
        sa.Column(
            "household_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("households.id"),
            nullable=True,
        ),
    )
    op.add_column(
        "receipts",
        sa.Column("inventory_status", sa.Text(), server_default="pending"),
    )
    op.create_index("idx_receipts_household", "receipts", ["household_id"])

    # Extend items table
    op.add_column(
        "items",
        sa.Column(
            "ingredient_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("ingredients.id"),
            nullable=True,
        ),
    )
    op.add_column(
        "items",
        sa.Column("ingredient_confidence", sa.Numeric(3, 2), nullable=True),
    )
    op.add_column(
        "items",
        sa.Column("inventory_lot_id", postgresql.UUID(as_uuid=True), nullable=True),
    )
    op.add_column(
        "items",
        sa.Column("skip_inventory", sa.Boolean(), server_default="false"),
    )
    op.create_index("idx_items_ingredient", "items", ["ingredient_id"])


def downgrade() -> None:
    # Remove item extensions
    op.drop_index("idx_items_ingredient")
    op.drop_column("items", "skip_inventory")
    op.drop_column("items", "inventory_lot_id")
    op.drop_column("items", "ingredient_confidence")
    op.drop_column("items", "ingredient_id")

    # Remove receipt extensions
    op.drop_index("idx_receipts_household")
    op.drop_column("receipts", "inventory_status")
    op.drop_column("receipts", "household_id")

    # Drop tables in reverse order
    op.drop_index("idx_unit_conversions_ingredient")
    op.drop_index("idx_unit_conversions_from")
    op.drop_table("unit_conversions")

    op.drop_index("idx_ingredients_category")
    op.drop_index("idx_ingredients_canonical")
    op.drop_table("ingredients")

    op.drop_index("idx_users_household")
    op.drop_table("users")

    op.drop_table("households")
