
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '../constants/theme';

interface SubnavProps {
  title: string;
}

export function Subnav({ title }: SubnavProps) {
  const navigation = useNavigation<any>();

  return (
    <View style={styles.subnav}>
      
      <TouchableOpacity style={styles.subnavBtn} onPress={() => navigation.goBack()}>
        <Feather name="arrow-left" size={15} color={COLORS.greenMain} />
        <Text style={styles.subnavBtnTxt}>Voltar</Text>
      </TouchableOpacity>
      
      <Text style={styles.subnavTitle} numberOfLines={1}>{title}</Text>
      
      
      <TouchableOpacity style={styles.subnavBtn} onPress={() => navigation.navigate('HomeTab')}>
        <Feather name="home" size={15} color={COLORS.greenMain} />
        <Text style={styles.subnavBtnTxt}>Menu principal</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  subnav: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    backgroundColor: COLORS.white, 
    paddingVertical: 8, 
    paddingHorizontal: 10, 
    borderBottomWidth: 1, 
    borderBottomColor: COLORS.grayBorder, 
    zIndex: 90 
  },
  subnavBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: 5, 
    paddingHorizontal: 6, 
    borderRadius: 6, 
    gap: 4 
  },
  subnavBtnTxt: { 
    color: COLORS.greenMain, 
    fontFamily: 'Montserrat_600SemiBold', 
    fontSize: 11.5 
  },
  subnavTitle: { 
    flex: 1, 
    textAlign: 'center', 
    fontFamily: 'Montserrat_700Bold', 
    fontSize: 11.5, 
    color: COLORS.textDark 
  }
});
