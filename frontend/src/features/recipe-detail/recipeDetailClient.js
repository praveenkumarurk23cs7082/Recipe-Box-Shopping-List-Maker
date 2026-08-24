const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "";

function toApiUrl(path, baseUrl) {
  const normalizedBaseUrl = baseUrl.replace(/\/$/, "");
  return `${normalizedBaseUrl}${path}`;
}

export class RecipeNotFoundError extends Error {
  constructor() {
    super("Recipe not found");
    this.name = "RecipeNotFoundError";
  }
}

export class MalformedRecipeResponseError extends Error {
  constructor() {
    super("The recipe response was not in the expected format.");
    this.name = "MalformedRecipeResponseError";
  }
}

export function isRecipeResponse(value) {
  return Boolean(
    value &&
      typeof value === "object" &&
      typeof value.id === "number" &&
      typeof value.title === "string" &&
      typeof value.category === "string" &&
      (typeof value.prep_time_min === "number" || value.prep_time_min === null) &&
      typeof value.base_servings === "number" &&
      Array.isArray(value.ingredients) &&
      value.ingredients.every(
        (ingredient) =>
          ingredient &&
          typeof ingredient === "object" &&
          typeof ingredient.id === "number" &&
          (typeof ingredient.quantity === "number" || ingredient.quantity === null) &&
          (typeof ingredient.unit === "string" || ingredient.unit === null) &&
          typeof ingredient.name === "string" &&
          typeof ingredient.raw_line === "string" &&
          typeof ingredient.sort_order === "number"
      )
  );
}

export function createRecipeDetailClient({
  baseUrl = configuredBaseUrl,
  fetchImpl = fetch
} = {}) {
  return {
    async getRecipe(recipeId) {
      const response = await fetchImpl(
        toApiUrl(`/recipes/${encodeURIComponent(recipeId)}`, baseUrl)
      );

      if (response.status === 404) {
        throw new RecipeNotFoundError();
      }

      if (!response.ok) {
        throw new Error("Unable to load the recipe.");
      }

      let body;
      try {
        body = await response.json();
      } catch {
        throw new MalformedRecipeResponseError();
      }

      if (!isRecipeResponse(body)) {
        throw new MalformedRecipeResponseError();
      }

      return body;
    }
  };
}

export const recipeDetailClient = createRecipeDetailClient();
