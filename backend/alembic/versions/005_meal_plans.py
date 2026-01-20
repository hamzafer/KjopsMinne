"""Add meal plans and leftovers tables.

Revision ID: 005
Revises: 004
Create Date: 2026-01-20
"""
from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "005"
down_revision: str | None = "004"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # Create meal_plans table
    op.create_table(
        "meal_plans",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "household_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("households.id"),
            nullable=False,
        ),
        sa.Column(
            "recipe_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("recipes.id"),
            nullable=False,
        ),
        sa.Column("planned_date", sa.DateTime, nullable=False),
        sa.Column("meal_type", sa.Text, nullable=False),
        sa.Column("servings", sa.Integer, server_default="2"),
        sa.Column("status", sa.Text, server_default="planned"),
        sa.Column("is_leftover_source", sa.Boolean, server_default="false"),
        sa.Column(
            "leftover_from_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("meal_plans.id"),
            nullable=True,
        ),
        sa.Column("cooked_at", sa.DateTime, nullable=True),
        sa.Column("actual_cost", sa.Numeric(10, 2), nullable=True),
        sa.Column("cost_per_serving", sa.Numeric(10, 2), nullable=True),
        sa.Column(
            "created_at", sa.DateTime, server_default=sa.func.now(), nullable=False
        ),
        sa.Column(
            "updated_at", sa.DateTime, server_default=sa.func.now(), nullable=False
        ),
    )

    # Create leftovers table
    op.create_table(
        "leftovers",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "household_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("households.id"),
            nullable=False,
        ),
        sa.Column(
            "meal_plan_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("meal_plans.id"),
            nullable=False,
        ),
        sa.Column(
            "recipe_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("recipes.id"),
            nullable=False,
        ),
        sa.Column("remaining_servings", sa.Integer, nullable=False),
        sa.Column("status", sa.Text, server_default="available"),
        sa.Column(
            "created_at", sa.DateTime, server_default=sa.func.now(), nullable=False
        ),
        sa.Column("expires_at", sa.DateTime, nullable=False),
    )

    # Create indexes for meal_plans
    op.create_index("idx_meal_plans_household", "meal_plans", ["household_id"])
    op.create_index("idx_meal_plans_date", "meal_plans", ["planned_date"])
    op.create_index("idx_meal_plans_recipe", "meal_plans", ["recipe_id"])

    # Create indexes for leftovers
    op.create_index("idx_leftovers_household", "leftovers", ["household_id"])
    op.create_index("idx_leftovers_status", "leftovers", ["status"])
    op.create_index("idx_leftovers_expires", "leftovers", ["expires_at"])


def downgrade() -> None:
    # Drop indexes for leftovers
    op.drop_index("idx_leftovers_expires", "leftovers")
    op.drop_index("idx_leftovers_status", "leftovers")
    op.drop_index("idx_leftovers_household", "leftovers")

    # Drop indexes for meal_plans
    op.drop_index("idx_meal_plans_recipe", "meal_plans")
    op.drop_index("idx_meal_plans_date", "meal_plans")
    op.drop_index("idx_meal_plans_household", "meal_plans")

    # Drop tables in correct order (child table first due to foreign key)
    op.drop_table("leftovers")
    op.drop_table("meal_plans")
