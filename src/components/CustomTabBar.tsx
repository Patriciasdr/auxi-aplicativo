
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { obterModulosPermitidos, normalizarPapel } from '../config/modules';

export function CustomTabBar({ state, navigation, setMenuAberto }: any) {
  const { condominioAtivo } = useAuth();
  const papelAtual = normalizarPapel(condominioAtivo?.papel || 'Morador');

  
  const modulosPermitidos = obterModulosPermitidos(papelAtual);
  
  
  const meusServicos = modulosPermitidos.filter(m => !m.stub).slice(0, 2);

  
  const activeRouteName = state.routes[state.index].name;
  const isHomeActive = activeRouteName === 'HomeTab';
  
  
  const isMenuActive = !isHomeActive && !meusServicos.some(m => m.route === activeRouteName);

  return (
    <View style={styles.tabBar}>
      
      
      <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate('HomeTab')} activeOpacity={0.7}>
        <Feather name="home" size={22} color={isHomeActive ? COLORS.greenMain : COLORS.textMuted} />
        <Text style={[styles.tabLabel, isHomeActive && styles.tabLabelActive]}>Início</Text>
      </TouchableOpacity>

      
      {meusServicos.map(mod => {
        const isActive = activeRouteName === mod.route;
        
        const shortName = mod.nome.split(' ')[0];

        return (
          <TouchableOpacity key={mod.key} style={styles.tabItem} onPress={() => navigation.navigate(mod.route)} activeOpacity={0.7}>
            <Feather name={mod.ic as any} size={22} color={isActive ? COLORS.greenMain : COLORS.textMuted} />
            <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]} numberOfLines={1}>
              {shortName}
            </Text>
          </TouchableOpacity>
        );
      })}

      
      <TouchableOpacity style={styles.tabItem} onPress={() => setMenuAberto(true)} activeOpacity={0.7}>
        <Feather name="menu" size={22} color={isMenuActive ? COLORS.greenMain : COLORS.textMuted} />
        <Text style={[styles.tabLabel, isMenuActive && styles.tabLabelActive]}>Menu</Text>
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: { flexDirection: 'row', height: 64, backgroundColor: COLORS.white, borderTopWidth: 1, borderTopColor: COLORS.grayBorder, paddingBottom: 6, paddingTop: 8, position: 'absolute', bottom: 0, left: 0, right: 0, elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.05, shadowRadius: 10 },
  tabItem: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2 },
  tabLabel: { fontFamily: 'Montserrat_600SemiBold', fontSize: 10, color: COLORS.textMuted },
  tabLabelActive: { color: COLORS.greenMain }
});
