import React, { ComponentProps, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';
import { formatarMoeda } from '../utils/formatters';

type FeatherIconName = ComponentProps<typeof Feather>['name'];

export interface EspacoSelecionavel {
  id: string;
  nome: string;
  capacidade?: string | null;
  valor?: number | null;
  icone?: string | null;
}

interface EspacoSelectorProps<T extends EspacoSelecionavel> {
  espacos: T[];
  selecionado: T | null;
  onSelecionar: (espaco: T) => void;
  onCriarNovo?: () => void;
}

function descricaoEspaco(espaco: EspacoSelecionavel) {
  const detalhes = [
    espaco.capacidade || null,
    (espaco.valor || 0) > 0 ? formatarMoeda(espaco.valor || 0) : 'Gratuito'
  ];

  return detalhes.filter(Boolean).join(' · ');
}

export function EspacoSelector<T extends EspacoSelecionavel>({ espacos, selecionado, onSelecionar, onCriarNovo }: EspacoSelectorProps<T>) {
  const [aberto, setAberto] = useState(false);
  const possuiEspacos = espacos.length > 0;

  const selecionar = (espaco: T) => {
    onSelecionar(espaco);
    setAberto(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Área desejada</Text>
      <TouchableOpacity
        style={[styles.trigger, !possuiEspacos && styles.triggerDisabled]}
        onPress={() => setAberto(true)}
        activeOpacity={0.8}
        disabled={!possuiEspacos}
        accessibilityRole="button"
        accessibilityLabel={selecionado ? `Espaço selecionado: ${selecionado.nome}` : 'Selecionar espaço para reserva'}
        accessibilityHint="Abre a lista de espaços disponíveis"
      >
        <View style={[styles.triggerIcon, selecionado && styles.triggerIconSelected]}>
          <Feather
            name={(selecionado?.icone || 'map-pin') as FeatherIconName}
            size={19}
            color={selecionado ? COLORS.white : COLORS.greenMain}
          />
        </View>
        <View style={styles.triggerTextArea}>
          <Text style={[styles.triggerText, !selecionado && styles.placeholder]} numberOfLines={1}>
            {selecionado?.nome || (possuiEspacos ? 'Selecione um espaço' : 'Nenhum espaço disponível')}
          </Text>
          <Text style={styles.triggerSubtext} numberOfLines={1}>
            {selecionado ? descricaoEspaco(selecionado) : 'Toque para consultar as opções'}
          </Text>
        </View>
        <Feather name="chevron-down" size={20} color={possuiEspacos ? COLORS.textMid : COLORS.textMuted} />
      </TouchableOpacity>

      {onCriarNovo && (
        <TouchableOpacity
          style={styles.createButton}
          onPress={onCriarNovo}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Cadastrar novo espaço"
        >
          <Feather name="plus-circle" size={16} color={COLORS.greenMain} />
          <Text style={styles.createButtonText}>Cadastrar novo espaço</Text>
        </TouchableOpacity>
      )}

      <Modal
        visible={aberto}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setAberto(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.backdrop} onPress={() => setAberto(false)} accessible={false} />
          <View style={styles.sheet}>
            <View style={styles.handle} />
            <View style={styles.sheetHeader}>
              <View style={styles.sheetTitleArea}>
                <Text style={styles.sheetTitle}>Selecione a área desejada</Text>
                <Text style={styles.sheetSubtitle}>Escolha um espaço para consultar detalhes e datas.</Text>
              </View>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setAberto(false)}
                accessibilityRole="button"
                accessibilityLabel="Fechar seleção de espaços"
              >
                <Feather name="x" size={20} color={COLORS.textMid} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={espacos}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const ativo = selecionado?.id === item.id;

                return (
                  <TouchableOpacity
                    style={[styles.option, ativo && styles.optionSelected]}
                    onPress={() => selecionar(item)}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityState={{ selected: ativo }}
                  >
                    <View style={[styles.optionIcon, ativo && styles.optionIconSelected]}>
                      <Feather
                        name={(item.icone || 'home') as FeatherIconName}
                        size={20}
                        color={ativo ? COLORS.white : COLORS.greenMain}
                      />
                    </View>
                    <View style={styles.optionTextArea}>
                      <Text style={styles.optionTitle}>{item.nome}</Text>
                      <Text style={styles.optionSubtitle}>{descricaoEspaco(item)}</Text>
                    </View>
                    <View style={[styles.check, ativo && styles.checkSelected]}>
                      {ativo && <Feather name="check" size={14} color={COLORS.white} />}
                    </View>
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 18 },
  label: { fontFamily: 'Montserrat_600SemiBold', fontSize: 12, color: COLORS.textMid, marginBottom: 7 },
  trigger: { minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: 11, paddingHorizontal: 13, paddingVertical: 10, borderWidth: 1.5, borderColor: COLORS.greenMain, borderRadius: 12, backgroundColor: COLORS.white },
  triggerDisabled: { borderColor: COLORS.grayBorder, backgroundColor: '#f7f7f7' },
  triggerIcon: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.greenBg },
  triggerIconSelected: { backgroundColor: COLORS.greenMain },
  triggerTextArea: { flex: 1, minWidth: 0 },
  triggerText: { fontFamily: 'Montserrat_600SemiBold', fontSize: 13, color: COLORS.textDark },
  placeholder: { color: COLORS.textMid },
  triggerSubtext: { fontFamily: 'Montserrat_400Regular', fontSize: 10.5, color: COLORS.textMuted, marginTop: 3 },
  createButton: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, paddingVertical: 7 },
  createButtonText: { fontFamily: 'Montserrat_600SemiBold', fontSize: 11.5, color: COLORS.greenMain },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
  backdrop: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
  sheet: { width: '100%', maxWidth: 620, maxHeight: '78%', alignSelf: 'center', backgroundColor: COLORS.white, borderTopLeftRadius: 22, borderTopRightRadius: 22, paddingBottom: 18, overflow: 'hidden' },
  handle: { width: 42, height: 4, borderRadius: 2, backgroundColor: '#d6d6d6', alignSelf: 'center', marginTop: 9 },
  sheetHeader: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 18, paddingTop: 14, paddingBottom: 13, borderBottomWidth: 1, borderBottomColor: COLORS.grayBorder },
  sheetTitleArea: { flex: 1, paddingRight: 12 },
  sheetTitle: { fontFamily: 'Montserrat_700Bold', fontSize: 16, color: COLORS.textDark },
  sheetSubtitle: { fontFamily: 'Montserrat_400Regular', fontSize: 11, lineHeight: 16, color: COLORS.textMuted, marginTop: 4 },
  closeButton: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.grayBg },
  listContent: { paddingHorizontal: 14, paddingTop: 12, paddingBottom: 6, gap: 9 },
  option: { minHeight: 66, flexDirection: 'row', alignItems: 'center', gap: 11, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: COLORS.grayBorder, borderRadius: 12, backgroundColor: COLORS.white },
  optionSelected: { borderColor: COLORS.greenMain, backgroundColor: COLORS.greenBg },
  optionIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.greenBg },
  optionIconSelected: { backgroundColor: COLORS.greenMain },
  optionTextArea: { flex: 1, minWidth: 0 },
  optionTitle: { fontFamily: 'Montserrat_600SemiBold', fontSize: 13, color: COLORS.textDark },
  optionSubtitle: { fontFamily: 'Montserrat_400Regular', fontSize: 10.5, color: COLORS.textMuted, marginTop: 4 },
  check: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: COLORS.grayBorder, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.white },
  checkSelected: { borderColor: COLORS.greenMain, backgroundColor: COLORS.greenMain }
});
