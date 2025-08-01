# Firebase Setup Instructions

## Step 1: Install Node.js
1. Go to https://nodejs.org
2. Download and install the LTS version
3. Restart Terminal after installation

## Step 2: Install Firebase CLI
Open Terminal and run:
```bash
npm install -g firebase-tools
```

## Step 3: Create Firebase Project
1. Go to https://console.firebase.google.com
2. Click "Create a project"
3. Name it "2026-title-planner"
4. Enable Google Analytics (optional)
5. Click "Create project"

## Step 4: Enable Firestore Database
1. In Firebase console, click "Firestore Database"
2. Click "Create database"
3. Choose "Start in test mode"
4. Select a location (us-central1 recommended)

## Step 5: Enable Hosting
1. Click "Hosting" in Firebase console
2. Click "Get started"
3. Follow the setup steps

## Step 6: Deploy Your App
In Terminal, navigate to your project folder and run:
```bash
cd "/Users/cpenido/Desktop/2026 Title Planning Tool "
firebase login
firebase init
firebase deploy
```

## Step 7: Get Your Live URL
After deployment, Firebase will give you a URL like:
https://your-project-name.web.app

Share this URL with your team for real-time collaboration!