/**
 * Campos do lead e os nomes de coluna que cada ferramenta usa.
 * Hoje reconhece o Outscraper (Raspador do Google Maps) e nomes comuns em português.
 */
export const CAMPOS = [
  { chave: 'nome', rotulo: 'Nome', obrigatorio: true, nomes: ['name', 'nome', 'title', 'business_name', 'empresa', 'nome_da_empresa', 'titulo'] },
  { chave: 'categoria', rotulo: 'Categoria', nomes: ['type', 'category', 'categoria', 'subtypes', 'tipo', 'main_category'] },
  { chave: 'endereco', rotulo: 'Endereço', nomes: ['address', 'full_address', 'endereco', 'endereco_completo'] },
  { chave: 'bairro', rotulo: 'Bairro', nomes: ['county', 'borough', 'neighborhood', 'bairro'] },
  { chave: 'cidade', rotulo: 'Cidade', nomes: ['city', 'cidade', 'municipio'] },
  { chave: 'telefone', rotulo: 'Telefone', nomes: ['phone', 'telefone', 'phone_number', 'phones', 'telefones', 'contact_phone', 'celular', 'whatsapp'] },
  { chave: 'email', rotulo: 'E-mail', nomes: ['email', 'e_mail', 'emails', 'email_1', 'emails_1'] },
  { chave: 'site', rotulo: 'Site', nomes: ['website', 'site', 'url', 'web', 'website_url', 'pagina'] },
  { chave: 'instagram', rotulo: 'Instagram', nomes: ['instagram', 'company_instagram', 'instagram_url'] },
  { chave: 'facebook', rotulo: 'Facebook', nomes: ['facebook', 'company_facebook', 'facebook_url'] },
  { chave: 'link_maps', rotulo: 'Link do Maps', nomes: ['location_link', 'google_maps_url', 'maps_url', 'link', 'link_maps', 'url_maps', 'google_maps_link'] },
  { chave: 'place_id', rotulo: 'ID do Google', nomes: ['place_id', 'google_id', 'cid', 'id_google'] },
  { chave: 'nota_google', rotulo: 'Nota no Google', nomes: ['rating', 'nota', 'avaliacao', 'stars', 'estrelas', 'nota_google'] },
  { chave: 'avaliacoes', rotulo: 'Avaliações', nomes: ['reviews', 'reviews_count', 'avaliacoes', 'numero_de_avaliacoes', 'total_reviews'] },
  { chave: 'horario', rotulo: 'Horário', nomes: ['working_hours_csv_compatible', 'working_hours', 'horario', 'horario_de_funcionamento', 'hours'] },
  { chave: 'situacao', rotulo: 'Situação no Maps', nomes: ['business_status', 'status', 'situacao'] },
  { chave: 'rede', rotulo: 'É rede?', nomes: ['chain_info.chain', 'chain_info_chain', 'chain', 'rede', 'franquia'] },
] as const;

export type CampoChave = (typeof CAMPOS)[number]['chave'];
/** Para cada campo, o nome da coluna da planilha (ou null se não houver). */
export type Mapa = Record<CampoChave, string | null>;

export function normalizarNome(nome: string): string {
  return nome
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9.]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

/** Liga cada campo à primeira coluna cujo nome bate, na ordem de preferência de `nomes`. */
export function mapearColunas(cabecalhos: string[]): Mapa {
  const porNome = new Map<string, string>();
  for (const c of cabecalhos) {
    const n = normalizarNome(c);
    if (!porNome.has(n)) porNome.set(n, c);
  }
  const usadas = new Set<string>();
  const mapa = {} as Mapa;
  for (const campo of CAMPOS) {
    let achada: string | null = null;
    for (const nome of campo.nomes) {
      const original = porNome.get(normalizarNome(nome));
      if (original && !usadas.has(original)) {
        achada = original;
        break;
      }
    }
    if (achada) usadas.add(achada);
    mapa[campo.chave] = achada;
  }
  return mapa;
}
