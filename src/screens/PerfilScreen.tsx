
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { normalizarPapel, perfilAdministrativo } from '../config/modules';
import { formatarMoeda, formatarCpfMascarado } from '../utils/formatters';

export function PerfilScreen() {
  const navigation = useNavigation<any>();
  
  const { logout, nomeUsuario, condominioAtivo, cpf, condominios } = useAuth();

  const papelAtual = normalizarPapel(condominioAtivo?.papel || 'Morador');
  const nome = nomeUsuario || 'Usuário';
  
  const iniciais = nome
    .split(' ')
    .filter(Boolean)
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const vePainelFinanceiro = perfilAdministrativo(papelAtual);

  const valorContaCorrente = condominioAtivo?.contaCorrente || 0;
  const valorInvestimentos = condominioAtivo?.investimentos || 0;
  const valorInadimplencia = condominioAtivo?.inadimplencia || 0;

  const saldoTotal = valorContaCorrente + valorInvestimentos;

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Text style={styles.pageSub}>Dados da conta unificada Auxiliadora Digital</Text>

        <View style={styles.panel}>
          
          <View style={styles.perfilTop}>
            <View style={styles.avatar}>
              <Text style={styles.avatarTxt}>{iniciais}</Text>
            </View>
            <Text style={styles.userName}>{nome}</Text>
            
            <Text style={styles.userCpf}>{formatarCpfMascarado(cpf)}</Text>
            
            
            <View style={styles.badgeRow}>
              <View style={styles.badgeAprovado}>
                <Text style={styles.badgeAprovadoText}>{papelAtual}</Text>
              </View>
              {condominioAtivo?.unidade && (
                <View style={styles.badgeUnidade}>
                  <Text style={styles.badgeUnidadeText}>{condominioAtivo.unidade}</Text>
                </View>
              )}
            </View>
            
            <Text style={styles.userCondo}>{condominioAtivo?.nome}</Text>
          </View>

          {vePainelFinanceiro && (
            <View style={styles.perfilBottom}>
              <View style={styles.saldoHeader}>
                <Feather name="briefcase" size={13} color={COLORS.greenMain} />
                
                <Text style={styles.saldoHeaderText}>SALDO DO CONDOMÍNIO — JULHO/2026</Text>
              </View>

              <View style={styles.saldoRow}>
                <View style={styles.saldoRowLeft}>
                  <Feather name="credit-card" size={14} color={COLORS.greenMain} />
                  <Text style={styles.saldoRowLabel}>Conta corrente</Text>
                </View>
                <Text style={styles.saldoRowValue}>{formatarMoeda(valorContaCorrente)}</Text> 
              </View>

              <View style={styles.saldoRow}>
                <View style={styles.saldoRowLeft}>
                  <Feather name="database" size={14} color={COLORS.greenMain} />
                  <Text style={styles.saldoRowLabel}>Investimentos</Text>
                </View>
                <Text style={styles.saldoRowValue}>{formatarMoeda(valorInvestimentos)}</Text>
              </View>

              <View style={styles.saldoRow}>
                <View style={styles.saldoRowLeft}>
                  <Feather name="alert-triangle" size={14} color={COLORS.orange} />
                  <Text style={styles.saldoRowLabel}>Inadimplência</Text>
                </View>
                <Text style={[styles.saldoRowValue, { color: '#c62828' }]}>{formatarMoeda(valorInadimplencia)}</Text>
              </View>

              <View style={[styles.saldoRow, { paddingTop: 10, borderBottomWidth: 0 }]}>
                <Text style={styles.saldoRowTotalLabel}>Saldo total</Text>
                <Text style={styles.saldoRowTotalValue}>{formatarMoeda(saldoTotal)}</Text>
              </View>

              <TouchableOpacity style={styles.btnOutline} onPress={() => navigation.navigate('DashboardTab')}>
                <Feather name="pie-chart" size={14} color={COLORS.greenMain} />
                <Text style={styles.btnOutlineText}>Ver dashboard completo</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.listLinks}>
          <TouchableOpacity 
            style={styles.listLink} 
            onPress={() => Alert.alert('Dados Pessoais', 'A alteração de dados cadastrais está disponível através do portal web completo.')}
          >
            <View style={styles.lic}><Feather name="edit" size={16} color={COLORS.greenMain} /></View>
            <Text style={styles.ltxt}>Dados pessoais</Text>
            <Feather name="chevron-right" size={16} color={COLORS.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.listLink} 
            onPress={() => Alert.alert('Alterar Senha', 'Enviamos um link com as instruções para redefinição de senha segura para o seu e-mail cadastrado.')}
          >
            <View style={styles.lic}><Feather name="lock" size={16} color={COLORS.greenMain} /></View>
            <Text style={styles.ltxt}>Alterar senha</Text>
            <Feather name="chevron-right" size={16} color={COLORS.textMuted} />
          </TouchableOpacity>

          {condominios.length > 1 && (
            <TouchableOpacity style={styles.listLink} onPress={() => navigation.navigate('CondoSelection')}>
              <View style={styles.lic}><Feather name="refresh-cw" size={16} color={COLORS.greenMain} /></View>
              <Text style={styles.ltxt}>Trocar condomínio</Text>
              <Feather name="chevron-right" size={16} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}

          <TouchableOpacity style={[styles.listLink, { borderBottomWidth: 0 }]} onPress={logout}>
            <View style={[styles.lic, { backgroundColor: '#ffebee' }]}>
              <Feather name="log-out" size={16} color="#c62828" />
            </View>
            <Text style={[styles.ltxt, { color: '#c62828' }]}>Sair da conta</Text>
            <Feather name="chevron-right" size={16} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.grayBg },
  content: { paddingHorizontal: 14, paddingBottom: 40, paddingTop: 14 },
  pageSub: { fontFamily: 'Montserrat_400Regular', fontSize: 11, color: COLORS.textMuted, marginBottom: 14, lineHeight: 16 },
  panel: { backgroundColor: COLORS.white, borderRadius: 12, borderWidth: 1, borderColor: COLORS.grayBorder, overflow: 'hidden', marginBottom: 18 },
  perfilTop: { paddingVertical: 20, paddingHorizontal: 16, alignItems: 'center', gap: 6 },
  avatar: { width: 70, height: 70, borderRadius: 35, backgroundColor: COLORS.greenMain, alignItems: 'center', justifyContent: 'center' },
  avatarTxt: { color: COLORS.white, fontFamily: 'Montserrat_700Bold', fontSize: 24 },
  userName: { fontFamily: 'Montserrat_700Bold', fontSize: 16, color: COLORS.textDark, marginTop: 4 },
  userCpf: { fontFamily: 'Montserrat_400Regular', fontSize: 12, color: COLORS.textMuted },
  badgeRow: { flexDirection: 'row', gap: 6, marginTop: 2, alignItems: 'center' },
  badgeAprovado: { backgroundColor: '#e8f5e9', paddingVertical: 3, paddingHorizontal: 9, borderRadius: 12 },
  badgeAprovadoText: { color: '#2e7d32', fontFamily: 'Montserrat_700Bold', fontSize: 10 },
  badgeUnidade: { backgroundColor: '#e3f2fd', paddingVertical: 3, paddingHorizontal: 9, borderRadius: 12 },
  badgeUnidadeText: { color: '#1565c0', fontFamily: 'Montserrat_700Bold', fontSize: 10 },
  userCondo: { fontFamily: 'Montserrat_400Regular', fontSize: 11, color: COLORS.textMuted, textAlign: 'center' },
  perfilBottom: { borderTopWidth: 1, borderTopColor: COLORS.grayBorder, padding: 14 },
  saldoHeader: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 10 },
  saldoHeaderText: { fontFamily: 'Montserrat_700Bold', fontSize: 10, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  saldoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.grayBorder },
  saldoRowLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  saldoRowLabel: { fontFamily: 'Montserrat_400Regular', fontSize: 12.5, color: COLORS.textDark },
  saldoRowValue: { fontFamily: 'Montserrat_700Bold', fontSize: 12.5, color: COLORS.textDark },
  saldoRowTotalLabel: { fontFamily: 'Montserrat_700Bold', fontSize: 13, color: COLORS.textDark },
  saldoRowTotalValue: { fontFamily: 'Montserrat_700Bold', fontSize: 15, color: COLORS.greenMain },
  btnOutline: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 9, borderRadius: 7, borderWidth: 1, borderColor: COLORS.greenMain, gap: 6, marginTop: 12, width: '100%' },
  btnOutlineText: { color: COLORS.greenMain, fontFamily: 'Montserrat_600SemiBold', fontSize: 10 },
  listLinks: { backgroundColor: COLORS.white, borderRadius: 12, borderWidth: 1, borderColor: COLORS.grayBorder, overflow: 'hidden' },
  listLink: { flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: COLORS.grayBorder },
  lic: { width: 34, height: 34, borderRadius: 9, backgroundColor: COLORS.greenBg, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  ltxt: { flex: 1, fontFamily: 'Montserrat_600SemiBold', fontSize: 13, color: COLORS.textDark }
});
