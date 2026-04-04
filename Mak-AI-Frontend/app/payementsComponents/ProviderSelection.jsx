import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { scale, verticalScale, moderateScale } from '../../utils/scaling';
import { providerAPI } from '../../services/pawapayHelperApi';

const providers = [
  {
    id: 'MTN',
    name: 'MTN MONEY',
    color: '#FFCC00',
    image: require('../../assets/MTNMOMO.jpg'),
    bgColor: '#FFFBE6', // Light yellow 
    borderColor: '#FFCC00',
  },
  {
    id: 'ORANGE',
    name: 'ORANGE MONEY',
    color: '#FF6600',
    image: require('../../assets/orangemoney.png'),
    bgColor: '#FFF5F0', // Light orange
    borderColor: '#FF6600',
  },
];

const ProviderSelection = ({ onProviderSelect }) => {
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [providerStatus, setProviderStatus] = useState({ MTN: true, ORANGE: true });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      setLoading(true);
      const status = await providerAPI.checkCMROperationalStatus();

      // --- SIMULATION MODE ---
      // Uncomment the line below to test the UI when a provider is down
      // status.ORANGE = false;
      // -----------------------

      setProviderStatus(status);
      setLoading(false);
    };
    fetchStatus();
  }, []);

  const handleSelect = (id) => {
    // Only select if the provider is operational
    if (providerStatus[id]) {
      setSelectedProvider(id);
      if (onProviderSelect) {
        onProviderSelect(id);
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>SELECT PROVIDER</Text>
      <View style={styles.providerRow}>
        {providers.map((provider) => {
          const isSelected = selectedProvider === provider.id;
          const isOperational = providerStatus[provider.id];

          return (
            <TouchableOpacity
              key={provider.id}
              style={[
                styles.providerCard,
                {
                  borderColor: isSelected ? provider.borderColor : '#F3F4F6',
                  backgroundColor: isSelected ? provider.bgColor : '#FFFFFF',
                  borderWidth: isSelected ? 2 : 1,
                  opacity: isOperational ? 1 : 0.4, // Blur effect for non-operational
                },
                isSelected && styles.selectedCard
              ]}
              onPress={() => handleSelect(provider.id)}
              activeOpacity={isOperational ? 0.8 : 1}
              disabled={!isOperational}
            >


              <View style={styles.logoContainer}>
                {loading ? (
                  <ActivityIndicator size="small" color="#000" />
                ) : (
                  <Image 
                    source={provider.image} 
                    style={styles.logoImage} 
                    resizeMode="contain"
                  />
                )}
              </View>
              <Text style={styles.providerName}>{provider.name}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: verticalScale(15),
    paddingHorizontal: scale(10),
  },
  sectionTitle: {
    fontSize: moderateScale(12),
    fontWeight: '700',
    color: '#6B7280',
    marginBottom: verticalScale(7),
    letterSpacing: 1,
  },
  providerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  providerCard: {
    width: '48%',
    height: verticalScale(100),
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    padding: scale(10),
    // Shadow for unselected state
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  selectedCard: {
    // Stronger shadow for selected state
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  logoContainer: {
    width: scale(55),
    height: scale(55),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: verticalScale(8),
    borderRadius: scale(27.5),
    overflow: 'hidden',
  },
  logoImage: {
    width: '100%',
    height: '100%',
    borderRadius: scale(27.5),
  },
  providerName: {
    fontSize: moderateScale(11),
    fontWeight: 'bold',
    color: '#1F2937',
  },
});

export default ProviderSelection;
