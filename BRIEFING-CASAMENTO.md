# Briefing de casamento

O formulário fica na rota `https://www.fdejesus.com.br/briefing-casamento/`, dentro do mesmo deploy Netlify do portfólio. Não há link para ele no menu, no rodapé ou no sitemap. A página usa `noindex,nofollow`, e a Netlify acrescenta `X-Robots-Tag` para essa rota. Quem souber o endereço ainda consegue abri-la; o link não é uma proteção por senha.

## Envio do PDF

Ao finalizar, o navegador chama a função `netlify/functions/submit-briefing.mjs`. Ela valida as respostas, gera o PDF e envia o anexo via SendGrid para `dejesusfilms@gmail.com`. A tela de sucesso só aparece quando a API de e-mail aceita a mensagem. Depois, o casal pode escolher compartilhar o PDF pelo WhatsApp no menu do aparelho; se o navegador não oferecer compartilhamento de arquivos, o PDF é baixado para anexar manualmente.

Antes de publicar, configurar na interface da Netlify as variáveis abaixo, disponíveis para **Functions**. No plano gratuito, o escopo padrão já as inclui; nos planos que permitem escolher escopos, selecionar **Functions**:

- `SENDGRID_API_KEY`: chave SendGrid com permissão de envio.
- `SENDGRID_SENDER_EMAIL`: e-mail de remetente verificado no SendGrid.

Não colocar a chave no repositório, em `netlify.toml` ou no JavaScript do navegador. Testar um envio real em um deploy de prévia, confirmar o recebimento em `dejesusfilms@gmail.com` e abrir o PDF. O teste local `npm run test:briefing` simula a resposta do SendGrid sem transmitir dados reais.

## Código

- `public/briefing-casamento/`: página, estilos, script e logos.
- `netlify/lib/briefingCore.js`: validação e geração do PDF.
- `netlify/functions/submit-briefing.mjs`: endpoint e envio de e-mail.
- `scripts/test-briefing.mjs`: teste da função e do anexo.

`npm run build` copia a página para `dist/briefing-casamento/`. A verificação de produção exige que ela continue ausente da página inicial e do sitemap.
