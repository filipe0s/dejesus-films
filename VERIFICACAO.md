# Verificação dos ajustes e prontidão — 7 de outubro de 2026

> Histórico da etapa anterior. Após a aprovação explícita do visual e conteúdo, o projeto foi preparado para produção. O diagnóstico atual, os testes da pasta dist e a análise de tamanho estão em [PUBLICACAO.md](PUBLICACAO.md). As pendências editoriais descritas abaixo foram aceitas como parte da seleção atual, sem inventar informações; a recomendação de otimização dos vídeos permanece.

Nova prévia: http://127.0.0.1:4173/?preview=20261007-v2#inicio

A prévia foi aberta no navegador integrado, conferida visualmente e marcada para permanecer disponível após o término. O servidor continua local, ligado a 127.0.0.1. Não houve publicação, conexão de domínio ou mudança de DNS.

## Resultado dos ajustes

- Fundo principal: autoplay, silêncio permanente, loop nativo e retomada ao final; botão manual de pausa/retomada mantido. Abrir um projeto não pausa mais o fundo. Projetos e exemplos continuam com reprodução exclusiva entre si, áudio e controles. O fundo é a exceção visual silenciosa.
- O controle considera o estado real de reprodução. Também foi testado o primeiro clique quando o navegador impede autoplay, além da manutenção da pausa ao redimensionar a tela.
- Imagem alternativa do fundo preservada e confirmada em falha de carregamento.
- Eventos: um projeto a cada 3 segundos, transição lateral de 650 ms e repetição contínua. Interação manual reinicia a contagem ao terminar; foco ou ponteiro parado não bloqueiam indefinidamente o avanço. Setas, teclado, mouse, toque e pausa explícita mantidos. Redução de movimento continua desativando o avanço automático do carrossel.
- Horizontais: mídia inteira, centralizada na área reservada. Altura geral do carrossel no desktop: 827,125 px antes e depois da centralização (diferença zero).
- Serviços: número/título no topo; exemplo à esquerda e conteúdo/contato à direita no desktop. A sequência vertical anterior permanece no celular, nos cinco serviços, com os textos existentes.
- Sobre: foto à esquerda e texto à direita, com alinhamento central, no desktop. No celular, título, foto e texto continuam empilhados. Foto sem texto ou legenda acrescentada.
- Contato final: número visível removido conforme solicitado. Apenas o botão de WhatsApp permanece, direcionando para 5575988796387 com mensagem configurada.

## Testes concluídos

- npm run check — passou na versão final.
- npm run build:preview — passou na versão final; dist corresponde aos arquivos atuais.
- node scripts/test-local.mjs — passou: players, áudio habilitado, fechamento, exclusividade entre exemplos/projetos, menu, contatos, fallback, carrossel e HTTP 206.
- node scripts/test-browser.mjs — passou em 360, 390, 768 e 1440 px. Quatro trocas automáticas consecutivas em cada dimensão: realtime → evento-vertical → evento-horizontal → melhores-momentos → realtime. Intervalos entre as trocas conferidos em aproximadamente 3 segundos, sem avançar o relógio artificialmente.
- A prévia visível no navegador integrado também foi testada: três avanços automáticos consecutivos observados, sem comandos de navegação entre as trocas: 03/04 → 04/04 → 01/04 → 02/04.
- Botões, teclado, arraste de mouse, eventos nativos de toque, retomada após interação e redução de movimento conferidos. Todos os quatro trabalhos de eventos acessíveis.
- Layout dos serviços e Sobre, proporção da foto, área horizontal, navegação e ausência de rolagem horizontal da página conferidos nas quatro dimensões. Capturas inspecionadas.
- O fundo completou naturalmente um ciclo inteiro no desktop e reiniciou; outras passagens pelo final também foram verificadas em desktop e celular. Autoplay, silêncio, pausa e retomada passaram. O fundo continuou reproduzindo durante os players, sempre mudo.
- Todos os 11 vídeos de projetos e serviços testados em desktop e celular emulado (22 reproduções de trechos). A faixa de áudio dos arquivos foi detectada via Web Audio, com os players sem mute. Controles nativos habilitados; volume, pausa e retomada exercitados pela API do vídeo em todos os arquivos. Entrada e saída de tela cheia verificadas no vídeo para marcas, nas duas dimensões. Não foi feita escuta humana integral dos filmes nem acionamento de cada controle nativo por clique. Fechamento por botão, Esc e clique fora testado. Nenhum vídeo de projeto/serviço continuou após o fechamento.
- Links internos completos e válidos. Todos os contatos usam o WhatsApp configurado; não foi enviada mensagem externa.
- Nenhum erro JavaScript detectado nos testes.
- SHA-256 confirmou 44 arquivos de conteúdo, mídias e originais integralmente preservados, incluindo public/data/portfolio.json e todos os arquivos em public/assets e materiais. Nenhum trabalho real foi removido ou substituído. A remoção do número visível de contato foi a solicitada.

O celular foi emulado no Chrome com eventos nativos de toque. Não houve teste em aparelho físico, Safari/iOS, Firefox ou hospedagem pública. Os resultados descrevem o ambiente e os casos exercitados; não certificam todos os navegadores e dispositivos.

## Revisão do relatório e repetição dos testes — 7 de outubro de 2026

O texto colado pelo usuário corresponde a este relatório antes da revisão, desconsiderando apenas quebras de linha e espaços nas extremidades. As evidências, arquivos atuais e configuração do build foram conferidos novamente.

- `npm run check`, `npm run build:preview` e `node scripts/test-local.mjs` passaram novamente. Os arquivos principais em dist correspondem byte a byte a public.
- A comparação SHA-256 reconfirmou os 44 arquivos preservados. O inventário atual de materiais não contém um filme institucional para preencher o espaço pendente.
- **A primeira execução de navegador nesta revisão falhou em 360 px:** observou somente duas trocas em 15 segundos, quando eram exigidas quatro. O resultado foi preservado em `.test-output/browser-review-first-run.json`. Não deve ser omitido nem tratado como falso negativo sem evidência.
- Um diagnóstico isolado subsequente registrou seis avanços em 20 segundos, com a página visível e o carrossel no campo de visão. Registro em `.test-output/carousel-review-diagnostic.json`.
- A segunda execução integral de `scripts/test-browser.mjs` passou sem alteração do código do site: quatro trocas consecutivas em cada largura (360, 390, 768 e 1440 px), todos os quatro trabalhos acessíveis e intervalos entre as trocas sucessivas de 2.958 a 3.050 ms. Os testes de arraste, toque, retomada e redução de movimento também passaram.
- A mesma execução integral confirmou novamente as 22 reproduções de trechos dos 11 arquivos, áudio detectado, controles, fechamento, exclusividade dos players, autoplay/loop/silêncio do fundo e imagem alternativa. Nenhum erro JavaScript foi registrado. As capturas atualizadas de serviços no desktop/celular, Sobre no desktop e horizontal no celular foram inspecionadas visualmente.

A causa da divergência inicial não ficou demonstrada, e ela não se repetiu no diagnóstico ou na segunda rodada completa. A aprovação funcional se refere à rodada final; antes de publicar, convém revalidar o avanço também em aparelho físico e sob carga. Os números de desempenho abaixo permanecem os da auditoria anterior, que não foi repetida nesta revisão.

Nesta revisão, foi alterado apenas `VERIFICACAO.md` entre os arquivos de conteúdo/código/documentação do projeto, para precisar o alcance dos testes e registrar a divergência. As evidências de teste foram atualizadas e o build de prévia foi regenerado com o mesmo conteúdo. Visual, textos do site, dados, mídias e funcionalidades não foram modificados.

## Diagnóstico de prontidão

**O site ainda não está pronto para publicação.** Os ajustes funcionais passaram, mas permanecem estes pontos:

1. Falta o vídeo institucional. Há um cartão claramente identificado como material real pendente.
2. Os 11 trabalhos/exemplos mantêm títulos genéricos e identificação provisória. Nomes, clientes quando aplicável e participação de Filipe precisam ser confirmados; nenhum desses dados foi inventado.
3. Há buffering em conexão lenta. O filme horizontal tem 46.813.925 bytes (46,8 MB) e precisa de uma versão mais leve para uma boa experiência móvel nessa condição.
4. O modo de prévia mantém avisos, noindex e bloqueio do build de produção por site.preview e metadados pendentes. Esses bloqueios são intencionais até a avaliação e a conclusão editorial.

Na rodada original, não foram encontrados links incompletos, arquivos de mídia real ausentes ou erros funcionais na prévia local. A exceção de conteúdo ausente é o institucional já marcado. Nenhuma publicação, conexão de domínio ou mudança de DNS foi executada nesta etapa. O estado externo de DNS e hospedagem não foi auditado; sua configuração será tratada somente na etapa autorizada de publicação.

### Desempenho medido

Simulação local no Chrome móvel: 1,6 Mbps de download e 150 ms de latência.

| Medição | Resultado |
| --- | --- |
| Conteúdo e serviços disponíveis | 1.022 ms |
| Fundo começou a reproduzir | 2.065 ms |
| Fundo móvel em janela de 10 s | Avançou 9,01 s, com 5 eventos de espera de buffer |
| Filme horizontal em janela de 10 s | Avançou 1,92 s, com 2 eventos de espera de buffer |
| Projetos carregados antes de interação | Nenhum; carregamento adiado confirmado |

O problema de buffering foi observado nessa conexão simulada; não é uma falha do loop ou da pausa manual. Estes números vêm de uma execução local, não de uma média ou medição em rede móvel física. “Conteúdo e serviços disponíveis” mede a presença dos elementos no DOM; não é uma medição de LCP ou de todas as imagens já carregadas. A pausa do fundo não garante que seu download cesse, portanto a reprodução do horizontal pode compartilhar a conexão com esse carregamento. Não alterei as mídias nesta entrega para preservar os materiais aprovados. Recomenda-se preparar versões mais leves para celular, principalmente do horizontal, e revisar o fundo nessa mesma condição antes de publicar. Velocidade de CDN/hospedagem ainda não foi testada, pois não houve publicação.

## Arquivos alterados ou adicionados na entrega dos ajustes

| Arquivo | Mudança |
| --- | --- |
| public/app.js | Fundo independente com loop/autoplay e controle manual robusto; timer de 3 s do carrossel, interação e retomada; posicionamento da foto no novo contêiner. |
| public/styles.css | Centralização dos horizontais sem aumentar a altura geral; duas colunas nos serviços e Sobre no desktop; disposição móvel preservada. |
| public/index.html | Contêineres da seção Sobre reorganizados; número visível do contato final removido. Demais textos mantidos. |
| scripts/test-browser.mjs | Testes de quatro trocas reais, loop natural, layouts, horizontais, áudio, controles, pausa, links e contato final. |
| scripts/test-local.mjs | Atualizado para o fundo silencioso independente dos vídeos de projetos/serviços. |
| scripts/audit-readiness.mjs | Nova auditoria de pendências, mídia carregada sob demanda e reprodução em conexão móvel lenta. |
| README.md | Documentação do comportamento atual, manutenção e pendências para publicação. |
| VERIFICACAO.md | Este relatório, arquivos alterados e diagnóstico. |

Build local atualizado: dist/app.js, dist/styles.css e dist/index.html. Os demais arquivos foram recopiados pelo build de prévia, mantendo o conteúdo. Nenhuma mídia em public/assets ou no build foi reeditada.

Evidências locais, fora do site e ignoradas pelo Git:

- .test-output/browser-results.json
- .test-output/readiness-audit.json
- .test-output/height-check.json
- .test-output/hero-controls.json
- .test-output/revision-2-before.json
- .test-output/revision-2-data-before.json
- .test-output/events-360.png, events-390.png, events-768.png e events-1440.png
- .test-output/services-360.png, services-390.png, services-768.png e services-1440.png
- .test-output/hero-360.png, hero-390.png, hero-768.png e hero-1440.png
- .test-output/about-360.png, about-390.png, about-768.png e about-1440.png

Aguardar avaliação. Nenhum conteúdo foi enviado para um serviço de publicação.
