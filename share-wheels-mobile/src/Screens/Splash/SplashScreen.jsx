import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  StatusBar,
  Dimensions,
  Pressable,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import Icon from "react-native-vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withRepeat,
  withSequence,
  Easing,
  interpolate,
  FadeIn,
  FadeInDown,
  FadeInUp,
} from "react-native-reanimated";
import { AUTH_COLORS, AUTH_GRADIENTS } from "../../theme/authTheme";
import { LAYOUT, scale, moderateScale } from "../../theme/layout";
import ScreenContainer from "../../Components/ui/ScreenContainer";
import SplashBackground from "../../Components/splash/SplashBackground";
import appIcon from "../../assets/app-icon.png";
import { INTRO_CTA_DELAY_MS } from "../../theme/splashTiming";

const { width: SCREEN_W } = Dimensions.get("window");
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const GRADIENT_COLORS = AUTH_GRADIENTS.screen;
const GRADIENT_LOCATIONS = AUTH_GRADIENTS.screenLocations;

const TAGLINE = "Ride together. Pay less.";
const CAPTION =
  "Carpool with neighbors, send parcels on shared trips, and split every fare.";

const FEATURES = [
  { icon: "car-sport-outline", label: "Carpool" },
  { icon: "cube-outline", label: "Courier" },
  { icon: "people-outline", label: "Community" },
];

const SplashScreen = ({ mode = "intro" }) => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const isBootstrap = mode === "bootstrap";
  const [ctaReady, setCtaReady] = useState(isBootstrap);

  const logoEnter = useSharedValue(0);
  const btnScale = useSharedValue(1);
  const progressWidth = useSharedValue(0.15);

  useEffect(() => {
    if (!isBootstrap) {
      const t = setTimeout(() => setCtaReady(true), INTRO_CTA_DELAY_MS);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [isBootstrap]);

  useEffect(() => {
    logoEnter.value = withSpring(1, { damping: 14, stiffness: 90 });
    progressWidth.value = withRepeat(
      withSequence(
        withTiming(0.92, { duration: 2200, easing: Easing.inOut(Easing.cubic) }),
        withTiming(0.15, { duration: 0 })
      ),
      -1,
      false
    );
  }, [logoEnter, progressWidth]);

  const logoWrapStyle = useAnimatedStyle(() => ({
    opacity: logoEnter.value,
    transform: [
      { scale: interpolate(logoEnter.value, [0, 1], [0.9, 1]) },
      { translateY: interpolate(logoEnter.value, [0, 1], [18, 0]) },
    ],
  }));

  const btnAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: btnScale.value }],
  }));

  const progressStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: progressWidth.value }],
  }));

  const goToSignIn = () => {
    if (!isBootstrap) {
      navigation.replace("Signin");
    }
  };

  const onPressIn = () => {
    btnScale.value = withTiming(0.97, { duration: 80 });
  };
  const onPressOut = () => {
    btnScale.value = withSpring(1, { damping: 12, stiffness: 200 });
  };

  return (
    <ScreenContainer
      edges={[]}
      backgroundColor="transparent"
      style={styles.screen}
    >
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />
      <LinearGradient
        colors={GRADIENT_COLORS}
        locations={GRADIENT_LOCATIONS}
        start={{ x: 0.15, y: 0 }}
        end={{ x: 0.85, y: 1 }}
        style={styles.gradient}
      >
        <SplashBackground />

        <View
          style={[
            styles.content,
            {
              paddingTop: insets.top + scale(12),
              paddingBottom: insets.bottom + scale(14),
            },
          ]}
        >
          <View style={styles.hero}>
            <Animated.View style={[styles.logoStage, logoWrapStyle]}>
              <View style={styles.logoCard}>
                <Image source={appIcon} style={styles.logo} resizeMode="cover" />
              </View>
            </Animated.View>

            <Animated.Text
              entering={FadeInDown.delay(260).duration(500)}
              style={styles.brandName}
            >
              Share Wheels
            </Animated.Text>

            <Animated.Text
              entering={FadeInDown.delay(380).duration(500)}
              style={styles.tagline}
            >
              {TAGLINE}
            </Animated.Text>

            <Animated.Text
              entering={FadeInDown.delay(480).duration(500)}
              style={styles.caption}
            >
              {CAPTION}
            </Animated.Text>

            <Animated.View
              entering={FadeIn.delay(560).duration(450)}
              style={styles.featureRow}
            >
              {FEATURES.map((item) => (
                <View key={item.label} style={styles.featurePill}>
                  <Icon name={item.icon} size={13} color="rgba(255,255,255,0.95)" />
                  <Text style={styles.featureText}>{item.label}</Text>
                </View>
              ))}
            </Animated.View>
          </View>

          <Animated.View
            entering={FadeInUp.delay(isBootstrap ? 300 : 880).duration(450)}
            style={styles.footerPanel}
          >
            {isBootstrap ? (
              <View style={styles.bootBlock}>
                <Text style={styles.bootTitle}>Getting things ready</Text>
                <View style={styles.progressTrack}>
                  <Animated.View style={[styles.progressFill, progressStyle]} />
                </View>
                <Text style={styles.bootSub}>Loading your account…</Text>
              </View>
            ) : ctaReady ? (
              <AnimatedPressable
                onPress={goToSignIn}
                onPressIn={onPressIn}
                onPressOut={onPressOut}
                style={[styles.ctaButton, btnAnimStyle]}
              >
                <LinearGradient
                  colors={["#FFFFFF", "#F1F5F9"]}
                  style={styles.ctaInner}
                >
                  <Text style={styles.ctaText}>Get Started</Text>
                  <View style={styles.ctaArrow}>
                    <Text style={styles.ctaArrowText}>→</Text>
                  </View>
                </LinearGradient>
              </AnimatedPressable>
            ) : (
              <View style={styles.bootBlock}>
                <Text style={styles.bootTitle}>Welcome</Text>
                <View style={styles.progressTrack}>
                  <Animated.View style={[styles.progressFill, progressStyle]} />
                </View>
                <Text style={styles.bootSub}>Preparing your experience…</Text>
              </View>
            )}

            <Text style={styles.footerNote}>Smart mobility for everyday travel</Text>
          </Animated.View>
        </View>
      </LinearGradient>
    </ScreenContainer>
  );
};

export default SplashScreen;

const styles = StyleSheet.create({
  screen: { flex: 1 },
  gradient: { flex: 1 },
  content: {
    flex: 1,
    paddingHorizontal: LAYOUT.spacing.lg,
    justifyContent: "space-between",
  },
  hero: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  logoStage: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: scale(24),
  },
  logoCard: {
    width: scale(168),
    height: scale(168),
    borderRadius: scale(46),
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.55)",
    backgroundColor: "transparent",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.28,
    shadowRadius: 18,
    elevation: 12,
  },
  logo: {
    width: "100%",
    height: "100%",
  },
  brandName: {
    fontSize: Math.min(moderateScale(34), 38),
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.5,
    textAlign: "center",
    marginBottom: scale(8),
  },
  tagline: {
    fontSize: LAYOUT.font.section,
    fontWeight: "700",
    color: "rgba(255,255,255,0.96)",
    textAlign: "center",
    marginBottom: scale(10),
  },
  caption: {
    fontSize: LAYOUT.font.body,
    color: "rgba(255,255,255,0.82)",
    textAlign: "center",
    lineHeight: scale(22),
    maxWidth: SCREEN_W * 0.86,
    marginBottom: scale(18),
  },
  featureRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: scale(8),
  },
  featurePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(5),
    paddingHorizontal: scale(12),
    paddingVertical: scale(7),
    borderRadius: scale(20),
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
  },
  featureText: {
    fontSize: LAYOUT.font.small,
    fontWeight: "600",
    color: "rgba(255,255,255,0.95)",
  },
  footerPanel: {
    paddingHorizontal: LAYOUT.spacing.md,
    paddingTop: LAYOUT.spacing.md,
    paddingBottom: LAYOUT.spacing.sm,
    borderRadius: LAYOUT.radius.xl,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
  },
  ctaButton: {
    borderRadius: scale(16),
    overflow: "hidden",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 6,
  },
  ctaInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: scale(16),
    paddingHorizontal: scale(22),
    gap: scale(10),
  },
  ctaText: {
    color: AUTH_COLORS.primary,
    fontSize: LAYOUT.font.section,
    fontWeight: "800",
  },
  ctaArrow: {
    width: scale(28),
    height: scale(28),
    borderRadius: scale(14),
    backgroundColor: AUTH_COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaArrowText: {
    color: "#FFFFFF",
    fontSize: scale(16),
    fontWeight: "700",
    marginTop: -1,
  },
  bootBlock: {
    alignItems: "stretch",
    width: "100%",
  },
  bootTitle: {
    color: "#FFFFFF",
    fontSize: LAYOUT.font.section,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: scale(10),
  },
  bootSub: {
    color: "rgba(255,255,255,0.75)",
    fontSize: LAYOUT.font.small,
    textAlign: "center",
    marginTop: scale(8),
  },
  progressTrack: {
    height: scale(4),
    borderRadius: scale(2),
    backgroundColor: "rgba(255,255,255,0.2)",
    overflow: "hidden",
  },
  progressFill: {
    width: "100%",
    height: "100%",
    borderRadius: scale(2),
    backgroundColor: "#FFFFFF",
    transformOrigin: "left",
  },
  footerNote: {
    marginTop: scale(12),
    fontSize: LAYOUT.font.tiny,
    color: "rgba(255,255,255,0.45)",
    textAlign: "center",
    letterSpacing: 0.6,
  },
});
