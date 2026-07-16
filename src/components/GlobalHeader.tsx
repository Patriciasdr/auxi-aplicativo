
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { COLORS } from '../constants/theme';
import { normalizarPapel } from '../config/modules';

interface GlobalHeaderProps {
  showBackArrow?: boolean;
}

export function GlobalHeader({ showBackArrow = false }: GlobalHeaderProps) {
  const navigation = useNavigation<any>();
  const { logout, nomeUsuario, notificacoes, condominioAtivo } = useAuth(); 

  const papelAtual = normalizarPapel(condominioAtivo?.papel || 'Morador');
  const iniciais = nomeUsuario
    ? nomeUsuario.split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  return (
    <View style={styles.headerContainer}>
      
      
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          
          {showBackArrow && (
            <TouchableOpacity style={styles.headerBack} onPress={() => navigation.goBack()}>
              <Feather name="arrow-left" size={20} color="#fff" />
            </TouchableOpacity>
          )}
          
          <TouchableOpacity style={styles.logoTxt} onPress={() => navigation.navigate('Home')}>
            <View style={styles.mark}><Text style={styles.markText}>A</Text></View>
            <Text style={styles.headerTitle}>Auxiliadora</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity 
            style={styles.headerIcon} 
            onPress={() => Alert.alert('Notificações', `Você tem ${notificacoes} avisos.`)}
          >
            <Feather name="bell" size={18} color="#fff" />
            {notificacoes > 0 && (
              <View style={styles.notifBadge}>
                <Text style={styles.notifText}>{notificacoes}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIcon} onPress={() => navigation.navigate('Perfil')}>
            <Feather name="user" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      
      <View style={styles.subheader}>
        <View style={styles.av}><Text style={styles.avText}>{iniciais}</Text></View>
        <View style={styles.userInfo}>
          <Text style={styles.uName}>{nomeUsuario}</Text>
          <Text style={styles.uMeta}>
            {condominioAtivo?.nome} · <Text style={styles.roleLabel}>{papelAtual}</Text>
          </Text>
        </View>
        <TouchableOpacity style={styles.trocarBtn} onPress={logout}>
          <Feather name="log-out" size={13} color="#fff" />
          <Text style={styles.trocarTxt}>Sair</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: { zIndex: 100 },
  header: { backgroundColor: COLORS.greenMain, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, height: 56, justifyContent: 'space-between', zIndex: 100 },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  headerBack: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  logoTxt: { flexDirection: 'row', alignItems: 'center' },
  mark: { width: 28, height: 28, backgroundColor: COLORS.white, borderRadius: 7, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  markText: { color: COLORS.greenMain, fontFamily: 'Montserrat_700Bold', fontSize: 15 },
  headerTitle: { color: COLORS.white, fontFamily: 'Montserrat_700Bold', fontSize: 15 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.12)', borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)', alignItems: 'center', justifyContent: 'center' },
  notifBadge: { position: 'absolute', top: -3, right: -3, backgroundColor: '#e53935', width: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: COLORS.greenMain },
  notifText: { color: COLORS.white, fontSize: 9, fontFamily: 'Montserrat_700Bold' },
  
  subheader: { backgroundColor: COLORS.greenDark, flexDirection: 'row', alignItems: 'center', paddingVertical: 9, paddingHorizontal: 16, gap: 10 },
  av: { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.2)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.4)', alignItems: 'center', justifyContent: 'center' },
  avText: { color: COLORS.white, fontFamily: 'Montserrat_700Bold', fontSize: 13 },
  userInfo: { flex: 1 },
  uName: { color: COLORS.white, fontFamily: 'Montserrat_700Bold', fontSize: 12.5, lineHeight: 18 },
  uMeta: { color: COLORS.white, fontFamily: 'Montserrat_400Regular', fontSize: 10, opacity: 0.85 },
  roleLabel: { fontFamily: 'Montserrat_700Bold' },
  trocarBtn: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  trocarTxt: { color: COLORS.white, fontFamily: 'Montserrat_400Regular', fontSize: 11, opacity: 0.9 },
});
