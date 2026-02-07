import gzip
import io

class AadhaarDecoder:
    def __init__(self, numeric_str):
        self.numeric_str = numeric_str

    def get_bytes(self):
        """
        Converts the UIDAI numeric string into decompressed bytes.
        Logic: String -> Big Integer -> Byte Array -> GZip Decompression
        """
        try:
            # 1. Convert the numeric string to a Python Big Integer
            big_int = int(self.numeric_str)
            
            # 2. Convert Big Int to Bytes
            # Calculate how many bytes are needed to represent this integer
            # (bit_length + 7) // 8 is the standard formula for min byte size
            byte_length = (big_int.bit_length() + 7) // 8
            
            # Convert to bytes using Big Endian byte order
            raw_bytes = big_int.to_bytes(byte_length, 'big')
            
            # 3. Decompress the byte stream (UIDAI uses GZIP)
            with gzip.GzipFile(fileobj=io.BytesIO(raw_bytes)) as f:
                decompressed_data = f.read()
                
            return decompressed_data

        except ValueError:
            raise ValueError("Invalid numeric string. Ensure this is a Secure QR code.")
        except OSError:
            raise ValueError("GZip decompression failed. Data might be corrupted.")
        except Exception as e:
            raise ValueError(f"Decoding error: {str(e)}")