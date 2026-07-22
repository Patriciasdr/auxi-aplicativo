
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator, Alert, Keyboard, TouchableOpacity, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { excluirEvento, listarEventos, salvarEvento } from '../services/api';
import { Input } from '../components/Input';
import { Button } from '../components/Button';


const formatarDataCard = (dataStr: string) => {
  if (!dataStr) return { dia: '--', mes: '---' };
  const partes = dataStr.split('-');
  if (partes.length !== 3) return { dia: '--', mes: '---' };
  
  const dia = partes[2];
  const mesIndex = parseInt(partes[1], 10) - 1;
  const meses = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
  const mes = meses[mesIndex] || '---';
  
  return { dia, mes };
};


const calcularVencimento = (dataStr: string) => {
  if (!dataStr) return '';
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const partes = dataStr.split('-');
  if (partes.length !== 3) return '';
  const dataEvento = new Date(parseInt(partes[0], 10), parseInt(partes[1], 10) - 1, parseInt(partes[2], 10));
  dataEvento.setHours(0, 0, 0, 0);
  
  const diffTime = dataEvento.getTime() - hoje.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'É hoje!';
  if (diffDays === 1) return 'Amanhã';
  if (diffDays < 0) return 'Já ocorreu';
  return `Faltam ${diffDays} dias`;
};


const aplicarMascaraData = (val: string) => {
  return val
    .replace(/\D/g, '') 
    .replace(/(\d{2})(\d)/, '$1/$2')
    .replace(/(\d{2})(\d)/, '$1/$2')
    .replace(/(\d{4})\d+?$/, '$1'); 
};


const formatarDataParaInput = (dataBanco: string) => {
  if (!dataBanco) return '';
  const partes = dataBanco.split('-');
  if (partes.length !== 3) return '';
  return `${partes[2]}/${partes[1]}/${partes[0]}`;
};

export function AgendaCondominioScreen() {
  const { condominioAtivo } = useAuth();
  
  const isSindico = ['Síndico', 'Gestor', 'Conselheiro'].includes(condominioAtivo?.papel || '');

  
  const [eventos, setEventos] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [enviando, setEnviando] = useState(false);

  
  const [idEmEdicao, setIdEmEdicao] = useState<string | null>(null);

  
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [dataInput, setDataInput] = useState(''); 
  const [local, setLocal] = useState('');
  const [horario, setHorario] = useState('');

  
  const [expandidos, setExpandidos] = useState<Record<string, boolean>>({});

  const toggleExpandir = (id: string) => {
    setExpandidos(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const carregarEventos = useCallback(async (isRefresh = false) => {
    if (!condominioAtivo?.id) return;
    
    if (isRefresh) setAtualizando(true);
    else setCarregando(true);

    try {
      setEventos(await listarEventos(condominioAtivo.id));
    } catch (error) {
      console.error("Erro ao buscar eventos do banco:", error);
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
  }, [condominioAtivo]);

  useEffect(() => {
    carregarEventos();
  }, [carregarEventos]);

  
  const handleSalvarEvento = async () => {
    if (!titulo.trim() || !descricao.trim() || !dataInput.trim()) {
      Alert.alert('Atenção', 'Título, descrição e data são campos obrigatórios.');
      return;
    }

    const partes = dataInput.split('/');
    if (partes.length !== 3 || partes[0].length !== 2 || partes[1].length !== 2 || partes[2].length !== 4) {
      Alert.alert('Data inválida', 'Por favor, digite a data no formato correto: DD/MM/AAAA');
      return;
    }

    const dia = partes[0];
    const mes = partes[1];
    const ano = partes[2];
    const dataFormatadaBanco = `${ano}-${mes}-${dia}`;

    try {
      setEnviando(true);
      Keyboard.dismiss();

      if (idEmEdicao) {
        
        await salvarEvento({
            titulo: titulo.trim(),
            descricao: descricao.trim(),
            data: dataFormatadaBanco,
            local: local.trim() || null,
            horario: horario.trim() || null,
          }, idEmEdicao);
        Alert.alert('Sucesso', 'Evento atualizado com sucesso!');
      } else {
        
        await salvarEvento({
              condominio_id: condominioAtivo?.id,
              titulo: titulo.trim(),
              descricao: descricao.trim(),
              data: dataFormatadaBanco,
              local: local.trim() || null,
              horario: horario.trim() || null,
            });
        Alert.alert('Sucesso', 'Novo evento cadastrado com sucesso!');
      }

      
      handleCancelarEdicao();
      await carregarEventos();

    } catch (error: any) {
      console.error("Erro na operação de salvamento:", error.message);
      Alert.alert('Erro', 'Não foi possível salvar o evento no banco. Tente novamente.');
    } finally {
      setEnviando(false);
    }
  };

  
  const handleIniciarEdicao = (item: any) => {
    setIdEmEdicao(item.id);
    setTitulo(item.titulo);
    setDescricao(item.descricao);
    setDataInput(formatarDataParaInput(item.data));
    setLocal(item.local || '');
    setHorario(item.horario || '');
    
    Alert.alert('Modo de Edição', 'Os dados do evento foram carregados no formulário no topo da página.');
  };

  
  const handleCancelarEdicao = () => {
    setIdEmEdicao(null);
    setTitulo('');
    setDescricao('');
    setDataInput('');
    setLocal('');
    setHorario('');
  };

  
  const deletarEventoNoBanco = async (id: string) => {
    try {
      setCarregando(true);
      await excluirEvento(id);
      
      Alert.alert('Excluído', 'O evento foi removido da agenda.');
      
      if (idEmEdicao === id) {
        handleCancelarEdicao();
      }

      await carregarEventos();
    } catch (error: any) {
      console.error("Erro ao deletar evento:", error.message);
      Alert.alert('Erro', 'Não foi possível excluir o evento.');
    } finally {
      setCarregando(false);
    }
  };

  
  const handleExcluirEvento = (id: string, tituloEvento: string) => {
    const mensagemConfirmacao = `Tem certeza que deseja excluir permanentemente o evento "${tituloEvento}"?`;

    if (Platform.OS === 'web') {
      
      const confirmou = window.confirm(mensagemConfirmacao);
      if (confirmou) {
        deletarEventoNoBanco(id);
      }
    } else {
      
      Alert.alert(
        'Confirmar Exclusão',
        mensagemConfirmacao,
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Excluir', style: 'destructive', onPress: () => deletarEventoNoBanco(id) }
        ]
      );
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={atualizando}
            onRefresh={() => carregarEventos(true)}
            tintColor={COLORS.greenMain}
          />
        }
      >
        <Text style={styles.pageTitle}>Agenda do Condomínio</Text>
        <Text style={styles.pageSub}>
          {isSindico 
            ? 'Publique, edite ou remova eventos e reuniões programadas no prédio.' 
            : 'Próximos eventos, reuniões e atividades programadas.'}
        </Text>

        
        {isSindico && (
          <View style={[styles.panel, idEmEdicao ? styles.panelEditing : null]}>
            <View style={styles.panelHead}>
              <Text style={styles.panelTitle}>
                {idEmEdicao ? '📝 Editar Evento Selecionado' : '📅 Agendar Novo Evento'}
              </Text>
            </View>
            
            <View style={styles.panelBody}>
              <Input 
                label="Título do Evento"
                placeholder="Ex: Assembleia Geral Extraordinária"
                value={titulo}
                onChangeText={setTitulo}
                editable={!enviando}
              />

              <Input 
                label="Descrição"
                placeholder="Ex: Pauta de votação sobre as novas câmeras..."
                multiline
                numberOfLines={3}
                value={descricao}
                onChangeText={setDescricao}
                editable={!enviando}
                style={{ minHeight: 60, textAlignVertical: 'top' }}
              />

              <View style={styles.formRow2}>
                <View style={{ flex: 1 }}>
                  <Input 
                    label="Data do Evento"
                    placeholder="DD/MM/AAAA"
                    keyboardType="numeric"
                    value={dataInput}
                    onChangeText={(val) => setDataInput(aplicarMascaraData(val))}
                    editable={!enviando}
                    maxLength={10}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Input 
                    label="Horário"
                    placeholder="Ex: 19:30"
                    value={horario}
                    onChangeText={setHorario}
                    editable={!enviando}
                  />
                </View>
              </View>

              <Input 
                label="Local do Evento"
                placeholder="Ex: Salão de Festas Principal"
                value={local}
                onChangeText={setLocal}
                editable={!enviando}
              />

              <View style={styles.actionsContainer}>
                {idEmEdicao && (
                  <TouchableOpacity 
                    style={styles.btnCancelEdit} 
                    onPress={handleCancelarEdicao}
                    disabled={enviando}
                  >
                    <Text style={styles.btnCancelEditText}>Cancelar</Text>
                  </TouchableOpacity>
                )}
                
                <View style={{ flex: 1 }}>
                  <Button 
                    title={
                      enviando 
                        ? 'Salvando...' 
                        : idEmEdicao 
                          ? 'Salvar Alterações' 
                          : 'Publicar na Agenda'
                    } 
                    icon={idEmEdicao ? "edit" : "calendar"} 
                    onPress={handleSalvarEvento} 
                    disabled={enviando}
                  />
                </View>
              </View>
            </View>
          </View>
        )}

        <Text style={styles.sectionTitle}>Eventos Programados</Text>

        {carregando ? (
          <View style={{ marginTop: 20 }}>
            <ActivityIndicator size="large" color={COLORS.greenMain} />
          </View>
        ) : eventos.length === 0 ? (
          <View style={styles.emptyState}>
            <Feather name="calendar" size={48} color={COLORS.textMuted} />
            <Text style={styles.emptyTitle}>Nenhum evento</Text>
            <Text style={styles.emptyMessage}>Ainda não há eventos programados para este condomínio.</Text>
          </View>
        ) : (
          eventos.map((item) => {
            const { dia, mes } = formatarDataCard(item.data);
            const isExpandido = Boolean(expandidos[item.id]);
            const precisaDeBotaoExpandir = item.descricao && item.descricao.length > 90;

            return (
              <View key={item.id} style={styles.card}>
                <View style={styles.dateBox}>
                  <Text style={styles.dateDay}>{dia}</Text>
                  <Text style={styles.dateMonth}>{mes}</Text>
                </View>
                
                <View style={{ flex: 1 }}>
                  <View style={styles.cardHeaderRow}>
                    <Text style={styles.cardTitle} numberOfLines={1}>{item.titulo}</Text>
                    
                    
                    {isSindico && (
                      <View style={styles.crudRow}>
                        <TouchableOpacity 
                          style={styles.crudButton} 
                          onPress={() => handleIniciarEdicao(item)}
                          activeOpacity={0.7}
                        >
                          <Feather name="edit-2" size={13} color={COLORS.textMuted} />
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={styles.crudButton} 
                          onPress={() => handleExcluirEvento(item.id, item.titulo)}
                          activeOpacity={0.7}
                        >
                          <Feather name="trash-2" size={13} color={COLORS.red} />
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>

                  
                  <Text 
                    style={styles.cardDesc} 
                    numberOfLines={isExpandido ? undefined : 2}
                  >
                    {item.descricao}
                  </Text>
                  
                  {precisaDeBotaoExpandir && (
                    <TouchableOpacity 
                      onPress={() => toggleExpandir(item.id)} 
                      style={styles.btnLerMais}
                      activeOpacity={0.6}
                    >
                      <Text style={styles.btnLerMaisText}>
                        {isExpandido ? 'Ler menos' : 'Ler mais'}
                      </Text>
                      <Feather 
                        name={isExpandido ? 'chevron-up' : 'chevron-down'} 
                        size={12} 
                        color={COLORS.greenMain} 
                      />
                    </TouchableOpacity>
                  )}
                  
                  <View style={styles.metaRow}>
                    {item.local && (
                      <View style={styles.metaItem}>
                        <Feather name="map-pin" size={12} color={COLORS.textMuted} />
                        <Text style={styles.metaText} numberOfLines={1}>{item.local}</Text>
                      </View>
                    )}
                    
                    {item.horario && (
                      <View style={styles.metaItem}>
                        <Feather name="clock" size={12} color={COLORS.textMuted} />
                        <Text style={styles.metaText}>{item.horario}</Text>
                      </View>
                    )}
                  </View>
                  
                  <Text style={styles.countdown}>{calcularVencimento(item.data)}</Text>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.grayBg },
  content: { padding: 16, paddingBottom: 32, gap: 12 },
  pageTitle: { fontFamily: "Montserrat_700Bold", fontSize: 20, color: COLORS.textDark },
  pageSub: { fontFamily: "Montserrat_400Regular", fontSize: 13, color: COLORS.textMuted, marginTop: -6, marginBottom: 10 },
  sectionTitle: { fontFamily: 'Montserrat_700Bold', fontSize: 13, color: COLORS.textDark, marginBottom: 4, marginTop: 10 },
  
  
  panel: { backgroundColor: COLORS.white, borderRadius: 12, borderWidth: 1, borderColor: COLORS.grayBorder, marginBottom: 14 },
  panelEditing: { borderColor: COLORS.greenMain, borderWidth: 1.5 },
  panelHead: { padding: 14, borderBottomWidth: 1, borderBottomColor: COLORS.grayBorder },
  panelTitle: { fontFamily: 'Montserrat_700Bold', fontSize: 13, color: COLORS.textDark },
  panelBody: { padding: 14, gap: 4 },
  formRow2: { flexDirection: 'row', gap: 12 },
  
  
  actionsContainer: { flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 6 },
  btnCancelEdit: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 8, borderWidth: 1, borderColor: COLORS.grayBorder, backgroundColor: '#fafafa', height: 46, justifyContent: 'center' },
  btnCancelEditText: { fontFamily: 'Montserrat_600SemiBold', fontSize: 12.5, color: COLORS.textMuted },

  
  card: { 
    flexDirection: "row", 
    gap: 14, 
    borderWidth: 1, 
    borderColor: COLORS.grayBorder,
    borderRadius: 16, 
    padding: 14,
    backgroundColor: COLORS.white,
    marginBottom: 8
  },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%' },
  crudRow: { flexDirection: 'row', gap: 10 },
  crudButton: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#f5f5f5', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#e8e8e8' },
  
  dateBox: {
    width: 54,
    height: 54,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.greenBg,
  },
  dateDay: { fontFamily: "Montserrat_700Bold", fontSize: 20, lineHeight: 22, color: COLORS.textDark },
  dateMonth: { fontFamily: "Montserrat_600SemiBold", fontSize: 11, color: COLORS.greenMain },
  
  cardTitle: { flex: 1, fontFamily: "Montserrat_700Bold", fontSize: 14, color: COLORS.textDark, marginRight: 8 },
  cardDesc: { fontFamily: "Montserrat_400Regular", fontSize: 12, lineHeight: 18, marginTop: 2, color: COLORS.textMuted },
  
  
  btnLerMais: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 4, alignSelf: 'flex-start' },
  btnLerMaisText: { fontFamily: 'Montserrat_600SemiBold', fontSize: 11, color: COLORS.greenMain },

  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: 14, marginTop: 8 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontFamily: "Montserrat_500Medium", fontSize: 11, color: COLORS.textMuted },
  
  countdown: { fontFamily: "Montserrat_600SemiBold", fontSize: 11, marginTop: 8, color: COLORS.greenMain },

  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40, paddingHorizontal: 20 },
  emptyTitle: { fontFamily: "Montserrat_700Bold", fontSize: 16, color: COLORS.textDark, marginTop: 16 },
  emptyMessage: { fontFamily: "Montserrat_400Regular", fontSize: 13, color: COLORS.textMuted, textAlign: 'center', marginTop: 8 },
});
