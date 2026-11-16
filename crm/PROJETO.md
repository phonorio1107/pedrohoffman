# CRM Pedro Hoffman

CRM interno de prospecção. Só o Pedro usa.
Página de teste (dados só no navegador): https://claude.ai/artifact/DXDXtXK2N8wCkNhccwzVr3

## Pronto
- Importar planilha do Outscraper (CSV ou Excel), com as colunas reconhecidas sozinhas.
- Nota de oportunidade de 0 a 100, com os motivos.
- Descarte automático de redes, franquias e lugares fechados; duplicados atualizam em vez de repetir.
- Lista de leads com funil, abas, filtros e exportação.
- Ficha do lead: mensagem pronta (WhatsApp, Direct, E-mail), Abrir no WhatsApp, Copiar, status, próximo passo, observações e histórico.
- Modelos de mensagem editáveis, por nicho e canal.
- Tela Hoje: meta do dia, pilotos ativos e a fila (cobranças, prévias, primeiros contatos).
- Celular: barra com Pular, Copiar e Abrir no WhatsApp; ao voltar, pergunta "Mandou a mensagem?" e segue para o próximo lead.

## Falta
- **Pedro:** criar o Supabase e rodar `supabase/aplicar/01` e depois `02` no SQL Editor.
- **Pedro:** deixar o repositório privado antes de usar com dados reais.
- **Pedro:** publicar no Cloudflare (passos no `README.md`).
- Carteira de clientes (contratos, pagamentos, alertas): quando fechar o primeiro cliente.
- Monitor dos sites dos clientes: depois da carteira.

## Decisões
- Plataforma de cardápio vale +27, igual a "só iFood".
- Redes e franquias são descartadas.
- Nicho ainda em aberto: cada lote recebe o nicho na importação.
- Outscraper: só o Raspador do Google Maps, sem enriquecimento.
- Mensagem termina com uma pergunta, sem palavra-código.
- Alta oportunidade a partir de 65.
- Meta padrão de 12 mensagens por dia; limite de 3 pilotos.
- **Em aberto:** rever os pesos da nota quando o nicho for escolhido (hoje favorecem quem não tem site).
- **Em aberto:** Supabase gratuito ou Pro.
