# 🧠 SecondBrain AI

**SecondBrain AI** is an advanced, AI-powered productivity system and task manager designed to act as your digital neocortex. Built with FastAPI, MongoDB, React, Vite, and Gemini AI, it seamlessly transforms natural language into structured tasks, breaks down complex goals autonomously, predicts your productivity trajectory, and categorizes your stream-of-consciousness thought dumps.

---

## 🚀 Features

- **⚡ NLP Quick Capture**: Type anything naturally (e.g., "Remind me to call the dentist tomorrow at 3pm"), and the AI instantly extracts the title, deadline, and priority to create a structured task.
- **🎯 Goal Decomposition**: Have a massive goal? Enter it in the Goal interface, and the Agentic AI automatically breaks it down into 3-7 actionable, sequenced tasks with realistic deadlines.
- **🧹 Brain Dump (Mental Overload)**: Feeling overwhelmed? Dump your raw thoughts into the system. The AI scans your input and categorizes items into **🔴 Urgent**, **🟡 Later**, and **⚪ Ignore**, giving you instant mental clarity.
- **🔮 Prediction Engine**: Analyzes your current task completion rate, streaks, and habits to accurately predict your success trajectory and provide tailored suggestions.
- **📊 AI Task Prioritization & Decision Engine**: Can't decide what to do? The AI autonomously analyzes your pending tasks and recommends the single best task you should focus on right now.
- **🧘 Mental State Analysis**: Share how you're feeling, and the AI detects your emotion, assesses its intensity, and offers personalized support.
- **🤖 Proactive Notifications & Alerts**: A failure alert system checks for overdue tasks and dropping scores, while a proactive AI provides encouraging insights right on your dashboard.
- **🎶 Focus Mode integration**: Embedded Spotify player for focused productivity sessions.

---

## 🛠️ Tech Stack

### Backend
- **Framework**: [FastAPI](https://fastapi.tiangolo.com/) (Python)
- **Database**: [MongoDB](https://www.mongodb.com/) (Motor AsyncIO)
- **AI Integration**: [Google Gemini Pro API](https://deepmind.google/technologies/gemini/)
- **Authentication**: JWT & PyJWT
- **Data Validation**: Pydantic

### Frontend
- **Framework**: [React 18](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Routing**: React Router DOM
- **UI/UX**: Custom Neobrutalist design with CSS (Variables, Grid, Flexbox, Animations)
- **Themes**: Dark/Light mode toggle
- **API Communication**: Native Fetch API client proxying to FastAPI

---

## ⚙️ Getting Started

### 1. Prerequisites
- Python 3.9+
- Node.js 18+
- MongoDB instance (Local or Atlas)
- Google Gemini API Key

### 2. Backend Setup
```bash
# Navigate to Backend directory
cd Backend

# Create a virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create a .env file and set up environment variables
# GEMINI_API_KEY=your_gemini_api_key_here
# MONGO_URI=your_mongo_connection_string
# JWT_SECRET=your_jwt_secret_key

# Run the FastAPI server
uvicorn main:app --reload
# Server will run on http://localhost:8000
```

### 3. Frontend Setup
```bash
# Navigate to Frontend directory
cd Frontend

# Install NPM dependencies
npm install

# Run the Vite development server
npm run dev
# App will run on http://localhost:5173
```

---

## 🏗️ Architecture Overview

The system architecture cleanly separates concerns between an AI-first backend processing engine and a responsive, state-driven frontend.

- **AI Services Layer (`Backend/services/`)**: Contains modular AI task handlers (`goal_service.py`, `nlp_capture_service.py`, `braindump_service.py`, etc.) ensuring the `routes` layer remains thin.
- **Schema Validation (`Backend/models/`)**: Pydantic models validate all incoming requests and outgoing structured AI data.
- **Theming & CSS (`Frontend/src/styles/`)**: Employs a robust global CSS variable system (`index.css`) injected heavily with modern neobrutalist styling. 
- **Context API (`Frontend/src/components/AuthProvider.jsx`)**: Handles JWT-based frontend authentication and seamless route protection.

---

## 🛡️ License

This project is licensed under the MIT License - see the LICENSE file for details.
