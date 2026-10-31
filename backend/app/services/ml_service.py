import os
import json
import logging
import urllib.request
from pathlib import Path
from datetime import datetime
from typing import Dict, Any, Tuple, Optional
import numpy as np
import pandas as pd
import joblib

from ..utils.timezone import IST, get_ist_now

logger = logging.getLogger("upi_sentinel.ml_service")

class MLInferenceService:
    _instance: Optional["MLInferenceService"] = None

    def __init__(self, model_dir: Optional[str] = None):
        if model_dir is None:
            base_dir = Path(__file__).resolve().parent.parent.parent
            model_path_candidate = base_dir / "models" / "upi_fraud_model.joblib"
            if not model_path_candidate.exists():
                model_path_candidate = base_dir.parent / "Model" / "upi_fraud_model.joblib"
            self.model_path = model_path_candidate
            
            meta_path_candidate = base_dir / "models" / "upi_fraud_model_metadata.json"
            if not meta_path_candidate.exists():
                meta_path_candidate = base_dir.parent / "Model" / "upi_fraud_model_metadata.json"
            self.metadata_path = meta_path_candidate
        else:
            self.model_path = Path(model_dir) / "upi_fraud_model.joblib"
            self.metadata_path = Path(model_dir) / "upi_fraud_model_metadata.json"

        self.model = None
        self.metadata = {}
        self.is_loaded = False
        self.load_error: Optional[str] = None
        
        # Dynamic configurable thresholds (defaults from metadata)
        self.custom_block_threshold: Optional[float] = None
        self.custom_otp_threshold: Optional[float] = None
        
        self._load_model_and_metadata()

    @classmethod
    def get_instance(cls) -> "MLInferenceService":
        if cls._instance is None:
            cls._instance = MLInferenceService()
        return cls._instance

    def _load_model_and_metadata(self):
        try:
            if not self.metadata_path.exists():
                raise FileNotFoundError(f"Model metadata file not found at: {self.metadata_path}")
            
            with open(self.metadata_path, "r", encoding="utf-8") as f:
                self.metadata = json.load(f)
            logger.info(f"Loaded model metadata from {self.metadata_path}")

            if not self.model_path.exists():
                raise FileNotFoundError(f"Trained model artifact not found at: {self.model_path}")

            logger.info(f"Loading Joblib model from {self.model_path}...")
            self.model = joblib.load(self.model_path)
            self.is_loaded = True
            self.load_error = None
            logger.info(f"Model successfully loaded. Active model: {self.metadata.get('model_name')}")
        except Exception as e:
            self.is_loaded = False
            self.load_error = str(e)
            logger.error(f"Failed to load ML model: {e}")

    def set_thresholds(self, block_threshold: float, otp_threshold: float):
        """Allows Admin to dynamically adjust decision cutoffs."""
        self.custom_block_threshold = float(block_threshold)
        self.custom_otp_threshold = float(otp_threshold)
        logger.info(f"Admin adjusted thresholds: block={self.custom_block_threshold}, otp={self.custom_otp_threshold}")

    def get_current_thresholds(self) -> Dict[str, float]:
        block_t = self.custom_block_threshold if self.custom_block_threshold is not None else float(self.metadata.get("block_threshold", 0.571))
        otp_t = self.custom_otp_threshold if self.custom_otp_threshold is not None else float(self.metadata.get("otp_threshold_provisional", 0.2855))
        return {
            "block_threshold": block_t,
            "otp_threshold_provisional": otp_t,
            "decision_threshold": block_t,
            "is_customized": self.custom_block_threshold is not None
        }

    def inspect_ip_location(
        self, 
        ip_str: Optional[str], 
        registered_country: str = "India",
        client_country: Optional[str] = None,
        client_country_code: Optional[str] = None,
        client_city: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Geofence IP inspection:
        Resolves geolocation for client IP address.
        Triggers international alert if transaction originates outside the user's registered home country (e.g. via VPN or foreign IP).
        """
        reg_c = (registered_country or "India").strip().lower()

        # 1. If explicit client country was passed (from browser public-IP lookup or VPN test simulator)
        if client_country:
            c_name = client_country.strip()
            c_code = (client_country_code or "XX").strip().upper()
            is_intl = False
            if reg_c in ["india", "in"]:
                if c_name.lower() != "india" and c_code != "IN":
                    is_intl = True
            else:
                if c_name.lower() != reg_c and c_code.lower() != reg_c:
                    is_intl = True
            return {
                "ip": ip_str or "127.0.0.1",
                "country": c_name,
                "country_code": c_code,
                "city": client_city or "Detected Location",
                "is_international": is_intl
            }

        # 2. Localhost and Loopback handling
        if not ip_str or ip_str in ["127.0.0.1", "localhost", "::1"]:
            is_match = (reg_c in ["india", "in"])
            return {
                "ip": ip_str or "127.0.0.1",
                "country": "India" if is_match else registered_country,
                "country_code": "IN" if is_match else "XX",
                "city": "Mumbai" if is_match else "Registered City",
                "is_international": not is_match
            }

        # 3. Check for private network ranges
        clean_ip = ip_str.split(",")[0].strip()
        if clean_ip.startswith(("10.", "192.168.", "172.16.", "172.17.", "172.18.", "172.19.", "172.20.", "172.21.", "172.22.", "172.23.", "172.24.", "172.25.", "172.26.", "172.27.", "172.28.", "172.29.", "172.30.", "172.31.")):
            is_match = (reg_c in ["india", "in"])
            return {
                "ip": clean_ip,
                "country": "India" if is_match else registered_country,
                "country_code": "IN" if is_match else "XX",
                "city": "Internal Network",
                "is_international": not is_match
            }

        # 4. Outbound GeoIP resolution via ip-api
        try:
            url = f"http://ip-api.com/json/{clean_ip}?fields=status,country,countryCode,city,query"
            req = urllib.request.Request(url, headers={"User-Agent": "UPISentinel/1.0"})
            with urllib.request.urlopen(req, timeout=3.0) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                if data.get("status") == "success":
                    country_code = data.get("countryCode", "IN").upper()
                    country_name = data.get("country", "Unknown")
                    city = data.get("city", "Unknown")
                    
                    # Cross-border check against registered home country
                    is_international = False
                    if reg_c in ["india", "in"]:
                        if country_code != "IN" and country_name.lower() != "india":
                            is_international = True
                    else:
                        if country_name.lower() != reg_c and country_code.lower() != reg_c:
                            is_international = True

                    return {
                        "ip": clean_ip,
                        "country": country_name,
                        "country_code": country_code,
                        "city": city,
                        "is_international": is_international
                    }
        except Exception as e:
            logger.warning(f"GeoIP resolution failed for IP {clean_ip}: {e}")

        # Fallback heuristic for public IPs if lookup service is unreachable
        return {
            "ip": clean_ip,
            "country": "India",
            "country_code": "IN",
            "city": "Domestic",
            "is_international": False
        }

    def get_model_info(self) -> Dict[str, Any]:
        thresholds = self.get_current_thresholds()
        return {
            "status": "ready" if self.is_loaded else "error",
            "error": self.load_error,
            "project": self.metadata.get("project", "UPI Real-Time Fraud Detection"),
            "model_name": self.metadata.get("model_name", "Extra Trees (class_weight)"),
            "decision_threshold": thresholds["decision_threshold"],
            "otp_threshold_provisional": thresholds["otp_threshold_provisional"],
            "block_threshold": thresholds["block_threshold"],
            "is_customized_by_admin": thresholds["is_customized"],
            "threshold_method": self.metadata.get("threshold_method"),
            "evaluation_metrics": {
                "validation_pr_auc": self.metadata.get("validation_pr_auc"),
                "test_pr_auc": self.metadata.get("test_pr_auc"),
                "test_recall": self.metadata.get("test_recall"),
                "test_precision": self.metadata.get("test_precision"),
            },
            "input_features": self.metadata.get("input_features", []),
            "numeric_features": self.metadata.get("numeric_features", []),
            "categorical_features": self.metadata.get("categorical_features", []),
            "excluded_columns": self.metadata.get("excluded_columns", []),
            "note": self.metadata.get("note", "")
        }

    def prepare_features(self, payload: Dict[str, Any]) -> pd.DataFrame:
        ts_val = payload.get("timestamp")
        if isinstance(ts_val, str):
            try:
                dt = datetime.fromisoformat(ts_val.replace("Z", "+00:00"))
            except Exception:
                try:
                    dt = pd.to_datetime(ts_val).to_pydatetime()
                except Exception:
                    dt = get_ist_now()
        elif isinstance(ts_val, datetime):
            dt = ts_val
        else:
            dt = get_ist_now()

        # Convert to Indian Standard Time (IST) to ensure exact local hour for features
        if dt.tzinfo is not None:
            dt = dt.astimezone(IST)

        raw_hour = payload.get("txn_hour")
        txn_hour = int(raw_hour) if raw_hour is not None else dt.hour

        raw_dow = payload.get("day_of_week")
        day_of_week_int = int(raw_dow) if raw_dow is not None else dt.weekday()

        raw_dow_str = payload.get("txn_day_of_week")
        txn_day_of_week = str(raw_dow_str) if raw_dow_str is not None else str(day_of_week_int)

        raw_month = payload.get("txn_month")
        txn_month = str(raw_month) if raw_month is not None else str(dt.month)

        raw_weekend = payload.get("txn_is_weekend")
        txn_is_weekend = int(raw_weekend) if raw_weekend is not None else int(day_of_week_int >= 5)

        hour_sin = float(np.sin(2 * np.pi * txn_hour / 24))
        hour_cos = float(np.cos(2 * np.pi * txn_hour / 24))

        amount = float(payload.get("amount (INR)", payload.get("amount_inr", payload.get("amount", 0.0))))

        feature_dict = {
            "transaction type": str(payload.get("transaction type", payload.get("transaction_type", "P2P"))),
            "merchant_category": str(payload.get("merchant_category", "Other")),
            "amount (INR)": amount,
            "sender_age_group": str(payload.get("sender_age_group", "26-35")),
            "receiver_age_group": str(payload.get("receiver_age_group", "26-35")),
            "sender_state": str(payload.get("sender_state", "Maharashtra")),
            "sender_bank": str(payload.get("sender_bank", "SBI")),
            "receiver_bank": str(payload.get("receiver_bank", "HDFC")),
            "device_type": str(payload.get("device_type", "Android")),
            "network_type": str(payload.get("network_type", "4G")),
            "txn_hour": txn_hour,
            "txn_day_of_week": txn_day_of_week,
            "txn_month": txn_month,
            "txn_is_weekend": txn_is_weekend,
            "hour_sin": hour_sin,
            "hour_cos": hour_cos
        }

        expected_cols = self.metadata.get("input_features", [
            "transaction type", "merchant_category", "amount (INR)",
            "sender_age_group", "receiver_age_group", "sender_state",
            "sender_bank", "receiver_bank", "device_type", "network_type",
            "txn_hour", "txn_day_of_week", "txn_month", "txn_is_weekend",
            "hour_sin", "hour_cos"
        ])

        df = pd.DataFrame([feature_dict])[expected_cols]
        return df

    def predict(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        if not self.is_loaded or self.model is None:
            raise RuntimeError(f"ML Model is not loaded. Cause: {self.load_error or 'Artifact missing'}")

        df_features = self.prepare_features(payload)
        
        # Predict probability
        proba = self.model.predict_proba(df_features)
        
        pos_class = self.metadata.get("positive_class", 1)
        classes = list(self.model.classes_)
        if pos_class in classes:
            pos_idx = classes.index(pos_class)
        else:
            pos_idx = 1 if len(classes) > 1 else 0

        fraud_prob = float(proba[0][pos_idx])
        risk_percentage = round(fraud_prob * 100.0, 2)

        # Retrieve current configurable thresholds
        thresholds = self.get_current_thresholds()
        block_threshold = thresholds["block_threshold"]
        otp_threshold = thresholds["otp_threshold_provisional"]

        # IP Geofencing location inspection against user's registered country
        raw_ip = payload.get("ip_address") or payload.get("client_ip")
        registered_country = payload.get("registered_country") or payload.get("sender_country") or "India"
        registered_state = payload.get("registered_state") or payload.get("sender_state") or "Maharashtra"
        client_country = payload.get("client_country")
        client_country_code = payload.get("client_country_code")
        client_city = payload.get("client_city")
        receiver_country = payload.get("receiver_country")

        geo_info = self.inspect_ip_location(
            raw_ip,
            registered_country=registered_country,
            client_country=client_country,
            client_country_code=client_country_code,
            client_city=client_city
        )

        # Beneficiary cross-border check (if receiver is registered abroad)
        is_receiver_abroad = False
        if receiver_country and registered_country:
            rc = receiver_country.strip().lower()
            sc = registered_country.strip().lower()
            if rc != sc and not (rc in ["india", "in"] and sc in ["india", "in"]):
                is_receiver_abroad = True

        # Base Risk Decision Engine
        if fraud_prob >= block_threshold:
            decision = "BLOCK"
            status = "BLOCKED"
        elif fraud_prob >= otp_threshold:
            decision = "STEP_UP_OTP"
            status = "PENDING_OTP"
        else:
            decision = "APPROVE"
            status = "APPROVED"

        explanation_reasons = []
        txn_hour = df_features["txn_hour"].iloc[0]
        amount = df_features["amount (INR)"].iloc[0]
        is_weekend = df_features["txn_is_weekend"].iloc[0]

        # Check International / VPN Anomaly
        if geo_info["is_international"]:
            decision = "BLOCK"
            status = "PENDING_ADMIN_REVIEW"
            risk_percentage = max(risk_percentage, 92.5)
            explanation_reasons.append(
                f"🚨 [CROSS-BORDER VPN GEOFENCE BREACH]: User is registered in {registered_country} ({registered_state}), "
                f"but transaction originated from foreign/VPN IP {geo_info['ip']} ({geo_info['country']}, {geo_info['country_code']}). "
                f"Cross-border transfer violates standard domestic policy. Transaction is blocked and forwarded to Security Admin Review."
            )

        if is_receiver_abroad:
            decision = "BLOCK"
            status = "PENDING_ADMIN_REVIEW"
            risk_percentage = max(risk_percentage, 91.0)
            explanation_reasons.append(
                f"🚨 [CROSS-BORDER BENEFICIARY OUTFLOW]: Recipient is registered in {receiver_country}, while payer baseline is {registered_country}. "
                f"Cross-border outbound remittance is held for Security Admin Review."
            )

        if decision == "BLOCK" and not geo_info["is_international"]:
            explanation_reasons.append(f"High-risk anomaly detected by Extra Trees classifier (Fraud probability: {risk_percentage}% >= Block threshold {round(block_threshold*100, 1)}%).")
            if amount > 50000:
                explanation_reasons.append(f"Elevated transaction sum (₹{amount:,.2f}) deviates significantly from standard retail patterns.")
            if txn_hour in [1, 2, 3, 4, 23, 0]:
                explanation_reasons.append(f"Off-peak nocturnal velocity flag (Hour: {txn_hour:02d}:00).")
            explanation_reasons.append("Immediate transaction freeze instituted to protect payer funds.")
        elif decision == "STEP_UP_OTP":
            explanation_reasons.append(f"Moderate risk profile detected (Fraud probability: {risk_percentage}% >= OTP threshold {round(otp_threshold*100, 1)}%).")
            if is_weekend:
                explanation_reasons.append("Weekend transaction volume pattern with atypical peer/merchant route.")
            if amount > 20000:
                explanation_reasons.append(f"Value exceeding normal threshold tier (₹{amount:,.2f}).")
            explanation_reasons.append("Provisional Step-Up authentication challenge required before fund release.")
        elif decision == "APPROVE":
            explanation_reasons.append(f"Transaction metrics strictly within verified safe parameters (Fraud probability: {risk_percentage}% < {round(otp_threshold*100, 1)}%). Domestic IP verified ({geo_info['country']}). Instant settlement approved.")

        return {
            "fraud_probability": round(fraud_prob, 6),
            "risk_percentage": risk_percentage,
            "decision": decision,
            "status": status,
            "model_name": self.metadata.get("model_name", "Extra Trees (class_weight)"),
            "thresholds": {
                "decision_threshold": block_threshold,
                "otp_threshold_provisional": otp_threshold,
                "block_threshold": block_threshold
            },
            "explanation": " ".join(explanation_reasons),
            "geo_info": geo_info,
            "engineered_features": {
                "txn_hour": int(txn_hour),
                "txn_is_weekend": int(is_weekend),
                "hour_sin": round(float(df_features["hour_sin"].iloc[0]), 4),
                "hour_cos": round(float(df_features["hour_cos"].iloc[0]), 4)
            }
        }
