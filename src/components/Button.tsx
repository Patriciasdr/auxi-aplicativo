import React from 'react';
import { TouchableOpacity, Text, StyleSheet, TouchableOpacityProps, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary';
  icon?: keyof typeof Feather.glyphMap;
}

export function Button({ title, variant = 'primary', icon, ...rest }: ButtonProps) {
  const isPrimary = variant === 'primary';
  const { style, disabled, ...touchableProps } = rest;

  return (
    <TouchableOpacity
      style={[
        styles.buttonBase,
        isPrimary ? styles.primaryBackground : styles.secondaryBackground,
        disabled && styles.disabled,
        style
      ]}
      activeOpacity={disabled ? 1 : 0.8}
      disabled={disabled}
      {...touchableProps}
    >
      <View style={styles.contentRow}>
        {icon && (
          <Feather
            name={icon}
            size={16}
            color={isPrimary ? COLORS.white : COLORS.greenMain}
          />
        )}
        <Text style={[
          styles.textBase,
          isPrimary ? styles.primaryText : styles.secondaryText
        ]}>
          {title}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  buttonBase: {
    width: '100%',
    padding: 14,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryBackground: { backgroundColor: COLORS.greenMain },
  secondaryBackground: { backgroundColor: COLORS.transparent },
  disabled: { opacity: 0.55 },
  textBase: { fontFamily: 'Montserrat_700Bold' },
  primaryText: { color: COLORS.white, fontSize: 14.5 },
  secondaryText: { color: COLORS.greenMain, fontSize: 13.5 }
});
