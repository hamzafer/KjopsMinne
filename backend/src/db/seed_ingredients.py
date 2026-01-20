"""Seed database with common Norwegian grocery ingredients."""
import asyncio
import uuid

from sqlalchemy import select

from src.db.engine import async_session_factory
from src.db.models import Category, Ingredient


def _ing(name: str, canonical: str, unit: str, aliases: list[str], cat: str) -> dict:
    """Helper to create ingredient dict."""
    return {
        "name": name,
        "canonical_name": canonical,
        "default_unit": unit,
        "aliases": aliases,
        "category": cat,
    }


# Common Norwegian ingredients with aliases
INGREDIENTS = [
    # Meieri (Dairy)
    _ing("Melk", "melk", "ml", ["milk", "helmelk", "lettmelk", "skummet"], "Meieri"),
    _ing("Ost", "ost", "g", ["cheese", "norvegia", "jarlsberg", "gulost"], "Meieri"),
    _ing("Smor", "smor", "g", ["butter", "meierismor"], "Meieri"),
    _ing("Yoghurt", "yoghurt", "g", ["youghurt", "yogurt"], "Meieri"),
    _ing("Romme", "romme", "ml", ["sour cream", "lettromme"], "Meieri"),
    _ing("Flote", "flote", "ml", ["cream", "matflote", "kremflote"], "Meieri"),
    _ing("Egg", "egg", "pcs", ["eggs", "eggehvite"], "Meieri"),

    # Kjott (Meat)
    _ing("Kyllingfilet", "kyllingfilet", "g",
         ["chicken breast", "kylling", "kyl filet"], "Kjott"),
    _ing("Kjottdeig", "kjottdeig", "g",
         ["minced meat", "deig", "storfedeig"], "Kjott"),
    _ing("Bacon", "bacon", "g", ["bakon"], "Kjott"),
    _ing("Polser", "polser", "pcs", ["sausages", "grillpolser", "wiener"], "Kjott"),
    _ing("Skinke", "skinke", "g", ["ham", "kokt skinke"], "Kjott"),

    # Fisk (Fish)
    _ing("Laks", "laks", "g", ["salmon", "laksefilet"], "Fisk"),
    _ing("Torsk", "torsk", "g", ["cod", "torskefilet"], "Fisk"),
    _ing("Reker", "reker", "g", ["shrimp", "prawns"], "Fisk"),

    # Gronnsaker (Vegetables)
    _ing("Tomat", "tomat", "g", ["tomato", "tomater", "cherrytomater"], "Gronnsaker"),
    _ing("Lok", "lok", "pcs", ["onion", "rodlok", "gul lok"], "Gronnsaker"),
    _ing("Hvitlok", "hvitlok", "pcs", ["garlic", "hvitloksfedd"], "Gronnsaker"),
    _ing("Gulrot", "gulrot", "g", ["carrot", "gulrotter"], "Gronnsaker"),
    _ing("Paprika", "paprika", "pcs",
         ["bell pepper", "rod paprika", "gul paprika"], "Gronnsaker"),
    _ing("Agurk", "agurk", "pcs", ["cucumber", "slangeagurk"], "Gronnsaker"),
    _ing("Salat", "salat", "pcs", ["lettuce", "isbergsalat", "romaine"], "Gronnsaker"),
    _ing("Brokkoli", "brokkoli", "g", ["broccoli"], "Gronnsaker"),
    _ing("Spinat", "spinat", "g", ["spinach"], "Gronnsaker"),
    _ing("Potet", "potet", "g", ["potato", "poteter", "mandelpoteter"], "Gronnsaker"),

    # Frukt (Fruit)
    _ing("Banan", "banan", "pcs", ["banana", "bananer"], "Frukt"),
    _ing("Eple", "eple", "pcs", ["apple", "epler"], "Frukt"),
    _ing("Appelsin", "appelsin", "pcs", ["orange", "appelsiner"], "Frukt"),
    _ing("Sitron", "sitron", "pcs", ["lemon", "sitroner"], "Frukt"),
    _ing("Avokado", "avokado", "pcs", ["avocado"], "Frukt"),

    # Brod (Bread)
    _ing("Brod", "brod", "pcs", ["bread", "grovbrod", "loff"], "Brod"),
    _ing("Rundstykker", "rundstykker", "pcs", ["rolls", "rundstykke"], "Brod"),

    # Torrvarer (Dry goods)
    _ing("Pasta", "pasta", "g", ["spaghetti", "penne", "makaroni"], "Torrvarer"),
    _ing("Ris", "ris", "g", ["rice", "jasminris", "basmati"], "Torrvarer"),
    _ing("Mel", "mel", "g", ["flour", "hvetemel"], "Torrvarer"),
    _ing("Sukker", "sukker", "g", ["sugar", "melis"], "Torrvarer"),
    _ing("Salt", "salt", "g", ["sea salt", "havsalt"], "Torrvarer"),
    _ing("Pepper", "pepper", "g", ["black pepper", "sort pepper"], "Torrvarer"),
    _ing("Olivenolje", "olivenolje", "ml", ["olive oil", "extra virgin"], "Torrvarer"),
    _ing("Hermetiske tomater", "hermetiske_tomater", "g",
         ["canned tomatoes", "hakkede tomater"], "Torrvarer"),

    # Drikke (Beverages)
    _ing("Kaffe", "kaffe", "g", ["coffee", "filterkaffe"], "Drikke"),
    _ing("Te", "te", "pcs", ["tea", "teposer"], "Drikke"),
    _ing("Juice", "juice", "ml", ["appelsinjuice", "eplejuice"], "Drikke"),
]


async def seed_ingredients():
    """Insert common ingredients if they don't exist."""
    async with async_session_factory() as session:
        # Get category mapping
        result = await session.execute(select(Category))
        categories = {cat.name: cat.id for cat in result.scalars().all()}

        added = 0
        for ing_data in INGREDIENTS:
            # Check if exists
            result = await session.execute(
                select(Ingredient).where(
                    Ingredient.canonical_name == ing_data["canonical_name"]
                )
            )
            if not result.scalar_one_or_none():
                category_id = categories.get(ing_data.get("category"))
                ingredient = Ingredient(
                    id=uuid.uuid4(),
                    name=ing_data["name"],
                    canonical_name=ing_data["canonical_name"],
                    default_unit=ing_data["default_unit"],
                    aliases=ing_data["aliases"],
                    category_id=category_id,
                )
                session.add(ingredient)
                added += 1
                print(f"Added ingredient: {ing_data['name']}")
            else:
                print(f"Ingredient exists: {ing_data['name']}")

        await session.commit()
        print(f"Seeding complete! Added {added} ingredients.")


if __name__ == "__main__":
    asyncio.run(seed_ingredients())
