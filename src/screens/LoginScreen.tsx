
import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '../constants/theme';
import { aplicarMascaraCpf, soNumeros, cpfValido } from '../utils/cpf';
import { ModalBloqueio } from '../components/ModalBloqueio';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { identificarUsuario } from '../services/api'; 
import { AppNavigatorRoutesProps } from '../navigation/types/navigation'; 

export function LoginScreen() {
  const navigation = useNavigation<AppNavigatorRoutesProps>();
  
  const [cpf, setCpf] = useState('');
  const [erro, setErro] = useState(false);
  const [mensagemErro, setMensagemErro] = useState('');
  const [modalBloqueio, setModalBloqueio] = useState(false);
  const [carregando, setCarregando] = useState(false);

  const handleInputChange = (text: string) => {
    setErro(false);
    setCpf(aplicarMascaraCpf(text));
  };

  const executarIdentificacao = async () => {
    const numeros = soNumeros(cpf);
    console.log('[LOGIN] CPF limpo para busca:', numeros);

    
    
    












    try {
      setErro(false);
      setCarregando(true);
      console.log('[LOGIN] Indo buscar via API...');

      const usuario = await identificarUsuario(numeros);
      console.log('[LOGIN] Usuário encontrado no banco!', usuario);

      if (usuario.status === 'bloqueado') {
        setModalBloqueio(true);
      } else {
        navigation.navigate('Password', { 
          nome: usuario.nome, 
          cpfFormatado: cpf,
          cpfLimpo: numeros 
        });
      }
    } catch (error: any) {
      console.error('[LOGIN] Erro:', error.message);
      
      
      if (error.message === 'USUARIO_NAO_ENCONTRADO') {
        setErro(false); 
        setModalBloqueio(true);
      } else {
        
        setErro(true);
        setMensagemErro('Erro de conexão. Tente novamente mais tarde.');
      }
    } finally {
      setCarregando(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topo}>
        <View style={styles.logoRow}>
          <View style={styles.mark}><Text style={styles.markTxt}>A</Text></View>
          <Text style={styles.logoTitle}>Auxiliadora Digital</Text>
        </View>
        <Text style={styles.topoSub}>Bem-vindo(a)! Acesse com seu CPF para entrar no portal e no app.</Text>
      </View>

      <View style={styles.body}>
        <Text style={styles.titulo}>Vamos começar</Text>
        <Text style={styles.sub}>Digite seu CPF para identificarmos sua conta. Unificamos seu acesso em um só lugar.</Text>

        <Input
          label="CPF"
          placeholder="000.000.000-00"
          keyboardType="numeric"
          maxLength={14}
          value={cpf}
          onChangeText={handleInputChange}
          editable={!carregando}
          style={erro ? { borderColor: COLORS.red } : undefined}
        />
        
        {erro && <Text style={styles.erroTxt}>{mensagemErro}</Text>}

        {carregando ? (
          <ActivityIndicator size="small" color={COLORS.greenMain} style={{ marginTop: 24 }} />
        ) : (
          <Button 
            title="Continuar"
            icon="arrow-right"
            onPress={executarIdentificacao}
          />
        )}
      </View>

      <ModalBloqueio 
        visivel={modalBloqueio} 
        aoFechar={() => setModalBloqueio(false)} 
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f3' },
  topo: { backgroundColor: COLORS.greenMain, padding: 24, paddingTop: 40 },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  mark: { width: 32, height: 32, backgroundColor: COLORS.white, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  markTxt: { color: COLORS.greenMain, fontFamily: 'Montserrat_700Bold', fontSize: 17 },
  logoTitle: { color: COLORS.white, fontFamily: 'Montserrat_700Bold', fontSize: 18 },
  topoSub: { color: COLORS.white, fontFamily: 'Montserrat_400Regular', fontSize: 13, marginTop: 12, lineHeight: 18, opacity: 0.95 },
  body: { padding: 24, flex: 1 },
  titulo: { fontFamily: 'Montserrat_700Bold', fontSize: 19, color: '#3a4a42', marginBottom: 6 },
  sub: { fontFamily: 'Montserrat_400Regular', fontSize: 13, color: '#6b7c73', lineHeight: 20, marginBottom: 22 },
  erroTxt: { color: COLORS.red, fontFamily: 'Montserrat_500Medium', fontSize: 12.5, marginTop: 8 },
});
