import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app import models
from app.database import Base
from app.services.ingredient_parser import parse_ingredient_line
from app.services.shopping_list import add_ingredients_to_list

# Setup in-memory SQLite database for database testing
TEST_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db_session():
    # Create the tables in the in-memory database
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        # Drop the tables to clean up for the next test
        Base.metadata.drop_all(bind=engine)


# ==========================================
# 1. INGREDIENT PARSER TESTS
# ==========================================

@pytest.mark.parametrize(
    "line,expected",
    [
        # Standard formats
        ("2 cups flour", {"quantity": 2.0, "unit": "cup", "name": "flour"}),
        ("1.5 lbs beef", {"quantity": 1.5, "unit": "lb", "name": "beef"}),
        # Slash fractions
        ("1/2 cup sugar", {"quantity": 0.5, "unit": "cup", "name": "sugar"}),
        ("3/4 tsp cinnamon", {"quantity": 0.75, "unit": "tsp", "name": "cinnamon"}),
        # Unicode fractions
        ("½ cup butter", {"quantity": 0.5, "unit": "cup", "name": "butter"}),
        ("¼ cup cocoa", {"quantity": 0.25, "unit": "cup", "name": "cocoa"}),
        # Mixed numbers
        ("1 1/2 cups milk", {"quantity": 1.5, "unit": "cup", "name": "milk"}),
        ("2 ½ tbsp oil", {"quantity": 2.5, "unit": "tbsp", "name": "oil"}),
        # No unit
        ("2 eggs", {"quantity": 2.0, "unit": None, "name": "eggs"}),
        ("3 bananas", {"quantity": 3.0, "unit": None, "name": "bananas"}),
        # Unit normalization and cleaning punctuation
        ("2 Tablespoons cocoa", {"quantity": 2.0, "unit": "tbsp", "name": "cocoa"}),
        ("1 tbsp. vanilla extract", {"quantity": 1.0, "unit": "tbsp", "name": "vanilla extract"}),
        ("3 Cans tomatoes", {"quantity": 3.0, "unit": "can", "name": "tomatoes"}),
        # Fuzzy quantities (unscalable)
        ("a pinch of salt", {"quantity": None, "unit": None, "name": "a pinch of salt"}),
        ("salt to taste", {"quantity": None, "unit": None, "name": "salt to taste"}),
        ("freshly ground black pepper", {"quantity": None, "unit": None, "name": "freshly ground black pepper"}),
    ],
)
def test_parse_ingredient_line(line, expected):
    parsed = parse_ingredient_line(line)
    assert parsed["quantity"] == expected["quantity"]
    assert parsed["unit"] == expected["unit"]
    assert parsed["name"] == expected["name"]
    assert parsed["raw_line"] == line


# ==========================================
# 2. CONSOLIDATION LOGIC TESTS
# ==========================================

def test_add_ingredients_to_list_fresh(db_session):
    # Prepare ingredients to add
    ing1 = models.RecipeIngredient(recipe_id=1, quantity=2.0, unit="cup", name="flour", raw_line="2 cups flour")
    ing2 = models.RecipeIngredient(recipe_id=1, quantity=2.0, unit=None, name="eggs", raw_line="2 eggs")

    # Add to list
    add_ingredients_to_list(db_session, [ing1, ing2], multiplier=1.0)

    # Fetch from db
    items = db_session.query(models.ShoppingListItem).all()
    assert len(items) == 2

    # Map items by name
    items_map = {item.name: item for item in items}
    assert items_map["flour"].quantity == 2.0
    assert items_map["flour"].unit == "cup"
    assert items_map["flour"].is_checked is False

    assert items_map["eggs"].quantity == 2.0
    assert items_map["eggs"].unit is None
    assert items_map["eggs"].is_checked is False


def test_add_ingredients_consolidation_and_scaling(db_session):
    # 1. Add base recipe ingredients
    ing1 = models.RecipeIngredient(recipe_id=1, quantity=2.0, unit="cup", name="flour", raw_line="2 cups flour")
    ing2 = models.RecipeIngredient(recipe_id=1, quantity=2.0, unit=None, name="eggs", raw_line="2 eggs")
    add_ingredients_to_list(db_session, [ing1, ing2], multiplier=1.0)

    # 2. Add same ingredients from another recipe (or scaled at 2x)
    ing3 = models.RecipeIngredient(recipe_id=2, quantity=1.5, unit="CUP", name="Flour", raw_line="1.5 cups Flour")
    ing4 = models.RecipeIngredient(recipe_id=2, quantity=1.0, unit=None, name="Eggs", raw_line="1 Egg")
    add_ingredients_to_list(db_session, [ing3, ing4], multiplier=2.0)  # flour +3.0, eggs +2.0

    # Fetch and check
    items = db_session.query(models.ShoppingListItem).all()
    assert len(items) == 2  # Consolidated instead of adding duplicates!

    items_map = {item.name.lower(): item for item in items}
    assert items_map["flour"].quantity == 5.0  # 2.0 + (1.5 * 2.0)
    assert items_map["eggs"].quantity == 4.0   # 2.0 + (1.0 * 2.0)


def test_add_ingredients_fuzzy_not_consolidating_mathematically(db_session):
    # Add a fuzzy non-scalable item
    ing1 = models.RecipeIngredient(recipe_id=1, quantity=None, unit=None, name="salt to taste", raw_line="salt to taste")
    add_ingredients_to_list(db_session, [ing1], multiplier=1.0)

    # Add numeric item of same name
    ing2 = models.RecipeIngredient(recipe_id=2, quantity=1.0, unit="tsp", name="salt to taste", raw_line="1 tsp salt to taste")
    add_ingredients_to_list(db_session, [ing2], multiplier=1.0)

    # Fetch and check
    items = db_session.query(models.ShoppingListItem).all()
    # Should not merge because units and quantity types differ
    assert len(items) == 2


def test_add_ingredients_does_not_consolidate_checked_items(db_session):
    # 1. Add item
    ing1 = models.RecipeIngredient(recipe_id=1, quantity=2.0, unit="cup", name="flour", raw_line="2 cups flour")
    add_ingredients_to_list(db_session, [ing1], multiplier=1.0)

    # 2. Check the item off (strike-through)
    item = db_session.query(models.ShoppingListItem).filter_by(name="flour").first()
    item.is_checked = True
    db_session.commit()

    # 3. Add same item again
    add_ingredients_to_list(db_session, [ing1], multiplier=1.0)

    # Check
    items = db_session.query(models.ShoppingListItem).filter_by(name="flour").all()
    assert len(items) == 2  # One is checked (old), one is unchecked (new)
    assert items[0].is_checked is True
    assert items[1].is_checked is False
