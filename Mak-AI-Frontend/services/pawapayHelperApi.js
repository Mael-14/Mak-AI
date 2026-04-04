import axios from 'axios';

const PROVIDER_AVAILABILITY_URL = 'https://api.sandbox.pawapay.io/v2/availability';
const PREDICT_PROVIDER_URL = 'https://api.sandbox.pawapay.io/v2/predict-provider';
const PROVIDER_API_TOKEN = 'eyJraWQiOiIxIiwiYWxnIjoiRVMyNTYifQ.eyJ0dCI6IkFBVCIsInN1YiI6IjE2OTA3IiwibWF2IjoiMSIsImV4cCI6MjA5MDYyMTA0OCwiaWF0IjoxNzc1MDAxODQ4LCJwbSI6IkRBRixQQUYiLCJqdGkiOiI5YjM3M2I2Ny0yYWI0LTQ4NWQtOGE2My0wYzE3ZjM5NDczMWUifQ.EjclJZ9GOlviYA06o-FD7H0NvPB5kUoRvyWu0yvp6k9-K9FqIVSDdDUX_CjyyoYgd5iiL2h4PLeZ21flExlXLg';

export const providerAPI = {
    /**
     * Fetch raw availability data from PawaPay
     */
    getProviderAvailability: async () => {
        try {
            const response = await axios.get(PROVIDER_AVAILABILITY_URL, {
                headers: {
                    'Authorization': `Bearer ${PROVIDER_API_TOKEN}`
                }
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching provider availability:', error);
            throw error;
        }
    },

    /**
     * Checks if deposits are marked OPERATIONAL for CMR providers.
     * @returns {Promise<{MTN: boolean, ORANGE: boolean}>}
     */
    checkCMROperationalStatus: async () => {
        const availableCountry = 'CMR';
        try {
            const data = await providerAPI.getProviderAvailability();
            
            // Find CMR (Cameroon) in the availability list
            const cmrData = data.find(c => c.country === availableCountry);
            
            if (!cmrData) {
                console.warn(`Country ${availableCountry} not found in availability data.`);
                return { MTN: false, ORANGE: false };
            }

            const status = { MTN: false, ORANGE: false };

            cmrData.providers.forEach(p => {
                const isOperational = p.operationTypes?.DEPOSIT === 'OPERATIONAL';
                
                if (p.provider.includes('MTN')) {
                    status.MTN = isOperational;
                } else if (p.provider.includes('ORANGE')) {
                    status.ORANGE = isOperational;
                }
            });

            return status;
        } catch (error) {
            console.error('Error checking CMR operational status:', error);
            return { MTN: false, ORANGE: false };
        }
    },

    /**
     * Predicts the provider for a given phone number.
     * @param {string} phoneNumber - Phone number with country code (e.g., +2376...).
     * @returns {Promise<string|null>} The provider code (e.g., "MTN_MOMO_CMR") or null.
     */
    predictProvider: async (phoneNumber) => {
        try {
            const response = await axios.post(PREDICT_PROVIDER_URL, 
                { phoneNumber }, 
                {
                    headers: {
                        'Authorization': `Bearer ${PROVIDER_API_TOKEN}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            return response.data.provider; // Returns e.g. "MTN_MOMO_CMR"
        } catch (error) {
            console.error('Error predicting provider:', error);
            return null;
        }
    }
}