# 🛡️ UPI Sentinel – AI-Powered UPI Fraud Detection System

<p align="center">
  <strong>Real-Time AI-Powered Digital Payment Security & Geofencing</strong>
</p>

<p align="center">
  <a href="https://upi-sentinel-frontend.onrender.com/"><strong>🚀 View Live Application</strong></a>
  &nbsp; | &nbsp;
  <a href="https://vigneshbabu4.github.io/LOGIC-LOOM/"><strong>📊 EDA & Visualization</strong></a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Frontend-React%20%2B%20Vite-blue?logo=react" />
  <img src="https://img.shields.io/badge/Backend-FastAPI-009688?logo=fastapi" />
  <img src="https://img.shields.io/badge/ML-Extra%20Trees-orange" />
  <img src="https://img.shields.io/badge/Database-PostgreSQL%20%7C%20SQLite-336791?logo=postgresql" />
  <img src="https://img.shields.io/badge/Deployment-Docker%20%2B%20Render-2496ED?logo=docker" />
</p>

---

## 📌 Project Overview

**UPI Sentinel** is an intelligent digital payment fraud detection and monitoring platform designed to identify suspicious UPI transactions using Machine Learning.

With the rapid adoption of Unified Payments Interface (UPI) payments, detecting fraudulent transaction patterns has become an important challenge for digital payment security.

UPI Sentinel addresses this challenge through a machine learning-based classification system that analyzes transaction characteristics and predicts whether a transaction is legitimate or potentially fraudulent.

The platform combines a React-based user interface, FastAPI backend, trained Machine Learning model, and a relational database to provide transaction monitoring, fraud prediction, analytics, and administrative capabilities.

### 🎯 Objectives

- Detect potentially fraudulent UPI transactions using Machine Learning.
- Analyze transaction characteristics and behavioral patterns.
- Provide real-time fraud prediction through REST APIs.
- Maintain transaction records and monitor suspicious activities.
- Provide an interactive dashboard for transaction analytics.
- Support secure user authentication and administrative monitoring.
- Deploy the complete application using Docker and cloud infrastructure.

---

## ✨ Key Features

| Feature | Description |
|---|---|
| AI Fraud Detection | Predicts whether a transaction is legitimate or fraudulent. |
| Real-Time Prediction | Provides fraud predictions through FastAPI endpoints. |
| Transaction Monitoring | Maintains and retrieves transaction records. |
| Analytics Dashboard | Displays transaction statistics and analytical insights. |
| User Authentication | Supports login and payer registration. |
| Admin Console | Provides administrative monitoring capabilities. |
| ML Model Information | Exposes information about the active prediction model. |
| Data Visualization | Provides EDA and visualization through a separate dashboard. |
| Cloud Deployment | Frontend and backend deployed using Docker on Render. |
| Database Integration | Supports PostgreSQL through Supabase and SQLite for local development. |

---

## 🧠 Machine Learning Model

### Selected Algorithm: Extra Trees Classifier

UPI Sentinel uses an **Extra Trees (Extremely Randomized Trees) Classifier with class weighting** for transaction fraud classification.

Extra Trees is an ensemble-based supervised Machine Learning algorithm that combines multiple randomized decision trees to produce a final classification.

Instead of depending on a single decision tree, the algorithm builds multiple trees using randomized feature selection and split thresholds. Their predictions are aggregated to determine the final class.

### Why did we choose Extra Trees?

Fraud detection is a classification problem involving structured transaction data with a mixture of numerical and categorical features.

For example:

- Transaction amount
- Transaction type
- Merchant category
- Sender and receiver age groups
- Sender state
- Sender and receiver banks
- Device type
- Network type
- Transaction status

These variables can interact in complex ways. A transaction may not be suspicious based on its amount alone, but a combination of transaction type, merchant category, device type, and other characteristics may indicate a potential risk.

Extra Trees is suitable for this type of problem for several reasons.

**1. Ability to capture non-linear relationships**

Fraudulent transactions do not always follow simple linear patterns.

Extra Trees can learn complex decision boundaries and combinations of transaction features without requiring a predefined linear relationship.

**2. Ensemble learning**

A single decision tree may overfit particular training examples.

Extra Trees combines predictions from multiple randomized trees, helping reduce the variance associated with individual trees.

**3. Randomized split selection**

Extra Trees introduces additional randomness when selecting decision boundaries.

This helps create diverse trees and can improve generalization when working with complex structured datasets.

**4. Class imbalance handling**

Financial fraud datasets frequently contain significantly more legitimate transactions than fraudulent transactions.

Our selected model uses `class_weight` to assign greater importance to underrepresented classes during training.

This helps the classifier pay more attention to fraudulent transactions rather than simply favoring the majority class.

**5. Compatibility with structured transaction data**

Extra Trees works effectively with numerical and encoded categorical features and can learn feature interactions without requiring extensive manual feature transformations.

### Why not use Logistic Regression?

Logistic Regression is a useful baseline classification algorithm, but it primarily learns a linear decision boundary in its transformed feature space.

Fraud patterns may involve complex combinations of transaction attributes. Extra Trees can capture such non-linear interactions more naturally.

### Why not use a single Decision Tree?

A single decision tree can easily become sensitive to training data variations.

An ensemble of randomized trees provides a more robust approach by aggregating predictions from multiple trees.

### Model selection summary

| Criterion | Why Extra Trees is suitable |
|---|---|
| Data type | Structured numerical and categorical transaction data |
| Classification | Supports binary fraud classification |
| Non-linearity | Learns complex feature interactions |
| Ensemble learning | Aggregates multiple randomized trees |
| Class imbalance | Supports class weighting |
| Prediction | Supports efficient inference using a saved model |

**Final selection:** Extra Trees Classifier with class weighting was selected as the active deployed model based on its suitability for structured transaction classification and imbalanced fraud detection.

---

## ⚙️ Machine Learning Workflow

The machine learning pipeline follows these stages:

1. **Data Collection:** Load the UPI transaction dataset.
2. **Exploratory Data Analysis:** Examine distributions, transaction patterns, fraud distribution, and feature relationships.
3. **Data Cleaning:** Handle missing values, inconsistent data, and duplicate records where applicable.
4. **Feature Engineering:** Prepare numerical and categorical transaction attributes.
5. **Preprocessing:** Apply imputation, scaling, and categorical encoding through a preprocessing pipeline.
6. **Model Training:** Train the Extra Trees Classifier with class weighting.
7. **Model Evaluation:** Evaluate the trained classifier using classification metrics and a confusion matrix.
8. **Model Serialization:** Save the trained model and associated metadata using Joblib.
9. **Model Integration:** Load the trained artifact into the FastAPI backend.
10. **Real-Time Inference:** Receive transaction details, preprocess them, and generate fraud predictions.

### Model preprocessing pipeline

The deployed model artifacts indicate the use of the following preprocessing components:

- SimpleImputer – handles missing values.
- StandardScaler – scales numerical features.
- OneHotEncoder – transforms categorical features.
- ColumnTransformer – applies appropriate transformations to different feature groups.
- ExtraTreesClassifier – performs final classification.

The preprocessing pipeline and trained classifier are loaded together through the serialized Joblib model.

---

## 📊 Model Evaluation

The model evaluation process focuses on understanding how well the classifier identifies fraudulent transactions.

The important evaluation metrics include:

| Metric | Purpose |
|---|---|
| Accuracy | Overall percentage of correctly classified transactions. |
| Precision | Proportion of predicted fraudulent transactions that are actually fraudulent. |
| Recall | Proportion of actual fraudulent transactions correctly detected. |
| F1-Score | Harmonic mean of precision and recall. |
| Confusion Matrix | Shows correct and incorrect predictions for each class. |
| ROC-AUC | Measures the model's ability to distinguish between the classes across classification thresholds. |

### Why recall matters in fraud detection

In financial fraud detection, False Negatives are particularly important.

A False Negative occurs when an actually fraudulent transaction is classified as legitimate.

A high recall score indicates that the model successfully identifies a larger proportion of actual fraudulent transactions.

However, precision must also be considered because excessive false alerts can negatively affect legitimate users.

Therefore, fraud detection requires balancing fraud identification with false-positive reduction.

---

## 🏗️ System Architecture

```mermaid
flowchart TD
    A[UPI Transaction Dataset] --> B[EDA and Data Cleaning]
    B --> C[Feature Engineering]
    C --> D[Preprocessing Pipeline]
    D --> E[Extra Trees Classifier]
    E --> F[Model Evaluation]
    F --> G[Joblib Model Artifact]

    H[React Frontend] --> I[FastAPI Backend]
    I --> J[Authentication]
    I --> K[ML Prediction Service]
    G --> K
    K --> L[Fraud Prediction]
    I --> M[Database Layer]
    M --> N[(Supabase PostgreSQL)]
    M --> O[(Local SQLite)]
    I --> P[Analytics and Dashboard APIs]
    P --> H
    L --> H
```

### Application workflow

1. A user accesses the UPI Sentinel frontend.
2. The frontend communicates with the FastAPI backend using REST APIs.
3. The backend handles authentication and transaction requests.
4. Transaction attributes are passed to the ML prediction service.
5. The preprocessing pipeline transforms the input features.
6. The Extra Trees classifier generates a fraud classification.
7. The backend processes the prediction and manages transaction records.
8. Dashboard and analytics APIs provide relevant information to the frontend.

---

## 🛠️ Technology Stack

| Category | Technologies |
|---|---|
| Frontend | React.js, JavaScript, Vite |
| Styling | Tailwind CSS |
| Backend | Python, FastAPI |
| API Server | Uvicorn |
| Machine Learning | Scikit-learn, Extra Trees |
| Data Processing | Pandas, NumPy |
| Model Serialization | Joblib |
| Database | PostgreSQL, SQLite |
| Database Hosting | Supabase |
| ORM | SQLAlchemy |
| Containerization | Docker |
| Web Server | Nginx |
| Cloud Deployment | Render |
| Data Visualization | Python, Pandas, visualization libraries |
| Version Control | Git, GitHub |

---

## 📂 Project Structure

```text
Logic_Loom_Hackathon/
│
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── database.py
│   │   ├── models/
│   │   └── ...
│   │
│   ├── models/
│   │   ├── upi_fraud_model.joblib
│   │   └── upi_fraud_model_metadata.json
│   │
│   ├── Dockerfile
│   ├── requirements.txt
│   └── upi_sentinel.db
│
├── frontend/
│   ├── public/
│   ├── src/
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── package.json
│   └── vite.config.js
│
├── Model/
│   ├── app.py
│   ├── upi_fraud_model_metadata.json
│   ├── upi_fraud_model.joblib
│   └── UPI_Fraud_Model_Training_Testing.ipynb
│
├── UPI_Data_Cleaning_and_EDA.ipynb
├── upi_transactions_2024.csv
├── upi_transactions_cleaned.csv
├── docker-compose.yml
├── render.yaml
├── requirements.txt
├── .env.example
└── README.md
```

*Note: This is a representative project structure. Some generated artifacts and local development files may be excluded from GitHub.*

---

## 🚀 Running the Project Locally

### Prerequisites

Install the following:

- Python 3.11+
- Node.js 20+
- npm
- Git
- Docker Desktop (optional)

### 1. Clone the repository

```bash
git clone https://github.com/MThulasiReddy/Logic_Loom_Hackathon.git

cd Logic_Loom_Hackathon
```

### 2. Start the backend

Open a terminal:

```bash
cd backend
```

Create a virtual environment:

```bash
python -m venv venv
```

Activate it on Windows:

```bash
venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Configure your environment variables if required.

For local SQLite development, the backend can use its default database configuration when `DATABASE_URL` is not set.

Start the FastAPI server:

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend URL:

```text
http://localhost:8000
```

Swagger API documentation:

```text
http://localhost:8000/docs
```

### 3. Start the frontend

Open another terminal:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Create a `.env` file in the frontend directory:

```env
VITE_API_BASE_URL=http://localhost:8000
```

Start the development server:

```bash
npm run dev
```

Frontend URL:

```text
http://localhost:5173
```

### 4. Configure PostgreSQL with Supabase (Optional)

For cloud database connectivity, configure the following environment variable in the backend:

```env
DATABASE_URL=postgresql+psycopg://USERNAME:PASSWORD@HOST:5432/postgres?sslmode=require
```

For local development, SQLite can be used without configuring PostgreSQL.

Never commit actual database credentials or secret keys to GitHub.

---

## 🐳 Docker Deployment

The project uses separate Dockerfiles for the frontend and backend.

### Backend Docker build

From the repository root:

```bash
docker build -t upi-sentinel-backend -f backend/Dockerfile backend
```

Run:

```bash
docker run -p 8000:10000 upi-sentinel-backend
```

Configure `DATABASE_URL` when using Supabase.

### Frontend Docker build

From the repository root:

```bash
docker build \
  --build-arg VITE_API_BASE_URL=https://upi-fraud-prevention.onrender.com \
  -t upi-sentinel-frontend \
  -f frontend/Dockerfile frontend
```

Run:

```bash
docker run -p 3000:80 upi-sentinel-frontend
```

Open:

```text
http://localhost:3000
```

### Cloud deployment

The application is deployed using:

- Render Web Services for the backend.
- Render Web Services for the frontend.
- Docker for containerization.
- Supabase for hosted PostgreSQL database services.

---

## 🔗 API Endpoints

The backend exposes REST APIs for the major application functionalities.

**Base URL:**

```text
https://upi-fraud-prevention.onrender.com
```

| Endpoint | Method | Purpose |
|---|---|---|
| `/` | GET | Backend service information |
| `/docs` | GET | Interactive API documentation |
| `/api/predict` | POST | Predict transaction fraud |
| `/api/transactions` | GET | Retrieve transaction records |
| `/api/dashboard/stats` | GET | Dashboard statistics |
| `/api/model/info` | GET | Active ML model information |
| `/api/health` | GET | Backend health status |
| `/api/analytics/overview` | GET | Analytics overview |

Authentication routes include registration and login under the `/api/auth/` namespace.

For request parameters and response schemas, refer to the interactive Swagger documentation.

---

## 🔐 Security Considerations

- Passwords should be stored using secure password hashing.
- Database credentials must be maintained through environment variables.
- Production CORS settings should allow only trusted frontend origins.
- Authentication secrets must not be committed to source control.
- Administrative credentials should be configured securely.
- User and transaction data should be handled responsibly.

---

## 📈 Exploratory Data Analysis & Visualization

A separate EDA and visualization dashboard presents the dataset exploration and analytical findings.

It covers:

- Transaction distribution analysis.
- Fraudulent versus legitimate transaction distribution.
- Transaction amount analysis.
- Transaction category analysis.
- Sender and receiver demographic distributions.
- Bank and state-wise transaction analysis.
- Device and network analysis.
- Feature relationships and visual exploration.

**Explore the analysis:**

[UPI Sentinel – EDA & Visualization](https://vigneshbabu4.github.io/LOGIC-LOOM/)

---

## 🔮 Future Enhancements

- Advanced fraud detection using XGBoost and ensemble comparisons.
- Explainable AI using SHAP.
- Real-time transaction stream processing.
- Geospatial fraud pattern visualization.
- Anomaly detection for unusual transaction behavior.
- Advanced fraud risk scoring and alert prioritization.
- Improved model monitoring and periodic retraining.
- Expanded security controls and audit logging.

---

## 👨‍💻 Project Information

**Project:** UPI Sentinel – Intelligent Fraud Detection System

**Domain:** Artificial Intelligence, Machine Learning, FinTech and Cybersecurity

**Institution:** K L University

**Project Context:** Logic Loom Hackathon

**Primary Technologies:** React, FastAPI, Python, Scikit-learn, PostgreSQL and Docker.

---

## ⚠️ Disclaimer

UPI Sentinel is an academic and hackathon project developed for demonstrating Machine Learning-based digital payment fraud detection.

Predictions are generated by a trained classification model and should not be considered definitive proof of fraudulent activity or used as the sole basis for financial decisions.

---

<p align="center">
  <strong>🛡️ UPI Sentinel – Making Digital Payments Smarter and Safer.</strong>
</p>
