// Function to detect device and return appropriate app store link
export const getAppStoreLink = (iosLink, androidLink) => {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    
    // Check for iOS devices
    if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
        return iosLink || androidLink; // Fallback to Android if iOS link not provided
    }
    
    // Check for Android devices
    if (/android/i.test(userAgent)) {
        return androidLink;
    }
    
    // Default to Google Play Store for unknown devices
    return androidLink;
}

