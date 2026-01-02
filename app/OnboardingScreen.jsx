import { Dimensions, StyleSheet, Text, View , TouchableOpacity , Button } from 'react-native'
import React, { use } from 'react'
import Onboarding from 'react-native-onboarding-swiper';
import LottieView from 'lottie-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
//import { Button } from 'react-native-elements';

const {width,height} = Dimensions.get('window')



const OnboardingScreen = () => {
    const navigation = useNavigation();

    const handleSkip = () => {
      navigation.navigate('Login')
    }

    const handleDone = () => {
      navigation.navigate('Login')
    }

    const doneButton = ({...props}) => (
      <TouchableOpacity style={{margin:20}}>
        <Text style={styles.onboardBtn} {...props}>Get Started</Text>
      </TouchableOpacity>
    )

    const Next = ({...props}) => (
      <TouchableOpacity style={{margin:20}}>
        <Text style={styles.onboardBtn} {...props}>Next</Text>
      </TouchableOpacity>
    )

    const Skip = ({...props}) => (
      <TouchableOpacity style={{margin:20}}>
        <Text style={styles.onboardBtn} {...props}>Skip</Text>
      </TouchableOpacity>
    )

    // const backgroundColor = isLight => (isLight ? 'blue' : 'lightblue');
    // const color = isLight => backgroundColor(!isLight);

    // const Next = ({ isLight, ...props }) => (
    //       <Button
    //         title={'Next'}
    //         buttonStyle={{
    //           backgroundColor: backgroundColor(isLight),
    //         }}
    //         containerViewStyle={{
    //           marginVertical: 10,
    //           width: 70,
    //           backgroundColor: backgroundColor(isLight),
    //         }}
    //         textStyle={{ color: color(isLight) }}
    //         {...props}
    //       />
    //  );

  return (
    <SafeAreaView style={{flex:1,backgroundColor:'#fff'}}>

        <View style={styles.container}>
              <Onboarding

                onDone = {handleDone}
                onSkip = {handleSkip}
                bottomBarHighlight={false}
                DoneButtonComponent={doneButton}
                NextButtonComponent={Next}
                SkipButtonComponent={Skip}

                containerStyles={{paddingHorizontal:20}}
                pages={[
              {
                backgroundColor: '#fff',
                image: ( 
                      <View style={styles.lottie}s>
                      <LottieView source={require('../animations/WorkHard.json')} autoPlay loop style={styles.lottie} />
                      </View>
                      ),
                title: 'Boost Productivity',
                subtitle: 'Done with React Native Onboarding Swiper to enhance good and smooth ui',
              },
              {
                backgroundColor: '#fff',
                image: (
                      <View style={styles.lottie}>
                      <LottieView source={require('../animations/ReadingBoy.json')} autoPlay loop style={styles.lottie} />
                      </View>
                      ),
                title: 'Work Seamlessly',
                subtitle: 'Done with React Native Onboarding Swiper',
              },
              {
                backgroundColor: '#fff',
                image: (
                      <View style={styles.lottie}>
                      <LottieView source={require('../animations/Books.json')} autoPlay loop style={styles.lottie} />
                      </View>
                      ),
                title: 'Archieve High Goals',
                subtitle: 'Done with React Native Onboarding Swiper',
              },
            ]}
              />
  </View>
    </SafeAreaView> 
  )
}

export default OnboardingScreen

const styles = StyleSheet.create({
    container:{
    flex:1,
    backgroundColor:'#fff',
    },
    lottie:{
      width: width*0.8,
      height: width*0.8,
    },
    onboardBtn:{
      fontSize:16,
      color:'#000',
      fontWeight:'600',
    }
})