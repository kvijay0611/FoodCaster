# 🍳 FoodCaster — Your Smart Recipe Genie

FoodCaster is an intelligent web application that helps users **discover, customize, and manage recipes** based on ingredients, diet preferences, and time availability.  
It supports **ingredient image detection**, **personalized suggestions**, **nutrition scaling**, and **favorite tracking** — all wrapped in a smooth and responsive UI.

Deployed on **Vercel**: [https://food-caster.vercel.app](https://food-caster.vercel.app)

---

## 🚀 Features

### 🧠 Intelligent Recipe Search
- Search recipes by **name or ingredient**.
- Upload an **image of ingredients** — AI automatically detects the ingredients for you.
- Filter recipes by **diet**, **difficulty**, and **time**.

### 🍽️ Interactive Recipe View
- Adjustable **serving size** — automatically scales:
  - **Ingredient quantities**
  - **Nutrition values (calories, protein, carbs, fat)**
- Step instructions dynamically update with correct numeric quantities.

### ⭐ Rating System
- Each user can **rate a recipe once**.
- Clicking the same star again **undoes the rating**.
- Displays live **average rating** and total ratings count.

### ❤️ Favorites & Authentication
- Secure login/signup system.
- Users can **add/remove favorites** (saved in backend).
- Persistent session via local storage tokens.

### ✉️ Contact Form
- Sends feedback or messages directly via **EmailJS** integration.
- Validations with error messages and status indicators.

### 💌 Email Notifications (Configurable)
- Uses `nodemailer` or `EmailJS` for sending form submissions and notifications.

### 📱 Responsive Design
- Fully optimized for mobile, tablet, and desktop.
- Smooth **mobile drawer navigation** and adaptive layout.

---

## 🧰 Tech Stack

| Layer | Technology |
|-------|-------------|
| **Frontend** | React + Vite + TailwindCSS |
| **State Management** | React Context API |
| **Backend** | Node.js + Express + JSON-Server |
| **Auth & Storage** | JWT Tokens + LocalStorage |
| **Email/Contact** | EmailJS (fallback: nodemailer mock) |
| **Deployment** | Vercel |
| **Image Detection** | TensorFlow.js / Clarifai API (optional) |

---

## ⚙️ Project Structure

```
food-caster/
├── src/
│   ├── assets/                # images, icons
│   ├── components/            # all reusable UI components
│   │   ├── Navbar.jsx
│   │   ├── RecipeCard.jsx
│   │   ├── RecipeDetailModal.jsx
│   │   ├── AuthModal.jsx
│   │   ├── ImageDetect.jsx
│   │   ├── FavoritesModal.jsx
│   │   ├── ContactForm.jsx
│   │   └── ModalWrapper.jsx
│   ├── contexts/
│   │   └── AuthContext.jsx
│   ├── pages/
│   │   └── Home.jsx
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── public/
│   ├── favicon.ico
│   └── recipes.json           # master recipe dataset
├── server.js                  # Node.js + JSON-server backend
├── package.json
├── .env                       # environment variables
└── README.md
```

---

## 🧑‍💻 Local Development Setup

### 1️⃣ Clone the repository
```bash
git clone https://github.com/kvijay0611/FoodCaster.git
cd FoodCaster
```

### 2️⃣ Install dependencies
```bash
npm install
```

### 3️⃣ Create `.env` file
In the project root, add:
```env
# Backend
VITE_API_URL=http://localhost:4000

# EmailJS configuration
VITE_EMAILJS_SERVICE_ID=your_service_id
VITE_EMAILJS_TEMPLATE_ID=your_template_id
VITE_EMAILJS_PUBLIC_KEY=your_public_key
```

### 4️⃣ Run the backend (server.js)
```bash
npm run server
```
> Starts JSON-based mock backend on `http://localhost:4000`

### 5️⃣ Run the frontend
```bash
npm run dev
```
> Starts React app on `http://localhost:5173`

---

## 🌐 Deployment (Vercel)

1. Push the repository to GitHub.
2. Connect your repo on [Vercel Dashboard](https://vercel.com/).
3. Set up the following **Environment Variables**:
   - `VITE_API_URL=https://your-deployed-backend.vercel.app`
   - `VITE_EMAILJS_SERVICE_ID`
   - `VITE_EMAILJS_TEMPLATE_ID`
   - `VITE_EMAILJS_PUBLIC_KEY`
4. Hit **Deploy**.

---

## 🧪 Testing Checklist

✅ Image upload & ingredient detection  
✅ Recipe filtering by diet/time/difficulty  
✅ Step quantity scaling with servings  
✅ Nutrition scaling  
✅ Rating system (rate once + undo)  
✅ Login / Signup / Logout  
✅ Favorite add/remove  
✅ Contact form (with success/failure alerts)  
✅ Fully responsive on mobile

---

## 🧩 Common Issues

| Problem | Cause | Fix |
|----------|--------|-----|
| `ERR_CONNECTION_REFUSED` | Backend not running locally | Run `npm run server` |
| Email not sending | Missing EmailJS keys | Add keys to `.env` |
| Rating duplicates | User rating logic not synced | Ensure `server.js` updated version |
| Favicon 404 | Missing favicon.ico | Add one to `public/` |

---

## 🧑‍🏫 Authors & Credits

**Project Lead:** [Keerti Vijay Ananth](mailto:keertivijayananth06@gmail.com)  
**Development Assistance:** figma , AI for code verification 
**Stack:** React, Node.js, Tailwind, EmailJS, JSON-Server  
**Institution:** VIT Bhopal  

---

## 🛡️ License

This project is licensed under the **MIT License**.  
Feel free to use, modify, and distribute for educational or personal projects.

---

## 💬 Future Enhancements
- Personalized meal planner
- Ingredient price estimation
- AI-based recipe generation
- Voice assistant mode (“Cook with me” feature)
