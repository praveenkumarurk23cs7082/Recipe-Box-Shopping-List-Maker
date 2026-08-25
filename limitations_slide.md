# Slide: Limitations & Future Work

This document contains the presentation slide bullet points framing current MVP limitations as deliberate design choices and outlining next steps.

---

## 🛠️ Limitations (Deliberate MVP Scoping)

* **Smart Parsed Scaling with Graceful Degrade**
  * *Choice*: The scaling engine operates on a structured `<quantity> <unit> <ingredient>` pattern. Free-text lines (e.g., *"salt to taste"*, *"freshly ground pepper"*) bypass numerical scaling and degrade gracefully, displaying intact so that information is never lost.
* **Shared Workspace Collaboration**
  * *Choice*: To keep the initial MVP launch zero-friction and fast to test, user authentication was scoped out. All demo users share a single, active shopping list workspace, simulating a collaborative household environment.
* **Cost-Efficient Serverless Hosting**
  * *Choice*: Deployed on Google Cloud Run utilizing serverless auto-scaling to zero to minimize running costs. A minor cold start may occur on the first request if the system has been idle.

---

## 🚀 Future Roadmap

* **Individual User Accounts & Multi-list Management**
  * Implement authentication to allow private recipe boxes and multiple shopping checklists.
* **Category & Pantry Management**
  * Add custom category creation for recipes and store mapping to sort shopping lists by grocery store aisles.
* **Smart Autocomplete & Recommendations**
  * Suggest ingredients during creation based on a standardized database to reduce free-text entries.
* **Nutrition Information Integration**
  * Connect to third-party food APIs to automatically display macro and calorie breakdowns.
