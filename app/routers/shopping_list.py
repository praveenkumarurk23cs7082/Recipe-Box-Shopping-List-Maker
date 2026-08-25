"""
Shopping list router — all four MVP endpoints:

  POST   /shopping-list/from-recipe/{recipe_id}   Add (scaled) recipe ingredients to the list
  GET    /shopping-list                           Fetch all items
  PATCH  /shopping-list/{item_id}/check           Toggle checked/unchecked
  DELETE /shopping-list                           Clear the whole list
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db
from app.services.shopping_list import add_ingredients_to_list

router = APIRouter(prefix="/shopping-list", tags=["shopping-list"])
# ---------------------------------------------------------------------------
# POST /shopping-list/from-recipe/{recipe_id}
# ---------------------------------------------------------------------------

@router.post(
    "/from-recipe/{recipe_id}",
    response_model=List[schemas.ShoppingListItemOut],
    status_code=status.HTTP_201_CREATED,
    summary="Add a recipe's ingredients to the shopping list",
    description=(
        "Fetches the recipe, scales each ingredient by `multiplier`, and upserts "
        "into the active shopping list (same name+unit → quantities are summed). "
        "Returns the full list after the operation."
    ),
)
def add_recipe_to_shopping_list(
    recipe_id: int,
    payload: schemas.AddToListRequest,
    db: Session = Depends(get_db),
):
    recipe = db.get(models.Recipe, recipe_id)
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")

    if not recipe.ingredients:
        raise HTTPException(
            status_code=422,
            detail="Recipe has no ingredients — nothing to add to the shopping list.",
        )

    add_ingredients_to_list(db, recipe.ingredients, multiplier=payload.multiplier)

    return (
        db.query(models.ShoppingListItem)
        .order_by(models.ShoppingListItem.added_at.asc())
        .all()
    )


# ---------------------------------------------------------------------------
# GET /shopping-list
# ---------------------------------------------------------------------------

@router.get(
    "",
    response_model=List[schemas.ShoppingListItemOut],
    summary="Fetch the current shopping list",
    description="Returns every item (checked and unchecked), oldest-first.",
)
def get_shopping_list(db: Session = Depends(get_db)):
    return (
        db.query(models.ShoppingListItem)
        .order_by(models.ShoppingListItem.added_at.asc())
        .all()
    )
# ---------------------------------------------------------------------------
# PATCH /shopping-list/{item_id}/check
# ---------------------------------------------------------------------------
@router.patch(
    "/{item_id}/check",
    response_model=schemas.ShoppingListItemOut,
    summary="Toggle the checked state of a shopping list item",
    description="Flips `is_checked` — call again to un-check.",
)
def toggle_check(item_id: int, db: Session = Depends(get_db)):
    item = db.get(models.ShoppingListItem, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Shopping list item not found")

    item.is_checked = not item.is_checked
    db.commit()
    db.refresh(item)
    return item


# ---------------------------------------------------------------------------
# DELETE /shopping-list
# ---------------------------------------------------------------------------

@router.delete(
    "",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Clear the entire shopping list",
    description="Deletes **all** items from the list, checked or not. Use after a grocery trip.",
)
def clear_shopping_list(db: Session = Depends(get_db)):
    db.query(models.ShoppingListItem).delete(synchronize_session=False)
    db.commit()
    return None
