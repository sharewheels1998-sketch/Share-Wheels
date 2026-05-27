import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import LinearGradient from "react-native-linear-gradient";
import Icon from "react-native-vector-icons/Ionicons";
import { LAYOUT } from "../theme/layout";

const SupportCard = () => {
  const navigation = useNavigation();

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate("ChartBoat")}
      activeOpacity={0.88}
    >
      <LinearGradient colors={["#EEF2FF", "#FFFFFF"]} style={styles.inner}>
        <LinearGradient colors={["#4F46E5", "#2563EB"]} style={styles.iconWrap}>
          <Icon name="headset" size={24} color="#FFFFFF" />
        </LinearGradient>

        <View style={styles.textWrap}>
          <Text style={styles.title}>Help & support</Text>
          <Text style={styles.subtitle}>Chat with our support assistant</Text>
        </View>

        <Icon name="chevron-forward" size={22} color="#94A3B8" />
      </LinearGradient>
    </TouchableOpacity>
  );
};

export default SupportCard;

const styles = StyleSheet.create({
  card: {
    marginHorizontal: LAYOUT.spacing.md,
    marginTop: LAYOUT.spacing.md,
    borderRadius: LAYOUT.radius.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  inner: {
    flexDirection: "row",
    alignItems: "center",
    padding: LAYOUT.spacing.md,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  textWrap: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
  },
  subtitle: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 3,
  },
});
