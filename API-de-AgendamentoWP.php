<?php

/**
 * Plugin Name: API de Agendamento de Serviços
 * Description: API REST para agendamento de serviços técnicos (MySQL).
 * Version: 5.2.0
 * Requires PHP: 7.4
 *
 * CORREÇÕES DA VERSÃO 5.2.0:
 *  [P0] Filtro por data corrigido — STR_TO_DATE("%d/%m/%Y") conflitava com
 *       $wpdb->prepare() (o %d era interpretado como placeholder). Agora a data
 *       é convertida em PHP e comparada como 'AAAA-MM-DD' (sargable, usa índice).
 *  [P0] Rate limit agora é funcional e atômico: usa wp_cache_add/incr quando há
 *       object cache persistente (Redis/Memcached) ou UPSERT numa tabela MySQL
 *       como fallback — o antigo get/set por requisição não contava nada.
 *  [P0] Race condition (TOCTOU) do agendamento resolvida com coluna gerada
 *       slot_ativo + índice único (tecnico, data, horario, slot_ativo). Cancelados
 *       geram NULL e não bloqueiam reagendamento.
 *  [P1] Chave via query string (?key=) REMOVIDA (vaza em logs/proxies). Use o
 *       header X-API-Key ou o campo apiKey do JSON.
 *  [P1] Bloqueio de IP após falhas repetidas de autenticação (anti brute-force).
 *  [P1] CREATE/UPDATE validam técnico (cadastrado e ativo) e tipo de serviço
 *       contra os catálogos.
 *  [P1] Renomear técnico (UPDATE_TECNICO) propaga para os agendamentos.
 *  [P1] STATS agrega no banco (GROUP BY) — não carrega mais a tabela inteira.
 *  [P1] Logs registram IP.
 *  [P2] Migrações versionadas (rodam no upgrade, não só na ativação).
 *  [P2] Limpeza de logs via WP-Cron (não mais dentro da requisição do usuário).
 *  [P2] Página administrativa (Ferramentas > API de Agendamento) para ver /
 *       rotacionar a chave, limpar cache de configurações e apagar logs.
 *  [P2] remove_accents() (independente de locale) substitui iconv.
 *  [P2] Hook de desinstalação remove tabelas e opções (DESTRUTIVO — leia o
 *       comentário em agendamento_desinstalar()).
 *
 * ATENÇÃO — MUDANÇAS COMPARTILHÁVEIS COM CLIENTES EXISTENTES:
 *  1. A chave NÃO é mais aceita via ?key= na URL.
 *  2. CREATE/UPDATE exigem técnico cadastrado/ativo e tipo de serviço do catálogo.
 *  3. O rate limit agora realmente limita (429 após 100 req/min por chave).
 */

if (!defined('ABSPATH')) exit;

define('AGENDAMENTO_VERSION', '5.2.0');
define('AGENDAMENTO_DB_VERSION', '5.2.0');

// Limites de rate limit / anti brute-force
define('AGENDAMENTO_RL_CHAVE_POR_MINUTO', 100); // requisições por minuto, por chave
define('AGENDAMENTO_RL_IP_POR_MINUTO', 240);    // requisições por minuto, por IP (todas)
define('AGENDAMENTO_RL_AUTH_ERROS', 10);        // falhas de autenticação...
define('AGENDAMENTO_RL_AUTH_JANELA', 300);      // ...por janela de 5 minutos, por IP

// ══════════════════════════════════════════════════════════════════════════════
//  ATIVAÇÃO / DESATIVAÇÃO / DESINSTALAÇÃO / MIGRAÇÃO / CRON
// ══════════════════════════════════════════════════════════════════════════════

register_activation_hook(__FILE__, 'agendamento_instalar');
register_deactivation_hook(__FILE__, 'agendamento_desativar');
register_uninstall_hook(__FILE__, 'agendamento_desinstalar');

// Migração versionada: roda no upgrade do plugin (não apenas na ativação).
add_action('plugins_loaded', 'agendamento_verificar_versao_db');

// Cron de manutenção (limpeza de logs e do contador de rate limit).
add_action('agendamento_cron_manutencao', 'agendamento_cron_manutencao');

function agendamento_verificar_versao_db()
{
    if (get_option('agendamento_db_version') !== AGENDAMENTO_DB_VERSION) {
        agendamento_instalar();
    }
}

function agendamento_instalar()
{
    agendamento_criar_tabelas();
    agendamento_migrar_5_2_0();
    agendamento_inserir_dados_padrao();

    if (!get_option('agendamento_api_key')) {
        update_option('agendamento_api_key', wp_generate_password(32, false));
    }

    if (!wp_next_scheduled('agendamento_cron_manutencao')) {
        wp_schedule_event(time() + 120, 'hourly', 'agendamento_cron_manutencao');
    }

    update_option('agendamento_db_version', AGENDAMENTO_DB_VERSION, true);
}

function agendamento_desativar()
{
    wp_clear_scheduled_hook('agendamento_cron_manutencao');
}

/**
 * DESINSTALAÇÃO — ATENÇÃO: remove TODAS as tabelas e opções do plugin
 * (agendamentos, técnicos, configurações, logs e chaves). Isto é destrutivo
 * e irreversível. Desative e apague o plugin apenas se realmente quiser
 * eliminar todos os dados.
 */
function agendamento_desinstalar()
{
    global $wpdb;

    foreach (
        [
            'agendamentos',
            'agendamentos_tecnicos',
            'agendamentos_config',
            'agendamentos_logs',
            'agendamentos_rl'
        ] as $sufixo
    ) {
        $wpdb->query("DROP TABLE IF EXISTS {$wpdb->prefix}{$sufixo}");
    }

    delete_option('agendamento_api_key');
    delete_option('agendamento_db_version');

    foreach (['status', 'tipo_servico', 'horario'] as $tipo) {
        delete_transient('ag_cfg_' . $tipo);
        delete_transient('ag_cfg_' . $tipo . '_map');
    }

    wp_clear_scheduled_hook('agendamento_cron_manutencao');
}

function agendamento_criar_tabelas()
{
    global $wpdb;
    $charset = $wpdb->get_charset_collate();

    // Nota: slot_ativo (coluna gerada) NÃO fica no CREATE porque o parser do
    // dbDelta não lida bem com expressões contendo vírgulas. Ela é adicionada
    // pelo migration agendamento_migrar_5_2_0(), tanto em instalações novas
    // quanto em upgrades.
    $sql_agendamentos = "CREATE TABLE {$wpdb->prefix}agendamentos (
        id VARCHAR(36) PRIMARY KEY,
        tecnico VARCHAR(100) NOT NULL,
        data DATE NOT NULL,
        dia_semana VARCHAR(15) DEFAULT '',
        horario TIME NOT NULL,
        tipo_servico VARCHAR(100) NOT NULL,
        ordem_servico VARCHAR(100) DEFAULT '',
        observacao TEXT,
        cliente_nome VARCHAR(200) DEFAULT '',
        cliente_contato VARCHAR(100) DEFAULT '',
        veiculo_placa VARCHAR(20) DEFAULT '',
        veiculo_marca_modelo VARCHAR(100) DEFAULT '',
        endereco_rua VARCHAR(200) DEFAULT '',
        endereco_numero VARCHAR(20) DEFAULT '',
        endereco_bairro VARCHAR(100) DEFAULT '',
        endereco_cidade VARCHAR(100) DEFAULT '',
        endereco_estado CHAR(2) DEFAULT '',
        endereco_cep VARCHAR(10) DEFAULT '',
        status VARCHAR(50) DEFAULT 'pendente',
        criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
        atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        deletado TINYINT(1) DEFAULT 0,
        INDEX idx_tecnico (tecnico),
        INDEX idx_data (data),
        INDEX idx_status (status),
        INDEX idx_deletado (deletado)
    ) $charset;";

    $sql_tecnicos = "CREATE TABLE {$wpdb->prefix}agendamentos_tecnicos (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        nome VARCHAR(100) NOT NULL UNIQUE,
        ativo TINYINT(1) DEFAULT 1,
        cpf VARCHAR(14) DEFAULT '',
        cnpj VARCHAR(18) DEFAULT '',
        whatsapp VARCHAR(20) DEFAULT '',
        vinculo VARCHAR(30) DEFAULT '',
        criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
    ) $charset;";

    $sql_config = "CREATE TABLE {$wpdb->prefix}agendamentos_config (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        tipo ENUM('status', 'tipo_servico', 'horario') NOT NULL,
        nome VARCHAR(100) NOT NULL,
        ativo TINYINT(1) DEFAULT 1,
        INDEX idx_tipo (tipo)
    ) $charset;";

    $sql_logs = "CREATE TABLE {$wpdb->prefix}agendamentos_logs (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        evento VARCHAR(50) NOT NULL,
        request_id VARCHAR(50) DEFAULT '',
        detalhes TEXT,
        usuario VARCHAR(255) DEFAULT 'anonymous',
        ip VARCHAR(45) DEFAULT '',
        INDEX idx_timestamp (timestamp)
    ) $charset;";

    // Contadores do rate limit (fallback atômico quando não há object cache
    // persistente; o UPSERT abaixo é atômico no MySQL).
    $sql_rl = "CREATE TABLE {$wpdb->prefix}agendamentos_rl (
        bucket VARCHAR(64) NOT NULL,
        janela BIGINT UNSIGNED NOT NULL,
        contagem INT UNSIGNED NOT NULL DEFAULT 0,
        PRIMARY KEY  (bucket, janela)
    ) $charset;";

    require_once ABSPATH . 'wp-admin/includes/upgrade.php';
    dbDelta($sql_agendamentos);
    dbDelta($sql_tecnicos);
    dbDelta($sql_config);
    dbDelta($sql_logs);
    dbDelta($sql_rl);
}

/**
 * Migração 5.2.0 — coluna gerada + índice único anti-corrida.
 *
 * slot_ativo = 1 quando o slot (tecnico, data, horario) está realmente ocupado,
 * NULL quando o agendamento está cancelado, deletado ou marcado como excluído.
 * Como o MySQL/MariaDB permite múltiplas linhas com NULL num índice único,
 * serviços cancelados não bloqueiam reagendamentos no mesmo horário.
 *
 * Requer MySQL 5.7+ / MariaDB 10.2+ (colunas geradas). Em servidores mais
 * antigos o ALTER falha, é registrado no error_log e o sistema segue usando
 * apenas a checagem em nível de aplicação.
 */
function agendamento_migrar_5_2_0()
{
    global $wpdb;
    $tabela = $wpdb->prefix . 'agendamentos';

    $colunas = $wpdb->get_col("SHOW COLUMNS FROM {$tabela}");
    if (is_array($colunas) && !in_array('slot_ativo', $colunas, true)) {
        $wpdb->query(
            "ALTER TABLE {$tabela}
             ADD COLUMN slot_ativo TINYINT(1) GENERATED ALWAYS AS
             (IF(deletado = 1 OR LOWER(status) IN ('cancelado','deletado'), NULL, 1)) STORED"
        );
        if ($wpdb->last_error) {
            error_log('[agendamento] Falha ao criar coluna slot_ativo: ' . $wpdb->last_error);
        }
        $colunas = $wpdb->get_col("SHOW COLUMNS FROM {$tabela}");
    }

    $tem_slot = is_array($colunas) && in_array('slot_ativo', $colunas, true);
    if (!$tem_slot) {
        error_log('[agendamento] Coluna slot_ativo indisponível; o índice único anti-duplicidade não será criado. A checagem em nível de aplicação permanece ativa.');
        return;
    }

    $indice_existe = (int) $wpdb->get_var($wpdb->prepare(
        "SELECT COUNT(*) FROM information_schema.STATISTICS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = %s AND INDEX_NAME = %s",
        $tabela,
        'uniq_slot'
    ));

    if ($indice_existe === 0) {
        // Não cria o índice único se já existirem conflitos legados no banco.
        $duplicados = (int) $wpdb->get_var(
            "SELECT COUNT(*) FROM (
                SELECT 1 FROM {$tabela} WHERE slot_ativo = 1
                GROUP BY tecnico, data, horario HAVING COUNT(*) > 1
            ) d"
        );
        if ($duplicados > 0) {
            error_log("[agendamento] Existem {$duplicados} slot(s) com conflito legado; índice único uniq_slot NÃO foi criado. Resolva os conflitos e reative o plugin.");
            return;
        }

        $wpdb->query("ALTER TABLE {$tabela} ADD UNIQUE KEY uniq_slot (tecnico, data, horario, slot_ativo)");
        if ($wpdb->last_error) {
            error_log('[agendamento] Falha ao criar índice uniq_slot: ' . $wpdb->last_error);
        }
    }
}

function agendamento_inserir_dados_padrao()
{
    global $wpdb;
    $tabela = $wpdb->prefix . 'agendamentos_config';

    if ((int) $wpdb->get_var("SELECT COUNT(*) FROM $tabela") > 0) return;

    $dados = [
        ['tipo' => 'status', 'nome' => 'PENDENTE', 'ativo' => 1],
        ['tipo' => 'status', 'nome' => 'EM ANDAMENTO', 'ativo' => 1],
        ['tipo' => 'status', 'nome' => 'CONCLUIDO', 'ativo' => 1],
        ['tipo' => 'status', 'nome' => 'CANCELADO', 'ativo' => 1],
        ['tipo' => 'status', 'nome' => 'DELETADO', 'ativo' => 1],
        ['tipo' => 'tipo_servico', 'nome' => 'INSTALAÇÃO', 'ativo' => 1],
        ['tipo' => 'tipo_servico', 'nome' => 'MANUTENÇÃO', 'ativo' => 1],
        ['tipo' => 'tipo_servico', 'nome' => 'SUBSTITUIÇÃO DE CHIP', 'ativo' => 1],
        ['tipo' => 'tipo_servico', 'nome' => 'RETIRADA', 'ativo' => 1],
        ['tipo' => 'horario', 'nome' => '08:00', 'ativo' => 1],
        ['tipo' => 'horario', 'nome' => '09:00', 'ativo' => 1],
        ['tipo' => 'horario', 'nome' => '10:00', 'ativo' => 1],
        ['tipo' => 'horario', 'nome' => '11:00', 'ativo' => 1],
        ['tipo' => 'horario', 'nome' => '13:00', 'ativo' => 1],
        ['tipo' => 'horario', 'nome' => '14:00', 'ativo' => 1],
        ['tipo' => 'horario', 'nome' => '15:00', 'ativo' => 1],
        ['tipo' => 'horario', 'nome' => '16:00', 'ativo' => 1],
        ['tipo' => 'horario', 'nome' => '17:00', 'ativo' => 1],
    ];

    foreach ($dados as $row) {
        $wpdb->insert($tabela, $row, ['%s', '%s', '%d']);
    }

    $tec_tabela = $wpdb->prefix . 'agendamentos_tecnicos';
    foreach (['JACKSON', 'MARCOS', 'ROBERTO'] as $nome) {
        $wpdb->insert($tec_tabela, ['nome' => $nome, 'ativo' => 1], ['%s', '%d']);
    }
}

// ══════════════════════════════════════════════════════════════════════════════
//  REGISTRO DAS ROTAS REST API
// ══════════════════════════════════════════════════════════════════════════════

add_action('rest_api_init', 'agendamento_registrar_rotas');

function agendamento_registrar_rotas()
{
    $namespace = 'agendamento/v1';

    register_rest_route($namespace, '/executar', [
        'methods'  => 'POST',
        'callback' => 'agendamento_endpoint_executar',
        'permission_callback' => '__return_true', // autenticação própria via API key
    ]);

    register_rest_route($namespace, '/health', [
        'methods'  => 'GET',
        'callback' => 'agendamento_endpoint_health',
        'permission_callback' => '__return_true',
    ]);
}

// ══════════════════════════════════════════════════════════════════════════════
//  AUTENTICAÇÃO
//  A chave é aceita APENAS via header X-API-Key ou campo apiKey do JSON.
//  Query string (?key=) foi removida por vazar em logs de servidor/proxies.
//  Após AGENDAMENTO_RL_AUTH_ERROS falhas, o IP fica bloqueado até a janela
//  de AGENDAMENTO_RL_AUTH_JANELA segundos expirar.
// ══════════════════════════════════════════════════════════════════════════════

function agendamento_obter_chave_informada(WP_REST_Request $request)
{
    $header = trim((string) $request->get_header('X-API-Key'));
    if ($header !== '') return $header;

    $body = $request->get_json_params();
    if (is_array($body) && isset($body['apiKey']) && is_string($body['apiKey'])) {
        $valor = trim($body['apiKey']);
        if ($valor !== '') return $valor;
    }

    return '';
}

function agendamento_autenticar(WP_REST_Request $request)
{
    $chave_esperada = (string) get_option('agendamento_api_key');
    if ($chave_esperada === '') {
        return new WP_Error('auth', 'API key não configurada no servidor.', ['status' => 401]);
    }

    $ip = agendamento_obter_ip();
    $bucket_erros = 'authfail:' . agendamento_rl_bucket($ip);

    if (agendamento_rl_get($bucket_erros, AGENDAMENTO_RL_AUTH_JANELA) >= AGENDAMENTO_RL_AUTH_ERROS) {
        return new WP_Error('lockout', 'Muitas tentativas de autenticação falharam neste endereço. Aguarde alguns minutos.', ['status' => 429]);
    }

    $chave_informada = agendamento_obter_chave_informada($request);

    if ($chave_informada === '') {
        agendamento_rl_hit($bucket_erros, AGENDAMENTO_RL_AUTH_JANELA);
        agendamento_log('AUTH_FALHA', ['motivo' => 'chave ausente', 'ip' => $ip]);
        return new WP_Error('auth', 'API key ausente. Envie via header X-API-Key ou campo apiKey do JSON.', ['status' => 401]);
    }

    if (!hash_equals($chave_esperada, $chave_informada)) {
        agendamento_rl_hit($bucket_erros, AGENDAMENTO_RL_AUTH_JANELA);
        agendamento_log('AUTH_FALHA', ['motivo' => 'chave invalida', 'ip' => $ip]);
        return new WP_Error('auth', 'API key inválida.', ['status' => 401]);
    }

    return true;
}

// ══════════════════════════════════════════════════════════════════════════════
//  RATE LIMIT
//  Duas estratégias, ambas ATÔMICAS:
//   a) Object cache persistente (Redis/Memcached): wp_cache_add + wp_cache_incr.
//   b) Fallback: UPSERT numa tabela MySQL (INSERT ... ON DUPLICATE KEY UPDATE
//      contagem = contagem + 1), atômico no banco. Custa 1-2 queries por
//      requisição — preço aceitável por um limitador que funciona de verdade.
//  Buckets: "key:" (por chave autenticada), "ip:" (por IP, todas as requisições)
//  e "authfail:" (falhas de autenticação por IP).
// ══════════════════════════════════════════════════════════════════════════════

function agendamento_rl_bucket($valor)
{
    return substr(hash('sha256', (string) $valor), 0, 32);
}

/** Incrementa e retorna o contador do bucket na janela atual. */
function agendamento_rl_hit($bucket, $janela)
{
    $janela = (int) $janela;
    $inicio = (int) floor(time() / $janela) * $janela;

    if (wp_using_ext_object_cache()) {
        $cache_key = $bucket . '_' . $inicio;
        if (wp_cache_get($cache_key, 'agendamento_rl') === false) {
            wp_cache_add($cache_key, 0, 'agendamento_rl', $janela * 2);
        }
        $novo = wp_cache_incr($cache_key, 1, 'agendamento_rl');
        return $novo === false ? 1 : (int) $novo;
    }

    global $wpdb;
    $tabela = $wpdb->prefix . 'agendamentos_rl';

    $wpdb->query($wpdb->prepare(
        "INSERT INTO {$tabela} (bucket, janela, contagem)
         VALUES (%s, %d, 1)
         ON DUPLICATE KEY UPDATE contagem = contagem + 1",
        $bucket,
        $inicio
    ));

    return (int) $wpdb->get_var($wpdb->prepare(
        "SELECT contagem FROM {$tabela} WHERE bucket = %s AND janela = %d",
        $bucket,
        $inicio
    ));
}

/** Retorna o contador atual do bucket SEM incrementar (usado no lockout). */
function agendamento_rl_get($bucket, $janela)
{
    $janela = (int) $janela;
    $inicio = (int) floor(time() / $janela) * $janela;

    if (wp_using_ext_object_cache()) {
        $valor = wp_cache_get($bucket . '_' . $inicio, 'agendamento_rl');
        return $valor === false ? 0 : (int) $valor;
    }

    global $wpdb;
    $tabela = $wpdb->prefix . 'agendamentos_rl';

    return (int) $wpdb->get_var($wpdb->prepare(
        "SELECT contagem FROM {$tabela} WHERE bucket = %s AND janela = %d",
        $bucket,
        $inicio
    ));
}

// ══════════════════════════════════════════════════════════════════════════════
//  ENDPOINTS
// ══════════════════════════════════════════════════════════════════════════════

function agendamento_endpoint_executar(WP_REST_Request $request)
{
    $request_id = 'req-' . time() . '-' . wp_rand(100000, 999999);

    // 1) Proteção global por IP — conta TODAS as requisições (mesmo sem auth).
    $bucket_ip = 'ip:' . agendamento_rl_bucket(agendamento_obter_ip());
    if (agendamento_rl_hit($bucket_ip, 60) > AGENDAMENTO_RL_IP_POR_MINUTO) {
        return agendamento_resposta_erro('Muitas requisições deste endereço. Tente em 1 minuto.', '', 429, $request_id);
    }

    // 2) Autenticação (com bloqueio de IP após falhas repetidas).
    $auth = agendamento_autenticar($request);
    if (is_wp_error($auth)) {
        $dados_erro = $auth->get_error_data();
        $status = is_array($dados_erro) && !empty($dados_erro['status']) ? (int) $dados_erro['status'] : 401;
        return agendamento_resposta_erro($auth->get_error_message(), '', $status, $request_id);
    }

    // 3) Payload.
    $body = $request->get_json_params();
    if (!is_array($body)) {
        return agendamento_resposta_erro('Payload inválido', 'O corpo da requisição deve ser um objeto JSON.', 400, $request_id);
    }

    // 4) Rate limit por chave autenticada.
    $bucket_chave = 'key:' . agendamento_rl_bucket(agendamento_obter_chave_informada($request));
    if (agendamento_rl_hit($bucket_chave, 60) > AGENDAMENTO_RL_CHAVE_POR_MINUTO) {
        return agendamento_resposta_erro('Muitas requisições. Tente em 1 minuto.', '', 429, $request_id);
    }

    // 5) Roteamento.
    $acao = strtoupper(trim((string)($body['action'] ?? '')));
    $dados = is_array($body['data'] ?? null) ? $body['data'] : [];

    if ($acao === '') {
        return agendamento_resposta_erro('Campo "action" é obrigatório.', '', 400, $request_id);
    }

    return agendamento_processar_acao($acao, $dados, $request_id);
}

function agendamento_endpoint_health(WP_REST_Request $request)
{
    $auth = agendamento_autenticar($request);
    if (is_wp_error($auth)) {
        $dados_erro = $auth->get_error_data();
        $status = is_array($dados_erro) && !empty($dados_erro['status']) ? (int) $dados_erro['status'] : 401;
        return agendamento_resposta_erro($auth->get_error_message(), '', $status, '');
    }

    return agendamento_resposta_ok([
        'status'          => 'online',
        'versao'          => AGENDAMENTO_VERSION,
        'horarioServidor' => current_time('mysql', true),
    ], null, '');
}

// ══════════════════════════════════════════════════════════════════════════════
//  ROTEADOR
// ══════════════════════════════════════════════════════════════════════════════

function agendamento_processar_acao($acao, $dados, $request_id)
{
    $erro_obrigatorio = agendamento_validar_obrigatorios($acao, $dados);
    if ($erro_obrigatorio) {
        return agendamento_resposta_erro('Validação falhou', $erro_obrigatorio, 422, $request_id);
    }

    switch ($acao) {
        case 'GET_STATUS':
            return agendamento_get_config('status', $request_id);
        case 'GET_TIPOS':
            return agendamento_get_config('tipo_servico', $request_id);
        case 'GET_HORARIOS':
            return agendamento_get_config('horario', $request_id);
        case 'GET_TECNICOS':
            return agendamento_get_tecnicos($request_id);
        case 'GET_TECNICOS_COM_STATS':
            return agendamento_get_tecnicos_com_stats($request_id);
        case 'CREATE_TECNICO':
            return agendamento_criar_tecnico($dados, $request_id);
        case 'UPDATE_TECNICO':
            return agendamento_atualizar_tecnico($dados, $request_id);
        case 'DELETE_TECNICO':
            return agendamento_excluir_tecnico($dados, $request_id);
        case 'GET':
            return agendamento_listar($dados, $request_id);
        case 'CREATE':
            return agendamento_criar($dados, $request_id);
        case 'UPDATE':
            return agendamento_atualizar($dados, $request_id);
        case 'DELETE':
            return agendamento_excluir($dados, $request_id);
        case 'STATS':
            return agendamento_estatisticas($request_id);
        case 'GET_HORARIOS_OCUPADOS':
            return agendamento_get_horarios_ocupados($dados, $request_id);
        default:
            return agendamento_resposta_erro("Ação \"$acao\" não reconhecida.", '', 400, $request_id);
    }
}

// ══════════════════════════════════════════════════════════════════════════════
//  VALIDAÇÃO
// ══════════════════════════════════════════════════════════════════════════════

function agendamento_validar_obrigatorios($acao, $dados)
{
    $obrigatorios = [];
    if ($acao === 'CREATE') {
        $obrigatorios = ['tecnico', 'data', 'horario', 'tipoServico'];
    } elseif ($acao === 'UPDATE' || $acao === 'DELETE') {
        $obrigatorios = ['id'];
    }

    foreach ($obrigatorios as $campo) {
        if (empty($dados[$campo])) {
            return "Campo obrigatório ausente: \"$campo\".";
        }
    }
    return null;
}

function agendamento_validar($dados)
{
    if (isset($dados['data']) && !agendamento_validar_data($dados['data'])) {
        return "Data inválida: \"{$dados['data']}\". Use DD/MM/AAAA.";
    }
    if (isset($dados['horario']) && !preg_match('/^([01]\d|2[0-3]):([0-5]\d)$/', trim((string) $dados['horario']))) {
        return "Horário inválido: \"{$dados['horario']}\". Use HH:MM.";
    }
    if (is_array($dados['endereco'] ?? null)) {
        $estado = strtoupper(trim((string)($dados['endereco']['estado'] ?? '')));
        if ($estado !== '' && !in_array($estado, agendamento_ufs(), true)) {
            return "Estado (UF) inválido: \"{$dados['endereco']['estado']}\".";
        }
        $cep = preg_replace('/\D/', '', (string)($dados['endereco']['cep'] ?? ''));
        if ($cep !== '' && strlen($cep) !== 8) {
            return "CEP inválido: \"{$dados['endereco']['cep']}\". Deve conter 8 dígitos.";
        }
    }
    return null;
}

function agendamento_validar_data($data)
{
    if (!preg_match('/^(\d{2})\/(\d{2})\/(\d{4})$/', trim((string) $data), $m)) return false;
    return checkdate((int) $m[2], (int) $m[1], (int) $m[3]);
}

function agendamento_ufs()
{
    return [
        'AC',
        'AL',
        'AP',
        'AM',
        'BA',
        'CE',
        'DF',
        'ES',
        'GO',
        'MA',
        'MT',
        'MS',
        'MG',
        'PA',
        'PB',
        'PR',
        'PE',
        'PI',
        'RJ',
        'RN',
        'RS',
        'RO',
        'RR',
        'SC',
        'SP',
        'SE',
        'TO'
    ];
}

/** Técnicos precisam existir e estar ativos no catálogo. */
function agendamento_tecnico_valido($nome)
{
    global $wpdb;
    return (int) $wpdb->get_var($wpdb->prepare(
        "SELECT COUNT(*) FROM {$wpdb->prefix}agendamentos_tecnicos WHERE LOWER(nome) = LOWER(%s) AND ativo = 1",
        $nome
    )) > 0;
}

/** Detecta erro de chave duplicada (violação do índice único) na última query. */
function agendamento_erro_duplicado()
{
    global $wpdb;
    $erro = (string) $wpdb->last_error;
    return $erro !== '' && (stripos($erro, 'duplicate') !== false || stripos($erro, '1062') !== false);
}

// ══════════════════════════════════════════════════════════════════════════════
//  CRUD DE AGENDAMENTOS
// ══════════════════════════════════════════════════════════════════════════════

function agendamento_listar($filtros, $request_id)
{
    global $wpdb;
    $tabela = $wpdb->prefix . 'agendamentos';

    $where = ['1=1'];
    $values = [];

    $filtro_status = isset($filtros['status']) ? agendamento_normalizar($filtros['status']) : null;
    if ($filtro_status === 'deletado') {
        $where[] = 'deletado = 1';
    } else {
        $where[] = 'deletado = 0';
        if ($filtro_status) {
            $where[] = 'LOWER(status) = %s';
            $values[] = $filtro_status;
        }
    }

    if (!empty($filtros['tecnico'])) {
        $where[] = 'tecnico LIKE %s';
        $values[] = '%' . $wpdb->esc_like($filtros['tecnico']) . '%';
    }
    if (!empty($filtros['tipoServico'])) {
        $where[] = 'tipo_servico LIKE %s';
        $values[] = '%' . $wpdb->esc_like($filtros['tipoServico']) . '%';
    }
    if (!empty($filtros['clienteNome'])) {
        $where[] = 'cliente_nome LIKE %s';
        $values[] = '%' . $wpdb->esc_like($filtros['clienteNome']) . '%';
    }
    if (!empty($filtros['veiculoPlaca'])) {
        $where[] = 'REPLACE(veiculo_placa, "-", "") LIKE %s';
        $values[] = '%' . $wpdb->esc_like(preg_replace('/[^a-zA-Z0-9]/', '', (string) $filtros['veiculoPlaca'])) . '%';
    }

    // CORREÇÃO P0: datas são convertidas em PHP e comparadas como AAAA-MM-DD.
    // O formato antigo STR_TO_DATE(%s, "%d/%m/%Y") fazia o $wpdb->prepare()
    // interpretar %d/%m/%Y como placeholders, quebrando a query.
    $filtro_data = trim((string)($filtros['data'] ?? ''));
    if ($filtro_data !== '') {
        if (!agendamento_validar_data($filtro_data)) {
            return agendamento_resposta_erro('Validação falhou', "Data inválida: \"$filtro_data\". Use DD/MM/AAAA.", 422, $request_id);
        }
        $where[] = 'data = %s';
        $values[] = agendamento_converter_data_br($filtro_data);
    }

    $data_inicio = trim((string)($filtros['dataInicio'] ?? ''));
    $data_fim = trim((string)($filtros['dataFim'] ?? ''));
    if ($data_inicio !== '' && $data_fim !== '') {
        if (!agendamento_validar_data($data_inicio) || !agendamento_validar_data($data_fim)) {
            return agendamento_resposta_erro('Validação falhou', 'dataInicio/dataFim inválidos. Use DD/MM/AAAA.', 422, $request_id);
        }
        $where[] = 'data BETWEEN %s AND %s';
        $values[] = agendamento_converter_data_br($data_inicio);
        $values[] = agendamento_converter_data_br($data_fim);
    }

    $where_clause = implode(' AND ', $where);
    $count_sql = "SELECT COUNT(*) FROM $tabela WHERE $where_clause";
    $total = $values ? (int) $wpdb->get_var($wpdb->prepare($count_sql, $values)) : (int) $wpdb->get_var($count_sql);

    $page = max(1, intval($filtros['page'] ?? 1));
    $page_size = min(500, max(1, intval($filtros['pageSize'] ?? 50)));
    $offset = ($page - 1) * $page_size;

    $sort_map = [
        'data' => 'data',
        'horario' => 'horario',
        'tecnico' => 'tecnico',
        'status' => 'status',
        'clienteNome' => 'cliente_nome',
    ];
    $sort_field = $sort_map[$filtros['sortBy'] ?? 'data'] ?? 'data';
    $sort_order = strtolower((string)($filtros['sortOrder'] ?? 'asc')) === 'desc' ? 'DESC' : 'ASC';

    $query = "SELECT * FROM $tabela WHERE $where_clause ORDER BY $sort_field $sort_order, horario ASC LIMIT %d OFFSET %d";
    $values[] = $page_size;
    $values[] = $offset;

    $rows = $wpdb->get_results($wpdb->prepare($query, $values), ARRAY_A);
    $servicos = array_map('agendamento_formatar_row', $rows ?: []);

    return agendamento_resposta_ok($servicos, [
        'total'      => $total,
        'page'       => $page,
        'pageSize'   => $page_size,
        'totalPages' => (int) ceil($total / $page_size),
    ], $request_id);
}

function agendamento_criar($dados, $request_id)
{
    global $wpdb;
    $tabela = $wpdb->prefix . 'agendamentos';

    $erro = agendamento_validar($dados);
    if ($erro) return agendamento_resposta_erro('Validação falhou', $erro, 422, $request_id);

    // Validação contra catálogos (P1).
    $tecnico = sanitize_text_field((string)($dados['tecnico'] ?? ''));
    if (!agendamento_tecnico_valido($tecnico)) {
        return agendamento_resposta_erro('Validação falhou', "Técnico \"$tecnico\" não cadastrado ou inativo.", 422, $request_id);
    }
    $tipo_servico = agendamento_resolver_tipo_servico((string)($dados['tipoServico'] ?? ''));
    if ($tipo_servico === null) {
        return agendamento_resposta_erro('Validação falhou', "Tipo de serviço desconhecido: \"{$dados['tipoServico']}\". Consulte GET_TIPOS.", 422, $request_id);
    }

    $id = wp_generate_uuid4();
    $agora = current_time('mysql', true);
    $data_mysql = agendamento_converter_data_br((string)($dados['data'] ?? ''));
    $horario = sanitize_text_field((string)($dados['horario'] ?? ''));

    $cliente = is_array($dados['cliente'] ?? null) ? $dados['cliente'] : [];
    $veiculo = is_array($dados['veiculo'] ?? null) ? $dados['veiculo'] : [];
    $endereco = is_array($dados['endereco'] ?? null) ? $dados['endereco'] : [];

    $row = [
        'id'                 => $id,
        'tecnico'            => $tecnico,
        'data'               => $data_mysql,
        'dia_semana'         => agendamento_dia_semana((string)($dados['data'] ?? '')),
        'horario'            => $horario,
        'tipo_servico'       => $tipo_servico,
        'ordem_servico'      => sanitize_text_field((string)($dados['ordemServico'] ?? '')),
        'observacao'         => sanitize_textarea_field((string)($dados['observacao'] ?? '')),
        'cliente_nome'       => sanitize_text_field((string)($cliente['nome'] ?? '')),
        'cliente_contato'    => sanitize_text_field((string)($cliente['contato'] ?? '')),
        'veiculo_placa'      => agendamento_normalizar_placa((string)($veiculo['placa'] ?? '')),
        'veiculo_marca_modelo' => sanitize_text_field((string)($veiculo['marcaModelo'] ?? '')),
        'endereco_rua'       => sanitize_text_field((string)($endereco['rua'] ?? '')),
        'endereco_numero'    => sanitize_text_field((string)($endereco['numero'] ?? '')),
        'endereco_bairro'    => sanitize_text_field((string)($endereco['bairro'] ?? '')),
        'endereco_cidade'    => sanitize_text_field((string)($endereco['cidade'] ?? '')),
        'endereco_estado'    => strtoupper(sanitize_text_field((string)($endereco['estado'] ?? ''))),
        'endereco_cep'       => preg_replace('/\D/', '', (string)($endereco['cep'] ?? '')),
        'status'             => agendamento_resolver_status((string)($dados['status'] ?? 'pendente')),
        'criado_em'          => $agora,
        'atualizado_em'      => $agora,
        'deletado'           => 0,
    ];

    // Checagem amigável de conflito — o índice único uniq_slot cobre a corrida
    // entre duas requisições simultâneas que passam por esta checagem.
    $conflito = (int) $wpdb->get_var($wpdb->prepare(
        "SELECT COUNT(*) FROM $tabela
         WHERE tecnico = %s AND data = %s AND horario = %s
           AND deletado = 0
           AND LOWER(status) NOT IN ('cancelado', 'deletado')",
        $tecnico,
        $data_mysql,
        $horario
    ));

    if ($conflito > 0) {
        return agendamento_resposta_erro(
            'Conflito de agenda',
            "O técnico $tecnico já possui um serviço em {$dados['data']} às $horario.",
            409,
            $request_id
        );
    }

    $inserido = $wpdb->insert($tabela, $row);
    if ($inserido === false) {
        if (agendamento_erro_duplicado()) {
            // Corrida perdida: outra requisição ocupou o slot entre a checagem
            // e o INSERT — exatamente o caso que o índice único protege.
            return agendamento_resposta_erro(
                'Conflito de agenda',
                "O técnico $tecnico já possui um serviço em {$dados['data']} às $horario.",
                409,
                $request_id
            );
        }
        error_log('[agendamento] Erro ao inserir: ' . $wpdb->last_error);
        return agendamento_resposta_erro('Erro ao salvar no banco de dados', 'Erro interno', 500, $request_id);
    }

    agendamento_log('CREATE', ['requestId' => $request_id, 'id' => $id]);
    return agendamento_resposta_ok(agendamento_formatar_row($row), null, $request_id, 201);
}

function agendamento_get_horarios_ocupados($dados, $request_id)
{
    global $wpdb;
    $tabela = $wpdb->prefix . 'agendamentos';

    $tecnico = sanitize_text_field($dados['tecnico'] ?? '');
    $data_br = sanitize_text_field($dados['data'] ?? '');
    $exclude_id = sanitize_text_field($dados['excludeId'] ?? '');

    if ($tecnico === '' || $data_br === '') {
        return agendamento_resposta_erro('tecnico e data são obrigatórios.', '', 422, $request_id);
    }

    $data_mysql = agendamento_converter_data_br($data_br);
    if (!$data_mysql) {
        return agendamento_resposta_erro('Data inválida. Use DD/MM/AAAA.', '', 422, $request_id);
    }

    $sql = "SELECT horario FROM $tabela
            WHERE tecnico = %s
              AND data = %s
              AND deletado = 0
              AND LOWER(status) NOT IN ('cancelado', 'deletado')";
    $values = [$tecnico, $data_mysql];

    if ($exclude_id !== '') {
        $sql .= ' AND id != %s';
        $values[] = $exclude_id;
    }

    $rows = $wpdb->get_col($wpdb->prepare($sql, $values));
    $ocupados = array_map(function ($h) {
        return substr((string) $h, 0, 5);
    }, $rows ?: []);

    return agendamento_resposta_ok(array_values(array_unique($ocupados)), null, $request_id);
}

function agendamento_atualizar($dados, $request_id)
{
    global $wpdb;
    $tabela = $wpdb->prefix . 'agendamentos';

    if (empty($dados['id'])) {
        return agendamento_resposta_erro('Campo "id" é obrigatório.', '', 422, $request_id);
    }

    $id = sanitize_text_field($dados['id']);
    $existente = $wpdb->get_row($wpdb->prepare("SELECT * FROM $tabela WHERE id = %s", $id), ARRAY_A);

    if (!$existente) {
        return agendamento_resposta_erro("Serviço com id \"$id\" não encontrado.", '', 404, $request_id);
    }

    $erro = agendamento_validar($dados);
    if ($erro) return agendamento_resposta_erro('Validação falhou', $erro, 422, $request_id);

    $update = ['atualizado_em' => current_time('mysql', true)];
    $campos_alterados = [];

    // Validação contra catálogos quando os campos vêm no payload (P1).
    if (isset($dados['tecnico'])) {
        $novo_tecnico = sanitize_text_field((string) $dados['tecnico']);
        if (!agendamento_tecnico_valido($novo_tecnico)) {
            return agendamento_resposta_erro('Validação falhou', "Técnico \"$novo_tecnico\" não cadastrado ou inativo.", 422, $request_id);
        }
        $update['tecnico'] = $novo_tecnico;
        $campos_alterados[] = 'tecnico';
    }
    if (isset($dados['tipoServico'])) {
        $novo_tipo = agendamento_resolver_tipo_servico((string) $dados['tipoServico']);
        if ($novo_tipo === null) {
            return agendamento_resposta_erro('Validação falhou', "Tipo de serviço desconhecido: \"{$dados['tipoServico']}\". Consulte GET_TIPOS.", 422, $request_id);
        }
        $update['tipo_servico'] = $novo_tipo;
        $campos_alterados[] = 'tipoServico';
    }

    $map = ['horario' => 'horario', 'ordemServico' => 'ordem_servico', 'observacao' => 'observacao'];
    foreach ($map as $json_key => $db_col) {
        if (isset($dados[$json_key])) {
            $update[$db_col] = $json_key === 'observacao'
                ? sanitize_textarea_field((string) $dados[$json_key])
                : sanitize_text_field((string) $dados[$json_key]);
            $campos_alterados[] = $json_key;
        }
    }

    if (isset($dados['data'])) {
        $update['data'] = agendamento_converter_data_br((string) $dados['data']);
        $update['dia_semana'] = agendamento_dia_semana((string) $dados['data']);
        $campos_alterados[] = 'data';
    }
    if (isset($dados['status'])) {
        $resolvido = agendamento_resolver_status((string) $dados['status']);
        $update['status'] = $resolvido ?: $existente['status'];
        $campos_alterados[] = 'status';
    }

    if (is_array($dados['cliente'] ?? null)) {
        if (isset($dados['cliente']['nome'])) {
            $update['cliente_nome'] = sanitize_text_field((string) $dados['cliente']['nome']);
            $campos_alterados[] = 'cliente.nome';
        }
        if (isset($dados['cliente']['contato'])) {
            $update['cliente_contato'] = sanitize_text_field((string) $dados['cliente']['contato']);
            $campos_alterados[] = 'cliente.contato';
        }
    }
    if (is_array($dados['veiculo'] ?? null)) {
        if (isset($dados['veiculo']['placa'])) {
            $update['veiculo_placa'] = agendamento_normalizar_placa((string) $dados['veiculo']['placa']);
            $campos_alterados[] = 'veiculo.placa';
        }
        if (isset($dados['veiculo']['marcaModelo'])) {
            $update['veiculo_marca_modelo'] = sanitize_text_field((string) $dados['veiculo']['marcaModelo']);
            $campos_alterados[] = 'veiculo.marcaModelo';
        }
    }
    if (is_array($dados['endereco'] ?? null)) {
        if (isset($dados['endereco']['rua'])) {
            $update['endereco_rua'] = sanitize_text_field((string) $dados['endereco']['rua']);
        }
        if (isset($dados['endereco']['numero'])) {
            $update['endereco_numero'] = sanitize_text_field((string) $dados['endereco']['numero']);
        }
        if (isset($dados['endereco']['bairro'])) {
            $update['endereco_bairro'] = sanitize_text_field((string) $dados['endereco']['bairro']);
        }
        if (isset($dados['endereco']['cidade'])) {
            $update['endereco_cidade'] = sanitize_text_field((string) $dados['endereco']['cidade']);
        }
        if (isset($dados['endereco']['estado'])) {
            $update['endereco_estado'] = strtoupper(sanitize_text_field((string) $dados['endereco']['estado']));
        }
        if (isset($dados['endereco']['cep'])) {
            $update['endereco_cep'] = preg_replace('/\D/', '', (string) $dados['endereco']['cep']);
        }
        $campos_alterados[] = 'endereco.*';
    }

    // Conflito de agenda — só quando os campos que afetam o slot mudam.
    $afeta_slot = isset($dados['tecnico']) || isset($dados['data']) || isset($dados['horario']) || isset($dados['status']);
    $status_final = agendamento_normalizar($update['status'] ?? $existente['status']);

    if ($afeta_slot && !in_array($status_final, ['cancelado', 'deletado'], true)) {
        $tecnico    = $update['tecnico'] ?? $existente['tecnico'];
        $horario    = $update['horario'] ?? substr((string) $existente['horario'], 0, 5);
        $data_mysql = $update['data'] ?? $existente['data'];

        $conflito = (int) $wpdb->get_var($wpdb->prepare(
            "SELECT COUNT(*) FROM $tabela
             WHERE tecnico = %s AND data = %s AND horario = %s
               AND id != %s
               AND deletado = 0
               AND LOWER(status) NOT IN ('cancelado', 'deletado')",
            $tecnico,
            $data_mysql,
            $horario,
            $id
        ));

        if ($conflito > 0) {
            $data_br = date('d/m/Y', strtotime($data_mysql));
            return agendamento_resposta_erro(
                'Conflito de agenda',
                "O técnico $tecnico já possui um serviço em $data_br às $horario.",
                409,
                $request_id
            );
        }
    }

    $resultado = $wpdb->update($tabela, $update, ['id' => $id]);
    if ($resultado === false) {
        if (agendamento_erro_duplicado()) {
            return agendamento_resposta_erro('Conflito de agenda', 'Outra requisição ocupou este slot simultaneamente.', 409, $request_id);
        }
        error_log('[agendamento] Erro ao atualizar: ' . $wpdb->last_error);
        return agendamento_resposta_erro('Erro ao salvar no banco de dados', 'Erro interno', 500, $request_id);
    }

    agendamento_log('UPDATE', ['requestId' => $request_id, 'id' => $id, 'campos' => $campos_alterados]);

    $atualizado = $wpdb->get_row($wpdb->prepare("SELECT * FROM $tabela WHERE id = %s", $id), ARRAY_A);
    return agendamento_resposta_ok(agendamento_formatar_row($atualizado), null, $request_id);
}

function agendamento_excluir($dados, $request_id)
{
    global $wpdb;
    $tabela = $wpdb->prefix . 'agendamentos';

    if (empty($dados['id'])) {
        return agendamento_resposta_erro('Campo "id" é obrigatório.', '', 422, $request_id);
    }

    $id = sanitize_text_field($dados['id']);
    $existente = $wpdb->get_row($wpdb->prepare("SELECT * FROM $tabela WHERE id = %s", $id), ARRAY_A);

    if (!$existente) {
        return agendamento_resposta_erro("Serviço com id \"$id\" não encontrado.", '', 404, $request_id);
    }

    $resultado = $wpdb->update($tabela, [
        'deletado'      => 1,
        'status'        => 'DELETADO',
        'atualizado_em' => current_time('mysql', true),
    ], ['id' => $id]);

    if ($resultado === false) {
        error_log('[agendamento] Erro ao excluir: ' . $wpdb->last_error);
        return agendamento_resposta_erro('Erro ao salvar no banco de dados', 'Erro interno', 500, $request_id);
    }

    agendamento_log('SOFT_DELETE', ['requestId' => $request_id, 'id' => $id]);
    return agendamento_resposta_ok(['id' => $id, 'message' => 'Serviço marcado como deletado.'], null, $request_id);
}

// CORREÇÃO P1: agrega no banco com GROUP BY — não carrega mais a tabela
// inteira em memória PHP.
function agendamento_estatisticas($request_id)
{
    global $wpdb;
    $tabela = $wpdb->prefix . 'agendamentos';

    $stats = [
        'total' => (int) $wpdb->get_var("SELECT COUNT(*) FROM {$tabela} WHERE deletado = 0"),
        'porStatus' => [],
        'porTecnico' => [],
        'porTipoServico' => [],
        'porDiaSemana' => [],
        'porMes' => [],
    ];

    foreach ($wpdb->get_results("SELECT status, COUNT(*) AS c FROM {$tabela} WHERE deletado = 0 GROUP BY status", ARRAY_A) ?: [] as $r) {
        $stats['porStatus'][agendamento_normalizar($r['status']) ?: 'nao informado'] = (int) $r['c'];
    }
    foreach ($wpdb->get_results("SELECT COALESCE(NULLIF(tecnico, ''), 'Não informado') AS g, COUNT(*) AS c FROM {$tabela} WHERE deletado = 0 GROUP BY COALESCE(NULLIF(tecnico, ''), 'Não informado')", ARRAY_A) ?: [] as $r) {
        $stats['porTecnico'][$r['g']] = (int) $r['c'];
    }
    foreach ($wpdb->get_results("SELECT COALESCE(NULLIF(tipo_servico, ''), 'Não informado') AS g, COUNT(*) AS c FROM {$tabela} WHERE deletado = 0 GROUP BY COALESCE(NULLIF(tipo_servico, ''), 'Não informado')", ARRAY_A) ?: [] as $r) {
        $stats['porTipoServico'][$r['g']] = (int) $r['c'];
    }
    foreach ($wpdb->get_results("SELECT COALESCE(NULLIF(dia_semana, ''), 'Não informado') AS g, COUNT(*) AS c FROM {$tabela} WHERE deletado = 0 GROUP BY COALESCE(NULLIF(dia_semana, ''), 'Não informado')", ARRAY_A) ?: [] as $r) {
        $stats['porDiaSemana'][$r['g']] = (int) $r['c'];
    }
    foreach ($wpdb->get_results("SELECT DATE_FORMAT(data, '%Y-%m') AS g, COUNT(*) AS c FROM {$tabela} WHERE deletado = 0 AND data IS NOT NULL GROUP BY DATE_FORMAT(data, '%Y-%m')", ARRAY_A) ?: [] as $r) {
        if (!empty($r['g'])) $stats['porMes'][$r['g']] = (int) $r['c'];
    }

    return agendamento_resposta_ok($stats, null, $request_id);
}

// ══════════════════════════════════════════════════════════════════════════════
//  CRUD DE TÉCNICOS
// ══════════════════════════════════════════════════════════════════════════════

function agendamento_formatar_tecnico($r)
{
    return [
        'nome'     => $r['nome'],
        'ativo'    => (bool) $r['ativo'],
        'cpf'      => $r['cpf'],
        'cnpj'     => $r['cnpj'],
        'whatsapp' => $r['whatsapp'],
        'vinculo'  => $r['vinculo'],
    ];
}

function agendamento_get_tecnicos($request_id)
{
    global $wpdb;
    $rows = $wpdb->get_results(
        "SELECT nome, ativo, cpf, cnpj, whatsapp, vinculo FROM {$wpdb->prefix}agendamentos_tecnicos ORDER BY nome",
        ARRAY_A
    );
    return agendamento_resposta_ok(array_map('agendamento_formatar_tecnico', $rows ?: []), null, $request_id);
}

function agendamento_get_tecnicos_com_stats($request_id)
{
    global $wpdb;
    $tec_tabela = $wpdb->prefix . 'agendamentos_tecnicos';
    $age_tabela = $wpdb->prefix . 'agendamentos';

    $rows = $wpdb->get_results("
        SELECT t.id, t.nome, t.ativo, t.cpf, t.cnpj, t.whatsapp, t.vinculo,
               COUNT(a.id) as total_servicos,
               SUM(CASE WHEN LOWER(a.status) IN ('concluido', 'concluído') THEN 1 ELSE 0 END) as concluidos,
               SUM(CASE WHEN LOWER(a.status) IN ('pendente', 'em andamento') THEN 1 ELSE 0 END) as pendentes
        FROM $tec_tabela t
        LEFT JOIN $age_tabela a ON a.tecnico = t.nome AND a.deletado = 0
        GROUP BY t.id, t.nome, t.ativo, t.cpf, t.cnpj, t.whatsapp, t.vinculo
        ORDER BY t.nome
    ", ARRAY_A);

    $tecnicos = array_map(function ($r) {
        return agendamento_formatar_tecnico($r) + [
            'totalServicos'     => (int) $r['total_servicos'],
            'servicosConcluidos' => (int) $r['concluidos'],
            'servicosPendentes' => (int) $r['pendentes'],
        ];
    }, $rows ?: []);

    return agendamento_resposta_ok($tecnicos, null, $request_id);
}

/** Validações leves de documentos/contato (tamanho, sem dígito verificador). */
function agendamento_validar_documentos_tecnico($cpf, $cnpj, $whatsapp)
{
    if ($cpf !== '' && strlen($cpf) !== 11)  return 'CPF deve conter 11 dígitos.';
    if ($cnpj !== '' && strlen($cnpj) !== 14) return 'CNPJ deve conter 14 dígitos.';
    if ($whatsapp !== '' && (strlen($whatsapp) < 10 || strlen($whatsapp) > 15)) {
        return 'WhatsApp deve conter entre 10 e 15 dígitos (com DDI, se houver).';
    }
    return null;
}

function agendamento_criar_tecnico($dados, $request_id)
{
    global $wpdb;
    $tabela = $wpdb->prefix . 'agendamentos_tecnicos';
    $nome = sanitize_text_field($dados['nome'] ?? '');

    if ($nome === '') return agendamento_resposta_erro('Nome do técnico é obrigatório.', '', 422, $request_id);

    $vinculos = ['clt', 'pj', 'terceirizado', 'autonomo', 'estagio'];
    $vinculo = agendamento_normalizar($dados['vinculo'] ?? '');
    if ($vinculo !== '' && !in_array($vinculo, $vinculos, true)) {
        return agendamento_resposta_erro("Vínculo inválido: \"" . ($dados['vinculo'] ?? '') . "\". Use: " . implode(', ', $vinculos) . ".", '', 422, $request_id);
    }

    $cpf = preg_replace('/\D/', '', (string)($dados['cpf'] ?? ''));
    $cnpj = preg_replace('/\D/', '', (string)($dados['cnpj'] ?? ''));
    $whatsapp = preg_replace('/\D/', '', (string)($dados['whatsapp'] ?? ''));

    $erro_doc = agendamento_validar_documentos_tecnico($cpf, $cnpj, $whatsapp);
    if ($erro_doc) return agendamento_resposta_erro('Validação falhou', $erro_doc, 422, $request_id);

    $existe = (int) $wpdb->get_var($wpdb->prepare(
        "SELECT COUNT(*) FROM $tabela WHERE LOWER(nome) = LOWER(%s)",
        $nome
    ));
    if ($existe) return agendamento_resposta_erro("Técnico \"$nome\" já existe.", '', 409, $request_id);

    $inserido = $wpdb->insert($tabela, [
        'nome'     => $nome,
        'ativo'    => 1,
        'cpf'      => $cpf,
        'cnpj'     => $cnpj,
        'whatsapp' => $whatsapp,
        'vinculo'  => $vinculo,
    ]);
    if ($inserido === false) {
        error_log('[agendamento] Erro ao criar técnico: ' . $wpdb->last_error);
        return agendamento_resposta_erro('Erro ao salvar no banco de dados', 'Erro interno', 500, $request_id);
    }

    agendamento_log('CREATE_TECNICO', ['requestId' => $request_id, 'nome' => $nome]);

    // Retorna o estado real do banco, não o payload enviado.
    $row = $wpdb->get_row($wpdb->prepare("SELECT nome, ativo, cpf, cnpj, whatsapp, vinculo FROM $tabela WHERE id = %d", $wpdb->insert_id), ARRAY_A);
    return agendamento_resposta_ok(agendamento_formatar_tecnico($row), null, $request_id, 201);
}

function agendamento_atualizar_tecnico($dados, $request_id)
{
    global $wpdb;
    $tabela = $wpdb->prefix . 'agendamentos_tecnicos';
    $age_tabela = $wpdb->prefix . 'agendamentos';
    $nome_antigo = sanitize_text_field($dados['nomeAntigo'] ?? '');

    if ($nome_antigo === '') return agendamento_resposta_erro('nomeAntigo é obrigatório.', '', 422, $request_id);

    $row = $wpdb->get_row($wpdb->prepare(
        "SELECT * FROM $tabela WHERE LOWER(nome) = LOWER(%s)",
        $nome_antigo
    ), ARRAY_A);
    if (!$row) return agendamento_resposta_erro("Técnico \"$nome_antigo\" não encontrado.", '', 404, $request_id);

    $update = [];
    if (isset($dados['nome']))     $update['nome'] = sanitize_text_field((string) $dados['nome']);
    if (isset($dados['ativo']))    $update['ativo'] = $dados['ativo'] ? 1 : 0;
    if (isset($dados['cpf']))      $update['cpf'] = preg_replace('/\D/', '', (string) $dados['cpf']);
    if (isset($dados['cnpj']))     $update['cnpj'] = preg_replace('/\D/', '', (string) $dados['cnpj']);
    if (isset($dados['whatsapp'])) $update['whatsapp'] = preg_replace('/\D/', '', (string) $dados['whatsapp']);
    if (isset($dados['vinculo'])) {
        $vinculo = agendamento_normalizar((string) $dados['vinculo']);
        $vinculos = ['clt', 'pj', 'terceirizado', 'autonomo', 'estagio'];
        if ($vinculo !== '' && !in_array($vinculo, $vinculos, true)) {
            return agendamento_resposta_erro("Vínculo inválido: \"{$dados['vinculo']}\".", '', 422, $request_id);
        }
        $update['vinculo'] = $vinculo;
    }

    $erro_doc = agendamento_validar_documentos_tecnico(
        $update['cpf'] ?? '',
        $update['cnpj'] ?? '',
        $update['whatsapp'] ?? ''
    );
    if ($erro_doc) return agendamento_resposta_erro('Validação falhou', $erro_doc, 422, $request_id);

    $renomeou = isset($update['nome']) && strtolower($update['nome']) !== strtolower($row['nome']);

    if ($renomeou) {
        // Nome novo não pode colidir com outro técnico.
        $colide = (int) $wpdb->get_var($wpdb->prepare(
            "SELECT COUNT(*) FROM $tabela WHERE LOWER(nome) = LOWER(%s) AND id != %d",
            $update['nome'],
            $row['id']
        ));
        if ($colide) {
            return agendamento_resposta_erro("Já existe um técnico chamado \"{$update['nome']}\".", '', 409, $request_id);
        }

        // CORREÇÃO P1: renomear propaga para os agendamentos (evita histórico órfão).
        // Feito ANTES de alterar a tabela de técnicos para não deixar estado
        // inconsistente se falhar (ex.: colisão no índice único de slot).
        $propagado = $wpdb->update($age_tabela, ['tecnico' => $update['nome']], ['tecnico' => $row['nome']]);
        if ($propagado === false) {
            if (agendamento_erro_duplicado()) {
                return agendamento_resposta_erro(
                    'Renomear este técnico causaria conflito de agenda',
                    'O novo nome possui agendamentos sobrepostos (mesma data/horário). Resolva os conflitos antes de renomear.',
                    409,
                    $request_id
                );
            }
            error_log('[agendamento] Erro ao propagar renomeação: ' . $wpdb->last_error);
            return agendamento_resposta_erro('Erro ao salvar no banco de dados', 'Erro interno', 500, $request_id);
        }
    }

    if ($update) {
        $resultado = $wpdb->update($tabela, $update, ['id' => $row['id']]);
        if ($resultado === false) {
            error_log('[agendamento] Erro ao atualizar técnico: ' . $wpdb->last_error);
            return agendamento_resposta_erro('Erro ao salvar no banco de dados', 'Erro interno', 500, $request_id);
        }
    }

    agendamento_log('UPDATE_TECNICO', ['requestId' => $request_id, 'nomeAntigo' => $nome_antigo, 'renomeou' => $renomeou]);

    $atualizado = $wpdb->get_row($wpdb->prepare("SELECT nome, ativo, cpf, cnpj, whatsapp, vinculo FROM $tabela WHERE id = %d", $row['id']), ARRAY_A);
    return agendamento_resposta_ok(agendamento_formatar_tecnico($atualizado), null, $request_id);
}

function agendamento_excluir_tecnico($dados, $request_id)
{
    global $wpdb;
    $tec_tabela = $wpdb->prefix . 'agendamentos_tecnicos';
    $age_tabela = $wpdb->prefix . 'agendamentos';
    $nome = sanitize_text_field($dados['nome'] ?? '');

    if ($nome === '') return agendamento_resposta_erro('Nome é obrigatório.', '', 422, $request_id);

    $servicos = (int) $wpdb->get_var($wpdb->prepare(
        "SELECT COUNT(*) FROM $age_tabela WHERE LOWER(tecnico) = LOWER(%s) AND deletado = 0",
        $nome
    ));
    if ($servicos > 0) {
        return agendamento_resposta_erro("Técnico possui $servicos serviço(s). Desative-o.", '', 409, $request_id);
    }

    $wpdb->delete($tec_tabela, ['nome' => $nome], ['%s']);
    agendamento_log('DELETE_TECNICO', ['requestId' => $request_id, 'nome' => $nome]);
    return agendamento_resposta_ok(['message' => 'Técnico removido.'], null, $request_id);
}

// ══════════════════════════════════════════════════════════════════════════════
//  CONFIG (com cache)
// ══════════════════════════════════════════════════════════════════════════════

function agendamento_get_config($tipo, $request_id)
{
    $cache_key = 'ag_cfg_' . $tipo;
    $cached = get_transient($cache_key);
    if ($cached !== false) return agendamento_resposta_ok($cached, null, $request_id);

    global $wpdb;
    $itens = $wpdb->get_col($wpdb->prepare(
        "SELECT nome FROM {$wpdb->prefix}agendamentos_config WHERE tipo = %s AND ativo = 1 ORDER BY id",
        $tipo
    ));

    set_transient($cache_key, $itens, 300);
    return agendamento_resposta_ok($itens, null, $request_id);
}

/** Mapa normalizado => nome canônico de um tipo de config (cache de 5 min). */
function agendamento_cache_mapa($tipo)
{
    $cache_key = 'ag_cfg_' . $tipo . '_map';
    $mapa = get_transient($cache_key);
    if ($mapa === false) {
        global $wpdb;
        $itens = $wpdb->get_col($wpdb->prepare(
            "SELECT nome FROM {$wpdb->prefix}agendamentos_config WHERE tipo = %s AND ativo = 1",
            $tipo
        ));
        $mapa = [];
        foreach ((array) $itens as $item) {
            $mapa[agendamento_normalizar($item)] = $item;
        }
        set_transient($cache_key, $mapa, 300);
    }
    return is_array($mapa) ? $mapa : [];
}

function agendamento_resolver_status($status)
{
    $status = trim((string) $status);
    if ($status === '') return 'pendente';

    $mapa = agendamento_cache_mapa('status');
    if (empty($mapa)) return sanitize_text_field($status); // sem catálogo configurado

    return $mapa[agendamento_normalizar($status)] ?? 'pendente';
}

/**
 * Retorna o nome canônico do tipo de serviço, ou null se desconhecido.
 * Se não houver catálogo configurado, aceita o valor informado (fail-open).
 */
function agendamento_resolver_tipo_servico($tipo)
{
    $tipo = trim((string) $tipo);
    if ($tipo === '') return null;

    $mapa = agendamento_cache_mapa('tipo_servico');
    if (empty($mapa)) return sanitize_text_field($tipo);

    return $mapa[agendamento_normalizar($tipo)] ?? null;
}

// ══════════════════════════════════════════════════════════════════════════════
//  HELPERS
// ══════════════════════════════════════════════════════════════════════════════

// CORREÇÃO P2: remove_accents() do WP é independente de locale (o iconv
// ASCII//TRANSLIT variava conforme o locale do servidor).
function agendamento_normalizar($valor)
{
    $s = mb_strtolower(trim((string) $valor), 'UTF-8');
    $s = remove_accents($s);
    return preg_replace('/\s+/', ' ', $s);
}

function agendamento_converter_data_br($data_br)
{
    if (!preg_match('/^(\d{2})\/(\d{2})\/(\d{4})$/', trim((string) $data_br), $m)) return null;
    return "{$m[3]}-{$m[2]}-{$m[1]}";
}

function agendamento_dia_semana($data_br)
{
    $data_br = (string) $data_br;
    $mysql = agendamento_converter_data_br($data_br);
    if (!$mysql) return '';

    $dias = ['DOMINGO', 'SEGUNDA', 'TERÇA', 'QUARTA', 'QUINTA', 'SEXTA', 'SÁBADO'];
    $timestamp = strtotime($mysql);
    return $timestamp !== false ? ($dias[date('w', $timestamp)] ?? '') : '';
}

function agendamento_normalizar_placa($placa)
{
    return strtoupper(preg_replace('/[^A-Z0-9-]/i', '', trim((string) $placa)));
}

// Usa apenas REMOTE_ADDR (não spoofável sem proxy na frente). Se o site roda
// atrás de CDN/proxy, ajuste conforme o ambiente.
function agendamento_obter_ip()
{
    $ip = isset($_SERVER['REMOTE_ADDR']) ? (string) $_SERVER['REMOTE_ADDR'] : '';
    return filter_var($ip, FILTER_VALIDATE_IP) ? $ip : '0.0.0.0';
}

function agendamento_formatar_row($row)
{
    if (!$row) return [];

    $data_br = '';
    if (!empty($row['data'])) {
        if (preg_match('/^\d{4}-\d{2}-\d{2}$/', (string) $row['data'])) {
            $d = strtotime((string) $row['data']);
            $data_br = $d ? date('d/m/Y', $d) : '';
        } elseif (preg_match('/^\d{2}\/\d{2}\/\d{4}$/', (string) $row['data'])) {
            $data_br = (string) $row['data'];
        }
    }

    $horario = !empty($row['horario']) ? substr((string) $row['horario'], 0, 5) : '';

    return [
        'id'          => $row['id'],
        'tecnico'     => $row['tecnico'],
        'data'        => $data_br,
        'diaSemana'   => $row['dia_semana'] ?? '',
        'horario'     => $horario,
        'tipoServico' => $row['tipo_servico'],
        'ordemServico' => $row['ordem_servico'] ?? '',
        'observacao'  => $row['observacao'] ?? '',
        'cliente'     => [
            'nome'    => $row['cliente_nome'] ?? '',
            'contato' => $row['cliente_contato'] ?? '',
        ],
        'veiculo'     => [
            'placa'      => $row['veiculo_placa'] ?? '',
            'marcaModelo' => $row['veiculo_marca_modelo'] ?? '',
        ],
        'endereco'    => [
            'rua'    => $row['endereco_rua'] ?? '',
            'numero' => $row['endereco_numero'] ?? '',
            'bairro' => $row['endereco_bairro'] ?? '',
            'cidade' => $row['endereco_cidade'] ?? '',
            'estado' => $row['endereco_estado'] ?? '',
            'cep'    => $row['endereco_cep'] ?? '',
        ],
        'status'      => $row['status'],
        'criadoEm'    => $row['criado_em'] ?? '',
        'atualizadoEm' => $row['atualizado_em'] ?? '',
    ];
}

// ══════════════════════════════════════════════════════════════════════════════
//  RESPOSTAS
// ══════════════════════════════════════════════════════════════════════════════

function agendamento_resposta_ok($data, $meta = null, $request_id = '', $http = 200)
{
    $resp = ['success' => true, 'requestId' => $request_id, 'data' => $data, '_httpStatus' => $http];
    if ($meta) $resp['meta'] = $meta;
    return new WP_REST_Response($resp, $http);
}

function agendamento_resposta_erro($erro, $detalhe = '', $http = 400, $request_id = '')
{
    $resp = new WP_REST_Response([
        'success'     => false,
        'error'       => $erro,
        'details'     => $detalhe,
        'requestId'   => $request_id,
        '_httpStatus' => $http,
    ], $http);

    if ((int) $http === 429) {
        $resp->header('Retry-After', '60');
    }

    return $resp;
}

// ══════════════════════════════════════════════════════════════════════════════
//  LOGS
// ══════════════════════════════════════════════════════════════════════════════

function agendamento_log($evento, $detalhes = [])
{
    global $wpdb;
    $wpdb->insert($wpdb->prefix . 'agendamentos_logs', [
        'timestamp'  => current_time('mysql', true),
        'evento'     => sanitize_text_field((string) $evento),
        'request_id' => sanitize_text_field((string)($detalhes['requestId'] ?? '')),
        'detalhes'   => wp_json_encode($detalhes, JSON_UNESCAPED_UNICODE),
        'usuario'    => wp_get_current_user()->user_email ?: 'anonymous',
        'ip'         => agendamento_obter_ip(),
    ]);
}

// CORREÇÃO P2: limpeza agora roda via WP-Cron (agendamento_cron_manutencao),
// não mais dentro da requisição do usuário final.
function agendamento_limpar_logs($manter = 1000)
{
    global $wpdb;
    $tabela = $wpdb->prefix . 'agendamentos_logs';
    $total = (int) $wpdb->get_var("SELECT COUNT(*) FROM {$tabela}");
    $excedente = $total - (int) $manter;
    if ($excedente > 0) {
        $wpdb->query($wpdb->prepare("DELETE FROM {$tabela} ORDER BY id ASC LIMIT %d", $excedente));
    }
}

function agendamento_limpar_rl()
{
    global $wpdb;
    $tabela = $wpdb->prefix . 'agendamentos_rl';
    $corte = (int) floor(time() / 60) * 60 - 600;
    $wpdb->query($wpdb->prepare("DELETE FROM {$tabela} WHERE janela < %d", $corte));
}

function agendamento_cron_manutencao()
{
    agendamento_limpar_logs(1000);
    agendamento_limpar_rl();
}

// ══════════════════════════════════════════════════════════════════════════════
//  PÁGINA ADMINISTRATIVA (Ferramentas > API de Agendamento)
//  Permite ver/rotacionar a chave da API, limpar o cache de configurações
//  e apagar logs — antes disso só era possível mexendo no banco.
// ══════════════════════════════════════════════════════════════════════════════

add_action('admin_menu', 'agendamento_admin_menu');
add_action('admin_post_agendamento_rotacionar_key', 'agendamento_admin_rotacionar_key');
add_action('admin_post_agendamento_limpar_cache', 'agendamento_admin_limpar_cache');
add_action('admin_post_agendamento_limpar_logs', 'agendamento_admin_limpar_logs');

function agendamento_admin_menu()
{
    add_management_page(
        'API de Agendamento',
        'API de Agendamento',
        'manage_options',
        'agendamento-api',
        'agendamento_admin_renderizar_pagina'
    );
}

function agendamento_admin_renderizar_pagina()
{
    if (!current_user_can('manage_options')) {
        wp_die('Acesso negado.');
    }

    global $wpdb;
    $chave = (string) get_option('agendamento_api_key');
    $msg = isset($_GET['ag_msg']) ? sanitize_key(wp_unslash($_GET['ag_msg'])) : '';
    $total_logs = (int) $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->prefix}agendamentos_logs");
?>
    <div class="wrap">
        <h1>API de Agendamento</h1>

        <?php if ($msg === 'chave_rotacionada') : ?>
            <div class="notice notice-success">
                <p>Nova chave gerada. <strong>Atualize todos os clientes que consomem a API</strong> — os que usarem a chave antiga receberão 401.</p>
            </div>
        <?php elseif ($msg === 'cache_limpo') : ?>
            <div class="notice notice-success">
                <p>Cache de configurações limpo.</p>
            </div>
        <?php elseif ($msg === 'logs_limpos') : ?>
            <div class="notice notice-success">
                <p>Logs apagados.</p>
            </div>
        <?php endif; ?>

        <h2>Endpoints</h2>
        <p><code>POST <?php echo esc_html(rest_url('agendamento/v1/executar')); ?></code></p>
        <p><code>GET&nbsp; <?php echo esc_html(rest_url('agendamento/v1/health')); ?></code></p>

        <h2>Chave da API</h2>
        <p>Envie no header <code>X-API-Key</code> ou no campo <code>apiKey</code> do corpo JSON (query string <code>?key=</code> não é mais aceita):</p>
        <p><code><?php echo esc_html($chave); ?></code></p>
        <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>">
            <input type="hidden" name="action" value="agendamento_rotacionar_key">
            <?php wp_nonce_field('agendamento_admin_acao'); ?>
            <p>
                <button type="submit" class="button button-secondary">Rotacionar chave</button>
                <span style="color:#b32d2e;">&nbsp;Atenção: clientes com a chave antiga deixarão de autenticar.</span>
            </p>
        </form>

        <h2>Cache de configurações (status / tipos de serviço / horários)</h2>
        <p>Listas e mapas ficam 5 minutos em cache. Limpe após alterar a tabela <code>agendamentos_config</code> diretamente no banco.</p>
        <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>">
            <input type="hidden" name="action" value="agendamento_limpar_cache">
            <?php wp_nonce_field('agendamento_admin_acao'); ?>
            <p><button type="submit" class="button button-secondary">Limpar cache</button></p>
        </form>

        <h2>Logs de auditoria</h2>
        <p><?php echo esc_html(number_format_i18n($total_logs)); ?> registros (incluem IP). A limpeza automática via WP-Cron mantém 1.000.</p>
        <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>">
            <input type="hidden" name="action" value="agendamento_limpar_logs">
            <?php wp_nonce_field('agendamento_admin_acao'); ?>
            <p><button type="submit" class="button button-secondary">Apagar todos os logs</button></p>
        </form>

        <h2>Limites da API</h2>
        <p><?php echo esc_html(AGENDAMENTO_RL_CHAVE_POR_MINUTO); ?> req/min por chave · <?php echo esc_html(AGENDAMENTO_RL_IP_POR_MINUTO); ?> req/min por IP · <?php echo esc_html(AGENDAMENTO_RL_AUTH_ERROS); ?> falhas de autenticação por <?php echo esc_html(AGENDAMENTO_RL_AUTH_JANELA / 60); ?> min bloqueiam o IP.</p>
    </div>
<?php
}

function agendamento_admin_rotacionar_key()
{
    if (!current_user_can('manage_options')) wp_die('Acesso negado.');
    check_admin_referer('agendamento_admin_acao');

    update_option('agendamento_api_key', wp_generate_password(32, false));
    agendamento_log('ROTACAO_CHAVE', []);

    wp_safe_redirect(add_query_arg('ag_msg', 'chave_rotacionada', admin_url('tools.php?page=agendamento-api')));
    exit;
}

function agendamento_admin_limpar_cache()
{
    if (!current_user_can('manage_options')) wp_die('Acesso negado.');
    check_admin_referer('agendamento_admin_acao');

    foreach (['status', 'tipo_servico', 'horario'] as $tipo) {
        delete_transient('ag_cfg_' . $tipo);
        delete_transient('ag_cfg_' . $tipo . '_map');
    }

    wp_safe_redirect(add_query_arg('ag_msg', 'cache_limpo', admin_url('tools.php?page=agendamento-api')));
    exit;
}

function agendamento_admin_limpar_logs()
{
    if (!current_user_can('manage_options')) wp_die('Acesso negado.');
    check_admin_referer('agendamento_admin_acao');

    global $wpdb;
    $wpdb->query("DELETE FROM {$wpdb->prefix}agendamentos_logs");

    wp_safe_redirect(add_query_arg('ag_msg', 'logs_limpos', admin_url('tools.php?page=agendamento-api')));
    exit;
}
