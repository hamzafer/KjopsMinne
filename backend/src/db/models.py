import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import Boolean, DateTime, ForeignKey, Index, Numeric, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class Household(Base):
    __tablename__ = "households"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now(), nullable=False)

    users: Mapped[list["User"]] = relationship("User", back_populates="household")
    receipts: Mapped[list["Receipt"]] = relationship("Receipt", back_populates="household")


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(Text, nullable=False, unique=True)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    household_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("households.id"), nullable=False
    )
    role: Mapped[str] = mapped_column(Text, default="member")  # "owner" | "member"
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now(), nullable=False)

    household: Mapped["Household"] = relationship("Household", back_populates="users")

    __table_args__ = (Index("idx_users_household", "household_id"),)


class Ingredient(Base):
    __tablename__ = "ingredients"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    canonical_name: Mapped[str] = mapped_column(Text, nullable=False, unique=True)
    default_unit: Mapped[str] = mapped_column(Text, default="g")  # g, ml, pcs
    aliases: Mapped[list[str]] = mapped_column(JSONB, default=list)
    category_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("categories.id"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now(), nullable=False)

    category: Mapped["Category | None"] = relationship("Category")

    __table_args__ = (
        Index("idx_ingredients_canonical", canonical_name),
        Index("idx_ingredients_category", category_id),
    )


class UnitConversion(Base):
    __tablename__ = "unit_conversions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    from_unit: Mapped[str] = mapped_column(Text, nullable=False)
    to_unit: Mapped[str] = mapped_column(Text, nullable=False)
    factor: Mapped[Decimal] = mapped_column(Numeric(10, 6), nullable=False)
    ingredient_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("ingredients.id"), nullable=True
    )  # NULL = generic conversion, not ingredient-specific

    __table_args__ = (
        Index("idx_unit_conversions_from", from_unit),
        Index("idx_unit_conversions_ingredient", ingredient_id),
    )


class InventoryLot(Base):
    __tablename__ = "inventory_lots"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    household_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("households.id"), nullable=False
    )
    ingredient_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("ingredients.id"), nullable=False
    )
    quantity: Mapped[Decimal] = mapped_column(Numeric(10, 3), nullable=False)
    unit: Mapped[str] = mapped_column(Text, nullable=False)  # canonical: g, ml, pcs
    location: Mapped[str] = mapped_column(Text, default="pantry")  # pantry|fridge|freezer
    purchase_date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    expiry_date: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    unit_cost: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    total_cost: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    currency: Mapped[str] = mapped_column(Text, default="NOK")
    confidence: Mapped[Decimal] = mapped_column(Numeric(3, 2), default=Decimal("1.0"))
    source_type: Mapped[str] = mapped_column(Text, nullable=False)  # receipt|manual|barcode
    source_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=func.now(), onupdate=func.now(), nullable=False
    )

    household: Mapped["Household"] = relationship("Household")
    ingredient: Mapped["Ingredient"] = relationship("Ingredient")
    events: Mapped[list["InventoryEvent"]] = relationship("InventoryEvent", back_populates="lot")

    __table_args__ = (
        Index("idx_inventory_lots_household", "household_id"),
        Index("idx_inventory_lots_ingredient", "ingredient_id"),
        Index("idx_inventory_lots_location", "location"),
        Index("idx_inventory_lots_purchase_date", "purchase_date"),
    )


class InventoryEvent(Base):
    __tablename__ = "inventory_events"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    lot_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("inventory_lots.id"), nullable=False
    )
    event_type: Mapped[str] = mapped_column(
        Text, nullable=False
    )  # add|consume|adjust|discard|transfer
    quantity_delta: Mapped[Decimal] = mapped_column(Numeric(10, 3), nullable=False)
    unit: Mapped[str] = mapped_column(Text, nullable=False)
    reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now(), nullable=False)

    lot: Mapped["InventoryLot"] = relationship("InventoryLot", back_populates="events")
    user: Mapped["User | None"] = relationship("User")

    __table_args__ = (
        Index("idx_inventory_events_lot", "lot_id"),
        Index("idx_inventory_events_type", "event_type"),
        Index("idx_inventory_events_created", "created_at"),
    )


class Recipe(Base):
    __tablename__ = "recipes"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    household_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("households.id"), nullable=False
    )
    name: Mapped[str] = mapped_column(Text, nullable=False)
    source_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    servings: Mapped[int] = mapped_column(default=2)
    prep_time_minutes: Mapped[int | None] = mapped_column(nullable=True)
    cook_time_minutes: Mapped[int | None] = mapped_column(nullable=True)
    instructions: Mapped[str] = mapped_column(Text, nullable=False)
    tags: Mapped[list[str]] = mapped_column(JSONB, default=list)
    image_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    import_confidence: Mapped[Decimal | None] = mapped_column(Numeric(3, 2), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=func.now(), onupdate=func.now(), nullable=False
    )

    household: Mapped["Household"] = relationship("Household")
    ingredients: Mapped[list["RecipeIngredient"]] = relationship(
        "RecipeIngredient", back_populates="recipe", cascade="all, delete-orphan"
    )

    __table_args__ = (
        Index("idx_recipes_household", "household_id"),
        Index("idx_recipes_name", "name"),
    )


class RecipeIngredient(Base):
    __tablename__ = "recipe_ingredients"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    recipe_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("recipes.id", ondelete="CASCADE"), nullable=False
    )
    ingredient_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("ingredients.id"), nullable=True
    )
    raw_text: Mapped[str] = mapped_column(Text, nullable=False)  # Original text from recipe
    quantity: Mapped[Decimal | None] = mapped_column(Numeric(10, 3), nullable=True)
    unit: Mapped[str | None] = mapped_column(Text, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)  # e.g., "finely chopped"

    recipe: Mapped["Recipe"] = relationship("Recipe", back_populates="ingredients")
    ingredient: Mapped["Ingredient | None"] = relationship("Ingredient")

    __table_args__ = (
        Index("idx_recipe_ingredients_recipe", "recipe_id"),
        Index("idx_recipe_ingredients_ingredient", "ingredient_id"),
    )


class MealPlan(Base):
    __tablename__ = "meal_plans"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    household_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("households.id"), nullable=False
    )
    recipe_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("recipes.id"), nullable=False
    )
    planned_date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    meal_type: Mapped[str] = mapped_column(Text, nullable=False)  # breakfast|lunch|dinner|snack
    servings: Mapped[int] = mapped_column(default=2)
    status: Mapped[str] = mapped_column(Text, default="planned")  # planned|cooked|skipped
    is_leftover_source: Mapped[bool] = mapped_column(Boolean, default=False)
    leftover_from_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("meal_plans.id"), nullable=True
    )
    cooked_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    actual_cost: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)
    cost_per_serving: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=func.now(), onupdate=func.now(), nullable=False
    )

    household: Mapped["Household"] = relationship("Household")
    recipe: Mapped["Recipe"] = relationship("Recipe")
    leftover_from: Mapped["MealPlan | None"] = relationship(
        "MealPlan", remote_side=[id], foreign_keys=[leftover_from_id]
    )

    __table_args__ = (
        Index("idx_meal_plans_household", "household_id"),
        Index("idx_meal_plans_date", "planned_date"),
        Index("idx_meal_plans_recipe", "recipe_id"),
    )


class Leftover(Base):
    __tablename__ = "leftovers"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    household_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("households.id"), nullable=False
    )
    meal_plan_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("meal_plans.id"), nullable=False
    )
    recipe_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("recipes.id"), nullable=False
    )
    remaining_servings: Mapped[int] = mapped_column(nullable=False)
    status: Mapped[str] = mapped_column(Text, default="available")  # available|consumed|discarded
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now(), nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)

    household: Mapped["Household"] = relationship("Household")
    meal_plan: Mapped["MealPlan"] = relationship("MealPlan")
    recipe: Mapped["Recipe"] = relationship("Recipe")

    __table_args__ = (
        Index("idx_leftovers_household", "household_id"),
        Index("idx_leftovers_status", "status"),
        Index("idx_leftovers_expires", "expires_at"),
    )


class ShoppingList(Base):
    __tablename__ = "shopping_lists"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    household_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("households.id"), nullable=False
    )
    name: Mapped[str] = mapped_column(Text, nullable=False)
    date_range_start: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    date_range_end: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    status: Mapped[str] = mapped_column(Text, default="active")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=func.now(), onupdate=func.now(), nullable=False
    )

    household: Mapped["Household"] = relationship("Household")
    items: Mapped[list["ShoppingListItem"]] = relationship(  # noqa: F821
        "ShoppingListItem", back_populates="shopping_list", cascade="all, delete-orphan"
    )

    __table_args__ = (
        Index("idx_shopping_lists_household", "household_id"),
        Index("idx_shopping_lists_status", "status"),
        Index("idx_shopping_lists_date_range", "date_range_start", "date_range_end"),
    )


class Category(Base):
    __tablename__ = "categories"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(Text, nullable=False, unique=True)
    icon: Mapped[str | None] = mapped_column(Text, nullable=True)
    color: Mapped[str | None] = mapped_column(Text, nullable=True)

    items: Mapped[list["Item"]] = relationship("Item", back_populates="category")


class Receipt(Base):
    __tablename__ = "receipts"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    household_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("households.id"), nullable=True
    )
    # Status: "pending" | "reviewed" | "skipped"
    inventory_status: Mapped[str] = mapped_column(Text, default="pending")
    merchant_name: Mapped[str] = mapped_column(Text, nullable=False)
    store_location: Mapped[str | None] = mapped_column(Text, nullable=True)
    purchase_date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    total_amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    currency: Mapped[str] = mapped_column(Text, default="NOK")
    payment_method: Mapped[str | None] = mapped_column(Text, nullable=True)
    warranty_months: Mapped[int | None] = mapped_column(nullable=True)
    return_window_days: Mapped[int | None] = mapped_column(nullable=True)
    image_path: Mapped[str | None] = mapped_column(Text, nullable=True)
    raw_ocr: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=func.now(), onupdate=func.now(), nullable=False
    )

    items: Mapped[list["Item"]] = relationship(
        "Item", back_populates="receipt", cascade="all, delete-orphan"
    )
    household: Mapped["Household | None"] = relationship("Household", back_populates="receipts")

    __table_args__ = (Index("idx_receipts_date", purchase_date.desc()),)


class Item(Base):
    __tablename__ = "items"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    receipt_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("receipts.id", ondelete="CASCADE"), nullable=False
    )
    raw_name: Mapped[str] = mapped_column(Text, nullable=False)
    canonical_name: Mapped[str | None] = mapped_column(Text, nullable=True)
    quantity: Mapped[Decimal | None] = mapped_column(Numeric(10, 3), nullable=True)
    unit: Mapped[str | None] = mapped_column(Text, nullable=True)
    unit_price: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)
    total_price: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    category_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("categories.id"), nullable=True
    )
    is_pant: Mapped[bool] = mapped_column(Boolean, default=False)
    discount_amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=Decimal("0"))
    ingredient_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("ingredients.id"), nullable=True
    )
    ingredient_confidence: Mapped[Decimal | None] = mapped_column(
        Numeric(3, 2), nullable=True
    )  # 0.00 to 1.00
    inventory_lot_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("inventory_lots.id"), nullable=True
    )
    skip_inventory: Mapped[bool] = mapped_column(Boolean, default=False)

    receipt: Mapped["Receipt"] = relationship("Receipt", back_populates="items")
    category: Mapped["Category | None"] = relationship("Category", back_populates="items")
    ingredient: Mapped["Ingredient | None"] = relationship("Ingredient")

    __table_args__ = (
        Index("idx_items_receipt", receipt_id),
        Index("idx_items_category", category_id),
        Index("idx_items_ingredient", ingredient_id),
    )
