/* ===================================================================
   Recipe Box — Frontend logic (Role #4)

   API CONTRACT — matches the real backend in Recipe-Box-Shopping-List-Maker
   (app/routers/recipes.py, app/schemas.py) exactly:

     GET    {API_BASE}/recipes                 -> 200, RecipeOut[]
     GET    {API_BASE}/recipes?category=X      -> 200, RecipeOut[]   (X = "breakfast"|"dinner"|"dessert")
     POST   {API_BASE}/recipes                 -> 201, RecipeOut
     PUT    {API_BASE}/recipes/:id             -> 200, RecipeOut
     DELETE {API_BASE}/recipes/:id             -> 204, no body

   Request body (RecipeCreate / RecipeUpdate):
     {
       title: string,
       category: "breakfast" | "dinner" | "dessert",   // lowercase — matches the DB enum
       prep_time_min: number | null,
       base_servings: number,                          // must be > 0
       ingredient_lines: string[]                       // raw textarea lines; #2's parser splits these server-side
     }

   Response body (RecipeOut) — note ingredients come back as PARSED OBJECTS,
   not strings, because #2's parser already ran server-side:
     {
       id: number,
       title: string,
       category: "breakfast" | "dinner" | "dessert",
       prep_time_min: number | null,
       base_servings: number,
       created_at: string,
       ingredients: [
         { id, quantity: number|null, unit: string|null, name: string, raw_line: string, sort_order: number }
       ]
     }

   If the API isn't reachable, this falls back to local mock data (same shape
   as RecipeOut) so the UI still works standalone for demoing.
=================================================================== */

const API_BASE = "https://recipe-backend-156431190697.asia-south1.run.app"; // live Cloud Run backend (#7's deployment)
// Local dev fallback — uncomment this line and comment the one above if running the backend locally:
// const API_BASE = "http://127.0.0.1:8000";

const CATEGORIES = [
  { value: "all", label: "All" },
  { value: "breakfast", label: "Breakfast" },
  { value: "dinner", label: "Dinner" },
  { value: "dessert", label: "Dessert" }
];

const MOCK_RECIPES = [
  {
    id: "mock-1",
    title: "Weeknight Chicken Stir-Fry",
    category: "dinner",
    prep_time_min: 25,
    base_servings: 4,
    ingredients: [
      { id: 1, quantity: 2, unit: null, name: "chicken breasts", raw_line: "2 chicken breasts", sort_order: 0 },
      { id: 2, quantity: 2, unit: "cup", name: "broccoli", raw_line: "2 cups broccoli", sort_order: 1 },
      { id: 3, quantity: 3, unit: "tbsp", name: "soy sauce", raw_line: "3 tbsp soy sauce", sort_order: 2 },
      { id: 4, quantity: 1, unit: null, name: "clove garlic", raw_line: "1 clove garlic", sort_order: 3 }
    ]
  },
  {
    id: "mock-2",
    title: "Overnight Oats",
    category: "breakfast",
    prep_time_min: 10,
    base_servings: 2,
    ingredients: [
      { id: 5, quantity: 1, unit: "cup", name: "rolled oats", raw_line: "1 cup rolled oats", sort_order: 0 },
      { id: 6, quantity: 1, unit: "cup", name: "milk", raw_line: "1 cup milk", sort_order: 1 },
      { id: 7, quantity: 1, unit: "tbsp", name: "honey", raw_line: "1 tbsp honey", sort_order: 2 }
    ]
  },
  {
    id: "mock-3",
    title: "Chocolate Chip Cookies",
    category: "dessert",
    prep_time_min: 20,
    base_servings: 12,
    ingredients: [
      { id: 8, quantity: 2, unit: "cup", name: "flour", raw_line: "2 cups flour", sort_order: 0 },
      { id: 9, quantity: 1, unit: "cup", name: "butter", raw_line: "1 cup butter", sort_order: 1 },
      { id: 10, quantity: 1, unit: "cup", name: "chocolate chips", raw_line: "1 cup chocolate chips", sort_order: 2 }
    ]
  }
];

// ---------------- State ----------------

let recipes = [];
let activeFilter = "all";
let usingMockData = false;
let recipeIdPendingDelete = null;

// ---------------- DOM refs ----------------

const dashboardView   = document.getElementById("dashboardView");
const formView        = document.getElementById("formView");
const filterRow        = document.getElementById("filterRow");
const recipeGrid       = document.getElementById("recipeGrid");
const emptyState       = document.getElementById("emptyState");
const statusBanner     = document.getElementById("statusBanner");

const recipeForm       = document.getElementById("recipeForm");
const formHeading      = document.getElementById("formHeading");
const recipeIdInput    = document.getElementById("recipeId");
const titleInput       = document.getElementById("title");
const categoryInput    = document.getElementById("category");
const prepTimeInput    = document.getElementById("prepTime");
const servingsInput    = document.getElementById("servings");
const ingredientsInput = document.getElementById("ingredients");
const titleError       = document.getElementById("titleError");
const ingredientsError = document.getElementById("ingredientsError");

const deleteDialog       = document.getElementById("deleteDialog");

// ---------------- Init ----------------

document.addEventListener("DOMContentLoaded", init);

async function init() {
  renderFilterChips();
  wireStaticEvents();
  await loadRecipes();
}

// ---------------- Data loading ----------------

async function loadRecipes() {
  try {
    const res = await fetch(`${API_BASE}/recipes`);
    if (!res.ok) throw new Error(`GET /recipes failed: ${res.status}`);
    recipes = await res.json();
    usingMockData = false;
    hideStatusBanner();
  } catch (err) {
    console.warn("Falling back to mock data:", err.message);
    recipes = structuredClone(MOCK_RECIPES);
    usingMockData = true;
    showStatusBanner(
      "Showing sample recipes — couldn't reach the recipe API yet. Changes here won't be saved to the server.",
      "error"
    );
  }
  renderRecipes();
}

async function createRecipe(recipe) {
  if (usingMockData) {
    const created = { ...recipe, id: `mock-${Date.now()}` };
    recipes.push(created);
    return created;
  }
  const res = await fetch(`${API_BASE}/recipes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(recipe)
  });
  if (!res.ok) throw new Error(`POST /recipes failed: ${res.status}`);
  const created = await res.json();
  recipes.push(created);
  return created;
}

async function updateRecipe(id, recipe) {
  if (usingMockData) {
    const idx = recipes.findIndex(r => String(r.id) === String(id));
    if (idx !== -1) recipes[idx] = { ...recipes[idx], ...recipe, id };
    return recipes[idx];
  }
  const res = await fetch(`${API_BASE}/recipes/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(recipe)
  });
  if (!res.ok) throw new Error(`PUT /recipes/${id} failed: ${res.status}`);
  const updated = await res.json();
  const idx = recipes.findIndex(r => String(r.id) === String(id));
  if (idx !== -1) recipes[idx] = updated;
  return updated;
}

async function deleteRecipe(id) {
  if (!usingMockData) {
    const res = await fetch(`${API_BASE}/recipes/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error(`DELETE /recipes/${id} failed: ${res.status}`);
  }
  recipes = recipes.filter(r => String(r.id) !== String(id));
}

// ---------------- Rendering: filter chips ----------------

function renderFilterChips() {
  filterRow.innerHTML = "";
  CATEGORIES.forEach(cat => {
    const chip = document.createElement("button");
    chip.className = "chip" + (cat.value === activeFilter ? " active" : "");
    chip.dataset.category = cat.value;
    chip.textContent = cat.label;
    chip.addEventListener("click", () => {
      activeFilter = cat.value;
      renderFilterChips();
      renderRecipes();
    });
    filterRow.appendChild(chip);
  });
}

// ---------------- Rendering: recipe grid ----------------

function renderRecipes() {
  const visible = activeFilter === "all"
    ? recipes
    : recipes.filter(r => r.category === activeFilter);

  recipeGrid.innerHTML = "";

  if (visible.length === 0) {
    emptyState.hidden = false;
    recipeGrid.hidden = true;
    return;
  }
  emptyState.hidden = true;
  recipeGrid.hidden = false;

  visible.forEach(recipe => recipeGrid.appendChild(buildRecipeCard(recipe)));
}

// Reusable recipe-card component. #5 can follow this same pattern
// (a small function that returns a DOM node from a data object) for
// whatever cards their screen needs.
function buildRecipeCard(recipe) {
  const card = document.createElement("article");
  card.className = "recipe-card";
  card.dataset.category = recipe.category;

  const title = document.createElement("h3");
  title.textContent = recipe.title;

  const prepDisplay = recipe.prep_time_min == null ? "—" : `${recipe.prep_time_min} min`;

  const meta = document.createElement("div");
  meta.className = "recipe-meta";
  meta.innerHTML = `
    <span>${escapeHtml(prepDisplay)}</span>
    <span>${escapeHtml(String(recipe.base_servings))} servings</span>
    <span>${recipe.ingredients.length} ingredients</span>
  `;

  const preview = document.createElement("p");
  preview.className = "recipe-ingredients-preview";
  preview.textContent = recipe.ingredients.map(ing => ing.raw_line).join(", ");

  const actions = document.createElement("div");
  actions.className = "recipe-card-actions";

  const editBtn = document.createElement("button");
  editBtn.className = "btn-icon";
  editBtn.textContent = "Edit";
  editBtn.addEventListener("click", () => openFormForEdit(recipe));

  const deleteBtn = document.createElement("button");
  deleteBtn.className = "btn-icon";
  deleteBtn.textContent = "Delete";
  deleteBtn.addEventListener("click", () => openDeleteDialog(recipe.id));

  actions.append(editBtn, deleteBtn);
  card.append(title, meta, preview, actions);
  return card;
}

// ---------------- View switching ----------------

function showDashboard() {
  formView.hidden = true;
  dashboardView.hidden = false;
}

function showForm() {
  dashboardView.hidden = true;
  formView.hidden = false;
}

function openFormForCreate() {
  recipeForm.reset();
  recipeIdInput.value = "";
  formHeading.textContent = "New recipe";
  clearFieldErrors();
  showForm();
  titleInput.focus();
}

function openFormForEdit(recipe) {
  recipeIdInput.value = recipe.id;
  titleInput.value = recipe.title;
  categoryInput.value = recipe.category;
  prepTimeInput.value = recipe.prep_time_min ?? "";
  servingsInput.value = recipe.base_servings;
  ingredientsInput.value = recipe.ingredients.map(ing => ing.raw_line).join("\n");
  formHeading.textContent = "Edit recipe";
  clearFieldErrors();
  showForm();
  titleInput.focus();
}

// ---------------- Form submit ----------------

async function handleFormSubmit(event) {
  event.preventDefault();
  clearFieldErrors();

  const title = titleInput.value.trim();
  const category = categoryInput.value; // already lowercase: "breakfast" | "dinner" | "dessert"
  const prep_time_min = prepTimeInput.value === "" ? null : Number(prepTimeInput.value);
  const base_servings = Number(servingsInput.value);
  const ingredient_lines = ingredientsInput.value
    .split("\n")
    .map(line => line.trim())
    .filter(Boolean);

  let hasError = false;
  if (!title) {
    titleError.textContent = "Give the recipe a title.";
    hasError = true;
  }
  if (ingredient_lines.length === 0) {
    ingredientsError.textContent = "Add at least one ingredient, one per line.";
    hasError = true;
  }
  if (!recipeForm.reportValidity()) hasError = true;
  if (hasError) return;

  const payload = { title, category, prep_time_min, base_servings, ingredient_lines };
  const existingId = recipeIdInput.value;

  const saveBtn = document.getElementById("saveBtn");
  saveBtn.disabled = true;
  saveBtn.textContent = "Saving...";

  try {
    if (existingId) {
      await updateRecipe(existingId, payload);
    } else {
      await createRecipe(payload);
    }
    showDashboard();
    renderRecipes();
  } catch (err) {
    console.error(err);
    showStatusBanner("Couldn't save that recipe. Check the connection and try again.", "error");
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = "Save recipe";
  }
}

function clearFieldErrors() {
  titleError.textContent = "";
  ingredientsError.textContent = "";
}

// ---------------- Delete flow ----------------

function openDeleteDialog(id) {
  recipeIdPendingDelete = id;
  deleteDialog.hidden = false;
}

function closeDeleteDialog() {
  recipeIdPendingDelete = null;
  deleteDialog.hidden = true;
}

async function confirmDelete() {
  if (recipeIdPendingDelete == null) return;
  try {
    await deleteRecipe(recipeIdPendingDelete);
    renderRecipes();
  } catch (err) {
    console.error(err);
    showStatusBanner("Couldn't delete that recipe. Try again.", "error");
  } finally {
    closeDeleteDialog();
  }
}

// ---------------- Status banner ----------------

function showStatusBanner(message, kind) {
  statusBanner.textContent = message;
  statusBanner.className = "status-banner" + (kind === "error" ? " error" : "");
  statusBanner.hidden = false;
}

function hideStatusBanner() {
  statusBanner.hidden = true;
}

// ---------------- Utilities ----------------

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// structuredClone polyfill for older browsers (safe no-op if native exists)
if (typeof structuredClone !== "function") {
  window.structuredClone = obj => JSON.parse(JSON.stringify(obj));
}

// ---------------- Wire static events ----------------

function wireStaticEvents() {
  document.getElementById("newRecipeBtn").addEventListener("click", openFormForCreate);
  document.getElementById("emptyStateNewBtn").addEventListener("click", openFormForCreate);
  document.getElementById("backToBoardBtn").addEventListener("click", showDashboard);
  document.getElementById("cancelFormBtn").addEventListener("click", showDashboard);
  recipeForm.addEventListener("submit", handleFormSubmit);

  document.getElementById("cancelDeleteBtn").addEventListener("click", closeDeleteDialog);
  document.getElementById("confirmDeleteBtn").addEventListener("click", confirmDelete);
}