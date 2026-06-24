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

/** Keep decorative orbs in corners — away from the centered logo. */
const ORBS = [
  { size: W * 0.55, top: -H * 0.1, left: -W * 0.28, opacity: [0.05, 0.12] },
  { size: W * 0.42, top: H * 0.08, right: -W * 0.22, opacity: [0.04, 0.1] },
  { size: W * 0.48, bottom: H * 0.12, left: -W * 0.18, opacity: [0.04, 0.09] },
  { size: W * 0.36, bottom: H * 0.22, right: -W * 0.12, opacity: [0.03, 0.08] },
];

const FloatingOrb = ({ orb, index }) => {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withSequence(
        withTiming(1, {
          duration: 3400 + index * 400,
          easing: Easing.inOut(Easing.sin),
        }),
        withTiming(0, {
          duration: 3400 + index * 400,
          easing: Easing.inOut(Easing.sin),
        })
      ),
      -1,
      false
    );
  }, [index, progress]);

  const style = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], orb.opacity),
    transform: [
      { translateY: interpolate(progress.value, [0, 1], [0, -10 - index * 3]) },
      { scale: interpolate(progress.value, [0, 1], [1, 1.04]) },
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
      colors={["rgba(255,255,255,0.14)", "transparent"]}
      style={styles.topGlow}
      pointerEvents="none"
    />
    {ORBS.map((orb, i) => (
      <FloatingOrb key={i} orb={orb} index={i} />
    ))}
    <LinearGradient
      colors={["transparent", "rgba(15, 23, 42, 0.18)"]}
      style={styles.bottomFade}
      pointerEvents="none"
    />
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
    height: H * 0.32,
  },
  bottomFade: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: H * 0.35,
  },
});
