# Database Seeding

This document describes the database seeding scripts for Kvitteringshvelv.

## Overview

The application includes several seed scripts to populate the database with initial data:

| Script | Command | Description |
|--------|---------|-------------|
| Categories | `make seed-categories` | 12 Norwegian grocery categories |
| Ingredients | `make seed-ingredients` | ~43 common Norwegian ingredients |
| Unit Conversions | `make seed-units` | Standard unit conversion factors |
| Demo Data | `make seed-demo` | Comprehensive demo dataset |

## Quick Start

```bash
# Seed all base data (categories, ingredients, units)
make seed-all

# Seed demo data for testing/demos
make seed-demo
```

## Seed Scripts

### Categories (`src/db/seed.py`)

Seeds the 12 Norwegian grocery categories:

| Category | Norwegian | Icon |
|----------|-----------|------|
| Meieri | Dairy | 🥛 |
| Kjøtt | Meat | 🥩 |
| Fisk | Fish | 🐟 |
| Brød | Bread | 🍞 |
| Frukt | Fruit | 🍎 |
| Grønnsaker | Vegetables | 🥬 |
| Drikke | Beverages | 🥤 |
| Tørrvarer | Dry goods | 🌾 |
| Frossen | Frozen | ❄️ |
| Husholdning | Household | 🧹 |
| Snacks | Snacks | 🍿 |
| Pant | Deposits | ♻️ |

### Ingredients (`src/db/seed_ingredients.py`)

Seeds common Norwegian grocery ingredients with:
- Norwegian names and canonical names
- Default units (g, ml, pcs)
- Aliases for OCR matching
- Category associations

### Unit Conversions (`src/db/seed_unit_conversions.py`)

Seeds standard unit conversion factors for recipe calculations.

### Demo Data (`src/db/seed_demo_data.py`)

Creates a comprehensive demo dataset for testing and demonstrations.

#### Demo Household

| Entity | Details |
|--------|---------|
| ID | `00000000-0000-0000-0000-000000000001` |
| Name | Demo Husstand |

#### Demo Users

| User | Email | Role |
|------|-------|------|
| Ola Nordmann | ola@demo.no | owner |
| Kari Nordmann | kari@demo.no | member |

#### Demo Data Summary

| Entity | Count | Details |
|--------|-------|---------|
| Receipts | 9 | REMA 1000, KIWI, MENY, COOP EXTRA |
| Items | ~50 | Mapped to ingredients/categories |
| Inventory Lots | 29 | Pantry, fridge, freezer with expiry dates |
| Recipes | 6 | Norwegian classics with ingredients |
| Meal Plans | 17 | 2 weeks of dinners + some lunches |
| Leftovers | 3 | From cooked meals |
| Shopping Lists | 1 | With calculated items |

#### Demo Recipes

1. **Kjøttboller i brun saus** - Norwegian meatballs in brown sauce
2. **Fiskegrateng** - Fish gratin with pasta
3. **Lapskaus** - Traditional Norwegian stew
4. **Kylling med ris** - Chicken with rice
5. **Pasta Carbonara** - Classic Italian pasta
6. **Fiskesuppe** - Norwegian fish soup

#### Idempotency

The demo data script is **idempotent** - safe to run multiple times:
- Uses fixed UUIDs for household and users
- Clears existing demo data before recreating
- Does not affect non-demo data

## Running on Production (Render)

### Via Render Shell

1. Go to Render dashboard → Backend service → Shell
2. Run:

```bash
# Seed base data (if not already done)
uv run python -m src.db.seed
uv run python -m src.db.seed_ingredients

# Seed demo data
uv run python -m src.db.seed_demo_data
```

### Important Notes

- The demo data uses `datetime.now()` for date calculations
- Running at different times will produce different absolute dates
- Receipts span the last 28 days from seed time
- Meal plans span from 7 days ago to 7 days ahead

## Verification

After seeding, verify via API:

```bash
# Check receipts
curl "http://localhost:8000/api/receipts?household_id=00000000-0000-0000-0000-000000000001"

# Check recipes
curl "http://localhost:8000/api/recipes?household_id=00000000-0000-0000-0000-000000000001"

# Check meal plans
curl "http://localhost:8000/api/meal-plans?household_id=00000000-0000-0000-0000-000000000001"

# Check analytics
curl "http://localhost:8000/api/analytics/summary?household_id=00000000-0000-0000-0000-000000000001"
```

Or visit the frontend at `http://localhost:3000/nb` and explore the demo data.

## File Locations

```
backend/src/db/
├── seed.py                 # Categories
├── seed_ingredients.py     # Ingredients
├── seed_unit_conversions.py # Unit conversions
└── seed_demo_data.py       # Demo data
```
