import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types/navigation'; 
import { COLORS } from '../constants/theme';
import { formatarMoeda } from '../utils/formatters';
import { Button } from '../components/Button';

type SegundaViaRouteProp = RouteProp<RootStackParamList, 'SegundaViaJuros'>;

export function SegundaViaJurosScreen() {
  const [opcaoEntrega, setOpcaoEntrega] = useState<'email' | 'pdf' | 'copiar'>('email');
  const route = useRoute<SegundaViaRouteProp>();
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
  const multa = valorOriginal * 0.02;
  const juros = valorOriginal * 0.01 * (diasAtraso / 30);
  const valorAtualizado = valorOriginal + multa + juros;

  const gerarSegundaVia = () => {
    const canal = {
      email: 'enviada para o e-mail cadastrado',
      pdf: 'preparada para download em PDF',
      copiar: 'copiada para a área de transferência',
    }[opcaoEntrega];

    Alert.alert('2ª via gerada', `A 2ª via atualizada foi ${canal}.`);
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.pageSub}>Boleto vencido há mais de 30 dias - valor atualizado com juros e multa</Text>

        <View style={styles.panel}>
          <View style={styles.panelHead}>
            <Text style={styles.panelTitle}>Dados do boleto</Text>
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
              <Text style={styles.label}>Juros ({diasAtraso} dias - 1% a.m.)</Text>
              <Text style={[styles.val, { color: COLORS.red }]}>+ {formatarMoeda(juros)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Multa (2%)</Text>
              <Text style={[styles.val, { color: COLORS.red }]}>+ {formatarMoeda(multa)}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.rowTotal}>
              <Text style={styles.totalLabel}>Valor atualizado</Text>
              <Text style={styles.totalVal}>{formatarMoeda(valorAtualizado)}</Text>
            </View>
            <Text style={styles.note}>Calculado para hoje. Novo vencimento pode sofrer alteração bancária.</Text>
          </View>
        </View>

        <View style={styles.panel}>
          <View style={styles.panelHead}>
            <Text style={styles.panelTitle}>Forma de entrega</Text>
          </View>
          <View style={styles.panelBody}>
            <View style={styles.radioGroup}>
              <TouchableOpacity style={styles.radioOption} onPress={() => setOpcaoEntrega('email')} activeOpacity={0.7}>
                <View style={[styles.radioCircle, opcaoEntrega === 'email' && styles.radioCircleActive]}>
                  {opcaoEntrega === 'email' && <View style={styles.radioDot} />}
                </View>
                <Text style={styles.radioText}>E-mail cadastrado</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.radioOption} onPress={() => setOpcaoEntrega('pdf')} activeOpacity={0.7}>
                <View style={[styles.radioCircle, opcaoEntrega === 'pdf' && styles.radioCircleActive]}>
                  {opcaoEntrega === 'pdf' && <View style={styles.radioDot} />}
                </View>
                <Text style={styles.radioText}>Download direto (PDF)</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.radioOption} onPress={() => setOpcaoEntrega('copiar')} activeOpacity={0.7}>
                <View style={[styles.radioCircle, opcaoEntrega === 'copiar' && styles.radioCircleActive]}>
                  {opcaoEntrega === 'copiar' && <View style={styles.radioDot} />}
                </View>
                <Text style={styles.radioText}>Copiar código de barras</Text>
              </TouchableOpacity>
            </View>

            <Button title="Gerar 2ª via atualizada" icon="refresh-cw" onPress={gerarSegundaVia} />
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
  panel: { backgroundColor: COLORS.white, borderRadius: 12, borderWidth: 1, borderColor: COLORS.grayBorder, overflow: 'hidden', marginBottom: 14 },
  panelHead: { padding: 14, borderBottomWidth: 1, borderBottomColor: COLORS.grayBorder },
  panelTitle: { fontFamily: 'Montserrat_700Bold', fontSize: 13, color: COLORS.textDark },
  panelBody: { padding: 14 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.grayBg },
  label: { fontFamily: 'Montserrat_400Regular', fontSize: 12.5, color: COLORS.textDark, flex: 1, marginRight: 10 },
  val: { fontFamily: 'Montserrat_500Medium', fontSize: 12.5, color: COLORS.textDark, textAlign: 'right' },
  divider: { height: 1, backgroundColor: COLORS.grayBorder, marginVertical: 10 },
  rowTotal: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 4 },
  totalLabel: { fontFamily: 'Montserrat_700Bold', fontSize: 13, color: COLORS.textDark },
  totalVal: { fontFamily: 'Montserrat_700Bold', fontSize: 16, color: COLORS.greenMain },
  note: { fontFamily: 'Montserrat_400Regular', fontSize: 10.5, color: COLORS.textMuted, marginTop: 10 },
  radioGroup: { gap: 12, marginBottom: 18 },
  radioOption: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  radioCircle: { width: 18, height: 18, borderRadius: 9, borderWidth: 1.5, borderColor: COLORS.grayBorder, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.white },
  radioCircleActive: { borderColor: COLORS.greenMain },
  radioDot: { width: 9, height: 9, borderRadius: 4.5, backgroundColor: COLORS.greenMain },
  radioText: { fontFamily: 'Montserrat_500Medium', fontSize: 12.5, color: COLORS.textDark },
});