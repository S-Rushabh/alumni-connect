import cv2
import numpy as np

def preprocess_image(image):
    """
    Applies a series of filters to make the QR code more readable.
    Returns a list of processed images to try scanning.
    """
    processed_images = []
    
    # 1. Original Image
    processed_images.append(image)

    # 2. Grayscale
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    processed_images.append(gray)

    # 3. Gaussian Blur (removes noise) + OTSU Thresholding (high contrast)
    blur = cv2.GaussianBlur(gray, (5, 5), 0)
    _, binary = cv2.threshold(blur, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    processed_images.append(binary)

    # 4. Sharpening Kernel (for blurry edges)
    kernel = np.array([[0, -1, 0], 
                       [-1, 5,-1], 
                       [0, -1, 0]])
    sharpened = cv2.filter2D(gray, -1, kernel)
    processed_images.append(sharpened)

    return processed_images