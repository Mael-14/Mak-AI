import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

// Standard screen size (usually based on iPhone 11/13/14/15)
const guidelineBaseWidth = 375;
const guidelineBaseHeight = 812;

// Scale based on width
const scale = (size) => (width / guidelineBaseWidth) * size;

// Scale based on height
const verticalScale = (size) => (height / guidelineBaseHeight) * size;

/**
 * moderateScale:
 * This is the magic function. It scales the size but only by 50% 
 * (or whatever factor you choose) so it doesn't get too big on large phones.
 */
const moderateScale = (size, factor = 0.5) => size + (scale(size) - size) * factor;

export { scale, verticalScale, moderateScale };