import json
from pathlib import Path
from datetime import datetime, date, time

import joblib
import numpy as np
import pandas as pd
import streamlit as st


# ---------------------------------------------------------------------
# Paths: keep these files in the same folder as app.py
# ---------------------------------------------------------------------
BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "upi_fraud_model.joblib"
METADATA_PATH = BASE_DIR / "upi_fraud_model_metadata.json"


st.set_page_config(
    page_title="UPI Fraud Detection",
    page_icon="🛡️",
    layout="wide",
)


@st.cache_resource
def load_model():
    if not MODEL_PATH.exists():
        raise FileNotFoundError(
            f"Model file not found: {MODEL_PATH.name}. "
            "Place it in the same folder as app.py."
        )

    model = joblib.load(MODEL_PATH)

    metadata = {}
    if METADATA_PATH.exists():
        with open(METADATA_PATH, "r", encoding="utf-8") as file:
            metadata = json.load(file)

    return model, metadata


def make_model_input(
    amount,
    transaction_type,
    merchant_category,
    sender_age_group,
    receiver_age_group,
    sender_state,
    sender_bank,
    receiver_bank,
    device_type,
    network_type,
    transaction_datetime,
    input_features,
):
    """Build the same feature columns engineered in the training notebook."""
    hour = transaction_datetime.hour
    day_of_week = transaction_datetime.weekday()

    row = {
        "transaction type": transaction_type,
        "merchant_category": merchant_category,
        "amount (INR)": float(amount),
        "sender_age_group": sender_age_group,
        "receiver_age_group": receiver_age_group,
        "sender_state": sender_state,
        "sender_bank": sender_bank,
        "receiver_bank": receiver_bank,
        "device_type": device_type,
        "network_type": network_type,
        "txn_hour": hour,
        "txn_day_of_week": str(day_of_week),
        "txn_month": str(transaction_datetime.month),
        "txn_is_weekend": int(day_of_week >= 5),
        "hour_sin": float(np.sin(2 * np.pi * hour / 24)),
        "hour_cos": float(np.cos(2 * np.pi * hour / 24)),
    }

    # Preserve the exact feature order saved by the training notebook.
    if input_features:
        row = {feature: row.get(feature, np.nan) for feature in input_features}

    return pd.DataFrame([row])


def risk_decision(probability, otp_threshold, block_threshold):
    if probability >= block_threshold:
        return "BLOCK"
    if probability >= otp_threshold:
        return "STEP_UP_OTP"
    return "APPROVE"


# ---------------------------------------------------------------------
# Load model
# ---------------------------------------------------------------------
st.title("🛡️ UPI Fraud Detection System")
st.caption(
    "Machine-learning-based transaction risk assessment using your trained "
    "UPI fraud detection pipeline."
)

try:
    model, metadata = load_model()
except Exception as error:
    st.error(f"Could not load the trained model: {error}")
    st.info(
        "Required files: upi_fraud_model.joblib and "
        "upi_fraud_model_metadata.json (both beside app.py)."
    )
    st.stop()


model_name = metadata.get("model_name", "Trained classification pipeline")
block_threshold = float(metadata.get("block_threshold",
                                     metadata.get("decision_threshold", 0.5)))
otp_threshold = float(metadata.get("otp_threshold_provisional",
                                  block_threshold * 0.5))
input_features = metadata.get("input_features", [])

with st.sidebar:
    st.header("Model information")
    st.write(f"**Model:** {model_name}")
    st.write(f"**Block threshold:** {block_threshold:.4f}")
    st.write(f"**OTP threshold:** {otp_threshold:.4f}")
    st.caption(
        "The OTP threshold is provisional, as described in the training "
        "notebook. This demo is not connected to a bank or live UPI network."
    )


# ---------------------------------------------------------------------
# Transaction form
# ---------------------------------------------------------------------
st.subheader("Enter transaction details")

with st.form("transaction_form"):
    col1, col2 = st.columns(2)

    with col1:
        amount = st.number_input(
            "Transaction amount (₹)",
            min_value=0.01,
            value=1500.00,
            step=100.0,
            format="%.2f",
        )
        transaction_type = st.text_input(
            "Transaction type",
            placeholder="e.g. P2P, P2M",
        )
        merchant_category = st.text_input(
            "Merchant category",
            placeholder="e.g. Retail, Food, Grocery",
        )
        sender_age_group = st.text_input(
            "Sender age group",
            placeholder="Use the same category format as the training dataset",
        )
        receiver_age_group = st.text_input(
            "Receiver age group",
            placeholder="Use the same category format as the training dataset",
        )
        sender_state = st.text_input(
            "Sender state",
            placeholder="e.g. Andhra Pradesh",
        )

    with col2:
        sender_bank = st.text_input(
            "Sender bank",
            placeholder="Enter bank name/category as in training data",
        )
        receiver_bank = st.text_input(
            "Receiver bank",
            placeholder="Enter bank name/category as in training data",
        )
        device_type = st.text_input(
            "Device type",
            placeholder="e.g. Android, iOS",
        )
        network_type = st.text_input(
            "Network type",
            placeholder="e.g. 4G, 5G, Wi-Fi",
        )

        date_col, time_col = st.columns(2)
        with date_col:
            txn_date = st.date_input("Transaction date", value=date.today())
        with time_col:
            txn_time = st.time_input("Transaction time", value=time(14, 30))

    submitted = st.form_submit_button(
        "Analyze transaction",
        type="primary",
        use_container_width=True,
    )


if submitted:
    required_values = {
        "Transaction type": transaction_type,
        "Merchant category": merchant_category,
        "Sender age group": sender_age_group,
        "Receiver age group": receiver_age_group,
        "Sender state": sender_state,
        "Sender bank": sender_bank,
        "Receiver bank": receiver_bank,
        "Device type": device_type,
        "Network type": network_type,
    }

    missing = [label for label, value in required_values.items()
               if not value.strip()]

    if missing:
        st.warning("Please fill in: " + ", ".join(missing))
    else:
        txn_datetime = datetime.combine(txn_date, txn_time)

        transaction_df = make_model_input(
            amount=amount,
            transaction_type=transaction_type.strip(),
            merchant_category=merchant_category.strip(),
            sender_age_group=sender_age_group.strip(),
            receiver_age_group=receiver_age_group.strip(),
            sender_state=sender_state.strip(),
            sender_bank=sender_bank.strip(),
            receiver_bank=receiver_bank.strip(),
            device_type=device_type.strip(),
            network_type=network_type.strip(),
            transaction_datetime=txn_datetime,
            input_features=input_features,
        )

        try:
            fraud_probability = float(model.predict_proba(transaction_df)[0, 1])
            decision = risk_decision(
                fraud_probability,
                otp_threshold,
                block_threshold,
            )

            st.divider()
            st.subheader("Prediction result")

            metric_col1, metric_col2 = st.columns(2)
            metric_col1.metric(
                "Fraud probability",
                f"{fraud_probability * 100:.2f}%",
            )
            metric_col2.metric("Recommended action", decision)

            if decision == "BLOCK":
                st.error(
                    "High-risk transaction: the model recommends BLOCK."
                )
            elif decision == "STEP_UP_OTP":
                st.warning(
                    "Medium-risk transaction: the model recommends "
                    "additional verification (STEP_UP_OTP)."
                )
            else:
                st.success(
                    "Low-risk transaction: the model recommends APPROVE."
                )

            st.progress(min(max(fraud_probability, 0.0), 1.0))
            st.caption(
                f"APPROVE: below {otp_threshold:.4f} · "
                f"STEP_UP_OTP: {otp_threshold:.4f} to below "
                f"{block_threshold:.4f} · "
                f"BLOCK: {block_threshold:.4f} or higher"
            )

            with st.expander("View model input features"):
                st.dataframe(transaction_df, use_container_width=True)

            st.caption(
                "This is a model recommendation for demonstration purposes, "
                "not a real payment authorization or definitive fraud finding."
            )

        except Exception as error:
            st.error(f"Prediction failed: {error}")
            st.write(
                "Check that the categorical values match the categories and "
                "format used in the training dataset, and that the saved "
                "model and metadata came from the same notebook run."
            )
