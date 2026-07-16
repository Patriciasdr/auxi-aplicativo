
import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS } from '../constants/theme';

type Props = { 
  visivel: boolean; 
  aoFechar: () => void;
};

export function ModalBloqueio({ visivel, aoFechar }: Props) {
  return (
    <Modal 
      visible={visivel} 
      transparent 
      animationType="fade" 
      onRequestClose={aoFechar}
      statusBarTranslucent={true} 
    >
      <View style={estilos.overlay}>
        <View style={estilos.modal}>
          
          <View style={estilos.icone}>
            <Text style={{ fontSize: 30 }}>⚠️</Text>
          </View>
          
          <Text style={estilos.titulo}>Atualização de cadastro necessária</Text>
          
          <Text style={estilos.textoPrincipal}>
            Sua conta está cadastrada apenas com e-mail ou nome de usuário, sem um CPF vinculado. Por segurança, precisamos atualizar seu cadastro antes de liberar o acesso.
          </Text>
          
          <View style={estilos.boxInformativo}>
            <Text style={estilos.boxTitulo}>O que fazer agora:</Text>
            
            <Text style={estilos.boxTexto}>
              Entre em contato com o <Text style={estilos.negrito}>gerente da sua unidade</Text> ou com o administrador responsável pelo seu contrato para concluir a atualização.
            </Text>
            
            <View style={estilos.linhaContato}>
              <Text style={estilos.emojiContato}>📞</Text>
              <Text style={estilos.textoContato}>
                Central: <Text style={estilos.destaqueVerde}>0800 000 0000</Text>
              </Text>
            </View>

            <View style={estilos.linhaContato}>
              <Text style={estilos.emojiContato}>✉️</Text>
              <Text style={estilos.textoContato}>atendimento@auxiliadorapredial.com.br</Text>
            </View>
          </View>
          
          <TouchableOpacity style={estilos.btn} onPress={aoFechar}>
            <Text style={estilos.btnTxt}>Entendi</Text>
          </TouchableOpacity>
          
        </View>
      </View>
    </Modal>
  );
}

const estilos = StyleSheet.create({
  overlay: { 
    flex: 1, 
    backgroundColor: 'rgba(15,30,22,0.90)', 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 24 
  },
  modal: { 
    backgroundColor: COLORS.white, 
    borderRadius: 16, 
    padding: 24, 
    alignItems: 'center',
    width: '100%',
    maxWidth: 440,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 5
  },
  icone: { 
    width: 60, 
    height: 60, 
    borderRadius: 30, 
    backgroundColor: '#fff8e6', 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginBottom: 16 
  },
  titulo: { 
    fontSize: 18, 
    fontFamily: 'Montserrat_700Bold', 
    color: '#3a4a42', 
    textAlign: 'center', 
    marginBottom: 12 
  },
  textoPrincipal: { 
    fontSize: 13, 
    fontFamily: 'Montserrat_400Regular',
    color: '#6b7c73', 
    textAlign: 'center', 
    lineHeight: 20, 
    marginBottom: 20,
    paddingHorizontal: 10
  },
  boxInformativo: {
    backgroundColor: '#f1f5f3',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    marginBottom: 24,
  },
  boxTitulo: {
    fontSize: 13,
    fontFamily: 'Montserrat_700Bold',
    color: '#00803f',
    marginBottom: 6,
  },
  boxTexto: {
    fontSize: 12.5,
    fontFamily: 'Montserrat_400Regular',
    color: '#6b7c73',
    lineHeight: 18,
    marginBottom: 14,
  },
  negrito: {
    fontFamily: 'Montserrat_700Bold',
    color: '#00803f',
  },
  linhaContato: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  emojiContato: {
    fontSize: 14,
    marginRight: 8,
  },
  textoContato: {
    
    flex: 1, 
    fontSize: 12,
    fontFamily: 'Montserrat_500Medium',
    color: '#3a4a42',
  },
  destaqueVerde: {
    fontFamily: 'Montserrat_700Bold',
    color: '#00803f',
  },
  btn: { 
    width: '100%', 
    backgroundColor: COLORS.greenMain, 
    borderRadius: 11, 
    padding: 15, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  btnTxt: { 
    color: COLORS.white, 
    fontFamily: 'Montserrat_700Bold', 
    fontSize: 15 
  }
});
