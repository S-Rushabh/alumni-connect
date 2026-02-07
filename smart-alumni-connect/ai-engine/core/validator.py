from cryptography import x509
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import padding
import os

class AadhaarValidator:
    def __init__(self, decompressed_data):
        self.data = decompressed_data
        
        # The delimiter used by UIDAI is 255 (0xFF in hex)
        self.delimiter = b'\xff'
        
        # Split signature from content
        # The RSA signature is always the LAST 256 bytes of the data
        self.signature = self.data[-256:]
        self.signed_content = self.data[:-256]

    def validate_signature(self, cert_path):
        """
        Verifies the data against the UIDAI Public Certificate.
        """
        if not os.path.exists(cert_path):
            return False, f"Certificate not found at {cert_path}"

        try:
            # 1. Read the Certificate File
            with open(cert_path, "rb") as f:
                cert_data = f.read()

            # 2. Load it as an X.509 Certificate (Fix for 'no start line' error)
            cert = x509.load_pem_x509_certificate(cert_data, default_backend())
            
            # 3. Extract the Public Key from the Certificate
            public_key = cert.public_key()

            # 4. Verify using RSA-PSS with SHA256
            public_key.verify(
                self.signature,
                self.signed_content,
                padding.PSS(
                    mgf=padding.MGF1(hashes.SHA256()),
                    salt_length=padding.PSS.MAX_LENGTH
                ),
                hashes.SHA256()
            )
            return True, "Signature Validated Successfully"
            
        except Exception as e:
            return False, f"Signature Validation Failed: {str(e)}"

    def parse_data(self):
        """
        Splits the signed content into a dictionary of fields.
        Mapping is based on UIDAI Secure QR V3 standard.
        """
        # Split the content part (excluding signature) by the delimiter
        fields = self.signed_content.split(self.delimiter)
        
        # We need at least basic fields
        if len(fields) < 5:
            raise ValueError("Data format incorrect: Not enough fields found.")

        parsed_info = {}
        
        # Safe decoding helper
        def get_text(index):
            if index < len(fields):
                return fields[index].decode('utf-8', errors='ignore')
            return ""

        # Mapping (Standard V3)
        # Note: Index mapping can slightly vary. 
        # Usually: 2=Name, 3=DOB, 4=Gender, 5=Address parts...
        
        # Check for V2/V3/V4/V5 (All use similar structure)
        is_versioned = False
        version_str = get_text(0)
        if len(fields) > 0 and version_str in ["V2", "V3", "V4", "V5"]:
            is_versioned = True
            
        if is_versioned:
            # V2 Mapping
            parsed_info["reference_id"] = get_text(2)
            parsed_info["name"] = get_text(3)
            parsed_info["dob"] = get_text(4)
            parsed_info["gender"] = get_text(5)
            parsed_info["care_of"] = get_text(6)
            parsed_info["district"] = get_text(7)
            parsed_info["landmark"] = get_text(8)
            parsed_info["house"] = get_text(10)
            parsed_info["location"] = get_text(12) 
            parsed_info["pincode"] = get_text(11)
            parsed_info["state"] = get_text(13)
            parsed_info["post_office"] = get_text(16)
            
            # Reconstruct Photo (JP2000)
            # The photo data starts at index 19 (approx) but since it contains 0xFF,
            # it got split into multiple fields.
            # We join everything from index 19 onwards with the delimiter.
            # V2 Header for JP2 usually starts around index 19-20.
            # Start of Image Marker: FF 4F
            
            # Let's find where the JP2 codestream starts.
            # Based on debug, Index 20 started with 'Q/<<<<' which is close to JP2 signature.
            # But simpler approach: join all remaining fields.
            
            photo_fragments = fields[19:]
            # Rejoin using the delimiter (which was stripped)
            # We strictly need to prepend the FF because split consumes it.
            # The photo starts with FF 4F. Field[19] is 4F.
            raw_photo = b'\xff' + b'\xff'.join(photo_fragments)
            
            parsed_info["photo_bytes"] = raw_photo
            
        else:
            # Legacy Mapping (Old V1 or Standard V3 without prefix)
            parsed_info["reference_id"] = get_text(1)
            parsed_info["name"] = get_text(2)
            parsed_info["dob"] = get_text(3) # Format: DD-MM-YYYY
            parsed_info["gender"] = get_text(4)
            parsed_info["pincode"] = get_text(10) 
            # The last field in the signed content is the Photo (JPEG Bytes)
            parsed_info["photo_bytes"] = fields[-1]

        return parsed_info