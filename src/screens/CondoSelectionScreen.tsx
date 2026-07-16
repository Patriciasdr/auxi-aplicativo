
import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../constants/theme';
import { useAuth } from '../context/AuthContext'; 
import { useNavigation } from '@react-navigation/native';

export function CondoSelectionScreen() {
  const { logout, condominios, selecionarCondominioAtivo, nomeUsuario } = useAuth(); 
  const navigation = useNavigation<any>(); 

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#00A859', '#00803f']} style={styles.topo}>
        <View style={styles.logoContainer}>
          <View style={styles.mark}><Text style={styles.markText}>A</Text></View>
          <Text style={styles.logoText}>Auxiliadora Digital</Text>
        </View>
        <Text style={styles.topoDesc}>Acesso liberado ao portal e ao aplicativo com a mesma conta.</Text>
        
        <View style={styles.topoUserContainer}>
          <Text style={styles.topoUserText}>{nomeUsuario} · </Text>
          <TouchableOpacity onPress={logout}>
            <Text style={styles.topoUserSair}>Sair</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView style={styles.body} contentContainerStyle={{ paddingBottom: 30 }}>
        <Text style={styles.title}>Selecione o condomínio</Text>
        <Text style={styles.subtitle}>
          Você tem acesso a mais de um condomínio. Escolha qual deseja gerenciar agora.
        </Text>

        {condominios.map((condo) => (
          <TouchableOpacity 
            
            key={`${condo.id}-${condo.unidade}-${condo.papel}`} 
            style={styles.condoCard}
            onPress={() => {
              selecionarCondominioAtivo(condo);
              
              setTimeout(() => {
                navigation.navigate('Home');
              }, 100);
            }}
          >
            <View style={styles.condoIcon}><Text style={styles.iconText}>🏢</Text></View>
            <View style={styles.condoInfo}>
              <Text style={styles.condoName}>{condo.nome}</Text>
              <Text style={styles.condoAddress} numberOfLines={1}>{condo.end}</Text>
              
              
              <View style={styles.roleBadge}>
                <Text style={styles.roleText}>
                  {condo.papel} {condo.unidade ? `· ${condo.unidade}` : ''}
                </Text>
              </View>
            </View>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f3' },
  topo: { paddingTop: 40, paddingHorizontal: 24, paddingBottom: 22 },
  logoContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  mark: { width: 32, height: 32, backgroundColor: COLORS.white, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  markText: { color: '#00A859', fontFamily: 'Montserrat_700Bold', fontSize: 17 },
  logoText: { color: COLORS.white, fontFamily: 'Montserrat_700Bold', fontSize: 18 },
  topoDesc: { color: COLORS.white, fontFamily: 'Montserrat_400Regular', fontSize: 13, lineHeight: 18, opacity: 0.95 },
  topoUserContainer: { flexDirection: 'row', marginTop: 10, alignItems: 'center' },
  topoUserText: { color: COLORS.white, fontFamily: 'Montserrat_400Regular', fontSize: 11.5, opacity: 0.95 },
  topoUserSair: { color: COLORS.white, fontFamily: 'Montserrat_400Regular', fontSize: 11.5, textDecorationLine: 'underline' },
  body: { flex: 1, paddingHorizontal: 24, paddingTop: 26 },
  title: { fontFamily: 'Montserrat_700Bold', fontSize: 19, color: '#3a4a42', marginBottom: 6 },
  subtitle: { fontFamily: 'Montserrat_400Regular', fontSize: 13, color: '#6b7c73', lineHeight: 19, marginBottom: 22 },
  condoCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fcfdfc', borderWidth: 1.6, borderColor: '#d7e0da', borderRadius: 13, padding: 15, marginBottom: 12 },
  condoIcon: { width: 46, height: 46, borderRadius: 12, backgroundColor: '#e7f7ee', alignItems: 'center', justifyContent: 'center', marginRight: 13 },
  iconText: { fontSize: 22 },
  condoInfo: { flex: 1 },
  condoName: { fontFamily: 'Montserrat_700Bold', fontSize: 14.5, color: '#3a4a42', marginBottom: 2 },
  condoAddress: { fontFamily: 'Montserrat_400Regular', fontSize: 12, color: '#6b7c73' },
  roleBadge: { backgroundColor: '#00A859', alignSelf: 'flex-start', paddingVertical: 2, paddingHorizontal: 9, borderRadius: 9, marginTop: 6 },
  roleText: { color: COLORS.white, fontFamily: 'Montserrat_600SemiBold', fontSize: 10 },
  arrow: { fontSize: 24, color: '#6b7c73', marginLeft: 10 },
});
