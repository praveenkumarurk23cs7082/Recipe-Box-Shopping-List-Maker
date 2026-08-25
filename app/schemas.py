from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field

from app.models import Category


class RecipeIngredientOut(BaseModel):
    id: int
    quantity: Optional[float]
    unit: Optional[str]
    name: str
    raw_line: str
    sort_order: int

    class Config:
        from_attributes = True  # lets pydantic read straight off the ORM object


class RecipeCreate(BaseModel):
    title: str
    category: Category
    prep_time_min: Optional[int] = None
    base_servings: int = Field(default=4, gt=0)
    image_url: Optional[str] = None
    # Frontend (#4) sends the raw textarea, split into one string per line.
    # This endpoint runs each line through the parser (owned by #2) before storing it.
    ingredient_lines: List[str] = Field(default_factory=list)


class RecipeUpdate(BaseModel):
    title: Optional[str] = None
    category: Optional[Category] = None
    prep_time_min: Optional[int] = None
    base_servings: Optional[int] = Field(default=None, gt=0)
    image_url: Optional[str] = None
    # If provided, REPLACES all existing ingredients for this recipe.
    ingredient_lines: Optional[List[str]] = None


class RecipeOut(BaseModel):
    id: int
    title: str
    category: Category
    prep_time_min: Optional[int]
    base_servings: int
    image_url: Optional[str] = None
    created_at: datetime
    ingredients: List[RecipeIngredientOut] = []

    class Config:
        from_attributes = True


# ---------------------------------------------------------------------------
# Shopping List schemas
# ---------------------------------------------------------------------------

class ShoppingListItemOut(BaseModel):
    id: int
    name: str
    quantity: Optional[float]
    unit: Optional[str]
    is_checked: bool
    source_recipe_id: Optional[int]
    added_at: datetime

    class Config:
        from_attributes = True


class AddToListRequest(BaseModel):
    """Body for POST /shopping-list/from-recipe/{recipe_id}."""
    multiplier: float = Field(default=1.0, gt=0, description="Serving multiplier: 1, 2, 4, etc.")