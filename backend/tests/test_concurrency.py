import pytest
from concurrent.futures import ThreadPoolExecutor
from backend.tests.conftest import TestingSessionLocal
from backend.app.models.user import User
from backend.app.models.wallet import Wallet

def test_twenty_parallel_requests_at_wallet_of_ten(client):
    """
    Core Challenge:
    'Watch for: fire 20 parallel send requests at a wallet that can only afford 10. Exactly 10 should succeed.'
    """
    email = "concurrency_test_user@nestnepal.com"
    pwd = "SecurePassword999!"
    reg_res = client.post("/api/v1/auth/register", json={"email": email, "password": pwd})
    assert reg_res.status_code == 201

    login_res = client.post("/api/v1/auth/login", json={"email": email, "password": pwd})
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Set user balance to exactly 10 credits
    db = TestingSessionLocal()
    user = db.query(User).filter(User.email == email).first()
    user_id = user.id
    wallet = db.query(Wallet).filter(Wallet.user_id == user_id).first()
    wallet.balance = 10
    db.commit()
    db.close()

    # Function executed concurrently across 20 threads
    def send_one(req_id: int):
        return client.post(
            "/api/v1/sms/send",
            headers=headers,
            json={
                "to": ["9841000001"],  # 1 recipient = 1 credit cost
                "message": f"Parallel test request #{req_id}"
            }
        )

    with ThreadPoolExecutor(max_workers=20) as executor:
        results = list(executor.map(send_one, range(20)))

    success_responses = [r for r in results if r.status_code == 200]
    insufficient_credit_responses = [r for r in results if r.status_code == 402]

    # Verify: Exactly 10 succeeded, exactly 10 were rejected
    assert len(success_responses) == 10, f"Expected 10 successes, got {len(success_responses)}"
    assert len(insufficient_credit_responses) == 10, f"Expected 10 402s, got {len(insufficient_credit_responses)}"

    # Verify final balance via API and DB is 0 and never went negative
    bal_res = client.get("/api/v1/wallet/balance", headers=headers)
    assert bal_res.status_code == 200
    assert bal_res.json()["balance"] == 0

    db = TestingSessionLocal()
    wallet = db.query(Wallet).filter(Wallet.user_id == user_id).first()
    assert wallet.balance == 0
    db.close()

