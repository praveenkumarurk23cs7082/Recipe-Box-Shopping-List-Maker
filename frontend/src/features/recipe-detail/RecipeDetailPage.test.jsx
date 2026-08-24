import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import RecipeDetailPage from "./RecipeDetailPage.jsx";
import { RecipeNotFoundError } from "./recipeDetailClient.js";

const recipe = {
  id: 7,
  title: "Pancakes",
  category: "breakfast",
  prep_time_min: 15,
  base_servings: 4,
  created_at: "2026-08-25T00:00:00Z",
  ingredients: [
    {
      id: 3,
      quantity: null,
      unit: null,
      name: "salt to taste",
      raw_line: "salt to taste",
      sort_order: 2
    },
    {
      id: 1,
      quantity: 2,
      unit: "cups",
      name: "flour",
      raw_line: "2 cups flour",
      sort_order: 0
    },
    {
      id: 2,
      quantity: 1.5,
      unit: null,
      name: "eggs",
      raw_line: "1.5 eggs",
      sort_order: 1
    }
  ]
};

function successfulClient(response = recipe) {
  return { getRecipe: vi.fn().mockResolvedValue(response) };
}

async function renderLoadedPage(options = {}) {
  render(
    <RecipeDetailPage recipeId="7" client={successfulClient()} {...options} />
  );
  await screen.findByRole("heading", { name: "Pancakes" });
}

describe("RecipeDetailPage", () => {
  it("renders fetched metadata and ingredients in sort order", async () => {
    await renderLoadedPage();

    expect(screen.getByText("breakfast")).toBeInTheDocument();
    expect(screen.getByText("15 min")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getAllByRole("listitem").map((item) => item.textContent)).toEqual([
      "2 cups flour",
      "1.5 eggs",
      "salt to taste"
    ]);
  });

  it("uses exactly 1x, 2x, and 4x and always scales from the base quantity", async () => {
    await renderLoadedPage();

    const selector = screen.getByLabelText("Servings multiplier");
    expect(screen.getAllByRole("option").map((option) => option.textContent)).toEqual([
      "1x",
      "2x",
      "4x"
    ]);
    expect(selector).toHaveValue("1");
    expect(screen.getByText("2 cups flour")).toBeInTheDocument();

    fireEvent.change(selector, { target: { value: "2" } });
    expect(screen.getByText("4 cups flour")).toBeInTheDocument();
    expect(screen.getByText("3 eggs")).toBeInTheDocument();

    fireEvent.change(selector, { target: { value: "4" } });
    expect(screen.getByText("8 cups flour")).toBeInTheDocument();
    expect(screen.getByText("6 eggs")).toBeInTheDocument();

    fireEvent.change(selector, { target: { value: "1" } });
    expect(screen.getByText("2 cups flour")).toBeInTheDocument();
  });

  it("does not mutate fetched recipe data while scaling", async () => {
    const immutableRecipe = {
      ...recipe,
      ingredients: recipe.ingredients.map((ingredient) => Object.freeze({ ...ingredient }))
    };
    Object.freeze(immutableRecipe.ingredients);
    Object.freeze(immutableRecipe);

    await renderLoadedPage({ client: successfulClient(immutableRecipe) });
    fireEvent.change(screen.getByLabelText("Servings multiplier"), {
      target: { value: "4" }
    });

    expect(immutableRecipe.ingredients[1].quantity).toBe(2);
    expect(immutableRecipe.ingredients[1].raw_line).toBe("2 cups flour");
  });

  it("keeps unparsed ingredients readable and unchanged at every multiplier", async () => {
    await renderLoadedPage();

    const selector = screen.getByLabelText("Servings multiplier");
    fireEvent.change(selector, { target: { value: "2" } });
    expect(screen.getByText("salt to taste")).toBeInTheDocument();
    fireEvent.change(selector, { target: { value: "4" } });
    expect(screen.getByText("salt to taste")).toBeInTheDocument();
    expect(screen.queryByText(/null salt|NaN|undefined/)).not.toBeInTheDocument();
  });

  it("shows a loading state before the recipe resolves", () => {
    render(
      <RecipeDetailPage
        recipeId="7"
        client={{ getRecipe: vi.fn().mockReturnValue(new Promise(() => {})) }}
      />
    );

    expect(screen.getByText("Loading recipe…")).toBeInTheDocument();
  });

  it("shows a not-found state", async () => {
    render(
      <RecipeDetailPage
        recipeId="404"
        client={{ getRecipe: vi.fn().mockRejectedValue(new RecipeNotFoundError()) }}
      />
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "This recipe could not be found."
    );
  });

  it("shows a general error state for API failures", async () => {
    render(
      <RecipeDetailPage
        recipeId="7"
        client={{ getRecipe: vi.fn().mockRejectedValue(new Error("Network down")) }}
      />
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "We could not load this recipe. Please try again."
    );
  });

  it("shows malformed-response state", async () => {
    render(
      <RecipeDetailPage
        recipeId="7"
        client={{ getRecipe: vi.fn().mockResolvedValue({ title: "Incomplete" }) }}
      />
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "The recipe data is incomplete or invalid."
    );
  });

  it("passes the selected multiplier to the shopping-list callback", async () => {
    const onAddToShoppingList = vi.fn().mockResolvedValue(undefined);
    await renderLoadedPage({ onAddToShoppingList });
    fireEvent.change(screen.getByLabelText("Servings multiplier"), {
      target: { value: "2" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Add to Shopping List" }));

    await waitFor(() =>
      expect(onAddToShoppingList).toHaveBeenCalledWith(recipe, 2)
    );
    expect(screen.getByText("Added to shopping list.")).toBeInTheDocument();
  });

  it("disables shopping-list interaction without a callback", async () => {
    await renderLoadedPage();

    expect(
      screen.getByRole("button", { name: "Add to Shopping List" })
    ).toBeDisabled();
    expect(
      screen.getByText("Shopping list integration unavailable.")
    ).toBeInTheDocument();
  });
});
