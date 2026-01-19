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

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=func.now(), nullable=False
    )

    users: Mapped[list["User"]] = relationship("User", back_populates="household")
    receipts: Mapped[list["Receipt"]] = relationship("Receipt", back_populates="household")


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    email: Mapped[str] = mapped_column(Text, nullable=False, unique=True)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    household_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("households.id"), nullable=False
    )
    role: Mapped[str] = mapped_column(Text, default="member")  # "owner" | "member"
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=func.now(), nullable=False
    )

    household: Mapped["Household"] = relationship("Household", back_populates="users")

    __table_args__ = (Index("idx_users_household", "household_id"),)


class Ingredient(Base):
    __tablename__ = "ingredients"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(Text, nullable=False)
    canonical_name: Mapped[str] = mapped_column(Text, nullable=False, unique=True)
    default_unit: Mapped[str] = mapped_column(Text, default="g")  # g, ml, pcs
    aliases: Mapped[list[str]] = mapped_column(JSONB, default=list)
    category_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("categories.id"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=func.now(), nullable=False
    )

    category: Mapped["Category | None"] = relationship("Category")

    __table_args__ = (
        Index("idx_ingredients_canonical", canonical_name),
        Index("idx_ingredients_category", category_id),
    )


class Category(Base):
    __tablename__ = "categories"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(Text, nullable=False, unique=True)
    icon: Mapped[str | None] = mapped_column(Text, nullable=True)
    color: Mapped[str | None] = mapped_column(Text, nullable=True)

    items: Mapped[list["Item"]] = relationship("Item", back_populates="category")


class Receipt(Base):
    __tablename__ = "receipts"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    household_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("households.id"), nullable=True
    )
    inventory_status: Mapped[str] = mapped_column(Text, default="pending")  # "pending" | "reviewed" | "skipped"
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
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=func.now(), nullable=False
    )
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

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
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
        UUID(as_uuid=True), nullable=True
    )  # FK added later when InventoryLot exists
    skip_inventory: Mapped[bool] = mapped_column(Boolean, default=False)

    receipt: Mapped["Receipt"] = relationship("Receipt", back_populates="items")
    category: Mapped["Category | None"] = relationship("Category", back_populates="items")
    ingredient: Mapped["Ingredient | None"] = relationship("Ingredient")

    __table_args__ = (
        Index("idx_items_receipt", receipt_id),
        Index("idx_items_category", category_id),
        Index("idx_items_ingredient", ingredient_id),
    )
