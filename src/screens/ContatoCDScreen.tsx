import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert, Keyboard, TouchableOpacity, Modal } from 'react-native';
import { COLORS } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { CustomSelect } from '../components/CustomSelect';
import { buscarDiretoria, enviarMensagemDiretoria, MembroDiretoria } from '../services/api';
import { supabase } from '../services/supabase'; 

export function ContatoCDScreen() {
  const { condominioAtivo, token } = useAuth(); 

  const papeisDiretoria = ['Síndico', 'Subsíndico', 'Conselheiro', 'Gestor'];
  const isDiretoria = papeisDiretoria.includes(condominioAtivo?.papel || '');

  const [membros, setMembros] = useState<MembroDiretoria[]>([]);
  const [historico, setHistorico] = useState<any[]>([]);
  const [caixaEntrada, setCaixaEntrada] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [enviando, setEnviando] = useState(false);

  
  const [destinatario, setDestinatario] = useState('Selecione...');
  const [categoria, setCategoria] = useState('Selecione...');
  const [titulo, setTitulo] = useState('');
  const [corpoMensagem, setCorpoMensagem] = useState('');
  const [destAberto, setDestAberto] = useState(false);
  const [catAberta, setCatAberta] = useState(false);

  
  const [modalVisible, setModalVisible] = useState(false);
  const [msgSelecionada, setMsgSelecionada] = useState<any>(null);
  const [resposta, setResposta] = useState('');

  const catOptions = ['Reclamação', 'Sugestão', 'Solicitação', 'Informação'];
  const destOptions = [...membros.map(m => m.papel), 'Todos'];

  const toggleDest = () => { setDestAberto(!destAberto); setCatAberta(false); };
  const toggleCat = () => { setCatAberta(!catAberta); setDestAberto(false); };

  useEffect(() => {
    if (condominioAtivo?.id) {
      if (isDiretoria) {
        carregarCaixaEntrada(); 
      } else {
        carregarDadosMorador(); 
      }
    }
  }, [condominioAtivo]);

  
  
  
  async function carregarDadosMorador() {
    setCarregando(true);
    try {
      const dados = await buscarDiretoria(condominioAtivo!.id);
      setMembros(dados.membros);

      
      const { data: historicoReal, error } = await supabase
        .from('mensagens_diretoria')
        .select('*')
        .eq('condominio_id', condominioAtivo!.id)
        .eq('remetente_id', token)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setHistorico(historicoReal || []);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setCarregando(false);
    }
  }

  const handleEnviarMensagem = async () => {
    if (destinatario === 'Selecione...' || categoria === 'Selecione...' || !titulo.trim() || !corpoMensagem.trim()) {
      Alert.alert('Atenção', 'Por favor, preencha todos os campos.');
      return;
    }

    try {
      setEnviando(true);
      Keyboard.dismiss();

      const assuntoFormatado = `[${categoria}] ${titulo.trim()}`;

      await enviarMensagemDiretoria({
        condominio_id: condominioAtivo!.id,
        remetente_id: token,
        destinatario_papel: destinatario,
        assunto: assuntoFormatado,
        mensagem: corpoMensagem.trim(),
        status: 'Aguardando'
      });

      Alert.alert('Sucesso', 'Mensagem enviada para a diretoria!');
      setTitulo(''); setCorpoMensagem(''); setDestinatario('Selecione...'); setCategoria('Selecione...');
      
      carregarDadosMorador(); 
    } catch (error: any) {
      Alert.alert('Erro', 'Não foi possível enviar sua mensagem.');
    } finally {
      setEnviando(false);
    }
  };


  async function carregarCaixaEntrada() {
    setCarregando(true);
    try {
      const { data, error } = await supabase
        .from('mensagens_diretoria')
        .select(`*, remetente:usuarios(nome)`)
        .eq('condominio_id', condominioAtivo!.id)
        
        
        .in('destinatario_papel', [condominioAtivo!.papel, 'Todos']) 
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCaixaEntrada(data || []);
    } catch (error) {
      console.error("Erro ao carregar caixa de entrada:", error);
    } finally {
      setCarregando(false);
    }
  }

  const abrirMensagem = (msg: any) => {
    setMsgSelecionada(msg);
    setResposta('');
    setModalVisible(true);
  };

  const handleResponder = async () => {
    if (!resposta.trim()) {
      Alert.alert('Atenção', 'Digite uma resposta antes de enviar.');
      return;
    }

    try {
      setEnviando(true);
      const { error } = await supabase
        .from('mensagens_diretoria')
        .update({ resposta: resposta.trim(), status: 'Respondido' })
        .eq('id', msgSelecionada.id);

      if (error) throw error;

      Alert.alert('Sucesso', 'Sua resposta foi enviada ao morador!');
      setModalVisible(false);
      carregarCaixaEntrada(); 
    } catch (error: any) {
      Alert.alert('Erro', 'Não foi possível enviar a resposta.');
    } finally {
      setEnviando(false);
    }
  };

  if (carregando) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}><ActivityIndicator size="large" color={COLORS.greenMain} /></View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Text style={styles.pageSub}>
          {isDiretoria ? "Acompanhe e responda as solicitações dos moradores" : "Envie uma mensagem diretamente para os membros do corpo diretivo"}
        </Text>

        {isDiretoria && (
          <View style={styles.panel}>
            <View style={styles.panelHead}>
              <Text style={styles.panelTitle}>Caixa de Entrada</Text>
            </View>
            <View style={styles.panelBodyList}>
              {caixaEntrada.length > 0 ? (
                caixaEntrada.map((item, index) => {
                  const dataFormatada = new Date(item.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
                  return (
                    <TouchableOpacity 
                      key={item.id} 
                      style={[styles.historyRow, index === caixaEntrada.length - 1 && { borderBottomWidth: 0 }]}
                      onPress={() => abrirMensagem(item)}
                    >
                      <View style={{ flex: 1, marginRight: 10 }}>
                        <Text style={[styles.historyText, { fontFamily: 'Montserrat_700Bold', marginBottom: 2 }]}>
                          {item.remetente?.nome || 'Morador'}
                        </Text>
                        <Text style={styles.historyText} numberOfLines={1}>
                          {dataFormatada} · {item.destinatario_papel} · {item.assunto}
                        </Text>
                      </View>
                      <View style={item.status === 'Respondido' ? styles.badgeAprovado : styles.badgePendente}>
                        <Text style={item.status === 'Respondido' ? styles.badgeAprovadoText : styles.badgePendenteText}>
                          {item.status}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })
              ) : (
                <Text style={styles.emptyText}>Nenhuma mensagem recebida ainda.</Text>
              )}
            </View>
          </View>
        )}

        {!isDiretoria && (
          <>
            <View style={styles.panel}>
              <View style={styles.panelHead}><Text style={styles.panelTitle}>Destinatários</Text></View>
              <View style={styles.panelBodyList}>
                {membros.map((membro, index) => (
                  <View key={index} style={[styles.contactRow, index === membros.length - 1 && { borderBottomWidth: 0 }]}>
                    <View style={[styles.avatar, { backgroundColor: membro.cor || COLORS.greenMain }]}><Text style={styles.avatarTxt}>{membro.iniciais}</Text></View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.contactName}>{membro.papel} — {membro.nome}</Text>
                      <Text style={styles.contactEmail}>{membro.email}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.panel}>
              <View style={styles.panelHead}><Text style={styles.panelTitle}>Nova mensagem</Text></View>
              <View style={styles.panelBody}>
                <View style={[styles.formRow2, { zIndex: 10, elevation: 10 }]}>
                  <CustomSelect label="Enviar para" value={destinatario} options={destOptions} isOpen={destAberto} onToggle={toggleDest} onSelect={setDestinatario} />
                  <CustomSelect label="Categoria" value={categoria} options={catOptions} isOpen={catAberta} onToggle={toggleCat} onSelect={setCategoria} />
                </View>
                <Input label="Título" placeholder="Assunto" value={titulo} onChangeText={setTitulo} editable={!enviando} />
                <Input label="Mensagem" placeholder="Escreva..." multiline numberOfLines={4} value={corpoMensagem} onChangeText={setCorpoMensagem} editable={!enviando} style={{ minHeight: 80, textAlignVertical: 'top' }} />
                <Button title={enviando ? "Enviando..." : "Enviar mensagem"} icon="send" onPress={handleEnviarMensagem} disabled={enviando} />
              </View>
            </View>

            <View style={styles.panel}>
              <View style={styles.panelHead}><Text style={styles.panelTitle}>Histórico</Text></View>
              <View style={styles.panelBodyList}>
                {historico.length > 0 ? (
                  historico.map((item, index) => {
                    const dataFormatada = new Date(item.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
                    return (
                      <View key={item.id} style={[styles.historyRow, index === historico.length - 1 && { borderBottomWidth: 0 }]}>
                        <View style={{ flex: 1, marginRight: 10 }}>
                          <Text style={styles.historyText}>{dataFormatada} · Para: {item.destinatario_papel}</Text>
                          <Text style={[styles.historyText, { fontFamily: 'Montserrat_600SemiBold', marginTop: 2 }]}>{item.assunto}</Text>
                          {item.resposta && (
                            <View style={styles.respostaBox}>
                              <Text style={styles.respostaLabel}>Resposta do {item.destinatario_papel}:</Text>
                              <Text style={styles.respostaText}>{item.resposta}</Text>
                            </View>
                          )}
                        </View>
                        <View style={item.status === 'Respondido' ? styles.badgeAprovado : styles.badgePendente}>
                          <Text style={item.status === 'Respondido' ? styles.badgeAprovadoText : styles.badgePendenteText}>{item.status}</Text>
                        </View>
                      </View>
                    );
                  })
                ) : (
                  <Text style={styles.emptyText}>Nenhuma mensagem enviada.</Text>
                )}
              </View>
            </View>
          </>
        )}
      </ScrollView>

      
      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setModalVisible(false)} disabled={enviando}>
              <Text style={styles.modalCloseBtnText}>×</Text>
            </TouchableOpacity>

            <Text style={styles.modalTitle}>Detalhes da Mensagem</Text>
            
            <View style={{ marginBottom: 16 }}>
              <Text style={styles.detailLabel}>De: {msgSelecionada?.remetente?.nome || 'Morador'}</Text>
              <Text style={styles.detailLabel}>Assunto: {msgSelecionada?.assunto}</Text>
            </View>

            <View style={styles.mensagemBox}>
              <Text style={styles.mensagemText}>{msgSelecionada?.mensagem}</Text>
            </View>

            {msgSelecionada?.status === 'Aguardando' || msgSelecionada?.status === 'pendente' ? (
              <View style={{ marginTop: 20 }}>
                <Input label="Sua Resposta" placeholder="Digite a resposta ao morador..." multiline numberOfLines={4} value={resposta} onChangeText={setResposta} editable={!enviando} style={{ minHeight: 80, textAlignVertical: 'top' }} />
                <Button title={enviando ? "Enviando..." : "Responder"} icon="check" onPress={handleResponder} disabled={enviando} />
              </View>
            ) : (
              <View style={{ marginTop: 20 }}>
                <Text style={[styles.detailLabel, { color: COLORS.greenMain }]}>Respondido:</Text>
                <View style={[styles.mensagemBox, { backgroundColor: '#e7f7ee', borderColor: '#c8e6c9' }]}>
                  <Text style={styles.mensagemText}>{msgSelecionada?.resposta}</Text>
                </View>
                <View style={{ marginTop: 14 }}>
                  <Button title="Fechar" onPress={() => setModalVisible(false)} />
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>

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
  panelBodyList: { paddingHorizontal: 16, paddingVertical: 6 },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.grayBorder },
  avatar: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  avatarTxt: { color: COLORS.white, fontFamily: 'Montserrat_700Bold', fontSize: 13 },
  contactName: { fontFamily: 'Montserrat_700Bold', fontSize: 12, color: COLORS.textDark },
  contactEmail: { fontFamily: 'Montserrat_400Regular', fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  formRow2: { flexDirection: 'row', gap: 12, marginBottom: 6 },
  historyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.grayBorder },
  historyText: { fontFamily: 'Montserrat_500Medium', fontSize: 12.5, color: COLORS.textDark },
  badgeAprovado: { backgroundColor: '#e8f5e9', paddingVertical: 4, paddingHorizontal: 9, borderRadius: 12 },
  badgeAprovadoText: { color: '#2e7d32', fontFamily: 'Montserrat_700Bold', fontSize: 10 },
  badgePendente: { backgroundColor: '#fff3e0', paddingVertical: 4, paddingHorizontal: 9, borderRadius: 12 },
  badgePendenteText: { color: '#e65100', fontFamily: 'Montserrat_700Bold', fontSize: 10 },
  emptyText: { fontFamily: 'Montserrat_400Regular', fontSize: 12.5, color: COLORS.textMuted, paddingVertical: 16, textAlign: 'center' },
  respostaBox: { marginTop: 8, backgroundColor: '#f9f9f9', padding: 10, borderRadius: 8, borderLeftWidth: 3, borderLeftColor: COLORS.greenMain },
  respostaLabel: { fontFamily: 'Montserrat_700Bold', fontSize: 10, color: COLORS.greenMain, marginBottom: 2 },
  respostaText: { fontFamily: 'Montserrat_400Regular', fontSize: 11.5, color: COLORS.textDark, lineHeight: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center' },
  modalCard: { backgroundColor: COLORS.white, borderRadius: 16, marginHorizontal: 14, paddingHorizontal: 18, paddingVertical: 22, position: 'relative' },
  modalCloseBtn: { position: 'absolute', top: 14, right: 16, zIndex: 50 },
  modalCloseBtnText: { color: COLORS.greenMain, fontSize: 20, fontFamily: 'Montserrat_700Bold' },
  modalTitle: { fontFamily: 'Montserrat_700Bold', fontSize: 17, color: COLORS.textDark, marginBottom: 18, paddingRight: 24 },
  detailLabel: { fontFamily: 'Montserrat_600SemiBold', fontSize: 12, color: COLORS.textMid, marginBottom: 4 },
  mensagemBox: { backgroundColor: '#f5f5f5', padding: 14, borderRadius: 10, borderWidth: 1, borderColor: COLORS.grayBorder, marginTop: 8 },
  mensagemText: { fontFamily: 'Montserrat_400Regular', fontSize: 13, color: COLORS.textDark, lineHeight: 20 }
});
