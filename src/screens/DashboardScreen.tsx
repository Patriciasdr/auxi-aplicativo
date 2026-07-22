import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import { COLORS } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { normalizarPapel, perfilAdministrativo } from '../config/modules'; 
import { formatarMoeda } from '../utils/formatters';
import { buscarDashboard, VencimentoItem } from '../services/api'; 

const CHART_HEIGHT = 160; 
const screenWidth = Dimensions.get('window').width;

export function DashboardScreen() {
  const { condominioAtivo } = useAuth();
  
  const papelAtual = normalizarPapel(condominioAtivo?.papel || 'Morador');
  const podeVerDashboard = perfilAdministrativo(papelAtual);

  const [vencimentos, setVencimentos] = useState<VencimentoItem[]>([]);
  const [graficoBarras, setGraficoBarras] = useState<{ previsto: number[]; realizado: number[] }>({ previsto: [], realizado: [] });
  const [graficoLinha, setGraficoLinha] = useState<{ receita: number[]; despesa: number[] }>({ receita: [0], despesa: [0] });
  
  const [labelsMeses, setLabelsMeses] = useState<string[]>(['', '', '', '', '', '']);
  const [carregando, setCarregando] = useState(true);
  
  const valorContaCorrente = condominioAtivo?.contaCorrente || 0;
  const valorInvestimentos = condominioAtivo?.investimentos || 0;
  const valorInadimplencia = condominioAtivo?.inadimplencia || 0;

  const hoje = new Date();
  const mesesNomes = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
  const mesAtual = mesesNomes[hoje.getMonth()];
  const anoAtual = hoje.getFullYear();

  useEffect(() => {
    async function carregarDadosDashboard() {
      if (condominioAtivo?.id && podeVerDashboard) {
        setCarregando(true);
        try {
          const dados = await buscarDashboard(condominioAtivo.id);
          setVencimentos(dados.vencimentos);
          setGraficoBarras(dados.graficoBarras);
          setGraficoLinha(dados.graficoLinha);
          setLabelsMeses(dados.labelsMeses); 
        } catch (error) {
          console.error("Erro ao carregar dados do dashboard:", error);
        } finally {
          setCarregando(false);
        }
      }
    }
    carregarDadosDashboard();
  }, [condominioAtivo, podeVerDashboard]);

  
  const maxValueRaw = Math.max(...(graficoBarras.previsto || []), ...(graficoBarras.realizado || []), 1);
  
  const maxBarValue = Math.ceil(maxValueRaw / 10000) * 10000; 

  
  const yAxisSteps = [maxBarValue, maxBarValue * 0.75, maxBarValue * 0.5, maxBarValue * 0.25, 0];

  if (!podeVerDashboard) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 24 }]}>
        <Feather name="lock" size={28} color={COLORS.textMuted} />
        <Text style={styles.emptyText}>Dashboard financeiro disponível apenas para perfis administrativos.</Text>
      </View>
    );
  }

  if (carregando) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.greenMain} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        <Text style={styles.pageSub}>{mesAtual}/{anoAtual} — {condominioAtivo?.nome || 'Condomínio não identificado'}</Text>

        <View style={styles.cardsTop}>
          <LinearGradient colors={['#43a047', '#1b5e20']} style={styles.gradCard}>
            <View style={styles.gradCardLeft}>
              <Text style={styles.gradCardLabel}>Saldo em Conta Corrente (Principal)</Text>
              <Text style={styles.gradCardValue}>{formatarMoeda(valorContaCorrente)}</Text>
              <Text style={styles.gradCardSub}>Atualizado em tempo real</Text>
            </View>
            <Feather name="credit-card" size={40} color="rgba(255,255,255,0.25)" />
          </LinearGradient>
          <LinearGradient colors={['#66bb6a', '#2e7d32']} style={styles.gradCard}>
            <View style={styles.gradCardLeft}>
              <Text style={styles.gradCardLabel}>Saldo em Investimentos (Total)</Text>
              <Text style={styles.gradCardValue}>{formatarMoeda(valorInvestimentos)}</Text>
              <Text style={styles.gradCardSub}>Atualizado em tempo real</Text>
            </View>
            <Feather name="database" size={40} color="rgba(255,255,255,0.25)" />
          </LinearGradient>
          <LinearGradient colors={['#a5d6a7', '#388e3c']} style={styles.gradCard}>
            <View style={styles.gradCardLeft}>
              <Text style={styles.gradCardLabel}>Valor Total de Inadimplência</Text>
              <Text style={styles.gradCardValue}>{formatarMoeda(valorInadimplencia)}</Text>
              <Text style={styles.gradCardSub}>Atualizado em tempo real</Text>
            </View>
            <Feather name="alert-triangle" size={40} color="rgba(255,255,255,0.25)" />
          </LinearGradient>
        </View>

        
        <View style={styles.panel}>
          <View style={styles.panelHead}>
            <Text style={styles.panelTitle}>Receita x Despesa</Text>
            <Text style={styles.panelSub}>* Últimos 6 meses fechados</Text>
          </View>
          
          <View style={{ alignItems: 'center', paddingTop: 10 }}>
            <LineChart
              data={{
                labels: labelsMeses, 
                datasets: [
                  {
                    data: graficoLinha.despesa,
                    color: () => `rgba(124, 77, 255, 0.9)`, 
                    strokeWidth: 2
                  },
                  {
                    data: graficoLinha.receita,
                    color: () => `rgba(0, 133, 66, 0.9)`, 
                    strokeWidth: 2
                  }
                ]
              }}
              width={screenWidth - 28} 
              height={160}
              withDots={false} 
              withInnerLines={false} 
              withOuterLines={false}
              withHorizontalLabels={false} 
              withShadow={true} 
              chartConfig={{
                backgroundColor: '#ffffff',
                backgroundGradientFrom: '#ffffff',
                backgroundGradientTo: '#ffffff',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(0, 133, 66, ${opacity})`, 
                labelColor: () => `#aaaaaa`, 
                style: { borderRadius: 16 },
                fillShadowGradientFromOpacity: 0.5, 
                fillShadowGradientToOpacity: 0.1,
                propsForBackgroundLines: { stroke: 'transparent' }
              }}
              bezier 
              style={{ marginVertical: 8, paddingRight: 20 }}
            />
          </View>

          <View style={styles.legendRow}>
            <View style={styles.legItem}>
              <View style={[styles.legLine, { backgroundColor: '#008542' }]} />
              <Text style={styles.legText}>Receita</Text>
            </View>
            <View style={styles.legItem}>
              <View style={[styles.legLine, { backgroundColor: '#7c4dff' }]} />
              <Text style={styles.legText}>Despesa</Text>
            </View>
          </View>
        </View>

        
        <View style={styles.panel}>
          <View style={styles.panelHead}>
            <Text style={styles.panelTitle}>Lista de Vencimentos</Text>
          </View>
          
          {vencimentos.length > 0 ? (
            vencimentos.map((item, index) => (
              <View 
                key={item.id} 
                style={[styles.vencItem, index === vencimentos.length - 1 && { borderBottomWidth: 0 }]}
              >
                <Text style={styles.vencName}>{item.nome}</Text>
                <Text style={styles.vencDate}>{item.data}</Text>
                <View style={styles.vencBarWrap}>
                  <View style={styles.vencBarBg}>
                    <View style={[styles.vencBarFill, { width: item.larguraBarra, backgroundColor: item.cor }]} />
                  </View>
                  <Text style={[styles.vencDays, { color: item.cor }]}>{item.dias} dias</Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>Nenhum vencimento registrado.</Text>
          )}
        </View>

        
        <View style={styles.panel}>
          <View style={styles.panelHead}>
            <Text style={styles.panelTitle}>Receita — Previsto x Realizado</Text>
            <Text style={styles.panelSub}>* Últimos 6 meses fechados</Text>
          </View>

          
          <View style={styles.customChartWrapper}>
            
            <View style={styles.yAxisColumn}>
              {yAxisSteps.map((step, idx) => (
                <Text key={`y-${idx}`} style={styles.yAxisText}>
                  R${(step / 1000).toFixed(0)}k
                </Text>
              ))}
            </View>

            
            <View style={styles.plotArea}>
              
              <View style={styles.gridLinesContainer}>
                {yAxisSteps.map((_, idx) => (
                  <View key={`grid-${idx}`} style={styles.gridLine} />
                ))}
              </View>

              
              <View style={styles.barsContainer}>
                {graficoBarras.previsto.map((prevValue, i) => {
                  const realValue = graficoBarras.realizado[i] || 0;
                  const prevHeight = Math.max(5, (prevValue / maxBarValue) * CHART_HEIGHT);
                  const realHeight = Math.max(5, (realValue / maxBarValue) * CHART_HEIGHT);

                  return (
                    <View key={`bar-group-${i}`} style={styles.barGroup}>
                      <View style={[styles.barSingle, { height: prevHeight, backgroundColor: '#f06292' }]} />
                      <View style={[styles.barSingle, { height: realHeight, backgroundColor: '#7c4dff' }]} />
                    </View>
                  );
                })}
              </View>
            </View>
          </View>

          
          <View style={styles.xAxisRow}>
            {labelsMeses.map((m, idx) => ( 
              <Text key={idx} style={styles.xAxisText}>{m}</Text>
            ))}
          </View>

          <View style={styles.legendRow}>
            <View style={styles.legItem}>
              <View style={[styles.legLine, { backgroundColor: '#f06292', height: 4, width: 24 }]} />
              <Text style={styles.legText}>Previsto</Text>
            </View>
            <View style={styles.legItem}>
              <View style={[styles.legLine, { backgroundColor: '#7c4dff', height: 4, width: 24 }]} />
              <Text style={styles.legText}>Realizado</Text>
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
  scrollContent: { padding: 14, paddingBottom: 80 },
  pageSub: { fontFamily: 'Montserrat_700Bold', fontSize: 11, color: COLORS.textMuted, marginBottom: 14, textTransform: 'uppercase' },
  cardsTop: { gap: 10, marginBottom: 14 },
  gradCard: { borderRadius: 12, padding: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  gradCardLeft: { flex: 1 },
  gradCardLabel: { fontFamily: 'Montserrat_500Medium', fontSize: 10.5, color: COLORS.white, opacity: 0.9, marginBottom: 4 },
  gradCardValue: { fontFamily: 'Montserrat_700Bold', fontSize: 20, color: COLORS.white, letterSpacing: -0.5 },
  gradCardSub: { fontFamily: 'Montserrat_400Regular', fontSize: 9, color: COLORS.white, opacity: 0.75, marginTop: 4 },
  panel: { backgroundColor: COLORS.white, borderRadius: 12, borderWidth: 1, borderColor: COLORS.grayBorder, overflow: 'hidden', marginBottom: 14 },
  panelHead: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8 },
  panelTitle: { fontFamily: 'Montserrat_700Bold', fontSize: 13, color: COLORS.textDark },
  panelSub: { fontFamily: 'Montserrat_400Regular', fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  
  
  vencItem: { paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: COLORS.grayBorder },
  vencName: { fontFamily: 'Montserrat_700Bold', fontSize: 12.5, color: COLORS.textDark, marginBottom: 2 },
  vencDate: { fontFamily: 'Montserrat_400Regular', fontSize: 11, color: COLORS.textMuted, marginBottom: 8 },
  vencBarWrap: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  vencBarBg: { flex: 1, height: 4, backgroundColor: '#f0f0f0', borderRadius: 2, overflow: 'hidden' },
  vencBarFill: { height: '100%', borderRadius: 2 },
  vencDays: { fontFamily: 'Montserrat_700Bold', fontSize: 11, minWidth: 50, textAlign: 'right' }, 
  
  
  customChartWrapper: { flexDirection: 'row', height: CHART_HEIGHT, paddingHorizontal: 16, marginTop: 16 },
  yAxisColumn: { justifyContent: 'space-between', paddingRight: 8, height: '100%' },
  yAxisText: { fontFamily: 'Montserrat_400Regular', fontSize: 9, color: '#aaa', transform: [{ translateY: -5 }] },
  plotArea: { flex: 1, position: 'relative', height: '100%' },
  gridLinesContainer: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, justifyContent: 'space-between' },
  gridLine: { width: '100%', height: 1, backgroundColor: '#f0f0f0' },
  barsContainer: { flex: 1, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end' },
  barGroup: { flexDirection: 'row', alignItems: 'flex-end', gap: 4, height: '100%' },
  barSingle: { width: 12, borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  xAxisRow: { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 16, paddingLeft: 46, marginTop: 6, marginBottom: 12 },
  xAxisText: { fontFamily: 'Montserrat_400Regular', fontSize: 9, color: '#aaa' },
  
  
  legendRow: { flexDirection: 'row', gap: 20, paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1, borderTopColor: COLORS.grayBorder },
  legItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legLine: { width: 24, height: 3, borderRadius: 2 },
  legText: { fontFamily: 'Montserrat_400Regular', fontSize: 11, color: COLORS.textMuted },
  emptyText: { fontFamily: 'Montserrat_400Regular', fontSize: 12.5, color: COLORS.textMuted, textAlign: 'center', paddingVertical: 20 }
});
