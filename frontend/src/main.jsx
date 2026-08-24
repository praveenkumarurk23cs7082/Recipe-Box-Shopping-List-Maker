import { createRoot } from "react-dom/client";

import RecipeDetailPage from "./features/recipe-detail/RecipeDetailPage.jsx";

const recipePathPattern = /^\/recipes\/([^/]+)\/?$/;
const match = window.location.pathname.match(recipePathPattern);
const recipeId = match ? decodeURIComponent(match[1]) : null;

createRoot(document.getElementById("root")).render(
  <RecipeDetailPage recipeId={recipeId} />
);
