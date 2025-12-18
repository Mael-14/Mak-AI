import { StyleSheet, Text, View , StatusBar , Image , TextInput , TouchableOpacity} from 'react-native'
import React, {useState} from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import Layer1 from '../assets/layerBlur1.png'
import { AntDesign } from "@expo/vector-icons"; 
import Gicon from '../assets/google_icon.png'
import Aicon from '../assets/avatar.png'
import Licon from '../assets/lock.png'
import Eicon from '../assets/email.png'

const LoginScreen = ({navigation}) => {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');

  return (
    <SafeAreaView style={{flex:1, backgroundColor:'#ffffffff'}}>
      <StatusBar barStyle="dark-content" />
      
      <Image source={Layer1} style={styles.blod} />

      <View style={styles.container}>

        <View style={styles.header} >
          <Text style={styles.title}>Create Account</Text>
          <Text style={{paddingBottom:30}}>SignUp to get Started with Mak AI</Text>
        </View>

        <View style={styles.inputContainer}>
            <View style={{paddingRight: 20}}>
              <Image source={Aicon} style={{width:12, height: 15}} />
            </View>
            <TextInput
              style={styles.enterBtn}
              placeholder="Name"
              value={name}
              onChangeText={setName}
              placeholderTextColor="#666"
            />
        </View>

        <View style={styles.inputContainer}>
            <View style={{paddingRight: 20}}>
              <Image source={Eicon} style={{width:12, height: 13}} />
            </View>
            <TextInput
              style={styles.enterBtn}
              placeholder="Email"
              value={name}
              onChangeText={setName}
              placeholderTextColor="#666"
            />
        </View>
        
        <View style={[styles.inputContainer ]}>
            <View style={{paddingRight: 20}}>
              <Image source={Licon} style={{width:12, height: 15}} />
            </View>
            <TextInput
              style={styles.input}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholderTextColor="#666"
            />
        </View>

          <TouchableOpacity style={{flexDirection: 'row-reverse' , paddingBottom:10}}>
            <Text style={styles.forgotPasswordText}>Forgot password ?</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.loginButton}>
            <Text style={styles.loginButtonText}>SignUp</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.googleButton}>
              <Image source={Gicon} style={{width:19, height: 22 , marginRight: 10}} />
            {/* <AntDesign name="google" size={22} color="#373130ff" style={{paddingRight: 10}} /> */}
            <Text style={styles.googleButtonText}>Continue with Google</Text>
          </TouchableOpacity>

          


      </View>
      <Image source={Layer1} style={styles.blod} />

      <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity>
              <Text style={styles.signUpText} onPress={() => navigation.navigate('Login')}>Login</Text>
            </TouchableOpacity>
      </View>

      {/* <Text>LoginScreen</Text> */}
    </SafeAreaView>
  )
}

export default LoginScreen

const styles = StyleSheet.create({
  blod:{
    position:'absolute',
    width: 459,
    height: 500,
    top: -150,
    left: -100,
    zIndex:1,
    opacity:0.5
  },
  container:{
    position:'absolute',
    top:206,
    left:32,
    //alignItems:'center',
    justifyContent:'center',
    marginHorizontal:20,
    zIndex:2
  },
  title:{
    fontSize:32,
    fontWeight:'700',
    color:'#000',
    marginBottom:8,
    fontFamily: 'Georgia',
  },
  inputContainer:{
    flexDirection: 'row',
    alignItems: 'center',
    width: 300,
    height: 40,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 0.3,
    borderColor: '#bebbbbff',
    marginBottom: 16,
    paddingHorizontal: 14,
    // shadowColor: '#000',
    // shadowOffset: { width: 0, height: 2 },
    // shadowOpacity: 0.05,
    // shadowRadius: 4,
    // elevation: 2,
  },
  loginButton: {
    backgroundColor: '#AAB6FF',
    borderRadius: 12,
    paddingVertical: 5,
    paddingHorizontal: 24,
    width: 300,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    height: 56,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    width: 300,
    marginTop:16
  },
  footer: {
    flexDirection:'row',
    justifyContent: 'center',
    marginTop: 'auto',
  },
  signUpText: {
    fontSize: 14,
    color: '#4a4aff',
    fontWeight: '600',
    textDecorationLine: 'underline',
  }
})