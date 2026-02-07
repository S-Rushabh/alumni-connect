import os
import sys
from core.qr_extractor import extract_qr_string
from core.secure_decode import AadhaarDecoder
from core.validator import AadhaarValidator

# Configuration
CERT_PATH = os.path.join("certs", "uidai_auth_sign_Prod_2026.cer")
TEST_IMAGE = os.path.join("uploads", "sample_card_1.jpeg")

print(f"Testing with image: {TEST_IMAGE}")

try:
    # 1. Extract QR
    print("1. Extracting QR...")
    raw_qr_string = extract_qr_string(TEST_IMAGE)
    print(f"   QR String length: {len(raw_qr_string)}")
    print(f"   QR String partial: {raw_qr_string[:50]}...")

    # 2. Decode
    print("2. Decoding...")
    decoder = AadhaarDecoder(raw_qr_string)
    decompressed_bytes = decoder.get_bytes()
    print(f"   Decompressed bytes length: {len(decompressed_bytes)}")

    # 3. Validate
    print("3. Validating...")
    validator = AadhaarValidator(decompressed_bytes)
    if os.path.exists(CERT_PATH):
        is_authentic, msg = validator.validate_signature(CERT_PATH)
        print(f"   Signature check: {is_authentic} - {msg}")
    else:
        print("   Certificate not found, skipping signature check.")

    # 4. Parse
    print("4. Parsing...")
    data = validator.parse_data()
    print("   Parsed Data Keys:", data.keys())
    for k, v in data.items():
        if k != "photo_bytes":
            print(f"   {k}: {v}")
        else:
            print(f"   {k}: <{len(v)} bytes>")
            
    # DEBUG: Print all fields to debug mapping
    print("\n   --- DEBUG: RAW FIELDS ---")
    fields = validator.signed_content.split(validator.delimiter)
    for i, f in enumerate(fields):
        try:
            val = f.decode('utf-8', errors='ignore')
            # Truncate long values
            if len(val) > 50: val = val[:50] + "..."
            print(f"   [{i}] {repr(val)}")
        except:
            print(f"   [{i}] <binary/fail>")



except Exception as e:
    print("\n--------------------------------------------------")
    print(f"CRASHED WITH ERROR: {e}")
    import traceback
    traceback.print_exc()
    print("--------------------------------------------------")
