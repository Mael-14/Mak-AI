import React, { useCallback } from 'react';
import { Dimensions, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedScrollHandler,
    useAnimatedStyle,
    interpolate,
    Extrapolation,
} from 'react-native-reanimated';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * ═══════════════════════════════════════════════════════════════
 *  AnimatedFlatList
 * ═══════════════════════════════════════════════════════════════
 *
 *  A drop-in wrapper that adds a scroll-driven scale + opacity
 *  animation to every item in a regular FlatList.
 *
 *  Items at the center of the viewport are full-size (scale 1,
 *  opacity 1). As they scroll toward the top or bottom edge they
 *  smoothly shrink and fade out – the exact effect shown in
 *  Enzo Mangano's "Animated FlatList in React Native" tutorial.
 *
 *  ────────────────────────────────────────────────────────────
 *  USAGE
 *  ────────────────────────────────────────────────────────────
 *
 *  import AnimatedFlatList from '../components/AnimatedFlatList';
 *
 *  <AnimatedFlatList
 *    data={items}
 *    itemHeight={100}               // fixed height of each item
 *    renderItem={({ item }) => (
 *      <View style={{ height: 100 }}>
 *        <Text>{item.title}</Text>
 *      </View>
 *    )}
 *    keyExtractor={(item) => item.id}
 *  />
 *
 *  ────────────────────────────────────────────────────────────
 *  PROPS
 *  ────────────────────────────────────────────────────────────
 *
 *  itemHeight  (required)  – The fixed pixel height of each item.
 *
 *  All standard FlatList props are forwarded (data, renderItem,
 *  keyExtractor, ListHeaderComponent, contentContainerStyle …).
 *
 *  Optional animation tuning:
 *    • viewportFraction – How much of the viewport height is
 *      considered the "active" zone. Default 1 (full viewport).
 *    • minScale         – Scale at the farthest edge. Default 0.85.
 *    • minOpacity       – Opacity at the farthest edge. Default 0.5.
 *
 * ═══════════════════════════════════════════════════════════════
 */

// ── Animated item wrapper ───────────────────────────────────

const AnimatedItem = ({
    children,
    index,
    scrollY,
    itemHeight,
    viewportFraction,
    minScale,
    minOpacity,
}) => {
    const animatedStyle = useAnimatedStyle(() => {
        const viewportH = SCREEN_HEIGHT * viewportFraction;

        // The y-position where this item starts in the list
        const itemStart = index * itemHeight;

        // inputRange: item is one viewport above → centered → one viewport below
        const inputRange = [
            itemStart - viewportH,
            itemStart,
            itemStart + viewportH,
        ];

        const scale = interpolate(
            scrollY.value,
            inputRange,
            [minScale, 1, minScale],
            Extrapolation.CLAMP,
        );

        const opacity = interpolate(
            scrollY.value,
            inputRange,
            [minOpacity, 1, minOpacity],
            Extrapolation.CLAMP,
        );

        return {
            transform: [{ scale }],
            opacity,
        };
    });

    return (
        <Animated.View style={[styles.itemContainer, animatedStyle]}>
            {children}
        </Animated.View>
    );
};

// ── Main component ──────────────────────────────────────────

const AnimatedFlatList = ({
    data,
    renderItem,
    itemHeight,
    viewportFraction = 1,
    minScale = 0.85,
    minOpacity = 0.5,
    contentContainerStyle,
    ...rest
}) => {
    const scrollY = useSharedValue(0);

    const scrollHandler = useAnimatedScrollHandler({
        onScroll: (event) => {
            scrollY.value = event.contentOffset.y;
        },
    });

    // Wrap the user-supplied renderItem with the animated item
    const animatedRenderItem = useCallback(
        (info) => {
            return (
                <AnimatedItem
                    index={info.index}
                    scrollY={scrollY}
                    itemHeight={itemHeight}
                    viewportFraction={viewportFraction}
                    minScale={minScale}
                    minOpacity={minOpacity}
                >
                    {renderItem(info)}
                </AnimatedItem>
            );
        },
        [renderItem, itemHeight, viewportFraction, minScale, minOpacity],
    );

    return (
        <Animated.FlatList
            data={data}
            renderItem={animatedRenderItem}
            onScroll={scrollHandler}
            scrollEventThrottle={16}
            showsVerticalScrollIndicator={false}
            getItemLayout={(_, index) => ({
                length: itemHeight,
                offset: itemHeight * index,
                index,
            })}
            contentContainerStyle={[
                styles.contentContainer,
                contentContainerStyle,
            ]}
            {...rest}
        />
    );
};

const styles = StyleSheet.create({
    itemContainer: {
        alignItems: 'center',
    },
    contentContainer: {
        paddingVertical: 16,
    },
});

export default AnimatedFlatList;
