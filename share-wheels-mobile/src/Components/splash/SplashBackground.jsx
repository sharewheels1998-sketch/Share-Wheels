import React, { useEffect } from "react";
import { StyleSheet, Dimensions } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  interpolate,
} from "react-native-reanimated";
import LinearGradient from "react-native-linear-gradient";

const { width: W, height: H } = Dimensions.get("window");

const ORBS = [
  { size: W * 0.7, top: -H * 0.12, left: -W * 0.25, opacity: [0.08, 0.18] },
  { size: W * 0.5, top: H * 0.42, right: -W * 0.2, opacity: [0.06, 0.14] },
  { size: W * 0.38, bottom: H * 0.08, left: W * 0.1, opacity: [0.05, 0.12] },
];

const FloatingOrb = ({ orb, index }) => {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withSequence(
        withTiming(1, {
          duration: 3200 + index * 500,
          easing: Easing.inOut(Easing.sin),
        }),
        withTiming(0, {
          duration: 3200 + index * 500,
          easing: Easing.inOut(Easing.sin),
        })
      ),
      -1,
      false
    );
  }, [index, progress]);

  const style = useAnimatedStyle(() => ({
    opacity: interpolate(
      progress.value,
      [0, 1],
      orb.opacity
    ),
    transform: [
      { translateY: interpolate(progress.value, [0, 1], [0, -12 - index * 4]) },
      { scale: interpolate(progress.value, [0, 1], [1, 1.05]) },
    ],
  }));

  const pos = {
    width: orb.size,
    height: orb.size,
    borderRadius: orb.size / 2,
    position: "absolute",
    top: orb.top,
    left: orb.left,
    right: orb.right,
    bottom: orb.bottom,
  };

  return <Animated.View style={[styles.orb, pos, style]} />;
};

const SplashBackground = () => (
  <>
    <LinearGradient
      colors={["rgba(255,255,255,0.12)", "transparent"]}
      style={styles.topGlow}
      pointerEvents="none"
    />
    {ORBS.map((orb, i) => (
      <FloatingOrb key={i} orb={orb} index={i} />
    ))}
    <Animated.View style={styles.bottomFade} pointerEvents="none" />
  </>
);

export default SplashBackground;

const styles = StyleSheet.create({
  orb: {
    backgroundColor: "#FFFFFF",
  },
  topGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: H * 0.35,
  },
  bottomFade: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: H * 0.4,
    backgroundColor: "rgba(15, 23, 42, 0.15)",
  },
});
