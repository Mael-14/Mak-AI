import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { scale, verticalScale, moderateScale } from '../utils/scaling';
import PlanSelection from './payementsComponents/planSelection';
import DurationSelection from './payementsComponents/durationSelection';
import ProviderSelection from './payementsComponents/ProviderSelection';
import PhoneNumberInput from './payementsComponents/PhoneNumberInput';
import SubscriptionSummary from './payementsComponents/SubscriptionSummary';
import { providerAPI } from '../services/pawapayHelperApi';
import CustomAlert from '../components/CustomAlert';
import { financialAPI } from '../services/api';

const plans = [
    { id: 1, name: 'Basic Plan', price: 1000 },
    { id: 2, name: 'Premium Plan', price: 2000 },
    { id: 3, name: 'Pro Plan', price: 3000 },
];

const SubscriptionScreen = () => {
    const router = useRouter();
    const [selectedPlanId, setSelectedPlanId] = useState(1); // Default to Basic Plan
    const [selectedDuration, setSelectedDuration] = useState(1);
    const [provider, setProvider] = useState(null);
    const [phoneNumber, setPhoneNumber] = useState('+237 ');
    const [loading, setLoading] = useState(false);

    // Custom Alert State
    const [alertConfig, setAlertConfig] = useState({
        visible: false,
        title: '',
        message: '',
        onClose: null,
    });

    const handlePhoneNumberChange = (text) => {
        // Ensure the number always starts with +237 and a space
        if (text.startsWith('+237 ')) {
            setPhoneNumber(text);
        } else {
            // Keep the +237 prefix even if they try to delete it
            setPhoneNumber('+237 ');
        }
    };

    const showAlert = (title, message, onClose = null) => {
        setAlertConfig({
            visible: true,
            title,
            message,
            onClose,
        });
    };

    const handlePayment = async () => {
        if (!provider) {
            showAlert('Selection Required', 'Please select a payment provider (MTN or Orange).');
            return;
        }

        const cleanPhoneNumber = phoneNumber.replace(/\s+/g, ''); // Remove all whitespace
        
        if (!cleanPhoneNumber || cleanPhoneNumber.length < 13) { // +237 (4) + 9 digits = 13 characters
            showAlert('Invalid Number', 'Please enter a complete 9-digit phone number after the country code.');
            return;
        }

        try {
            setLoading(true);
            console.log('🚀 [PAYMENT_FLOW] Starting payment process for:', { provider, totalAmount, cleanPhoneNumber });
            
            // 1. Predict provider based on phone number
            console.log('🔍 [PAYMENT_FLOW] Verifying operator via PawaPay...');
            const predicted = await providerAPI.predictProvider(cleanPhoneNumber);
            console.log('✅ [PAYMENT_FLOW] Operator prediction result:', predicted);
            
            if (!predicted) {
                setLoading(false);
                showAlert('Verification Failed', 'Could not verify the operator for this number. Please check your number.');
                return;
            }

            // 2. Cross-check with user selection
            const isMTNMatch = provider === 'MTN' && predicted.includes('MTN');
            const isOrangeMatch = provider === 'ORANGE' && predicted.includes('ORANGE');

            if (!isMTNMatch && !isOrangeMatch) {
                setLoading(false);
                const detectedOperator = predicted.includes('MTN') ? 'MTN' : (predicted.includes('ORANGE') ? 'Orange' : 'another operator');
                console.log('❌ [PAYMENT_FLOW] Operator mismatch detected');
                showAlert(
                    'Operator Mismatch',
                    `This number appears to belong to ${detectedOperator}, but you selected ${provider} Money. Please correct your selection.`
                );
                return;
            }

            // 3. Organise data for backend
            const selectedPlan = plans.find(p => p.id === selectedPlanId) || plans[0];
            const totalAmount = selectedPlan.price * selectedDuration;
            const backendProvider = provider === 'MTN' ? 'MTN_MOMO_CMR' : 'ORANGE_CMR';

            // 4. Initiate deposit to backend
            const depositData = {
                amount: totalAmount,
                phone_number: cleanPhoneNumber,
                provider: backendProvider
            };
            console.log('📤 [PAYMENT_FLOW] Sending deposit to backend:', depositData);

            const response = await financialAPI.createDeposit(depositData);
            console.log('📥 [PAYMENT_FLOW] Backend response received:', response);
            
            setLoading(false);
            if (response.success) {
                showAlert(
                    'Deposit Initiated', 
                    'A prompt has been sent to your phone. Please enter your PIN to complete the payment.',
                    () => router.back()
                );
            } else {
                showAlert('Payment Error', response.message || 'We could not initiate your payment. Please try again.');
            }
            
        } catch (error) {
            setLoading(false);
            console.error('❌ [PAYMENT_FLOW] Error during checkout:', error);
            const errorMessage = error.response?.data?.message || 'An unexpected error occurred. Please check your internet connection and try again.';
            showAlert('Transaction Failed', errorMessage);
        }
    };

    return (
        <>
            <SafeAreaView style={styles.container}>
                <View style={styles.topContainer}>
                    <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                        <Ionicons name="arrow-back" size={24} color="black" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Subscribe to MAK-AI</Text>
                    <View style={{ width: 24 }} />
                </View>
                <ScrollView 
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.contentContainer}>
                        <PlanSelection selectedPlanId={selectedPlanId} onPlanSelect={setSelectedPlanId} />
                        <DurationSelection selectedDuration={selectedDuration} onDurationSelect={setSelectedDuration} />
                        <ProviderSelection onProviderSelect={setProvider} />
                        <PhoneNumberInput value={phoneNumber} onChangeText={handlePhoneNumberChange} />

                        <SubscriptionSummary
                            selectedPlanId={selectedPlanId}
                            selectedDuration={selectedDuration}
                        />
                    </View>
                </ScrollView>

                <View style={styles.bottomContainer}>
                    <TouchableOpacity 
                        style={[styles.paymentButton, loading && { opacity: 0.7 }]} 
                        onPress={handlePayment}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator size="small" color="white" />
                        ) : (
                            <>
                                <Text style={styles.paymentButtonText}>Complete Payment</Text>
                                <Ionicons name="arrow-forward" size={20} color="white" />
                            </>
                        )}
                    </TouchableOpacity>
                </View>

                <CustomAlert 
                    visible={alertConfig.visible}
                    title={alertConfig.title}
                    message={alertConfig.message}
                    onClose={() => {
                        setAlertConfig({ ...alertConfig, visible: false });
                        if (alertConfig.onClose) alertConfig.onClose();
                    }}
                />
            </SafeAreaView>
        </>
    )
}


const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    topContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: scale(20),
        paddingVertical: verticalScale(10),
        backgroundColor: '#ffffff',
    },
    headerTitle: {
        fontSize: moderateScale(16),
        fontWeight: 'bold',
        color: '#111827',
    },
    title: {
        fontSize: moderateScale(20),
        fontWeight: 'bold',
        color: '#111827',
    },
    contentContainer: {
        paddingBottom: verticalScale(20),
        marginTop: verticalScale(10),
    },
    scrollContent: {
        paddingBottom: verticalScale(20),
    },
    bottomContainer: {
        backgroundColor: '#ffffff',
        paddingVertical: verticalScale(15),
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        paddingBottom: verticalScale(10), // Extra padding for bottom-safe areas
    },
    paymentButton: {
        backgroundColor: '#001A72',
        marginHorizontal: scale(20),
        height: verticalScale(55),
        borderRadius: 30,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 8,
    },
    paymentButtonText: {
        color: 'white',
        fontSize: moderateScale(14),
        fontWeight: 'bold',
        marginRight: scale(10),
    },
})



export default SubscriptionScreen