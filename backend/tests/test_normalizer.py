import pytest
from backend.app.services.normalizer import (
    normalize_and_validate_nepali_phone,
    validate_and_normalize_recipients
)

def test_valid_nepali_numbers():
    # 9841234567 -> Valid as it is
    is_valid, norm, err = normalize_and_validate_nepali_phone("9841234567")
    assert is_valid is True
    assert norm == "9841234567"
    assert err is None

    # Starts with 97
    is_valid, norm, err = normalize_and_validate_nepali_phone("9741234567")
    assert is_valid is True
    assert norm == "9741234567"

def test_prefix_removal():
    # +9779801122334 -> Prefix removed
    is_valid, norm, err = normalize_and_validate_nepali_phone("+9779801122334")
    assert is_valid is True
    assert norm == "9801122334"

    # 9779761234567 -> Prefix removed
    is_valid, norm, err = normalize_and_validate_nepali_phone("9779761234567")
    assert is_valid is True
    assert norm == "9761234567"

def test_invalid_nepali_numbers():
    # 9612345678 -> Does not start with 97 or 98
    is_valid, norm, err = normalize_and_validate_nepali_phone("9612345678")
    assert is_valid is False
    assert norm is None
    assert "Does not start with 97 or 98" in err

    # 984123456 -> Only 9 digits
    is_valid, norm, err = normalize_and_validate_nepali_phone("984123456")
    assert is_valid is False
    assert "must be 10 digits" in err

    # Too many digits
    is_valid, norm, err = normalize_and_validate_nepali_phone("984123456789")
    assert is_valid is False

    # Non-digits
    is_valid, norm, err = normalize_and_validate_nepali_phone("984123abcd")
    assert is_valid is False

def test_batch_recipients_validation():
    recipients = [
        "9841234567",
        "+9779801122334",
        "9612345678",       # invalid prefix
        "984123456",        # 9 digits
        "9841234567",       # duplicate
        "9779761234567"
    ]
    valid, invalid = validate_and_normalize_recipients(recipients)
    assert valid == ["9841234567", "9801122334", "9761234567"]
    assert len(invalid) == 2
    assert invalid[0]["input"] == "9612345678"
    assert invalid[1]["input"] == "984123456"

