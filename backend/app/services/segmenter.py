import math
from typing import Dict, Any

# GSM 03.38 Basic Character Set
GSM_BASIC_CHARS = set(
    "@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞ "
    "ÆæßÉ !\"#¤%&'()*+,-./0123456789:;<=>?"
    "¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿"
    "abcdefghijklmnopqrstuvwxyzäöñüà"
)

# GSM 03.38 Extension Table Characters
GSM_EXTENSION_CHARS = set("^{}\\[~]|€\x0c")

GSM7_FULL_SET = GSM_BASIC_CHARS.union(GSM_EXTENSION_CHARS)


def is_gsm7_string(text: str) -> bool:
    """Returns True if every character in text belongs to GSM-7 character set."""
    return all(char in GSM7_FULL_SET for char in text)


def calculate_sms_segments(text: str) -> Dict[str, Any]:
    """
    Calculates encoding, part count, and character limit according to Nest SMS rules:
    - GSM-7: 160 chars for 1 part, 153 chars per part for longer messages.
    - Unicode: 70 chars for 1 part, 67 chars per part for longer messages.
    
    Returns dict:
    {
        "encoding": "GSM_7" | "UNICODE",
        "length": int,
        "parts": int,
        "chars_per_part": int,
        "max_single_part": int,
        "remaining_in_part": int
    }
    """
    length = len(text)
    if length == 0:
        return {
            "encoding": "GSM_7",
            "length": 0,
            "parts": 0,
            "chars_per_part": 160,
            "max_single_part": 160,
            "remaining_in_part": 160
        }

    is_gsm = is_gsm7_string(text)
    
    if is_gsm:
        encoding = "GSM_7"
        single_limit = 160
        multi_limit = 153
    else:
        encoding = "UNICODE"
        single_limit = 70
        multi_limit = 67

    if length <= single_limit:
        parts = 1
        remaining = single_limit - length
        chars_per_part = single_limit
    else:
        parts = math.ceil(length / multi_limit)
        remaining = (parts * multi_limit) - length
        chars_per_part = multi_limit

    return {
        "encoding": encoding,
        "length": length,
        "parts": parts,
        "chars_per_part": chars_per_part,
        "max_single_part": single_limit,
        "remaining_in_part": remaining
    }

