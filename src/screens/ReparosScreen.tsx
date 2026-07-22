
import React, { useCallback, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Keyboard } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { atualizarReparo, buscarReparos, criarReparo } from '../services/api'; 
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { CustomSelect } from '../components/CustomSelect';
import { normalizarPapel } from '../config/modules';

interface ReparoItem {
  id: string;
  id_condominio?: string;
  area: string;
  protocolo?: string;
  status: string;
  titulo: string;
  data: string;
  nota?: string;
  progresso?: number;
  progresso_pct?: number;
}

export function ReparosScreen() {
  const { condominioAtivo, token } = useAuth();

  
  const papelAtual = normalizarPapel(condominioAtivo?.papel || 'Morador');
  const isZelador = papelAtual === 'Zelador';
  const podeAbrirChamado = ['Síndico', 'Morador', 'Proprietário'].includes(papelAtual);

  const [area, setArea] = useState('Selecione...');
  const [urgencia, setUrgencia] = useState('Normal');
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [areaAberta, setAreaAberta] = useState(false);
  const [urgenciaAberta, setUrgenciaAberta] = useState(false);

  
  const [reparos, setReparos] = useState<ReparoItem[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [enviando, setEnviando] = useState(false);

  const areasOptions = ['Elevador', 'Hall de entrada', 'Garagem', 'Piscina', 'Academia', 'Salão de festas'];
  const urgenciaOptions = ['Normal', 'Urgente', 'Emergência'];

  const toggleArea = () => { setAreaAberta(!areaAberta); setUrgenciaAberta(false); };
  const toggleUrgencia = () => { setUrgenciaAberta(!urgenciaAberta); setAreaAberta(false); };

  const carregarDadosReparos = useCallback(async () => {
    if (condominioAtivo?.id) {
      setCarregando(true);
      try {
        const dados = await buscarReparos(condominioAtivo.id);
        setReparos(dados as ReparoItem[]);
      } catch (error) {
        console.error("Erro ao buscar reparos reais:", error);
      } finally {
        setCarregando(false);
      }
    }
  }, [condominioAtivo]);

  useEffect(() => {
    carregarDadosReparos();
  }, [carregarDadosReparos]);

  const handleEnviarSolicitacao = async () => {
    if (!podeAbrirChamado) {
      Alert.alert('Acesso restrito', 'Seu perfil não pode abrir chamados de reparo.');
      return;
    }

    if (!area || area === 'Selecione...') {
      Alert.alert('Atenção', 'Por favor, selecione a área do condomínio.');
      return;
    }
    if (!titulo.trim()) {
      Alert.alert('Atenção', 'Por favor, digite um título para o problema.');
      return;
    }

    try {
      setEnviando(true);
      Keyboard.dismiss();

      const anoAtual = new Date().getFullYear();
      const novoProtocolo = `#${anoAtual}-${Math.floor(100 + Math.random() * 900)}`;

      await criarReparo({
            protocolo: novoProtocolo,
            condominio_id: condominioAtivo?.id,
            usuario_id: token,
            area: area,
            urgencia: urgencia, 
            titulo: titulo.trim(),
            descricao: descricao.trim() || 'Sem observações extras.',
            status: 'Em análise',
            progresso_pct: 15
          });

      Alert.alert('Sucesso', 'Sua solicitação de reparo foi registrada com sucesso!');
      
      setTitulo('');
      setDescricao('');
      setArea('Selecione...');
      setUrgencia('Normal');

      await carregarDadosReparos();

    } catch (error: any) {
      console.error("Erro ao inserir reparo:", error.message);
      Alert.alert('Erro', 'Não foi possível enviar sua solicitação. Tente novamente.');
    } finally {
      setEnviando(false);
    }
  };

  const handleAtualizarStatus = async (id: string, novoStatus: string) => {
    if (!isZelador) {
      Alert.alert('Acesso restrito', 'Somente o zelador pode atualizar chamados de reparo.');
      return;
    }

    let progresso = 0;
    let nota = '';

    if (novoStatus === 'Em análise') {
      progresso = 40;
      nota = 'Equipe ciente, aguardando avaliação técnica.';
    } else if (novoStatus === 'Pendente') {
      progresso = 60;
      nota = 'Aguardando peças ou aprovação de orçamento.';
    } else if (novoStatus === 'Concluído') {
      progresso = 100;
      nota = 'Reparo finalizado com sucesso pelo zelador.';
    }

    try {
      setCarregando(true);
      await atualizarReparo(id, { status: novoStatus, progresso_pct: progresso, nota });

      Alert.alert('Atualizado', `Status do reparo alterado para: ${novoStatus}`);
      await carregarDadosReparos();
    } catch (error) {
      console.error(error);
      Alert.alert('Erro', 'Não foi possível atualizar o status.');
    } finally {
      setCarregando(false);
    }
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'Em análise':
        return <View style={styles.badgeAnalise}><Text style={styles.badgeAnaliseText}>Em análise</Text></View>;
      case 'Pendente':
        return <View style={styles.badgePendente}><Text style={styles.badgePendenteText}>Pendente</Text></View>;
      case 'Concluído':
        return <View style={styles.badgeConcluido}><Text style={styles.badgeConcluidoText}>Concluído</Text></View>;
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        
        <Text style={styles.pageSub}>
          {isZelador 
            ? 'Acompanhe as solicitações abertas e atualize o andamento do serviço.'
            : 'Registre ocorrências e acompanhe o status dos reparos em áreas comuns.'}
        </Text>

        
        {podeAbrirChamado && (
          <View style={styles.panel}>
            <View style={styles.panelHead}>
              <Text style={styles.panelTitle}>Nova solicitação</Text>
            </View>
            
            <View style={styles.panelBody}>
              <View style={[styles.formRow2, { zIndex: 10, elevation: 10 }]}>
                <CustomSelect 
                  label="Área"
                  value={area}
                  options={areasOptions}
                  isOpen={areaAberta}
                  onToggle={toggleArea}
                  onSelect={setArea}
                />
                
                <CustomSelect 
                  label="Urgência"
                  value={urgencia}
                  options={urgenciaOptions}
                  isOpen={urgenciaAberta}
                  onToggle={toggleUrgencia}
                  onSelect={setUrgencia}
                />
              </View>

              <Input 
                label="Título do problema"
                placeholder="Ex: Lâmpada queimada no 3º andar"
                value={titulo}
                onChangeText={setTitulo}
                editable={!enviando}
              />

              <Input 
                label="Descrição"
                placeholder="Descreva o problema..."
                multiline
                numberOfLines={4}
                value={descricao}
                onChangeText={setDescricao}
                editable={!enviando}
                style={{ minHeight: 80, textAlignVertical: 'top' }}
              />

              <View style={{ marginBottom: 14 }}>
                <Text style={styles.formLabel}>Fotos (opcional)</Text>
                <TouchableOpacity style={styles.photoUpload} activeOpacity={0.7} disabled={enviando}>
                  <Feather name="camera" size={24} color={COLORS.textMuted} />
                  <Text style={styles.photoUploadText}>Adicionar fotos</Text>
                </TouchableOpacity>
              </View>

              <Button 
                title={enviando ? "Enviando..." : "Enviar solicitação"} 
                icon="send" 
                onPress={handleEnviarSolicitacao} 
                disabled={enviando}
              />
            </View>
          </View>
        )}

        <Text style={styles.sectionTitle}>{isZelador ? 'Painel de Controle de Reparos' : 'Solicitações abertas'}</Text>

        {carregando ? (
          <ActivityIndicator size="large" color={COLORS.greenMain} style={{ marginTop: 20 }} />
        ) : reparos.length > 0 ? (
          reparos.map((item) => {
            const protocoloExibição = item.protocolo || item.id || '#0000';
            const porcentagemProgresso = item.progresso_pct !== undefined ? item.progresso_pct : (item.progresso ? item.progresso * 100 : 0);
            const dataExibicao = item.data || new Date().toLocaleDateString('pt-BR');
            const isConcluido = item.status === 'Concluído';

            return (
              <View key={item.id} style={styles.repairCard}>
                <View style={styles.repairCardHeader}>
                  <View style={styles.headerLeft}>
                    <View style={styles.areaChip}><Text style={styles.areaChipText}>{item.area}</Text></View>
                    <Text style={styles.cardId}>{protocoloExibição}</Text>
                  </View>
                  {renderStatusBadge(item.status)}
                </View>
                <View style={styles.repairCardBody}>
                  <Text style={styles.cardProblemTitle}>{item.titulo}</Text>
                  <Text style={styles.cardDate}>
                    {isConcluido ? 'Resolvido em' : 'Aberto em'} {dataExibicao}
                  </Text>
                  
                  <View style={styles.progressBar}>
                    <View style={[
                      styles.progressFill, 
                      { 
                        width: `${Math.max(5, porcentagemProgresso)}%`, 
                        backgroundColor: item.status === 'Pendente' ? COLORS.orange : (isConcluido ? COLORS.greenMain : '#1565c0')
                      }
                    ]} />
                  </View>
                  
                  {item.nota ? <Text style={styles.progressStatusNote}>{item.nota}</Text> : null}

                  
                  {isZelador && !isConcluido && (
                    <View style={styles.actionRow}>
                      <Text style={styles.actionRowLabel}>Alterar status do reparo:</Text>
                      <View style={styles.statusButtonsContainer}>
                        
                        
                        <TouchableOpacity 
                          style={[
                            styles.statusBtn, 
                            styles.btnAnalise,
                            item.status === 'Em análise' && styles.btnActiveAnalise
                          ]} 
                          onPress={() => handleAtualizarStatus(item.id, 'Em análise')}
                        >
                          <Feather 
                            name="search" 
                            size={12} 
                            color={item.status === 'Em análise' ? COLORS.white : '#1565c0'} 
                          />
                          <Text style={[
                            styles.statusBtnText, 
                            styles.btnAnaliseText,
                            item.status === 'Em análise' && { color: COLORS.white }
                          ]}>
                            Em Análise
                          </Text>
                        </TouchableOpacity>
                        
                        
                        <TouchableOpacity 
                          style={[
                            styles.statusBtn, 
                            styles.btnPendente,
                            item.status === 'Pendente' && styles.btnActivePendente
                          ]} 
                          onPress={() => handleAtualizarStatus(item.id, 'Pendente')}
                        >
                          <Feather 
                            name="clock" 
                            size={12} 
                            color={item.status === 'Pendente' ? COLORS.white : '#e65100'} 
                          />
                          <Text style={[
                            styles.statusBtnText, 
                            styles.btnPendenteText,
                            item.status === 'Pendente' && { color: COLORS.white }
                          ]}>
                            Pendente
                          </Text>
                        </TouchableOpacity>

                        
                        <TouchableOpacity 
                          style={[styles.statusBtn, styles.btnConcluir]} 
                          onPress={() => handleAtualizarStatus(item.id, 'Concluído')}
                        >
                          <Feather name="check-circle" size={12} color="#2e7d32" />
                          <Text style={[styles.statusBtnText, styles.btnConcluirText]}>
                            Concluir
                          </Text>
                        </TouchableOpacity>

                      </View>
                    </View>
                  )}
                </View>
              </View>
            );
          })
        ) : (
          <Text style={styles.emptyText}>Nenhuma solicitação aberta para este condomínio.</Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.grayBg },
  content: { paddingHorizontal: 14, paddingBottom: 40, paddingTop: 14 },
  pageSub: { fontFamily: 'Montserrat_400Regular', fontSize: 11, color: COLORS.textMuted, marginBottom: 14, lineHeight: 16 },
  panel: { backgroundColor: COLORS.white, borderRadius: 12, borderWidth: 1, borderColor: COLORS.grayBorder, marginBottom: 14 },
  panelHead: { padding: 14, borderBottomWidth: 1, borderBottomColor: COLORS.grayBorder },
  panelTitle: { fontFamily: 'Montserrat_700Bold', fontSize: 13, color: COLORS.textDark },
  panelBody: { padding: 14 },
  formRow2: { flexDirection: 'row', gap: 12, marginBottom: 6 }, 
  formLabel: { fontFamily: 'Montserrat_600SemiBold', fontSize: 11, color: COLORS.textDark, marginBottom: 5 },
  photoUpload: { borderStyle: 'dashed', borderWidth: 2, borderColor: COLORS.grayBorder, borderRadius: 8, padding: 22, alignItems: 'center', justifyContent: 'center' },
  photoUploadText: { fontFamily: 'Montserrat_400Regular', fontSize: 12, color: COLORS.textMuted, marginTop: 6 },
  sectionTitle: { fontFamily: 'Montserrat_700Bold', fontSize: 13, color: COLORS.textDark, marginBottom: 12, marginTop: 6 },
  repairCard: { backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.grayBorder, borderRadius: 10, marginBottom: 10, overflow: 'hidden' },
  repairCardHeader: { padding: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: COLORS.grayBorder, backgroundColor: '#f8f8f8' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  areaChip: { backgroundColor: COLORS.greenBg, borderWidth: 1, borderColor: '#c8e6c9', paddingVertical: 2, paddingHorizontal: 9, borderRadius: 12 },
  areaChipText: { color: COLORS.greenMain, fontFamily: 'Montserrat_600SemiBold', fontSize: 10 },
  cardId: { fontFamily: 'Montserrat_400Regular', fontSize: 11, color: COLORS.textMuted },
  badgeAnalise: { backgroundColor: '#e3f2fd', paddingVertical: 3, paddingHorizontal: 9, borderRadius: 12 },
  badgeAnaliseText: { color: '#1565c0', fontFamily: 'Montserrat_700Bold', fontSize: 10 },
  badgePendente: { backgroundColor: '#fff3e0', paddingVertical: 3, paddingHorizontal: 9, borderRadius: 12 },
  badgePendenteText: { color: '#e65100', fontFamily: 'Montserrat_700Bold', fontSize: 10 },
  badgeConcluido: { backgroundColor: '#e8f5e9', paddingVertical: 3, paddingHorizontal: 9, borderRadius: 12 },
  badgeConcluidoText: { color: '#2e7d32', fontFamily: 'Montserrat_700Bold', fontSize: 10 },
  repairCardBody: { padding: 12 },
  cardProblemTitle: { fontFamily: 'Montserrat_700Bold', fontSize: 12, color: COLORS.textDark, marginBottom: 4 },
  cardDate: { fontFamily: 'Montserrat_400Regular', fontSize: 11, color: COLORS.textMuted, marginBottom: 6 },
  progressBar: { height: 6, backgroundColor: COLORS.grayBorder, borderRadius: 3, overflow: 'hidden', marginVertical: 6 },
  progressFill: { height: '100%', borderRadius: 3 },
  progressStatusNote: { fontFamily: 'Montserrat_400Regular', fontSize: 10, color: COLORS.textMuted, marginTop: 4 },
  emptyText: { fontFamily: 'Montserrat_400Regular', fontSize: 12.5, color: COLORS.textMuted, textAlign: 'center', marginTop: 20 },

  actionRow: { marginTop: 14, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#f0f0f0', width: '100%' },
  actionRowLabel: { fontFamily: 'Montserrat_600SemiBold', fontSize: 10.5, color: COLORS.textMuted, marginBottom: 8 },
  statusButtonsContainer: { flexDirection: 'row', gap: 6, width: '100%' },
  statusBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, borderWidth: 1 },
  statusBtnText: { fontFamily: 'Montserrat_700Bold', fontSize: 11 },
  

  btnAnalise: { backgroundColor: '#f0f4f8', borderColor: '#d0e0f0' },
  btnAnaliseText: { color: '#1565c0' },
  btnActiveAnalise: { backgroundColor: '#1565c0', borderColor: '#1565c0' },
  
  btnPendente: { backgroundColor: '#fff8f0', borderColor: '#ffe0b2' },
  btnPendenteText: { color: '#e65100' },
  btnActivePendente: { backgroundColor: '#e65100', borderColor: '#e65100' },
  
  btnConcluir: { backgroundColor: '#f0f8f0', borderColor: '#c8e6c9' },
  btnConcluirText: { color: '#2e7d32' },
});
