import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Flame, Check } from 'lucide-react-native';

const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

// Monday=0 ... Sunday=6
const getTodayIndex = () => (new Date().getDay() + 6) % 7;

export default function DayStreak({ streak = 0 }) {
  const [count, setCount] = useState(0);
  const [showDays, setShowDays] = useState(false);

  // Animated values
  const cardScale = useRef(new Animated.Value(0.9)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const flameScale = useRef(new Animated.Value(0)).current;
  const flameBounce = useRef(new Animated.Value(0)).current;
  const glowOpacity = useRef(new Animated.Value(0.2)).current;
  const ringScale = useRef(new Animated.Value(0.5)).current;
  const ringOpacity = useRef(new Animated.Value(1)).current;
  const numberScale = useRef(new Animated.Value(0.5)).current;
  const numberOpacity = useRef(new Animated.Value(0)).current;

  // Day circle animations
  const dayScales = useRef(DAYS.map(() => new Animated.Value(0))).current;
  const dayRingScale = useRef(new Animated.Value(0.5)).current;
  const dayRingOpacity = useRef(new Animated.Value(1)).current;

  // Computed once per render — stable across the effect
  const todayIndex = getTodayIndex();
  const startIndex = Math.max(0, todayIndex - streak + 1);

  useEffect(() => {
    // Reset
    setCount(0);
    setShowDays(false);
    cardScale.setValue(0.9);
    cardOpacity.setValue(0);
    flameScale.setValue(0);
    flameBounce.setValue(0);
    glowOpacity.setValue(0.2);
    ringScale.setValue(0.5);
    ringOpacity.setValue(1);
    numberScale.setValue(0.5);
    numberOpacity.setValue(0);
    dayScales.forEach(s => s.setValue(0));

    // 1. Card entrance
    Animated.parallel([
      Animated.spring(cardScale, { toValue: 1, useNativeDriver: true, bounciness: 8 }),
      Animated.timing(cardOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();

    // 2. Flame entrance (after 200ms)
    setTimeout(() => {
      Animated.spring(flameScale, { toValue: 1, useNativeDriver: true, bounciness: 12 }).start();

      // Flame bounce loop
      Animated.loop(
        Animated.sequence([
          Animated.timing(flameBounce, { toValue: -8, duration: 1000, useNativeDriver: true }),
          Animated.timing(flameBounce, { toValue: 0, duration: 1000, useNativeDriver: true }),
        ])
      ).start();

      // Glow pulse loop
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowOpacity, { toValue: 0.5, duration: 1000, useNativeDriver: true }),
          Animated.timing(glowOpacity, { toValue: 0.2, duration: 1000, useNativeDriver: true }),
        ])
      ).start();
    }, 200);

    // 3. Counter
    let start = 0;
    const interval = setInterval(() => {
      if (start < streak) {
        start += 1;
        const idx = start - 1;

        setCount(start);

        // Animate the number
        numberScale.setValue(0.5);
        numberOpacity.setValue(0);
        Animated.parallel([
          Animated.spring(numberScale, { toValue: 1, useNativeDriver: true, bounciness: 10 }),
          Animated.timing(numberOpacity, { toValue: 1, duration: 150, useNativeDriver: true }),
        ]).start();

        // Animate the correct circle: fill left-to-right from startIndex
        const circleIdx = Math.max(0, todayIndex - streak + 1) + (start - 1);
        if (dayScales[circleIdx]) {
          dayScales[circleIdx].setValue(0);
          Animated.spring(dayScales[circleIdx], { toValue: 1, useNativeDriver: true, bounciness: 12 }).start();
        }
      } else {
        clearInterval(interval);
        setTimeout(() => {
          setShowDays(true);

          // Flame burst ring
          Animated.parallel([
            Animated.timing(ringScale, { toValue: 2, duration: 1000, useNativeDriver: true }),
            Animated.timing(ringOpacity, { toValue: 0, duration: 1000, useNativeDriver: true }),
          ]).start();

          // Today's day ring pop
          dayRingScale.setValue(0.5);
          dayRingOpacity.setValue(1);
          Animated.parallel([
            Animated.timing(dayRingScale, { toValue: 1.8, duration: 700, useNativeDriver: true }),
            Animated.timing(dayRingOpacity, { toValue: 0, duration: 700, useNativeDriver: true }),
          ]).start();
        }, 200);
      }
    }, 150);

    return () => clearInterval(interval);
  }, [streak]);

  // earnedUpTo: how far circles are filled so far during animation
  const earnedUpTo = startIndex + count - 1;

  return (
    <Animated.View style={[styles.container, { opacity: cardOpacity, transform: [{ scale: cardScale }] }]}>

      {/* Flame */}
      <Animated.View style={[styles.flameContainer, { transform: [{ scale: flameScale }] }]}>
        {/* Glow blob */}
        <Animated.View style={[styles.flameGlow, { opacity: glowOpacity }]} />

        {/* Burst ring (after animation completes) */}
        <Animated.View
          style={[
            styles.flameRing,
            { transform: [{ scale: ringScale }], opacity: ringOpacity },
          ]}
        />

        {/* Bouncing flame */}
        <Animated.View style={[styles.flameWrapper, { transform: [{ translateY: flameBounce }] }]}>
          <Flame size={140} color="#f97316" fill="#f97316" strokeWidth={1} />
          <View style={styles.innerFlame}>
            <Flame size={70} color="#facc15" fill="#facc15" strokeWidth={1} />
          </View>
        </Animated.View>
      </Animated.View>

      {/* Streak number */}
      <View style={styles.textContainer}>
        <Animated.Text
          style={[
            styles.streakNumber,
            { opacity: numberOpacity, transform: [{ scale: numberScale }] },
          ]}
        >
          {count}
        </Animated.Text>
        <Text style={styles.streakText}>DAY STREAK!</Text>
      </View>

      {/* Days of the week */}
      <View style={styles.daysContainer}>
        {DAYS.map((day, i) => {
          const isEarned = i >= startIndex && i <= earnedUpTo && i <= todayIndex;
          const isToday = i === todayIndex && count >= streak;

          return (
            <View key={i} style={styles.dayCol}>
              <Text style={[styles.dayLabel, isEarned && styles.dayLabelEarned]}>{day}</Text>
              <View style={styles.dayCircleWrapper}>
                <View style={[styles.dayCircle, isEarned && styles.dayCircleEarned]}>
                  {isEarned ? (
                    <Animated.View style={{ transform: [{ scale: dayScales[i] }] }}>
                      <Check strokeWidth={4} size={18} color="#fff" />
                    </Animated.View>
                  ) : (
                    <View style={styles.dayCircleEmpty} />
                  )}
                </View>

                {/* Pop ring for today */}
                {isToday && showDays && (
                  <Animated.View
                    style={[
                      styles.dayRing,
                      { transform: [{ scale: dayRingScale }], opacity: dayRingOpacity },
                    ]}
                  />
                )}
              </View>
            </View>
          );
        })}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    width: '100%',
    alignItems: 'center',
  },
  flameContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    width: 160,
    height: 160,
  },
  flameRing: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 8,
    borderColor: '#facc15',
    zIndex: 0,
  },
  flameGlow: {
    position: 'absolute',
    width: 160,
    height: 160,
    backgroundColor: '#fb923c',
    borderRadius: 80,
  },
  flameWrapper: {
    zIndex: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerFlame: {
    position: 'absolute',
    top: 32,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 28,
  },
  streakNumber: {
    fontSize: 96,
    fontWeight: '900',
    color: '#f97316',
    lineHeight: 110,
  },
  streakText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#9ca3af',
    letterSpacing: 2,
  },
  daysContainer: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    backgroundColor: '#f9fafb',
    borderWidth: 2,
    borderColor: '#f3f4f6',
    padding: 18,
    borderRadius: 24,
    width: '100%',
  },
  dayCol: {
    alignItems: 'center',
    gap: 8,
  },
  dayLabel: {
    fontWeight: 'bold',
    fontSize: 12,
    color: '#9ca3af',
  },
  dayLabelEarned: {
    color: '#f97316',
  },
  dayCircleWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  dayCircleEarned: {
    backgroundColor: '#f97316',
    shadowColor: '#f97316',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 5,
  },
  dayCircleEmpty: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#d1d5db',
  },
  dayRing: {
    position: 'absolute',
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 3,
    borderColor: '#f97316',
    zIndex: 0,
  },
});
