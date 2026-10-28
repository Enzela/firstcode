import pytest
from backend.app.services.provider_service import ProviderService
from backend.app.services.wallet_service import WalletService
from backend.app.models.provider import SMSProvider

def test_provider_get_balance_method(db):
    """Requirement 02 specifies getBalance() method."""
    route_a = db.query(SMSProvider).filter(SMSProvider.name == "ROUTE_A").first()
    assert route_a is not None
    assert route_a.getBalance() == route_a.balance
    assert isinstance(route_a.getBalance(), int)

def test_failover_to_next_priority_provider(client, auth_headers, db):
    """When top priority provider fails, system must failover to next provider."""
    # Force ROUTE_A to fail by setting failure_rate = 1.0 or using force_fail_route
    res = client.post(
        "/api/v1/sms/send",
        headers=auth_headers,
        json={
            "to": ["9841234567"],
            "message": "Test failover message",
            "force_fail_route": "ROUTE_A"
        }
    )
    assert res.status_code == 200
    data = res.json()
    assert data["sent_count"] == 1
    sent_msg = data["sent_messages"][0]
    # Route used should NOT be ROUTE_A because it failed; it should have fallen over to ROUTE_B or ROUTE_C
    assert sent_msg["provider"] in ["ROUTE_B", "ROUTE_C"]
    assert sent_msg["provider"] != "ROUTE_A"

    # Verify attempts show ROUTE_A failed and next route succeeded
    attempts = sent_msg["attempts"]
    assert len(attempts) >= 2
    assert attempts[0]["route"] == "ROUTE_A"
    assert attempts[0]["status"] == "FAILED"
    assert attempts[-1]["status"] == "SUCCESS"

def test_all_routes_fail_triggers_automatic_refund(client, auth_headers):
    """Requirement 06: Give the credits back for messages that fail on every route."""
    # Get current balance
    balance_before = client.get("/api/v1/wallet/balance", headers=auth_headers).json()["balance"]

    res = client.post(
        "/api/v1/sms/send",
        headers=auth_headers,
        json={
            "to": ["9841234567"],
            "message": "This will fail on all routes",
            "force_fail_route": "ALL"
        }
    )
    assert res.status_code == 200
    data = res.json()
    assert data["failed_count"] == 1
    assert data["total_refunded"] == 1
    assert data["net_cost"] == 0

    # Balance after should equal balance before because 1 credit was charged and 1 refunded
    balance_after = client.get("/api/v1/wallet/balance", headers=auth_headers).json()["balance"]
    assert balance_after == balance_before

    # Check ledger has CHARGE and REFUND entries
    ledger = client.get("/api/v1/wallet/ledger", headers=auth_headers).json()
    assert ledger[0]["transaction_type"] == "REFUND"
    assert ledger[1]["transaction_type"] == "CHARGE"


def test_routes_health_endpoint(client, auth_headers):
    """Requirement 05: GET /routes/health."""
    res = client.get("/routes/health")
    assert res.status_code == 200
    data = res.json()
    assert len(data) >= 3
    route_names = [r["route_name"] for r in data]
    assert "ROUTE_A" in route_names
    assert "ROUTE_B" in route_names
    assert "ROUTE_C" in route_names
    for r in data:
        assert "health_percentage" in r
        assert "balance" in r
        assert "success_rate_24h" in r
