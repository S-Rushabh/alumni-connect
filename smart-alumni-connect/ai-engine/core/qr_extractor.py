import cv2
from pyzbar.pyzbar import decode
from utils.image_helpers import preprocess_image
import os

def extract_qr_string(image_path):
    """
    Reads an image from the path, attempts to find a QR code, 
    and returns the decoded numeric string.
    """
    if not os.path.exists(image_path):
        raise FileNotFoundError(f"Image not found at: {image_path}")

    # Load the image
    original_img = cv2.imread(image_path)
    if original_img is None:
        raise ValueError("Could not read image file. Check format.")

    # Get a list of image versions (original, gray, high-contrast, etc.)
    # to maximize chances of detection
    candidate_images = preprocess_image(original_img)

    for img in candidate_images:
        decoded_objects = decode(img)
        
        if decoded_objects:
            # Return the first QR code found
            # The data is in bytes, so we decode to utf-8 string
            return decoded_objects[0].data.decode('utf-8')
    
    # If loop finishes without returning
    raise ValueError("No QR code detected. Please upload a clearer image.")