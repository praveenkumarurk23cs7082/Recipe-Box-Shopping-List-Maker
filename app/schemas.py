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
    # Frontend (#4) sends the raw textarea, split into one string per line.
    # This endpoint runs each line through the parser (owned by #2) before storing it.
    ingredient_lines: List[str] = Field(default_factory=list)


class RecipeUpdate(BaseModel):
    title: Optional[str] = None
    category: Optional[Category] = None
    prep_time_min: Optional[int] = None
    base_servings: Optional[int] = Field(default=None, gt=0)
    # If provided, REPLACES all existing ingredients for this recipe.
    ingredient_lines: Optional[List[str]] = None


class RecipeOut(BaseModel):
    id: int
    title: str
    category: Category
    prep_time_min: Optional[int]
    base_servings: int
    created_at: datetime
    ingredients: List[RecipeIngredientOut] = []

    class Config:
        from_attributes = True
