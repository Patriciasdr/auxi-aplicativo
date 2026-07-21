
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '../constants/theme';
import { useAuth } from '../context/AuthContext';

export interface BoletoProps {
  id?: string;
  unidade: string;
  vencto: string; 
  valor: number;
  status: 'pendente' | 'pago' | 'vencido' | 'a_vencer';
  dias?: number; 
}

export function BoletoCard({ data }: { data: BoletoProps }) {
  const navigation = useNavigation<any>();
  const { condominioAtivo } = useAuth();
  const diasJuridico = condominioAtivo?.diasJuridico;
  const regraConfigurada = diasJuridico != null;
  const valorFormatado = `R$ ${data.valor.toFixed(2).replace('.', ',')}`;

  const calcularDiasTempoReal = (dataString: string) => {
    let ano, mes, dia;
    
    if (dataString.includes('-')) {
      [ano, mes, dia] = dataString.split('-');
    } else {
      [dia, mes, ano] = dataString.split('/');
    }

    const dataVencimento = new Date(Number(ano), Number(mes) - 1, Number(dia));
    const dataHoje = new Date(); 

    dataVencimento.setHours(0, 0, 0, 0);
    dataHoje.setHours(0, 0, 0, 0);

    const diferencaTempo = dataHoje.getTime() - dataVencimento.getTime();
    return Math.floor(diferencaTempo / (1000 * 3600 * 24)); 
  };

  const diasReais = calcularDiasTempoReal(data.vencto);
  const diasNum = Math.abs(diasReais);

  let badgeBg = '#fff3e0';
  let badgeText = '#e65100';
  let badgeLabel = 'Pendente';
  let cardBg = COLORS.white;
  let diasLabel = '';
  let diasColor = '#888';

  // O status é recebido do ERP. A data não altera a situação de pagamento.
  const isVencido = data.status === 'vencido';
  const isAVencer = data.status === 'a_vencer' || data.status === 'pendente';

  if (data.status === 'pago') {
    badgeBg = '#e8f5e9'; 
    badgeText = '#2e7d32'; 
    badgeLabel = 'Pago';
    diasLabel = 'Pago';
  } else if (isVencido) { 
    badgeBg = '#ffebee'; 
    badgeText = '#c62828'; 
    badgeLabel = 'Vencido';
    diasLabel = `${diasNum} dias em atraso`;
    diasColor = '#c62828';
    
    if (diasJuridico != null && diasNum >= diasJuridico) {
      cardBg = '#fff5f5';
    } else if (diasJuridico != null) {
      diasColor = '#e65100'; 
      cardBg = '#fff8f0';
    }
  } else { 
    badgeBg = '#e3f2fd'; 
    badgeText = '#1565c0'; 
    badgeLabel = 'A vencer';
    diasLabel = diasReais === 0 ? 'Vence hoje' : `Vence em ${diasNum} dias`;
    diasColor = COLORS.greenMain;
  }

  const boletoEnriquecido = { ...data, dias: diasNum };

  const dataExibicao = data.vencto.includes('-') 
    ? data.vencto.split('-').reverse().join('/') 
    : data.vencto;

  return (
    <View style={[styles.card, { backgroundColor: cardBg }]}>
      <View style={styles.topRow}>
        <View>
          <Text style={styles.unidade}>Unidade {data.unidade}</Text>
          <Text style={styles.meta}>Venc. {dataExibicao}</Text> 
        </View>
        <View style={styles.topRight}>
          <Text style={styles.valor}>{valorFormatado}</Text>
          <View style={[styles.badge, { backgroundColor: badgeBg }]}>
            <Text style={[styles.badgeText, { color: badgeText }]}>{badgeLabel}</Text>
          </View>
        </View>
      </View>

      <Text style={[styles.diasTexto, { color: diasColor }]}>{diasLabel}</Text>

      <View style={styles.actions}>
        
        {data.status === 'pago' && (
          <>
            <TouchableOpacity style={styles.btnOutline}>
              <Feather name="eye" size={14} color={COLORS.greenMain} />
              <Text style={styles.btnOutlineText}>Ver</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnOutline}>
              <Feather name="download" size={14} color={COLORS.greenMain} />
              <Text style={styles.btnOutlineText}>Baixar recibo</Text>
            </TouchableOpacity>
          </>
        )}

        {isAVencer && (
          <>
            <TouchableOpacity style={styles.btnOutline}>
              <Feather name="eye" size={14} color={COLORS.greenMain} />
              <Text style={styles.btnOutlineText}>Ver</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnOutline}>
              <Feather name="copy" size={14} color={COLORS.greenMain} />
              <Text style={styles.btnOutlineText}>Copiar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnGreen}>
              <Feather name="mail" size={14} color={COLORS.white} />
              <Text style={styles.btnGreenText}>Enviar</Text>
            </TouchableOpacity>
          </>
        )}

        {isVencido && regraConfigurada && diasNum < diasJuridico && (
          <>
            <TouchableOpacity style={styles.btnOutline}>
              <Feather name="eye" size={14} color={COLORS.greenMain} />
              <Text style={styles.btnOutlineText}>Ver</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnOrange} onPress={() => navigation.navigate('SegundaViaJuros', { boleto: boletoEnriquecido })}>
              <Feather name="refresh-cw" size={14} color={COLORS.white} />
              <Text style={styles.btnOrangeText}>2ª via c/ juros</Text>
            </TouchableOpacity>
          </>
        )}

        {isVencido && regraConfigurada && diasNum >= diasJuridico && (
          <TouchableOpacity style={styles.btnDanger} onPress={() => navigation.navigate('Juridico', { boleto: boletoEnriquecido })}>
            <Feather name="alert-triangle" size={14} color="#c62828" />
            <Text style={styles.btnDangerText}>Contato jurídico</Text>
          </TouchableOpacity>
        )}

        {isVencido && !regraConfigurada && (
          <Text style={styles.regraIndisponivel}>Regra de cobrança indisponível para este condomínio.</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderColor: COLORS.grayBorder, borderRadius: 12, padding: 14, marginBottom: 10 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  topRight: { alignItems: 'flex-end' },
  unidade: { fontFamily: 'Montserrat_700Bold', fontSize: 14, color: COLORS.textDark },
  meta: { fontFamily: 'Montserrat_400Regular', fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  valor: { fontFamily: 'Montserrat_700Bold', fontSize: 15, color: COLORS.greenMain },
  badge: { paddingVertical: 3, paddingHorizontal: 9, borderRadius: 12, marginTop: 4 },
  badgeText: { fontFamily: 'Montserrat_700Bold', fontSize: 10 },
  diasTexto: { fontFamily: 'Montserrat_700Bold', fontSize: 11, marginBottom: 10 },
  actions: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  btnOutline: { flexDirection: 'row', alignItems: 'center', paddingVertical: 7, paddingHorizontal: 12, borderRadius: 7, borderWidth: 1, borderColor: COLORS.greenMain, gap: 4 },
  btnOutlineText: { color: COLORS.greenMain, fontFamily: 'Montserrat_600SemiBold', fontSize: 11 },
  btnGreen: { flexDirection: 'row', alignItems: 'center', paddingVertical: 7, paddingHorizontal: 12, borderRadius: 7, backgroundColor: COLORS.greenMain, gap: 4 },
  btnGreenText: { color: COLORS.white, fontFamily: 'Montserrat_600SemiBold', fontSize: 11 },
  btnOrange: { flexDirection: 'row', alignItems: 'center', paddingVertical: 7, paddingHorizontal: 12, borderRadius: 7, backgroundColor: COLORS.orange, borderColor: COLORS.orange, borderWidth: 1, gap: 4 },
  btnOrangeText: { color: COLORS.white, fontFamily: 'Montserrat_600SemiBold', fontSize: 11 },
  btnDanger: { flexDirection: 'row', alignItems: 'center', paddingVertical: 7, paddingHorizontal: 12, borderRadius: 7, backgroundColor: '#ffebee', borderColor: '#ffcdd2', borderWidth: 1, gap: 4 },
  btnDangerText: { color: '#c62828', fontFamily: 'Montserrat_600SemiBold', fontSize: 11 },
  regraIndisponivel: { color: COLORS.textMuted, fontFamily: 'Montserrat_500Medium', fontSize: 11 }
});
