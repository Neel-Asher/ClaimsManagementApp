"""
scripts/generate_data.py
========================
Synthetic dataset generator for the InsuranceIQ platform.

Generates realistic insurance data with proper correlations and
fraud patterns that the ML model can learn from.

Produces 4 CSV files:
    - claims_history.csv   (1000 rows) — for ML training & analytics
    - policy_data.csv      (500 rows)  — policies with premiums & status
    - customer_profiles.csv (300 rows) — customer demographics
    - agent_performance.csv (20 rows)  — agent metrics

Usage:
    python -m scripts.generate_data

The generated data follows these fraud patterns (from project spec):
    - Low Risk:  claim < 50K, policy > 180 days, 0-1 prior claims
    - Moderate:  claim 50K-2L, policy 30-180 days, 2-3 prior claims
    - High Risk: claim > 2L, policy < 30 days, > 3 prior claims
"""

import os
import random
from datetime import datetime, timedelta

import numpy as np
import pandas as pd

# ── Constants ──────────────────────────────────────────────────
RANDOM_SEED = 42
OUTPUT_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "sample")

CLAIM_TYPES = ["motor_accident", "health", "property_damage", "life"]
POLICY_STATUSES = ["active", "lapsed", "renewed", "expired"]
CLAIM_STATUSES = ["pending", "settled", "rejected"]
REGIONS = ["North", "South", "East", "West", "Central"]
PRODUCT_TYPES = ["Motor", "Health", "Property", "Life"]

FIRST_NAMES = [
    "Aarav", "Vivaan", "Aditya", "Sai", "Arjun", "Reyansh", "Ayaan", "Krishna",
    "Ishaan", "Shaurya", "Ananya", "Diya", "Priya", "Sneha", "Riya", "Kavya",
    "Meera", "Isha", "Nidhi", "Pooja", "Rahul", "Amit", "Vikram", "Suresh",
    "Rajesh", "Deepak", "Manoj", "Ravi", "Kiran", "Neha",
]
LAST_NAMES = [
    "Sharma", "Patel", "Singh", "Kumar", "Verma", "Gupta", "Joshi", "Nair",
    "Reddy", "Rao", "Mishra", "Pandey", "Mehta", "Shah", "Desai", "Iyer",
    "Menon", "Chatterjee", "Bose", "Das",
]


def set_seed(seed: int = RANDOM_SEED):
    """Set random seeds for reproducibility."""
    random.seed(seed)
    np.random.seed(seed)


# ═══════════════════════════════════════════════════════════════
#  CUSTOMER DATA GENERATION
# ═══════════════════════════════════════════════════════════════


def generate_customers(n: int = 300) -> pd.DataFrame:
    """
    Generate synthetic customer profiles.

    Args:
        n: Number of customers to generate.

    Returns:
        DataFrame with customer_id, name, email, age, address, kyc_status.
    """
    customers = []
    for i in range(1, n + 1):
        first = random.choice(FIRST_NAMES)
        last = random.choice(LAST_NAMES)
        age = random.randint(21, 70)
        customers.append({
            "customer_id": f"CUST-{i:04d}",
            "user_id": f"USR-{i:04d}",
            "name": f"{first} {last}",
            "email": f"{first.lower()}.{last.lower()}{i}@email.com",
            "dob": (datetime.now() - timedelta(days=age * 365)).strftime("%Y-%m-%d"),
            "age": age,
            "address": f"{random.randint(1, 500)}, {random.choice(REGIONS)} Avenue, India",
            "kyc_status": random.choice(["verified", "pending", "rejected"]),
            "agent_id": f"AGT-{random.randint(1, 20):04d}",
        })
    return pd.DataFrame(customers)


# ═══════════════════════════════════════════════════════════════
#  AGENT DATA GENERATION
# ═══════════════════════════════════════════════════════════════


def generate_agents(n: int = 20) -> pd.DataFrame:
    """
    Generate synthetic agent performance data.

    Args:
        n: Number of agents to generate.

    Returns:
        DataFrame with agent metrics including premium collected and policies sold.
    """
    agents = []
    for i in range(1, n + 1):
        first = random.choice(FIRST_NAMES)
        last = random.choice(LAST_NAMES)
        policies_sold = random.randint(10, 120)
        avg_premium = random.uniform(15000, 80000)
        claims_filed = random.randint(2, int(policies_sold * 0.4))
        agents.append({
            "agent_id": f"AGT-{i:04d}",
            "user_id": f"USR-AGT-{i:04d}",
            "agent_name": f"{first} {last}",
            "license_no": f"LIC-{random.randint(100000, 999999)}",
            "region": random.choice(REGIONS),
            "commission_pct": round(random.uniform(2.0, 8.0), 2),
            "status": random.choice(["active", "active", "active", "inactive"]),
            "total_premium_collected": round(policies_sold * avg_premium, 2),
            "policies_sold": policies_sold,
            "claims_filed": claims_filed,
        })
    return pd.DataFrame(agents)


# ═══════════════════════════════════════════════════════════════
#  POLICY DATA GENERATION
# ═══════════════════════════════════════════════════════════════


def generate_policies(n: int = 500, customers_df: pd.DataFrame = None) -> pd.DataFrame:
    """
    Generate synthetic policy data.

    Args:
        n: Number of policies to generate.
        customers_df: Customer DataFrame to link policies to.

    Returns:
        DataFrame with policy details including premiums and status.
    """
    customer_ids = (
        customers_df["customer_id"].tolist()
        if customers_df is not None
        else [f"CUST-{i:04d}" for i in range(1, 301)]
    )

    policies = []
    for i in range(1, n + 1):
        product_type = random.choice(PRODUCT_TYPES)
        start_date = datetime.now() - timedelta(days=random.randint(1, 730))
        term_months = random.choice([12, 24, 36, 60])
        end_date = start_date + timedelta(days=term_months * 30)

        # Premium varies by product type
        premium_ranges = {
            "Motor": (8000, 45000),
            "Health": (10000, 60000),
            "Property": (15000, 80000),
            "Life": (20000, 100000),
        }
        pmin, pmax = premium_ranges[product_type]
        premium = round(random.uniform(pmin, pmax), 2)

        # Determine status based on dates
        if end_date < datetime.now():
            status = random.choice(["expired", "renewed", "lapsed"])
        else:
            status = random.choice(["active", "active", "active", "lapsed"])

        policies.append({
            "policy_id": f"POL-{i:04d}",
            "customer_id": random.choice(customer_ids),
            "agent_id": f"AGT-{random.randint(1, 20):04d}",
            "product_id": f"PROD-{PRODUCT_TYPES.index(product_type) + 1:03d}",
            "product_type": product_type,
            "start_date": start_date.strftime("%Y-%m-%d"),
            "end_date": end_date.strftime("%Y-%m-%d"),
            "premium_amount": premium,
            "term_months": term_months,
            "status": status,
        })
    return pd.DataFrame(policies)


# ═══════════════════════════════════════════════════════════════
#  CLAIMS DATA GENERATION (with fraud patterns)
# ═══════════════════════════════════════════════════════════════


def generate_claims(n: int = 1000, policies_df: pd.DataFrame = None) -> pd.DataFrame:
    """
    Generate synthetic claims with realistic fraud patterns.

    The fraud labels follow the project spec's rule matrix:
        - Low Risk:  amount < 50K, days > 180, prior claims 0-1
        - Moderate:  amount 50K-200K, days 30-180, prior claims 2-3
        - High Risk: amount > 200K, days < 30, prior claims > 3

    About 15% of claims are fraudulent (realistic for insurance industry).

    Args:
        n: Number of claims to generate.
        policies_df: Policy DataFrame to link claims to.

    Returns:
        DataFrame with claim details and fraud labels for ML training.
    """
    if policies_df is not None:
        policy_ids = policies_df["policy_id"].tolist()
        # Build a lookup for policy details
        policy_lookup = policies_df.set_index("policy_id").to_dict("index")
    else:
        policy_ids = [f"POL-{i:04d}" for i in range(1, 501)]
        policy_lookup = {}

    claims = []
    for i in range(1, n + 1):
        policy_id = random.choice(policy_ids)

        # Decide if this claim is fraudulent (~15% fraud rate)
        is_fraud = random.random() < 0.15

        if is_fraud:
            # Generate features that look suspicious
            claim_amount = random.uniform(150000, 500000)
            days_since_policy_start = random.randint(1, 45)
            previous_claims_count = random.randint(3, 8)
            customer_age = random.randint(21, 35)
            surveyor_mismatch = random.choice([0, 0, 1, 1, 1])  # Higher mismatch
        else:
            # Generate normal-looking features
            claim_amount = random.uniform(5000, 200000)
            days_since_policy_start = random.randint(30, 730)
            previous_claims_count = random.randint(0, 3)
            customer_age = random.randint(25, 65)
            surveyor_mismatch = random.choice([0, 0, 0, 0, 1])  # Lower mismatch

        # Get premium from policy if available, else estimate
        policy_info = policy_lookup.get(policy_id, {})
        premium = policy_info.get("premium_amount", random.uniform(10000, 50000))
        policy_premium_ratio = round(claim_amount / premium, 2) if premium > 0 else 0

        claim_type = random.choice(CLAIM_TYPES)
        incident_date = (
            datetime.now() - timedelta(days=random.randint(1, 365))
        ).strftime("%Y-%m-%d")

        # Assign status with weighted distribution
        if is_fraud:
            status = random.choices(
                ["pending", "rejected", "settled"],
                weights=[0.5, 0.4, 0.1],
            )[0]
        else:
            status = random.choices(
                ["pending", "settled", "rejected"],
                weights=[0.2, 0.65, 0.15],
            )[0]

        claims.append({
            "claim_id": f"CLM-{i:04d}",
            "policy_id": policy_id,
            "customer_id": policy_info.get("customer_id", f"CUST-{random.randint(1, 300):04d}"),
            "agent_id": policy_info.get("agent_id", f"AGT-{random.randint(1, 20):04d}"),
            "claim_type": claim_type,
            "incident_date": incident_date,
            "claim_amount": round(claim_amount, 2),
            "days_since_policy_start": days_since_policy_start,
            "previous_claims_count": previous_claims_count,
            "customer_age": customer_age,
            "policy_premium_ratio": policy_premium_ratio,
            "surveyor_mismatch_flag": surveyor_mismatch,
            "status": status,
            "is_fraud": int(is_fraud),
        })

    return pd.DataFrame(claims)


# ═══════════════════════════════════════════════════════════════
#  MAIN — Generate all datasets
# ═══════════════════════════════════════════════════════════════


def generate_all_datasets():
    """
    Generate all 4 synthetic datasets and save to data/sample/.

    Prints summary statistics for each dataset.
    """
    set_seed()
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    print("=" * 60)
    print("  InsuranceIQ -- Synthetic Data Generation")
    print("=" * 60)

    # ── Generate in dependency order ───────────────────────────
    print("\n[1/4] Generating customer profiles...")
    customers_df = generate_customers(300)
    customers_path = os.path.join(OUTPUT_DIR, "customer_profiles.csv")
    customers_df.to_csv(customers_path, index=False)
    print(f"  OK: {len(customers_df)} customers -> {customers_path}")

    print("\n[2/4] Generating agent performance data...")
    agents_df = generate_agents(20)
    agents_path = os.path.join(OUTPUT_DIR, "agent_performance.csv")
    agents_df.to_csv(agents_path, index=False)
    print(f"  OK: {len(agents_df)} agents -> {agents_path}")

    print("\n[3/4] Generating policy data...")
    policies_df = generate_policies(500, customers_df)
    policies_path = os.path.join(OUTPUT_DIR, "policy_data.csv")
    policies_df.to_csv(policies_path, index=False)
    print(f"  OK: {len(policies_df)} policies -> {policies_path}")

    print("\n[4/4] Generating claims history (with fraud patterns)...")
    claims_df = generate_claims(1000, policies_df)
    claims_path = os.path.join(OUTPUT_DIR, "claims_history.csv")
    claims_df.to_csv(claims_path, index=False)
    print(f"  OK: {len(claims_df)} claims -> {claims_path}")

    # ── Print summary ─────────────────────────────────────────
    fraud_count = claims_df["is_fraud"].sum()
    fraud_pct = (fraud_count / len(claims_df)) * 100
    print("\n" + "=" * 60)
    print("  Summary")
    print("=" * 60)
    print(f"  Customers:    {len(customers_df)}")
    print(f"  Agents:       {len(agents_df)}")
    print(f"  Policies:     {len(policies_df)}")
    print(f"  Claims:       {len(claims_df)}")
    print(f"  Fraudulent:   {fraud_count} ({fraud_pct:.1f}%)")
    print(f"  Legitimate:   {len(claims_df) - fraud_count} ({100 - fraud_pct:.1f}%)")
    print(f"\n  Output dir:   {os.path.abspath(OUTPUT_DIR)}")
    print("=" * 60)


if __name__ == "__main__":
    generate_all_datasets()
