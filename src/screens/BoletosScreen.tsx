
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Modal } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';
import { BoletoCard, BoletoProps } from '../components/BoletoCard';
import { useAuth } from '../context/AuthContext';
import { buscarBoletos } from '../services/api';
import { normalizarPapel, perfilAdministrativo } from '../config/modules';

type OpcaoFiltro = { label: string; value: string };

const MESES_COMPLETOS: OpcaoFiltro[] = [
  { label: 'Todos os Meses', value: 'Todos' },
  { label: 'Janeiro', value: '01' }, { label: 'Fevereiro', value: '02' },
  { label: 'Março', value: '03' }, { label: 'Abril', value: '04' },
  { label: 'Maio', value: '05' }, { label: 'Junho', value: '06' },
  { label: 'Julho', value: '07' }, { label: 'Agosto', value: '08' },
  { label: 'Setembro', value: '09' }, { label: 'Outubro', value: '10' },
  { label: 'Novembro', value: '11' }, { label: 'Dezembro', value: '12' }
];

const STATUS_COMPLETOS: OpcaoFiltro[] = [
  { label: 'Todos os Status', value: 'Todos' },
  { label: 'A Vencer', value: 'a_vencer' },
  { label: 'Vencido', value: 'vencido' },
  { label: 'Pago', value: 'pago' }
];

const obterAnoEMes = (dataString: string) => {
  if (!dataString) return { ano: '', mes: '' };
  let ano = '';
  let mes = '';
  if (dataString.includes('-')) {
    const partes = dataString.split('-');
    ano = partes[0];
    mes = partes[1];
  } else if (dataString.includes('/')) {
    const partes = dataString.split('/');
    ano = partes[2];
    mes = partes[1];
  }
  return { ano, mes };
};

const obterStatusErp = (boleto: BoletoProps): string => {
  // "pendente" é o status legado equivalente a "a vencer".
  return boleto.status === 'pendente' ? 'a_vencer' : boleto.status;
};

export function BoletosScreen() {
  const { condominioAtivo } = useAuth();
  
  const papelAtual = normalizarPapel(condominioAtivo?.papel || 'Morador');
  const isAdministrador = perfilAdministrativo(papelAtual);

  const [boletosOriginais, setBoletosOriginais] = useState<BoletoProps[]>([]);
  const [boletos, setBoletos] = useState<BoletoProps[]>([]);
  const [carregando, setCarregando] = useState(true);

  
  const [filtroUnidade, setFiltroUnidade] = useState('Todas');
  const [filtroAno, setFiltroAno] = useState('Todos');
  const [filtroMes, setFiltroMes] = useState('Todos');
  const [filtroStatus, setFiltroStatus] = useState('Todos');

  
  const [unidadesDisponiveis, setUnidadesDisponiveis] = useState<OpcaoFiltro[]>([]);
  const [anosDisponiveis, setAnosDisponiveis] = useState<OpcaoFiltro[]>([]);

  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState<{ titulo: string; opcoes: OpcaoFiltro[]; campo: string }>({ titulo: '', opcoes: [], campo: '' });

  useEffect(() => {
    async function carregarBoletos() {
      if (condominioAtivo?.id && condominioAtivo?.unidade && condominioAtivo?.papel) {
        setCarregando(true);
        try {
          const dados = await buscarBoletos(condominioAtivo.id, condominioAtivo.unidade, condominioAtivo.papel);
          setBoletosOriginais(dados); 

          
          if (isAdministrador) {
            const unidadesUnicas = Array.from(new Set(dados.map((b) => b.unidade).filter(Boolean))).sort() as string[];
            setUnidadesDisponiveis([{ label: 'Todas Unidades', value: 'Todas' }, ...unidadesUnicas.map(u => ({ label: `Unidade ${u}`, value: u }))]);
          }

          
          
          const anosDoBanco = dados.map((b) => Number(obterAnoEMes(b.vencto).ano)).filter(Boolean);
          
          
          const todosAnosUnicos = Array.from(new Set(anosDoBanco)).sort((a, b) => b - a);
          
          setAnosDisponiveis([
            { label: 'Todos os Anos', value: 'Todos' },
            ...todosAnosUnicos.map(ano => ({ label: String(ano), value: String(ano) }))
          ]);

        } catch (error) {
          console.error("Erro ao buscar boletos reais:", error);
          Alert.alert("Erro", "Não foi possível carregar seus boletos no momento.");
        } finally {
          setCarregando(false);
        }
      }
    }
    
    carregarBoletos();
  }, [condominioAtivo, isAdministrador]);

  
  useEffect(() => {
    let filtrados = [...boletosOriginais];

    if (filtroUnidade !== 'Todas') {
      filtrados = filtrados.filter(b => b.unidade === filtroUnidade);
    }
    if (filtroAno !== 'Todos') {
      filtrados = filtrados.filter(b => obterAnoEMes(b.vencto).ano === filtroAno);
    }
    if (filtroMes !== 'Todos') {
      filtrados = filtrados.filter(b => obterAnoEMes(b.vencto).mes === filtroMes);
    }
    if (filtroStatus !== 'Todos') {
      filtrados = filtrados.filter(b => obterStatusErp(b) === filtroStatus);
    }

    setBoletos(filtrados);
  }, [filtroUnidade, filtroAno, filtroMes, filtroStatus, boletosOriginais]);

  const abrirModalFiltro = (titulo: string, opcoes: OpcaoFiltro[], campo: string) => {
    setModalConfig({ titulo, opcoes, campo });
    setModalVisible(true);
  };

  const selecionarOpcao = (value: string) => {
    if (modalConfig.campo === 'unidade') setFiltroUnidade(value);
    if (modalConfig.campo === 'ano') setFiltroAno(value);
    if (modalConfig.campo === 'mes') setFiltroMes(value);
    if (modalConfig.campo === 'status') setFiltroStatus(value);
    setModalVisible(false);
  };

  return (
    <View style={styles.container}>
      
      
      <View style={styles.filterSection}>
        <Text style={styles.pageSub}>Consulte, gere a 2ª via e acompanhe seus boletos</Text>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersContainer}>
          
          {isAdministrador && (
            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>UNIDADE</Text>
              <TouchableOpacity 
                style={[styles.filterSelect, filtroUnidade !== 'Todas' && { borderColor: COLORS.greenMain }]} 
                onPress={() => abrirModalFiltro('Selecione a Unidade', unidadesDisponiveis, 'unidade')} 
                activeOpacity={0.7}
              >
                <Text style={[styles.filterSelectText, filtroUnidade !== 'Todas' && { color: COLORS.greenMain, fontFamily: 'Montserrat_700Bold' }]}>
                  {filtroUnidade === 'Todas' ? 'Todas' : filtroUnidade}
                </Text>
                <Feather name="chevron-down" size={14} color={filtroUnidade !== 'Todas' ? COLORS.greenMain : COLORS.textDark} />
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>ANO</Text>
            <TouchableOpacity 
              style={[styles.filterSelect, filtroAno !== 'Todos' && { borderColor: COLORS.greenMain }]} 
              onPress={() => abrirModalFiltro('Selecione o Ano', anosDisponiveis, 'ano')} 
              activeOpacity={0.7}
            >
              <Text style={[styles.filterSelectText, filtroAno !== 'Todos' && { color: COLORS.greenMain, fontFamily: 'Montserrat_700Bold' }]}>
                {filtroAno}
              </Text>
              <Feather name="chevron-down" size={14} color={filtroAno !== 'Todos' ? COLORS.greenMain : COLORS.textDark} />
            </TouchableOpacity>
          </View>

          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>MÊS</Text>
            <TouchableOpacity 
              style={[styles.filterSelect, filtroMes !== 'Todos' && { borderColor: COLORS.greenMain }]} 
              onPress={() => abrirModalFiltro('Selecione o Mês', MESES_COMPLETOS, 'mes')} 
              activeOpacity={0.7}
            >
              <Text style={[styles.filterSelectText, filtroMes !== 'Todos' && { color: COLORS.greenMain, fontFamily: 'Montserrat_700Bold' }]}>
                {filtroMes === 'Todos' ? 'Todos' : MESES_COMPLETOS.find(m => m.value === filtroMes)?.label}
              </Text>
              <Feather name="chevron-down" size={14} color={filtroMes !== 'Todos' ? COLORS.greenMain : COLORS.textDark} />
            </TouchableOpacity>
          </View>

          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>STATUS</Text>
            <TouchableOpacity 
              style={[styles.filterSelect, filtroStatus !== 'Todos' && { borderColor: COLORS.greenMain }]} 
              onPress={() => abrirModalFiltro('Selecione o Status', STATUS_COMPLETOS, 'status')} 
              activeOpacity={0.7}
            >
              <Text style={[styles.filterSelectText, filtroStatus !== 'Todos' && { color: COLORS.greenMain, fontFamily: 'Montserrat_700Bold' }]}>
                {filtroStatus === 'Todos' ? 'Todos' : STATUS_COMPLETOS.find(s => s.value === filtroStatus)?.label}
              </Text>
              <Feather name="chevron-down" size={14} color={filtroStatus !== 'Todos' ? COLORS.greenMain : COLORS.textDark} />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 80 }} showsVerticalScrollIndicator={false}>
        <Text style={styles.infoText}>
          Boletos após o vencimento sujeitos a encargos de juros e multas.
        </Text>

        {carregando ? (
          <ActivityIndicator size="large" color={COLORS.greenMain} style={{ marginTop: 40 }} />
        ) : boletos.length > 0 ? (
          boletos.map((boleto) => (
            <BoletoCard key={boleto.id} data={boleto} />
          ))
        ) : (
          <Text style={styles.emptyText}>Nenhum boleto encontrado para este filtro.</Text>
        )}
      </ScrollView>

      
      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setModalVisible(false)}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{modalConfig.titulo}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Feather name="x" size={20} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll}>
              {modalConfig.opcoes.map((opcao, index) => (
                <TouchableOpacity 
                  key={index} 
                  style={styles.modalOption} 
                  onPress={() => selecionarOpcao(opcao.value)}
                >
                  <Text style={styles.modalOptionText}>{opcao.label}</Text>
                  <Feather name="chevron-right" size={16} color={COLORS.grayBorder} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.grayBg },
  filterSection: { padding: 14, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.grayBorder },
  pageSub: { fontFamily: 'Montserrat_400Regular', fontSize: 11, color: COLORS.textMuted, marginBottom: 14 },
  filtersContainer: { flexDirection: 'row', paddingBottom: 4 },
  filterGroup: { marginRight: 8, flexDirection: 'column', gap: 4 },
  filterLabel: { fontFamily: 'Montserrat_700Bold', fontSize: 9, color: COLORS.textMuted, letterSpacing: 0.4 },
  filterSelect: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, paddingHorizontal: 10, borderWidth: 1, borderColor: COLORS.grayBorder, borderRadius: 7, backgroundColor: COLORS.white, minWidth: 90 },
  filterSelectText: { fontFamily: 'Montserrat_400Regular', fontSize: 12, color: COLORS.textDark, marginRight: 8 },
  content: { flex: 1, padding: 14 },
  infoText: { fontFamily: 'Montserrat_400Regular', fontSize: 11, color: COLORS.textMuted, marginBottom: 14, lineHeight: 16 },
  emptyText: { fontFamily: 'Montserrat_400Regular', fontSize: 12.5, color: COLORS.textMuted, textAlign: 'center', marginTop: 40 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: COLORS.white, borderTopLeftRadius: 16, borderTopRightRadius: 16, paddingBottom: 30, maxHeight: '60%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: COLORS.grayBorder },
  modalTitle: { fontFamily: 'Montserrat_700Bold', fontSize: 16, color: COLORS.textDark },
  modalScroll: { paddingHorizontal: 20 },
  modalOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: COLORS.grayBg },
  modalOptionText: { fontFamily: 'Montserrat_500Medium', fontSize: 15, color: COLORS.textDark }
});
