import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity } from 'react-native'
import React, { useState } from 'react'
import { Ionicons } from '@expo/vector-icons'

const PlanSelection = ({ selectedPlanId, onPlanSelect }) => {
    const plans = [
        {
            id: 1,
            name: 'Basic Plan',
            price: 'XAF 1000/month',
            description: 'All you need for an improved learning experience',
            features: [
                '1000 questions per month',
                '1000 answers per month',
                '1000 questions per month',
            ],

        },
        {
            id: 2,
            name: 'Premium Plan',
            price: 'XAF 2000/month',
            description: 'All you need for an improved learning experience',
            features: [
                '1000 questions per month',
                '1000 answers per month',
                '1000 questions per month',
            ],
        },
        {
            id: 3,
            name: 'Pro Plan',
            price: 'XAF 3000/month',
            description: 'All you need for an improved learning experience',
            features: [
                '1000 questions per month',
                '1000 answers per month',
                '1000 questions per month',
            ],
        },
    ]

    return (
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            pagingEnabled
            decelerationRate="fast"
            snapToAlignment="center"
        >
            {plans.map((plan) => (
                <TouchableOpacity
                    key={plan.id}
                    style={[styles.container, selectedPlanId === plan.id && styles.containerSelected]}
                    onPress={() => onPlanSelect(plan.id)}
                    activeOpacity={0.8}
                >
                    <View style={styles.planCard}>
                        <View style={styles.planCardContent}>
                            <Text style={styles.planName}>{plan.name}</Text>
                            <Text style={styles.planPrice}>{plan.price}</Text>
                        </View>
                        <View style={styles.planFeatures}>
                            {plan.features.map((feature, index) => (
                                <View key={index} style={styles.featureRow}>
                                    <Ionicons name="checkmark-done-circle" size={20} color={selectedPlanId === plan.id ? "#3B82F6" : "#D1D5DB"} />
                                    <Text style={styles.featureText}>{feature}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                </TouchableOpacity>
            ))}
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    container: {
        width: Dimensions.get('window').width - 70,
        flexDirection: 'column',
        borderWidth: 2,
        borderColor: '#E5E7EB',
        borderRadius: 15,
        borderBottomWidth: 0,
        padding: 10,
        marginHorizontal: 8,
        backgroundColor: 'white',
    },
    containerSelected: {
        borderColor: '#3B82F6',
    },
    planName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#111827',
    },
    planPrice: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#111827',
    },
    planCard: {
        flex: 1,
        backgroundColor: 'white',
    },
    planCardContent: {
        flex: 1,
        backgroundColor: 'white',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    planFeatures: {
        flex: 1,
        backgroundColor: 'white',
    },
    featureRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 4,
    },
    featureText: {
        marginLeft: 8,
        fontSize: 14,
        color: '#4B5563',
    },
})

export default PlanSelection