"""Add recipes tables.

Revision ID: 004
Revises: 003
Create Date: 2026-01-20
"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "004"
down_revision: str | None = "003"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # Create recipes table
    op.create_table(
        "recipes",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "household_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("households.id"),
            nullable=False,
        ),
        sa.Column("name", sa.Text, nullable=False),
        sa.Column("source_url", sa.Text, nullable=True),
        sa.Column("servings", sa.Integer, server_default="2"),
        sa.Column("prep_time_minutes", sa.Integer, nullable=True),
        sa.Column("cook_time_minutes", sa.Integer, nullable=True),
        sa.Column("instructions", sa.Text, nullable=False),
        sa.Column("tags", postgresql.JSONB, server_default="[]"),
        sa.Column("image_url", sa.Text, nullable=True),
        sa.Column("import_confidence", sa.Numeric(3, 2), nullable=True),
        sa.Column("created_at", sa.DateTime, server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime, server_default=sa.func.now(), nullable=False),
    )

    # Create recipe_ingredients table
    op.create_table(
        "recipe_ingredients",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "recipe_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("recipes.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "ingredient_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("ingredients.id"),
            nullable=True,
        ),
        sa.Column("raw_text", sa.Text, nullable=False),
        sa.Column("quantity", sa.Numeric(10, 3), nullable=True),
        sa.Column("unit", sa.Text, nullable=True),
        sa.Column("notes", sa.Text, nullable=True),
    )

    # Create indexes for recipes
    op.create_index("idx_recipes_household", "recipes", ["household_id"])
    op.create_index("idx_recipes_name", "recipes", ["name"])

    # Create indexes for recipe_ingredients
    op.create_index("idx_recipe_ingredients_recipe", "recipe_ingredients", ["recipe_id"])
    op.create_index("idx_recipe_ingredients_ingredient", "recipe_ingredients", ["ingredient_id"])


def downgrade() -> None:
    # Drop indexes for recipe_ingredients
    op.drop_index("idx_recipe_ingredients_ingredient", "recipe_ingredients")
    op.drop_index("idx_recipe_ingredients_recipe", "recipe_ingredients")

    # Drop indexes for recipes
    op.drop_index("idx_recipes_name", "recipes")
    op.drop_index("idx_recipes_household", "recipes")

    # Drop tables in correct order (child table first due to foreign key)
    op.drop_table("recipe_ingredients")
    op.drop_table("recipes")
