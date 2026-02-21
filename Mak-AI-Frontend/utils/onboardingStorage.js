import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_KEY = '@onboarding_completed';

/**
 * Check if onboarding has been completed
 * @returns {Promise<boolean>} True if onboarding is completed, false otherwise
 */
export const isOnboardingCompleted = async () => {
  try {
    const value = await AsyncStorage.getItem(ONBOARDING_KEY);
    return value === 'true';
  } catch (error) {
    console.error('Error checking onboarding status:', error);
    return false; // Default to showing onboarding if there's an error
  }
};

/**
 * Mark onboarding as completed
 * @returns {Promise<void>}
 */
export const setOnboardingCompleted = async () => {
  try {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
  } catch (error) {
    console.error('Error saving onboarding status:', error);
  }
};

/**
 * Reset onboarding status (useful for testing or if user wants to see it again)
 * @returns {Promise<void>}
 */
export const resetOnboarding = async () => {
  try {
    await AsyncStorage.removeItem(ONBOARDING_KEY);
  } catch (error) {
    console.error('Error resetting onboarding status:', error);
  }
};

