import pytest
from backend.app.services.segmenter import calculate_sms_segments, is_gsm7_string

def test_gsm7_detection():
    assert is_gsm7_string("Hello world 123! @ Nest Nepal") is True
    # Emoji makes it unicode
    assert is_gsm7_string("Hello world 😊") is False
    # Nepali Devanagari makes it unicode
    assert is_gsm7_string("नमस्ते नेपाल") is False

def test_gsm7_counting_rules():
    # <= 160 characters is 1 part
    msg_160 = "A" * 160
    res = calculate_sms_segments(msg_160)
    assert res["encoding"] == "GSM_7"
    assert res["parts"] == 1
    assert res["remaining_in_part"] == 0

    # 200-character English message is 2 parts (153 + 47) as per brief
    msg_200 = "B" * 200
    res = calculate_sms_segments(msg_200)
    assert res["encoding"] == "GSM_7"
    assert res["parts"] == 2
    # 2 * 153 = 306, 306 - 200 = 106 remaining
    assert res["remaining_in_part"] == 106

def test_unicode_counting_rules():
    # <= 70 characters is 1 part
    nepali_short = "नमस्ते नेस्ट नेपाल!"
    res = calculate_sms_segments(nepali_short)
    assert res["encoding"] == "UNICODE"
    assert res["parts"] == 1

    # 100-character Nepali message is 2 parts (67 + 33) as per brief
    # Create 100 char Nepali string
    nepali_100 = "ने" * 50  # 100 unicode code points
    res = calculate_sms_segments(nepali_100)
    assert res["encoding"] == "UNICODE"
    assert res["parts"] == 2
    # 2 * 67 = 134, 134 - 100 = 34 remaining
    assert res["remaining_in_part"] == 34

def test_emoji_in_english_message_turns_whole_to_unicode():
    msg = "Welcome to Nest SMS! Here is your OTP: 123456 🔥"
    res = calculate_sms_segments(msg)
    assert res["encoding"] == "UNICODE"

