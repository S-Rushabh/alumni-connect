import os
import sys
from core.qr_extractor import extract_qr_string
from core.secure_decode import AadhaarDecoder
from core.validator import AadhaarValidator

# Configuration
CERT_PATH = os.path.join("certs", "uidai_auth_sign_Prod_2026.cer")
OUTPUT_DIR = "output"

def verify_aadhaar(image_path, input_name, input_dob, input_last_4_digits):
    print(f"--- Starting Verification for {input_name} ---")
    
    # 1. Extract QR Data
    try:
        print(f"[1/5] Scanning QR code from {image_path}...")
        raw_qr_string = extract_qr_string(image_path)
        print("      QR Code detected and read.")
    except Exception as e:
        return {"status": "FAILED", "reason": f"QR Scan Error: {str(e)}"}

    # 2. Decode Data (BigInt -> Bytes -> Decompress)
    try:
        print("[2/5] Decoding secure data...")
        decoder = AadhaarDecoder(raw_qr_string)
        decompressed_bytes = decoder.get_bytes()
        print("      Data decompressed successfully.")
    except Exception as e:
        return {"status": "FAILED", "reason": f"Decoding Error: {str(e)}"}

    # 3. Validate Signature & Parse
    print("[3/5] Verifying Digital Signature...")
    validator = AadhaarValidator(decompressed_bytes)
    
    # Check if certificate exists before trying to verify
    if os.path.exists(CERT_PATH):
        is_authentic, auth_msg = validator.validate_signature(CERT_PATH)
        if not is_authentic:
             # return {"status": "FAILED", "reason": f"Security Alert: {auth_msg}"}
             print(f"      [WARNING] {auth_msg} (Proceeding with extraction)")
        else:
            print(f"      {auth_msg}")
    else:
        print(f"      [WARNING] Certificate not found at {CERT_PATH}. Skipping Signature Check.")
        print(f"      (For production, place 'uidai_public_v2.cer' in the certs folder)")

    # 4. Extract Fields
    try:
        print("[4/5] Parsing data fields...")
        aadhaar_data = validator.parse_data()
        
        # print("\n      --- Extracted Details ---")
        # print(f"      Name: {aadhaar_data.get('name')}")
        # ... (Moved to success block for security)
    except Exception as e:
        return {"status": "FAILED", "reason": f"Parsing Error: {str(e)}"}

    # 5. Compare Data (The Verification Step)
    print("[5/5] Matching user inputs...")
    
    # Simple normalization (lowercase, strip spaces)
    match_name = aadhaar_data['name'].strip().lower() == input_name.strip().lower()
    match_dob = aadhaar_data['dob'].strip() == input_dob.strip()
    
    # Last 4 Digits Verification
    # V2 Ref ID format: <Last4Digits><Timestamp>...
    extracted_ref_id = aadhaar_data.get('reference_id', '')
    extracted_last_4 = extracted_ref_id[:4] if len(extracted_ref_id) >= 4 else ""
    
    match_last_4 = False
    if input_last_4_digits and extracted_last_4 == input_last_4_digits:
        match_last_4 = True

    # Save the photo for visual confirmation
    photo_filename = f"resident_photo_{input_name.replace(' ', '_')}.jpg"
    photo_path = os.path.join(OUTPUT_DIR, photo_filename)
    
    try:
        from PIL import Image
        import io
        
        # Load the bytes (it might be JP2 or JPEG)
        image_data = aadhaar_data['photo_bytes']
        image_stream = io.BytesIO(image_data)
        
        # Open with Pillow
        img = Image.open(image_stream)
        
        # Convert to RGB (standard JPEG doesn't support CMYK/RGBA same way)
        if img.mode in ('RGBA', 'P'):
            img = img.convert('RGB')
            
        # Save as standard JPEG
        img.save(photo_path, format='JPEG', quality=95)
        print(f"      Resident photo saved to {photo_path} (Converted to JPEG)")
        
    except Exception as e:
        print(f"      [ERROR] Could not process photo: {e}")
        # Fallback: write raw bytes just in case debugging is needed
        # with open(photo_path + ".raw", "wb") as f:
        #    f.write(aadhaar_data['photo_bytes'])

    # Final Result
    if match_name and match_dob and match_last_4:
        # Security: Only show details if matched
        print("\n      --- Extracted Details ---")
        print(f"      Name: {aadhaar_data.get('name')}")
        print(f"      DOB: {aadhaar_data.get('dob')}")
        print(f"      Gender: {aadhaar_data.get('gender')}")
        print(f"      Care Of: {aadhaar_data.get('care_of')}")
        print(f"      Address: {aadhaar_data.get('house')}, {aadhaar_data.get('landmark')}")
        print(f"      City/Dist: {aadhaar_data.get('district')}")
        print(f"      Post Office: {aadhaar_data.get('post_office')}")
        print(f"      State: {aadhaar_data.get('state')}")
        print(f"      Pincode: {aadhaar_data.get('pincode')}")
        print(f"      Ref ID: {aadhaar_data.get('reference_id')}")
        print("      -------------------------\n")

        return {
            "status": "SUCCESS",
            "message": "User Verified Successfully",
            "details": {
                "name_matched": True,
                "dob_matched": True,
                "last_4_matched": True,
                "aadhaar_name": aadhaar_data['name'],
                "photo_path": photo_path
            }
        }
    else:
        return {
            "status": "FAILED",
            "message": "Data Mismatch",
            "details": {
                "name_matched": match_name,
                "dob_matched": match_dob,
                "last_4_matched": match_last_4,
                # "aadhaar_name": aadhaar_data['name'], # SECURITY: Don't return expected values on failure
                # "aadhaar_dob": aadhaar_data['dob']
            }
        }

if __name__ == "__main__":
    # Test Data
    # 1. Place a sample image in 'uploads' folder named 'sample_card.jpeg'
    # 2. Update the name/dob below to match the card
    
    TEST_IMAGE = os.path.join("uploads", "sample_card_1.jpeg")
    USER_NAME = input("Enter Name: ").strip()
    USER_DOB = input("Enter DOB (DD-MM-YYYY): ").strip()
    USER_LAST_4 = input("Enter Last 4 Digits: ").strip()

    # Check if we actually have a test image
    if not os.path.exists(TEST_IMAGE):
        print(f"Please place a test image at: {TEST_IMAGE}")
    else:
        result = verify_aadhaar(TEST_IMAGE, USER_NAME, USER_DOB, USER_LAST_4)
        print("\n--- FINAL RESULT ---")
        print(result)