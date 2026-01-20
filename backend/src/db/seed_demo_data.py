"""Seed database with comprehensive demo data for testing and demos."""

import asyncio
import uuid
from datetime import datetime, timedelta
from decimal import Decimal

from sqlalchemy import delete, select

from src.db.engine import async_session_factory
from src.db.models import (
    Category,
    Household,
    Ingredient,
    InventoryEvent,
    InventoryLot,
    Item,
    Leftover,
    MealPlan,
    Receipt,
    Recipe,
    RecipeIngredient,
    ShoppingList,
    ShoppingListItem,
    User,
)

# Fixed UUIDs for demo data (allows idempotent seeding)
DEMO_HOUSEHOLD_ID = uuid.UUID("00000000-0000-0000-0000-000000000001")
DEMO_USER_OLA_ID = uuid.UUID("00000000-0000-0000-0000-000000000002")
DEMO_USER_KARI_ID = uuid.UUID("00000000-0000-0000-0000-000000000003")

# Norwegian store names with realistic locations
STORES = [
    ("REMA 1000", "Majorstuen"),
    ("KIWI", "Grünerløkka"),
    ("MENY", "Bogstadveien"),
    ("COOP EXTRA", "Storo"),
]


def days_ago(n: int) -> datetime:
    """Get datetime n days ago."""
    return datetime.now() - timedelta(days=n)


def days_from_now(n: int) -> datetime:
    """Get datetime n days from now."""
    return datetime.now() + timedelta(days=n)


async def clear_demo_data():
    """Remove all demo data (idempotent)."""
    async with async_session_factory() as session:
        # Delete in order respecting foreign keys
        # First, delete items that reference demo receipts
        await session.execute(
            delete(ShoppingListItem).where(
                ShoppingListItem.shopping_list_id.in_(
                    select(ShoppingList.id).where(ShoppingList.household_id == DEMO_HOUSEHOLD_ID)
                )
            )
        )
        await session.execute(
            delete(ShoppingList).where(ShoppingList.household_id == DEMO_HOUSEHOLD_ID)
        )
        await session.execute(delete(Leftover).where(Leftover.household_id == DEMO_HOUSEHOLD_ID))
        await session.execute(delete(MealPlan).where(MealPlan.household_id == DEMO_HOUSEHOLD_ID))
        await session.execute(
            delete(RecipeIngredient).where(
                RecipeIngredient.recipe_id.in_(
                    select(Recipe.id).where(Recipe.household_id == DEMO_HOUSEHOLD_ID)
                )
            )
        )
        await session.execute(delete(Recipe).where(Recipe.household_id == DEMO_HOUSEHOLD_ID))
        await session.execute(
            delete(InventoryEvent).where(
                InventoryEvent.lot_id.in_(
                    select(InventoryLot.id).where(InventoryLot.household_id == DEMO_HOUSEHOLD_ID)
                )
            )
        )
        await session.execute(
            delete(InventoryLot).where(InventoryLot.household_id == DEMO_HOUSEHOLD_ID)
        )
        await session.execute(
            delete(Item).where(
                Item.receipt_id.in_(
                    select(Receipt.id).where(Receipt.household_id == DEMO_HOUSEHOLD_ID)
                )
            )
        )
        await session.execute(delete(Receipt).where(Receipt.household_id == DEMO_HOUSEHOLD_ID))
        await session.execute(delete(User).where(User.household_id == DEMO_HOUSEHOLD_ID))
        await session.execute(delete(Household).where(Household.id == DEMO_HOUSEHOLD_ID))

        await session.commit()
        print("Cleared existing demo data")


async def get_category_map() -> dict[str, uuid.UUID]:
    """Get mapping of category names to IDs."""
    async with async_session_factory() as session:
        result = await session.execute(select(Category))
        return {cat.name: cat.id for cat in result.scalars().all()}


async def get_ingredient_map() -> dict[str, uuid.UUID]:
    """Get mapping of ingredient canonical names to IDs."""
    async with async_session_factory() as session:
        result = await session.execute(select(Ingredient))
        return {ing.canonical_name: ing.id for ing in result.scalars().all()}


async def create_household_and_users():
    """Create demo household with two users."""
    async with async_session_factory() as session:
        household = Household(
            id=DEMO_HOUSEHOLD_ID,
            name="Demo Husstand",
        )
        session.add(household)

        ola = User(
            id=DEMO_USER_OLA_ID,
            email="ola@demo.no",
            name="Ola Nordmann",
            household_id=DEMO_HOUSEHOLD_ID,
            role="owner",
        )
        session.add(ola)

        kari = User(
            id=DEMO_USER_KARI_ID,
            email="kari@demo.no",
            name="Kari Nordmann",
            household_id=DEMO_HOUSEHOLD_ID,
            role="member",
        )
        session.add(kari)

        await session.commit()
        print("Created demo household and users")


async def create_receipts() -> list[uuid.UUID]:
    """Create demo receipts with realistic Norwegian grocery items."""
    categories = await get_category_map()
    ingredients = await get_ingredient_map()

    # Receipt data: (days_ago, store_idx, items)
    # Items: (raw_name, canonical_name, qty, unit, unit_price, total, category, ingredient_key)
    receipts_data = [
        # Receipt 1: REMA 1000, 2 days ago - weekly groceries
        (
            2,
            0,
            [
                (
                    "Tine Helmelk 1L",
                    "Melk",
                    Decimal("1"),
                    "l",
                    Decimal("22.90"),
                    Decimal("22.90"),
                    "Meieri",
                    "melk",
                ),
                (
                    "Norvegia 500g",
                    "Ost",
                    Decimal("500"),
                    "g",
                    Decimal("0.16"),
                    Decimal("79.90"),
                    "Meieri",
                    "ost",
                ),
                (
                    "Prior Egg 12pk",
                    "Egg",
                    Decimal("12"),
                    "pcs",
                    Decimal("4.58"),
                    Decimal("54.90"),
                    "Meieri",
                    "egg",
                ),
                (
                    "Gilde Kjøttdeig 400g",
                    "Kjøttdeig",
                    Decimal("400"),
                    "g",
                    Decimal("0.12"),
                    Decimal("49.90"),
                    "Kjøtt",
                    "kjottdeig",
                ),
                (
                    "Kyllingfilet 500g",
                    "Kyllingfilet",
                    Decimal("500"),
                    "g",
                    Decimal("0.18"),
                    Decimal("89.90"),
                    "Kjøtt",
                    "kyllingfilet",
                ),
                (
                    "Gulrot 750g",
                    "Gulrot",
                    Decimal("750"),
                    "g",
                    Decimal("0.03"),
                    Decimal("24.90"),
                    "Grønnsaker",
                    "gulrot",
                ),
                (
                    "Potet 1kg",
                    "Potet",
                    Decimal("1000"),
                    "g",
                    Decimal("0.02"),
                    Decimal("19.90"),
                    "Grønnsaker",
                    "potet",
                ),
                (
                    "Løk nett 1kg",
                    "Løk",
                    Decimal("5"),
                    "pcs",
                    Decimal("4.00"),
                    Decimal("19.90"),
                    "Grønnsaker",
                    "lok",
                ),
                (
                    "Spaghetti 500g",
                    "Pasta",
                    Decimal("500"),
                    "g",
                    Decimal("0.04"),
                    Decimal("19.90"),
                    "Tørrvarer",
                    "pasta",
                ),
                (
                    "Jasminris 1kg",
                    "Ris",
                    Decimal("1000"),
                    "g",
                    Decimal("0.03"),
                    Decimal("34.90"),
                    "Tørrvarer",
                    "ris",
                ),
                (
                    "PANT 2kr",
                    None,
                    Decimal("1"),
                    "pcs",
                    Decimal("2.00"),
                    Decimal("-2.00"),
                    "Pant",
                    None,
                ),
            ],
        ),
        # Receipt 2: KIWI, 5 days ago - quick shop
        (
            5,
            1,
            [
                (
                    "Banan løsvekt",
                    "Banan",
                    Decimal("6"),
                    "pcs",
                    Decimal("3.50"),
                    Decimal("21.00"),
                    "Frukt",
                    "banan",
                ),
                (
                    "Epler Royal Gala 6pk",
                    "Eple",
                    Decimal("6"),
                    "pcs",
                    Decimal("5.00"),
                    Decimal("29.90"),
                    "Frukt",
                    "eple",
                ),
                (
                    "Brød Grovbrød",
                    "Brød",
                    Decimal("1"),
                    "pcs",
                    Decimal("34.90"),
                    Decimal("34.90"),
                    "Brød",
                    "brod",
                ),
                (
                    "Tine Lett Rømme",
                    "Rømme",
                    Decimal("300"),
                    "ml",
                    Decimal("0.10"),
                    Decimal("29.90"),
                    "Meieri",
                    "romme",
                ),
                (
                    "Smør Meierismør 250g",
                    "Smør",
                    Decimal("250"),
                    "g",
                    Decimal("0.16"),
                    Decimal("39.90"),
                    "Meieri",
                    "smor",
                ),
            ],
        ),
        # Receipt 3: MENY, 8 days ago - weekend dinner
        (
            8,
            2,
            [
                (
                    "Laksefilet 400g",
                    "Laks",
                    Decimal("400"),
                    "g",
                    Decimal("0.27"),
                    Decimal("109.00"),
                    "Fisk",
                    "laks",
                ),
                (
                    "Torskefilet 400g",
                    "Torsk",
                    Decimal("400"),
                    "g",
                    Decimal("0.22"),
                    Decimal("89.90"),
                    "Fisk",
                    "torsk",
                ),
                (
                    "Matfløte 3dl",
                    "Fløte",
                    Decimal("300"),
                    "ml",
                    Decimal("0.10"),
                    Decimal("29.90"),
                    "Meieri",
                    "flote",
                ),
                (
                    "Brokkoli",
                    "Brokkoli",
                    Decimal("300"),
                    "g",
                    Decimal("0.10"),
                    Decimal("29.90"),
                    "Grønnsaker",
                    "brokkoli",
                ),
                (
                    "Hvitløk 3pk",
                    "Hvitløk",
                    Decimal("3"),
                    "pcs",
                    Decimal("8.30"),
                    Decimal("24.90"),
                    "Grønnsaker",
                    "hvitlok",
                ),
                (
                    "Spinat 150g",
                    "Spinat",
                    Decimal("150"),
                    "g",
                    Decimal("0.20"),
                    Decimal("29.90"),
                    "Grønnsaker",
                    "spinat",
                ),
            ],
        ),
        # Receipt 4: COOP EXTRA, 12 days ago - big shop
        (
            12,
            3,
            [
                (
                    "Bacon 140g",
                    "Bacon",
                    Decimal("140"),
                    "g",
                    Decimal("0.28"),
                    Decimal("39.90"),
                    "Kjøtt",
                    "bacon",
                ),
                (
                    "Yoghurt Skyr 500g",
                    "Yoghurt",
                    Decimal("500"),
                    "g",
                    Decimal("0.06"),
                    Decimal("32.90"),
                    "Meieri",
                    "yoghurt",
                ),
                (
                    "Olivenolje 500ml",
                    "Olivenolje",
                    Decimal("500"),
                    "ml",
                    Decimal("0.12"),
                    Decimal("59.90"),
                    "Tørrvarer",
                    "olivenolje",
                ),
                (
                    "Hakkede Tomater 400g",
                    "Hermetiske tomater",
                    Decimal("400"),
                    "g",
                    Decimal("0.04"),
                    Decimal("14.90"),
                    "Tørrvarer",
                    "hermetiske_tomater",
                ),
                (
                    "Tomater 500g",
                    "Tomat",
                    Decimal("500"),
                    "g",
                    Decimal("0.06"),
                    Decimal("29.90"),
                    "Grønnsaker",
                    "tomat",
                ),
                (
                    "Paprika Rød",
                    "Paprika",
                    Decimal("2"),
                    "pcs",
                    Decimal("12.45"),
                    Decimal("24.90"),
                    "Grønnsaker",
                    "paprika",
                ),
                (
                    "Agurk",
                    "Agurk",
                    Decimal("1"),
                    "pcs",
                    Decimal("19.90"),
                    Decimal("19.90"),
                    "Grønnsaker",
                    "agurk",
                ),
                (
                    "Isbergsalat",
                    "Salat",
                    Decimal("1"),
                    "pcs",
                    Decimal("22.90"),
                    Decimal("22.90"),
                    "Grønnsaker",
                    "salat",
                ),
                (
                    "RABATT -15%",
                    None,
                    Decimal("1"),
                    "pcs",
                    Decimal("-20.00"),
                    Decimal("-20.00"),
                    None,
                    None,
                ),
            ],
        ),
        # Receipt 5: REMA 1000, 15 days ago
        (
            15,
            0,
            [
                (
                    "Polser Grill 10pk",
                    "Pølser",
                    Decimal("10"),
                    "pcs",
                    Decimal("5.99"),
                    Decimal("59.90"),
                    "Kjøtt",
                    "polser",
                ),
                (
                    "Mel Hvetemel 2kg",
                    "Mel",
                    Decimal("2000"),
                    "g",
                    Decimal("0.01"),
                    Decimal("29.90"),
                    "Tørrvarer",
                    "mel",
                ),
                (
                    "Sukker 1kg",
                    "Sukker",
                    Decimal("1000"),
                    "g",
                    Decimal("0.02"),
                    Decimal("24.90"),
                    "Tørrvarer",
                    "sukker",
                ),
                (
                    "Kaffe Evergood 250g",
                    "Kaffe",
                    Decimal("250"),
                    "g",
                    Decimal("0.20"),
                    Decimal("49.90"),
                    "Drikke",
                    "kaffe",
                ),
                (
                    "Juice Appelsin 1.5L",
                    "Juice",
                    Decimal("1500"),
                    "ml",
                    Decimal("0.02"),
                    Decimal("32.90"),
                    "Drikke",
                    "juice",
                ),
            ],
        ),
        # Receipt 6: KIWI, 18 days ago
        (
            18,
            1,
            [
                (
                    "Reker Pillede 200g",
                    "Reker",
                    Decimal("200"),
                    "g",
                    Decimal("0.40"),
                    Decimal("79.90"),
                    "Fisk",
                    "reker",
                ),
                (
                    "Rundstykker 6pk",
                    "Rundstykker",
                    Decimal("6"),
                    "pcs",
                    Decimal("4.98"),
                    Decimal("29.90"),
                    "Brød",
                    "rundstykker",
                ),
                (
                    "Skinke Kokt 150g",
                    "Skinke",
                    Decimal("150"),
                    "g",
                    Decimal("0.27"),
                    Decimal("39.90"),
                    "Kjøtt",
                    "skinke",
                ),
                (
                    "Appelsin 4pk",
                    "Appelsin",
                    Decimal("4"),
                    "pcs",
                    Decimal("7.48"),
                    Decimal("29.90"),
                    "Frukt",
                    "appelsin",
                ),
                (
                    "Sitron 3pk",
                    "Sitron",
                    Decimal("3"),
                    "pcs",
                    Decimal("6.63"),
                    Decimal("19.90"),
                    "Frukt",
                    "sitron",
                ),
            ],
        ),
        # Receipt 7: MENY, 22 days ago
        (
            22,
            2,
            [
                (
                    "Avokado 2pk",
                    "Avokado",
                    Decimal("2"),
                    "pcs",
                    Decimal("14.95"),
                    Decimal("29.90"),
                    "Frukt",
                    "avokado",
                ),
                (
                    "Te Earl Grey 25pk",
                    "Te",
                    Decimal("25"),
                    "pcs",
                    Decimal("1.60"),
                    Decimal("39.90"),
                    "Drikke",
                    "te",
                ),
                (
                    "Salt Havsalt 500g",
                    "Salt",
                    Decimal("500"),
                    "g",
                    Decimal("0.05"),
                    Decimal("24.90"),
                    "Tørrvarer",
                    "salt",
                ),
                (
                    "Pepper Kvern 50g",
                    "Pepper",
                    Decimal("50"),
                    "g",
                    Decimal("0.80"),
                    Decimal("39.90"),
                    "Tørrvarer",
                    "pepper",
                ),
            ],
        ),
        # Receipt 8: COOP EXTRA, 28 days ago
        (
            28,
            3,
            [
                (
                    "Pasta Penne 500g",
                    "Pasta",
                    Decimal("500"),
                    "g",
                    Decimal("0.05"),
                    Decimal("24.90"),
                    "Tørrvarer",
                    "pasta",
                ),
                (
                    "Frossenpizza",
                    "Frossen pizza",
                    Decimal("1"),
                    "pcs",
                    Decimal("49.90"),
                    Decimal("49.90"),
                    "Frossen",
                    None,
                ),
                (
                    "Fiskepinner 450g",
                    "Fiskepinner",
                    Decimal("450"),
                    "g",
                    Decimal("0.11"),
                    Decimal("49.90"),
                    "Frossen",
                    None,
                ),
                (
                    "Chips Sour Cream",
                    "Chips",
                    Decimal("200"),
                    "g",
                    Decimal("0.17"),
                    Decimal("34.90"),
                    "Snacks",
                    None,
                ),
                (
                    "Sjokolade Freia 200g",
                    "Sjokolade",
                    Decimal("200"),
                    "g",
                    Decimal("0.22"),
                    Decimal("44.90"),
                    "Snacks",
                    None,
                ),
                (
                    "Oppvaskmiddel 500ml",
                    "Oppvaskmiddel",
                    Decimal("1"),
                    "pcs",
                    Decimal("29.90"),
                    Decimal("29.90"),
                    "Husholdning",
                    None,
                ),
                (
                    "PANT 1kr x 4",
                    None,
                    Decimal("4"),
                    "pcs",
                    Decimal("1.00"),
                    Decimal("-4.00"),
                    "Pant",
                    None,
                ),
            ],
        ),
    ]

    receipt_ids = []

    async with async_session_factory() as session:
        for days, store_idx, items_data in receipts_data:
            store_name, store_location = STORES[store_idx]

            # Calculate total
            total = sum(item[5] for item in items_data)

            receipt = Receipt(
                id=uuid.uuid4(),
                household_id=DEMO_HOUSEHOLD_ID,
                merchant_name=store_name,
                store_location=store_location,
                purchase_date=days_ago(days),
                total_amount=total,
                currency="NOK",
                payment_method="Kort",
                inventory_status="reviewed",
            )
            session.add(receipt)
            receipt_ids.append(receipt.id)

            for (
                raw_name,
                canonical,
                qty,
                unit,
                unit_price,
                total_price,
                cat_name,
                ing_key,
            ) in items_data:
                category_id = categories.get(cat_name) if cat_name else None
                ingredient_id = ingredients.get(ing_key) if ing_key else None

                is_pant = "PANT" in raw_name.upper()
                discount = (
                    abs(total_price)
                    if total_price < 0 and "RABATT" in raw_name.upper()
                    else Decimal("0")
                )

                item = Item(
                    id=uuid.uuid4(),
                    receipt_id=receipt.id,
                    raw_name=raw_name,
                    canonical_name=canonical,
                    quantity=qty,
                    unit=unit,
                    unit_price=unit_price if unit_price > 0 else None,
                    total_price=total_price,
                    category_id=category_id,
                    is_pant=is_pant,
                    discount_amount=discount,
                    ingredient_id=ingredient_id,
                    ingredient_confidence=Decimal("0.95") if ingredient_id else None,
                )
                session.add(item)

        await session.commit()
        print(f"Created {len(receipt_ids)} demo receipts")

    return receipt_ids


async def create_inventory():
    """Create inventory lots with initial events."""
    ingredients = await get_ingredient_map()

    # Inventory data: (ingredient_key, qty, unit, location,
    #   days_purchased, days_until_expiry, unit_cost, total_cost)
    inventory_data = [
        # Fridge items
        ("melk", Decimal("800"), "ml", "fridge", 2, 5, Decimal("0.023"), Decimal("18.40")),
        ("ost", Decimal("350"), "g", "fridge", 2, 14, Decimal("0.16"), Decimal("56.00")),
        ("egg", Decimal("8"), "pcs", "fridge", 2, 21, Decimal("4.58"), Decimal("36.64")),
        ("smor", Decimal("200"), "g", "fridge", 5, 30, Decimal("0.16"), Decimal("32.00")),
        ("romme", Decimal("250"), "ml", "fridge", 5, 10, Decimal("0.10"), Decimal("25.00")),
        ("yoghurt", Decimal("400"), "g", "fridge", 12, 7, Decimal("0.06"), Decimal("24.00")),
        ("kyllingfilet", Decimal("300"), "g", "fridge", 2, 3, Decimal("0.18"), Decimal("54.00")),
        ("bacon", Decimal("100"), "g", "fridge", 12, 7, Decimal("0.28"), Decimal("28.00")),
        ("skinke", Decimal("100"), "g", "fridge", 18, 5, Decimal("0.27"), Decimal("27.00")),
        # Pantry items
        ("pasta", Decimal("800"), "g", "pantry", 28, 365, Decimal("0.05"), Decimal("40.00")),
        ("ris", Decimal("750"), "g", "pantry", 2, 365, Decimal("0.03"), Decimal("22.50")),
        ("mel", Decimal("1500"), "g", "pantry", 15, 180, Decimal("0.015"), Decimal("22.50")),
        ("sukker", Decimal("800"), "g", "pantry", 15, 730, Decimal("0.025"), Decimal("20.00")),
        ("salt", Decimal("450"), "g", "pantry", 22, 1825, Decimal("0.05"), Decimal("22.50")),
        ("pepper", Decimal("40"), "g", "pantry", 22, 365, Decimal("0.80"), Decimal("32.00")),
        ("olivenolje", Decimal("400"), "ml", "pantry", 12, 365, Decimal("0.12"), Decimal("48.00")),
        (
            "hermetiske_tomater",
            Decimal("400"),
            "g",
            "pantry",
            12,
            730,
            Decimal("0.04"),
            Decimal("16.00"),
        ),
        ("kaffe", Decimal("200"), "g", "pantry", 15, 180, Decimal("0.20"), Decimal("40.00")),
        # Freezer items
        ("kjottdeig", Decimal("400"), "g", "freezer", 2, 90, Decimal("0.12"), Decimal("48.00")),
        ("laks", Decimal("200"), "g", "freezer", 8, 60, Decimal("0.27"), Decimal("54.00")),
        ("torsk", Decimal("300"), "g", "freezer", 8, 60, Decimal("0.22"), Decimal("66.00")),
        # Fresh produce (short expiry)
        ("banan", Decimal("4"), "pcs", "pantry", 5, 2, Decimal("3.50"), Decimal("14.00")),
        ("eple", Decimal("4"), "pcs", "fridge", 5, 14, Decimal("5.00"), Decimal("20.00")),
        ("gulrot", Decimal("500"), "g", "fridge", 2, 14, Decimal("0.03"), Decimal("15.00")),
        ("potet", Decimal("800"), "g", "pantry", 2, 21, Decimal("0.02"), Decimal("16.00")),
        ("lok", Decimal("3"), "pcs", "pantry", 2, 30, Decimal("4.00"), Decimal("12.00")),
        ("hvitlok", Decimal("2"), "pcs", "pantry", 8, 30, Decimal("8.30"), Decimal("16.60")),
        ("tomat", Decimal("300"), "g", "fridge", 12, 3, Decimal("0.06"), Decimal("18.00")),
        ("brokkoli", Decimal("200"), "g", "fridge", 8, 4, Decimal("0.10"), Decimal("20.00")),
    ]

    async with async_session_factory() as session:
        for (
            ing_key,
            qty,
            unit,
            location,
            days_purchased,
            days_expiry,
            unit_cost,
            total_cost,
        ) in inventory_data:
            ingredient_id = ingredients.get(ing_key)
            if not ingredient_id:
                print(f"Warning: Ingredient '{ing_key}' not found, skipping")
                continue

            lot = InventoryLot(
                id=uuid.uuid4(),
                household_id=DEMO_HOUSEHOLD_ID,
                ingredient_id=ingredient_id,
                quantity=qty,
                unit=unit,
                location=location,
                purchase_date=days_ago(days_purchased),
                expiry_date=days_from_now(days_expiry),
                unit_cost=unit_cost,
                total_cost=total_cost,
                currency="NOK",
                confidence=Decimal("0.95"),
                source_type="receipt",
            )
            session.add(lot)

            # Add initial "add" event
            event = InventoryEvent(
                id=uuid.uuid4(),
                lot_id=lot.id,
                event_type="add",
                quantity_delta=qty,
                unit=unit,
                reason="Purchased from store",
                created_by=DEMO_USER_OLA_ID,
            )
            session.add(event)

        await session.commit()
        print(f"Created {len(inventory_data)} inventory lots with events")


async def create_recipes() -> dict[str, uuid.UUID]:
    """Create Norwegian recipes with ingredients."""
    ingredients = await get_ingredient_map()

    # Recipe data: (name, servings, prep_time, cook_time, instructions, tags, ingredients_list)
    # Ingredients: (raw_text, qty, unit, ing_key, notes)
    recipes_data = [
        (
            "Kjøttboller i brun saus",
            4,
            20,
            30,
            "1. Bland kjøttdeig med egg, salt og pepper.\n"
            "2. Form til boller og stek i smør til gylne.\n"
            "3. Lag brun saus av stekefett, mel og kraft.\n"
            "4. Legg kjøttbollene i sausen og la småkoke i 15 min.\n"
            "5. Server med poteter og tyttebærsyltetøy.",
            ["middag", "norsk", "klassisk"],
            [
                ("500g kjøttdeig", Decimal("500"), "g", "kjottdeig", None),
                ("2 egg", Decimal("2"), "pcs", "egg", None),
                ("2 ss smør", Decimal("30"), "g", "smor", "til steking"),
                ("2 ss mel", Decimal("30"), "g", "mel", "til saus"),
                ("1 ts salt", Decimal("5"), "g", "salt", None),
                ("1/2 ts pepper", Decimal("2"), "g", "pepper", None),
                ("600g poteter", Decimal("600"), "g", "potet", "kokte"),
            ],
        ),
        (
            "Fiskegrateng",
            4,
            15,
            35,
            "1. Kok pasta etter anvisning.\n"
            "2. Legg torsk i ildfast form.\n"
            "3. Bland fløte, egg og ost.\n"
            "4. Hell fløteblandingen over fisken.\n"
            "5. Gratiner i ovn på 200°C i 25-30 min.",
            ["middag", "fisk", "grateng"],
            [
                ("400g torsk", Decimal("400"), "g", "torsk", "i biter"),
                ("300g pasta", Decimal("300"), "g", "pasta", None),
                ("3 dl fløte", Decimal("300"), "ml", "flote", None),
                ("2 egg", Decimal("2"), "pcs", "egg", None),
                ("100g revet ost", Decimal("100"), "g", "ost", "revet"),
                ("1/2 ts salt", Decimal("3"), "g", "salt", None),
            ],
        ),
        (
            "Lapskaus",
            6,
            20,
            60,
            "1. Kutt kjøtt og grønnsaker i terninger.\n"
            "2. Brun kjøttet i gryte.\n"
            "3. Tilsett løk, gulrøtter og poteter.\n"
            "4. Hell på vann til det dekker.\n"
            "5. La småkoke i 45-60 min til alt er mørt.",
            ["middag", "norsk", "gryte", "comfort"],
            [
                ("400g kjøttdeig", Decimal("400"), "g", "kjottdeig", None),
                ("600g poteter", Decimal("600"), "g", "potet", "i terninger"),
                ("300g gulrøtter", Decimal("300"), "g", "gulrot", "i biter"),
                ("2 løk", Decimal("2"), "pcs", "lok", "hakket"),
                ("1 ts salt", Decimal("6"), "g", "salt", None),
                ("1/2 ts pepper", Decimal("2"), "g", "pepper", None),
            ],
        ),
        (
            "Kylling med ris",
            4,
            15,
            25,
            "1. Skjær kylling i biter og krydre.\n"
            "2. Stek kylling i olje til gjennomstekt.\n"
            "3. Kok ris etter anvisning.\n"
            "4. Tilsett paprika og hvitløk til kyllingen.\n"
            "5. Server kylling over ris med grønnsaker.",
            ["middag", "kylling", "enkel"],
            [
                ("500g kyllingfilet", Decimal("500"), "g", "kyllingfilet", "i biter"),
                ("300g ris", Decimal("300"), "g", "ris", None),
                ("2 paprika", Decimal("2"), "pcs", "paprika", "i strimler"),
                ("3 fedd hvitløk", Decimal("3"), "pcs", "hvitlok", "finhakket"),
                ("2 ss olivenolje", Decimal("30"), "ml", "olivenolje", None),
                ("1 ts salt", Decimal("5"), "g", "salt", None),
            ],
        ),
        (
            "Pasta Carbonara",
            4,
            10,
            20,
            "1. Kok pasta al dente.\n"
            "2. Stek bacon sprøtt.\n"
            "3. Visp egg og ost sammen.\n"
            "4. Bland varm pasta med bacon.\n"
            "5. Rør inn eggblanding utenfor varme.\n"
            "6. Server umiddelbart med pepper.",
            ["middag", "pasta", "italiensk", "rask"],
            [
                ("400g spaghetti", Decimal("400"), "g", "pasta", None),
                ("150g bacon", Decimal("150"), "g", "bacon", "i biter"),
                ("4 egg", Decimal("4"), "pcs", "egg", None),
                ("100g parmesan", Decimal("100"), "g", "ost", "revet"),
                ("1 ts pepper", Decimal("4"), "g", "pepper", "friskmalt"),
            ],
        ),
        (
            "Fiskesuppe",
            4,
            15,
            25,
            "1. Stek løk og hvitløk i smør.\n"
            "2. Tilsett fiskekraft og fløte.\n"
            "3. La småkoke i 10 min.\n"
            "4. Tilsett fisk og reker.\n"
            "5. Kok forsiktig til fisken er gjennomstekt.\n"
            "6. Smak til med salt og pepper.",
            ["middag", "fisk", "suppe"],
            [
                ("300g torsk", Decimal("300"), "g", "torsk", "i biter"),
                ("150g reker", Decimal("150"), "g", "reker", "pillede"),
                ("2 dl fløte", Decimal("200"), "ml", "flote", None),
                ("1 løk", Decimal("1"), "pcs", "lok", "finhakket"),
                ("2 fedd hvitløk", Decimal("2"), "pcs", "hvitlok", "finhakket"),
                ("2 ss smør", Decimal("30"), "g", "smor", None),
                ("1 ts salt", Decimal("5"), "g", "salt", None),
            ],
        ),
    ]

    recipe_map = {}

    async with async_session_factory() as session:
        for (
            name,
            servings,
            prep_time,
            cook_time,
            instructions,
            tags,
            recipe_ingredients,
        ) in recipes_data:
            recipe = Recipe(
                id=uuid.uuid4(),
                household_id=DEMO_HOUSEHOLD_ID,
                name=name,
                servings=servings,
                prep_time_minutes=prep_time,
                cook_time_minutes=cook_time,
                instructions=instructions,
                tags=tags,
            )
            session.add(recipe)
            recipe_map[name] = recipe.id

            for raw_text, qty, unit, ing_key, notes in recipe_ingredients:
                ingredient_id = ingredients.get(ing_key)

                recipe_ing = RecipeIngredient(
                    id=uuid.uuid4(),
                    recipe_id=recipe.id,
                    ingredient_id=ingredient_id,
                    raw_text=raw_text,
                    quantity=qty,
                    unit=unit,
                    notes=notes,
                )
                session.add(recipe_ing)

        await session.commit()
        print(f"Created {len(recipe_map)} recipes with ingredients")

    return recipe_map


async def create_meal_plans(recipe_map: dict[str, uuid.UUID]) -> list[uuid.UUID]:
    """Create 2 weeks of meal plans."""
    # Plan dinners for 14 days, some lunches
    # Format: (days_offset, meal_type, recipe_name, status, servings)
    # days_offset: negative = past, positive = future
    meal_plan_data = [
        # Past week (cooked)
        (-7, "dinner", "Kjøttboller i brun saus", "cooked", 4),
        (-6, "dinner", "Fiskegrateng", "cooked", 4),
        (-5, "dinner", "Pasta Carbonara", "cooked", 4),
        (-4, "dinner", "Kylling med ris", "cooked", 4),
        (-3, "dinner", "Lapskaus", "cooked", 6),
        (-2, "dinner", "Fiskesuppe", "cooked", 4),
        (-1, "dinner", "Kjøttboller i brun saus", "cooked", 4),
        # This week (planned)
        (0, "dinner", "Pasta Carbonara", "planned", 4),
        (1, "dinner", "Kylling med ris", "planned", 4),
        (2, "dinner", "Fiskegrateng", "planned", 4),
        (3, "dinner", "Lapskaus", "planned", 6),
        (4, "dinner", "Fiskesuppe", "planned", 4),
        (5, "dinner", "Kjøttboller i brun saus", "planned", 4),
        (6, "dinner", "Pasta Carbonara", "planned", 4),
        # Some lunches
        (-6, "lunch", "Fiskesuppe", "cooked", 2),
        (-3, "lunch", "Pasta Carbonara", "cooked", 2),
        (2, "lunch", "Lapskaus", "planned", 2),
    ]

    meal_plan_ids = []

    async with async_session_factory() as session:
        for days_offset, meal_type, recipe_name, status, servings in meal_plan_data:
            recipe_id = recipe_map.get(recipe_name)
            if not recipe_id:
                continue

            planned_date = datetime.now() + timedelta(days=days_offset)
            cooked_at = planned_date if status == "cooked" else None

            meal_plan = MealPlan(
                id=uuid.uuid4(),
                household_id=DEMO_HOUSEHOLD_ID,
                recipe_id=recipe_id,
                planned_date=planned_date,
                meal_type=meal_type,
                servings=servings,
                status=status,
                cooked_at=cooked_at,
            )
            session.add(meal_plan)
            meal_plan_ids.append(meal_plan.id)

        await session.commit()
        print(f"Created {len(meal_plan_ids)} meal plans")

    return meal_plan_ids


async def create_leftovers(recipe_map: dict[str, uuid.UUID]):
    """Create leftovers from recently cooked meals."""
    async with async_session_factory() as session:
        # Find cooked meal plans to create leftovers from
        result = await session.execute(
            select(MealPlan)
            .where(MealPlan.household_id == DEMO_HOUSEHOLD_ID)
            .where(MealPlan.status == "cooked")
            .where(MealPlan.cooked_at >= days_ago(4))
        )
        recent_cooked = result.scalars().all()

        leftover_count = 0
        for meal_plan in recent_cooked[:3]:  # Only create 2-3 leftovers
            # Mark meal plan as leftover source
            meal_plan.is_leftover_source = True

            leftover = Leftover(
                id=uuid.uuid4(),
                household_id=DEMO_HOUSEHOLD_ID,
                meal_plan_id=meal_plan.id,
                recipe_id=meal_plan.recipe_id,
                remaining_servings=2,
                status="available",
                expires_at=days_from_now(3),
            )
            session.add(leftover)
            leftover_count += 1

        await session.commit()
        print(f"Created {leftover_count} leftovers")


async def create_shopping_lists():
    """Create active shopping list with items."""
    ingredients = await get_ingredient_map()

    async with async_session_factory() as session:
        # Create shopping list for next week
        shopping_list = ShoppingList(
            id=uuid.uuid4(),
            household_id=DEMO_HOUSEHOLD_ID,
            name="Ukehandel",
            date_range_start=days_from_now(0),
            date_range_end=days_from_now(7),
            status="active",
        )
        session.add(shopping_list)

        # Items needed based on meal plans vs inventory
        # Format: (ing_key, required_qty, unit, on_hand_qty, to_buy_qty, is_checked)
        shopping_items_data = [
            ("melk", Decimal("1000"), "ml", Decimal("800"), Decimal("1000"), False),
            ("egg", Decimal("12"), "pcs", Decimal("8"), Decimal("12"), False),
            ("ost", Decimal("200"), "g", Decimal("350"), Decimal("0"), True),  # Already have enough
            ("kyllingfilet", Decimal("500"), "g", Decimal("300"), Decimal("500"), False),
            ("kjottdeig", Decimal("400"), "g", Decimal("400"), Decimal("400"), False),
            ("bacon", Decimal("150"), "g", Decimal("100"), Decimal("150"), False),
            ("torsk", Decimal("400"), "g", Decimal("300"), Decimal("400"), False),
            ("flote", Decimal("500"), "ml", Decimal("0"), Decimal("500"), False),
            (
                "pasta",
                Decimal("400"),
                "g",
                Decimal("800"),
                Decimal("0"),
                True,
            ),  # Already have enough
            ("paprika", Decimal("2"), "pcs", Decimal("0"), Decimal("2"), False),
            ("lok", Decimal("3"), "pcs", Decimal("3"), Decimal("2"), False),
            (
                "gulrot",
                Decimal("300"),
                "g",
                Decimal("500"),
                Decimal("0"),
                True,
            ),  # Already have enough
        ]

        for ing_key, req_qty, unit, on_hand, to_buy, is_checked in shopping_items_data:
            ingredient_id = ingredients.get(ing_key)
            if not ingredient_id:
                continue

            item = ShoppingListItem(
                id=uuid.uuid4(),
                shopping_list_id=shopping_list.id,
                ingredient_id=ingredient_id,
                required_quantity=req_qty,
                required_unit=unit,
                on_hand_quantity=on_hand,
                to_buy_quantity=to_buy,
                is_checked=is_checked,
            )
            session.add(item)

        await session.commit()
        print(f"Created shopping list with {len(shopping_items_data)} items")


async def seed_demo_data():
    """Main function to seed all demo data."""
    print("=" * 50)
    print("Seeding demo data...")
    print("=" * 50)

    # Clear existing demo data first
    await clear_demo_data()

    # Create entities in order
    await create_household_and_users()
    await create_receipts()
    await create_inventory()
    recipe_map = await create_recipes()
    await create_meal_plans(recipe_map)
    await create_leftovers(recipe_map)
    await create_shopping_lists()

    print("=" * 50)
    print("Demo data seeding complete!")
    print(f"Household ID: {DEMO_HOUSEHOLD_ID}")
    print("=" * 50)


if __name__ == "__main__":
    asyncio.run(seed_demo_data())
