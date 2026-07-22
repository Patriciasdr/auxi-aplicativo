import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '../constants/theme';
import { obterModulosPermitidos, normalizarPapel, perfilAdministrativo } from '../config/modules';
import { formatarMoeda } from '../utils/formatters';
import { AppNavigatorRoutesProps } from '../navigation/types/navigation'; 
import { useAuth } from '../context/AuthContext';


export function HomeScreen() {
  const navigation = useNavigation<AppNavigatorRoutesProps>(); 
  const { nomeUsuario, condominioAtivo } = useAuth(); 

  const papelAtual = normalizarPapel(condominioAtivo?.papel || 'Morador');
  const modulosPermitidos = obterModulosPermitidos(papelAtual);

  const meusServicos = modulosPermitidos.filter(m => !m.stub).slice(0, 4);
  const acessoRapido = modulosPermitidos.filter(m => !meusServicos.includes(m));
  const vePainelFinanceiro = perfilAdministrativo(papelAtual);

  const valorContaCorrente = condominioAtivo?.contaCorrente || 0;
  const valorInvestimentos = condominioAtivo?.investimentos || 0;
  const saldoTotal = valorContaCorrente + valorInvestimentos;

  const hoje = new Date();
  const mesesOpcoes = ['JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO', 'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'];
  const textoMesAnoReal = `SALDO DO CONDOMÍNIO — ${mesesOpcoes[hoje.getMonth()]}/${hoje.getFullYear()}`;

  const acionarModulo = (mod: any) => {
    if (mod.route) {
      navigation.navigate(mod.route as any); 
    } else {
      Alert.alert('Funcionalidade planejada', `O módulo "${mod.nome}" faz parte do roadmap e ainda não está disponível nesta versão.`);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 80 }}>
        
        
        <LinearGradient colors={['#008542', '#006835']} style={styles.homeHero}>
          <Text style={styles.greet}>Bem-vindo de volta,</Text>
          <Text style={styles.name}>{nomeUsuario}</Text>
          <Text style={styles.heroRole}>
            <Feather name="shield" size={11} color="#fff" /> {condominioAtivo?.nome || 'Condomínio não identificado'} · {papelAtual}
          </Text>

          {vePainelFinanceiro && (
            <View style={styles.heroSaldo}>
              <Text style={styles.heroSaldoLabel}>
                <Feather name="briefcase" size={12} color={COLORS.greenMain} /> 
                {' '}{textoMesAnoReal} 
              </Text>
              <Text style={styles.heroSaldoTotal}>{formatarMoeda(saldoTotal)}</Text>
            </View>
          )}
        </LinearGradient>

        
        <Text style={styles.sectionTitle}>Meus serviços</Text>
        {meusServicos.length > 0 ? (
          <View style={styles.quickGrid}>
            {meusServicos.map(mod => (
              <TouchableOpacity key={mod.key} style={styles.quickCard} onPress={() => acionarModulo(mod)} activeOpacity={0.7}>
                <View style={styles.qic}><Feather name={mod.ic as any} size={20} color={COLORS.greenMain} /></View>
                <Text style={styles.qtitle}>{mod.nome}</Text>
                <Text style={styles.qsub}>{mod.desc}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <Text style={styles.emptyState}>Nenhum serviço principal disponível para este perfil.</Text>
        )}

        
        <Text style={styles.sectionTitle}>Acesso rápido</Text>
        {acessoRapido.length > 0 ? (
          <View style={styles.listLinks}>
            {acessoRapido.map((mod, index) => (
              <TouchableOpacity key={mod.key} style={[styles.listLink, index === acessoRapido.length - 1 && { borderBottomWidth: 0 }]} onPress={() => acionarModulo(mod)} activeOpacity={0.7}>
                <View style={styles.lic}><Feather name={mod.ic as any} size={16} color={COLORS.greenMain} /></View>
                <Text style={styles.ltxt}>{mod.nome}</Text>
                <Feather name="chevron-right" size={16} color={COLORS.textMuted} />
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <Text style={styles.emptyState}>Sem itens adicionais.</Text>
        )}

        <Text style={styles.footerNote}>
          © Auxiliadora Predial Ltda. Todos os direitos reservados.{"\n"}CRECI RS - J43 | CRECI SP - J21663
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.grayBg },
  content: { flex: 1, padding: 14 },
  homeHero: { borderRadius: 14, padding: 18, marginBottom: 18 },
  greet: { color: COLORS.white, fontFamily: 'Montserrat_400Regular', fontSize: 12, opacity: 0.9 },
  name: { color: COLORS.white, fontFamily: 'Montserrat_700Bold', fontSize: 18, marginTop: 2 },
  heroRole: { color: COLORS.white, fontFamily: 'Montserrat_400Regular', fontSize: 11, opacity: 0.9, marginTop: 8 },
  heroSaldo: { backgroundColor: COLORS.white, borderRadius: 12, padding: 15, marginTop: 14 },
  heroSaldoLabel: { fontFamily: 'Montserrat_700Bold', fontSize: 10, color: COLORS.textMuted },
  heroSaldoTotal: { fontFamily: 'Montserrat_700Bold', fontSize: 24, color: COLORS.greenMain, marginTop: 6, letterSpacing: -0.5 },
  sectionTitle: { fontFamily: 'Montserrat_700Bold', fontSize: 13, color: COLORS.textDark, marginBottom: 12, marginTop: 20 },
  quickGrid: { flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap' },
  quickCard: { backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.grayBorder, borderRadius: 12, padding: 15, width: '48%', gap: 8, marginBottom: 12 },
  qic: { width: 40, height: 40, borderRadius: 11, backgroundColor: COLORS.greenBg, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  qtitle: { fontFamily: 'Montserrat_700Bold', fontSize: 12.5, color: COLORS.textDark, lineHeight: 18 },
  qsub: { fontFamily: 'Montserrat_400Regular', fontSize: 10.5, color: COLORS.textMuted },
  listLinks: { backgroundColor: COLORS.white, borderRadius: 12, borderWidth: 1, borderColor: COLORS.grayBorder, overflow: 'hidden' },
  listLink: { flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: COLORS.grayBorder },
  lic: { width: 34, height: 34, borderRadius: 9, backgroundColor: COLORS.greenBg, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  ltxt: { flex: 1, fontFamily: 'Montserrat_600SemiBold', fontSize: 13, color: COLORS.textDark },
  emptyState: { fontFamily: 'Montserrat_400Regular', fontSize: 12.5, color: COLORS.textMuted, paddingVertical: 10, textAlign: 'center' },
  footerNote: { textAlign: 'center', fontFamily: 'Montserrat_400Regular', fontSize: 9, color: COLORS.textMuted, marginTop: 24, lineHeight: 14 }
});
