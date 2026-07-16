import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { 
  useFonts, 
  Montserrat_400Regular, 
  Montserrat_500Medium, 
  Montserrat_600SemiBold, 
  Montserrat_700Bold 
} from '@expo-google-fonts/montserrat';

import { COLORS } from './src/constants/theme';
import { Routes } from './src/navigation'; 
import { AuthProvider } from './src/context/AuthContext';

import { testarConexaoSupabase } from './src/services/supabase';

export default function App() {
  let [fontsLoaded] = useFonts({
    Montserrat_400Regular,
    Montserrat_500Medium,
    Montserrat_600SemiBold,
    Montserrat_700Bold,
  });

  useEffect(() => {
    if (__DEV__) {
      testarConexaoSupabase();
    }
  }, []);

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.greenMain} />
      </View>
    );
  }

  return (
    <AuthProvider>
      <View style={{ flex: 1 }}>
        <Routes />
        <StatusBar style="light" />
      </View>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.grayBg,
  }
});
