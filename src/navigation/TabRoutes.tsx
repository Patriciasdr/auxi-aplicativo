import React, { useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaView } from 'react-native';
import { COLORS } from '../constants/theme';
import { HomeScreen } from '../screens/HomeScreen';
import { BoletosScreen } from '../screens/BoletosScreen'; 
import { ReservasScreen } from '../screens/ReservasScreen';
import { DashboardScreen } from '../screens/DashboardScreen';
import { SegundaViaJurosScreen } from '../screens/SegundaViaJurosScreen';
import { JuridicoScreen } from '../screens/JuridicoScreen';
import { ReparosScreen } from '../screens/ReparosScreen';
import { AgendaMudancasScreen } from '../screens/AgendaMudancasScreen';
import { ContatoCDScreen } from '../screens/ContatoCDScreen';
import { CircularesScreen } from '../screens/CircularesScreen'; 
import { AgendaCondominioScreen } from '../screens/AgendaCondominioScreen'; 
import { PerfilScreen } from '../screens/PerfilScreen';
import { NotificacoesScreen } from '../screens/NotificacoesScreen';
import { MenuSheet } from '../components/MenuSheet'; 
import { GlobalHeader } from '../components/GlobalHeader';
import { Subnav } from '../components/Subnav';
import { CustomTabBar } from '../components/CustomTabBar';
import { useAuth } from '../context/AuthContext';
import { normalizarPapel, obterModulosPermitidos } from '../config/modules';

const Tab = createBottomTabNavigator();

export function TabRoutes() {
  const [menuAberto, setMenuAberto] = useState(false);
  const { condominioAtivo } = useAuth();

  const papelAtual = normalizarPapel(condominioAtivo?.papel || 'Morador');
  const modulosPermitidos = obterModulosPermitidos(papelAtual);
  const rotasPermitidas = new Set(
    modulosPermitidos
      .filter(modulo => !modulo.stub && modulo.route)
      .map(modulo => modulo.route)
  );
  const podeAcessarBoletos = rotasPermitidas.has('BoletosTab');

  return (
    <>
      <Tab.Navigator
        id="MainTabs"
        tabBar={(props) => <CustomTabBar {...props} setMenuAberto={setMenuAberto} />}
        
        backBehavior="history" 
        
        screenOptions={({ route }) => ({
          header: ({ options }) => {
            const isHome = route.name === 'HomeTab';
            const tituloDaTela = options.title || route.name;

            return (
              <SafeAreaView style={{ backgroundColor: COLORS.greenMain }}>
                <GlobalHeader showBackArrow={!isHome} />
                {!isHome && <Subnav title={tituloDaTela} />}
              </SafeAreaView>
            );
          }
        })}
      >
        <Tab.Screen name="HomeTab" component={HomeScreen} options={{ title: 'Início' }} />
        {rotasPermitidas.has('BoletosTab') && <Tab.Screen name="BoletosTab" component={BoletosScreen} options={{ title: 'Boletos' }} />}
        {rotasPermitidas.has('DashboardTab') && <Tab.Screen name="DashboardTab" component={DashboardScreen} options={{ title: 'Dashboard gerencial' }} />}
        {rotasPermitidas.has('Reservas') && <Tab.Screen name="Reservas" component={ReservasScreen} options={{ title: 'Reserva de espaços' }} />}
        {podeAcessarBoletos && <Tab.Screen name="SegundaViaJuros" component={SegundaViaJurosScreen} options={{ title: '2ª via com juros' }} />}
        {podeAcessarBoletos && <Tab.Screen name="Juridico" component={JuridicoScreen} options={{ title: 'Contato jurídico' }} />}
        {rotasPermitidas.has('Reparos') && <Tab.Screen name="Reparos" component={ReparosScreen} options={{ title: 'Solicitação de reparos' }} />}
        {rotasPermitidas.has('AgendaMudancas') && <Tab.Screen name="AgendaMudancas" component={AgendaMudancasScreen} options={{ title: 'Agenda de mudanças' }} />}
        {rotasPermitidas.has('ContatoCD') && <Tab.Screen name="ContatoCD" component={ContatoCDScreen} options={{ title: 'Fale com o Corpo Diretivo' }} />}
        
        {rotasPermitidas.has('Circulares') && <Tab.Screen name="Circulares" component={CircularesScreen} options={{ title: 'Circulares' }} />}
        
        
        {rotasPermitidas.has('AgendaCondominio') && <Tab.Screen name="AgendaCondominio" component={AgendaCondominioScreen} options={{ title: 'Agenda do Condomínio' }} />}
        
        <Tab.Screen name="Perfil" component={PerfilScreen} options={{ title: 'Meu perfil' }} />
        <Tab.Screen name="Notificacoes" component={NotificacoesScreen} options={{ title: 'Notificações' }} />
      </Tab.Navigator>

      <MenuSheet visible={menuAberto} onClose={() => setMenuAberto(false)} />
    </>
  );
}
