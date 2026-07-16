
import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { LoginScreen } from '../screens/LoginScreen';
import { PasswordScreen } from '../screens/PasswordScreen';
import { CondoSelectionScreen } from '../screens/CondoSelectionScreen';
import { TabRoutes } from './TabRoutes'; 
import { useAuth } from '../context/AuthContext';

const Stack = createNativeStackNavigator();

export function Routes() {
  const { estaAutenticado, condominioAtivo, carregandoContexto } = useAuth();

  if (carregandoContexto) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f1f5f3' }}>
        <ActivityIndicator size="large" color="#008542" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator id="RootStack" screenOptions={{ headerShown: false }}>
        
        {!estaAutenticado ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Password" component={PasswordScreen} />
          </>
        ) : !condominioAtivo ? (
          <Stack.Screen name="CondoSelection" component={CondoSelectionScreen} />
        ) : (
         
          <>
            <Stack.Screen name="Home" component={TabRoutes} /> 
            <Stack.Screen name="CondoSelection" component={CondoSelectionScreen} />
          </>
        )}
        
      </Stack.Navigator>
    </NavigationContainer>
  );
}
