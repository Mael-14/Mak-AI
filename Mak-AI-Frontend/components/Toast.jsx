import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const Toast = ({
  visible,
  message,
  type = 'success', // 'success', 'error', 'warning', 'info'
  duration = 4000,
  onHide,
  actionText,
  onActionPress,
}) => {
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Slide up and fade in
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto hide after duration
      const timer = setTimeout(() => {
        hideToast();
      }, duration);

      return () => clearTimeout(timer);
    } else {
      hideToast();
    }
  }, [visible]);

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (onHide) {
        onHide();
      }
    });
  };

  const getToastConfig = () => {
    switch (type) {
      case 'success':
        return {
          backgroundColor: '#10B981',
          icon: 'checkmark-circle',
          iconColor: '#FFFFFF',
        };
      case 'error':
        return {
          backgroundColor: '#EF4444',
          icon: 'alert-circle',
          iconColor: '#FFFFFF',
        };
      case 'warning':
        return {
          backgroundColor: '#F59E0B',
          icon: 'warning',
          iconColor: '#FFFFFF',
        };
      case 'info':
        return {
          backgroundColor: '#3B82F6',
          icon: 'information-circle',
          iconColor: '#FFFFFF',
        };
      default:
        return {
          backgroundColor: '#10B981',
          icon: 'checkmark-circle',
          iconColor: '#FFFFFF',
        };
    }
  };

  const config = getToastConfig();

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.overlay,
        {
          opacity: opacityAnim,
        },
      ]}
      pointerEvents="box-none"
    >
      <SafeAreaView style={styles.safeArea} pointerEvents="box-none">
        <Animated.View
          style={[
            styles.toastContainer,
            {
              backgroundColor: config.backgroundColor,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.contentContainer}>
            <View style={styles.leftContent}>
              <Ionicons
                name={config.icon}
                size={wp('6%')}
                color={config.iconColor}
                style={styles.icon}
              />
              <Text style={styles.message} numberOfLines={3}>
                {message}
              </Text>
            </View>

            <View style={styles.rightContent}>
              {actionText && (
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={onActionPress}
                  activeOpacity={0.7}
                >
                  <Text style={styles.actionText}>{actionText}</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.closeButton}
                onPress={hideToast}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={wp('5%')} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Progress bar */}
          <ProgressBar duration={duration} type={type} />
        </Animated.View>
      </SafeAreaView>
    </Animated.View>
  );
};

const ProgressBar = ({ duration, type }) => {
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: duration,
      useNativeDriver: false,
    }).start();
  }, []);

  const getProgressColor = () => {
    switch (type) {
      case 'success':
        return '#059669';
      case 'error':
        return '#DC2626';
      case 'warning':
        return '#D97706';
      case 'info':
        return '#2563EB';
      default:
        return '#059669';
    }
  };

  return (
    <View style={styles.progressContainer}>
      <Animated.View
        style={[
          styles.progressBar,
          {
            backgroundColor: getProgressColor(),
            width: progressAnim.interpolate({
              inputRange: [0, 1],
              outputRange: ['0%', '100%'],
            }),
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    pointerEvents: 'box-none',
  },
  safeArea: {
    flex: 1,
    pointerEvents: 'box-none',
  },
  toastContainer: {
    position: 'absolute',
    bottom: hp('4%'),
    left: wp('4%'),
    right: wp('4%'),
    borderRadius: wp('4%'),
    minHeight: hp('8%'),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 12,
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('2%'),
    flex: 1,
  },
  leftContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: wp('3%'),
  },
  message: {
    color: '#FFFFFF',
    fontSize: wp('4%'),
    fontWeight: '500',
    flex: 1,
    lineHeight: wp('5.5%'),
  },
  rightContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: wp('2%'),
  },
  actionButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: wp('3%'),
    paddingVertical: hp('1%'),
    borderRadius: wp('2%'),
    marginRight: wp('2%'),
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: wp('3.5%'),
    fontWeight: '600',
  },
  closeButton: {
    padding: wp('1%'),
  },
  progressContainer: {
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderBottomLeftRadius: wp('4%'),
    borderBottomRightRadius: wp('4%'),
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderBottomLeftRadius: wp('4%'),
    borderBottomRightRadius: wp('4%'),
  },
});

export default Toast;