import re
from typing import Tuple, Optional, List, Dict, Any

class PhoneValidationError(Exception):
    def __init__(self, raw_input: str, reason: str):
        self.raw_input = raw_input
        self.reason = reason
        super().__init__(f"Invalid phone number '{raw_input}': {reason}")

def normalize_and_validate_nepali_phone(raw_phone: str) -> Tuple[bool, Optional[str], Optional[str]]:
    """
    Validates and normalizes a Nepali mobile phone number according to Nest SMS rules:
    - Must be 10 digits starting with 97 or 98.
    - Optional '+977' or '977' prefix allowed and stripped.
    
    Returns:
        (is_valid: bool, normalized_10_digit: Optional[str], error_reason: Optional[str])
    """
    if not raw_phone or not isinstance(raw_phone, str):
        return False, None, "Phone number cannot be empty"

    cleaned = raw_phone.strip().replace(" ", "").replace("-", "")

    # Handle +977 prefix
    if cleaned.startswith("+977"):
        cleaned = cleaned[4:]
    # Handle 977 prefix (e.g. 9779801122334 -> 9801122334, length 13)
    elif cleaned.startswith("977") and len(cleaned) == 13:
        cleaned = cleaned[3:]

    # Check for all digits
    if not cleaned.isdigit():
        return False, None, "Phone number must contain only numeric digits"

    # Check length
    if len(cleaned) < 10:
        return False, None, f"Only {len(cleaned)} digits (must be 10 digits)"
    if len(cleaned) > 10:
        return False, None, f"Too long ({len(cleaned)} digits, must be 10 digits)"

    # Check prefix 97 or 98
    if not (cleaned.startswith("97") or cleaned.startswith("98")):
        return False, None, "Does not start with 97 or 98"

    return True, cleaned, None


def validate_and_normalize_recipients(recipients: List[str]) -> Tuple[List[str], List[Dict[str, str]]]:
    """
    Validates a list of recipient numbers.
    Returns:
        valid_normalized_numbers: List of valid 10-digit strings
        invalid_numbers: List of dicts with original input and reason
    """
    valid = []
    invalid = []
    seen = set()

    for raw in recipients:
        is_valid, normalized, reason = normalize_and_validate_nepali_phone(raw)
        if is_valid and normalized:
            if normalized not in seen:
                seen.add(normalized)
                valid.append(normalized)
        else:
            invalid.append({
                "input": raw,
                "reason": reason or "Unknown validation error"
            })

    return valid, invalid
