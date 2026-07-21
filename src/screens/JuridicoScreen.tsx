import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types/navigation'; 
import { Feather } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';
import { formatarMoeda } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';

type JuridicoRouteProp = RouteProp<RootStackParamList, 'Juridico'>;

export function JuridicoScreen() {
  const { condominioAtivo } = useAuth();

  const route = useRoute<JuridicoRouteProp>();
  
  const boletoClicado = route.params?.boleto;
  
  if (!boletoClicado) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: COLORS.textMuted }}>Erro: Boleto não encontrado.</Text>
      </View>
    );
  }

  const unidade = boletoClicado.unidade;
  const vencimentoOriginal = boletoClicado.vencto;
  const valorOriginal = boletoClicado.valor;
  const diasAtraso = Math.abs(boletoClicado.dias || 0);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        <Text style={styles.pageSub}>Unidade {unidade} — Vencimento: {vencimentoOriginal} ({diasAtraso} dias em atraso)</Text>

        <View style={styles.alertBox}>
          <Feather name="alert-circle" size={22} color="#e65100" style={styles.alertIcon} />
          <View style={styles.alertRightContent}>
            <Text style={styles.alertTitle}>Este débito atingiu o prazo para cobrança jurídica</Text>
            <Text style={styles.alertText}>
              Conforme a regra deste condomínio, boletos com {condominioAtivo?.diasJuridico} dias ou mais de atraso não podem ser emitidos diretamente pelo aplicativo.
              Entre em contato com o setor jurídico para regularizar sua situação.
            </Text>
            
            <View style={styles.chipsContainer}>
              <View style={styles.chip}>
                <Feather name="phone" size={11} color="#e65100" />
                <Text style={styles.chipText}>(51) 3232-0001</Text>
              </View>
              <View style={styles.chip}>
                <Feather name="mail" size={11} color="#e65100" />
                <Text style={styles.chipText}>juridico@auxiliadorapredial.com.br</Text>
              </View>
              <View style={styles.chip}>
                <Feather name="clock" size={11} color="#e65100" />
                <Text style={styles.chipText}>Seg–Sex, 9h às 18h</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.panel}>
          <View style={styles.panelHead}>
            <Text style={styles.panelTitle}>Resumo do débito</Text>
          </View>
          <View style={styles.panelBody}>
            <View style={styles.row}>
              <Text style={styles.label}>Unidade</Text>
              <Text style={styles.val}>{unidade}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Vencimento original</Text>
              <Text style={styles.val}>{vencimentoOriginal}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Valor original</Text>
              <Text style={styles.val}>{formatarMoeda(valorOriginal)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Dias em atraso</Text>
              <Text style={[styles.val, { color: COLORS.red, fontFamily: 'Montserrat_700Bold' }]}>{diasAtraso} dias</Text>
            </View>
            <View style={[styles.row, { borderBottomWidth: 0 }]}>
              <Text style={styles.label}>Situação</Text>
              <Text style={[styles.val, { color: COLORS.red, fontFamily: 'Montserrat_700Bold' }]}>Encaminhado ao jurídico</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.grayBg },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 14, paddingBottom: 40, paddingTop: 14 },
  pageSub: { fontFamily: 'Montserrat_400Regular', fontSize: 11, color: COLORS.textMuted, marginBottom: 14, lineHeight: 16 },
  alertBox: { flexDirection: 'row', backgroundColor: '#fff3e0', borderWidth: 1, borderColor: '#ffcc80', borderRadius: 10, padding: 14, marginBottom: 14, gap: 12 },
  alertIcon: { marginTop: 1 },
  alertRightContent: { flex: 1 },
  alertTitle: { fontFamily: 'Montserrat_700Bold', fontSize: 12.5, color: '#bf360c', marginBottom: 4 },
  alertText: { fontFamily: 'Montserrat_400Regular', fontSize: 11.5, color: '#6d4c41', lineHeight: 16 },
  chipsContainer: { gap: 6, marginTop: 10 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.white, borderWidth: 1, borderColor: '#ffcc80', borderRadius: 7, paddingVertical: 6, paddingHorizontal: 10, alignSelf: 'flex-start' },
  chipText: { fontFamily: 'Montserrat_600SemiBold', fontSize: 11, color: '#e65100' },
  panel: { backgroundColor: COLORS.white, borderRadius: 12, borderWidth: 1, borderColor: COLORS.grayBorder, overflow: 'hidden' },
  panelHead: { padding: 14, borderBottomWidth: 1, borderBottomColor: COLORS.grayBorder },
  panelTitle: { fontFamily: 'Montserrat_700Bold', fontSize: 13, color: COLORS.textDark },
  panelBody: { padding: 14 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.grayBg },
  label: { fontFamily: 'Montserrat_400Regular', fontSize: 12.5, color: COLORS.textDark },
  val: { fontFamily: 'Montserrat_500Medium', fontSize: 12.5, color: COLORS.textDark }
});
