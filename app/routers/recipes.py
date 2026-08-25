from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db
from app.services.ingredient_parser import parse_ingredient_line

router = APIRouter(prefix="/recipes", tags=["recipes"])


def _build_ingredient_rows(lines: List[str]) -> List[models.RecipeIngredient]:
    rows = []
    for i, line in enumerate(lines):
        line = line.strip()
        if not line:
            continue
        parsed = parse_ingredient_line(line)
        rows.append(
            models.RecipeIngredient(
                quantity=parsed["quantity"],
                unit=parsed["unit"],
                name=parsed["name"],
                raw_line=parsed["raw_line"],
                sort_order=i,
            )
        )
    return rows


@router.post("", response_model=schemas.RecipeOut, status_code=201)
def create_recipe(payload: schemas.RecipeCreate, db: Session = Depends(get_db)):
    recipe = models.Recipe(
        title=payload.title,
        category=payload.category,
        prep_time_min=payload.prep_time_min,
        base_servings=payload.base_servings,
        image_url=payload.image_url,
    )
    recipe.ingredients = _build_ingredient_rows(payload.ingredient_lines)
    db.add(recipe)
    db.commit()
    db.refresh(recipe)
    return recipe


@router.get("", response_model=List[schemas.RecipeOut])
def list_recipes(
    category: Optional[models.Category] = Query(default=None),
    db: Session = Depends(get_db),
):
    query = db.query(models.Recipe)
    if category:
        query = query.filter(models.Recipe.category == category)
    return query.order_by(models.Recipe.created_at.desc()).all()


@router.get("/{recipe_id}", response_model=schemas.RecipeOut)
def get_recipe(recipe_id: int, db: Session = Depends(get_db)):
    recipe = db.get(models.Recipe, recipe_id)
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    return recipe


@router.put("/{recipe_id}", response_model=schemas.RecipeOut)
def update_recipe(recipe_id: int, payload: schemas.RecipeUpdate, db: Session = Depends(get_db)):
    recipe = db.get(models.Recipe, recipe_id)
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")

    if payload.title is not None:
        recipe.title = payload.title
    if payload.category is not None:
        recipe.category = payload.category
    if payload.prep_time_min is not None:
        recipe.prep_time_min = payload.prep_time_min
    if payload.base_servings is not None:
        recipe.base_servings = payload.base_servings
    if payload.image_url is not None:
        recipe.image_url = payload.image_url
    if payload.ingredient_lines is not None:
        recipe.ingredients = _build_ingredient_rows(payload.ingredient_lines)

    db.commit()
    db.refresh(recipe)
    return recipe


@router.delete("/{recipe_id}", status_code=204)
def delete_recipe(recipe_id: int, db: Session = Depends(get_db)):
    recipe = db.get(models.Recipe, recipe_id)
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    db.delete(recipe)
    db.commit()
    return None