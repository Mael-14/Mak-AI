import { View, Text } from 'react-native'
import React from 'react'
import { Link } from 'expo-router'

const Chat = () => {
    return (
        <View>
            <Text>Chat</Text>
            <Link style={{ padding: 10, backgroundColor: 'lightblue' }} href={'./ResetPassword'}>Reset</Link>
            <Link style={{ padding: 10, backgroundColor: 'lightblue' }} href={'./Stats'}>Stats</Link>
        </View>
    )
}

export default Chat