"""Seed database with common Norwegian grocery ingredients."""
import asyncio
import uuid

from sqlalchemy import select

from src.db.engine import async_session_factory
from src.db.models import Category, Ingredient

# Common Norwegian ingredients with aliases
INGREDIENTS = [
    # Meieri (Dairy)
    {"name": "Melk", "canonical_name": "melk", "default_unit": "ml", "aliases": ["milk", "helmelk", "lettmelk", "skummet"], "category": "Meieri"},
    {"name": "Ost", "canonical_name": "ost", "default_unit": "g", "aliases": ["cheese", "norvegia", "jarlsberg", "gulost"], "category": "Meieri"},
    {"name": "Smør", "canonical_name": "smor", "default_unit": "g", "aliases": ["butter", "meierismør"], "category": "Meieri"},
    {"name": "Yoghurt", "canonical_name": "yoghurt", "default_unit": "g", "aliases": ["youghurt", "yogurt"], "category": "Meieri"},
    {"name": "Rømme", "canonical_name": "romme", "default_unit": "ml", "aliases": ["sour cream", "lettrømme"], "category": "Meieri"},
    {"name": "Fløte", "canonical_name": "flote", "default_unit": "ml", "aliases": ["cream", "matfløte", "kremfløte"], "category": "Meieri"},
    {"name": "Egg", "canonical_name": "egg", "default_unit": "pcs", "aliases": ["eggs", "eggehvite"], "category": "Meieri"},

    # Kjøtt (Meat)
    {"name": "Kyllingfilet", "canonical_name": "kyllingfilet", "default_unit": "g", "aliases": ["chicken breast", "kylling", "kyl filet"], "category": "Kjøtt"},
    {"name": "Kjøttdeig", "canonical_name": "kjottdeig", "default_unit": "g", "aliases": ["minced meat", "deig", "storfedeig"], "category": "Kjøtt"},
    {"name": "Bacon", "canonical_name": "bacon", "default_unit": "g", "aliases": ["bakon"], "category": "Kjøtt"},
    {"name": "Pølser", "canonical_name": "polser", "default_unit": "pcs", "aliases": ["sausages", "grillpølser", "wiener"], "category": "Kjøtt"},
    {"name": "Skinke", "canonical_name": "skinke", "default_unit": "g", "aliases": ["ham", "kokt skinke"], "category": "Kjøtt"},

    # Fisk (Fish)
    {"name": "Laks", "canonical_name": "laks", "default_unit": "g", "aliases": ["salmon", "laksefilet"], "category": "Fisk"},
    {"name": "Torsk", "canonical_name": "torsk", "default_unit": "g", "aliases": ["cod", "torskefilet"], "category": "Fisk"},
    {"name": "Reker", "canonical_name": "reker", "default_unit": "g", "aliases": ["shrimp", "prawns"], "category": "Fisk"},

    # Grønnsaker (Vegetables)
    {"name": "Tomat", "canonical_name": "tomat", "default_unit": "g", "aliases": ["tomato", "tomater", "cherrytomater"], "category": "Grønnsaker"},
    {"name": "Løk", "canonical_name": "lok", "default_unit": "pcs", "aliases": ["onion", "rødløk", "gul løk"], "category": "Grønnsaker"},
    {"name": "Hvitløk", "canonical_name": "hvitlok", "default_unit": "pcs", "aliases": ["garlic", "hvitløksfedd"], "category": "Grønnsaker"},
    {"name": "Gulrot", "canonical_name": "gulrot", "default_unit": "g", "aliases": ["carrot", "gulrøtter"], "category": "Grønnsaker"},
    {"name": "Paprika", "canonical_name": "paprika", "default_unit": "pcs", "aliases": ["bell pepper", "rød paprika", "gul paprika"], "category": "Grønnsaker"},
    {"name": "Agurk", "canonical_name": "agurk", "default_unit": "pcs", "aliases": ["cucumber", "slangeagurk"], "category": "Grønnsaker"},
    {"name": "Salat", "canonical_name": "salat", "default_unit": "pcs", "aliases": ["lettuce", "isbergsalat", "romaine"], "category": "Grønnsaker"},
    {"name": "Brokkoli", "canonical_name": "brokkoli", "default_unit": "g", "aliases": ["broccoli"], "category": "Grønnsaker"},
    {"name": "Spinat", "canonical_name": "spinat", "default_unit": "g", "aliases": ["spinach"], "category": "Grønnsaker"},
    {"name": "Potet", "canonical_name": "potet", "default_unit": "g", "aliases": ["potato", "poteter", "mandelpoteter"], "category": "Grønnsaker"},

    # Frukt (Fruit)
    {"name": "Banan", "canonical_name": "banan", "default_unit": "pcs", "aliases": ["banana", "bananer"], "category": "Frukt"},
    {"name": "Eple", "canonical_name": "eple", "default_unit": "pcs", "aliases": ["apple", "epler"], "category": "Frukt"},
    {"name": "Appelsin", "canonical_name": "appelsin", "default_unit": "pcs", "aliases": ["orange", "appelsiner"], "category": "Frukt"},
    {"name": "Sitron", "canonical_name": "sitron", "default_unit": "pcs", "aliases": ["lemon", "sitroner"], "category": "Frukt"},
    {"name": "Avokado", "canonical_name": "avokado", "default_unit": "pcs", "aliases": ["avocado"], "category": "Frukt"},

    # Brød (Bread)
    {"name": "Brød", "canonical_name": "brod", "default_unit": "pcs", "aliases": ["bread", "grovbrød", "loff"], "category": "Brød"},
    {"name": "Rundstykker", "canonical_name": "rundstykker", "default_unit": "pcs", "aliases": ["rolls", "rundstykke"], "category": "Brød"},

    # Tørrvarer (Dry goods)
    {"name": "Pasta", "canonical_name": "pasta", "default_unit": "g", "aliases": ["spaghetti", "penne", "makaroni"], "category": "Tørrvarer"},
    {"name": "Ris", "canonical_name": "ris", "default_unit": "g", "aliases": ["rice", "jasminris", "basmati"], "category": "Tørrvarer"},
    {"name": "Mel", "canonical_name": "mel", "default_unit": "g", "aliases": ["flour", "hvetemel"], "category": "Tørrvarer"},
    {"name": "Sukker", "canonical_name": "sukker", "default_unit": "g", "aliases": ["sugar", "melis"], "category": "Tørrvarer"},
    {"name": "Salt", "canonical_name": "salt", "default_unit": "g", "aliases": ["sea salt", "havsalt"], "category": "Tørrvarer"},
    {"name": "Pepper", "canonical_name": "pepper", "default_unit": "g", "aliases": ["black pepper", "sort pepper"], "category": "Tørrvarer"},
    {"name": "Olivenolje", "canonical_name": "olivenolje", "default_unit": "ml", "aliases": ["olive oil", "extra virgin"], "category": "Tørrvarer"},
    {"name": "Hermetiske tomater", "canonical_name": "hermetiske_tomater", "default_unit": "g", "aliases": ["canned tomatoes", "hakkede tomater"], "category": "Tørrvarer"},

    # Drikke (Beverages)
    {"name": "Kaffe", "canonical_name": "kaffe", "default_unit": "g", "aliases": ["coffee", "filterkaffe"], "category": "Drikke"},
    {"name": "Te", "canonical_name": "te", "default_unit": "pcs", "aliases": ["tea", "teposer"], "category": "Drikke"},
    {"name": "Juice", "canonical_name": "juice", "default_unit": "ml", "aliases": ["appelsinjuice", "eplejuice"], "category": "Drikke"},
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
                select(Ingredient).where(Ingredient.canonical_name == ing_data["canonical_name"])
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
