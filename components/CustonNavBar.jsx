import React from 'react';
import { View, StyleSheet, useColorScheme } from 'react-native';
import { useLinkBuilder, useTheme } from '@react-navigation/native';
import { Text, PlatformPressable } from '@react-navigation/elements';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constant/color';

const Tab = createBottomTabNavigator()


// 1. Removed TypeScript interfaces and added the arrow function syntax
const CustomNavBar = ({ state, descriptors, navigation }) => {
  const scheme = useColorScheme()
  const bg = COLORS.accent
  const secondary = scheme === 'light'
    ? COLORS.dark.background
    : COLORS.light.background;
  const { colors } = useTheme();
  const { buildHref } = useLinkBuilder();

  return (
    <View style={[styles.container, { backgroundColor: secondary }]}>
      {state.routes.map((route, index) => {
        console.log("route:", route);

        if ([ 'SignUpScreen', 'auth/ResetPassword','CustomsExamScreen','TopicsModeScreen','SelectedCourseScreen', 'RevisionMode', 'ExamMode', 'OnboardingScreen', 'JunesModeScreen',"subject/[id]"].includes(route.name)) {
          return null; // Skip rendering this tab
        }
        const { options } = descriptors[route.key];

        // Determine the label
        const label =
          options.tabBarLabel !== undefined
            ? options.tabBarLabel
            : options.title !== undefined
              ? options.title
              : route.name;

        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: 'tabLongPress',
            target: route.key,
          });
        };

        return (
          <PlatformPressable
            key={route.key} // Key is required for list rendering
            href={buildHref(route.name, route.params)}
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarButtonTestID}
            onPress={onPress}
            onLongPress={onLongPress}
            style={[styles.tabItem, { backgroundColor: isFocused ? bg : 'transparent' }]}
          >
            {getIconByrouteName(route.name, isFocused ? secondary : bg)}
            {isFocused && <Text style={styles.text}>
              {label}
            </Text>}
          </PlatformPressable>
        );
      })}
    </View>
  );
  function getIconByrouteName(routeName, color) {
    switch (routeName) {
      case 'index':
        return <Ionicons name="home-outline" size={24} color={color} />;
      case 'Chat':
        return <Ionicons name="chatbubble-outline" size={24} color={color} />;
      case 'profile':
        return <Ionicons name="person-outline" size={24} color={color} />;
      default:
        return <Ionicons name="home-outline" size={24} color={color} />;
    }
  }
};

// 2. Main Navigator Component
export default CustomNavBar

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    width: '80%',
    alignSelf: 'center',
    bottom: 40,
    borderRadius: 40,
    paddingHorizontal: 12,
    height: 43,
  },
  tabItem: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 36,
    paddingHorizontal: 12,
    borderRadius: 30,
  },
  text: {
    color: 'white',
    marginLeft: 8,
  },

})