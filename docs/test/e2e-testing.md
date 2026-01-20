# E2E Integration Testing Guide

## Prerequisites
- `make dev` running
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- Default household created in database

## Setup: Create Test Household
```bash
docker exec kvitteringshvelv-db-1 psql -U postgres -d kvitteringshvelv -c \
  "INSERT INTO households (id, name) VALUES ('00000000-0000-0000-0000-000000000001', 'Default Household') ON CONFLICT DO NOTHING;"
```

---

## Test 1: Recipes

### Via API
```bash
curl -X POST "http://localhost:8000/api/recipes" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Pasta",
    "servings": 4,
    "instructions": "Boil pasta, add sauce",
    "household_id": "00000000-0000-0000-0000-000000000001",
    "ingredients": [
      {"ingredient_name": "Pasta", "quantity": 500, "unit": "g", "raw_text": "500g Pasta"},
      {"ingredient_name": "Tomato sauce", "quantity": 400, "unit": "g", "raw_text": "400g Tomato sauce"}
    ]
  }'
```

### Via UI
1. Navigate to `/recipes`
2. Click "+ New Recipe"
3. Fill form: Name, Servings, Ingredients, Instructions
4. Click Save
5. Verify recipe appears in grid

### Database Verification
```sql
SELECT id, name, servings FROM recipes;
```

---

## Test 2: Meal Planning

### Via API
```bash
curl -X POST "http://localhost:8000/api/meal-plans" \
  -H "Content-Type: application/json" \
  -d '{
    "household_id": "00000000-0000-0000-0000-000000000001",
    "recipe_id": "<RECIPE_ID>",
    "planned_date": "2026-01-21",
    "meal_type": "dinner",
    "servings": 4
  }'
```

### Via UI
1. Navigate to `/plan`
2. Click on empty calendar slot
3. Select recipe and set servings
4. Save meal plan
5. Verify meal appears in calendar

### Database Verification
```sql
SELECT id, recipe_id, planned_date, status FROM meal_plans;
```

---

## Test 3: Cook Meal & Create Leftover

### Via API
```bash
curl -X POST "http://localhost:8000/api/meal-plans/<MEAL_PLAN_ID>/cook" \
  -H "Content-Type: application/json" \
  -d '{
    "actual_servings": 4,
    "create_leftover": true,
    "leftover_servings": 2
  }'
```

### Via UI
1. Navigate to `/plan`
2. Click on planned meal
3. Click "Cook" button
4. Enable leftover creation, set servings
5. Confirm cooking

### Database Verification
```sql
SELECT id, status, cooked_at FROM meal_plans WHERE status = 'cooked';
SELECT id, remaining_servings, status FROM leftovers;
```

---

## Test 4: Leftovers

### Via API
```bash
curl "http://localhost:8000/api/leftovers?household_id=00000000-0000-0000-0000-000000000001"
```

### Via UI
1. Navigate to `/leftovers`
2. Verify leftover card displays
3. Test "Mark as consumed" action

### Database Verification
```sql
SELECT id, remaining_servings, status FROM leftovers;
```

---

## Test 5: Shopping List

### Via API
```bash
curl -X POST "http://localhost:8000/api/shopping-lists/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "household_id": "00000000-0000-0000-0000-000000000001",
    "start_date": "2026-01-20",
    "end_date": "2026-01-27",
    "name": "Test Shopping List"
  }'
```

### Via UI
1. Navigate to `/shopping`
2. Click "Generate" button
3. Set date range
4. Verify list appears with items

### Database Verification
```sql
SELECT id, name, status FROM shopping_lists;
```

---

## Test 6: Analytics

### Via API
```bash
# Cost Per Meal
curl "http://localhost:8000/api/analytics/cost-per-meal?household_id=00000000-0000-0000-0000-000000000001"

# Waste
curl "http://localhost:8000/api/analytics/waste?household_id=00000000-0000-0000-0000-000000000001"

# Spend Trend
curl "http://localhost:8000/api/analytics/spend-trend?household_id=00000000-0000-0000-0000-000000000001&start_date=2025-12-21&end_date=2026-01-20&granularity=weekly"

# Restock Predictions
curl "http://localhost:8000/api/analytics/restock-predictions?household_id=00000000-0000-0000-0000-000000000001"
```

### Via UI
1. Navigate to `/analytics`
2. Verify all 4 cards render:
   - Cost Per Meal
   - Waste
   - Spend Trend
   - Restock Predictions
3. Test period selector (Week/Month/30 days)

---

## Cleanup
```bash
docker exec kvitteringshvelv-db-1 psql -U postgres -d kvitteringshvelv -c "
DELETE FROM leftovers WHERE household_id = '00000000-0000-0000-0000-000000000001';
DELETE FROM shopping_list_items WHERE shopping_list_id IN (SELECT id FROM shopping_lists WHERE household_id = '00000000-0000-0000-0000-000000000001');
DELETE FROM shopping_lists WHERE household_id = '00000000-0000-0000-0000-000000000001';
DELETE FROM meal_plans WHERE household_id = '00000000-0000-0000-0000-000000000001';
DELETE FROM recipe_ingredients WHERE recipe_id IN (SELECT id FROM recipes WHERE household_id = '00000000-0000-0000-0000-000000000001');
DELETE FROM recipes WHERE household_id = '00000000-0000-0000-0000-000000000001';
"
```
