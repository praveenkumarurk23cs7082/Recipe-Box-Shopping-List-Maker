from typing import List
from sqlalchemy.orm import Session
from app import models


def add_ingredients_to_list(db: Session, ingredients: List[models.RecipeIngredient], multiplier: float = 1.0) -> None:
    """
    Consolidates recipe ingredients and adds them to the shopping list.
    - If an unchecked item with the same name and unit (case-insensitive) already exists, its quantity is summed.
    - Otherwise, a new shopping list item is created.
    - Wrapped in a transaction (db.commit / db.rollback on error) for safety.
    """
    try:
        # Fetch current unchecked shopping list items to check for matches
        existing_items = db.query(models.ShoppingListItem).filter(
            models.ShoppingListItem.is_checked == False
        ).all()

        for ing in ingredients:
            scaled_qty = ing.quantity * multiplier if ing.quantity is not None else None
            target_name = ing.name.strip().lower()
            target_unit = ing.unit.strip().lower() if ing.unit else None

            match = None
            for item in existing_items:
                item_name = item.name.strip().lower()
                item_unit = item.unit.strip().lower() if item.unit else None
                if item_name == target_name and item_unit == target_unit:
                    match = item
                    break

            if match:
                # Sum if both quantities are numbers; set to None if either is None (unscalable)
                if match.quantity is not None and scaled_qty is not None:
                    match.quantity += scaled_qty
                else:
                    match.quantity = None
            else:
                new_item = models.ShoppingListItem(
                    name=ing.name.strip(),
                    quantity=scaled_qty,
                    unit=ing.unit.strip() if ing.unit else None,
                    is_checked=False,
                    source_recipe_id=ing.recipe_id,
                )
                db.add(new_item)
                # Add to local list so if we have duplicate ingredients in the SAME payload,
                # they also consolidate with each other rather than creating multiple rows.
                existing_items.append(new_item)

        db.commit()
    except Exception:
        db.rollback()
        raise
