export const PRESENCAS = ['sem_site', 'so_instagram', 'so_ifood', 'plataforma', 'site_proprio'] as const;
export type Presenca = (typeof PRESENCAS)[number];

export const ROTULO_PRESENCA: Record<Presenca, string> = {
  sem_site: 'Sem site',
  so_instagram: 'Só rede social',
  so_ifood: 'Só iFood',
  plataforma: 'Plataforma de cardápio',
  site_proprio: 'Site próprio',
};

export const STATUS = [
  'Novo',
  'Contatado',
  'Respondeu',
  'Prévia enviada',
  'Piloto',
  'Cliente',
  'Descartado',
  'Sem contato',
] as const;
export type Status = (typeof STATUS)[number];

export type Faixa = 'Alta' | 'Média' | 'Baixa';

export interface Motivo {
  texto: string;
  pontos: number;
}

export interface Nicho {
  id: string;
  nome: string;
  ativo: boolean;
}

export interface Lote {
  id: string;
  nome: string;
  nicho_id: string | null;
  arquivo: string;
  criado_em: string;
  total_linhas: number;
  novos: number;
  atualizados: number;
  sem_contato: number;
  descartados: number;
  desfeito_em: string | null;
}

/** Dados que vêm da planilha, já limpos. */
export interface DadosLead {
  nome: string;
  categoria: string | null;
  endereco: string | null;
  bairro: string | null;
  cidade: string | null;
  telefone: string | null;
  telefone_normalizado: string | null;
  whatsapp_provavel: boolean;
  email: string | null;
  site: string | null;
  instagram: string | null;
  facebook: string | null;
  link_maps: string | null;
  place_id: string | null;
  nota_google: number | null;
  avaliacoes: number | null;
  horario: string | null;
  situacao: string | null;
  presenca: Presenca;
  rede: boolean;
  nota_oportunidade: number;
  faixa: Faixa;
  motivos: Motivo[];
}

export interface Lead extends DadosLead {
  id: string;
  lote_id: string | null;
  nicho_id: string | null;
  status: Status;
  motivo_descarte: string | null;
  proximo_passo: string | null;
  data_proximo_passo: string | null;
  observacoes: string | null;
  criado_em: string;
  atualizado_em: string;
}

export const CANAIS = ['WhatsApp', 'Direct', 'E-mail'] as const;
export type Canal = (typeof CANAIS)[number];

export interface Modelo {
  id: string;
  nicho_id: string | null;
  canal: Canal;
  nome: string;
  texto: string;
}

export type TipoEvento = 'importado' | 'atualizado' | 'mensagem enviada' | 'respondeu' | 'prévia enviada' | 'status alterado' | 'observação';

export interface EventoLead {
  id: string;
  lead_id: string;
  tipo: TipoEvento;
  texto: string | null;
  criado_em: string;
}

export type AtualizacaoLead = Partial<Pick<Lead, 'status' | 'motivo_descarte' | 'proximo_passo' | 'data_proximo_passo' | 'observacoes'>>;
