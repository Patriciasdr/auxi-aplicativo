
import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';

interface InputProps extends TextInputProps {
  label: string;
  isPassword?: boolean; 
}

export function Input({ label, isPassword, style, ...rest }: InputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      
      <View style={[styles.inputWrapper, isFocused && styles.inputFocused, style]}>
        <TextInput
          style={styles.input}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholderTextColor={COLORS.textMuted}
          secureTextEntry={isPassword && !showPassword} 
          {...rest}
        />
        
        
        {isPassword && (
          <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPassword(!showPassword)}>
            <Feather name={showPassword ? 'eye-off' : 'eye'} size={18} color="#6b7c73" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%', marginBottom: 16 },
  label: { fontFamily: 'Montserrat_600SemiBold', fontSize: 12.5, color: '#3a4a42', marginBottom: 7 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    borderWidth: 1.6,
    borderColor: '#d7e0da',
    borderRadius: 11,
    backgroundColor: '#fcfdfc',
  },
  inputFocused: { borderColor: COLORS.greenMain },
  input: {
    flex: 1,
    padding: 14,
    fontSize: 16,
    fontFamily: 'Montserrat_400Regular',
    color: COLORS.textDark,
  },
  eyeBtn: { paddingHorizontal: 14, height: '100%', justifyContent: 'center' }
});
