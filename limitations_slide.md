# Slide: Limitations & Future Work

This document contains the presentation slide bullet points framing current MVP limitations as deliberate design choices and outlining next steps.

---

## 🛠️ Limitations (Deliberate MVP Scoping)

* **Smart Parsed Scaling with Graceful Degrade**
  * *Choice*: The scaling engine operates on a structured `<quantity> <unit> <ingredient>` pattern. Free-text lines (e.g., *"salt to taste"*, *"freshly ground pepper"*) bypass numerical scaling and degrade gracefully, displaying intact so that information is never lost.
* **Per-User Personalization via Google Sign-In**
  * *Choice*: Each user signs in with Google and sees only their own recipes and shopping list, verified server-side via a Firebase ID token on every request. No shared/anonymous access — this closes what was originally an MVP limitation.
* **Cost-Efficient Serverless Hosting, Warmed for Demos**
  * *Choice*: Deployed on Google Cloud Run with serverless auto-scaling. `min-instances=1` is set to keep one instance always warm, so there's no cold-start lag during live demos.

---

## 🚀 Future Roadmap

* **Category & Pantry Management**
  * Add custom category creation for recipes and store mapping to sort shopping lists by grocery store aisles.
* **Smart Autocomplete & Recommendations**
  * Suggest ingredients during creation based on a standardized database to reduce free-text entries.
* **Nutrition Information Integration**
  * Connect to third-party food APIs to automatically display macro and calorie breakdowns.
* **Shared/Collaborative Lists**
  * Allow a signed-in user to invite others to a shared shopping list (e.g. a household), building on top of the per-user model now in place.
