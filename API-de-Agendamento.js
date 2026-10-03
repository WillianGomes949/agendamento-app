// ==============================================================================
// Code.gs — API de Agendamento de Serviços Técnicos (Apps Script + Sheets)
// Versão 5.0.0 — Requer runtime V8 (padrão desde 2020)
// ==============================================================================
//
// VISÃO GERAL
//   Web App que expõe uma API JSON (POST) sobre uma aba do Google Sheets, com
//   autenticação por API key, validação de dados, soft delete, auditoria,
//   cache de configurações e proteção contra condições de corrida (lock).
//
// CONFIGURAÇÃO INICIAL (executar uma única vez no editor do Apps Script)
//   1. Cole este código em Extensões > Apps Script (planilha vinculada).
//   2. Ajuste CONFIG.SHEET_NAME para o nome da sua aba de dados.
//   3. Execute "definirApiKey" para cadastrar a chave de acesso.
//   4. Execute "inicializarPlanilha" e "inicializarAbasConfig".
//      ⚠️ Em planilha já populada pela versão anterior, execute também
//         "migrarParaTexto" para fixar datas/horários como texto.
//   5. Implantar > Nova implantação > Aplicativo da Web:
//        Executar como: Eu  |  Quem tem acesso: Qualquer pessoa
//   6. Opcional: execute "agendarLimpezaLogs" (limpeza diária automática).
//
// ENDPOINTS
//   POST <URL>?key=<API_KEY>   body: { "action": "...", "data": { ... } }
//   GET  <URL>?key=<API_KEY>   health check
//   A chave também pode ir no body ({ "apiKey": "..." }) — preferível, pois
//   query string pode vazar em logs de proxy e histórico de navegador.
//
// AÇÕES
//   GET       Lista paginada com filtros e ordenação
//   CREATE    Cria agendamento      (obrigatório: tecnico, data, horario, tipoServico)
//   UPDATE    Atualização parcial   (obrigatório: id) — apenas campos da whitelist
//   DELETE    Exclusão lógica       (obrigatório: id)
//   STATS     Estatísticas agregadas
//   GET_STATUS / GET_TECNICOS / GET_TIPOS / GET_HORARIOS  → listas de apoio
//
// FORMATOS
//   Datas "DD/MM/AAAA" · Horários "HH:MM" (24h) · Status conforme aba "Status"
//   (comparações sempre insensíveis a caixa alta/baixa e acentos)
//
// OBSERVAÇÕES DA PLATAFORMA
//   • Apps Script SEMPRE responde HTTP 200; o status lógico da operação é
//     retornado no campo "_httpStatus" do JSON (limitação conhecida).
//   • Apenas mutações, erros e falhas de autenticação geram log na planilha.
//     Leituras registram apenas no Stackdriver (console.log).
//   • Logs de auditoria NÃO armazenam dados pessoais (LGPD): apenas ids,
//     nomes de campos alterados, durações e mensagens de erro.
// ==============================================================================

'use strict';

// ══════════════════════════════════════════════════════════════════════════════
//  CONSTANTES E CONFIGURAÇÃO
// ══════════════════════════════════════════════════════════════════════════════

const VERSAO = '5.0.0';

const CONFIG = {
  /** Nome da aba de dados. Ajuste conforme sua planilha. */
  SHEET_NAME: 'Servicos',
  /** true = DELETE marca status "deletado"; false = remove a linha fisicamente. */
  SOFT_DELETE: true,
  /** Nome da aba de auditoria. */
  LOG_SHEET_NAME: '_Logs_Auditoria',
  /** Exige API key em toda requisição. */
  REQUIRES_AUTH: true,
  /** Máximo de registros por página (protege contra payloads gigantes). */
  MAX_PAGE_SIZE: 500,
  /** Tamanho padrão de página. */
  DEFAULT_PAGE_SIZE: 50,
  /** TTL (segundos) do cache das abas de configuração. */
  CACHE_TTL_SEGUNDOS: 300,
  /** Tempo máximo (ms) aguardando o lock de escrita. */
  LOCK_TIMEOUT_MS: 30000,
  /** Limites de tamanho dos campos de texto. */
  LIMITE_CAMPO_TEXTO: 500,
  LIMITE_CAMPO_LONGO: 2000,
  /** Registros mantidos na aba de log após a limpeza automática. */
  LOGS_MAX_REGISTROS: 1000,
};

/** Status especiais usados internamente (sempre em forma normalizada). */
const STATUS = Object.freeze({
  PADRAO: 'pendente',
  DELETADO: 'deletado',
});

/** Fallback de status permitidos, usado se a aba "Status" não existir/estiver vazia. */
const STATUS_PADRAO = Object.freeze([
  'pendente', 'em andamento', 'concluido', 'cancelado', 'deletado',
]);

/** Ações que operam sobre a aba de dados (exigem schema válido). */
const ACOES_DADOS = Object.freeze({ GET: 1, CREATE: 1, UPDATE: 1, DELETE: 1, STATS: 1 });

const COLUNAS_OBRIGATORIAS = Object.freeze([
  'ID', 'tecnico', 'data', 'diaSemana', 'horario', 'tipoServico',
  'ordemServico', 'observacao', 'cliente_nome', 'cliente_contato',
  'veiculo_placa', 'veiculo_marcaModelo',
  'endereco_rua', 'endereco_numero', 'endereco_bairro',
  'endereco_cidade', 'endereco_estado', 'endereco_cep',
  'status', 'criadoEm', 'atualizadoEm',
]);

/**
 * Mapa: coluna da planilha → caminho do campo no objeto JSON.
 * Caminhos com "." representam objetos aninhados.
 * A ordem aqui não afeta a planilha (a ordem real é a do cabeçalho).
 */
const MAPA_COLUNAS = Object.freeze({
  'ID': 'id',
  'tecnico': 'tecnico',
  'data': 'data',
  'diaSemana': 'diaSemana',
  'horario': 'horario',
  'tipoServico': 'tipoServico',
  'ordemServico': 'ordemServico',
  'observacao': 'observacao',
  'cliente_nome': 'cliente.nome',
  'cliente_contato': 'cliente.contato',
  'veiculo_placa': 'veiculo.placa',
  'veiculo_marcaModelo': 'veiculo.marcaModelo',
  'endereco_rua': 'endereco.rua',
  'endereco_numero': 'endereco.numero',
  'endereco_bairro': 'endereco.bairro',
  'endereco_cidade': 'endereco.cidade',
  'endereco_estado': 'endereco.estado',
  'endereco_cep': 'endereco.cep',
  'status': 'status',
  'criadoEm': 'criadoEm',
  'atualizadoEm': 'atualizadoEm',
});

const DIAS_SEMANA = Object.freeze({
  0: 'DOMINGO', 1: 'SEGUNDA', 2: 'TERÇA', 3: 'QUARTA',
  4: 'QUINTA', 5: 'SEXTA', 6: 'SÁBADO',
});

const CAMPOS_OBRIGATORIOS = Object.freeze({
  CREATE: Object.freeze(['tecnico', 'data', 'horario', 'tipoServico']),
  UPDATE: Object.freeze(['id']),
  DELETE: Object.freeze(['id']),
  GET: Object.freeze([]),
  STATS: Object.freeze([]),
});

const ABAS_CONFIG = Object.freeze({
  STATUS: 'Status',
  TECNICOS: 'Tecnicos',
  TIPOS_SERVICO: 'TiposServico',
  HORARIOS: 'Horarios',
});

// ══════════════════════════════════════════════════════════════════════════════
//  PONTOS DE ENTRADA HTTP
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Ponto de entrada das requisições POST.
 * @param {GoogleAppsScript.Events.DoPost} e Evento HTTP.
 * @return {GoogleAppsScript.Content.TextOutput} Resposta JSON.
 */
function doPost(e) {
  const requestId = gerarRequestId();
  const inicio = Date.now();

  try {
    if (!e || !e.postData || !e.postData.contents) {
      return respostaErro('Requisição inválida', 'Corpo (body) ausente na requisição POST.', 400, requestId);
    }

    let body;
    try {
      body = JSON.parse(e.postData.contents);
    } catch (erro) {
      registrarLog('JSON_INVALIDO', { requestId, bruto: String(e.postData.contents).substring(0, 200) });
      return respostaErro('JSON inválido', 'O body não pôde ser interpretado como JSON.', 400, requestId);
    }

    // ✅ CORRIGIDO: JSON.parse("null") retorna null; "[]" retorna array.
    if (typeof body !== 'object' || body === null || Array.isArray(body)) {
      return respostaErro('JSON inválido', 'O body deve ser um objeto: { "action": "...", "data": {...} }.', 400, requestId);
    }

    if (CONFIG.REQUIRES_AUTH) {
      const erroAuth = autenticar(e, body);
      if (erroAuth) {
        registrarLog('AUTH_FALHA', { requestId, erro: erroAuth });
        return respostaErro('Não autorizado', erroAuth, 401, requestId);
      }
    }

    const acao = String(body.action || '').trim().toUpperCase();
    if (!acao) {
      return respostaErro('Requisição inválida', 'Campo "action" é obrigatório e deve ser uma string.', 400, requestId);
    }

    let dados = {};
    if (body.data !== undefined) {
      if (typeof body.data !== 'object' || body.data === null || Array.isArray(body.data)) {
        return respostaErro('Requisição inválida', 'Campo "data" deve ser um objeto.', 400, requestId);
      }
      dados = body.data;
    }

    const resultado = processarAcao(acao, dados, requestId);

    // A cada 100 requisições, verifica se precisa limpar
    if (Math.random() < 0.01) { // 1% de chance
      try { limparLogsDiario(); } catch (e) { /* silencioso */ }
    }

    // Leituras não são auditadas em planilha (apenas Stackdriver).
    console.log(`[INFO] ${requestId} ${acao} concluída em ${Date.now() - inicio}ms`);
    return resultado;


  } catch (erro) {
    // ✅ CORRIGIDO: detalhes do erro apenas no log; o cliente recebe só o requestId
    // (não vaza nomes de abas, mensagens internas do Sheets etc.).
    registrarLog('ERRO_INTERNO', {
      requestId,
      erro: erro.message,
      stack: erro.stack,
      duracaoMs: Date.now() - inicio,
    });
    return respostaErro('Erro interno', 'Erro interno no servidor. Informe o requestId ao administrador.', 500, requestId);
  }

}

/**
 * Ponto de entrada das requisições GET — usado apenas como health check.
 * @param {GoogleAppsScript.Events.DoGet} e Evento HTTP.
 * @return {GoogleAppsScript.Content.TextOutput} Resposta JSON.
 */
function doGet(e) {
  const requestId = gerarRequestId();

  if (CONFIG.REQUIRES_AUTH) {
    const erroAuth = autenticar(e, null);
    if (erroAuth) return respostaErro('Não autorizado', erroAuth, 401, requestId);
  }

  return montarResposta({ success: true, requestId, data: { status: 'online', versao: VERSAO } }, 200);
}

// ══════════════════════════════════════════════════════════════════════════════
//  AUTENTICAÇÃO
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Lê a API key das Script Properties (nunca embutida no código-fonte).
 * @return {?string} Valor da propriedade API_KEY.
 */
function obterApiKey() {
  return PropertiesService.getScriptProperties().getProperty('API_KEY');
}

/**
 * Valida a API key da requisição. Aceita via body ("apiKey") ou query (?key=).
 * @param {Object} e    Evento HTTP.
 * @param {?Object} body Body já parseado (pode conter "apiKey").
 * @return {?string} Mensagem de erro, ou null se autenticado com sucesso.
 */
function autenticar(e, body) {
  const chaveEsperada = obterApiKey();
  if (!chaveEsperada) {
    return 'API key não configurada no servidor. Execute definirApiKey() no editor do Apps Script.';
  }

  const chaveInformada =
    (body && body.apiKey ? String(body.apiKey).trim() : '') ||
    (e && e.parameter && e.parameter.key ? String(e.parameter.key).trim() : '');

  if (!chaveInformada) {
    return 'API key ausente. Envie via body ("apiKey") ou query string (?key=...).';
  }
  if (!comparacaoConstante(chaveInformada, chaveEsperada)) {
    return 'API key inválida.';
  }
  return null;
}

/**
 * Comparação de strings em tempo constante (mitiga timing attack na validação da key).
 * @param {string} a
 * @param {string} b
 * @return {boolean}
 */
function comparacaoConstante(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let diferenca = 0;
  for (let i = 0; i < a.length; i++) {
    diferenca |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diferenca === 0;
}

// ══════════════════════════════════════════════════════════════════════════════
//  RATE-LIMIT
// ══════════════════════════════════════════════════════════════════════════════
function verificarRateLimit(requestId) {
  const cache = CacheService.getScriptCache();
  const chave = `rl:${requestId.substring(0, 20)}`; // por IP/user-agent
  const atual = parseInt(cache.get(chave) || '0', 10);

  if (atual > 100) { // 100 req/minuto
    return respostaErro('Rate limit excedido', 'Muitas requisições.', 429, requestId);
  }

  cache.put(chave, String(atual + 1), 60);
  return null;
}

// ══════════════════════════════════════════════════════════════════════════════
//  ROTEADOR
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Roteia a requisição para a ação correspondente.
 * @param {string} acao     Ação normalizada (maiúscula, sem espaços).
 * @param {Object} dados    Payload enviado em "data".
 * @param {string} requestId
 * @return {GoogleAppsScript.Content.TextOutput}
 */
function processarAcao(acao, dados, requestId) {
  // 1) Ações de leitura de configuração — não dependem da aba de dados.
  switch (acao) {
    case 'GET_STATUS': return acaoObterStatus(requestId);
    case 'GET_TECNICOS': return acaoObterTecnicos(requestId);
    case 'GET_TIPOS': return acaoObterTiposServico(requestId);
    case 'GET_HORARIOS': return acaoObterHorarios(requestId);
    case 'CREATE_TECNICO': return acaoCriarTecnico(dados, requestId);
    case 'UPDATE_TECNICO': return acaoAtualizarTecnico(dados, requestId);
    case 'DELETE_TECNICO': return acaoExcluirTecnico(dados, requestId);
  }

  if (!ACOES_DADOS[acao]) {
    return respostaErro(
      'Ação inválida',
      `Ação "${acao}" não reconhecida. Disponíveis: GET, CREATE, UPDATE, DELETE, STATS, GET_STATUS, GET_TECNICOS, GET_TIPOS, GET_HORARIOS.`,
      400, requestId
    );
  }

  // 2) Validação de schema — lê APENAS a linha de cabeçalho (barato).
  const erroSchema = validarSchemaPlanilha();
  if (erroSchema) {
    registrarLog('SCHEMA_INVALIDO', { requestId, erro: erroSchema });
    return respostaErro('Erro de configuração', erroSchema, 500, requestId);
  }

  const erroCampos = validarCamposObrigatorios(acao, dados);
  if (erroCampos) return respostaErro('Validação falhou', erroCampos, 422, requestId);

  switch (acao) {
    case 'GET': return acaoListar(dados, requestId);
    case 'CREATE': return acaoCriar(dados, requestId);
    case 'UPDATE': return acaoAtualizar(dados, requestId);
    case 'DELETE': return acaoExcluir(dados, requestId);
    case 'STATS': return acaoEstatisticas(requestId);
  }
}

// ══════════════════════════════════════════════════════════════════════════════
//  AÇÕES DE CONFIGURAÇÃO (com cache)
// ══════════════════════════════════════════════════════════════════════════════

function acaoObterStatus(requestId) {
  return montarResposta({ success: true, requestId, data: obterItensConfig(ABAS_CONFIG.STATUS, 'nome') }, 200);
}

function acaoObterTecnicos(requestId) {
  return montarResposta({ success: true, requestId, data: obterItensConfig(ABAS_CONFIG.TECNICOS, 'nome') }, 200);
}

function acaoObterTiposServico(requestId) {
  return montarResposta({ success: true, requestId, data: obterItensConfig(ABAS_CONFIG.TIPOS_SERVICO, 'nome') }, 200);
}

function acaoObterHorarios(requestId) {
  return montarResposta({ success: true, requestId, data: obterItensConfig(ABAS_CONFIG.HORARIOS, 'horario') }, 200);
}

/**
 * Retorna os itens ativos de uma aba de configuração, com cache de 5 minutos.
 * Após editar uma aba de configuração, execute limparCacheConfig().
 * @param {string} nomeAba      Nome da aba (ABAS_CONFIG).
 * @param {string} colunaValor  Nome da coluna com o valor ('nome' ou 'horario').
 * @return {string[]} Itens ativos.
 */
function obterItensConfig(nomeAba, colunaValor) {
  const cache = CacheService.getScriptCache();
  const chaveCache = `cfg:${nomeAba}`;
  const emCache = cache.get(chaveCache);
  if (emCache) {
    try { return JSON.parse(emCache); } catch (erro) { /* cache inválido: recalcula */ }
  }
  const itens = lerItensConfigDaPlanilha(nomeAba, colunaValor);
  cache.put(chaveCache, JSON.stringify(itens), CONFIG.CACHE_TTL_SEGUNDOS);
  return itens;
}

/**
 * Lê os itens ativos diretamente da aba de configuração.
 * Usa getDisplayValues() — "08:00" nunca chega como objeto Date.
 * @param {string} nomeAba
 * @param {string} colunaValor
 * @return {string[]}
 */
function lerItensConfigDaPlanilha(nomeAba, colunaValor) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const aba = ss.getSheetByName(nomeAba);
  if (!aba || aba.getLastRow() < 2) return [];

  const valores = aba.getDataRange().getDisplayValues();
  const cabecalhos = valores[0].map(normalizarTexto);
  const idxValor = cabecalhos.indexOf(normalizarTexto(colunaValor));
  const idxAtivo = cabecalhos.indexOf('ativo');
  if (idxValor === -1) return [];

  const itens = [];
  for (let i = 1; i < valores.length; i++) {
    const linha = valores[i];
    let valor = linha[idxValor];

    // Defensivo: getDisplayValues() teoricamente nunca retorna Date,
    // mas protege contra alteração futura para getValues().
    if (valor instanceof Date) {
      const ehHorario = normalizarTexto(colunaValor) === 'horario';
      valor = Utilities.formatDate(valor, Session.getScriptTimeZone(), ehHorario ? 'HH:mm' : 'dd/MM/yyyy');
    }
    valor = String(valor || '').trim();
    if (!valor) continue;

    const ativo = idxAtivo === -1 ||
      ['true', 'sim', 'yes', '1', 'x'].includes(normalizarTexto(linha[idxAtivo]));
    if (ativo) itens.push(valor);
  }
  return itens;
}

// ══════════════════════════════════════════════════════════════════════════════
//  AÇÕES CRUD
// ══════════════════════════════════════════════════════════════════════════════

/**
 * GET — lista paginada com filtros e ordenação.
 * Filtros: tecnico, status, data, tipoServico, clienteNome, veiculoPlaca,
 *          dataInicio + dataFim, page, pageSize, sortBy, sortOrder.
 * @param {Object} filtros
 * @param {string} requestId
 */
function acaoListar(filtros, requestId) {
  const { headers, linhas } = obterDadosPlanilha();

  const filtroStatus = filtros.status ? normalizarStatus(filtros.status) : null;

  let servicos = linhas
    .map((linha) => linhaParaObjeto(linha, headers))
    .filter((s) => s.id !== '');

  // ✅ CORRIGIDO: comparação de status insensível a caixa/acentos.
  // Sem filtro de status → apenas registros não deletados.
  // status="deletado" → apenas os excluídos (soft delete).
  if (filtroStatus === STATUS.DELETADO) {
    servicos = servicos.filter((s) => normalizarStatus(s.status) === STATUS.DELETADO);
  } else if (filtroStatus) {
    servicos = servicos.filter((s) => normalizarStatus(s.status) === filtroStatus);
  } else {
    servicos = servicos.filter((s) => normalizarStatus(s.status) !== STATUS.DELETADO);
  }

  if (filtros.tecnico) {
    const termo = normalizarTexto(filtros.tecnico);
    servicos = servicos.filter((s) => normalizarTexto(s.tecnico).includes(termo));
  }
  if (filtros.tipoServico) {
    const termo = normalizarTexto(filtros.tipoServico);
    servicos = servicos.filter((s) => normalizarTexto(s.tipoServico).includes(termo));
  }
  if (filtros.clienteNome) {
    const termo = normalizarTexto(filtros.clienteNome);
    servicos = servicos.filter((s) => normalizarTexto(s.cliente && s.cliente.nome).includes(termo));
  }
  if (filtros.veiculoPlaca) {
    const termo = normalizarTexto(filtros.veiculoPlaca).replace(/[^a-z0-9]/g, '');
    servicos = servicos.filter((s) =>
      normalizarTexto(s.veiculo && s.veiculo.placa).replace(/[^a-z0-9]/g, '').includes(termo));
  }
  if (filtros.data) {
    const alvo = String(filtros.data).trim();
    servicos = servicos.filter((s) => s.data === alvo);
  }
  if (filtros.dataInicio || filtros.dataFim) {
    // ✅ CORRIGIDO: período inválido retorna 422 em vez de lista vazia silenciosa.
    if (!validarData(filtros.dataInicio) || !validarData(filtros.dataFim)) {
      return respostaErro('Validação falhou', 'Para filtro por período, informe dataInicio e dataFim válidos (DD/MM/AAAA).', 422, requestId);
    }
    const inicio = converterDataBR(filtros.dataInicio);
    const fim = converterDataBR(filtros.dataFim);
    servicos = servicos.filter((s) => {
      const d = converterDataBR(s.data);
      return d !== null && d >= inicio && d <= fim;
    });
  }

  // ✅ CORRIGIDO: ordenação por data é CRONOLÓGICA (não lexicográfica).
  const campoOrdenacao = filtros.sortBy || 'data';
  const ordem = filtros.sortOrder === 'desc' ? -1 : 1;
  servicos.sort((a, b) => {
    let resultado = compararCampo(a, b, campoOrdenacao);
    if (resultado === 0 && campoOrdenacao !== 'horario') {
      resultado = compararCampo(a, b, 'horario'); // desempate cronológico
    }
    return resultado * ordem;
  });

  const total = servicos.length;
  const page = Math.max(1, parseInt(filtros.page, 10) || 1);
  const pageSize = Math.min(CONFIG.MAX_PAGE_SIZE, Math.max(1, parseInt(filtros.pageSize, 10) || CONFIG.DEFAULT_PAGE_SIZE));
  const offset = (page - 1) * pageSize;

  return montarResposta({
    success: true,
    requestId,
    meta: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
    data: servicos.slice(offset, offset + pageSize),
  }, 200);
}

/**
 * CREATE — cria um novo agendamento.
 * Executa sob lock para evitar corrida entre criações simultâneas.
 * @param {Object} dados
 * @param {string} requestId
 */
function acaoCriar(dados, requestId) {
  return executarComLock(() => {
    const erro = validarAgendamento(dados);
    if (erro) return respostaErro('Validação falhou', erro, 422, requestId);

    // ✅ OTIMIZADO: CREATE lê apenas o cabeçalho (não a planilha inteira)
    // e usa UUID (não precisa reler a coluna de IDs).
    const aba = obterAbaDados();
    const headers = obterHeaders(aba);

    const agora = new Date().toISOString();
    const novo = {
      id: Utilities.getUuid(),
      tecnico: sanitizarTexto(dados.tecnico),
      data: dados.data,
      diaSemana: obterDiaSemana(dados.data),
      horario: dados.horario,
      tipoServico: sanitizarTexto(dados.tipoServico),
      ordemServico: sanitizarTexto(dados.ordemServico),
      observacao: sanitizarTextoLongo(dados.observacao),
      cliente: {
        nome: sanitizarTexto(dados.cliente ? dados.cliente.nome : ''),
        contato: sanitizarTexto(dados.cliente ? dados.cliente.contato : ''),
      },
      veiculo: {
        placa: normalizarPlaca(dados.veiculo ? dados.veiculo.placa : ''),
        marcaModelo: sanitizarTexto(dados.veiculo ? dados.veiculo.marcaModelo : ''),
      },
      endereco: {
        rua: sanitizarTexto(dados.endereco ? dados.endereco.rua : ''),
        numero: sanitizarTexto(dados.endereco ? dados.endereco.numero : ''),
        bairro: sanitizarTexto(dados.endereco ? dados.endereco.bairro : ''),
        cidade: sanitizarTexto(dados.endereco ? dados.endereco.cidade : ''),
        estado: sanitizarTexto(dados.endereco ? dados.endereco.estado : '').toUpperCase(),
        cep: sanitizarTexto(dados.endereco ? dados.endereco.cep : '').replace(/\D/g, ''),
      },
      // ✅ CORRIGIDO: grava sempre o valor canônico da aba Status.
      status: dados.status ? (resolverStatus(dados.status) || STATUS.PADRAO) : STATUS.PADRAO,
      criadoEm: agora,
      atualizadoEm: agora,
    };

    aba.appendRow(objetoParaLinha(novo, headers));
    registrarLog('CREATE', { requestId, id: novo.id });

    return montarResposta({ success: true, requestId, id: novo.id, data: novo }, 201);
  });
}

/**
 * UPDATE — atualização parcial por id.
 * ✅ SEGURANÇA: somente campos da whitelist são atualizáveis.
 *    "id", "criadoEm" e campos desconhecidos são ignorados.
 * ✅ PRESERVAÇÃO: colunas extras adicionadas manualmente à planilha
 *    (fora do contrato da API) não são apagadas.
 * @param {Object} dados
 * @param {string} requestId
 */
function acaoAtualizar(dados, requestId) {
  return executarComLock(() => {
    const aba = obterAbaDados();
    const headers = obterHeaders(aba);

    const numeroLinha = localizarLinhaPorId(aba, dados.id);
    if (numeroLinha === -1) {
      return respostaErro('Não encontrado', `Serviço com id "${dados.id}" não encontrado.`, 404, requestId);
    }

    const erro = validarAgendamento(dados);
    if (erro) return respostaErro('Validação falhou', erro, 422, requestId);

    // Snapshot da linha atual — base para preservar colunas extras.
    const numColunas = aba.getLastColumn();
    const linhaAtual = aba.getRange(numeroLinha, 1, 1, numColunas).getDisplayValues()[0];
    const atual = linhaParaObjeto(linhaAtual, headers);

    const camposAlterados = [];

    if (dados.data !== undefined) {
      atual.data = dados.data;
      atual.diaSemana = obterDiaSemana(dados.data);
      camposAlterados.push('data', 'diaSemana');
    }
    if (dados.tecnico !== undefined) { atual.tecnico = sanitizarTexto(dados.tecnico); camposAlterados.push('tecnico'); }
    if (dados.horario !== undefined) { atual.horario = dados.horario; camposAlterados.push('horario'); }
    if (dados.tipoServico !== undefined) { atual.tipoServico = sanitizarTexto(dados.tipoServico); camposAlterados.push('tipoServico'); }
    if (dados.ordemServico !== undefined) { atual.ordemServico = sanitizarTexto(dados.ordemServico); camposAlterados.push('ordemServico'); }
    if (dados.observacao !== undefined) { atual.observacao = sanitizarTextoLongo(dados.observacao); camposAlterados.push('observacao'); }
    if (dados.status !== undefined) { atual.status = resolverStatus(dados.status) || atual.status; camposAlterados.push('status'); }

    if (dados.cliente) {
      if (dados.cliente.nome !== undefined) { atual.cliente.nome = sanitizarTexto(dados.cliente.nome); camposAlterados.push('cliente.nome'); }
      if (dados.cliente.contato !== undefined) { atual.cliente.contato = sanitizarTexto(dados.cliente.contato); camposAlterados.push('cliente.contato'); }
    }
    if (dados.veiculo) {
      if (dados.veiculo.placa !== undefined) { atual.veiculo.placa = normalizarPlaca(dados.veiculo.placa); camposAlterados.push('veiculo.placa'); }
      if (dados.veiculo.marcaModelo !== undefined) { atual.veiculo.marcaModelo = sanitizarTexto(dados.veiculo.marcaModelo); camposAlterados.push('veiculo.marcaModelo'); }
    }
    if (dados.endereco) {
      if (dados.endereco.rua !== undefined) { atual.endereco.rua = sanitizarTexto(dados.endereco.rua); }
      if (dados.endereco.numero !== undefined) { atual.endereco.numero = sanitizarTexto(dados.endereco.numero); }
      if (dados.endereco.bairro !== undefined) { atual.endereco.bairro = sanitizarTexto(dados.endereco.bairro); }
      if (dados.endereco.cidade !== undefined) { atual.endereco.cidade = sanitizarTexto(dados.endereco.cidade); }
      if (dados.endereco.estado !== undefined) { atual.endereco.estado = sanitizarTexto(dados.endereco.estado).toUpperCase(); }
      if (dados.endereco.cep !== undefined) { atual.endereco.cep = sanitizarTexto(dados.endereco.cep).replace(/\D/g, ''); }
      if (Object.keys(dados.endereco).length > 0) camposAlterados.push('endereco.*');
    }

    atual.atualizadoEm = new Date().toISOString();

    const novaLinha = objetoParaLinha(atual, headers, linhaAtual);
    aba.getRange(numeroLinha, 1, 1, novaLinha.length).setValues([novaLinha]);

    registrarLog('UPDATE', { requestId, id: dados.id, camposAlterados });

    return montarResposta({ success: true, requestId, data: atual }, 200);
  });
}

/**
 * DELETE — exclusão lógica (padrão) ou física, conforme CONFIG.SOFT_DELETE.
 * @param {Object} dados
 * @param {string} requestId
 */
function acaoExcluir(dados, requestId) {
  return executarComLock(() => {
    const aba = obterAbaDados();
    const headers = obterHeaders(aba);

    const numeroLinha = localizarLinhaPorId(aba, dados.id);
    if (numeroLinha === -1) {
      return respostaErro('Não encontrado', `Serviço com id "${dados.id}" não encontrado.`, 404, requestId);
    }

    if (CONFIG.SOFT_DELETE) {
      const numColunas = aba.getLastColumn();
      const linhaAtual = aba.getRange(numeroLinha, 1, 1, numColunas).getDisplayValues()[0];
      const atual = linhaParaObjeto(linhaAtual, headers);

      atual.status = resolverStatus(STATUS.DELETADO) || STATUS.DELETADO;
      atual.atualizadoEm = new Date().toISOString();

      aba.getRange(numeroLinha, 1, 1, numColunas)
        .setValues([objetoParaLinha(atual, headers, linhaAtual)]);

      registrarLog('SOFT_DELETE', { requestId, id: dados.id });
      return montarResposta({ success: true, requestId, id: dados.id, message: 'Serviço marcado como deletado.' }, 200);
    }

    aba.deleteRow(numeroLinha);
    registrarLog('HARD_DELETE', { requestId, id: dados.id });
    return montarResposta({ success: true, requestId, id: dados.id, message: 'Serviço removido permanentemente.' }, 200);
  });
}

/**
 * STATS — estatísticas agregadas dos registros ativos.
 * @param {string} requestId
 */
function acaoEstatisticas(requestId) {
  const { headers, linhas } = obterDadosPlanilha();

  const servicos = linhas
    .map((linha) => linhaParaObjeto(linha, headers))
    .filter((s) => s.id !== '' && normalizarStatus(s.status) !== STATUS.DELETADO);

  const stats = {
    total: servicos.length,
    porStatus: {},
    porTecnico: {},
    porTipoServico: {},
    porDiaSemana: {},
    porMes: {}, // chave "AAAA-MM"
  };

  servicos.forEach((s) => {
    incrementarContador(stats.porStatus, normalizarStatus(s.status) || 'nao informado');
    incrementarContador(stats.porTecnico, s.tecnico || 'Não informado');
    incrementarContador(stats.porTipoServico, s.tipoServico || 'Não informado');
    incrementarContador(stats.porDiaSemana, s.diaSemana || 'Não informado');
    if (validarData(s.data)) {
      const partes = s.data.split('/'); // [DD, MM, AAAA]
      incrementarContador(stats.porMes, `${partes[2]}-${partes[1]}`);
    }
  });

  return montarResposta({ success: true, requestId, data: stats }, 200);
}

// ══════════════════════════════════════════════════════════════════════════════
//  CRUD DE TÉCNICOS
// ══════════════════════════════════════════════════════════════════════════════

/**
 * CREATE_TECNICO — adiciona novo técnico à aba de configuração.
 * @param {Object} dados  { nome: string }
 * @param {string} requestId
 */
function acaoCriarTecnico(dados, requestId) {
  return executarComLock(() => {
    const nome = sanitizarTexto(dados.nome);
    if (!nome) {
      return respostaErro('Validação falhou', 'Nome do técnico é obrigatório.', 422, requestId);
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let aba = ss.getSheetByName(ABAS_CONFIG.TECNICOS);
    if (!aba) {
      aba = ss.insertSheet(ABAS_CONFIG.TECNICOS);
      aba.appendRow(['nome', 'ativo']);
      aba.getRange(1, 1, 1, 2).setFontWeight('bold').setBackground('#4285F4').setFontColor('#FFFFFF');
      aba.setFrozenRows(1);
    }

    // Verifica duplicidade
    const existentes = obterItensConfig(ABAS_CONFIG.TECNICOS, 'nome');
    if (existentes.some((t) => normalizarTexto(t) === normalizarTexto(nome))) {
      return respostaErro('Técnico já existe', `Já existe um técnico com o nome "${nome}".`, 409, requestId);
    }

    aba.appendRow([nome, 'true']);
    limparCacheConfig();
    registrarLog('CREATE_TECNICO', { requestId, nome });
    return montarResposta({ success: true, requestId, data: { nome, ativo: true } }, 201);
  });
}

/**
 * UPDATE_TECNICO — atualiza nome ou status de um técnico.
 * @param {Object} dados  { nomeAntigo: string, nome?: string, ativo?: boolean }
 * @param {string} requestId
 */
function acaoAtualizarTecnico(dados, requestId) {
  return executarComLock(() => {
    const nomeAntigo = sanitizarTexto(dados.nomeAntigo);
    if (!nomeAntigo) {
      return respostaErro('Validação falhou', 'nomeAntigo é obrigatório.', 422, requestId);
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const aba = ss.getSheetByName(ABAS_CONFIG.TECNICOS);
    if (!aba) {
      return respostaErro('Aba não encontrada', 'Aba "Tecnicos" não existe.', 404, requestId);
    }

    const valores = aba.getDataRange().getDisplayValues();
    let linhaEncontrada = -1;

    for (let i = 1; i < valores.length; i++) {
      if (normalizarTexto(valores[i][0]) === normalizarTexto(nomeAntigo)) {
        linhaEncontrada = i + 1;
        break;
      }
    }

    if (linhaEncontrada === -1) {
      return respostaErro('Não encontrado', `Técnico "${nomeAntigo}" não encontrado.`, 404, requestId);
    }

    const camposAlterados = [];
    const novoNome = dados.nome !== undefined ? sanitizarTexto(dados.nome) : valores[linhaEncontrada - 1][0];
    const novoAtivo = dados.ativo !== undefined ? (dados.ativo ? 'true' : 'false') : valores[linhaEncontrada - 1][1];

    if (dados.nome !== undefined && novoNome !== valores[linhaEncontrada - 1][0]) {
      camposAlterados.push('nome');
    }
    if (dados.ativo !== undefined && novoAtivo !== valores[linhaEncontrada - 1][1]) {
      camposAlterados.push('ativo');
    }

    aba.getRange(linhaEncontrada, 1, 1, 2).setValues([[novoNome, novoAtivo]]);
    limparCacheConfig();
    registrarLog('UPDATE_TECNICO', { requestId, nomeAntigo, camposAlterados });
    return montarResposta({ success: true, requestId, data: { nome: novoNome, ativo: novoAtivo === 'true' } }, 200);
  });
}

/**
 * DELETE_TECNICO — remove técnico da aba (ou marca como inativo se preferir soft delete).
 * @param {Object} dados  { nome: string }
 * @param {string} requestId
 */
function acaoExcluirTecnico(dados, requestId) {
  return executarComLock(() => {
    const nome = sanitizarTexto(dados.nome);
    if (!nome) {
      return respostaErro('Validação falhou', 'Nome do técnico é obrigatório.', 422, requestId);
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const aba = ss.getSheetByName(ABAS_CONFIG.TECNICOS);
    if (!aba) {
      return respostaErro('Aba não encontrada', 'Aba "Tecnicos" não existe.', 404, requestId);
    }

    const valores = aba.getDataRange().getDisplayValues();
    let linhaEncontrada = -1;

    for (let i = 1; i < valores.length; i++) {
      if (normalizarTexto(valores[i][0]) === normalizarTexto(nome)) {
        linhaEncontrada = i + 1;
        break;
      }
    }

    if (linhaEncontrada === -1) {
      return respostaErro('Não encontrado', `Técnico "${nome}" não encontrado.`, 404, requestId);
    }

    // Verifica se há serviços associados
    const { headers, linhas } = obterDadosPlanilha();
    const servicosAssociados = linhas
      .map((linha) => linhaParaObjeto(linha, headers))
      .filter((s) => s.id !== '' && normalizarTexto(s.tecnico) === normalizarTexto(nome));

    if (servicosAssociados.length > 0) {
      return respostaErro(
        'Não é possível excluir',
        `O técnico "${nome}" possui ${servicosAssociados.length} serviço(s) associado(s). Desative-o em vez de excluir.`,
        409,
        requestId
      );
    }

    aba.deleteRow(linhaEncontrada);
    limparCacheConfig();
    registrarLog('DELETE_TECNICO', { requestId, nome });
    return montarResposta({ success: true, requestId, message: 'Técnico removido.' }, 200);
  });
}

// ══════════════════════════════════════════════════════════════════════════════
//  VALIDAÇÃO
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Verifica os campos obrigatórios de cada ação.
 * @param {string} acao
 * @param {Object} dados
 * @return {?string} Mensagem de erro ou null.
 */
function validarCamposObrigatorios(acao, dados) {
  const campos = CAMPOS_OBRIGATORIOS[acao] || [];
  for (const campo of campos) {
    if (dados[campo] === undefined || dados[campo] === null || dados[campo] === '') {
      return `Campo obrigatório ausente: "${campo}".`;
    }
  }
  return null;
}

/**
 * Valida os campos de um agendamento (parcial: valida apenas os presentes).
 * Valida data, horário, status, técnico e tipo de serviço.
 * @param {Object} dados
 * @return {?string} Mensagem de erro ou null.
 */
function validarAgendamento(dados) {
  if (dados.data !== undefined && !validarData(dados.data)) {
    return `Data inválida: "${dados.data}". Use o formato DD/MM/AAAA.`;
  }
  if (dados.horario !== undefined && !validarHorario(dados.horario)) {
    return `Horário inválido: "${dados.horario}". Use o formato HH:MM (24h).`;
  }
  if (dados.status !== undefined && resolverStatus(dados.status) === null) {
    return `Status inválido: "${dados.status}". Permitidos: ${obterStatusPermitidos().map((s) => s.exibicao).join(', ')}.`;
  }
  // ✅ CONSISTÊNCIA: técnico e tipo de serviço são validados contra as abas de
  // configuração (se a aba existir e tiver itens ativos; caso contrário, ignora).
  const erroTecnico = validarContraConfig(ABAS_CONFIG.TECNICOS, 'nome', 'Técnico', dados.tecnico);
  if (erroTecnico) return erroTecnico;
  const erroTipo = validarContraConfig(ABAS_CONFIG.TIPOS_SERVICO, 'nome', 'Tipo de serviço', dados.tipoServico);
  if (erroTipo) return erroTipo;
  return null;
}

/**
 * Valida um valor contra uma aba de configuração (comparação normalizada).
 * @param {string} nomeAba
 * @param {string} colunaValor
 * @param {string} rotulo       Nome amigável para a mensagem de erro.
 * @param {*} valor             Valor informado (undefined/null/'' → ignora).
 * @return {?string} Mensagem de erro ou null.
 */
function validarContraConfig(nomeAba, colunaValor, rotulo, valor) {
  if (valor === undefined || valor === null || valor === '') return null;
  const itens = obterItensConfig(nomeAba, colunaValor);
  if (itens.length === 0) return null; // aba inexistente/vazia: validação desativada
  const chave = normalizarTexto(valor);
  const valido = itens.some((item) => normalizarTexto(item) === chave);
  return valido ? null : `${rotulo} inválido: "${valor}". Valores permitidos: ${itens.join(', ')}.`;
}

/**
 * Verifica se a aba de dados possui todas as colunas obrigatórias.
 * ✅ OTIMIZADO: lê apenas a linha de cabeçalho, não a planilha inteira.
 * @return {?string} Mensagem de erro ou null se o schema está válido.
 */
function validarSchemaPlanilha() {
  try {
    const headers = obterHeaders(obterAbaDados());
    const existentes = new Set(headers);
    const faltando = COLUNAS_OBRIGATORIAS.filter((c) => !existentes.has(c));
    if (faltando.length > 0) {
      return `Colunas obrigatórias ausentes: ${faltando.join(', ')}. Encontradas: ${Array.from(existentes).join(', ')}.`;
    }
    return null;
  } catch (erro) {
    return `Erro ao validar schema: ${erro.message}`;
  }
}

// ══════════════════════════════════════════════════════════════════════════════
//  HELPERS DE PLANILHA
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Retorna a aba de dados (nome fixo em CONFIG.SHEET_NAME — determinístico,
 * nunca depende da aba "ativa" no momento).
 * @return {GoogleAppsScript.Spreadsheet.Sheet}
 */
function obterAbaDados() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('Nenhuma planilha ativa. O script deve estar vinculado a uma planilha.');
  const aba = ss.getSheetByName(CONFIG.SHEET_NAME);
  if (!aba) {
    throw new Error(`Aba de dados "${CONFIG.SHEET_NAME}" não encontrada. Ajuste CONFIG.SHEET_NAME ou execute inicializarPlanilha().`);
  }
  return aba;
}

/**
 * Lê apenas a linha de cabeçalho da aba.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} aba
 * @return {string[]}
 */
function obterHeaders(aba) {
  const ultimaColuna = aba.getLastColumn();
  if (ultimaColuna === 0) return [];
  return aba.getRange(1, 1, 1, ultimaColuna).getDisplayValues()[0]
    .map((h) => String(h).trim());
}

/**
 * Lê a aba de dados completa.
 * ✅ CORRIGIDO: usa getDisplayValues() — datas ("25/12/2025") e horários
 * ("08:00") chegam sempre como texto exibido, nunca como objeto Date.
 * @return {{headers: string[], linhas: string[][]}}
 */
function obterDadosPlanilha() {
  const aba = obterAbaDados();
  const ultimaLinha = aba.getLastRow();
  const ultimaColuna = aba.getLastColumn();
  if (ultimaLinha === 0 || ultimaColuna === 0) return { headers: [], linhas: [] };

  const valores = aba.getRange(1, 1, ultimaLinha, ultimaColuna).getDisplayValues();
  return {
    headers: valores[0].map((h) => String(h).trim()),
    linhas: valores.slice(1),
  };
}

/**
 * Localiza a linha (número real na planilha) de um id. Lê apenas a coluna A.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} aba
 * @param {string} id
 * @return {number} Número da linha (2-based) ou -1 se não encontrado.
 */
function localizarLinhaPorId(aba, id) {
  const ultimaLinha = aba.getLastRow();
  if (ultimaLinha < 2) return -1;

  const alvo = String(id);
  const ids = aba.getRange(2, 1, ultimaLinha - 1, 1).getDisplayValues();
  for (let i = 0; i < ids.length; i++) {
    if (String(ids[i][0]) === alvo) return i + 2;
  }
  return -1;
}

// ══════════════════════════════════════════════════════════════════════════════
//  CONVERSORES: LINHA ↔ OBJETO
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Converte uma linha da planilha em objeto JSON.
 * Não expõe metadados internos (número da linha) na resposta.
 * @param {Array} linha     Valores da linha.
 * @param {string[]} headers Cabeçalhos.
 * @return {Object}
 */
function linhaParaObjeto(linha, headers) {
  const objeto = {
    cliente: { nome: '', contato: '' },
    veiculo: { placa: '', marcaModelo: '' },
    endereco: { rua: '', numero: '', bairro: '', cidade: '', estado: '', cep: '' },
  };

  headers.forEach((header, i) => {
    const caminho = MAPA_COLUNAS[header];
    if (!caminho) return;
    let valor = linha[i];
    if (valor === undefined || valor === null) valor = '';
    definirValorAninhado(objeto, caminho, String(valor).trim());
  });

  return objeto;
}

/**
 * Converte um objeto em linha da planilha.
 * ✅ PRESERVAÇÃO: se "linhaAtual" for informada, colunas não gerenciadas pela
 * API (headers fora de MAPA_COLUNAS) mantêm o valor original.
 * @param {Object} objeto
 * @param {string[]} headers
 * @param {?Array} linhaAtual Snapshot da linha atual (opcional).
 * @return {Array}
 */
function objetoParaLinha(objeto, headers, linhaAtual) {
  return headers.map((header, i) => {
    const caminho = MAPA_COLUNAS[header];
    if (!caminho) {
      return linhaAtual && linhaAtual[i] !== undefined ? linhaAtual[i] : '';
    }
    const valor = obterValorAninhado(objeto, caminho);
    return valor === undefined || valor === null ? '' : valor;
  });
}

// ══════════════════════════════════════════════════════════════════════════════
//  UTILITÁRIOS DE OBJETO
// ══════════════════════════════════════════════════════════════════════════════

/** Chaves proibidas em caminhos aninhados (mitigação de prototype pollution). */
const CHAVES_PROIBIDAS = new Set(['__proto__', 'constructor', 'prototype']);

/**
 * Lê um valor em caminho aninhado ("cliente.nome").
 * @param {Object} objeto
 * @param {string} caminho
 * @return {*}
 */
function obterValorAninhado(objeto, caminho) {
  return caminho.split('.').reduce((atual, chave) => {
    if (atual === null || atual === undefined || CHAVES_PROIBIDAS.has(chave)) return undefined;
    return atual[chave] !== undefined ? atual[chave] : undefined;
  }, objeto);
}

/**
 * Define um valor em caminho aninhado ("cliente.nome"), criando níveis intermediários.
 * @param {Object} objeto
 * @param {string} caminho
 * @param {*} valor
 */
function definirValorAninhado(objeto, caminho, valor) {
  const chaves = caminho.split('.');
  let atual = objeto;
  for (let i = 0; i < chaves.length - 1; i++) {
    const chave = chaves[i];
    if (CHAVES_PROIBIDAS.has(chave)) return;
    if (!atual[chave] || typeof atual[chave] !== 'object') atual[chave] = {};
    atual = atual[chave];
  }
  const chaveFinal = chaves[chaves.length - 1];
  if (!CHAVES_PROIBIDAS.has(chaveFinal)) atual[chaveFinal] = valor;
}

/**
 * Incrementa um contador em um agregador.
 * @param {Object} agregador
 * @param {string} chave
 */
function incrementarContador(agregador, chave) {
  agregador[chave] = (agregador[chave] || 0) + 1;
}

/**
 * Compara dois objetos por um campo para ordenação.
 * Campo "data" usa comparação cronológica; demais usam localeCompare pt-BR.
 * @param {Object} a
 * @param {Object} b
 * @param {string} campo
 * @return {number}
 */
function compararCampo(a, b, campo) {
  if (campo === 'data') {
    const dA = converterDataBR(a.data);
    const dB = converterDataBR(b.data);
    return (dA ? dA.getTime() : 0) - (dB ? dB.getTime() : 0);
  }
  const vA = obterValorAninhado(a, campo);
  const vB = obterValorAninhado(b, campo);
  return String(vA === undefined || vA === null ? '' : vA)
    .localeCompare(String(vB === undefined || vB === null ? '' : vB), 'pt-BR', { sensitivity: 'base', numeric: true });
}

// ══════════════════════════════════════════════════════════════════════════════
//  UTILITÁRIOS DE DATA E HORA
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Valida data no formato DD/MM/AAAA (rejeita 31/02, etc.).
 * @param {*} dataStr
 * @return {boolean}
 */
function validarData(dataStr) {
  if (typeof dataStr !== 'string') return false;
  const m = dataStr.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return false;
  const dia = Number(m[1]), mes = Number(m[2]), ano = Number(m[3]);
  const data = new Date(ano, mes - 1, dia);
  return data.getFullYear() === ano && data.getMonth() === mes - 1 && data.getDate() === dia;
}

/**
 * Valida horário no formato HH:MM (24h).
 * @param {*} horario
 * @return {boolean}
 */
function validarHorario(horario) {
  if (typeof horario !== 'string') return false;
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(horario.trim());
}

/**
 * Converte "DD/MM/AAAA" em Date (meia-noite, fuso local).
 * @param {string} dataStr
 * @return {?Date} null se inválida.
 */
function converterDataBR(dataStr) {
  if (!validarData(dataStr)) return null;
  const partes = dataStr.trim().split('/').map(Number);
  return new Date(partes[2], partes[1] - 1, partes[0]);
}

/**
 * Deriva o dia da semana ("SEGUNDA"...) de uma data válida.
 * @param {string} dataStr
 * @return {string}
 */
function obterDiaSemana(dataStr) {
  const data = converterDataBR(dataStr);
  return data ? (DIAS_SEMANA[data.getDay()] || '') : '';
}

// ══════════════════════════════════════════════════════════════════════════════
//  NORMALIZAÇÃO E SANITIZAÇÃO
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Normaliza texto para comparações: minúsculas, sem acentos, espaços colapsados.
 * Garante que "CONCLUÍDO", "Concluído" e "concluido" sejam equivalentes.
 * @param {*} valor
 * @return {string}
 */
function normalizarTexto(valor) {
  if (valor === undefined || valor === null) return '';
  return String(valor)
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

/** Alias semântico de normalizarTexto para comparação de status. */
function normalizarStatus(valor) {
  return normalizarTexto(valor);
}

/**
 * Sanitiza campos curtos: remove caracteres de controle, colapsa espaços
 * e limita o tamanho (default 500).
 * @param {*} valor
 * @param {number} [tamanhoMax]
 * @return {string}
 */
function sanitizarTexto(valor, tamanhoMax) {
  if (valor === undefined || valor === null) return '';
  return String(valor)
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, tamanhoMax || CONFIG.LIMITE_CAMPO_TEXTO);
}

/**
 * Sanitiza campos livres longos (ex.: observação) PRESERVANDO quebras de linha.
 * @param {*} valor
 * @param {number} [tamanhoMax]
 * @return {string}
 */
function sanitizarTextoLongo(valor, tamanhoMax) {
  if (valor === undefined || valor === null) return '';
  return String(valor)
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '') // controles, exceto \t \n \r
    .trim()
    .substring(0, tamanhoMax || CONFIG.LIMITE_CAMPO_LONGO);
}

/**
 * Normaliza placa: maiúsculas, apenas letras/números/hífen.
 * @param {*} valor
 * @return {string}
 */
function normalizarPlaca(valor) {
  return sanitizarTexto(valor).toUpperCase().replace(/[^A-Z0-9-]/g, '');
}

/**
 * Retorna os status permitidos (aba "Status" ou fallback interno),
 * com forma exibida e forma normalizada para comparação.
 * @return {Array<{exibicao: string, chave: string}>}
 */
function obterStatusPermitidos() {
  const itens = obterItensConfig(ABAS_CONFIG.STATUS, 'nome');
  const base = itens.length > 0 ? itens : STATUS_PADRAO;
  return base.map((valor) => ({ exibicao: String(valor).trim(), chave: normalizarStatus(valor) }));
}

/**
 * Resolve um status informado para o valor canônico da aba "Status".
 * @param {*} valorInformado
 * @return {?string} Valor canônico ou null se inválido.
 */
function resolverStatus(valorInformado) {
  const chave = normalizarStatus(valorInformado);
  const encontrado = obterStatusPermitidos().find((s) => s.chave === chave);
  return encontrado ? encontrado.exibicao : null;
}

/**
 * Gera identificador único de requisição (para rastreamento nos logs).
 * @return {string}
 */
function gerarRequestId() {
  return `req-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

/**
 * Executa uma função sob lock de script, serializando escritas concorrentes
 * e evitando lost updates entre requisições simultâneas.
 * @param {Function} fn Função que retorna a resposta HTTP.
 * @return {*} Resultado de fn().
 */
function executarComLock(fn) {
  const lock = LockService.getScriptLock();
  lock.waitLock(CONFIG.LOCK_TIMEOUT_MS); // estoura o prazo → cai no catch do doPost (500)
  try {
    return fn();
  } finally {
    lock.releaseLock();
  }
}

// ══════════════════════════════════════════════════════════════════════════════
//  LOGGING E AUDITORIA
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Registra evento de auditoria na planilha.
 * Reservado a MUTAÇÕES, ERROS e FALHAS DE AUTENTICAÇÃO — leituras usam
 * apenas console.log (Stackdriver).
 * ✅ LGPD: "detalhes" nunca deve conter dados pessoais — apenas ids,
 * nomes de campos alterados, durações e mensagens de erro.
 * @param {string} evento  CREATE | UPDATE | SOFT_DELETE | HARD_DELETE | ERRO_INTERNO | ...
 * @param {Object} detalhes
 */
function registrarLog(evento, detalhes) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let aba = ss.getSheetByName(CONFIG.LOG_SHEET_NAME);

    if (!aba) {
      aba = ss.insertSheet(CONFIG.LOG_SHEET_NAME);
      aba.appendRow(['timestamp', 'evento', 'requestId', 'detalhes', 'usuario']);
      aba.getRange(1, 1, 1, 5).setFontWeight('bold').setBackground('#E8EAED');
      aba.setFrozenRows(1);
    }

    // Com deploy "Qualquer pessoa" o e-mail costuma ser vazio → 'anonymous'.
    const usuario = Session.getActiveUser().getEmail() || 'anonymous';

    aba.appendRow([
      new Date().toISOString(),
      evento,
      (detalhes && detalhes.requestId) || 'N/A',
      JSON.stringify(detalhes || {}).substring(0, 50000),
      usuario,
    ]);
  } catch (erro) {
    console.error('Falha ao registrar log de auditoria:', erro);
  }
}

/**
 * [GATILHO] Limpeza diária de logs. Criada por agendarLimpezaLogs().
 * ⚠️ Não usa SpreadsheetApp.getUi() — indisponível em contexto de gatilho.
 */
function limparLogsDiario() {
  limparLogs(CONFIG.LOGS_MAX_REGISTROS);
}

/**
 * Remove logs antigos, mantendo os N registros mais recentes.
 * @param {number} manterUltimos
 */
function limparLogs(manterUltimos) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const aba = ss.getSheetByName(CONFIG.LOG_SHEET_NAME);
  if (!aba) return;

  const ultimaLinha = aba.getLastRow();
  const excedente = ultimaLinha - 1 - (manterUltimos || CONFIG.LOGS_MAX_REGISTROS);
  if (excedente > 0) aba.deleteRows(2, excedente);
}

/**
 * [USO MANUAL] Cria o gatilho diário (03h) de limpeza de logs.
 */
function agendarLimpezaLogs() {
  const jaExiste = ScriptApp.getProjectTriggers()
    .some((t) => t.getHandlerFunction() === 'limparLogsDiario');
  if (jaExiste) {
    SpreadsheetApp.getUi().alert('O gatilho de limpeza de logs já existe.');
    return;
  }
  ScriptApp.newTrigger('limparLogsDiario').timeBased().atHour(3).everyDays(1).create();
  SpreadsheetApp.getUi().alert('✅ Gatilho diário de limpeza de logs criado (03:00).');
}

// ══════════════════════════════════════════════════════════════════════════════
//  RESPOSTA HTTP
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Monta a resposta JSON padrão.
 * NOTA: Apps Script sempre responde HTTP 200 — o status lógico da operação é
 * informado em "_httpStatus" para o cliente interpretar.
 * @param {Object} dados
 * @param {number} [status=200]
 * @return {GoogleAppsScript.Content.TextOutput}
 */
function montarResposta(dados, status) {
  const codigo = status || 200;
  const payload = Object.assign({}, dados, {
    _httpStatus: codigo,
    _timestamp: new Date().toISOString(),
  });
  return ContentService.createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Atalho para respostas de erro padronizadas.
 * @param {string} erro       Título do erro.
 * @param {string} detalhe    Explicação acionável (só em erros 4xx; 5xx é genérico).
 * @param {number} status
 * @param {string} requestId
 */
function respostaErro(erro, detalhe, status, requestId) {
  return montarResposta({ success: false, error: erro, details: detalhe, requestId }, status);
}

// ══════════════════════════════════════════════════════════════════════════════
//  FUNÇÕES DE SETUP — USO MANUAL NO EDITOR
// ══════════════════════════════════════════════════════════════════════════════

/**
 * [USO MANUAL] Cadastra a API key nas Script Properties (nunca no código).
 */
function definirApiKey() {
  const ui = SpreadsheetApp.getUi();
  const resposta = ui.prompt('Configuração', 'Informe a API key (mín. 16 caracteres):', ui.ButtonSet.OK_CANCEL);
  if (resposta.getSelectedButton() !== ui.Button.OK) return;

  const chave = resposta.getResponseText().trim();
  if (chave.length < 16) {
    ui.alert('❌ A chave deve ter pelo menos 16 caracteres.');
    return;
  }
  PropertiesService.getScriptProperties().setProperty('API_KEY', chave);
  ui.alert('✅ API key salva nas Script Properties.');
}

/**
 * [USO MANUAL] Prepara a aba de dados: cria se necessário, grava cabeçalho,
 * aplica formatação e congela a primeira linha.
 * ✅ SEGURANÇA: NÃO apaga dados existentes (a versão anterior fazia clear()).
 */
function inicializarPlanilha() {
  const ui = SpreadsheetApp.getUi();
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  let aba = ss.getSheetByName(CONFIG.SHEET_NAME);
  let abaNova = false;

  if (aba) {
    const confirmar = ui.alert(
      'Inicializar planilha',
      `A aba "${CONFIG.SHEET_NAME}" já existe. O cabeçalho da linha 1 será substituído (dados preservados). Continuar?`,
      ui.ButtonSet.YES_NO
    );
    if (confirmar !== ui.Button.YES) return;
  } else {
    aba = ss.insertSheet(CONFIG.SHEET_NAME);
    abaNova = true;
  }

  // Texto puro na aba nova: impede que o Sheets converta "25/12/2025" e "08:00"
  // em Date. Em aba existente, use migrarParaTexto().
  if (abaNova) {
    const letraFinal = aba.getRange(1, COLUNAS_OBRIGATORIAS.length, 1, 1)
      .getA1Notation().replace(/\d/g, '');
    aba.getRange(`A:${letraFinal}`).setNumberFormat('@');
  }

  aba.getRange(1, 1, 1, COLUNAS_OBRIGATORIAS.length).setValues([COLUNAS_OBRIGATORIAS.slice()]);
  aba.getRange(1, 1, 1, COLUNAS_OBRIGATORIAS.length)
    .setFontWeight('bold')
    .setBackground('#4285F4')
    .setFontColor('#FFFFFF')
    .setHorizontalAlignment('center');

  const larguras = [22, 15, 12, 12, 10, 18, 16, 30, 22, 15, 12, 20, 22, 10, 16, 16, 10, 12, 14, 22, 22];
  larguras.forEach((l, i) => aba.setColumnWidth(i + 1, l));
  aba.setFrozenRows(1);

  if (aba.getFilter()) aba.getFilter().remove();
  aba.getRange(1, 1, 1, COLUNAS_OBRIGATORIAS.length).createFilter();

  ui.alert(
    abaNova
      ? '✅ Planilha inicializada! Agora execute definirApiKey() e inicializarAbasConfig().'
      : '✅ Cabeçalho reaplicado. Se a aba contém datas/horários legados (objetos Date), execute migrarParaTexto().'
  );
}

/**
 * [USO MANUAL] Cria (se ausente) as abas de configuração.
 * Idempotente — pode ser executada quantas vezes quiser.
 */
function inicializarAbasConfig() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  criarAbaConfigSeAusente(ss, ABAS_CONFIG.STATUS, ['nome', 'ativo'], [
    ['PENDENTE', 'true'], ['EM ANDAMENTO', 'true'], ['CONCLUIDO', 'true'],
    ['CANCELADO', 'true'], ['DELETADO', 'true'],
  ]);
  criarAbaConfigSeAusente(ss, ABAS_CONFIG.TECNICOS, ['nome', 'ativo'], [
    ['JACKSON', 'true'], ['MARCOS', 'true'], ['ROBERTO', 'true'],
  ]);
  criarAbaConfigSeAusente(ss, ABAS_CONFIG.TIPOS_SERVICO, ['nome', 'ativo'], [
    ['INSTALAÇÃO', 'true'], ['MANUTENÇÃO', 'true'],
    ['SUBSTITUIÇÃO DE CHIP', 'true'], ['RETIRADA', 'true'],
  ]);
  criarAbaConfigSeAusente(ss, ABAS_CONFIG.HORARIOS, ['horario', 'ativo'], [
    ['08:00', 'true'], ['09:00', 'true'], ['10:00', 'true'], ['11:00', 'true'],
    ['13:00', 'true'], ['14:00', 'true'], ['15:00', 'true'], ['16:00', 'true'], ['17:00', 'true'],
  ]);

  limparCacheConfig();
  SpreadsheetApp.getUi().alert('✅ Abas de configuração verificadas/criadas e cache limpo.');
}

/**
 * Cria uma aba de configuração se não existir. Retorna true se criou.
 * @param {GoogleAppsScript.Spreadsheet.Spreadsheet} ss
 * @param {string} nomeAba
 * @param {string[]} cabecalho
 * @param {Array<Array>} linhas
 * @return {boolean}
 */
function criarAbaConfigSeAusente(ss, nomeAba, cabecalho, linhas) {
  if (ss.getSheetByName(nomeAba)) return false;

  const aba = ss.insertSheet(nomeAba);
  // ✅ Texto puro ANTES de gravar: "08:00" permanece texto (corrige a raiz do bug da v3/v4).
  aba.getRange('A:B').setNumberFormat('@');
  aba.getRange(1, 1, linhas.length + 1, cabecalho.length).setValues([cabecalho.slice()].concat(linhas));
  aba.getRange(1, 1, 1, cabecalho.length)
    .setFontWeight('bold').setBackground('#4285F4').setFontColor('#FFFFFF');
  aba.setColumnWidth(1, 220);
  aba.setColumnWidth(2, 90);
  aba.setFrozenRows(1);
  return true;
}

/**
 * [USO MANUAL] Migra a aba de dados para texto puro: regrava todos os valores
 * com o que é EXIBIDO hoje (datas "25/12/2025" viram texto definitivo).
 * Use ao adotar esta versão em planilha já populada com objetos Date.
 */
function migrarParaTexto() {
  const ui = SpreadsheetApp.getUi();
  const aba = obterAbaDados();

  if (aba.getLastRow() < 1) {
    ui.alert('A aba está vazia.');
    return;
  }
  const confirmar = ui.alert(
    'Migrar para texto',
    'Todos os valores serão regravados como texto (preservando o conteúdo exibido hoje). Continuar?',
    ui.ButtonSet.YES_NO
  );
  if (confirmar !== ui.Button.YES) return;

  const ultimaColuna = aba.getLastColumn();
  const valores = aba.getRange(1, 1, aba.getLastRow(), ultimaColuna).getDisplayValues();

  const letraFinal = aba.getRange(1, ultimaColuna, 1, 1).getA1Notation().replace(/\d/g, '');
  aba.getRange(`A:${letraFinal}`).setNumberFormat('@');
  aba.getRange(1, 1, valores.length, ultimaColuna).setValues(valores);

  ui.alert('✅ Migração concluída: dados e horários agora são texto puro.');
}

/**
 * [USO MANUAL] Limpa o cache das abas de configuração.
 * Execute após editar as abas Status/Tecnicos/TiposServico/Horarios
 * para que as mudanças tenham efeito imediato (o cache dura 5 minutos).
 */
function limparCacheConfig() {
  const cache = CacheService.getScriptCache();
  cache.removeAll(Object.keys(ABAS_CONFIG).map((k) => `cfg:${ABAS_CONFIG[k]}`));
}