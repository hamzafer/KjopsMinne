"""Add shopping list tables.

Revision ID: 006
Revises: 005
Create Date: 2026-01-20
"""
from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "006"
down_revision: str | None = "005"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # Create shopping_lists table
    op.create_table(
        "shopping_lists",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "household_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("households.id"),
            nullable=False,
        ),
        sa.Column("name", sa.Text, nullable=False),
        sa.Column("date_range_start", sa.DateTime, nullable=False),
        sa.Column("date_range_end", sa.DateTime, nullable=False),
        sa.Column("status", sa.Text, server_default="active"),
        sa.Column(
            "created_at", sa.DateTime, server_default=sa.func.now(), nullable=False
        ),
        sa.Column(
            "updated_at", sa.DateTime, server_default=sa.func.now(), nullable=False
        ),
    )

    # Create shopping_list_items table
    op.create_table(
        "shopping_list_items",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "shopping_list_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("shopping_lists.id"),
            nullable=False,
        ),
        sa.Column(
            "ingredient_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("ingredients.id"),
            nullable=False,
        ),
        sa.Column("required_quantity", sa.Numeric(10, 3), nullable=False),
        sa.Column("required_unit", sa.Text, nullable=False),
        sa.Column("on_hand_quantity", sa.Numeric(10, 3), server_default="0"),
        sa.Column("to_buy_quantity", sa.Numeric(10, 3), nullable=False),
        sa.Column("is_checked", sa.Boolean, server_default="false"),
        sa.Column("actual_quantity", sa.Numeric(10, 3), nullable=True),
        sa.Column("notes", sa.Text, nullable=True),
        sa.Column(
            "source_meal_plans",
            postgresql.ARRAY(postgresql.UUID(as_uuid=True)),
            server_default="{}",
        ),
    )

    # Create indexes for shopping_lists
    op.create_index("idx_shopping_lists_household", "shopping_lists", ["household_id"])
    op.create_index("idx_shopping_lists_status", "shopping_lists", ["status"])
    op.create_index(
        "idx_shopping_lists_date_range",
        "shopping_lists",
        ["date_range_start", "date_range_end"],
    )

    # Create indexes for shopping_list_items
    op.create_index(
        "idx_shopping_list_items_list", "shopping_list_items", ["shopping_list_id"]
    )
    op.create_index(
        "idx_shopping_list_items_ingredient", "shopping_list_items", ["ingredient_id"]
    )
    op.create_index(
        "idx_shopping_list_items_checked", "shopping_list_items", ["is_checked"]
    )


def downgrade() -> None:
    op.drop_index("idx_shopping_list_items_checked", "shopping_list_items")
    op.drop_index("idx_shopping_list_items_ingredient", "shopping_list_items")
    op.drop_index("idx_shopping_list_items_list", "shopping_list_items")
    op.drop_index("idx_shopping_lists_date_range", "shopping_lists")
    op.drop_index("idx_shopping_lists_status", "shopping_lists")
    op.drop_index("idx_shopping_lists_household", "shopping_lists")
    op.drop_table("shopping_list_items")
    op.drop_table("shopping_lists")
