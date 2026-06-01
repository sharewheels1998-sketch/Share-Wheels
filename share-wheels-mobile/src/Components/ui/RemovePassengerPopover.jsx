import React, { useEffect, useRef } from "react";
import {
  View,
  Modal,
  Pressable,
  Animated,
  StyleSheet,
  Dimensions,
} from "react-native";
import RemovePassengerModal from "../RemovePassenger";
import { useThemedStyles } from "../../theme/useThemedStyles";

const MAX_CARD_HEIGHT = Dimensions.get("window").height * 0.85;

const RemovePassengerPopover = ({
  visible,
  passenger,
  rideFrom,
  removing = false,
  onRemove,
  onClose,
}) => {
  const styles = useThemedStyles(createStyles);
  const scale = useRef(new Animated.Value(0.92)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scale, {
          toValue: 1,
          damping: 18,
          stiffness: 220,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scale.setValue(0.92);
      opacity.setValue(0);
    }
  }, [visible, scale, opacity]);

  if (!visible || !passenger) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={() => !removing && onClose?.()}
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
        <Pressable
          style={StyleSheet.absoluteFillObject}
          onPress={() => !removing && onClose?.()}
          disabled={removing}
        />

        <Animated.View style={[styles.cardShell, { opacity }]}>
          <Animated.View style={[styles.card, { transform: [{ scale }] }]}>
            <RemovePassengerModal
              showHandle={false}
              passenger={passenger}
              rideFrom={rideFrom}
              removing={removing}
              onRemove={onRemove}
              onCancel={onClose}
            />
          </Animated.View>
        </Animated.View>
      </View>
    </Modal>
  );
};

export default RemovePassengerPopover;

const createStyles = (c) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: c.overlay,
      justifyContent: "center",
      paddingHorizontal: 20,
    },
    cardShell: {
      width: "100%",
      maxHeight: MAX_CARD_HEIGHT,
    },
    card: {
      backgroundColor: c.surface,
      borderRadius: 20,
      maxHeight: MAX_CARD_HEIGHT,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: c.border,
      shadowColor: c.shadow,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 16,
      elevation: 12,
    },
  });
