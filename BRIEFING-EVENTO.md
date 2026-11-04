# Briefing de evento

O formulário fica na rota `https://www.fdejesus.com.br/briefing-evento/`, dentro do mesmo deploy Netlify do portfólio. Não há link para ele no menu, no rodapé ou no sitemap. A página usa `noindex,nofollow`, e a Netlify acrescenta `X-Robots-Tag` para essa rota. Quem souber o endereço ainda consegue abri-la; o link não é uma proteção por senha.

## Envio do PDF

Ao finalizar, o navegador chama a função `netlify/functions/submit-briefing.mjs`. Ela valida as respostas, gera o PDF e envia o anexo via Brevo para `dejesusfilms@gmail.com`. A tela de sucesso só aparece quando a API de e-mail aceita a mensagem. Depois, o cliente pode escolher compartilhar o PDF pelo WhatsApp no menu do aparelho; se o navegador não oferecer compartilhamento de arquivos, o PDF é baixado para anexar manualmente.

Antes de publicar, configurar na interface da Netlify as variáveis abaixo, disponíveis para **Functions**. No plano gratuito, o escopo padrão já as inclui; nos planos que permitem escolher escopos, selecionar **Functions**:

- `BREVO_API_KEY`: chave de API do Brevo com permissão de envio transacional.
- `BREVO_SENDER_EMAIL`: e-mail de remetente verificado no Brevo.

### Ativação

1. Criar uma [conta Brevo](https://www.brevo.com/) e [verificar um remetente](https://help.brevo.com/hc/en-us/articles/208836149-Create-a-new-sender-From-name-and-From-email). Pode ser `dejesusfilms@gmail.com` se o titular conseguir confirmar o código recebido nele. Sem autenticação do domínio, o Brevo pode substituir o endereço de remetente exibido; isso não altera o destinatário do briefing.
2. Em **Settings → SMTP & API → API Keys & MCP**, [criar uma chave](https://help.brevo.com/hc/en-us/articles/40159485019794-Create-and-manage-your-API-keys) restrita ao recurso **Transactional email: All**. Copiar a chave no momento da criação; ela não pode ser consultada depois.
3. No projeto do portfólio na Netlify, abrir **Environment variables** e definir `BREVO_API_KEY` e `BREVO_SENDER_EMAIL` com o mesmo e-mail verificado no passo 1. Fazer novo deploy depois de salvar as variáveis.

Não colocar a chave no repositório, em `netlify.toml` ou no JavaScript do navegador. Testar um envio real em um deploy de prévia, confirmar o recebimento em `dejesusfilms@gmail.com` e abrir o PDF. O teste local `npm run test:briefing` simula a resposta do Brevo sem transmitir dados reais.

## Código

- `public/briefing-evento/`: página, estilos, script e logos.
- `netlify/lib/briefingCore.js`: validação e geração do PDF.
- `netlify/functions/submit-briefing.mjs`: endpoint e envio de e-mail.
- `scripts/test-briefing.mjs`: teste da função e do anexo.

`npm run build` copia a página para `dist/briefing-evento/`. A verificação de produção exige que ela continue ausente da página inicial e do sitemap.
