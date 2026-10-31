# UPI Sentinel – Intelligent Fraud Detection System
> **Real-Time AI-Powered Digital Payment Security**  
> *Hackathon Track: KLU + Path-3 ML-02 – Real-Time UPI / Digital Payment Fraud Detection*

---

## 🌟 Executive Summary

**UPI Sentinel** is an enterprise-grade, real-time cybersecurity platform designed to monitor, score, and prevent fraudulent Unified Payments Interface (UPI) transactions. It is powered by a trained **Extra Trees Classifier** machine learning pipeline directly loaded from `models/upi_fraud_model.joblib` and governed by `models/upi_fraud_model_metadata.json`.

The system integrates a zero-trust **Risk Decision Engine** (`APPROVE`, `STEP_UP_OTP`, `BLOCK`) with a dual-role workflow:
1. **Payer Experience**: Instant payments with simulated Step-Up OTP authentication challenges.
2. **SOC Security Officer Portal**: Real-time alerts for flagged transactions with 1-click administrative review (*Approve & Release Funds* or *Reject & Block Payment* with compliance audit notes).

---

## 🏗️ Architecture & Technology Stack

```
                                  ┌───────────────────────────┐
                                  │      React.js + Vite      │
                                  │   (Tailwind CSS + Recharts│
                                  └─────────────┬─────────────┘
                                                │ REST API (Axios + JWT)
                                                ▼
                                  ┌───────────────────────────┐
                                  │      FastAPI Backend      │
                                  │  Lifespan Model Singleton │
                                  └──────┬─────────────┬──────┘
                                         │             │
                Exact 16-feature vector  │             │ SQLAlchemy ORM
                                         ▼             ▼
              ┌────────────────────────────┐    ┌───────────────────────────┐
              │ Extra Trees ML Pipeline    │    │ PostgreSQL / SQLite       │
              │ (Scikit-Learn Joblib)      │    │ (psycopg3 binary)         │
              │ - Cyclic Time transforms   │    │ - Users & Balances        │
              │ - OneHotEncoder (ignore)   │    │ - Transaction Ledger      │
              │ - Median / Mode Imputers   │    │ - Security Notifications  │
              └────────────────────────────┘    └───────────────────────────┘
```

### Stack Components:
- **Frontend**: React 18, Vite, Tailwind CSS, Lucide React Icons, Recharts, Axios, React Router v7.
- **Backend**: Python 3.11+, FastAPI, Scikit-learn (1.4+), Joblib, Pandas, NumPy, Pydantic v2.
- **Database**: PostgreSQL 16 (production) with automatic fallback to SQLite for zero-setup local execution.
- **Containerization**: Docker, Docker Compose, Nginx.

---

## 🤖 Machine Learning Integration & Exact Feature Pipeline

### 1. Model Loading
- The trained scikit-learn pipeline (`upi_fraud_model.joblib`) is loaded **only once** into memory during the FastAPI application startup lifespan.
- No artificial, hardcoded, or fabricated heuristic predictions are used. All risk scores are generated via `predict_proba(X)[1]`.

### 2. Feature Engineering & Exact Ordering (16 Features)
The inference service dynamically transforms raw transaction inputs using the exact feature engineering pipeline from `UPI_Fraud_Model_Training_Testing.ipynb`:

| Index | Feature Name | Type | Transformation / Source |
|---|---|---|---|
| 0 | `transaction type` | Categorical | `P2P`, `P2M`, `Bill Payment`, `Recharge` |
| 1 | `merchant_category` | Categorical | `Shopping`, `Grocery`, `Fuel`, `Entertainment`, `Food`, etc. |
| 2 | `amount (INR)` | Numeric | Standard Scaled via Median Imputer |
| 3 | `sender_age_group` | Categorical | `18-25`, `26-35`, `36-45`, `46-55`, `56+` |
| 4 | `receiver_age_group` | Categorical | `18-25`, `26-35`, `36-45`, `46-55`, `56+` |
| 5 | `sender_state` | Categorical | State of origination |
| 6 | `sender_bank` | Categorical | `SBI`, `HDFC`, `ICICI`, `Axis`, `Kotak`, `PNB`, `IndusInd`, `Yes Bank` |
| 7 | `receiver_bank` | Categorical | Beneficiary banking institution |
| 8 | `device_type` | Categorical | `Android`, `iOS`, `Web` |
| 9 | `network_type` | Categorical | `4G`, `5G`, `WiFi`, `3G` |
| 10 | `txn_hour` | Numeric | Extracted `dt.hour` (0–23) |
| 11 | `txn_day_of_week` | Categorical | Stringified day index `0` to `6` |
| 12 | `txn_month` | Categorical | Stringified month index `1` to `12` |
| 13 | `txn_is_weekend` | Numeric | `1` if day >= 5 else `0` |
| 14 | `hour_sin` | Numeric | $\sin(2 \pi \cdot \text{txn\_hour} / 24)$ |
| 15 | `hour_cos` | Numeric | $\cos(2 \pi \cdot \text{txn\_hour} / 24)$ |

### 3. Prevention of Data Leakage
The following columns are **strictly excluded** from inference features as specified in model metadata:
- `transaction id`
- `timestamp`
- `transaction_status`
- `fraud_flag`
- `hour_of_day`, `day_of_week`, `is_weekend`

### 4. Threshold & Decision Calibration (from Metadata)
- **Decision & Block Threshold**: `0.5710` (57.1%)
- **Provisional Step-Up OTP Threshold**: `0.2855` (28.55%)
- **Threshold Optimization**: Minimum validation expected cost (Missed Fraud Cost: ₹5,000 vs False Block Cost: ₹100).
- **Evaluation Metrics (Holdout)**:
  - Validation PR-AUC: `0.001985`
  - Test PR-AUC: `0.001796`

---

## 🛡️ Risk Decision Engine & Dual-Role Workflows

```
                           Incoming UPI Transaction
                                      │
                         ML Inference: predict_proba()
                                      │
                ┌─────────────────────┼─────────────────────┐
                ▼                                           ▼
      Fraud Prob < 28.55%               28.55% ≤ Prob < 57.1%          Fraud Prob ≥ 57.1%
                │                                           │                           │
          [ APPROVE ]                                 [ STEP_UP_OTP ]               [ BLOCK ]
                │                                           │                           │
         Instant Success                     Simulated OTP Modal              Security Hold Alert
         Funds Transferred                   (Code verification)              Admin Notified
                                                            │                           │
                                                    Passed  │                           ▼
                                                    OTP?────┘                 Admin SOC Review Portal
                                                            │                 ┌───────────────────────┐
                                                            ▼                 │ - Approve & Release   │
                                                    Payment Released          │ - Reject & Block      │
                                                                              └───────────────────────┘
```

### Pre-configured Demo Accounts:
- **SOC Security Admin**: `admin@upisentinel.com` / `admin123`
- **Payer (Rohan Sharma)**: `payer@upisentinel.com` / `payer123` (₹50,000 Initial Wallet Balance)

---

## 📡 REST API Specifications

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/predict` | Executes real ML inference, calculates risk %, returns decision & explanation |
| `GET` | `/api/transactions` | Paginated transaction ledger with search, filtering, and sorting |
| `GET` | `/api/transactions/{id}` | Deep-dive feature inspection for individual transaction |
| `GET` | `/api/dashboard/stats` | KPI metrics (Approved, OTP challenges, Blocked, Total volume, risk distribution) |
| `GET` | `/api/model/info` | Live model metadata, thresholds, PR-AUC, and feature lists |
| `GET` | `/api/health` | Comprehensive health check (FastAPI, Database, ML Model) |
| `POST` | `/api/auth/register` | New payer registration |
| `POST` | `/api/auth/login` | JWT bearer token login |
| `GET` | `/api/auth/me` | Current authenticated user profile |
| `POST` | `/api/payments/pay` | Payer initiates UPI transfer with real-time AI risk assessment |
| `POST` | `/api/payments/verify-otp` | Validates Step-Up OTP challenge |
| `GET` | `/api/payments/my-transactions` | Payer's personal transaction history |
| `GET` | `/api/admin/pending-reviews` | Flagged payments queue requiring administrative action |
| `POST` | `/api/admin/review` | Admin authorizes or rejects a risky payment |
| `GET` | `/api/admin/notifications` | Real-time security alert notifications drawer |
| `GET` | `/api/analytics/overview` | Telemetry distributions, merchant category risk, amount bands, and hourly curves |

---

## 💻 Local Execution Guide

### Prerequisites
- Python 3.11+
- Node.js 18+ and npm
- (Optional) Docker & Docker Compose

### 1. Backend Setup
```bash
# Navigate to project root
cd Hackathon_FraudDetection

# Install Python dependencies
pip install -r backend/requirements.txt

# Run the backend server (FastAPI will auto-seed 80 real records from CSV)
uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```
Backend will start on `http://127.0.0.1:8000`.  
Swagger Interactive API documentation is available at `http://127.0.0.1:8000/docs`.

### 2. Frontend Setup
```bash
# In a separate terminal
cd Hackathon_FraudDetection/frontend

# Install dependencies (already installed if workspace is active)
npm install

# Start Vite development server
npm run dev
```
Frontend will be available at `http://localhost:5173`.

---

## 🐳 Docker Deployment

To launch the complete full-stack system with PostgreSQL 16:

```bash
docker compose up --build
```
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8000`
- PostgreSQL: `localhost:5432`

---

## 📂 Project Structure

```
Hackathon_FraudDetection/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── admin.py
│   │   │   ├── analytics.py
│   │   │   ├── auth.py
│   │   │   ├── dashboard.py
│   │   │   ├── health.py
│   │   │   ├── model_info.py
│   │   │   ├── payments.py
│   │   │   ├── predict.py
│   │   │   └── transactions.py
│   │   ├── database/
│   │   │   ├── db.py
│   │   │   ├── models.py
│   │   │   └── seed.py
│   │   ├── schemas/
│   │   │   ├── transaction.py
│   │   │   └── user.py
│   │   ├── services/
│   │   │   ├── auth_service.py
│   │   │   └── ml_service.py
│   │   └── main.py
│   ├── models/
│   │   ├── upi_fraud_model.joblib
│   │   └── upi_fraud_model_metadata.json
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── client.js
│   │   ├── components/
│   │   │   └── layout/
│   │   │       ├── AppLayout.jsx
│   │   │       ├── Navbar.jsx
│   │   │       └── Sidebar.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── pages/
│   │   │   ├── AdminReviewPage.jsx
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── FraudAnalyticsPage.jsx
│   │   │   ├── LiveFraudDetectionPage.jsx
│   │   │   ├── LoginPage.jsx
│   │   │   ├── ModelInfoPage.jsx
│   │   │   ├── TransactionHistoryPage.jsx
│   │   │   └── UserPaymentPage.jsx
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── package.json
│   └── tailwind.config.js
├── .env.example
├── .gitignore
├── docker-compose.yml
├── README.md
└── requirements.txt
```

---

## 🏆 Hackathon Compliance Checklist

- [x] **Loaded existing Joblib model** (`models/upi_fraud_model.joblib`) with zero fabricated predictions.
- [x] **Loaded exact model metadata** (`models/upi_fraud_model_metadata.json`) with cost-optimized thresholds.
- [x] **Strict feature vector compliance**: 16 ordered features including cyclical time transforms ($\sin/\cos$).
- [x] **Data leakage prevention**: Excluded `transaction id`, `transaction_status`, and `fraud_flag`.
- [x] **Decision Engine**: `APPROVE`, `STEP_UP_OTP`, and `BLOCK`.
- [x] **Dual Workflow**: Payer authentication & wallet payment with simulated Step-Up OTP challenge modal.
- [x] **Admin Security Portal**: Live notifications and administrative review (*Approve* or *Reject* risky transfers).
- [x] **Interactive Recharts**: Risk tier donut, 24-hour velocity area chart, merchant exposure, and amount tiers.
- [x] **Export Capabilities**: CSV export of the complete ledger.
- [x] **Docker ready**: Production Dockerfiles, docker-compose.yml, and Nginx reverse proxy configuration.
