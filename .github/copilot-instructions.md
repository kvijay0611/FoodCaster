# Copilot Instructions for FoodCaster

## Project Overview
FoodCaster is a full-stack web app for recipe discovery, filtering, and user favorites. It uses a React + Vite frontend (`src/`) and a minimal Express backend (`server/`) with a JSON file database (`db.json`).

## Architecture
- **Frontend**: React (with hooks, context, and Tailwind CSS). Main entry: `src/App.jsx`. Pages and components are in `src/pages/` and `src/components/`.
  - **State Management**: Uses React Context (`src/contexts/AuthContext.jsx`) for authentication and favorites.
  - **Routing**: Single-page app, no react-router used for page navigation (all content rendered in `App.jsx`).
  - **Recipe Data**: Static recipes in `src/data/recipes.json` for filtering/search; user favorites are stored server-side.
- **Backend**: Express server (`server/server.js`) with endpoints for auth, favorites, and user management. Data is persisted in `server/db.json`.
  - **Auth**: JWT-based, with bcrypt for password hashing. Tokens stored in localStorage on frontend.
  - **Favorites**: Managed via API endpoints, linked to user email.

## Developer Workflows
- **Frontend**:
  - Start dev server: `npm run dev` (in project root)
  - Build: `npm run build`
  - Preview: `npm run preview`
- **Backend**:
  - Start server: `npm run dev` (in `server/` folder, uses nodemon)
  - Production: `npm start` (in `server/` folder)
- **Environment Variables**:
  - Frontend: Set `VITE_API_URL` in `.env` for API base URL
  - Backend: Set `PORT`, `JWT_SECRET` in `.env` (see `server/server.js`)

## Patterns & Conventions
- **Favorites Modal**: Opened via global event (`window.dispatchEvent(new CustomEvent("open-auth-modal"))`), handled in `Navbar.jsx`.
- **Auth**: All auth logic centralized in `AuthContext.jsx`. Use `useAuth()` hook for login, signup, logout, and favorites.
- **Recipe Filtering**: See `Home.jsx` for filtering logic (diet, time, difficulty, search query, detected ingredients).
- **API Communication**: Use `axios` for all API calls. Auth token is set in axios default headers when logged in.
- **Styling**: Tailwind CSS, configured in `tailwind.config.js` and `postcss.config.cjs`.

## Integration Points
- **EmailJS**: Used for contact form (see `Contact.jsx`).
- **Heroicons**: Used for UI icons.
- **Framer Motion**: Used for UI animations.

## Key Files
- `src/App.jsx`: Main app layout
- `src/pages/Home.jsx`: Home page, recipe grid, filtering
- `src/components/Navbar.jsx`: Navigation, modals
- `src/components/RecipeCard.jsx`: Recipe display, favorites
- `src/contexts/AuthContext.jsx`: Auth and favorites logic
- `server/server.js`: Express backend, API endpoints
- `server/db.json`: Persistent user/favorites data

## Example: Adding a New API Endpoint
- Add route in `server/server.js`
- Update frontend API calls in context/component
- Update types/interfaces if needed

---
For questions or unclear patterns, ask for clarification or review related files before making changes.