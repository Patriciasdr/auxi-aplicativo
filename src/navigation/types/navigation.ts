import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BoletoProps } from '../../components/BoletoCard';

export type RootStackParamList = {
  Login: undefined;
  Password: { nome: string; cpfFormatado: string; cpfLimpo: string };
  CondoSelection: undefined;
  Home: undefined;
  HomeTab: undefined;
  DashboardTab: undefined;
  Perfil: undefined;
  SegundaViaJuros: { boleto: BoletoProps };
  Juridico: { boleto: BoletoProps };
  Circulares: undefined;
  AgendaCondominio: undefined;
  Notificacoes: undefined;
};

export type AppNavigatorRoutesProps = NativeStackNavigationProp<RootStackParamList>;
