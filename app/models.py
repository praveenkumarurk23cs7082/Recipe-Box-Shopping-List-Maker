import enum

from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    Boolean,
    ForeignKey,
    DateTime,
    Enum as SAEnum,
    func,
)
from sqlalchemy.orm import relationship

from app.database import Base


class Category(str, enum.Enum):
    breakfast = "breakfast"
    dinner = "dinner"
    dessert = "dessert"


class Recipe(Base):
    """The source of truth for a recipe, always stored at its base (1x) servings."""

    __tablename__ = "recipes"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    category = Column(SAEnum(Category), nullable=False)
    prep_time_min = Column(Integer, nullable=True)
    base_servings = Column(Integer, nullable=False, default=4)  # the "1x" baseline
    image_url = Column(String, nullable=True)  # optional link to a recipe photo
    created_by = Column(String, nullable=True)  # Firebase uid of the owning user
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    ingredients = relationship(
        "RecipeIngredient",
        back_populates="recipe",
        cascade="all, delete-orphan",
        order_by="RecipeIngredient.sort_order",
    )


class RecipeIngredient(Base):
    """
    quantity/unit/name are stored SEPARATELY (not one free-text field) —
    this is what makes #3's servings scaler possible.
    quantity = None means #2's parser couldn't confidently parse the line
    (e.g. "a pinch of salt") — the UI shows raw_line as-is, unscaled.
    """

    __tablename__ = "recipe_ingredients"

    id = Column(Integer, primary_key=True, index=True)
    recipe_id = Column(Integer, ForeignKey("recipes.id", ondelete="CASCADE"), nullable=False)
    quantity = Column(Float, nullable=True)
    unit = Column(String, nullable=True)  # nullable for "2 eggs" (no unit)
    name = Column(String, nullable=False)
    raw_line = Column(String, nullable=False)  # original textarea line, kept for reference/debug
    sort_order = Column(Integer, default=0)

    recipe = relationship("Recipe", back_populates="ingredients")


class ShoppingListItem(Base):
    """
    Owned end-to-end by #3 (endpoints) but the table lives here since it's
    part of the shared schema #1 is responsible for defining up front.
    """

    __tablename__ = "shopping_list_items"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    quantity = Column(Float, nullable=True)
    unit = Column(String, nullable=True)
    is_checked = Column(Boolean, default=False, nullable=False)
    source_recipe_id = Column(Integer, ForeignKey("recipes.id"), nullable=True)  # traceability only
    user_id = Column(String, nullable=True, index=True)  # Firebase uid of the owning user
    added_at = Column(DateTime(timezone=True), server_default=func.now())
