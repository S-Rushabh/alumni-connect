import sys
import os

print(f"Python Executable: {sys.executable}")
print(f"Working Directory: {os.getcwd()}")

try:
    import cv2
    print(f"cv2 imported successfully: {cv2.__version__}")
except ImportError as e:
    print(f"ERROR: Could not import cv2: {e}")

try:
    import pyzbar
    from pyzbar.pyzbar import decode
    print(f"pyzbar imported successfully: {pyzbar.__version__ if hasattr(pyzbar, '__version__') else 'installed'}")
except ImportError as e:
    print(f"ERROR: Could not import pyzbar: {e}")
except Exception as e:
    print(f"ERROR: pyzbar issue: {e}")

try:
    from cryptography import x509
    print("cryptography.x509 imported successfully")
except ImportError as e:
    print(f"ERROR: Could not import cryptography: {e}")

try:
    import PIL
    print(f"PIL imported successfully: {PIL.__version__}")
except ImportError as e:
    print(f"ERROR: Could not import PIL: {e}")

# Check files
cert_path = os.path.join("certs", "uidai_auth_sign_Prod_2026.cer")
if os.path.exists(cert_path):
    print(f"Certificate found at: {cert_path}")
else:
    print(f"ERROR: Certificate NOT found at: {cert_path}")

# Check uploads
uploads_dir = "uploads"
if os.path.exists(uploads_dir):
    files = os.listdir(uploads_dir)
    print(f"Files in uploads: {files}")
else:
    print(f"ERROR: Uploads dir NOT found")
