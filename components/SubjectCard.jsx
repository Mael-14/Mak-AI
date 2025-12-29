import { View, Text, TouchableOpacity, StyleSheet, Image, Dimensions } from 'react-native'
import React from 'react'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const SubjectCard = ({ title, image }) => {
  return (
    <TouchableOpacity style={[styles.card, { width: (SCREEN_WIDTH - 55) / 2 }]}>
      <View style={styles.imageContainer}>
        <Image
          source={image}
          style={styles.subjectImage}
          resizeMode="contain"
        />
        <Text style={styles.cardTitle}>{title}</Text>
      </View>
    </TouchableOpacity>
  )
}

export default SubjectCard

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFF',

    borderRadius: 24,
    padding: 15,
    marginBottom: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2
  },
  imageContainer: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10
  },
  subjectImage: {
    width: '100%',
    height: '100%',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#333'
  },
})