import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native'
import React, { useState } from 'react'
import { Ionicons } from '@expo/vector-icons'

const durations = Array.from({ length: 12 }, (_, i) => i + 1);

const DurationSelection = ({ selectedDuration, onDurationSelect }) => {
    const [open, setOpen] = useState(false);

    return (
        <View style={styles.wrapper}>
            <Text style={styles.label}>Duration of Subscription</Text>
            <TouchableOpacity
                style={styles.selector}
                onPress={() => setOpen(!open)}
                activeOpacity={0.7}
            >
                <Text style={styles.selectorText}>
                    {selectedDuration} {selectedDuration === 1 ? 'month' : 'months'}
                </Text>
                <Ionicons name={open ? "chevron-up" : "chevron-down"} size={20} color="#6B7280" />
            </TouchableOpacity>

            {open && (
                <View style={styles.dropdown}>
                    <ScrollView nestedScrollEnabled style={styles.list}>
                        {durations.map((item) => (
                            <TouchableOpacity
                                key={item}
                                style={[
                                    styles.dropdownItem,
                                    selectedDuration === item && styles.dropdownItemSelected,
                                ]}
                                onPress={() => {
                                    onDurationSelect(item);
                                    setOpen(false);
                                }}
                            >
                                <Text style={[
                                    styles.dropdownText,
                                    selectedDuration === item && styles.dropdownTextSelected,
                                ]}>
                                    {item} {item === 1 ? 'month' : 'months'}
                                </Text>
                                {selectedDuration === item && (
                                    <Ionicons name="checkmark" size={18} color="#3B82F6" />
                                )}
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            )}
        </View>
    )
}

const styles = StyleSheet.create({
    wrapper: {
        marginHorizontal: 10,
        marginTop: 15,
        zIndex: 10,
    },
    label: {
        fontSize: 16,
        fontWeight: '700',
        color: '#6B7280',
        marginBottom: 7,
    },
    selector: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#FFF',
        borderWidth: 2,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    selectorText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
    },
    dropdown: {
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        marginTop: 6,
        overflow: 'hidden',
    },
    list: {
        maxHeight: 200,
    },
    dropdownItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    dropdownItemSelected: {
        backgroundColor: '#EFF6FF',
    },
    dropdownText: {
        fontSize: 15,
        color: '#1F2937',
    },
    dropdownTextSelected: {
        color: '#3B82F6',
        fontWeight: '600',
    },
})

export default DurationSelection
