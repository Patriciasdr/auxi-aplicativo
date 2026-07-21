import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { buscarNotificacoes, marcarNotificacaoLida, NotificacaoItem } from '../services/api';
import { useNavigation } from '@react-navigation/native';

function tempoRelativo(data: string) {
  const minutos = Math.max(0, Math.floor((Date.now() - new Date(data).getTime()) / 60000));
  if (minutos < 1) return 'Agora';
  if (minutos < 60) return `Há ${minutos} min`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `Há ${horas} h`;
  const dias = Math.floor(horas / 24);
  return dias === 1 ? 'Há 1 dia' : `Há ${dias} dias`;
}

export function NotificacoesScreen() {
  const navigation = useNavigation<any>();
  const { token, condominioAtivo, marcarNotificacoesComoLidas, atualizarContadorNotificacoes } = useAuth();
  const [itens, setItens] = useState<NotificacaoItem[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async (refresh = false) => {
    if (!token || !condominioAtivo?.id) return;
    refresh ? setAtualizando(true) : setCarregando(true);
    try {
      setErro(null);
      setItens(await buscarNotificacoes(token, condominioAtivo.id));
      await atualizarContadorNotificacoes();
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
      setErro('Não foi possível carregar as notificações. Verifique a configuração do banco de dados.');
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
  }, [token, condominioAtivo?.id]);

  useEffect(() => { carregar(); }, [carregar]);

  async function marcarUma(item: NotificacaoItem) {
    if (!token) return;
    if (!item.lida) {
      await marcarNotificacaoLida(item.id, token);
      setItens(atuais => atuais.map(n => n.id === item.id ? { ...n, lida: true } : n));
      await atualizarContadorNotificacoes();
    }
    if (item.rota) navigation.navigate(item.rota);
  }

  async function marcarTodas() {
    await marcarNotificacoesComoLidas();
    setItens(atuais => atuais.map(item => ({ ...item, lida: true })));
  }

  const possuiNaoLidas = itens.some(item => !item.lida);

  if (carregando) {
    return <View style={styles.centralizado}><ActivityIndicator size="large" color={COLORS.greenMain} /></View>;
  }

  if (erro) {
    return (
      <View style={styles.centralizado}>
        <Feather name="alert-circle" size={38} color={COLORS.textMuted} />
        <Text style={styles.erroTexto}>{erro}</Text>
        <TouchableOpacity style={styles.tentarNovamente} onPress={() => carregar()}>
          <Text style={styles.tentarNovamenteTexto}>Tentar novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.cabecalho}>
        <View style={{ flex: 1 }}>
          <Text style={styles.titulo}>Notificações</Text>
          <Text style={styles.subtitulo}>Acompanhe os avisos do seu condomínio.</Text>
        </View>
        {possuiNaoLidas && <TouchableOpacity onPress={marcarTodas}><Text style={styles.marcarTodas}>Marcar todas</Text></TouchableOpacity>}
      </View>
      <FlatList
        data={itens}
        keyExtractor={item => item.id}
        contentContainerStyle={[styles.lista, itens.length === 0 && { flex: 1 }]}
        refreshControl={<RefreshControl refreshing={atualizando} onRefresh={() => carregar(true)} colors={[COLORS.greenMain]} />}
        ListEmptyComponent={<View style={styles.vazio}><Feather name="bell-off" size={38} color={COLORS.textMuted} /><Text style={styles.vazioTexto}>Nenhuma notificação</Text></View>}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => marcarUma(item)} style={[styles.cartao, !item.lida && styles.cartaoNaoLido]} activeOpacity={0.75}>
            {!item.lida && <View style={styles.ponto} />}
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={styles.texto}>{item.texto}</Text>
              <Text style={styles.tempo}>{tempoRelativo(item.criadoEm)}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.grayBg },
  centralizado: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.grayBg },
  cabecalho: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 16, paddingBottom: 8 },
  titulo: { fontFamily: 'Montserrat_700Bold', fontSize: 20, color: COLORS.textDark },
  subtitulo: { fontFamily: 'Montserrat_400Regular', fontSize: 13, color: COLORS.textMuted, marginTop: 2 },
  marcarTodas: { fontFamily: 'Montserrat_600SemiBold', fontSize: 12, color: COLORS.greenMain, marginTop: 5 },
  lista: { padding: 16, paddingTop: 8, gap: 10, paddingBottom: 40 },
  cartao: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 14, borderRadius: 14, borderWidth: 1, borderColor: COLORS.grayBorder, backgroundColor: COLORS.white },
  cartaoNaoLido: { backgroundColor: '#e8f5e9', borderColor: '#c8e6c9' },
  ponto: { width: 8, height: 8, borderRadius: 4, marginTop: 5, backgroundColor: COLORS.greenMain },
  texto: { fontFamily: 'Montserrat_500Medium', fontSize: 14, lineHeight: 19, color: COLORS.textDark },
  tempo: { fontFamily: 'Montserrat_400Regular', fontSize: 11, color: COLORS.textMuted },
  vazio: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  vazioTexto: { fontFamily: 'Montserrat_500Medium', fontSize: 13, color: COLORS.textMuted },
  erroTexto: { fontFamily: 'Montserrat_400Regular', fontSize: 13, lineHeight: 19, color: COLORS.textMuted, textAlign: 'center', maxWidth: 300 },
  tentarNovamente: { marginTop: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, backgroundColor: COLORS.greenMain },
  tentarNovamenteTexto: { fontFamily: 'Montserrat_600SemiBold', fontSize: 12, color: COLORS.white }
});
