# deJesus Films

Versão com visual e conteúdo aprovados em 7 de outubro de 2026, preparada tecnicamente para Netlify. Site estático em português brasileiro, sem dependências de produção ou banco de dados. Nada foi publicado e nenhuma conta ou DNS foi conectado. Diagnóstico atual em [PUBLICACAO.md](PUBLICACAO.md); VERIFICACAO.md registra as revisões anteriores.

## Prévia local

Requer Node.js 24, também definido em package.json e netlify.toml. Na pasta do projeto:

~~~powershell
npm run dev
~~~

Acesse http://127.0.0.1:4173. No notebook atual, se Node não estiver no PATH:

~~~powershell
& 'C:/Program Files/nodejs/node.exe' scripts/serve.mjs
~~~

Mantenha o servidor aberto enquanto avalia a página. Ctrl+C encerra o servidor. Não é necessário instalar pacotes.

Para conferir o resultado final, com metadados e limpeza de prévia aplicados, use:

~~~powershell
npm run check
npm run build
npm run serve:production
~~~

A produção local é servida em http://127.0.0.1:4174, diretamente de dist. Isso não publica o site. `npm run build:preview` continua disponível e gera uma cópia com avisos/noindex; execute novamente `npm run build` antes de qualquer publicação futura.

## Conteúdo e materiais

O briefing foi lido integralmente. As mídias reais fornecidas estão incorporadas; nenhum trabalho, cliente ou crédito foi inventado.

Foram fornecidos 11 vídeos, sendo 6 de portfólio e 5 de serviços, além do showreel e da foto. A área de design foi removida por solicitação do usuário. O filme de evento tem exemplos vertical e horizontal. O conteúdo atual, incluindo os títulos genéricos, foi aprovado; clientes e participações não informados continuam omitidos. O institucional não foi fornecido e seu cartão temporário aparece somente em build de prévia.

As mídias têm capas extraídas dos próprios vídeos. A abertura usa o showreel fornecido, com cópias para celular e desktop e imagem alternativa. Nesta preparação nenhum vídeo foi alterado. A imagem JPEG de compartilhamento foi derivada da capa existente, com 1200 × 630 px. O build de produção usa index/follow, canonical, Open Graph, Twitter Card, robots.txt e sitemap.xml para https://www.fdejesus.com.br.

A composição aprovada parte da direção escura do briefing, com assinatura tipográfica própria, paleta e textos independentes.

## Entregar as mídias

A pasta local materiais contém originais e instruções de recebimento, incluindo 00-LEIA-PRIMEIRO.md, DADOS-DOS-TRABALHOS.md e MAPA-DAS-MIDIAS.json. Ela é ignorada integralmente pelo Git e não acompanha um checkout. Para adicionar trabalhos, mantenha os originais fora do site e atualize public/data/portfolio.json com as cópias autorizadas em public/assets.

## Atualizar projetos e serviços

Edite **public/data/portfolio.json**. Todos os projetos, serviços, mensagens de contato e pendências estão nesse arquivo:

- site: contato, preview, aprovação editorial (contentApproved/contentApprovalDate), domínio, showreel (src, mobileSrc e poster) e retrato.
- groups: as duas frentes de portfólio.
- projects: os 6 vídeos reais de portfólio, com identificação editorial provisória indicada em metadataPending.
- serviceExamples: os 5 vídeos fornecidos especificamente para os serviços.
- previewSlots: espaços de mídia ainda não fornecida, mostrados somente na prévia.
- services: nome, público, entrega, descrição, tags, projeto de exemplo e mensagem de WhatsApp.
- pending: pendências centralizadas para a conclusão editorial.

Coloque as mídias autorizadas em public/assets e referencie seus caminhos a partir de public. Copie apenas os arquivos destinados ao site; a pasta materiais não é servida pelo servidor.

`site.preview` está false e `site.contentApproved` está true por aprovação explícita do usuário. Os indicadores metadataPending e pending permanecem somente no arquivo-fonte como informações de manutenção e são retirados da cópia de produção. Sua aprovação aceita os textos existentes; não cria nomes de clientes ou créditos ausentes. Após alterações editoriais futuras, revisar o conteúdo e atualizar a aprovação antes de publicar.

Exemplo de estrutura de um projeto **para preencher com um trabalho real, não copiar como conteúdo fictício**:

~~~json
{
  "id": "identificador-unico",
  "group": "marcas",
  "title": "Título fornecido",
  "client": "Cliente fornecido, ou omitir o campo",
  "service": "Filmmaker mobile",
  "description": "Objetivo e entrega confirmados",
  "role": "Participação confirmada de Filipe",
  "format": "9:16",
  "cover": "assets/capa-real.webp",
  "coverAlt": "Descrição da capa real",
  "media": {
    "type": "video",
    "src": "assets/video-real.mp4"
  }
}
~~~

Para eventos use group: eventos e deliveryPhase: during para conteúdo durante o evento, ou after para filmes editados depois. Não confundir esses dois tipos de entrega. Atualização de 7 de outubro de 2026: os vídeos do portfólio e exemplos dos serviços serão 9:16, com exceção do filme de evento horizontal em 16:9, conforme a atualização solicitada. Imagens e vídeos usam object-fit: contain no player para preservar seu conteúdo.

Tipos de mídia: video para MP4/WebM, image para uma imagem real e embed para URLs HTTPS verificadas de www.youtube-nocookie.com/embed/ ou player.vimeo.com/video/. O player carrega a mídia só ao abrir o projeto e inicia a reprodução com áudio original, controles de volume, pausa e tela cheia. Ao fechar por botão, Esc ou fundo, o vídeo pausa e é descarregado. Apenas um vídeo de projeto ou serviço pode reproduzir por vez. O fundo visual mudo continua em loop, independentemente do player. Teste o acesso e a reprodução de cada vídeo real antes da publicação.

Para relacionar um exemplo a um serviço, preencha exampleProjectId com o id de um projeto real ou de um registro de serviceExamples. Uma mesma produção pode representar mais de um serviço quando sua descrição confirmar essa relação. Para remover um projeto, remova seu objeto de projects e revise as referências exampleProjectId.

O showreel usa site.showreel.src no desktop e mobileSrc até 800 px, com poster como alternativa. Ambas as cópias foram preparadas sem faixa de áudio; o elemento também permanece mudo. Há controle para reproduzir/pausar. O fundo inicia automaticamente e permanece em loop. O controle manual pausa e retoma; abrir ou fechar um projeto não interrompe o fundo. A foto fornecida usa site.portrait.src, com proporção original, sem legenda ou texto sobre a imagem.

Os títulos e textos fixos de apresentação estão em public/index.html. Cores, tipografia e espaçamentos estão nas variáveis do início de public/styles.css. As interações ficam em public/app.js.

## Verificações

~~~powershell
npm run check
npm run build:preview
~~~

Esses comandos verificam dados, IDs únicos, mídias, referências, contatos, seções e sintaxe. Para a versão final, executar npm run build: ele verifica também o resultado em dist, a indexação, metadados, preservação dos trabalhos e igualdade das mídias copiadas. O build de prévia gera dist com indexação bloqueada. Não publicá-lo.

Veja VERIFICACAO.md para os resultados e a relação completa de arquivos alterados.

## Preparação para Netlify — não publicar ainda

netlify.toml executa npm run build e publica somente dist, usando Node 24. O build exige preview false, conteúdo aprovado, projetos reais nas duas frentes, exemplos nos serviços e cobertura durante/depois de eventos. A aprovação explícita substitui a exigência anterior de fichas editoriais completas, sem inventar dados. Nenhuma hospedagem foi criada e nenhum conteúdo foi transmitido a um serviço de publicação.

O build final retira avisos, espaços temporários, pendências internas e noindex, preservando os 6 projetos e 5 exemplos de serviços reais. O domínio permanece https://www.fdejesus.com.br. Regras 301 de HTTP e do domínio sem www para o endereço principal estão preparadas, preservando o caminho; só funcionarão na hospedagem após conexão autorizada dos domínios. Não há rewrite SPA porque a navegação usa âncoras. A configuração inclui políticas de segurança e cache: documentos/código/dados revalidam; assets têm validade de 1 hora, sem immutable por terem nomes sem hash.

A etapa futura de publicação deve seguir Netlify e DNS externo no Wix, mantendo o domínio fdejesus.com.br. Confirmar os registros exatos no painel da hospedagem antes de qualquer alteração. Revisar planos e documentação naquele momento. Não alterar nameservers, registros de e-mail ou domínio automaticamente.

## Preparo e teste das mídias

Os originais em materiais são preservados. As cópias para o site ficam em public/assets/videos (H.264/AAC com faststart) e public/assets/covers (WebP). O horizontal HDR é convertido para SDR BT.709. As ferramentas locais de preparo ficam em .media-tools, que não é parte do site e está ignorada no Git.

O inventário técnico completo está em .media-tools/inventory.json. scripts/prepare-media.mjs prepara as cópias, e scripts/integrate-media.mjs aplica o inventário ao arquivo de dados. Os títulos provisórios não substituem a ficha editorial.

Com as ferramentas locais instaladas, node scripts/test-local.mjs verifica a montagem do DOM, menus, player, fallback, retorno de foco, carrossel com larguras distintas, contatos e respostas HTTP parciais dos vídeos. Esses testes não substituem a inspeção visual no navegador.

## Ajustes atuais

A seção de eventos avança um projeto a cada 3 segundos, com transição lateral suave de 650 ms e repetição contínua dos quatro trabalhos. Setas, teclado, arraste e toque continuam disponíveis. Ao terminar uma interação, começa uma nova contagem de 3 segundos; foco ou ponteiro parado não bloqueiam o avanço. O controle explícito de pausa permanece. Redução de movimento desativa o avanço automático. No celular aparece um cartão completo por vez. Os cinco serviços mantêm a disposição vertical no celular. No desktop, o número/nome fica no topo, com mídia à esquerda e público, descrição, informações e contato à direita. Em Sobre, foto e texto ficam lado a lado no desktop e empilhados no celular.

`scripts/prepare-intro.mjs` prepara exclusivamente o showreel e o retrato, preservando os originais em materiais. Requer as ferramentas locais em .media-tools. Se houver mais de um arquivo elegível por pasta, para sem escolher. O fundo tem versões 1080 × 1920 (18,4 MB) e 540 × 960 (3,3 MB), H.264 com faststart, 30 fps e sem áudio. A imagem alternativa é WebP (85 KB) e a foto é WebP (163 KB).

`node scripts/test-browser.mjs` verifica o site servido localmente em Chrome isolado, com Playwright instalado em .media-tools: 360, 390, 768 e 1440 px; carrossel, menus, exemplos, redução de movimento, áudio decodificado, volume, pausa, tela cheia, fechamento e fundo alternativo. Celular é emulado no navegador, com eventos nativos de toque. Os resultados e capturas ficam em .test-output, fora do site.

## Auditoria para publicação

O build e o repositório locais foram preparados com o conteúdo aprovado. O institucional ausente e fichas editoriais adicionais são melhorias futuras; não bloqueiam esta seleção aprovada e não são exibidos como material fictício. A publicação permanece pendente de uma decisão sobre as mídias: oito vídeos têm mais de 10 MB decimais, condição para a qual o Netlify documenta risco de upload/CDN. O relatório PUBLICACAO.md apresenta os tamanhos e a estimativa de tráfego. A publicação, contas e DNS ainda dependem de autorização específica e não foram executados.

`node scripts/audit-readiness.mjs` verifica pendências e carregamento em conexão móvel simulada de 1,6 Mbps / 150 ms. Nessa condição, a interface ficou pronta em cerca de 1 s e o fundo iniciou em cerca de 2 s. O filme horizontal (46,8 MB) avançou apenas cerca de 1,9 s em 10 s por buffering. É recomendada uma versão mais leve para celular antes da publicação; as mídias foram preservadas nesta entrega. O resultado detalhado fica em .test-output/readiness-audit.json.

Para repetir os testes de produção, com o servidor de 4174 ativo:

~~~powershell
$env:TEST_ROOT = 'dist'
$env:PREVIEW_URL = 'http://127.0.0.1:4174/'
node scripts/test-local.mjs
node scripts/test-browser.mjs
node scripts/audit-production.mjs
~~~

Os testes de navegador/auditoria usam ferramentas opcionais locais, ignoradas pelo Git: jsdom, playwright, ffprobe-static e @iarna/toml em .media-tools/node_modules, além do Chrome instalado no Windows. Elas não são necessárias para npm run check/build no Netlify. A auditoria verifica TOML, metadados, inventário de vídeos, exclusões do Git, padrões de credenciais e preservação por hash quando a referência local está disponível. Verificação de segredos por padrões não constitui garantia absoluta.

Git local: branch main, sem remote; commit solicitado “Versão aprovada para publicação”, com identificação técnica autorizada deJesus Films <local@dejesus.invalid>. Materiais brutos (cerca de 2,77 GB de vídeos), dist, ferramentas, logs e arquivos de ambiente são ignorados; somente as cópias utilizadas pelo site entram no versionamento. Vídeos substituídos em commits futuros podem aumentar o histórico do repositório. .gitattributes preserva assets binários sem conversão de fim de linha.
