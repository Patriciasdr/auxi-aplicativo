import React, { useCallback, useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Pressable, RefreshControl, Modal, Alert, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { buscarCirculares, criarCircular, CircularItem } from '../services/api';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { CustomSelect } from '../components/CustomSelect';

export function CircularesScreen() {
  const { condominioAtivo } = useAuth();
  
  const isDiretoria = ['Síndico', 'Conselheiro'].includes(condominioAtivo?.papel || '');

  const [circulares, setCirculares] = useState<CircularItem[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  
  const [modalVisible, setModalVisible] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [novaCategoria, setNovaCategoria] = useState('Selecione...');
  const [novoTitulo, setNovoTitulo] = useState('');
  const [novoCorpo, setNovoCorpo] = useState('');
  const [catAberta, setCatAberta] = useState(false);

  const catOptions = ['Aviso', 'Manutenção', 'Informação'];

  const carregarDados = useCallback(async () => {
    if (!condominioAtivo?.id) return;
    setCarregando(true);
    try {
      const dados = await buscarCirculares(condominioAtivo.id);
      setCirculares(dados);
    } catch (error) {
      console.error("Erro ao carregar circulares:", error);
    } finally {
      setCarregando(false);
    }
  }, [condominioAtivo]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  const handlePublicar = async () => {
    if (novaCategoria === 'Selecione...' || !novoTitulo.trim() || !novoCorpo.trim()) {
      Alert.alert('Atenção', 'Preencha todos os campos para publicar.');
      return;
    }

    try {
      setEnviando(true);

      await criarCircular(condominioAtivo!.id, novaCategoria, novoTitulo.trim(), novoCorpo.trim());
      
      Alert.alert('Sucesso!', 'A circular foi publicada no mural do condomínio.');
      setModalVisible(false);

      setNovaCategoria('Selecione...'); 
      setNovoTitulo(''); 
      setNovoCorpo('');

      carregarDados(); 
    } catch (error) {
      console.error('Erro ao publicar circular:', error);
      Alert.alert('Erro', 'Não foi possível publicar a circular.');
    } finally {
      setEnviando(false);
    }
  };

  if (carregando && circulares.length === 0) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.greenMain} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={carregando} onRefresh={carregarDados} colors={[COLORS.greenMain]} />}
      >
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.pageTitle}>Circulares</Text>
            <Text style={styles.pageSub}>Comunicados oficiais e avisos do condomínio.</Text>
          </View>
          
          
          {isDiretoria && (
            <TouchableOpacity style={styles.btnAdd} onPress={() => setModalVisible(true)}>
              <Feather name="plus" size={18} color={COLORS.white} />
            </TouchableOpacity>
          )}
        </View>

        {circulares.length === 0 ? (
          <View style={styles.emptyState}>
            <Feather name="mic" size={40} color={COLORS.grayBorder} style={{ marginBottom: 10 }} />
            <Text style={styles.emptyText}>Nenhuma circular publicada ainda.</Text>
          </View>
        ) : (
          circulares.map((item) => {
            const isOpen = expanded === item.id;
            const dataFormatada = new Date(item.publicadoEm).toLocaleDateString('pt-BR');


            let tagColor = '#e3f2fd'; let tagText = '#1565c0';
            if (item.categoria === 'Urgente') { tagColor = '#ffebee'; tagText = '#c62828'; }
            else if (item.categoria === 'Aviso') { tagColor = '#e8f5e9'; tagText = '#2e7d32'; }

            return (
              <Pressable
                key={item.id}
                onPress={() => setExpanded(isOpen ? null : item.id)}
                style={styles.card}
              >
                <View style={styles.cardHeader}>
                  <View style={[styles.badge, { backgroundColor: tagColor }]}>
                    <Text style={[styles.badgeText, { color: tagText }]}>{item.categoria}</Text>
                  </View>
                  <Text style={styles.cardDate}>{dataFormatada}</Text>
                </View>

                <Text style={styles.cardTitle}>{item.titulo}</Text>
                
                <Text style={styles.cardBody} numberOfLines={isOpen ? undefined : 2}>
                  {item.corpo}
                </Text>

                <Text style={styles.cardToggle}>
                  {isOpen ? "Ver menos" : "Ler mais"}
                </Text>
              </Pressable>
            );
          })
        )}
      </ScrollView>

      
      
      
      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setModalVisible(false)} disabled={enviando}>
              <Text style={styles.modalCloseBtnText}>×</Text>
            </TouchableOpacity>

            <Text style={styles.modalTitle}>Publicar Comunicado</Text>
            
            <View style={{ zIndex: 10, elevation: 10, marginBottom: 14 }}>
              <CustomSelect 
                label="Categoria do Aviso" 
                value={novaCategoria} 
                options={catOptions} 
                isOpen={catAberta} 
                onToggle={() => setCatAberta(!catAberta)} 
                onSelect={setNovaCategoria} 
              />
            </View>

            <Input 
              label="Título" 
              placeholder="Ex: Manutenção no Elevador" 
              value={novoTitulo} 
              onChangeText={setNovoTitulo} 
              editable={!enviando} 
            />
            
            <Input 
              label="Mensagem da Circular" 
              placeholder="Descreva os detalhes..." 
              multiline 
              numberOfLines={5} 
              value={novoCorpo} 
              onChangeText={setNovoCorpo} 
              editable={!enviando} 
              style={{ minHeight: 100, textAlignVertical: 'top' }} 
            />
            
            <View style={{ marginTop: 10 }}>
              <Button 
                title={enviando ? "Publicando..." : "Publicar Circular"} 
                icon="send" 
                onPress={handlePublicar} 
                disabled={enviando} 
              />
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.grayBg },
  content: { padding: 16, paddingBottom: 40, gap: 14 },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 },
  pageTitle: { fontFamily: "Montserrat_700Bold", fontSize: 20, color: COLORS.textDark },
  pageSub: { fontFamily: "Montserrat_400Regular", fontSize: 13, marginTop: 2, color: COLORS.textMuted },
  btnAdd: { backgroundColor: COLORS.greenMain, width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', elevation: 2 },
  card: { backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.grayBorder, borderRadius: 16, padding: 16, gap: 8 },
  cardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 },
  badge: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 12 },
  badgeText: { fontFamily: "Montserrat_700Bold", fontSize: 10 },
  cardDate: { fontFamily: "Montserrat_500Medium", fontSize: 11, color: COLORS.textMuted },
  cardTitle: { fontFamily: "Montserrat_700Bold", fontSize: 15, color: COLORS.textDark },
  cardBody: { fontFamily: "Montserrat_400Regular", fontSize: 13, lineHeight: 20, color: COLORS.textMid },
  cardToggle: { fontFamily: "Montserrat_600SemiBold", fontSize: 12, color: COLORS.greenMain, marginTop: 4 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyText: { fontFamily: "Montserrat_400Regular", fontSize: 13, color: COLORS.textMuted },
  
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center' },
  modalCard: { backgroundColor: COLORS.white, borderRadius: 16, marginHorizontal: 14, paddingHorizontal: 18, paddingVertical: 22, position: 'relative' },
  modalCloseBtn: { position: 'absolute', top: 14, right: 16, zIndex: 50 },
  modalCloseBtnText: { color: COLORS.greenMain, fontSize: 20, fontFamily: 'Montserrat_700Bold' },
  modalTitle: { fontFamily: 'Montserrat_700Bold', fontSize: 17, color: COLORS.textDark, marginBottom: 18, paddingRight: 24 },
});
