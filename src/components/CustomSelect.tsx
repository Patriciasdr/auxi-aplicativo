
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';

interface CustomSelectProps {
  label: string;
  value: string;
  options: string[];
  isOpen: boolean;
  onToggle: () => void;
  onSelect: (item: string) => void;
}

export function CustomSelect({ label, value, options, isOpen, onToggle, onSelect }: CustomSelectProps) {
  return (
    <View style={[styles.formGroup, { zIndex: isOpen ? 20 : 1 }]}>
      <Text style={styles.formLabel}>{label}</Text>
      
      <TouchableOpacity style={styles.selectBox} onPress={onToggle} activeOpacity={0.8}>
        <Text style={styles.selectText}>{value}</Text>
        <Feather name={isOpen ? "chevron-up" : "chevron-down"} size={14} color={COLORS.textDark} />
      </TouchableOpacity>

      {isOpen && (
        <View style={styles.dropdownMenu}>
          {options.map((item, idx) => {
            const isSelected = value === item;
            return (
              <TouchableOpacity 
                key={idx} 
                style={styles.dropdownItem} 
                onPress={() => {
                  onSelect(item);
                  onToggle(); 
                }}
              >
                <Text style={[styles.dropdownItemText, isSelected && styles.selectedText]}>
                  {item}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  formGroup: { flex: 1, marginBottom: 14, gap: 5 },
  formLabel: { fontFamily: 'Montserrat_600SemiBold', fontSize: 11, color: COLORS.textDark },
  selectBox: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: COLORS.grayBorder, borderRadius: 8, padding: 11, backgroundColor: COLORS.white },
  selectText: { fontFamily: 'Montserrat_400Regular', fontSize: 13, color: COLORS.textDark },
  dropdownMenu: { position: 'absolute', top: 60, left: 0, right: 0, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.grayBorder, borderRadius: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.1, shadowRadius: 5, elevation: 5 },
  dropdownItem: { paddingVertical: 12, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  dropdownItemText: { fontFamily: 'Montserrat_400Regular', fontSize: 12, color: COLORS.textDark },
  selectedText: { color: COLORS.greenMain, fontFamily: 'Montserrat_700Bold' }
});
