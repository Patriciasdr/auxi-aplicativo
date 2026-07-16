
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { Alert } from 'react-native';

import { obterModulosPermitidos, normalizarPapel, ModuloApp } from '../config/modules';

interface MenuSheetProps {
  visible: boolean;
  onClose: () => void;
}

export function MenuSheet({ visible, onClose }: MenuSheetProps) {
  const navigation = useNavigation<any>();
  const { logout, condominioAtivo } = useAuth(); 

  const papelAtual = normalizarPapel(condominioAtivo?.papel || 'Morador');

  
  const modulosPermitidos = obterModulosPermitidos(papelAtual);

  
  const modulosPorGrupo = modulosPermitidos.reduce((acc, mod) => {
    if (!acc[mod.g]) acc[mod.g] = [];
    acc[mod.g].push(mod);
    return acc;
  }, {} as Record<string, ModuloApp[]>);

  const navegarPara = async (rota?: string) => {
    onClose(); 
    
    if (rota === 'Sair') {
      await logout(); 
      return;
    }

    if (rota) {
      setTimeout(() => {
        navigation.navigate('Home', { screen: rota });
      }, 150); 
    } else {
      setTimeout(() => Alert.alert('Auxiliadora Digital'), 150);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={styles.sheet} onStartShouldSetResponder={() => true}>
          <View style={styles.sheetHandle} />

          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Menu</Text>
            <View style={styles.sheetRoleBadge}>
              <Text style={styles.sheetRoleText}>{papelAtual}</Text>
            </View>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
            
            
            {Object.keys(modulosPorGrupo).map((grupo) => (
              <React.Fragment key={grupo}>
                <Text style={styles.groupTitle}>{grupo}</Text>
                <View style={styles.groupWrapper}>
                  {modulosPorGrupo[grupo].map((mod) => {
                    const podeNavegar = !mod.stub && Boolean(mod.route);
                    return (
                      <TouchableOpacity
                        key={mod.key}
                        style={styles.sheetItem}
                        onPress={() => podeNavegar && navegarPara(mod.route)}
                        disabled={!podeNavegar}
                        activeOpacity={podeNavegar ? 0.7 : 1}
                      >
                        <Feather
                          name={mod.ic as any}
                          size={18}
                          color={COLORS.greenMain}
                          style={styles.leadIcon}
                        />
                        <Text style={[styles.itemTxt, !podeNavegar && { color: '#bbb' }]}>
                          {mod.nome}
                        </Text>

                        
                        {!mod.stub && podeNavegar && (
                          <View style={styles.badgeNovo}>
                            <Text style={styles.badgeNovoText}>Novo</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}

                </View>
              </React.Fragment>
            ))}

            
            <Text style={styles.groupTitle}>Conta</Text>
            <View style={styles.groupWrapper}>
              <TouchableOpacity style={styles.sheetItem} onPress={() => navegarPara('Perfil')}>
                <Feather name="user" size={18} color={COLORS.greenMain} style={styles.leadIcon} />
                <Text style={styles.itemTxt}>Meu perfil</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.sheetItem, { borderBottomWidth: 0 }]} onPress={() => navegarPara('Sair')}>
                <Feather name="log-out" size={18} color={COLORS.red} style={styles.leadIcon} />
                <Text style={[styles.itemTxt, { color: COLORS.red }]}>Sair</Text>
              </TouchableOpacity>
            </View>

          </ScrollView>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.45)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: COLORS.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '80%', paddingBottom: 20 },
  sheetHandle: { width: 42, height: 5, backgroundColor: COLORS.grayBorder, borderRadius: 3, marginVertical: 10, alignSelf: 'center' },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  sheetTitle: { fontFamily: 'Montserrat_700Bold', fontSize: 15, color: COLORS.textDark },
  sheetRoleBadge: { backgroundColor: COLORS.greenBg, paddingVertical: 2, paddingHorizontal: 9, borderRadius: 10, marginLeft: 6 },
  sheetRoleText: { color: COLORS.greenMain, fontFamily: 'Montserrat_700Bold', fontSize: 10 },
  groupTitle: { fontFamily: 'Montserrat_700Bold', fontSize: 10.5, color: COLORS.greenMain, textTransform: 'uppercase', letterSpacing: 0.5, paddingHorizontal: 18, paddingTop: 14, paddingBottom: 6 },
  groupWrapper: { borderBottomWidth: 1, borderBottomColor: '#f0f0f0', paddingBottom: 4 },
  sheetItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 18, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  leadIcon: { width: 22, textAlign: 'center', marginRight: 12 },
  itemTxt: { flex: 1, fontFamily: 'Montserrat_500Medium', fontSize: 13, color: COLORS.textDark },
  badgeNovo: { backgroundColor: COLORS.greenMain, paddingVertical: 2, paddingHorizontal: 7, borderRadius: 10 },
  badgeNovoText: { color: COLORS.white, fontFamily: 'Montserrat_700Bold', fontSize: 9 }
});
