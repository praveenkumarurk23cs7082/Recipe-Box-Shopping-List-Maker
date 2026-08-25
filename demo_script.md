# Recipe Box & Shopping List Maker — Live Demo Script

This document outlines the presentation flow and click-through order for the live panel demo.

---

## 1. Opening Statement
> **"For home cooks who meal-prep weekly and find themselves juggling scattered paper notes or copy-pasted text lists, Recipe Box is a simple, smart assistant that manages your recipes and automatically consolidates ingredients into a clean, deduplicated shopping checklist with a single click."**

---

## 2. Live Demo Click-Through Sequence

| Step | Action on Screen | Speech / Talking Points |
| :--- | :--- | :--- |
| **1. Dashboard & Filter** | Show the Recipe Dashboard. Click on **Breakfast**, **Dinner**, **Dessert**, and back to **All** chips. | *"We start at the Recipe Dashboard, which organizes our culinary library. With these category chips, a user can instantly filter their recipes by course—like Breakfast, Dinner, or Dessert—keeping their planning neat and focused."* |
| **2. Recipe Detail** | Open a recipe card (e.g., **Fluffy Buttermilk Pancakes**). Point to the ingredients list. | *"When we open a recipe, we see its detail view showing the original ingredients list, which was parsed automatically into structured data when the recipe was created."* |
| **3. Servings Scaling** | Click the **2x** chip, then the **4x** chip. Point to the updating quantities. | *"Notice that if we want to scale this meal up for guests, clicking 2x or 4x dynamically scales the numeric quantities instantly on the screen—while leaving non-numeric ingredients like 'a pinch of salt' perfectly readable as-is."* |
| **4. Add to Shopping List** | Set the multiplier to **2x** and click the **"Add to Shopping List"** button. | *"Now, we want to shop for this. We scale the pancakes to 2x and click 'Add to Shopping List'. The system confirms the items are added and updates our global shopping list badge in the navbar."* |
| **5. Headline Feature: Consolidation** | Go back to the dashboard. Open **Classic Chocolate Chip Cookies** (shares *flour* and *eggs*). Keep at **1x** and click **"Add to Shopping List"**. Navigate to the **Shopping List**. | **[Say this out loud & emphasize]**<br>*"Here is our headline feature: Instead of duplicating rows, the shopping list automatically consolidated overlapping ingredients like flour and eggs by matching their names and units and summing the quantities. We have one combined line item for each ingredient instead of a messy list!"* |
| **6. Checklist Interaction** | Click the checkboxes next to a couple of items. Show the strikethrough styling. | *"While walking down the grocery aisles, the user can check off items. Checked items instantly apply a clean strikethrough state, letting you know what is already in your cart."* |
| **7. Persistence Check** | Refresh the browser page. Show that checked items remain struck through. | *"And if your browser reloads or you lose connection in the store, your checklist state is safe—it persists directly in our database, not just temporarily on-screen."* |
| **8. Clear List** | Click **"Clear list"**, confirm the dialog, and show the empty state. | *"Once the shopping trip is complete, a single tap of 'Clear list' prompts for confirmation and sweeps the checklist clean, ready for next week's prep."* |

---

## 3. Technology Summary
> **"Our solution is built on a modern, decoupled stack: a lightweight, high-performance Python FastAPI backend backed by PostgreSQL on Google Cloud SQL, a responsive HTML5/Vanilla JS frontend hosted on Firebase Hosting, with fully automated CI/CD pipelines managed via Google Cloud Build."**

---

## 4. Presenter Assignments
We will split the presentation responsibilities across the team to showcase everyone's contributions:

* **Part 1: Context & Problem Statement (1 min)** — *Presenter: Backend Lead (#1) & DevOps (#7)*
  * Introduce the team and open with the problem statement.
  * Briefly explain the database schema (SQLAlchemy/Alembic) and GCP deployment architecture.
* **Part 2: Frontend & Core Dashboard (2 mins)** — *Presenter: Frontend Lead (#4) & Shared UI (#6)*
  * Share the screen and walk through the Recipe Dashboard.
  * Demonstrate category filtering and create a new recipe to show the form.
* **Part 3: Scaling & Headline Consolidation (2 mins)** — *Presenter: Frontend UI (#5) & QA/Demo Prep (#8)*
  * Demonstrate the servings scaling (1x -> 2x -> 4x).
  * Run the headline ingredient consolidation flow (adding two recipes with overlapping ingredients).
  * Demonstrate checking off items, page persistence, clearing the list, and wrap up with Q&A.
