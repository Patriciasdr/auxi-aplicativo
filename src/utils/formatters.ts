export const formatarMoeda = (valor: number = 0) => {
  return valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
};

export const formatarCpfMascarado = (cpfRaw: string = '') => {
  const limpo = cpfRaw.replace(/\D/g, '');
  if (limpo.length !== 11) return 'CPF •••.•••.•••-••';
  return `CPF •••.•••.${limpo.slice(6, 9)}-${limpo.slice(9, 11)}`;
};
