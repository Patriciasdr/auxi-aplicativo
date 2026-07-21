
import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ActivityIndicator, TouchableOpacity, Keyboard } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList, AppNavigatorRoutesProps } from '../navigation/types/navigation'; 
import { useAuth } from '../context/AuthContext';
import { COLORS } from '../constants/theme';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { formatarCpfMascarado } from '../utils/formatters';


type PasswordRouteProp = RouteProp<RootStackParamList, 'Password'>;

export function PasswordScreen() {
  
  const navigation = useNavigation<AppNavigatorRoutesProps>();
  const route = useRoute<PasswordRouteProp>();
  
  const { login } = useAuth();

  
  const { nome, cpfFormatado, cpfLimpo } = route.params || {};

  const [senha, setSenha] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const handleEntrar = async () => {
    setErro(null);
    
    if (!cpfLimpo) {
      setErro('Erro ao recuperar identificação. Volte e digite o CPF novamente.');
      return;
    }

    if (!senha.trim()) {
      setErro('Por favor, informe sua senha.');
      return;
    }

    try {
      setCarregando(true);
      Keyboard.dismiss(); 
      
      await login(cpfLimpo, senha);
    } catch (e: any) {
      if (e.message === 'CONTA_BLOQUEADA') {
        setErro('Sua conta está bloqueada para este canal. Entre em contato com o suporte.');
      } else {
        setErro('Credenciais inválidas. Verifique sua senha.');
      }
    } finally {
      setCarregando(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#00A859', '#00803f']} style={styles.topo}>
        <View style={styles.logoContainer}>
          <View style={styles.mark}><Text style={styles.markText}>A</Text></View>
          <Text style={styles.logoText}>Auxiliadora Digital</Text>
        </View>
        <Text style={styles.topoDesc}>
          Estamos quase lá. Confirme sua senha para acessar.
        </Text>
      </LinearGradient>

      <View style={styles.body}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>← Trocar conta</Text>
        </TouchableOpacity>

        <View style={styles.userChip}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{nome ? nome[0].toUpperCase() : '?'}</Text>
          </View>
          <View>
            <Text style={styles.greeting}>Olá, <Text style={styles.userName}>{nome || 'Morador'}</Text></Text>
            <Text style={styles.userCpf}>{formatarCpfMascarado(cpfLimpo || cpfFormatado)}</Text>
          </View>
        </View>

        <Text style={styles.title}>Confirme sua identidade</Text>
        <Text style={styles.subtitle}>
          Sua conta foi reconhecida. Informe sua senha cadastrada para prosseguir.
        </Text>

        {erro && <Text style={styles.erroTxt}>{erro}</Text>}

        <Input
          label="Senha"
          isPassword
          placeholder="********"
          value={senha}
          onChangeText={(txt) => {
            setErro(null);
            setSenha(txt);
          }}
          editable={!carregando}
          style={erro ? { borderColor: COLORS.red } : undefined}
        />

        {carregando ? (
          <ActivityIndicator size="small" color={COLORS.greenMain} style={{ marginVertical: 20 }} />
        ) : (
          <Button
            title="Entrar"
            icon="log-in"
            onPress={handleEntrar}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  
  container: { flex: 1, backgroundColor: '#f1f5f3' },
  topo: { paddingTop: 40, paddingHorizontal: 24, paddingBottom: 22 },
  logoContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  mark: { width: 32, height: 32, backgroundColor: COLORS.white, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  markText: { color: '#00A859', fontFamily: 'Montserrat_700Bold', fontSize: 17 },
  logoText: { color: COLORS.white, fontFamily: 'Montserrat_700Bold', fontSize: 18 },
  topoDesc: { color: COLORS.white, fontFamily: 'Montserrat_400Regular', fontSize: 13, lineHeight: 18, opacity: 0.95 },
  body: { flex: 1, paddingHorizontal: 24, paddingTop: 20 },
  backButton: { marginBottom: 16 },
  backButtonText: { fontFamily: 'Montserrat_600SemiBold', fontSize: 12.5, color: '#6b7c73' },
  userChip: { flexDirection: 'row', backgroundColor: '#e7f7ee', borderRadius: 11, padding: 12, alignItems: 'center', marginBottom: 20 },
  avatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#00A859', alignItems: 'center', justifyContent: 'center', marginRight: 11 },
  avatarText: { color: COLORS.white, fontFamily: 'Montserrat_700Bold', fontSize: 14 },
  greeting: { fontFamily: 'Montserrat_400Regular', fontSize: 13, color: COLORS.textDark },
  userName: { fontFamily: 'Montserrat_700Bold' },
  userCpf: { fontFamily: 'Montserrat_400Regular', fontSize: 11.5, color: '#6b7c73', marginTop: 2 },
  title: { fontFamily: 'Montserrat_700Bold', fontSize: 19, color: '#3a4a42', marginBottom: 6 },
  subtitle: { fontFamily: 'Montserrat_400Regular', fontSize: 13, color: '#6b7c73', lineHeight: 19, marginBottom: 22 },
  erroTxt: { color: COLORS.red, fontFamily: 'Montserrat_600SemiBold', fontSize: 13, marginBottom: 10 },
});
