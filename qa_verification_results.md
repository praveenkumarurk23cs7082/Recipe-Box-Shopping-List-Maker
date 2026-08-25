# QA Verification & E2E Test Report

* **Date of Verification**: August 25, 2026
* **Target URL**: [Recipe Box Web App](https://recipe-shopping-mvp.web.app/)
* **Backend API Base**: `https://recipe-backend-156431190697.asia-south1.run.app`
* **Local Test Suite**: 20/20 unit tests passed.

---

## 📋 End-to-End Verification Checklist

| # | Feature / Test Step | Status | Observation / Verification Details |
| :--- | :--- | :---: | :--- |
| **1** | Create recipe with 5+ ingredient lines (including fuzzy) | **PASS** | Created recipe *"QA Cookies"* with 5 ingredients, including a fuzzy line *"a pinch of salt"*. Saved and displayed correctly. |
| **2** | Filter by category | **PASS** | Chips (*Breakfast*, *Dinner*, *Dessert*, *All*) filtered dashboard cards correctly. |
| **3** | Servings scaling in detail view | **PASS** | Quantities scaled correctly for **2x** and **4x** multipliers. The fuzzy ingredient *"a pinch of salt"* remained unchanged. |
| **4** | Add to list and UI feedback | **PASS** | Clicking "Add to Shopping List" at 2x changed the button state, showed a loading status, and updated the nav badge. |
| **5** | Ingredient Consolidation | **PASS** | Added *"Classic Pancakes"* (1x) with overlapping ingredients. Shopping list combined flour and eggs correctly (flour summed to 10 cups, eggs to 14) with no duplicate rows. |
| **6** | Checked persistence | **PASS** | Checking items (adding checkmark + strikethrough) persisted correctly after reloading the browser page. |
| **7** | Clear list | **PASS** | Destructive clear list triggered a confirmation dialog modal, cleared list on confirm, and set badge count to 0. |
| **8** | Delete recipe | **PASS** | Deleting the created recipe from the dashboard triggered a confirmation modal. Recipe was permanently removed. |
| **9** | Upload recipe photo | **DEVIATION** | Frontend upload triggers, but returns **404 Not Found** because the backend changes on `develop` have not yet been merged into `main` (which Cloud Run auto-deploys from). |
| **10** | Loading states | **PASS** | Dashboard displays the loading state before loading recipe cards, and form actions show appropriate progress loaders (e.g. "Adding..."). |

---

## 🛠️ Verification Logs & Screenshots
* **Interactive Run Recording**: [live_qa_run_v2_1787653744598.webp](file:///C:/Users/Praveenkumar/.gemini/antigravity-ide/brain/b3ace30c-ddae-4c51-83b0-755304912475/live_qa_run_v2_1787653744598.webp)
* **Initial Dashboard State**: ![recipe_box_loaded](file:///C:/Users/Praveenkumar/.gemini/antigravity-ide/brain/b3ace30c-ddae-4c51-83b0-755304912475/recipe_box_loaded_1787649721253.png)
* **Adding to Shopping List Loading/Badge**: ![click_feedback_1787654184952](file:///C:/Users/Praveenkumar/.gemini/antigravity-ide/brain/b3ace30c-ddae-4c51-83b0-755304912475/.system_generated/click_feedback/click_feedback_1787654184952.png)
* **Shopping List Checked persistence**: ![checked_items_both](file:///C:/Users/Praveenkumar/.gemini/antigravity-ide/brain/b3ace30c-ddae-4c51-83b0-755304912475/.system_generated/click_feedback/click_feedback_1787654438055.png)

---

## 🚩 Action Item for DevOps (#7)

> [!WARNING]
> **Action Required**: The `/upload/image` router and other database models on `develop` need to be merged into `main` to trigger Google Cloud Build and deploy the fully updated backend.
