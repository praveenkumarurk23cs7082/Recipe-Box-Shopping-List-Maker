/* ===================================================================
   Recipe Box — Frontend logic (Role #4, extended with #5's servings
   scaler + shopping list, ported to vanilla JS)

   API CONTRACT — matches the real backend in Recipe-Box-Shopping-List-Maker
   (app/routers/recipes.py, app/routers/shopping_list.py, app/schemas.py)
   exactly:

     GET    {API_BASE}/recipes                 -> 200, RecipeOut[]
     GET    {API_BASE}/recipes?category=X      -> 200, RecipeOut[]   (X = "breakfast"|"dinner"|"dessert")
     POST   {API_BASE}/recipes                 -> 201, RecipeOut
     PUT    {API_BASE}/recipes/:id             -> 200, RecipeOut
     DELETE {API_BASE}/recipes/:id             -> 204, no body
     POST   {API_BASE}/upload/image            -> 200, { url: string }  (multipart/form-data, field name "file")

     POST   {API_BASE}/shopping-list/from-recipe/:id  -> 201, ShoppingListItemOut[]  (body: { multiplier: number })
     GET    {API_BASE}/shopping-list                  -> 200, ShoppingListItemOut[]
     PATCH  {API_BASE}/shopping-list/:itemId/check     -> 200, ShoppingListItemOut
     DELETE {API_BASE}/shopping-list                  -> 204, no body

   Request body (RecipeCreate / RecipeUpdate):
     {
       title: string,
       category: "breakfast" | "dinner" | "dessert",   // lowercase — matches the DB enum
       prep_time_min: number | null,
       base_servings: number,                          // must be > 0
       image_url: string | null,                        // set from the /upload/image response, not typed by hand
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
       image_url: string | null,
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

const MULTIPLIERS = [1, 2, 4];

const MOCK_RECIPES = [
  {
    id: "mock-1",
    title: "Weeknight Chicken Stir-Fry",
    category: "dinner",
    prep_time_min: 25,
    base_servings: 4,
    image_url: null,
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
    image_url: null,
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
    image_url: null,
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
let currentImageUrl = null; // set by the file-upload handler; sent as image_url on save
let activeDetailRecipe = null;
let activeMultiplier = 1;

// ---------------- DOM refs ----------------

const dashboardView   = document.getElementById("dashboardView");
const formView        = document.getElementById("formView");
const detailView      = document.getElementById("detailView");
const shoppingListView = document.getElementById("shoppingListView");
const filterRow        = document.getElementById("filterRow");
const recipeGrid       = document.getElementById("recipeGrid");
const emptyState       = document.getElementById("emptyState");
const statusBanner     = document.getElementById("statusBanner");

const recipeForm       = document.getElementById("recipeForm");
const formHeading      = document.getElementById("formHeading");
const recipeIdInput    = document.getElementById("recipeId");
const titleInput       = document.getElementById("title");
const imageFileInput   = document.getElementById("imageFile");
const imagePreview     = document.getElementById("imagePreview");
const imageUploadStatus = document.getElementById("imageUploadStatus");
const categoryInput    = document.getElementById("category");
const prepTimeInput    = document.getElementById("prepTime");
const servingsInput    = document.getElementById("servings");
const ingredientsInput = document.getElementById("ingredients");
const titleError       = document.getElementById("titleError");
const ingredientsError = document.getElementById("ingredientsError");

const deleteDialog       = document.getElementById("deleteDialog");

const detailTitle          = document.getElementById("detailTitle");
const detailMeta           = document.getElementById("detailMeta");
const multiplierGroup      = document.getElementById("multiplierGroup");
const detailIngredientList = document.getElementById("detailIngredientList");
const addToShoppingListBtn = document.getElementById("addToShoppingListBtn");
const addToListStatus      = document.getElementById("addToListStatus");

const shoppingListItemsEl  = document.getElementById("shoppingListItems");
const shoppingListEmpty    = document.getElementById("shoppingListEmpty");
const clearListDialog      = document.getElementById("clearListDialog");
const shoppingListCountBadge = document.getElementById("shoppingListCount");

// ---------------- Init ----------------

document.addEventListener("DOMContentLoaded", init);

async function init() {
  renderFilterChips();
  wireStaticEvents();
  await loadRecipes();
  await updateShoppingListBadge();
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

async function uploadImage(file) {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${API_BASE}/upload/image`, { method: "POST", body: formData });
  if (!res.ok) throw new Error(`POST /upload/image failed: ${res.status}`);
  const data = await res.json();
  return data.url;
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

async function addRecipeToShoppingList(recipeId, multiplier) {
  const res = await fetch(`${API_BASE}/shopping-list/from-recipe/${recipeId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ multiplier })
  });
  if (!res.ok) throw new Error(`POST /shopping-list/from-recipe/${recipeId} failed: ${res.status}`);
  return res.json();
}

async function fetchShoppingList() {
  const res = await fetch(`${API_BASE}/shopping-list`);
  if (!res.ok) throw new Error(`GET /shopping-list failed: ${res.status}`);
  return res.json();
}

async function toggleShoppingItemChecked(itemId) {
  const res = await fetch(`${API_BASE}/shopping-list/${itemId}/check`, { method: "PATCH" });
  if (!res.ok) throw new Error(`PATCH /shopping-list/${itemId}/check failed: ${res.status}`);
  return res.json();
}

async function clearShoppingListApi() {
  const res = await fetch(`${API_BASE}/shopping-list`, { method: "DELETE" });
  if (!res.ok) throw new Error(`DELETE /shopping-list failed: ${res.status}`);
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

function buildRecipeCard(recipe) {
  const card = document.createElement("article");
  card.className = "recipe-card";
  card.dataset.category = recipe.category;

  if (recipe.image_url) {
    const img = document.createElement("img");
    img.src = recipe.image_url;
    img.alt = recipe.title;
    img.className = "recipe-photo";
    img.addEventListener("error", () => { img.style.display = "none"; });
    card.appendChild(img);
  }

  const title = document.createElement("h3");
  title.textContent = recipe.title;
  title.className = "recipe-card-title";
  title.addEventListener("click", () => openRecipeDetail(recipe));

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

function hideAllViews() {
  dashboardView.hidden = true;
  formView.hidden = true;
  detailView.hidden = true;
  shoppingListView.hidden = true;
}

function showDashboard() {
  hideAllViews();
  dashboardView.hidden = false;
}

function showForm() {
  hideAllViews();
  formView.hidden = false;
}

function showDetail() {
  hideAllViews();
  detailView.hidden = false;
}

function showShoppingList() {
  hideAllViews();
  shoppingListView.hidden = false;
}

function resetImagePicker() {
  currentImageUrl = null;
  imageFileInput.value = "";
  imagePreview.src = "";
  imagePreview.style.display = "none";
  imageUploadStatus.textContent = "";
}

function openFormForCreate() {
  recipeForm.reset();
  recipeIdInput.value = "";
  resetImagePicker();
  formHeading.textContent = "New recipe";
  clearFieldErrors();
  showForm();
  titleInput.focus();
}

function openFormForEdit(recipe) {
  recipeIdInput.value = recipe.id;
  titleInput.value = recipe.title;
  resetImagePicker();
  if (recipe.image_url) {
    currentImageUrl = recipe.image_url;
    imagePreview.src = recipe.image_url;
    imagePreview.style.display = "block";
  }
  categoryInput.value = recipe.category;
  prepTimeInput.value = recipe.prep_time_min ?? "";
  servingsInput.value = recipe.base_servings;
  ingredientsInput.value = recipe.ingredients.map(ing => ing.raw_line).join("\n");
  formHeading.textContent = "Edit recipe";
  clearFieldErrors();
  showForm();
  titleInput.focus();
}

// ---------------- Recipe detail + servings scaler ----------------

function formatQuantity(quantity) {
  if (Number.isInteger(quantity)) {
    return String(quantity);
  }
  return String(Number(quantity.toFixed(3)));
}

function openRecipeDetail(recipe) {
  activeDetailRecipe = recipe;
  activeMultiplier = 1;

  detailTitle.textContent = recipe.title;
  const prepDisplay = recipe.prep_time_min == null ? "—" : `${recipe.prep_time_min} min`;
  detailMeta.innerHTML = `
    <span>${escapeHtml(prepDisplay)}</span>
    <span>${escapeHtml(String(recipe.base_servings))} base servings</span>
    <span>${recipe.category}</span>
  `;

  Array.from(multiplierGroup.children).forEach(chip => {
    chip.classList.toggle("active", Number(chip.dataset.multiplier) === activeMultiplier);
  });

  addToListStatus.textContent = "";
  renderDetailIngredients();
  showDetail();
}

function renderDetailIngredients() {
  detailIngredientList.innerHTML = "";
  activeDetailRecipe.ingredients.forEach(ingredient => {
    const li = document.createElement("li");
    if (ingredient.quantity == null) {
      li.textContent = ingredient.raw_line;
    } else {
      const scaledQuantity = ingredient.quantity * activeMultiplier;
      const quantityAndUnit = [formatQuantity(scaledQuantity), ingredient.unit]
        .filter(Boolean)
        .join(" ");
      li.textContent = `${quantityAndUnit} ${ingredient.name}`;
    }
    detailIngredientList.appendChild(li);
  });
}

function handleMultiplierClick(event) {
  const chip = event.target.closest("[data-multiplier]");
  if (!chip) return;
  activeMultiplier = Number(chip.dataset.multiplier);
  Array.from(multiplierGroup.children).forEach(c => {
    c.classList.toggle("active", c === chip);
  });
  renderDetailIngredients();
}

async function handleAddToShoppingList() {
  if (!activeDetailRecipe) return;
  addToListStatus.textContent = "Adding...";
  addToShoppingListBtn.disabled = true;
  try {
    if (usingMockData) {
      throw new Error("Shopping list requires the live API — mock mode is read-only for this.");
    }
    await addRecipeToShoppingList(activeDetailRecipe.id, activeMultiplier);
    addToListStatus.textContent = `Added at ${activeMultiplier}x — check the Shopping List.`;
    addToShoppingListBtn.textContent = "Added ✓";
    await updateShoppingListBadge();
    setTimeout(() => {
      addToShoppingListBtn.textContent = "Add to Shopping List";
    }, 1500);
  } catch (err) {
    console.error(err);
    addToListStatus.textContent = "Couldn't add to the shopping list. Try again.";
  } finally {
    addToShoppingListBtn.disabled = false;
  }
}

async function updateShoppingListBadge() {
  try {
    const items = await fetchShoppingList();
    if (items.length > 0) {
      shoppingListCountBadge.textContent = String(items.length);
      shoppingListCountBadge.hidden = false;
    } else {
      shoppingListCountBadge.hidden = true;
    }
  } catch (err) {
    console.warn("Couldn't refresh shopping list badge:", err.message);
  }
}
// ---------------- Shopping list view ----------------

async function loadShoppingList() {
  shoppingListItemsEl.innerHTML = "";
    try {
    const items = await fetchShoppingList();
    renderShoppingListItems(items);
    await updateShoppingListBadge();
  } catch (err) {
    console.error(err);
    showStatusBanner("Couldn't load the shopping list. Check the connection and try again.", "error");
  }
}

function renderShoppingListItems(items) {
  shoppingListItemsEl.innerHTML = "";

  if (items.length === 0) {
    shoppingListEmpty.hidden = false;
    shoppingListItemsEl.hidden = true;
    return;
  }
  shoppingListEmpty.hidden = true;
  shoppingListItemsEl.hidden = false;

  items.forEach(item => shoppingListItemsEl.appendChild(buildShoppingListRow(item)));
}

function buildShoppingListRow(item) {
  const li = document.createElement("li");
  li.className = "shopping-item" + (item.is_checked ? " checked" : "");

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = item.is_checked;
  checkbox.addEventListener("change", () => handleToggleShoppingItem(item.id));

  const label = document.createElement("span");
  const quantityAndUnit = [
    item.quantity == null ? null : formatQuantity(item.quantity),
    item.unit
  ].filter(Boolean).join(" ");
  label.textContent = quantityAndUnit ? `${quantityAndUnit} ${item.name}` : item.name;

  li.append(checkbox, label);
  return li;
}

async function handleToggleShoppingItem(itemId) {
  try {
    await toggleShoppingItemChecked(itemId);
    await loadShoppingList();
  } catch (err) {
    console.error(err);
    showStatusBanner("Couldn't update that item. Try again.", "error");
  }
}

function openClearListDialog() {
  clearListDialog.hidden = false;
}

function closeClearListDialog() {
  clearListDialog.hidden = true;
}

async function confirmClearList() {
  try {
    await clearShoppingListApi();
    await loadShoppingList();
  } catch (err) {
    console.error(err);
    showStatusBanner("Couldn't clear the shopping list. Try again.", "error");
  } finally {
    closeClearListDialog();
  }
}

// ---------------- Image upload ----------------

async function handleImageFileChange() {
  const file = imageFileInput.files[0];
  if (!file) return;

  imageUploadStatus.textContent = "Uploading...";
  try {
    const url = await uploadImage(file);
    currentImageUrl = url;
    imagePreview.src = url;
    imagePreview.style.display = "block";
    imageUploadStatus.textContent = "Uploaded.";
  } catch (err) {
    console.error(err);
    currentImageUrl = null;
    imagePreview.style.display = "none";
    imageUploadStatus.textContent = "Upload failed — try a different image.";
  }
}

// ---------------- Form submit ----------------

async function handleFormSubmit(event) {
  event.preventDefault();
  clearFieldErrors();

  const title = titleInput.value.trim();
  const image_url = currentImageUrl;
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

  const payload = { title, category, prep_time_min, base_servings, image_url, ingredient_lines };
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
  imageFileInput.addEventListener("change", handleImageFileChange);

  document.getElementById("cancelDeleteBtn").addEventListener("click", closeDeleteDialog);
  document.getElementById("confirmDeleteBtn").addEventListener("click", confirmDelete);

  document.getElementById("backToBoardFromDetailBtn").addEventListener("click", showDashboard);
  multiplierGroup.addEventListener("click", handleMultiplierClick);
  addToShoppingListBtn.addEventListener("click", handleAddToShoppingList);

  document.getElementById("shoppingListNavBtn").addEventListener("click", () => {
    showShoppingList();
    loadShoppingList();
  });
  document.getElementById("backToBoardFromListBtn").addEventListener("click", showDashboard);
  document.getElementById("clearListBtn").addEventListener("click", openClearListDialog);
  document.getElementById("cancelClearListBtn").addEventListener("click", closeClearListDialog);
  document.getElementById("confirmClearListBtn").addEventListener("click", confirmClearList);
}
