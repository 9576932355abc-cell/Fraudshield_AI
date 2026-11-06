<div align="center">

# 🛡️ FraudShield AI

### AI-Powered Banking Fraud Detection System

A **production-grade**, full-stack banking platform that uses an **XGBoost Machine Learning model** integrated with an **LLM-powered assistant** to detect, flag, and prevent fraudulent financial transactions in real time.

[![Live Demo](https://img.shields.io/badge/🚀_Live_Demo-Click_Here-F59E0B?style=for-the-badge)](https://fraud-shield-ai-brown.vercel.app/)
[![Backend API Docs](https://img.shields.io/badge/Backend_API-FastAPI_Docs-009688?style=for-the-badge&logo=fastapi)](https://fraudshield-ai-rzsu.onrender.com)
[![ML Model](https://img.shields.io/badge/ML_Model-XGBoost_on_Render-FF6B35?style=for-the-badge)](https://fraudshield-ai-9jnu.onrender.com)

![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=flat-square&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?style=flat-square&logo=fastapi)
![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-336791?style=flat-square&logo=postgresql)
![XGBoost](https://img.shields.io/badge/XGBoost-ML_Model-FF6600?style=flat-square)

</div>

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Live Demo](#-live-demo)
- [Features](#-features)
- [System Architecture](#-system-architecture)
- [Transaction Flow](#-transaction-flow-with-fraud-detection)
- [ML Model & AI Assistant](#-ml-model--ai-assistant)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [API Endpoints](#-api-endpoints)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Key Design Decisions](#-key-design-decisions)
- [Running Tests](#-running-tests)
- [Team](#-team)

---

## 🔍 Overview

**FraudShield AI** is a full-stack banking fraud detection system built as a collaborative project. It simulates a real-world banking application with end-to-end fraud prevention capabilities — from user authentication to real-time ML inference — wrapped in a polished, responsive UI.

The system is built around a **three-layer fraud protection pipeline**:

1. **Rate Limiting (Rapid-Fire Detection)** — blocks burst transactions within a 2-minute window
2. **High-Value OTP Gate** — requires email OTP for large transfers (≥ ₹1,00,000)
3. **XGBoost ML Fraud Detection** — scores every transaction for fraud probability using a deployed ML model with an LLM-generated response assistant

---

## 🚀 Live Demo

> 🔗 **[https://fraud-shield-ai-brown.vercel.app/](https://fraud-shield-ai-brown.vercel.app/)** 

**Demo Credentials:**

| Role  | Email               | Password    |
|-------|---------------------|-------------|
| User  | `demo@example.com`  | `demo1234`  |
| Admin | `admin@example.com` | `admin1234` |

---

## ✨ Features

### 👤 User Features

| Feature | Description |
|---|---|
| **Registration & Login** | Secure JWT-based authentication with email + password. Auto-creates a bank account on signup with ₹1,000 welcome balance. |
| **Dashboard** | Real-time overview of account balance, recent transactions, and risk indicators with interactive charts. |
| **Money Transfer** | Send funds to any account using account number + recipient name verification to prevent spoofing. |
| **OTP Verification** | Email OTP (via Brevo) triggered for high-risk and high-value transactions. OTP is stateless — encrypted inside a JWT, no DB storage required. |
| **Transaction History** | Paginated list of all sent and received transactions with risk levels, amounts, and status badges. |
| **Fraud Alerts** | View personalized fraud alerts generated against your flagged transactions with full AI analysis. |
| **Account Details** | View account number, type, current balance, and account status. |
| **Profile Management** | Update personal information and account settings. |
| **Session Management** | Automatic logout on JWT expiry with a user-friendly toast notification. |

### 🔐 Security & Fraud Protection

| Feature | Description |
|---|---|
| **Rapid-Fire Detection** | Blocks more than 2 transactions within 120 seconds from the same account. OTP required to proceed. |
| **High-Value OTP Gate** | Any transfer ≥ ₹1,00,000 automatically triggers an email OTP challenge before execution. |
| **ML Fraud Pre-Scan** | Every transaction is scored by the XGBoost model *before* execution. HIGH risk triggers an OTP gate with a detailed AI-generated explanation. |
| **Post-Transaction Scoring** | Even OTP-verified transactions are ML-scored and stored for audit trail and anomaly records. |
| **Receiver Name Verification** | Prevents account number spoofing — sender must supply the exact registered name of the recipient. |
| **Self-Transfer Guard** | Prevents users from transferring money to their own account. |
| **ML Offline Fallback** | If the ML model server is unreachable, a rule-based stub kicks in seamlessly — zero service interruption. |
| **User Enumeration Prevention** | Login returns the same error for "user not found" and "wrong password" to prevent enumeration attacks. |

### 🛡️ Admin Panel

| Feature | Description |
|---|---|
| **Admin Dashboard** | Auto-redirects admins to the fraud control center on login. |
| **Alert Management** | View all system-wide fraud alerts, filter by status (unresolved/all), and resolve alerts with one click. |
| **User Management** | View all registered users, block/unblock accounts with immediate enforcement. |
| **Audit Logs** | Complete, tamper-evident log of all admin actions with timestamps, IP addresses, and structured action details. Filterable by action type. |
| **Fraud Rule CRUD** | Create, update, enable/disable, and delete custom fraud detection rules fed to the ML model. |

### 🤖 AI Assistant

| Feature | Description |
|---|---|
| **LLM-Generated Responses** | The ML model returns an AI-generated `assistant` block with a user-facing message, severity level, recommended action, and next steps. |
| **Contextual Fraud Modal** | When a transaction is flagged, a rich modal displays the AI assistant's explanation, triggered rules, fraud probability, and risk score. |
| **Admin Summary** | Each ML prediction includes an `admin_summary` field with a machine-generated audit note for the admin panel. |

---

## 🏗️ System Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                          FraudShield AI                              │
│                                                                      │
│  ┌──────────────────┐   REST/JSON    ┌──────────────────────────┐   │
│  │    Frontend       │ ─────────────► │    Backend (FastAPI)     │   │
│  │  React 19 + Vite  │ ◄───────────── │                          │   │
│  │  MUI v9 + Axios   │   JWT Auth     │  Routers → Services      │   │
│  └──────────────────┘                │  → Repositories → DB      │   │
│                                      │                            │   │
│                                      │  ┌──────────────────────┐ │   │
│                                      │  │  ML Integration Layer │ │   │
│                                      │  │  (fraud_detector.py)  │ │   │
│                                      │  └──────────┬───────────┘ │   │
│                                      └─────────────┼─────────────┘   │
│                                                    │                  │
│                          ┌─────────────────────────┘                  │
│                          ▼                                            │
│  ┌────────────────────────────┐   ┌────────────────────────────────┐ │
│  │   ML Model Server          │   │   PostgreSQL (Supabase)        │ │
│  │   XGBoost + LLM Assistant  │   │   Users · Accounts             │ │
│  │   Deployed on Render       │   │   Transactions · Alerts        │ │
│  └────────────────────────────┘   │   FraudRules · AuditLogs       │ │
│                                   └────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Transaction Flow with Fraud Detection

```
User submits Transfer Request
          │
          ▼
  ┌─────────────────────┐
  │  Validate inputs    │  ─ Receiver account exists?
  │  & receiver name    │  ─ Name matches? Balance sufficient?
  └──────────┬──────────┘
             │
             ▼
  ┌─────────────────────┐
  │  GATE A             │  > 2 txns in last 120 seconds?
  │  Rapid-Fire Check   │──► OTP Required  (reason: RAPID_FIRE)
  └──────────┬──────────┘
             │
             ▼
  ┌─────────────────────┐
  │  GATE B             │  Amount ≥ ₹1,00,000?
  │  High-Value Check   │──► OTP Required  (reason: HIGH_VALUE)
  └──────────┬──────────┘     + ML called for LLM message
             │
             ▼
  ┌─────────────────────┐
  │  GATE C             │  ML Model returns HIGH risk?
  │  ML Fraud Pre-Scan  │──► OTP Required  (reason: FRAUD)
  └──────────┬──────────┘     + Full AI assistant response shown in modal
             │
             ▼  (All gates passed OR OTP verified)
  ┌─────────────────────┐
  │  Execute Transfer   │  Debit sender · Credit receiver
  │  Write Transaction  │  Status → SUCCESS
  └──────────┬──────────┘
             │
             ▼
  ┌─────────────────────┐
  │  Post-Transaction   │  ML model scores for audit trail
  │  ML Scoring         │  Stores anomaly_score + risk_level on transaction
  └──────────┬──────────┘
             │
             ▼
  ┌─────────────────────┐
  │  Fraud Alert?       │  HIGH risk AND NOT OTP-verified?
  │                     │  → Status = FLAGGED
  │                     │  → Alert created in DB
  └─────────────────────┘
```

**OTP Sub-Flow:**
```
OTP Required
  → Backend generates 6-digit OTP
  → OTP encrypted inside JWT (stateless — no DB write)
  → Email sent via Brevo API  /  OTP printed to stdout locally
  → User enters OTP in modal
  → Backend validates JWT + OTP match
  → Transfer executes with otp_verified = True
  → No fraud alert generated (user has verified their intent)
```

---

## 🤖 ML Model & AI Assistant

The ML model is a separately deployed **XGBoost classifier** running on Render, with an **LLM layer** that generates human-readable fraud explanations.

### ML API Contract

**Request payload (sent from backend to ML server):**
```json
{
  "sender_account": "ACC001",
  "receiver_account": "ACC002",
  "amount": 5000.00,
  "time": "14:30"
}
```

**Response (returned by ML server):**
```json
{
  "prediction": 1,
  "prediction_label": "Fraud",
  "fraud_probability": 99.95,
  "rule_score": 50,
  "triggered_rules": ["RULE001", "RULE002"],
  "reasons": ["High transaction amount", "Transaction during off-hours"],
  "risk_score": 84.97,
  "risk_level": "HIGH",
  "assistant": {
    "severity": "HIGH",
    "recommended_action": "BLOCK_TRANSACTION",
    "user_title": "Payment Stopped",
    "user_message": "Your payment has been temporarily paused for security verification.",
    "next_steps": ["Verify your identity.", "Contact support if this wasn't you."],
    "admin_summary": "XGBoost flagged transaction with 99.95% fraud probability.",
    "llm_used": true
  }
}
```

### Offline Fallback (Stub Mode)

If the ML server is unreachable (cold start / timeout), the backend uses a local rule-based stub with zero downtime:

| Amount Range | Risk Level | Fraud Probability | Action |
|---|---|---|---|
| > ₹1,00,000 | 🔴 HIGH | 95% | BLOCK_TRANSACTION |
| ₹50,001 – ₹1,00,000 | 🟡 MEDIUM | 75% | REVIEW_TRANSACTION |
| ≤ ₹50,000 | 🟢 LOW | 10% | ALLOW_TRANSACTION |

---

## 🛠️ Tech Stack

### Backend
| Layer | Technology |
|---|---|
| **Framework** | FastAPI (Python 3.10+) |
| **ORM** | SQLModel (SQLAlchemy + Pydantic) |
| **Database** | PostgreSQL via Supabase |
| **Authentication** | JWT (python-jose) + bcrypt password hashing |
| **OTP** | 6-digit OTP encrypted in JWT · Brevo Email API |
| **ML Integration** | Async HTTP via `httpx` → Render-hosted XGBoost model |
| **Migrations** | Alembic |
| **Server** | Uvicorn (ASGI) |

### Frontend
| Layer | Technology |
|---|---|
| **Framework** | React 19 + Vite 8 |
| **UI Library** | Material UI (MUI v9) + Emotion |
| **Routing** | React Router DOM v7 |
| **HTTP Client** | Axios |
| **Charts** | Recharts |
| **Notifications** | React Hot Toast |
| **Date Utilities** | Day.js |

### Infrastructure
| Layer | Technology |
|---|---|
| **ML Model Hosting** | Render |
| **Database Hosting** | Supabase (PostgreSQL) |
| **Email Service** | Brevo |
| **Frontend Hosting** | https://fraud-shield-ai-brown.vercel.app/ |
| **Backend Hosting** |https://fraudshield-ai-rzsu.onrender.com |


## 🚀 Getting Started

### Prerequisites
- **Python 3.10+** (3.13 recommended)
- **Node.js 18+** and npm
- **PostgreSQL** or a hosted [Supabase](https://supabase.com) project
- **Git**

---

### Backend Setup

**1. Clone the repository**
```bash
git clone https://github.com/anmol1kush/FraudShield.git
cd FraudShield
```

**2. Create and activate virtual environment**

Windows (PowerShell):
```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

macOS / Linux:
```bash
python3 -m venv venv
source venv/bin/activate
```

**3. Install backend dependencies**
```bash
cd Backend
pip install -r requirements.txt
```

**4. Configure environment variables**

Create a `.env` file inside `Backend/`:
```ini
# ── Database ──────────────────────────────────────────────────────────────
DATABASE_URL=postgresql://username:password@host:port/database_name

# ── JWT Authentication ────────────────────────────────────────────────────
SECRET_KEY=your-super-secret-jwt-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60

# ── OTP Security ──────────────────────────────────────────────────────────
OTP_SECRET_KEY=your-otp-secret-key
OTP_EXPIRE_MINUTES=5

# ── ML Model API ──────────────────────────────────────────────────────────
ML_MODEL_URL=https://fraudshield-ai-9jnu.onrender.com/predict
ML_TIMEOUT_SECONDS=10

# ── Email (Brevo) ─────────────────────────────────────────────────────────
BREVO_API_KEY=your-brevo-api-key
BREVO_FROM_EMAIL=noreply@yourdomain.com

# ── App Config ────────────────────────────────────────────────────────────
DEBUG=True
APP_NAME=FraudShield AI
APP_VERSION=1.0.0
```

> 💡 Without Brevo keys, OTPs are printed to stdout — fully usable for local development.

**5. Run the backend server**
```bash
# From the Backend/ directory
python main.py

# Or with Uvicorn directly:
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**6. Access API documentation**
```
http://localhost:8000/docs     
http://localhost:8000/redoc     
```

---

### Frontend Setup

**1. Navigate to the Frontend directory**
```bash
cd Frontend
```

**2. Create environment file**

Create `.env` inside `Frontend/`:
```env
VITE_API_BASE_URL=http://localhost:8000
```

**3. Install dependencies**
```bash
npm install
```

**4. Start the development server**
```bash
npm run dev
```

**5. Open in browser**
```
http://localhost:5173
```

---

## 🔑 Environment Variables

### Backend (`Backend/.env`)

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `SECRET_KEY` | ✅ | JWT signing secret (keep private) |
| `ALGORITHM` | ✅ | JWT algorithm — use `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | ✅ | JWT expiry duration in minutes |
| `OTP_SECRET_KEY` | ✅ | Separate secret for OTP JWT signing |
| `OTP_EXPIRE_MINUTES` | ✅ | OTP validity window in minutes |
| `ML_MODEL_URL` | ✅ | Full URL to ML model `/predict` endpoint |
| `ML_TIMEOUT_SECONDS` | ✅ | Timeout for ML API requests |
| `BREVO_API_KEY` | ⚠️ Optional | Brevo email API key (OTP delivery) |
| `BREVO_FROM_EMAIL` | ⚠️ Optional | Sender email for OTP messages |
| `DEBUG` | ✅ | `True` enables Swagger UI at `/docs` |

### Frontend (`Frontend/.env`)

| Variable | Required | Description |
|---|---|---|
| `VITE_API_BASE_URL` | ✅ | Backend API base URL |

---

## 💡 Key Design Decisions

| Decision | Rationale |
|---|---|
| **Stateless OTP (JWT-encrypted)** | OTP is embedded in a signed JWT. Zero DB reads/writes for OTP — horizontally scalable. |
| **Three-Gate Pre-Scan** | ML model is called *before* writing to DB. No fraudulent transactions are persisted unless the user consciously verifies via OTP. |
| **OTP-Verified = No Alert** | If a user completes OTP verification, the system trusts their intent — no false-positive alert is generated. |
| **ML Graceful Fallback** | Stub prediction (rule-based on amount) ensures zero downtime if the Render ML server is cold or unreachable. |
| **Audit Logging** | Every admin action is logged with user ID, IP address, action type, and serialized details — suitable for compliance review. |
| **Role-Based Auto-Routing** | Admins are automatically redirected to the fraud alert panel on login; regular users land on their personal dashboard. |
| **Receiver Name Verification** | Requires the sender to supply the recipient's registered full name, preventing account number enumeration attacks. |

---

## 🧪 Running Tests

```bash
# From the project root
pytest tests/ -v

# With coverage report
pytest tests/ --cov=app --cov-report=html
```

---

## 🤝 Team

| Role | Contributor |
|---|---|
| **Backend Development & ML Integration** | Anmol Kushwaha |
| **Frontend Development** | Abhikrit Verma |
| **ML Model & XGBoost Training** | Ritum Raha |

---

## 📄 License

This project is built for educational and portfolio purposes.

---

<div align="center">

**Built with ❤️ by the FraudShield AI Team**



</div>
