# Role #5 Recipe Detail feature

This is a deliberately small, isolated React/Vite foundation for Role #5 while
the shared frontend owned by Role #6 is unavailable. It does not provide shared
navigation, a global layout, or unrelated pages.

## Run locally

```bash
npm install
npm run dev
```

Open `/recipes/<recipeId>`. Set `VITE_API_BASE_URL` when the FastAPI server is
on a different origin; otherwise the browser uses the current origin. Example:

```bash
VITE_API_BASE_URL=http://127.0.0.1:8000 npm run dev
```

## Integration contract

Role #6 can replace this temporary `main.jsx` preview entry and register
`recipeDetailRoute` from `src/features/recipe-detail/recipeDetailRoute.js` in
the shared router. `RecipeDetailPage` accepts a `recipeId` and an optional
`client` prop, so it does not require a specific app-wide API layer.

Role #3 can provide `onAddToShoppingList(recipe, multiplier)` when its mounted
HTTP API contract is ready. Until then, the button remains visibly disabled and
makes no network request.
