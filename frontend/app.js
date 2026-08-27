/* ===================================================================
   Recipe Box — Frontend logic
   Guest Mode + Complete UI Redesign Wiring
=================================================================== */

const API_BASE = "https://recipe-backend-156431190697.asia-south1.run.app"; 
// const API_BASE = "http://127.0.0.1:8000";

const MOCK_RECIPES = [
  {
    id: "mock-1",
    title: "Creamy Garlic Pasta",
    category: "dinner",
    prep_time_min: 25,
    base_servings: 2,
    ingredients: [
      { raw_line: "8 oz pasta" },
      { raw_line: "2 tbsp butter" },
      { raw_line: "3 cloves garlic, minced" },
      { raw_line: "1 cup heavy cream" },
      { raw_line: "1/2 cup parmesan" },
      { raw_line: "Salt and pepper" }
    ],
    image_url: "https://images.unsplash.com/photo-1612874742237-6526221588e3?auto=format&fit=crop&w=600&q=75",
    created_at: new Date().toISOString()
  },
  {
    id: "mock-2",
    title: "Morning Berry Smoothie",
    category: "breakfast",
    prep_time_min: 5,
    base_servings: 1,
    ingredients: [
      { raw_line: "1 cup mixed berries" },
      { raw_line: "1/2 banana" },
      { raw_line: "1/2 cup greek yogurt" },
      { raw_line: "1/2 cup almond milk" },
      { raw_line: "1 tbsp honey" }
    ],
    image_url: "https://images.unsplash.com/photo-1553530666-ba11a90a2569?auto=format&fit=crop&w=600&q=75",
    created_at: new Date().toISOString()
  },
  {
    id: "mock-3",
    title: "Lemon Herb Roasted Chicken",
    category: "dinner",
    prep_time_min: 60,
    base_servings: 4,
    ingredients: [
      { raw_line: "1 whole chicken" },
      { raw_line: "2 lemons" },
      { raw_line: "3 sprigs rosemary" },
      { raw_line: "4 cloves garlic" },
      { raw_line: "2 tbsp olive oil" },
      { raw_line: "Salt and pepper" }
    ],
    image_url: "https://images.unsplash.com/photo-1598514982205-f36b96d1e8d4?auto=format&fit=crop&w=600&q=75",
    created_at: new Date().toISOString()
  }
];

const firebaseConfig = {
  apiKey: "AIzaSyCn3zNctmuDfq1rjXzLxy-mIgbtKMrMTek",
  authDomain: "recipe-shopping-mvp.firebaseapp.com",
  projectId: "recipe-shopping-mvp",
  storageBucket: "recipe-shopping-mvp.firebasestorage.app",
  messagingSenderId: "156431190697",
  appId: "1:156431190697:web:0aa14c624c1e61388437b8"
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

const CATEGORIES = [
  { value: "all", label: "All" },
  { value: "breakfast", label: "Breakfast" },
  { value: "dinner", label: "Dinner" },
  { value: "dessert", label: "Dessert" }
];

const MULTIPLIERS = [1, 2, 4];

// ---------------- State ----------------

let authState = "loading"; // 'loading' | 'guest' | 'authenticated'
let recipes = [];
let activeFilter = "all";
let searchQuery = "";
let usingMockData = false;
let recipeIdPendingDelete = null;
let currentImageUrl = null;
let activeDetailRecipe = null;
let activeMultiplier = 1;
let currentIdToken = null;
let currentUser = null;

// ---------------- DOM refs ----------------

// High-level App sections
const appLoadingOverlay = document.getElementById("appLoadingOverlay");
const loginPage         = document.getElementById("loginPage");
const appMain           = document.getElementById("appMain");
const authPromptModal   = document.getElementById("authPromptModal");

// Auth / User
const userProfile       = document.getElementById("userProfile");
const mobileUserProfile = document.getElementById("mobileUserProfile");
const userName         = document.getElementById("userName");
const signOutBtn       = document.getElementById("signOutBtn");
const mobileSignOutBtn = document.getElementById("mobileSignOutBtn");
const mobileProfileName= document.getElementById("mobileProfileName");
const mobileProfileAvatar = document.getElementById("mobileProfileAvatar");

// App Views
const dashboardView   = document.getElementById("dashboardView");
const formView        = document.getElementById("formView");
const detailView      = document.getElementById("detailView");
const shoppingListView= document.getElementById("shoppingListView");

// Data grids & filters
const filterRow        = document.getElementById("filterRow");
const recipeGrid          = document.getElementById("recipeGrid");
const emptyState          = document.getElementById("emptyState");
const noSearchResults     = document.getElementById("noSearchResults");
const statusBanner     = document.getElementById("statusBanner");

// Form
const recipeForm       = document.getElementById("recipeForm");
const formHeading      = document.getElementById("formHeading");
const recipeIdInput    = document.getElementById("recipeId");
const titleInput       = document.getElementById("title");
const imageFileInput   = document.getElementById("imageFile");
const imagePreview     = document.getElementById("imagePreview");
const imageUploadStatus= document.getElementById("imageUploadStatus");
const categoryInput    = document.getElementById("category");
const prepTimeInput    = document.getElementById("prepTime");
const servingsInput    = document.getElementById("servings");
const ingredientsInput = document.getElementById("ingredients");
const titleError       = document.getElementById("titleError");
const ingredientsError = document.getElementById("ingredientsError");
const scanFileInput    = document.getElementById("scanFile");
const scanStatus       = document.getElementById("scanStatus");

// Modals
const deleteDialog       = document.getElementById("deleteDialog");
const clearListDialog    = document.getElementById("clearListDialog");

// Detail view (Auth)
const detailTitle          = document.getElementById("detailTitle");
const detailMeta           = document.getElementById("detailMeta");
const multiplierGroup      = document.getElementById("multiplierGroup");
const detailIngredientList = document.getElementById("detailIngredientList");
const addToShoppingListBtn = document.getElementById("addToShoppingListBtn");
const addToListStatus      = document.getElementById("addToListStatus");
const detailImage          = document.getElementById("detailImage");
const detailImagePlaceholder = document.getElementById("detailImagePlaceholder");

// Shopping List
const shoppingListItemsEl  = document.getElementById("shoppingListItems");
const shoppingListEmpty    = document.getElementById("shoppingListEmpty");
const shoppingListCountBadge = document.getElementById("shoppingListCount");
const shoppingSubtitle     = document.getElementById("shoppingSubtitle");

// Loaders
const recipesLoading       = document.getElementById("recipesLoading");
const shoppingListLoading  = document.getElementById("shoppingListLoading");

// Header elements
const headerTitle       = document.getElementById("headerTitle");
const greetingText      = document.getElementById("greetingText");
const greetingSub       = document.getElementById("greetingSub");
const statRecipeCount   = document.getElementById("statRecipeCount");
const statCartCount     = document.getElementById("statCartCount");
const statCategoryCount = document.getElementById("statCategoryCount");
const searchInput       = document.getElementById("searchInput");

// Image Upload
const imageUploader     = document.getElementById("imageUploader");
const imageUploadPlaceholder = document.getElementById("imageUploadPlaceholder");
const imagePreviewOverlay = document.getElementById("imagePreviewOverlay");
const removeImageBtn    = document.getElementById("removeImageBtn");

// Buttons & Toggles
const editRecipeBtn     = document.getElementById("editRecipeBtn");
const deleteRecipeBtn   = document.getElementById("deleteRecipeBtn");
const browseRecipesBtn  = document.getElementById("browseRecipesBtn");
const sidebarToggle     = document.getElementById("sidebarToggle");
const sidebar           = document.getElementById("sidebar");
const headerCartBadge   = document.getElementById("headerCartBadge");
const mobileCartBadge   = document.getElementById("mobileCartBadge");

// Mobile nav
const mobileNavHome     = document.getElementById("mobileNavHome");
const mobileNavRecipes  = document.getElementById("mobileNavRecipes");
const mobileNavAdd      = document.getElementById("mobileNavAdd");
const mobileNavShopping = document.getElementById("mobileNavShopping");
const mobileNavProfile  = document.getElementById("mobileNavProfile");
const mobileProfilePanel= document.getElementById("mobileProfilePanel");

// Sidebar nav
const navHome       = document.getElementById("navHome");
const navRecipes    = document.getElementById("navRecipes");
const navAddRecipe  = document.getElementById("navAddRecipe");
const navShopping   = document.getElementById("navShopping");

const headerSearch = document.getElementById("headerSearch");

// ---------------- Auth ----------------

async function handleSignIn() {
  const provider = new firebase.auth.GoogleAuthProvider();
  try {
    await auth.signInWithPopup(provider);
  } catch (err) {
    console.error(err);
    showToast("Sign-in failed. Please try again.", "error");
  }
}

async function handleSignOut() {
  await auth.signOut();
}

function resetAppState() {
  recipes = [];
  activeFilter = "all";
  searchQuery = "";
  usingMockData = false;
  activeDetailRecipe = null;
  updateAllBadges(0);
}

// Require auth wrapper
function requireAuth(action) {
  if (authState === 'authenticated') {
    action();
  } else {
    showAuthPrompt();
  }
}

function showAuthPrompt() {
  authPromptModal.hidden = false;
}

function hideAuthPrompt() {
  authPromptModal.hidden = true;
}

auth.onAuthStateChanged(async (user) => {
  if (appLoadingOverlay) appLoadingOverlay.hidden = true;
  hideAuthPrompt();

  if (user) {
    authState = 'authenticated';
    currentUser = user;
    currentIdToken = await user.getIdToken();
    
    if (loginPage) loginPage.hidden = true;
    appMain.hidden = false;
    
    if (userProfile) userProfile.hidden = false;
    if (mobileUserProfile) mobileUserProfile.hidden = false;
    
    if (navRecipes) navRecipes.hidden = false;
    if (navAddRecipe) navAddRecipe.hidden = false;
    if (navShopping) navShopping.hidden = false;
    if (mobileNavRecipes) mobileNavRecipes.hidden = false;
    if (mobileNavAdd) mobileNavAdd.hidden = false;
    if (mobileNavShopping) mobileNavShopping.hidden = false;

    // Populate user info
    const displayName = user.displayName || user.email || "User";
    const initials = displayName.charAt(0).toUpperCase();

    if (userName) userName.textContent = displayName;
    if (document.getElementById("userAvatar")) document.getElementById("userAvatar").textContent = initials;
    if (document.getElementById("headerAvatar")) document.getElementById("headerAvatar").textContent = initials;
    if (mobileProfileName) mobileProfileName.textContent = displayName;
    if (mobileProfileAvatar) mobileProfileAvatar.textContent = initials;

    updateGreeting(displayName);
    showDashboard();
    
    await loadRecipes();
    await updateShoppingListBadge();
  } else {
    authState = 'guest';
    currentUser = null;
    currentIdToken = null;
    
    if (loginPage) loginPage.hidden = false;
    appMain.hidden = true;
    
    resetAppState();
  }
});

async function authFetch(url, options = {}) {
  const headers = new Headers(options.headers || {});
  if (currentIdToken) {
    headers.set("Authorization", `Bearer ${currentIdToken}`);
  }
  return fetch(url, { ...options, headers });
}

// ---------------- Init ----------------

document.addEventListener("DOMContentLoaded", () => {
  renderFilterChips();
  wireStaticEvents();
});

// ---------------- Data loading ----------------

async function loadRecipes() {
  if (recipesLoading) recipesLoading.hidden = false;
  if (recipeGrid) recipeGrid.hidden = true;
  if (emptyState) emptyState.hidden = true;
  if (noSearchResults) noSearchResults.hidden = true;

  try {
    const res = await authFetch(`${API_BASE}/recipes`);
    if (!res.ok) throw new Error(`GET /recipes failed: ${res.status}`);
    recipes = await res.json();
    usingMockData = false;
    hideStatusBanner();
  } catch (err) {
    console.warn("Falling back to mock data:", err.message);
    usingMockData = true;
    recipes = structuredClone(MOCK_RECIPES);
    if (authState === 'authenticated') {
      showStatusBanner(
        "Showing sample recipes - couldn't reach the recipe API. Changes won't be saved to the server.",
        "error"
      );
    }
  } finally {
    if (recipesLoading) recipesLoading.hidden = true;
  }
  renderRecipes();
  updateStats();
}

async function uploadImage(file) {
  const formData = new FormData();
  formData.append("file", file);
  const res = await authFetch(`${API_BASE}/upload/image`, { method: "POST", body: formData });
  if (!res.ok) throw new Error(`POST /upload/image failed: ${res.status}`);
  const data = await res.json();
  return data.url;
}

async function scanIngredients(file) {
  const formData = new FormData();
  formData.append("file", file);
  const res = await authFetch(`${API_BASE}/scan/ingredients`, { method: "POST", body: formData });
  if (!res.ok) throw new Error(`POST /scan/ingredients failed: ${res.status}`);
  const data = await res.json();
  return data.lines;
}

async function createRecipe(recipe) {
  if (usingMockData) {
    const created = { ...recipe, id: `mock-${Date.now()}` };
    recipes.push(created);
    return created;
  }
  const res = await authFetch(`${API_BASE}/recipes`, {
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
  const res = await authFetch(`${API_BASE}/recipes/${id}`, {
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
    const res = await authFetch(`${API_BASE}/recipes/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error(`DELETE /recipes/${id} failed: ${res.status}`);
  }
  recipes = recipes.filter(r => String(r.id) !== String(id));
}

async function addRecipeToShoppingList(recipeId, multiplier) {
  const res = await authFetch(`${API_BASE}/shopping-list/from-recipe/${recipeId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ multiplier })
  });
  if (!res.ok) throw new Error(`POST /shopping-list/from-recipe/${recipeId} failed: ${res.status}`);
  return res.json();
}

async function fetchShoppingList() {
  const res = await authFetch(`${API_BASE}/shopping-list`);
  if (!res.ok) throw new Error(`GET /shopping-list failed: ${res.status}`);
  return res.json();
}

async function toggleShoppingItemChecked(itemId) {
  const res = await authFetch(`${API_BASE}/shopping-list/${itemId}/check`, { method: "PATCH" });
  if (!res.ok) throw new Error(`PATCH /shopping-list/${itemId}/check failed: ${res.status}`);
  return res.json();
}

async function clearShoppingListApi() {
  const res = await authFetch(`${API_BASE}/shopping-list`, { method: "DELETE" });
  if (!res.ok) throw new Error(`DELETE /shopping-list failed: ${res.status}`);
}

// ---------------- Rendering: filter chips ----------------

function renderFilterChips() {
  [filterRow].forEach(container => {
    if (!container) return;
    container.innerHTML = "";
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
      container.appendChild(chip);
    });
  });
}

// ---------------- Rendering: recipe grid ----------------

function getFilteredRecipes() {
  let visible = activeFilter === "all"
    ? recipes
    : recipes.filter(r => r.category === activeFilter);

  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    visible = visible.filter(r =>
      r.title.toLowerCase().includes(q) ||
      r.category.toLowerCase().includes(q) ||
      r.ingredients.some(ing => ing.raw_line.toLowerCase().includes(q))
    );
  }
  return visible;
}

function renderRecipes() {
  const visible = getFilteredRecipes();
  const grid = recipeGrid;
  
  if (!grid) return;

  grid.innerHTML = "";
  
  if (emptyState) emptyState.hidden = true;
  if (noSearchResults) noSearchResults.hidden = true;
  
  if (visible.length === 0) {
    grid.hidden = true;
    if (searchQuery && recipes.length > 0) {
      if (noSearchResults) noSearchResults.hidden = false;
    } else {
      if (emptyState) emptyState.hidden = false;
    }
    return;
  }

  grid.hidden = false;

  visible.forEach((recipe, i) => {
    const card = buildRecipeCard(recipe);
    card.style.animationDelay = `${i * 0.05}s`;
    grid.appendChild(card);
  });
}

function buildRecipeCard(recipe) {
  const card = document.createElement("article");
  card.className = "recipe-card";
  card.dataset.category = recipe.category;

  // Image wrapper
  const imageWrap = document.createElement("div");
  imageWrap.className = "card-image-wrap";

  if (recipe.image_url) {
    const img = document.createElement("img");
    img.src = recipe.image_url;
    img.alt = recipe.title;
    img.className = "recipe-photo";
    img.addEventListener("error", () => {
      img.style.display = "none";
      const placeholder = buildNoImagePlaceholder(recipe.category);
      imageWrap.insertBefore(placeholder, img);
    });
    imageWrap.appendChild(img);
  } else {
    imageWrap.appendChild(buildNoImagePlaceholder(recipe.category));
  }

  const badge = document.createElement("span");
  badge.className = `card-category-badge badge-${recipe.category}`;
  badge.textContent = recipe.category;
  imageWrap.appendChild(badge);

  // Card body
  const body = document.createElement("div");
  body.className = "card-body";

  const title = document.createElement("h3");
  title.className = "card-title";
  title.textContent = recipe.title;

  const prepDisplay = recipe.prep_time_min == null ? "—" : `${recipe.prep_time_min} min`;

  const meta = document.createElement("div");
  meta.className = "card-meta";
  meta.innerHTML = `
    <span class="card-meta-item">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
      ${escapeHtml(prepDisplay)}
    </span>
    <span class="card-meta-item">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>
      ${escapeHtml(String(recipe.base_servings))}
    </span>
    <span class="card-meta-item">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
      ${recipe.ingredients.length} ingredients
    </span>
  `;

  const preview = document.createElement("p");
  preview.className = "card-ingredients-preview";
  preview.textContent = recipe.ingredients.map(ing => ing.raw_line).join(", ");

  const actions = document.createElement("div");
  actions.className = "card-actions";

  const viewBtn = document.createElement("button");
  viewBtn.className = "btn btn-outline card-view-btn";
  viewBtn.textContent = "View Recipe";
  viewBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    openRecipeDetail(recipe);
  });
  
  actions.appendChild(viewBtn);

  if (authState === 'authenticated') {
    const iconActions = document.createElement("div");
    iconActions.className = "card-icon-actions";

    const editBtn = document.createElement("button");
    editBtn.className = "card-icon-btn";
    editBtn.title = "Edit recipe";
    editBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`;
    editBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      openFormForEdit(recipe);
    });

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "card-icon-btn danger";
    deleteBtn.title = "Delete recipe";
    deleteBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>`;
    deleteBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      openDeleteDialog(recipe.id);
    });

    iconActions.append(editBtn, deleteBtn);
    actions.appendChild(iconActions);
  }

  body.append(title, meta, preview, actions);
  card.append(imageWrap, body);

  card.addEventListener("click", () => openRecipeDetail(recipe));

  return card;
}

function buildNoImagePlaceholder(category) {
  const div = document.createElement("div");
  div.className = "card-no-image";
  const colors = {
    breakfast: "linear-gradient(135deg, #FFF4DE 0%, #FFE4A0 100%)",
    dinner:    "linear-gradient(135deg, #E8EFE7 0%, #C2D4C2 100%)",
    dessert:   "linear-gradient(135deg, #F9EDE6 0%, #F0C4A8 100%)"
  };
  div.style.background = colors[category] || "linear-gradient(135deg, #F2EDE4 0%, #E7E3DA 100%)";
  div.innerHTML = `
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" opacity="0.4">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
      <circle cx="12" cy="13" r="4"/>
    </svg>`;
  return div;
}

// ---------------- View switching ----------------

function hideAllViews() {
  [dashboardView, formView, detailView, shoppingListView].forEach(v => {
    if (v) {
      v.hidden = true;
      v.classList.remove("active");
    }
  });
}

function setActiveNavItem(viewName) {
  [navHome, navRecipes, navAddRecipe, navShopping].forEach(el => {
    if (el) el.classList.remove("active");
  });
  [mobileNavHome, mobileNavRecipes, mobileNavAdd, mobileNavShopping, mobileNavProfile].forEach(el => {
    if (el) el.classList.remove("active");
  });

  if (viewName === "dashboard") {
    navHome?.classList.add("active");
    navRecipes?.classList.add("active");
    mobileNavHome?.classList.add("active");
    mobileNavRecipes?.classList.add("active");
    headerTitle.textContent = "Home";
    headerSearch.style.display = "";
  } else if (viewName === "form") {
    navAddRecipe?.classList.add("active");
    mobileNavAdd?.classList.add("active");
    headerTitle.textContent = recipeIdInput?.value ? "Edit Recipe" : "New Recipe";
    headerSearch.style.display = "none";
  } else if (viewName === "detail") {
    navRecipes?.classList.add("active");
    mobileNavRecipes?.classList.add("active");
    headerTitle.textContent = activeDetailRecipe?.title || "Recipe";
    headerSearch.style.display = "none";
  } else if (viewName === "shopping") {
    navShopping?.classList.add("active");
    mobileNavShopping?.classList.add("active");
    headerTitle.textContent = "Shopping List";
    headerSearch.style.display = "none";
  }
  sidebar?.classList.remove("open");
}

function showDashboard() {
  hideAllViews();
  dashboardView.hidden = false;
  dashboardView.classList.add("active");
  setActiveNavItem("dashboard");
}

function showForm() {
  hideAllViews();
  formView.hidden = false;
  formView.classList.add("active");
  setActiveNavItem("form");
}

function showDetail() {
  hideAllViews();
  detailView.hidden = false;
  detailView.classList.add("active");
  setActiveNavItem("detail");
}

function showShoppingList() {
  hideAllViews();
  shoppingListView.hidden = false;
  shoppingListView.classList.add("active");
  setActiveNavItem("shopping");
}

function resetImagePicker() {
  currentImageUrl = null;
  imageFileInput.value = "";
  imagePreview.src = "";
  imagePreview.style.display = "none";
  if (imageUploadPlaceholder) imageUploadPlaceholder.style.display = "";
  if (imagePreviewOverlay) imagePreviewOverlay.style.display = "none";
  if (imageUploader) imageUploader.classList.remove("has-image");
  imageUploadStatus.textContent = "";
  scanFileInput.value = "";
  scanStatus.textContent = "";
}

async function handleScanFileChange() {
  const file = scanFileInput.files[0];
  if (!file) return;

  scanStatus.textContent = "Scanning your photo for ingredients…";
  scanStatus.style.color = "var(--green-dark)";

  try {
    const lines = await scanIngredients(file);
    if (lines.length === 0) {
      scanStatus.textContent = "Couldn't find any ingredients in that photo. Try a clearer image.";
      scanStatus.style.color = "var(--terracotta)";
      return;
    }
    const existing = ingredientsInput.value.trim();
    ingredientsInput.value = existing ? `${existing}\n${lines.join("\n")}` : lines.join("\n");
    scanStatus.textContent = `✓ Found ${lines.length} ingredient${lines.length !== 1 ? "s" : ""} — review them below.`;
    scanStatus.style.color = "var(--green-dark)";
    showToast(`Found ${lines.length} ingredient${lines.length !== 1 ? "s" : ""} from your photo`, "success");
  } catch (err) {
    console.error(err);
    scanStatus.textContent = "Scan failed — try again or type ingredients manually.";
    scanStatus.style.color = "var(--terracotta)";
    showToast("Couldn't scan that photo. Try a clearer image.", "error");
  }
}

function openFormForCreate() {
  recipeForm.reset();
  recipeIdInput.value = "";
  resetImagePicker();
  formHeading.textContent = "Create a New Recipe";
  clearFieldErrors();
  showForm();
  titleInput.focus();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function openFormForEdit(recipe) {
  recipeIdInput.value = recipe.id;
  titleInput.value = recipe.title;
  resetImagePicker();
  if (recipe.image_url) {
    currentImageUrl = recipe.image_url;
    imagePreview.src = recipe.image_url;
    imagePreview.style.display = "block";
    if (imageUploadPlaceholder) imageUploadPlaceholder.style.display = "none";
    if (imagePreviewOverlay) imagePreviewOverlay.style.display = "flex";
    if (imageUploader) imageUploader.classList.add("has-image");
  }
  categoryInput.value = recipe.category;
  prepTimeInput.value = recipe.prep_time_min ?? "";
  servingsInput.value = recipe.base_servings;
  ingredientsInput.value = recipe.ingredients.map(ing => ing.raw_line).join("\n");
  formHeading.textContent = "Edit Recipe";
  clearFieldErrors();
  showForm();
  titleInput.focus();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ---------------- Recipe detail + servings scaler ----------------

function formatQuantity(quantity) {
  if (Number.isInteger(quantity)) return String(quantity);
  return String(Number(quantity.toFixed(3)));
}

function openRecipeDetail(recipe) {
  activeDetailRecipe = recipe;
  activeMultiplier = 1;

  const isGuest = authState === 'guest';
  
  detailTitle.textContent = recipe.title;

  const prepDisplay = recipe.prep_time_min == null ? "—" : `${recipe.prep_time_min} min`;
  detailMeta.innerHTML = `
    <span class="meta-chip">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
      ${escapeHtml(recipe.category)}
    </span>
    <span class="meta-chip">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
      ${escapeHtml(prepDisplay)}
    </span>
    <span class="meta-chip">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>
      ${escapeHtml(String(recipe.base_servings))} servings
    </span>
  `;

  // Image handling
  if (detailImage && detailImagePlaceholder) {
    if (recipe.image_url) {
      detailImage.src = recipe.image_url;
      detailImage.alt = recipe.title;
      detailImage.style.display = "block";
      detailImagePlaceholder.style.display = "none";
      detailImage.onerror = () => {
        detailImage.style.display = "none";
        detailImagePlaceholder.style.display = "flex";
      };
    } else {
      detailImage.style.display = "none";
      detailImagePlaceholder.style.display = "flex";
    }
  }

  // Auth specific buttons
  if (isGuest) {
    if (editRecipeBtn) editRecipeBtn.style.display = "none";
    if (deleteRecipeBtn) deleteRecipeBtn.style.display = "none";
  } else {
    if (editRecipeBtn) {
      editRecipeBtn.style.display = "flex";
      editRecipeBtn.onclick = () => openFormForEdit(recipe);
    }
    if (deleteRecipeBtn) {
      deleteRecipeBtn.style.display = "flex";
      deleteRecipeBtn.onclick = () => openDeleteDialog(recipe.id);
    }
    if (addToListStatus) addToListStatus.textContent = "";
  }

  // Reset scale buttons
  if (multiplierGroup) {
    Array.from(multiplierGroup.children).forEach(btn => {
      btn.classList.toggle("active", Number(btn.dataset.multiplier) === activeMultiplier);
    });
  }

  renderDetailIngredients();
  showDetail();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderDetailIngredients() {
  if (!detailIngredientList) return;
  detailIngredientList.innerHTML = "";
  activeDetailRecipe.ingredients.forEach((ingredient, i) => {
    const li = document.createElement("li");
    li.style.animationDelay = `${i * 0.04}s`;

    if (ingredient.quantity == null) {
      li.innerHTML = `<span class="ingredient-qty">—</span><span>${escapeHtml(ingredient.raw_line)}</span>`;
    } else {
      const scaledQuantity = ingredient.quantity * activeMultiplier;
      const qty = formatQuantity(scaledQuantity);
      const unit = ingredient.unit || "";
      li.innerHTML = `<span class="ingredient-qty">${escapeHtml(qty)}${unit ? " " + escapeHtml(unit) : ""}</span><span>${escapeHtml(ingredient.name)}</span>`;
    }
    detailIngredientList.appendChild(li);
  });
}

function handleMultiplierClick(event) {
  const btn = event.target.closest("[data-multiplier]");
  if (!btn) return;
  activeMultiplier = Number(btn.dataset.multiplier);
  
  if (multiplierGroup) {
    Array.from(multiplierGroup.children).forEach(c => {
      c.classList.toggle("active", c === btn);
    });
  }
  renderDetailIngredients();
}

async function handleAddToShoppingList() {
  if (!activeDetailRecipe) return;
  if (addToListStatus) addToListStatus.textContent = "";
  addToShoppingListBtn.disabled = true;

  const originalHtml = addToShoppingListBtn.innerHTML;
  addToShoppingListBtn.innerHTML = `
    <svg class="spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
    Adding…
  `;

  try {
    if (usingMockData) throw new Error("Shopping list requires the live API.");
    await addRecipeToShoppingList(activeDetailRecipe.id, activeMultiplier);
    await updateShoppingListBadge();
    showToast(`Ingredients added to your shopping list (${activeMultiplier}×)`, "success");
    addToShoppingListBtn.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
      Added!
    `;
    setTimeout(() => { addToShoppingListBtn.innerHTML = originalHtml; }, 2000);
  } catch (err) {
    console.error(err);
    addToShoppingListBtn.innerHTML = originalHtml;
    showToast("Couldn't add to shopping list. Try again.", "error");
  } finally {
    addToShoppingListBtn.disabled = false;
  }
}

async function updateShoppingListBadge() {
  try {
    const items = await fetchShoppingList();
    updateAllBadges(items.length);
    updateStats(null, items.length);
  } catch (err) {
    console.warn("Couldn't refresh shopping list badge:", err.message);
  }
}

function updateAllBadges(count) {
  if (shoppingListCountBadge) {
    shoppingListCountBadge.textContent = String(count);
    shoppingListCountBadge.hidden = count === 0;
  }
  if (headerCartBadge) {
    headerCartBadge.textContent = String(count);
    headerCartBadge.hidden = count === 0;
  }
  if (mobileCartBadge) {
    mobileCartBadge.textContent = String(count);
    mobileCartBadge.hidden = count === 0;
  }
}

// ---------------- Stats ----------------

function updateStats(recipeCount, cartCount) {
  const rc = recipeCount !== undefined ? recipeCount : recipes.length;
  if (statRecipeCount) statRecipeCount.textContent = String(rc);
  if (cartCount !== undefined && statCartCount) statCartCount.textContent = String(cartCount);
  if (statCategoryCount) {
    const cats = new Set(recipes.map(r => r.category));
    statCategoryCount.textContent = String(cats.size);
  }
}

// ---------------- Greeting ----------------

function updateGreeting(displayName) {
  const firstName = (displayName || "").split(" ")[0] || "there";
  const hour = new Date().getHours();
  let timeGreet = "Good morning";
  if (hour >= 12 && hour < 17) timeGreet = "Good afternoon";
  else if (hour >= 17) timeGreet = "Good evening";

  const emojis = ["👋", "🍳", "👨‍🍳", "🌿"];
  const emoji = emojis[Math.floor(Math.random() * emojis.length)];

  if (greetingText) greetingText.textContent = `${timeGreet}, ${firstName} ${emoji}`;
  if (greetingSub) greetingSub.textContent = "What's cooking today?";
}

// ---------------- Shopping list view ----------------

async function loadShoppingList() {
  shoppingListItemsEl.innerHTML = "";
  shoppingListLoading.hidden = false;
  shoppingListItemsEl.hidden = true;
  shoppingListEmpty.hidden = true;
  try {
    const items = await fetchShoppingList();
    renderShoppingListItems(items);
    updateAllBadges(items.length);
    updateStats(null, items.length);

    if (shoppingSubtitle) {
      if (items.length > 0) {
        const unchecked = items.filter(i => !i.is_checked).length;
        shoppingSubtitle.textContent = unchecked > 0
          ? `${unchecked} item${unchecked !== 1 ? "s" : ""} remaining`
          : "All items checked off!";
      } else {
        shoppingSubtitle.textContent = "Everything you need for your next meal.";
      }
    }
  } catch (err) {
    console.error(err);
    showToast("Couldn't load the shopping list. Check connection.", "error");
    showStatusBanner("Couldn't load the shopping list. Check the connection and try again.", "error");
  } finally {
    shoppingListLoading.hidden = true;
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

  items.forEach((item, i) => {
    const row = buildShoppingListRow(item);
    row.style.animationDelay = `${i * 0.04}s`;
    shoppingListItemsEl.appendChild(row);
  });
}

function buildShoppingListRow(item) {
  const li = document.createElement("li");
  li.className = "shopping-item" + (item.is_checked ? " checked" : "");

  const checkboxWrap = document.createElement("div");
  checkboxWrap.className = "shopping-checkbox-wrap";

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = item.is_checked;
  checkbox.addEventListener("change", () => handleToggleShoppingItem(item.id));

  const customCheck = document.createElement("div");
  customCheck.className = "shopping-checkbox-custom";

  checkboxWrap.append(checkbox, customCheck);

  const content = document.createElement("div");
  content.className = "shopping-item-content";

  const quantityAndUnit = [
    item.quantity == null ? null : formatQuantity(item.quantity),
    item.unit
  ].filter(Boolean).join(" ");

  const textEl = document.createElement("div");
  textEl.className = "shopping-item-text";
  textEl.textContent = quantityAndUnit ? `${quantityAndUnit} ${item.name}` : item.name;

  content.appendChild(textEl);
  li.append(checkboxWrap, content);
  return li;
}

async function handleToggleShoppingItem(itemId) {
  try {
    await toggleShoppingItemChecked(itemId);
    await loadShoppingList();
  } catch (err) {
    console.error(err);
    showToast("Couldn't update that item. Try again.", "error");
  }
}

function openClearListDialog() { clearListDialog.hidden = false; }
function closeClearListDialog() { clearListDialog.hidden = true; }

async function confirmClearList() {
  try {
    await clearShoppingListApi();
    await loadShoppingList();
    showToast("Shopping list cleared", "success");
  } catch (err) {
    console.error(err);
    showToast("Couldn't clear the shopping list. Try again.", "error");
  } finally {
    closeClearListDialog();
  }
}

// ---------------- Image upload ----------------

async function handleImageFileChange() {
  const file = imageFileInput.files[0];
  if (!file) return;

  imageUploadStatus.textContent = "Uploading…";
  imageUploadStatus.style.color = "var(--ink-muted)";

  try {
    const url = await uploadImage(file);
    currentImageUrl = url;
    imagePreview.src = url;
    imagePreview.style.display = "block";
    if (imageUploadPlaceholder) imageUploadPlaceholder.style.display = "none";
    if (imagePreviewOverlay) imagePreviewOverlay.style.display = "flex";
    if (imageUploader) imageUploader.classList.add("has-image");
    imageUploadStatus.textContent = "Photo uploaded.";
    imageUploadStatus.style.color = "var(--green)";
    showToast("Recipe photo uploaded", "success");
  } catch (err) {
    console.error(err);
    currentImageUrl = null;
    imagePreview.style.display = "none";
    if (imageUploadPlaceholder) imageUploadPlaceholder.style.display = "";
    if (imagePreviewOverlay) imagePreviewOverlay.style.display = "none";
    if (imageUploader) imageUploader.classList.remove("has-image");
    imageUploadStatus.textContent = "Upload failed — try a different image.";
    imageUploadStatus.style.color = "var(--terracotta)";
    showToast("Image upload failed. Try again.", "error");
  }
}

function handleRemoveImage() {
  currentImageUrl = null;
  imageFileInput.value = "";
  imagePreview.src = "";
  imagePreview.style.display = "none";
  if (imageUploadPlaceholder) imageUploadPlaceholder.style.display = "";
  if (imagePreviewOverlay) imagePreviewOverlay.style.display = "none";
  if (imageUploader) imageUploader.classList.remove("has-image");
  imageUploadStatus.textContent = "";
}

// ---------------- Form submit ----------------

async function handleFormSubmit(event) {
  event.preventDefault();
  clearFieldErrors();

  const title = titleInput.value.trim();
  const image_url = currentImageUrl;
  const category = categoryInput.value;
  const prep_time_min = prepTimeInput.value === "" ? null : Number(prepTimeInput.value);
  const base_servings = Number(servingsInput.value);
  const ingredient_lines = ingredientsInput.value
    .split("\n")
    .map(line => line.trim())
    .filter(Boolean);

  let hasError = false;
  if (!title) { titleError.textContent = "Give the recipe a title."; hasError = true; }
  if (ingredient_lines.length === 0) { ingredientsError.textContent = "Add at least one ingredient, one per line."; hasError = true; }
  if (!recipeForm.reportValidity()) hasError = true;
  if (hasError) return;

  const payload = { title, category, prep_time_min, base_servings, image_url, ingredient_lines };
  const existingId = recipeIdInput.value;

  const saveBtn = document.getElementById("saveBtn");
  const originalHtml = saveBtn.innerHTML;
  saveBtn.disabled = true;
  saveBtn.innerHTML = `
    <svg class="spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
    Saving…
  `;

  try {
    if (existingId) {
      await updateRecipe(existingId, payload);
      showToast("Recipe updated!", "success");
    } else {
      await createRecipe(payload);
      showToast("Recipe saved to your cookbook!", "success");
    }
    showDashboard();
    renderRecipes();
    updateStats();
  } catch (err) {
    console.error(err);
    showToast("Couldn't save that recipe. Check the connection.", "error");
    showStatusBanner("Couldn't save that recipe. Check the connection and try again.", "error");
  } finally {
    saveBtn.disabled = false;
    saveBtn.innerHTML = originalHtml;
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
  const btn = document.getElementById("confirmDeleteBtn");
  btn.textContent = "Deleting…";
  btn.disabled = true;
  try {
    await deleteRecipe(recipeIdPendingDelete);
    renderRecipes();
    updateStats();
    showDashboard();
    showToast("Recipe deleted", "success");
  } catch (err) {
    console.error(err);
    showToast("Couldn't delete that recipe. Try again.", "error");
  } finally {
    btn.textContent = "Delete Recipe";
    btn.disabled = false;
    closeDeleteDialog();
  }
}

// ---------------- Status banner ----------------

function showStatusBanner(message, kind) {
  statusBanner.textContent = message;
  statusBanner.className = "status-banner" + (kind === "error" ? " error" : "");
  statusBanner.hidden = false;
}

function hideStatusBanner() { statusBanner.hidden = true; }

// ---------------- Toast system ----------------

const toastContainer = document.getElementById("toastContainer");

function showToast(message, type = "success") {
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;

  const iconSvg = type === "success"
    ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>`
    : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;

  toast.innerHTML = `
    <span class="toast-icon">${iconSvg}</span>
    <span class="toast-message">${escapeHtml(message)}</span>
    <button class="toast-dismiss" aria-label="Dismiss">×</button>
  `;

  toast.querySelector(".toast-dismiss").addEventListener("click", () => dismissToast(toast));
  toastContainer.appendChild(toast);

  const timer = setTimeout(() => dismissToast(toast), 3500);
  toast._dismissTimer = timer;
}

function dismissToast(toast) {
  clearTimeout(toast._dismissTimer);
  toast.classList.add("toast-out");
  toast.addEventListener("animationend", () => toast.remove(), { once: true });
}

// ---------------- Utilities ----------------

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

const spinStyle = document.createElement("style");
spinStyle.textContent = `.spin { animation: spin 0.8s linear infinite; } @keyframes spin { to { transform: rotate(360deg); } }`;
document.head.appendChild(spinStyle);

if (typeof structuredClone !== "function") {
  window.structuredClone = obj => JSON.parse(JSON.stringify(obj));
}

// ---------------- Wire static events ----------------

function wireStaticEvents() {
  
  // Auth Triggers
  signOutBtn.addEventListener("click", handleSignOut);
  if (mobileSignOutBtn) mobileSignOutBtn.addEventListener("click", handleSignOut);
  
  const headerUserMenu = document.getElementById("headerUserMenu");
  if (headerUserMenu) {
    headerUserMenu.addEventListener("click", handleSignOut);
    headerUserMenu.title = "Sign out";
  }

  // Auth Prompts
  const signInButtons = ["loginPageSignInBtn", "heroSignInBtn", "ctaSignInBtn", "authPromptSignInBtn"];
  signInButtons.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("click", handleSignIn);
  });
  
  const authPromptCancelBtn = document.getElementById("authPromptCancelBtn");
  if (authPromptCancelBtn) authPromptCancelBtn.addEventListener("click", hideAuthPrompt);

  // Navbar scroll styling
  const publicNav = document.getElementById("publicNav");
  window.addEventListener("scroll", () => {
    if (publicNav) publicNav.classList.toggle("scrolled", window.scrollY > 10);
  }, { passive: true });

  // Protected Actions wrapped with requireAuth
  const openFormWrapped = () => requireAuth(openFormForCreate);
  document.getElementById("newRecipeBtn").addEventListener("click", openFormWrapped);
  document.getElementById("emptyStateNewBtn").addEventListener("click", openFormWrapped);
  if (navAddRecipe) navAddRecipe.addEventListener("click", openFormWrapped);
  if (mobileNavAdd) mobileNavAdd.addEventListener("click", openFormWrapped);
  
  if (imageFileInput) imageFileInput.addEventListener("change", () => requireAuth(handleImageFileChange));
  if (scanFileInput) scanFileInput.addEventListener("change", () => requireAuth(handleScanFileChange));

  // Auth App Navigation
  if (navHome) navHome.addEventListener("click", showDashboard);
  if (navRecipes) navRecipes.addEventListener("click", showDashboard);
  if (mobileNavHome) mobileNavHome.addEventListener("click", showDashboard);
  if (mobileNavRecipes) mobileNavRecipes.addEventListener("click", showDashboard);
  if (browseRecipesBtn) browseRecipesBtn.addEventListener("click", showDashboard);

  document.getElementById("backToBoardBtn").addEventListener("click", showDashboard);
  document.getElementById("cancelFormBtn").addEventListener("click", showDashboard);
  recipeForm.addEventListener("submit", (e) => requireAuth(() => handleFormSubmit(e)));
  
  if (removeImageBtn) removeImageBtn.addEventListener("click", () => requireAuth(handleRemoveImage));
  if (imageUploadPlaceholder) imageUploadPlaceholder.addEventListener("click", () => requireAuth(() => imageFileInput.click()));

  document.getElementById("cancelDeleteBtn").addEventListener("click", closeDeleteDialog);
  document.getElementById("confirmDeleteBtn").addEventListener("click", () => requireAuth(confirmDelete));

  // Auth Detail view
  document.getElementById("backToBoardFromDetailBtn").addEventListener("click", showDashboard);
  if (multiplierGroup) multiplierGroup.addEventListener("click", handleMultiplierClick);
  if (addToShoppingListBtn) addToShoppingListBtn.addEventListener("click", () => requireAuth(handleAddToShoppingList));

  // Auth Shopping list
  const openShoppingListWrapped = () => requireAuth(() => {
    showShoppingList();
    loadShoppingList();
  });
  document.getElementById("shoppingListNavBtn").addEventListener("click", openShoppingListWrapped);
  if (navShopping) navShopping.addEventListener("click", openShoppingListWrapped);
  if (mobileNavShopping) mobileNavShopping.addEventListener("click", openShoppingListWrapped);
  
  document.getElementById("backToBoardFromListBtn").addEventListener("click", showDashboard);
  document.getElementById("clearListBtn").addEventListener("click", () => requireAuth(openClearListDialog));
  document.getElementById("cancelClearListBtn").addEventListener("click", closeClearListDialog);
  document.getElementById("confirmClearListBtn").addEventListener("click", () => requireAuth(confirmClearList));

  // Search Auth
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      searchQuery = e.target.value.trim();
      renderRecipes();
    });
  }

  // Sidebar toggle
  if (sidebarToggle) {
    sidebarToggle.addEventListener("click", () => sidebar.classList.toggle("open"));
  }
  document.addEventListener("click", (e) => {
    if (sidebar && sidebar.classList.contains("open")) {
      if (!sidebar.contains(e.target) && !sidebarToggle.contains(e.target)) sidebar.classList.remove("open");
    }
  });

  // Mobile profile toggle
  if (mobileNavProfile) {
    mobileNavProfile.addEventListener("click", () => {
      if (mobileProfilePanel) {
        mobileProfilePanel.hidden = !mobileProfilePanel.hidden;
        mobileNavProfile.classList.toggle("active", !mobileProfilePanel.hidden);
      }
    });
  }
  document.addEventListener("click", (e) => {
    if (mobileProfilePanel && !mobileProfilePanel.hidden) {
      if (!mobileProfilePanel.contains(e.target) && !mobileNavProfile.contains(e.target)) {
        mobileProfilePanel.hidden = true;
        mobileNavProfile.classList.remove("active");
      }
    }
  });

  // Modals Overlay click
  deleteDialog.addEventListener("click", (e) => { if (e.target === deleteDialog) closeDeleteDialog(); });
  clearListDialog.addEventListener("click", (e) => { if (e.target === clearListDialog) closeClearListDialog(); });
  authPromptModal.addEventListener("click", (e) => { if (e.target === authPromptModal) hideAuthPrompt(); });

  // Escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (!deleteDialog.hidden) closeDeleteDialog();
      if (!clearListDialog.hidden) closeClearListDialog();
      if (!authPromptModal.hidden) hideAuthPrompt();
      if (sidebar?.classList.contains("open")) sidebar.classList.remove("open");
    }
  });
}