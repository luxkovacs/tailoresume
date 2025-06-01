# Tailoresume

**Tailoresume** is a web application designed to help users create, manage, and tailor personalized resumes to specific job descriptions. It leverages LLMs to assist with content generation and ATS (Applicant Tracking System) optimization.

A webapp to help create fitting resumes for whatever job you've in mind, and maintain a database of your registered skills, education, experience, and more.

## Tech Stack

- **Frontend:** React (v18+), TypeScript, Tailwind CSS
- **Backend:** Python (v3.10+), FastAPI, SQLAlchemy
- **Database:** PostgreSQL (v14+)
- **Authentication:** Firebase (Email/Password, Google Sign-In)
- **AI Integration:** OpenAI (GPT models), Anthropic (Claude models), Google (Gemini models) via user-provided API keys.

## Project Structure

The project is organized into two main directories:

- `frontend/`: Contains the React/TypeScript frontend application.
- `backend/`: Contains the Python/FastAPI backend application, including API endpoints, database models, and services.

## Setup Instructions

### Prerequisites

- [Node.js](https://nodejs.org/) (v18.x or later recommended, includes npm)
- [Python](https://www.python.org/) (v3.10 or later recommended, includes pip)
- [PostgreSQL](https://www.postgresql.org/download/) (v14.x or later recommended)
- [Git](https://git-scm.com/)

### Backend Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/luxkovacs/tailoresume.git
    cd tailoresume
    ```
2.  **Navigate to the backend directory:**
    ```powershell
    cd backend
    ```
3.  **Create and activate a Python virtual environment:**
    ```powershell
    python -m venv .venv
    .\.venv\Scripts\Activate.ps1
    ```
4.  **Install dependencies:**
    ```powershell
    pip install -r requirements.txt
    ```
5.  **Set up PostgreSQL Database:**
    *   Ensure PostgreSQL server is running.
    *   Connect to PostgreSQL (e.g., using `psql -U postgres`):
        ```sql
        CREATE DATABASE tailoresume;
        \q
        ```
    *   (Ensure your `postgres` user has a password set).
6.  **Configure Environment Variables:**
    *   Create a `.env` file in the `backend/` directory (`backend/.env`).
    *   Add your database connection string:
        ```env
        DATABASE_URL="postgresql://postgres:YOUR_POSTGRES_PASSWORD@localhost/tailoresume"
        ```
        Replace `YOUR_POSTGRES_PASSWORD` with your actual PostgreSQL password for the `postgres` user.
    *   (Add other backend environment variables if any, e.g., AI API keys if managed server-side directly).
7.  **Create Database Tables:**
    *   Run the script to create tables (ensure your virtual environment is activated):
        ```powershell
        python .\create_db_tables.py
        ```

### Frontend Setup

1.  **Navigate to the frontend directory:**
    ```powershell
    cd ..\frontend 
    # (If you are in the backend directory, otherwise navigate from the root)
    ```
2.  **Install dependencies:**
    ```powershell
    npm install
    # or yarn install
    ```
3.  **Configure Environment Variables:**
    *   Create a `.env` file in the `frontend/` directory (`frontend/.env`).
    *   Add your Firebase project configuration keys. You can get these from your Firebase project settings (Project settings > General > Your apps > Web app > SDK setup and configuration > Config).
        ```env
        REACT_APP_FIREBASE_API_KEY=YOUR_FIREBASE_API_KEY
        REACT_APP_FIREBASE_AUTH_DOMAIN=YOUR_FIREBASE_AUTH_DOMAIN
        REACT_APP_FIREBASE_PROJECT_ID=YOUR_FIREBASE_PROJECT_ID
        REACT_APP_FIREBASE_STORAGE_BUCKET=YOUR_FIREBASE_STORAGE_BUCKET
        REACT_APP_FIREBASE_MESSAGING_SENDER_ID=YOUR_FIREBASE_MESSAGING_SENDER_ID
        REACT_APP_FIREBASE_APP_ID=YOUR_FIREBASE_APP_ID
        REACT_APP_FIREBASE_MEASUREMENT_ID=YOUR_FIREBASE_MEASUREMENT_ID
        ```

## Running the Application

### Backend Server

1.  Navigate to the `backend/` directory.
2.  Ensure your Python virtual environment is activated (`.\.venv\Scripts\Activate.ps1`).
3.  Start the FastAPI server (usually with Uvicorn):
    ```powershell
    uvicorn app.main:app --reload
    ```
    The backend will typically be available at `http://localhost:8000`.

### Frontend Development Server

1.  Navigate to the `frontend/` directory.
2.  Start the React development server:
    ```powershell
    npm start
    # or yarn start
    ```
    The frontend will typically be available at `http://localhost:3000` (or `https://localhost:3000` if HTTPS is enabled by default).


## Credits

- rezi-io's [Resume Metadata Standard](https://github.com/rezi-io/resume-standard)

---

*This README was last updated on May 13, 2025.*
