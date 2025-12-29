import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { Tabs } from 'expo-router'
import CustomNavBar from '../components/CustonNavBar'

const _layout = () => {
    return <Tabs tabBar={(props) => <CustomNavBar {...props} />}>
        <Tabs.Screen name='index' options={{ title: 'Home' }} />
        <Tabs.Screen name='Chat' options={{ title: 'Chat' }} />
        <Tabs.Screen name='profile' options={{ title: 'Profile' }} />
    </Tabs>
}
export default _layout