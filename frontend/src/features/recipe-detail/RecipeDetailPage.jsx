import { useEffect, useState } from "react";

import {
  MalformedRecipeResponseError,
  RecipeNotFoundError,
  isRecipeResponse,
  recipeDetailClient
} from "./recipeDetailClient.js";
import "./recipeDetail.css";

const MULTIPLIERS = [1, 2, 4];

function formatQuantity(quantity) {
  if (Number.isInteger(quantity)) {
    return String(quantity);
  }

  return String(Number(quantity.toFixed(3)));
}

function getErrorMessage(error) {
  if (error instanceof RecipeNotFoundError) {
    return "This recipe could not be found.";
  }

  if (error instanceof MalformedRecipeResponseError) {
    return "The recipe data is incomplete or invalid.";
  }

  return "We could not load this recipe. Please try again.";
}

function IngredientRow({ ingredient, multiplier }) {
  if (ingredient.quantity === null) {
    return <li className="recipe-detail__ingredient">{ingredient.raw_line}</li>;
  }

  const scaledQuantity = ingredient.quantity * multiplier;
  const quantityAndUnit = [formatQuantity(scaledQuantity), ingredient.unit]
    .filter(Boolean)
    .join(" ");

  return (
    <li className="recipe-detail__ingredient">
      {quantityAndUnit} {ingredient.name}
    </li>
  );
}

/**
 * A feature-owned page. Role #6 can register recipeDetailRoute in the shared
 * router and place this page in the shared application layout.
 */
export default function RecipeDetailPage({
  recipeId,
  client = recipeDetailClient,
  onAddToShoppingList
}) {
  const [requestState, setRequestState] = useState(() => ({
    recipeId,
    status: recipeId ? "loading" : "error",
    error: recipeId ? undefined : new Error("A recipe ID is required.")
  }));
  const [multiplier, setMultiplier] = useState(1);
  const [addState, setAddState] = useState({ status: "idle" });

  useEffect(() => {
    let isCurrent = true;

    if (!recipeId) {
      return () => {
        isCurrent = false;
      };
    }

    client
      .getRecipe(recipeId)
      .then((recipe) => {
        if (!isRecipeResponse(recipe)) {
          throw new MalformedRecipeResponseError();
        }

        if (isCurrent) {
          setRequestState({ recipeId, status: "success", recipe });
          setMultiplier(1);
          setAddState({ status: "idle" });
        }
      })
      .catch((error) => {
        if (isCurrent) {
          setRequestState({ recipeId, status: "error", error });
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [client, recipeId]);

  const activeRequestState =
    requestState.recipeId === recipeId
      ? requestState
      : recipeId
        ? { status: "loading" }
        : { status: "error", error: new Error("A recipe ID is required.") };

  const orderedIngredients =
    activeRequestState.status === "success"
      ? [...activeRequestState.recipe.ingredients].sort(
          (first, second) => first.sort_order - second.sort_order
        )
      : [];

  if (activeRequestState.status === "loading") {
    return <main className="recipe-detail" aria-live="polite">Loading recipe…</main>;
  }

  if (activeRequestState.status === "error") {
    return (
      <main className="recipe-detail" role="alert">
        {getErrorMessage(activeRequestState.error)}
      </main>
    );
  }

  const { recipe } = activeRequestState;
  const shoppingListIsAvailable = typeof onAddToShoppingList === "function";

  async function handleAddToShoppingList() {
    if (!shoppingListIsAvailable) {
      return;
    }

    setAddState({ status: "loading" });
    try {
      await onAddToShoppingList(recipe, multiplier);
      setAddState({ status: "success" });
    } catch {
      setAddState({ status: "error" });
    }
  }

  return (
    <main className="recipe-detail" aria-labelledby="recipe-detail-title">
      <header className="recipe-detail__header">
        <p className="recipe-detail__category">{recipe.category}</p>
        <h1 id="recipe-detail-title">{recipe.title}</h1>
        <dl className="recipe-detail__metadata">
          <div>
            <dt>Preparation time</dt>
            <dd>
              {recipe.prep_time_min === null
                ? "Not provided"
                : `${recipe.prep_time_min} min`}
            </dd>
          </div>
          <div>
            <dt>Base servings</dt>
            <dd>{recipe.base_servings}</dd>
          </div>
        </dl>
      </header>

      <section className="recipe-detail__section">
        <label id="servings-label" htmlFor="servings-multiplier">
          Servings multiplier
        </label>
        <select
          id="servings-multiplier"
          value={multiplier}
          onChange={(event) => setMultiplier(Number(event.target.value))}
        >
          {MULTIPLIERS.map((value) => (
            <option key={value} value={value}>
              {value}x
            </option>
          ))}
        </select>
      </section>

      <section className="recipe-detail__section" aria-labelledby="ingredients-heading">
        <h2 id="ingredients-heading">Ingredients</h2>
        <ul className="recipe-detail__ingredients">
          {orderedIngredients.map((ingredient) => (
            <IngredientRow
              key={ingredient.id}
              ingredient={ingredient}
              multiplier={multiplier}
            />
          ))}
        </ul>
      </section>

      <section className="recipe-detail__actions" aria-live="polite">
        <button
          type="button"
          disabled={!shoppingListIsAvailable || addState.status === "loading"}
          onClick={handleAddToShoppingList}
          aria-describedby={
            shoppingListIsAvailable ? undefined : "shopping-list-unavailable"
          }
        >
          {addState.status === "loading" ? "Adding…" : "Add to Shopping List"}
        </button>
        {!shoppingListIsAvailable && (
          <p id="shopping-list-unavailable" className="recipe-detail__helper-text">
            Shopping list integration unavailable.
          </p>
        )}
        {addState.status === "success" && <p>Added to shopping list.</p>}
        {addState.status === "error" && (
          <p role="alert">Unable to add this recipe to the shopping list.</p>
        )}
      </section>
    </main>
  );
}
