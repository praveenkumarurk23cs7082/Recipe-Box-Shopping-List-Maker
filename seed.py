"""
seed.py — populate recipe_box.db with sample recipes.
Run from the project root:
    python seed.py
Safe to run multiple times: skips recipes whose title already exists.
"""

from app.database import SessionLocal, engine
from app.models import Base, Recipe, RecipeIngredient, Category
from app.services.ingredient_parser import parse_ingredient_line

# ── Make sure all tables exist (idempotent) ────────────────────────────────
Base.metadata.create_all(bind=engine)

RECIPES = [
    # ── Breakfast ────────────────────────────────────────────────────────────
    {
        "title": "Fluffy Buttermilk Pancakes",
        "category": Category.breakfast,
        "prep_time_min": 15,
        "base_servings": 4,
        "ingredient_lines": [
            "2 cups flour",
            "2 tbsp sugar",
            "1 tsp baking powder",
            "1/2 tsp baking soda",
            "1/2 tsp salt",
            "2 cups buttermilk",
            "2 eggs",
            "3 tbsp melted butter",
            "1 tsp vanilla extract",
        ],
    },
    {
        "title": "Veggie Omelette",
        "category": Category.breakfast,
        "prep_time_min": 10,
        "base_servings": 1,
        "ingredient_lines": [
            "3 eggs",
            "2 tbsp milk",
            "1/2 cup diced bell peppers",
            "1/4 cup diced onion",
            "1/4 cup shredded cheddar",
            "1 tbsp olive oil",
            "salt to taste",
            "freshly ground black pepper",
        ],
    },
    {
        "title": "Overnight Oats",
        "category": Category.breakfast,
        "prep_time_min": 5,
        "base_servings": 2,
        "ingredient_lines": [
            "1 cup rolled oats",
            "1 cup milk",
            "1/2 cup Greek yogurt",
            "2 tbsp honey",
            "1/2 tsp cinnamon",
            "1/2 cup blueberries",
            "2 tbsp chia seeds",
        ],
    },
    # ── Dinner ───────────────────────────────────────────────────────────────
    {
        "title": "Classic Spaghetti Bolognese",
        "category": Category.dinner,
        "prep_time_min": 45,
        "base_servings": 4,
        "ingredient_lines": [
            "400 g spaghetti",
            "500 g ground beef",
            "1 can crushed tomatoes",
            "1 cup beef broth",
            "1 cup diced onion",
            "4 clove garlic",
            "2 tbsp olive oil",
            "1 tsp dried oregano",
            "1 tsp dried basil",
            "salt to taste",
            "freshly ground black pepper",
        ],
    },
    {
        "title": "Lemon Herb Roast Chicken",
        "category": Category.dinner,
        "prep_time_min": 90,
        "base_servings": 6,
        "ingredient_lines": [
            "1.5 kg whole chicken",
            "2 tbsp olive oil",
            "1 lemon",
            "4 clove garlic",
            "1 tsp dried thyme",
            "1 tsp dried rosemary",
            "1 tsp paprika",
            "salt to taste",
            "freshly ground black pepper",
        ],
    },
    {
        "title": "Creamy Tomato Basil Soup",
        "category": Category.dinner,
        "prep_time_min": 30,
        "base_servings": 4,
        "ingredient_lines": [
            "2 cans crushed tomatoes",
            "1 cup heavy cream",
            "1 cup diced onion",
            "3 clove garlic",
            "2 tbsp butter",
            "1 tsp sugar",
            "1/2 cup fresh basil leaves",
            "salt to taste",
            "freshly ground black pepper",
        ],
    },
    # ── Dessert ──────────────────────────────────────────────────────────────
    {
        "title": "Classic Chocolate Chip Cookies",
        "category": Category.dessert,
        "prep_time_min": 25,
        "base_servings": 24,
        "ingredient_lines": [
            "2 1/4 cups flour",
            "1 tsp baking soda",
            "1 tsp salt",
            "1 cup butter",
            "3/4 cup sugar",
            "3/4 cup brown sugar",
            "2 eggs",
            "2 tsp vanilla extract",
            "2 cups chocolate chips",
        ],
    },
    {
        "title": "Mango Panna Cotta",
        "category": Category.dessert,
        "prep_time_min": 20,
        "base_servings": 4,
        "ingredient_lines": [
            "2 cups heavy cream",
            "1/4 cup sugar",
            "1 tsp vanilla extract",
            "2 tsp gelatin powder",
            "3 tbsp cold water",
            "1 cup mango puree",
        ],
    },
    {
        "title": "Banana Bread",
        "category": Category.dessert,
        "prep_time_min": 70,
        "base_servings": 8,
        "ingredient_lines": [
            "3 bananas",
            "1/3 cup melted butter",
            "3/4 cup sugar",
            "1 egg",
            "1 tsp vanilla extract",
            "1 tsp baking soda",
            "a pinch of salt",
            "1 1/2 cups flour",
        ],
    },
]


def seed():
    db = SessionLocal()
    try:
        added = 0
        skipped = 0
        for data in RECIPES:
            existing = db.query(Recipe).filter(Recipe.title == data["title"]).first()
            if existing:
                skipped += 1
                continue

            recipe = Recipe(
                title=data["title"],
                category=data["category"],
                prep_time_min=data["prep_time_min"],
                base_servings=data["base_servings"],
            )
            for i, line in enumerate(data["ingredient_lines"]):
                line = line.strip()
                if not line:
                    continue
                parsed = parse_ingredient_line(line)
                recipe.ingredients.append(
                    RecipeIngredient(
                        quantity=parsed["quantity"],
                        unit=parsed["unit"],
                        name=parsed["name"],
                        raw_line=parsed["raw_line"],
                        sort_order=i,
                    )
                )
            db.add(recipe)
            added += 1

        db.commit()
        print(f"Seeded {added} recipes ({skipped} already existed - skipped).")
    except Exception as e:
        db.rollback()
        raise e
    finally:
        db.close()


if __name__ == "__main__":
    seed()
