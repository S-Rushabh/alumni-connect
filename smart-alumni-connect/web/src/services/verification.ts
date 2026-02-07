
const API_URL = 'http://localhost:8001';

export interface AadhaarVerificationResult {
    status: 'SUCCESS' | 'FAILED' | 'ERROR';
    message: string;
    extracted?: {
        name: string;
        gender: string;
        state: string;
    };
    details?: {
        name_match: boolean;
        dob_match: boolean;
        last_4_match: boolean;
    };
}

export const verifyAadhaar = async (
    file: File,
    name: string,
    dob: string,
    last4: string
): Promise<AadhaarVerificationResult> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', name);
    formData.append('dob', dob);
    formData.append('last_4_digits', last4);

    try {
        const response = await fetch(`${API_URL}/verify-aadhaar`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            throw new Error(`Verification failed: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Aadhaar verification error:', error);
        return {
            status: 'ERROR',
            message: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
};
