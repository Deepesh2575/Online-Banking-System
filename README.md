# Online Banking System

A modern, secure, and full-featured online banking application built with React, Python (FastAPI), and MySQL. This project demonstrates a robust full-stack architecture suitable for educational purposes and portfolio showcases.

## 🚀 Features

*   **Modern UI/UX**: Built with React and structured with a premium "Neo-Glass" design aesthetic using Framer Motion.
*   **Secure Authentication**: JWT-based authentication flow for secure user sessions.
*   **Real-time Dashboard**: View account balances, recent transactions, and financial insights.
*   **Fund Transfers**: Securely transfer funds between accounts.
*   **RESTful API**: Fast and documented API backend using FastAPI.
*   **Database**: robust MySQL relational database schema.

## 🛠️ Tech Stack

*   **Frontend**: React (Vite), Framer Motion, Axios, Lucide React
*   **Backend**: Python, FastAPI, SQLAlchemy, Pydantic
*   **Database**: MySQL
*   **Tools**: Git, npm, pip

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
*   [Node.js](https://nodejs.org/) (v16 or higher)
*   [Python](https://www.python.org/) (v3.8 or higher)
*   [MySQL Server](https://dev.mysql.com/downloads/mysql/)

## ⚙️ Installation & Setup

### 1. Database Setup

1.  Log in to your MySQL server.
2.  Create a new database named `banking_system`.
3.  Import the schema from the `database` folder:
    ```bash
    mysql -u root -p banking_system < database/full_schema.sql
    ```

### 2. Backend Setup

Navigate to the backend directory and set up the Python environment.

```bash
cd online-banking-backend
```

Create a virtual environment (optional but recommended):
```bash
python -m venv env
# Windows
.\env\Scripts\activate
# Linux/Mac
source env/bin/activate
```

Install dependencies:
```bash
pip install -r requirements.txt
```

Configure environment variables:
1.  Copy `.env.example` to `.env`.
2.  Update `DATABASE_URL` with your MySQL credentials.
    ```env
    DATABASE_URL="mysql+mysqlconnector://root:YourPassword@127.0.0.1:3306/banking_system"
    ```
    *Note: If your password has special characters, ensure they are URL-encoded.*

Start the backend server:
```bash
uvicorn main:app --reload
```
The API will be available at `http://localhost:8000`. API docs at `http://localhost:8000/docs`.

### 3. Frontend Setup

Open a new terminal and navigate to the client directory.

```bash
cd client
```

Install dependencies:
```bash
npm install
```

Start the development server:
```bash
npm run dev
```
The application will launch at `http://localhost:5173`.

## 📁 Project Structure

```
├── client/                 # React Frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Application pages (Dashboard, Login, etc.)
│   │   └── ...
├── online-banking-backend/ # FastAPI Backend
│   ├── routers/            # API Route handlers
│   ├── modules.py          # Database models
│   └── ...
└── database/               # SQL Scripts
```

## 🤝 Contributing

Contributions are welcome! Please fork the repository and submit a pull request.


