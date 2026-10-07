# Preparação para Netlify — 7 de outubro de 2026

**O código, a configuração e o build de produção estão preparados. A publicação permanece pendente de uma decisão sobre os vídeos pesados.** Não há bloqueio de check/build, mas não considero a entrega das mídias pelo Netlify suficientemente validada para recomendar publicação imediata: há risco de upload/CDN e buffering em rede lenta. Nenhum deploy, conexão de conta, envio ao GitHub, alteração de domínio ou DNS foi executado.

O visual e o conteúdo foram explicitamente aprovados pelo usuário. Os títulos genéricos atuais foram mantidos; clientes e créditos não informados continuam omitidos. O institucional não foi fornecido: seu cartão temporário fica fora da produção. Os 6 projetos reais e os 5 exemplos reais de serviços permanecem presentes. Nenhum vídeo foi alterado, comprimido ou excluído nesta preparação.

## Domínio e metadados

Domínio principal já existente no projeto, mantido sem alteração: **https://www.fdejesus.com.br**.

| Local | Uso |
| --- | --- |
| public/data/portfolio.json → site.domain | Fonte do domínio; site.preview agora false. Aprovação registrada em contentApproved/contentApprovalDate. |
| scripts/build.mjs | Lê o domínio para gerar canonical, Open Graph, Twitter Card, robots e sitemap. |
| dist/index.html | Canonical e og:url com https://www.fdejesus.com.br/; imagens sociais absolutas no mesmo domínio. Title, description, idioma pt-BR, og:locale pt_BR e tema preservados. |
| dist/robots.txt | Allow: / e Sitemap: https://www.fdejesus.com.br/sitemap.xml. |
| dist/sitemap.xml | Uma URL principal: https://www.fdejesus.com.br/. As seções usam âncoras, não páginas independentes. |
| netlify.toml | Regras preparadas para HTTP e fdejesus.com.br sem www redirecionarem para HTTPS/www. |
| README.md e deJesus_Films_Briefing_Codex.md | Documentação do domínio e do processo. |

O HTML final de dist não contém avisos de prévia nem noindex/nofollow. Robots usa index, follow; não há X-Robots-Tag restritivo na configuração. Os espaços temporários, flags editoriais e pendências de manutenção são retirados do JSON de produção. O JavaScript continua suportando o modo de prévia, mas esse modo está desativado na produção e seus avisos não são renderizados. public/index.html continua sendo a fonte com suporte à prévia; o arquivo a publicar é dist/index.html.

Open Graph/Twitter Card usam assets/covers/social-preview.jpg, JPEG de 1200 × 630 px e 56.027 bytes, derivado da capa já existente do showreel. A imagem foi conferida visualmente. Nenhuma foto ou vídeo aprovado foi substituído.

## Netlify

- Build: npm run build. Pasta de publicação: dist. Node 24 fixado em netlify.toml e compatível com package.json.
- TOML analisado por parser. Três regras 301 com force: HTTP do domínio raiz, HTTPS do domínio raiz e HTTP de www → https://www.fdejesus.com.br/:splat. Caminhos são preservados; não há regra de retorno que cause loop. Parâmetros de consulta são encaminhados pelo Netlify. [Configuração e redirecionamentos](https://docs.netlify.com/build/configure-builds/file-based-configuration/), [opções de redirect](https://docs.netlify.com/manage/routing/redirects/redirect-options/).
- Sem rewrite global de SPA: é uma página estática com navegação por âncoras. Caminhos inexistentes devem continuar retornando 404.
- Segurança: X-Content-Type-Options, X-Frame-Options, Referrer-Policy, CSP, Permissions-Policy e HSTS. CSP permite os arquivos locais, vídeos HTTPS e os dois provedores de embed suportados no código. As políticas do documento foram aplicadas aos testes locais no Chrome para conferir compatibilidade com os players atuais.
- Cache do navegador: HTML, JS, CSS, JSON, robots e sitemap revalidam (max-age=0); assets usam max-age=3600 e must-revalidate. Não foi usado immutable porque os arquivos têm nomes sem hash. [Cabeçalhos no Netlify](https://docs.netlify.com/manage/routing/headers/).

Os cabeçalhos, redirects e HTTPS da infraestrutura real deverão ser conferidos depois de um deploy autorizado. Nenhuma regra em netlify.toml conecta ou altera DNS. Não foi inventado um subdomínio netlify.app.

## Testes concluídos nesta preparação

| Verificação | Resultado |
| --- | --- |
| npm run check | Passou: dados, arquivos, IDs, contatos, referências e sintaxe. |
| npm run build | Passou; dist gerado e verificado automaticamente. |
| verify-production.mjs, executado pelo build | Indexação/metadados corretos, projetos e exemplos preservados, links internos existentes, nenhum arquivo inesperado e assets idênticos às fontes. |
| test-local.mjs com TEST_ROOT=dist e PREVIEW_URL de 4174 | Passou: inicialização, 11 players, exclusividade, áudio habilitado, fechamento, foto, serviços, menu, links, fallback e HTTP 206/Range. |
| test-browser.mjs diretamente em dist | Passou em 360, 390, 768 e 1440 px; nenhum erro JavaScript registrado. |
| Carrossel | Quatro trocas reais consecutivas em cada largura, repetição, todos os trabalhos, setas, teclado, arraste, toque, retomada e redução de movimento. |
| Vídeos | 22 reproduções de trechos dos 11 arquivos, em desktop e celular emulado; faixa de áudio detectada via Web Audio. Volume/pausa/retomada exercitados pela API; controles nativos habilitados. Tela cheia exercitada no vídeo para marcas em ambas as dimensões. |
| Fechamento | Botão, Esc e clique fora verificados; nenhum player de projeto/serviço permaneceu reproduzindo após fechar. |
| Fundo | Autoplay, primeiro ciclo completo natural, loop, silêncio permanente, pausa/retomada e imagem alternativa passaram. As duas versões não têm faixa de áudio. |
| Conteúdo/links | 6 projetos, 5 serviços, 5 exemplos, foto e capas carregam. Âncoras e menu funcionam. Todos os contatos usam 5575988796387 com mensagem; nenhuma mensagem foi enviada. |
| Layout | Duas colunas no desktop e sequência vertical no celular; horizontais centralizados, foto proporcional e sem rolagem horizontal. Capturas inspecionadas. |
| Auditoria de produção/Git | TOML, inventário, exclusões, padrões de credenciais e preservação por SHA-256 conferidos. |

Foi corrigido um erro que apareceria somente na produção: o código removia o banner de prévia sem verificar se ele já havia sido retirado pelo build. A remoção agora aceita sua ausência, permitindo iniciar fundo e foto. Carrossel, estilos e comportamentos aprovados não foram redesenhados.

Os testes móveis são emulados no Chrome com toque nativo, não em aparelho físico. Safari/iOS, Firefox, DNS público, certificado, CDN, compartilhamento em aplicativos reais e upload no Netlify ainda não foram testados. Não foi feita escuta humana integral dos filmes. A falha isolada de timing registrada na revisão anterior foi preservada em VERIFICACAO.md; a rodada atual de produção passou integralmente.

## Tamanhos e vídeos em uso

Unidades decimais: 1 MB = 1.000.000 bytes. Valores são soma dos tamanhos lógicos dos arquivos.

| Conjunto | Bytes | MB |
| --- | ---: | ---: |
| public/assets | 171.871.665 | 171,87 |
| dist completo | 171.943.773 | 171,94 |
| 13 vídeos usados pelo site | 171.191.825 | 171,19 |
| 12 vídeos originais em materiais, excluídos do Git/build | 2.767.149.769 | 2.767,15 |

Todos os vídeos de public/assets/videos e suas cópias idênticas em dist/assets/videos:

| Arquivo | Bytes | MB | Duração (s) | Taxa média (Mbps) |
| --- | ---: | ---: | ---: | ---: |
| campanha.mp4 | 6.269.968 | 6,27 | 51,735 | 0,97 |
| evento-horizontal.mp4 | 46.813.925 | 46,81 | 100,170 | 3,74 |
| evento-vertical.mp4 | 11.030.674 | 11,03 | 52,408 | 1,68 |
| marcas.mp4 | 7.963.811 | 7,96 | 51,502 | 1,24 |
| melhores-momentos.mp4 | 10.170.914 | 10,17 | 55,775 | 1,46 |
| realtime.mp4 | 4.482.975 | 4,48 | 25,519 | 1,41 |
| servico-anuncios.mp4 | 13.687.961 | 13,69 | 52,687 | 2,08 |
| servico-edicao.mp4 | 17.349.626 | 17,35 | 64,181 | 2,16 |
| servico-filmmaker.mp4 | 12.058.237 | 12,06 | 56,913 | 1,69 |
| servico-social.mp4 | 11.504.952 | 11,50 | 49,389 | 1,86 |
| servico-storymaker.mp4 | 8.150.271 | 8,15 | 15,953 | 4,09 |
| showreel-desktop.mp4 | 18.368.490 | 18,37 | 27,634 | 5,32 |
| showreel-mobile.mp4 | 3.340.021 | 3,34 | 27,634 | 0,97 |

Os 13 arquivos usam H.264; os 11 projetos/exemplos têm AAC e os dois fundos não têm áudio. Taxa média considera tamanho/duração do arquivo inteiro; picos podem ser maiores. Os projetos são carregados sob demanda, mas o fundo inicia automaticamente.

## Riscos e decisão pendente sobre mídias

Há oito arquivos acima de 10 MB decimais: horizontal, evento vertical, melhores momentos, anúncios, edição, filmmaker, social e fundo desktop. A documentação oficial alerta que arquivos grandes podem prejudicar a CDN e falhar no upload; isso é um risco documentado, não confirmação de que este deploy foi recusado ou um limite rígido que testamos. [Netlify: arquivos grandes](https://docs.netlify.com/build/configure-builds/troubleshooting-tips/#large-files-or-sites).

Prioridade: filme horizontal (46,81 MB), fundo desktop (18,37 MB), edição (17,35 MB) e anúncios (13,69 MB). Storymaker também merece revisão: embora tenha 8,15 MB, sua taxa média é 4,09 Mbps. Uma boa decisão deve considerar tamanho, taxa e duração, preservando a qualidade aprovada. Avaliar versões menores ou hospedagem dedicada a vídeo; nenhum serviço externo foi criado ou conectado.

A auditoria anterior da prévia, em conexão simulada de 1,6 Mbps / 150 ms, detectou buffering: o horizontal avançou 1,92 s em 10 s e o fundo móvel 9,01 s. Essa medição local não foi repetida nesta preparação e não mede CDN pública; os arquivos continuam idênticos. Reproduzir o fundo enquanto um projeto está aberto pode compartilhar a banda disponível.

O projeto também excede a recomendação de tamanho para Netlify Drop. Não é recomendável arrastar este dist pesado para tentar publicar; qualquer método futuro deve ser escolhido após resolver a estratégia de mídias. [Orientação de upload manual](https://docs.netlify.com/start/quickstarts/netlify-drop-quickstart/).

### Tráfego e franquia

Exemplo aproximado, considerando downloads completos e sem cache no navegador:

- 1.000 downloads do horizontal: 46,81 GB.
- 1.000 carregamentos completos do fundo desktop: 18,37 GB.
- 1.000 carregamentos completos do fundo móvel: 3,34 GB.

Nos planos por créditos consultados nesta data, o Netlify contabiliza 20 créditos por GB de banda: somente o primeiro exemplo corresponde a aproximadamente 936 créditos, além de outras utilizações. O plano da futura conta e sua franquia não foram verificados; contas legadas podem ter regras diferentes. Isso é uma estimativa de transferência, não uma previsão de visitas ou cobrança. [Netlify: consumo de créditos](https://docs.netlify.com/manage/accounts-and-billing/billing/billing-for-credit-based-plans/how-credits-work/).

Cache no navegador pode reduzir transferências em revisitas. Servir uma resposta pela CDN continua sendo entrega de bytes ao visitante. O histórico do Git também pode crescer ao trocar arquivos de vídeo; as cópias atuais totalizam 171,19 MB, mesmo com os originais e dist excluídos.

## Originais preservados e fora do versionamento

Todos os vídeos presentes em materiais, com caminhos relativos a essa pasta:

| Arquivo original | Bytes | MB |
| --- | ---: | ---: |
| 01-inicio/01-showreel/showreel.mp4.mp4 | 207.889.605 | 207,89 |
| 02-portfolio/01-video-marcas/video-marcas.mp4.mp4 | 177.361.344 | 177,36 |
| 02-portfolio/03-anuncio/anuncio.mp4 | 176.680.617 | 176,68 |
| 02-portfolio/04-stories-realtime/stories-realtime.mp4.mp4 | 111.783.548 | 111,78 |
| 02-portfolio/05-filme-evento/filme-evento.mp4.MP4 | 203.303.991 | 203,30 |
| 02-portfolio/05-filme-evento/filme-horizontal-evento.mp4.mov | 551.892.867 | 551,89 |
| 02-portfolio/06-melhores-momentos/melhores-momentos.mp4.mp4 | 243.738.979 | 243,74 |
| 03-servicos/01-storymaker/storymaker.mp4.mp4 | 69.938.544 | 69,94 |
| 03-servicos/02-filmmaker/filmmaker.mp4 | 427.412.883 | 427,41 |
| 03-servicos/03-edicao/edicao.mp4.MP4 | 364.285.478 | 364,29 |
| 03-servicos/04-social-media/social-media.mp4.mp4 | 113.523.019 | 113,52 |
| 03-servicos/05-anuncios-trafego/anuncios-trafego.mp4.mp4 | 119.338.894 | 119,34 |

SHA-256 confirmou que os 43 arquivos existentes de assets e materiais comparados com a referência anterior não foram alterados, incluindo vídeos, capas, retrato, originais e instruções. O arquivo de dados foi alterado somente na configuração de aprovação/preview; os trabalhos reais foram preservados.

## Git e exclusões

Git inicializado localmente na branch main, sem remote. Mensagem do commit da entrega: **Versão aprovada para publicação**. Identidade técnica explicitamente autorizada: **deJesus Films <local@dejesus.invalid>**. Não é uma conta nem um e-mail de contato. A identificação é aplicada ao comando do commit, sem alterar a configuração global. O identificador do commit é informado na entrega e pode ser consultado com git log -1.

.gitignore exclui materiais, dist, .media-tools, .test-output, node_modules, .netlify, logs, arquivos de ambiente, chaves/certificados privados e temporários. O conjunto selecionado para Git foi verificado por padrões de credenciais, sem ocorrências detectadas; essa análise não é uma garantia absoluta. Somente os assets efetivamente destinados ao site entram no repositório. .gitattributes preserva arquivos binários sem conversão de fim de linha. Nenhum arquivo bruto é incluído no build.

## Arquivos alterados ou adicionados nesta preparação

| Arquivo | Alteração |
| --- | --- |
| .gitignore | Exclusões de originais, ambiente, credenciais locais e temporários. |
| .gitattributes | Regras de fim de linha e preservação de binários. |
| netlify.toml | Node 24, redirects 301, segurança e cache; build/dist mantidos. |
| package.json | Node 24 e comando serve:production local. |
| public/data/portfolio.json | preview false e registro da aprovação; domínio, trabalhos e serviços preservados. |
| public/app.js | Remoção segura do banner ausente na produção; avisos editoriais limitados à prévia. |
| public/assets/covers/social-preview.jpg | Nova imagem de compartilhamento derivada da capa existente, sem modificar mídias aprovadas. |
| scripts/build.mjs | Metadados sociais, limpeza das pendências na produção e validação do resultado; aprovação editorial aceita sem inventar dados. |
| scripts/verify-production.mjs | Nova verificação de dist, indexação, URLs, conteúdo, links e assets. |
| scripts/check.mjs | Validação de domínio, aprovação e presença da imagem social. |
| scripts/serve.mjs | Serve dist em modo de produção local e permite porta específica. |
| scripts/test-local.mjs | Teste do diretório/URL escolhidos e verificações dos avisos conforme o modo. |
| scripts/test-browser.mjs | Testa dist, ausência de avisos, canonical e compatibilidade com políticas de segurança preparadas. |
| scripts/audit-production.mjs | Nova auditoria de Netlify, tamanhos, codecs, exclusões/credenciais e preservação. |
| README.md | Instruções atuais de build, testes, manutenção, Git e limites da preparação. |
| VERIFICACAO.md | Histórico preservado, com indicação deste relatório atual. |
| PUBLICACAO.md | Este relatório completo. |

dist foi regenerado: HTML, app, dados, robots, sitemap e imagem social refletem a preparação. As cópias de vídeos e demais imagens permanecem idênticas. Estilos e HTML-fonte da composição aprovada não foram redesenhados.

Evidências locais ignoradas pelo Git: .test-output/production-browser-results.json, production-audit.json, capturas atualizadas e referências de hash da revisão anterior. Produção disponível somente na máquina local: http://127.0.0.1:4174/.

**Próxima decisão: estratégia dos vídeos grandes e franquia de hospedagem. O conteúdo aprovado e o build estão preservados; nenhuma publicação está autorizada por este relatório.**
