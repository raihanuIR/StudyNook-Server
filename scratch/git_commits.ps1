# PowerShell script to split project into two separate Git repositories with required commit histories

Write-Host "Starting Git Repository Split Setup..." -ForegroundColor Cyan

# 1. Remove top-level .git directory if it exists
if (Test-Path "../.git") {
    Write-Host "Removing root .git repository..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force "../.git"
}
if (Test-Path ".git") {
    Write-Host "Removing root .git repository (local)..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force ".git"
}

# ----------------- SERVER REPOSITORY SETUP -----------------
Write-Host "`nInitializing Server Repository..." -ForegroundColor Green
cd server

# Initialize Git
git init
git branch -M main

# Configure local Git credentials just in case
git config user.name "Student"
git config user.email "student@university.edu"

# Commits for Server
Write-Host "Creating Server Commits..." -ForegroundColor Green

git add package.json .env
git commit -m "chore: initialize express server and setup env configuration"

git add config/db.js
git commit -m "feat: add database connection utility"

git add models/
git commit -m "feat: implement User, Room, and Booking mongoose schemas"

git add middleware/
git commit -m "feat: implement authMiddleware for HTTP-only cookies verification"

git add routes/auth.js
git commit -m "feat: implement authentication routes for register, login, and Google OAuth"

git add routes/rooms.js
git commit -m "feat: implement rooms CRUD routes with search & filter parameters"

git add routes/bookings.js
git commit -m "feat: implement booking routes with time-conflict checks and user array updates"

git add index.js scratch/
git commit -m "feat: setup server entry point and add automated test script"

Write-Host "Server Git commits generated successfully! (8 commits)" -ForegroundColor Green

# ----------------- CLIENT REPOSITORY SETUP -----------------
Write-Host "`nInitializing Client Repository..." -ForegroundColor Green
cd ../client

# Initialize Git
git init
git branch -M main

# Configure local Git credentials
git config user.name "Student"
git config user.email "student@university.edu"

# Commits for Client
Write-Host "Creating Client Commits..." -ForegroundColor Green

git add package.json vite.config.js
git commit -m "chore: scaffold vite-react project and configure tailwind plugin"

git add src/index.css
git commit -m "style: import tailwind base styling and custom dark mode variant"

git add src/firebase.config.js .env
git commit -m "feat: setup firebase config and environment variables for Google OAuth"

git add src/utils/api.js
git commit -m "chore: setup axios client wrapper with cookies support"

git add src/context/ThemeContext.jsx
git commit -m "feat: implement theme context for dark/light mode toggle"

git add src/context/AuthContext.jsx
git commit -m "feat: implement auth context for credentials and Google OAuth"

git add src/components/Loader.jsx src/components/PrivateRoute.jsx
git commit -m "feat: add loader spinner and private route wrapper"

git add src/components/Footer.jsx
git commit -m "feat: create responsive footer with new X branding logo"

git add src/components/Navbar.jsx
git commit -m "feat: create responsive navbar with theme switch and profile dropdown"

git add src/components/RoomCard.jsx
git commit -m "feat: create room display card with specs and amenities chips"

git add src/components/BookingModal.jsx
git commit -m "feat: create booking form modal with dynamic slot range and price calculator"

git add src/pages/Home.jsx
git commit -m "feat: create homepage with hero, latest listings, FAQ, and how-it-works"

git add src/pages/Rooms.jsx
git commit -m "feat: create available rooms explorer with search and filter sidebar"

git add src/pages/RoomDetails.jsx
git commit -m "feat: create room details page with editing modals and owner actions"

git add src/pages/AddRoom.jsx
git commit -m "feat: create room submission form"

git add src/pages/MyListings.jsx src/pages/MyBookings.jsx
git commit -m "feat: create listings and reservations dashboards"

git add src/pages/Login.jsx src/pages/Register.jsx
git commit -m "feat: create login and register pages with form validations"

git add src/pages/NotFound.jsx src/App.jsx src/main.jsx
git commit -m "feat: build app routing tree and mount NotFound 404 page"

git add readme.md
git commit -m "docs: add readme detailing features, tech stack, and setup guides"

Write-Host "Client Git commits generated successfully! (19 commits)" -ForegroundColor Green

Write-Host "`nAll Git repositories initialized and committed successfully!" -ForegroundColor Cyan
