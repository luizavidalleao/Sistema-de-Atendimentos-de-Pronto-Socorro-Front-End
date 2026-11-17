/* Interface compartilhada. Todas as operações usam exclusivamente o repositório demo. */
(() => {
  'use strict';
  const R=VihvaRepositorio, $=s=>document.querySelector(s);
  const pagina=location.pathname.split('/').pop() || 'index.html';
  const params=new URLSearchParams(location.search), id=Number(params.get('id'));
  const escape=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const nomes={ABERTO:'Aberto',EM_ANDAMENTO:'Em andamento',FINALIZADO:'Finalizado',CANCELADO:'Cancelado',VERMELHO:'Vermelho',LARANJA:'Laranja',AMARELO:'Amarelo',VERDE:'Verde',AZUL:'Azul'};
  const cores=['VERMELHO','LARANJA','AMARELO','VERDE','AZUL'];
  const data=v=>v?new Date(v.length===10?v+'T12:00:00':v).toLocaleString('pt-BR',v.length===10?{dateStyle:'short'}:{dateStyle:'short',timeStyle:'short'}):'—';
  const link=(href,texto,ghost=false)=>`<a class="btn ${ghost?'btn-ghost':''} btn-small" href="${href}">${texto}</a>`;
  const campo=(nome,rotulo,tipo='text',valor='',extras='')=>`<div class="field"><label for="${nome}">${rotulo}</label><input id="${nome}" name="${nome}" type="${tipo}" value="${escape(valor)}" ${extras}></div>`;
  const selecao=(nome,rotulo,opcoes,valor='',vazio='Selecione')=>`<div class="field"><label for="${nome}">${rotulo}</label><select id="${nome}" name="${nome}"><option value="">${vazio}</option>${opcoes.map(([v,n])=>`<option value="${escape(v)}" ${String(v)===String(valor)?'selected':''}>${escape(n)}</option>`).join('')}</select></div>`;
  const texto=(nome,rotulo,valor='')=>`<div class="field"><label for="${nome}">${rotulo}</label><textarea id="${nome}" name="${nome}">${escape(valor)}</textarea></div>`;
  // No celular, cada linha vira um cartão com os mesmos dados e ações.
  const tabela = (titulos, linhas, classe = '') => {
    const cabecalho = titulos.map(t => '<th scope="col" role="columnheader">' + escape(t) + '</th>').join('');
    const corpo = linhas.length ? linhas.map(l => '<tr role="row">' + l.map((c,i) =>
      '<td role="cell"><span class="rotulo-celula" aria-hidden="true">' + escape(titulos[i])
      + '</span><div class="valor-celula">' + c + '</div></td>').join('') + '</tr>').join('')
      : '<tr class="listagem-vazia" role="row"><td role="cell" colspan="' + titulos.length + '">Nenhum registro encontrado.</td></tr>';
    return '<div class="card card-table listagem-responsiva ' + classe + '"><table role="table"><thead role="rowgroup"><tr role="row">'
      + cabecalho + '</tr></thead><tbody role="rowgroup">' + corpo + '</tbody></table></div>';
  };
  const badge=v=>`<span class="badge ${v==='EM_ANDAMENTO'?'andamento':(v||'aberto').toLowerCase()}">${escape(nomes[v]||'Sem triagem')}</span>`;
  const titulo=(t,acoes='',descricao='')=>`<div class="page-head${descricao ? ' cabecalho-listagem' : ''}"><h1>${t}</h1>${descricao ? `<p class="descricao-pagina">${descricao}</p>` : ''}<div class="actions">${acoes}<a class="btn btn-receber-paciente" href="novo-atendimento.html"><span class="receber-icone" aria-hidden="true">+</span> Registrar atendimento</a></div></div>`;
  const form=(conteudo,cancelar,label='Salvar')=>`<form id="form">${conteudo}<div class="actions">${link(cancelar,'Cancelar',true)}<button class="btn" type="submit">${label}</button></div></form>`;
  const cartao=(t,c)=>`<section class="card"><h2>${t}</h2>${c}</section>`;
  function aviso(m,erro=false) {const el=$('#mensagem'); el.textContent=m; el.className='alert '+(erro?'erro':'ok'); el.hidden=false; el.focus();}
  function tentar(fn) {try {fn();} catch(e) {aviso(e.name==='QuotaExceededError'?'Sem espaço para salvar a demonstração neste navegador.':e.message,true);}}
  function enviar(fn) {$('#form').addEventListener('submit',e=>{e.preventDefault(); tentar(()=>{const d=Object.fromEntries(new FormData(e.target)); for(const k in d) d[k]=d[k].trim(); fn(d);});});}
  function navegar(url,m='Alterações salvas.') {sessionStorage.setItem('vihva.demo.aviso',m); location.href=url;}
  function procurar(t) {return R.listar(t);}
  const paciente=id=>R.obter('pacientes',id);
  const triagem=id=>procurar('triagens').find(x=>x.id_atendimento===id);
  function registro(t) {if(!Number.isInteger(id)||id<1) throw Error('Selecione um registro na listagem.'); const r=R.obter(t,id); if(!r) throw Error('Registro não encontrado. Volte à listagem.'); return r;}
  document.body.classList.add('pagina-sistema');
  const menu=[['painel.html','Painel'],['pacientes.html','Pacientes'],['atendimentos.html','Histórico']];
  const ativo=({'paciente-form.html':'pacientes.html','triagem.html':'atendimentos.html','consulta.html':'atendimentos.html','atendimento.html':'atendimentos.html'})[pagina]||pagina;
  document.body.innerHTML=`<a class="pular" href="#conteudo">Ir para o conteúdo</a><nav class="nav nav-sistema" aria-label="Navegação principal"><a class="logo" href="index.html"><img class="logo-imagem" src="assets/logo-vihva-fiel.svg" alt="Vihva" width="146" height="46" decoding="async"></a><div class="nav-operacao"><button class="btn btn-ghost btn-small menu-toggle" type="button" aria-expanded="false" aria-controls="menu">Menu</button><div class="links" id="menu">${menu.map(([h,t])=>`<a href="${h}" ${h===ativo?'class="active" aria-current="page"':''}>${t}</a>`).join('')}</div></div></nav><main id="conteudo" tabindex="-1"><div class="page"><p id="mensagem" class="alert" role="status" tabindex="-1" hidden></p><div id="tela"></div></div></main><footer class="footer"><span>Vihva</span><span>Juntos pela vida <b aria-label="amor">♥</b></span></footer>`;
  const tela=html=>{$('#tela').innerHTML=html;};
  $('.menu-toggle')?.addEventListener('click',e=>{const aberto=e.target.getAttribute('aria-expanded')!=='true'; e.target.setAttribute('aria-expanded',String(aberto)); $('#menu').classList.toggle('expandido',aberto);});
  function filtros(html,renderizar) {$('#filtros').innerHTML=html; $('#filtros').addEventListener('input',renderizar); renderizar();}
  const normalizar=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  function corresponde(valores,busca) {return valores.some(v=>normalizar(v).includes(normalizar(busca)));}
  // A fila deriva um único status dos registros já feitos.
  const atendimentoAtivo = a => ['ABERTO', 'EM_ANDAMENTO'].includes(a.status);
  const consultaDoAtendimento = id => procurar('consultas').find(c => c.id_atendimento === id);
  const statusFila = {TRIAGEM_PENDENTE:'Triagem pendente', CONSULTA_PENDENTE:'Consulta pendente'};
  const situacao = a => atendimentoAtivo(a)
    ? (triagem(a.id_atendimento) ? 'CONSULTA_PENDENTE' : 'TRIAGEM_PENDENTE')
    : a.status;
  const badgeSituacao = a => atendimentoAtivo(a)
    ? '<span class="badge ' + (triagem(a.id_atendimento) ? 'andamento' : 'aberto') + '">' + statusFila[situacao(a)] + '</span>'
    : badge(a.status);
  function fluxoPaciente(a = null, cadastroConcluido = true, entreEtapas = false) {
    const t = a && triagem(a.id_atendimento);
    const c = a && consultaDoAtendimento(a.id_atendimento);
    const encerrado = a && !atendimentoAtivo(a);
    const feitos = [cadastroConcluido, Boolean(a), Boolean(t), Boolean(c), Boolean(encerrado)];
    const atual = encerrado || entreEtapas ? -1 : feitos.findIndex(v => !v);
    const etapas = ['Cadastro do paciente', 'Abertura do atendimento', 'Triagem', 'Consulta', 'Encerrado'];
    const etapasCurtas = ['Cadastro', 'Abertura', 'Triagem', 'Consulta', 'Encerrado'];
    return '<ol class="fluxo-paciente" aria-label="Etapas do atendimento">' + etapas.map((nome, i) =>
      '<li class="' + (feitos[i] ? 'concluida' : i === atual ? 'atual' : '') + '" ' + (i === atual ? 'aria-current="step"' : '') + '><span class="fluxo-numero">' + (i + 1) + '</span><span class="etapa-nome">' + nome + '</span><span class="etapa-curta" aria-hidden="true">' + etapasCurtas[i] + '</span></li>'
    ).join('') + '</ol>';
  }
  function resumoPaciente(p) {
    return '<div class="paciente-selecionado"><span class="muted">Paciente selecionado</span><h2>' + escape(p.nome_completo) + '</h2><p class="muted">Nascimento: ' + data(p.data_nascimento) + ' · CPF: ' + escape(p.cpf || 'Não informado') + '</p></div>';
  }
  function listaAtendimentos(painel = false) {
    const todos = procurar('atendimentos');
    const pacienteId = params.has('paciente') ? Number(params.get('paciente')) : null;
    if (pacienteId !== null && (!Number.isInteger(pacienteId) || !paciente(pacienteId))) throw Error('Paciente não encontrado.');
    const base = painel ? todos.filter(atendimentoAtivo) : todos;
    // A fila segue a chegada, sem calcular prioridade clínica.
    base.sort((a, b) => painel
      ? Date.parse(a.data_hora_chegada) - Date.parse(b.data_hora_chegada) || a.id_atendimento - b.id_atendimento
      : Date.parse(b.data_hora_chegada) - Date.parse(a.data_hora_chegada) || b.id_atendimento - a.id_atendimento);
    let cabecalho = titulo(painel ? 'Painel de atendimentos' : 'Histórico de atendimentos', '', painel
      ? 'Consulte atendimentos abertos com triagens ou consultas pendentes. Atendimentos encerrados são registrados no histórico.'
      : 'Consulte todos os atendimentos, incluindo os ativos, finalizados e cancelados.');
    if (painel) {
      const stats = [
        [base.length, 'Atendimentos ativos'],
        [base.filter(a => !triagem(a.id_atendimento)).length, 'Triagem pendente'],
        [base.filter(a => situacao(a) === 'CONSULTA_PENDENTE').length, 'Consulta pendente'],
      ];
      cabecalho += '<div class="grid indicadores-fila">' + stats.map(([n, t]) => '<div class="card stat"><b>' + n + '</b><span>' + t + '</span></div>').join('') + '</div>';
    }
    const listagem = painel
      ? '<section class="card fila-painel" aria-label="Atendimentos ativos"><div class="filtros-fila" id="filtros"></div><p id="contagem" role="status" hidden></p><div id="lista"></div></section>'
      : '<div class="card row" id="filtros"></div><p id="contagem" role="status"></p><div id="lista"></div>';
    tela(cabecalho + listagem);
    const filtroPaciente = painel ? '' : selecao('paciente_historico', 'Paciente', procurar('pacientes').map(p => [p.id_paciente, p.nome_completo]), pacienteId || '', 'Todos os pacientes');
    filtros(campo('busca', 'Pesquisar paciente ou número do atendimento', 'search') + filtroPaciente
      + selecao('status', 'Status', (painel ? Object.keys(statusFila) : [...Object.keys(statusFila), 'FINALIZADO', 'CANCELADO']).map(v => [v, statusFila[v] || nomes[v]]), '', painel ? 'Todos os ativos' : 'Todos')
      + selecao('classificacao', 'Classificação', cores.map(v => [v, nomes[v]]).concat([['SEM', 'Sem triagem']]), '', 'Todas'), () => {
      const selecionado = Number($('#paciente_historico')?.value || 0);
      const itens = base.filter(a => {
        const classificacao = triagem(a.id_atendimento)?.classificacao_manchester;
        return (!selecionado || a.id_paciente === selecionado)
          && corresponde([paciente(a.id_paciente)?.nome_completo, a.id_atendimento], $('#busca').value)
          && (!$('#status').value || situacao(a) === $('#status').value)
          && (!$('#classificacao').value || ($('#classificacao').value === 'SEM' ? !classificacao : classificacao === $('#classificacao').value));
      });
      if (!painel) {
        // O filtro por paciente acompanha o endereço, inclusive ao voltar do detalhe.
        const url = new URL(location.href);
        if (selecionado) url.searchParams.set('paciente', selecionado); else url.searchParams.delete('paciente');
        history.replaceState(null, '', url);
      }
      $('#contagem').hidden = painel;
      $('#contagem').textContent = painel ? '' : itens.length + ' atendimento(s) encontrado(s)';
      const linhas = itens.map(a => {
        const caminho = 'atendimento.html?id=' + a.id_atendimento + (painel ? '' : '&origem=historico');
        const comuns = ['#' + a.id_atendimento, escape(paciente(a.id_paciente)?.nome_completo), data(a.data_hora_chegada)];
        const registroTriagem = triagem(a.id_atendimento);
        const cor = registroTriagem?.classificacao_manchester;
        const celulaTriagem = cor && cores.includes(cor) ? badge(cor)
          : '<div class="triagem-celula"><span class="triagem-situacao triagem-pendente">'
            + (atendimentoAtivo(a) ? 'Pendente' : 'Não registrada')
            + '</span><span class="triagem-sem-classificacao">Sem classificação</span></div>';
        if (painel) return [...comuns, celulaTriagem, badgeSituacao(a), '<div class="acoes-atendimento">' + link(caminho, 'Continuar') + link(caminho + '&modo=visualizar', 'Visualizar', true) + '</div>'];
        return [...comuns, data(a.data_hora_saida), celulaTriagem, badgeSituacao(a), link(caminho, 'Ver atendimento')];
      });
      $('#lista').innerHTML = tabela(painel
        ? ['Nº', 'Paciente', 'Chegada', 'Triagem', 'Status', 'Atendimento']
        : ['Nº', 'Paciente', 'Chegada', 'Saída', 'Triagem', 'Status', 'Ações'], linhas, 'tabela-atendimentos');
      if (!itens.length) $('#lista tbody td').textContent = painel && !base.length
        ? 'Nenhum atendimento ativo no momento. Consulte os registros encerrados no histórico.'
        : 'Nenhum registro encontrado para os filtros selecionados.';
    });
  }

  function listaPacientes() {
    tela(titulo('Pacientes', '', 'Consulte e atualize os dados dos pacientes cadastrados e acesse o histórico de atendimentos.') + '<div class="card" id="filtros"></div><div id="lista"></div>');
    filtros(campo('busca', 'Pesquisar nome, CPF ou cidade', 'search'), () => {
      const itens = procurar('pacientes').filter(p => corresponde([p.nome_completo, p.cpf, p.cidade], $('#busca').value));
      $('#lista').innerHTML = tabela(['Nome','CPF','Nascimento','Cidade / UF','Ações'], itens.map(p => [
        escape(p.nome_completo), escape(p.cpf || '—'), data(p.data_nascimento),
        escape([p.cidade, p.estado].filter(Boolean).join('/') || '—'),
        '<div class="acoes-paciente">' + link('paciente-form.html?id=' + p.id_paciente, 'Editar', true)
        + link('atendimentos.html?paciente=' + p.id_paciente, 'Ver histórico', true) + '</div>'
      ]));
    });
  }
  function formularioPaciente() {
    const p=params.has('id')?registro('pacientes'):{};
    const chegada = params.get('origem') === 'chegada' && !p.id_paciente;
    if (!p.id_paciente && !chegada) { location.replace('novo-atendimento.html'); return; }
    const campos=[['nome_completo','Nome completo *',200],['cpf','CPF',11],['rg','RG',20],['nome_mae','Nome da mãe',200],['nome_pai','Nome do pai',200],['logradouro','Logradouro',150],['numero','Número',10],['bairro','Bairro',100],['cidade','Cidade',100],['estado','UF',2],['cep','CEP',8]];
    tela(titulo(p.id_paciente?'Editar paciente':'Novo paciente')+(chegada?fluxoPaciente(null,false)+'<p class="descricao-pagina">Cadastre o paciente para continuar com a abertura do atendimento.</p>':'')+form(cartao('Dados do paciente','<p class="muted">Na edição, campos opcionais deixados vazios mantêm o valor anterior, conforme a regra atual do sistema.</p>'+campo('data_nascimento','Data de nascimento *','date',p.data_nascimento,'required min="1000-01-01" max="9999-12-31"')+'<div class="row">'+campos.map(([c,r,n])=>campo(c,r,'text',p[c],`maxlength="${n}" ${c==='nome_completo'?'required':''}`)).join('')+'</div>'),chegada?'novo-atendimento.html':'pacientes.html',chegada?'Salvar e continuar':'Salvar paciente'));
    $('#form > .actions').classList.add('acoes-formulario-paciente');
    enviar(d=>{const salvo=R.salvar('pacientes',{...p,...Object.fromEntries(Object.entries(d).map(([k,v])=>[k,v||null]))}); navegar(chegada?'novo-atendimento.html?paciente='+salvo.id_paciente:'pacientes.html',chegada?'Paciente cadastrado. Agora abra o atendimento.':'Paciente salvo.');});
  }
  function novoAtendimento() {
    const selecionado = params.has('paciente') ? paciente(Number(params.get('paciente'))) : null;
    if (params.has('paciente') && !selecionado) throw Error('Paciente não encontrado.');
    const cadastrados = procurar('pacientes');
    // Selecionar identifica o paciente; somente o envio do formulário abre o atendimento.
    const identificacao = selecao('id_paciente', 'Paciente cadastrado *',
      cadastrados.map(p => [p.id_paciente, p.nome_completo]), selecionado?.id_paciente || '', 'Escolha pelo nome');
    const formulario = '<section class="card abertura-cartao" aria-labelledby="titulo-abertura">'
      + '<h2 id="titulo-abertura">Paciente já cadastrado</h2><p class="muted abertura-orientacao">Escolha o paciente, confira os dados e registre a chegada.</p><form id="form">'
      + (cadastrados.length ? identificacao : '<p class="abertura-vazia">Ainda não há pacientes cadastrados. Use a opção de novo cadastro.</p>') + '<div id="resumo-abertura" aria-live="polite"></div>'
      + '<p class="nota-campo">Ao abrir, a chegada é registrada. O atendimento fica como Triagem pendente até que a triagem seja salva.</p>'
      + '<div class="actions acoes-formulario abertura-acoes"><button class="btn" type="submit" disabled>Abrir atendimento</button>'
      + link('painel.html', 'Cancelar', true) + '</div></form></section>';
    const semCadastro = '<section class="card cadastro-alternativo" id="cadastro-alternativo" aria-labelledby="titulo-sem-cadastro">'
      + '<h2 id="titulo-sem-cadastro">Primeiro atendimento?</h2>'
      + '<p class="muted">Se o paciente ainda não estiver no sistema, cadastre-o. Na volta, ele já estará selecionado.</p>'
      + '<div class="actions">' + link('paciente-form.html?origem=chegada', 'Cadastrar novo paciente', true) + '</div></section>';
    tela(titulo('Novo atendimento')
      + fluxoPaciente(null, Boolean(selecionado))
      + '<p class="descricao-pagina">Escolha um paciente existente ou faça um novo cadastro para registrar a chegada.</p>'
      + '<div id="avisos-paciente"></div><div class="abertura-opcoes">' + formulario + semCadastro + '</div>');
    const campoPaciente = $('#id_paciente');
    if (campoPaciente) campoPaciente.required = true;
    function atualizarPaciente() {
      const p = campoPaciente?.value ? paciente(Number(campoPaciente.value)) : null;
      $('#form button[type=submit]').disabled = !p;
      $('.abertura-opcoes').classList.toggle('com-paciente', Boolean(p));
      $('#resumo-abertura').innerHTML = p ? resumoPaciente(p) : '';
      $('#cadastro-alternativo').hidden = Boolean(p);
      const existentes = p ? procurar('atendimentos').filter(a => a.id_paciente === p.id_paciente && atendimentoAtivo(a)) : [];
      $('#avisos-paciente').innerHTML = existentes.length ? cartao('Este paciente já possui atendimento ativo',
        '<p class="muted">Confira o registro existente antes de abrir outro atendimento.</p><div class="actions aviso-abertura-acoes">'
        + existentes.map(a => link('atendimento.html?id=' + a.id_atendimento, 'Continuar atendimento #' + a.id_atendimento, true)).join('') + '</div>') : '';
      $('.fluxo-paciente').outerHTML = fluxoPaciente(null, Boolean(p));
    }
    campoPaciente?.addEventListener('change', atualizarPaciente);
    atualizarPaciente();
    enviar(d => {
      const a = R.salvar('atendimentos', {id_paciente: Number(d.id_paciente), status: 'ABERTO', data_hora_chegada: new Date().toISOString(), data_hora_saida: null});
      location.href = 'atendimento.html?id=' + a.id_atendimento + '&origem=abertura';
    });
  }

  function detalhe() {
    const a = registro('atendimentos'), p = paciente(a.id_paciente), t = triagem(id), c = consultaDoAtendimento(id);
    const ativo = atendimentoAtivo(a);
    const visualizacao = params.get('modo') === 'visualizar';
    const somenteLeitura = visualizacao || !ativo || params.get('origem') === 'historico';
    const dados = (obj, campos) => '<dl class="dados">' + campos.map(([k,r]) => '<dt>' + r + '</dt><dd>' + (k === 'classificacao_manchester' ? badge(obj[k]) : escape(k === 'data_nascimento' ? data(obj[k]) : obj[k] ?? '—')) + '</dd>').join('') + '</dl>';
    const aberturaConcluida = !somenteLeitura && !t && params.get('origem') === 'abertura';
    const triagemConcluida = !somenteLeitura && t && !c && params.get('origem') === 'triagem';
    if (aberturaConcluida || triagemConcluida) {
      tela(titulo(triagemConcluida ? 'Triagem registrada' : 'Atendimento aberto')
        + fluxoPaciente(a, true, true)
        + '<section class="proxima-etapa abertura-confirmada" aria-labelledby="abertura-concluida"><div>'
        + '<h2 id="abertura-concluida">' + escape(p.nome_completo) + ' · Atendimento #' + id + '</h2>'
        + (triagemConcluida
          ? '<p>A triagem foi salva. Você pode iniciar a consulta agora ou voltar ao painel e deixar o atendimento na fila como Consulta pendente.</p>'
          : '<p>A chegada foi registrada. A triagem ainda não começou. Você pode iniciá-la agora ou voltar ao painel para deixar o atendimento na fila.</p>') + '</div>'
        + '<div class="actions">' + link('painel.html', 'Voltar ao painel', true)
        + (triagemConcluida ? link('consulta.html?id=' + id, 'Iniciar consulta') : link('triagem.html?id=' + id, 'Iniciar triagem')) + '</div></section>');
      return;
    }
    const retornoNoCartao = (visualizacao || !ativo) && params.get('origem') !== 'historico';
    let proxima;
    if (somenteLeitura) proxima = '<div class="proxima-etapa"><div><h2>' + (visualizacao ? 'Resumo do atendimento' : ativo ? 'Consulta do histórico' : 'Atendimento ' + nomes[a.status].toLowerCase()) + '</h2><p class="muted">Visualização dos dados registrados neste atendimento.</p></div>'
      + (retornoNoCartao ? link('painel.html', 'Voltar ao painel', true) : '') + '</div>';
    else if (!t) proxima = '<div class="proxima-etapa"><div><h2>Próxima etapa: triagem</h2><p class="muted">A chegada já foi registrada. Preencha os dados da triagem para continuar.</p></div>' + link('triagem.html?id=' + id, 'Registrar triagem') + '</div>';
    else if (!c) proxima = '<div class="proxima-etapa"><div><h2>Próxima etapa: consulta</h2><p class="muted">A triagem já foi registrada. Continue com o registro da consulta.</p></div>' + link('consulta.html?id=' + id, 'Registrar consulta') + '</div>';
    const edicoes = somenteLeitura ? '' : (t ? link('triagem.html?id=' + id, 'Editar triagem', true) : '');
    tela(titulo(escape(p.nome_completo), retornoNoCartao ? '' : params.get('origem') === 'historico' ? link('atendimentos.html?paciente=' + p.id_paciente, 'Voltar ao histórico', true) : link('painel.html', 'Voltar ao painel', true))
      + '<p class="identificacao-atendimento">Atendimento #' + id + ' · ' + badgeSituacao(a) + '</p>'
      + fluxoPaciente(a, true, visualizacao) + proxima
      + (edicoes ? '<div class="actions acoes-registros">' + edicoes + '</div>' : '')
      + '<div class="grid cols-2">' + cartao('Paciente', dados(p, [['data_nascimento','Nascimento'],['cpf','CPF'],['rg','RG'],['nome_mae','Mãe'],['nome_pai','Pai'],['logradouro','Logradouro'],['numero','Número'],['bairro','Bairro'],['cidade','Cidade'],['estado','UF'],['cep','CEP']]))
      + cartao('Triagem', t ? dados(t, [['classificacao_manchester','Classificação'],['pressao_sistolica','Sistólica (mmHg)'],['pressao_diastolica','Diastólica (mmHg)'],['temperatura','Temperatura (°C)'],['batimentos_cardiacos','Batimentos (bpm)']]) + '<div class="resumo-queixas"><h3>Queixas</h3><p>' + escape(t.queixas?.trim() || 'Nenhuma queixa registrada.') + '</p></div>' : '<p>Aguardando registro da triagem.</p>') + '</div>'
      + cartao('Consulta', c ? '<div class="resumo-consulta"><h3>Registro clínico da consulta</h3><p class="texto-registro">' + escape(c.observacoes || 'Nenhum registro clínico informado.') + '</p>'
        + '<h3>Prescrição de medicamentos</h3><p class="texto-registro">' + escape(c.medicamentos || 'Nenhuma prescrição de medicamentos registrada.') + '</p></div>'
        : '<p>Aguardando registro da consulta.</p>'));
  }
  function classificacaoManchester(valor) {
    const descricoes = {VERMELHO: 'Emergência', LARANJA: 'Muito urgente', AMARELO: 'Urgente', VERDE: 'Pouco urgente', AZUL: 'Não urgente'};
    // Opções do domínio existente; seleção exclusivamente manual, sem avaliação clínica.
    return '<fieldset class="manchester"><legend>Classificação de risco *</legend>'
      + '<p class="muted manchester-ajuda">Selecione a cor da classificação.</p><div class="manchester-opcoes">'
      + cores.map(cor => '<label class="manchester-opcao manchester-' + cor.toLowerCase() + '" for="classificacao_' + cor + '">'
        + '<input type="radio" id="classificacao_' + cor + '" name="classificacao_manchester" aria-labelledby="nome_classificacao_' + cor + '" aria-describedby="urgencia_' + cor + '" value="' + cor + '" required ' + (valor === cor ? 'checked' : '') + '>'
        + '<span class="manchester-cartao"><span class="manchester-cor" aria-hidden="true"></span><span class="manchester-nome" id="nome_classificacao_' + cor + '">' + nomes[cor] + '</span><span class="manchester-urgencia" id="urgencia_' + cor + '">' + descricoes[cor] + '</span></span></label>').join('')
      + '</div></fieldset>';
  }
  function formularioClinico(tipo) {
    const a=registro('atendimentos'),p=paciente(a.id_paciente),t=tipo==='triagens';
    if (!atendimentoAtivo(a) || (!t && !triagem(id))) {
      location.replace('atendimento.html?id=' + id);
      return;
    }
    const r=procurar(tipo).find(x=>x.id_atendimento===id)||{id_atendimento:id};
    let conteudo=t?cartao('Sinais vitais','<div class="row">'+[['pressao_sistolica','Pressão sistólica (mmHg)'],['pressao_diastolica','Pressão diastólica (mmHg)'],['temperatura','Temperatura (°C)'],['batimentos_cardiacos','Batimentos (bpm)']].map(([c,n])=>campo(c,n,'number',r[c],c==='temperatura'?'step="0.1" min="-999.9" max="999.9"':'min="0" max="65535" step="1"')).join('')+'</div>')+cartao('Queixas',texto('queixas','Queixas relatadas',r.queixas))+cartao('Classificação Manchester',classificacaoManchester(r.classificacao_manchester)):cartao('Registro clínico da consulta',texto('observacoes','Anotações clínicas',r.observacoes))+cartao('Prescrição de medicamentos',texto('medicamentos','Medicamentos prescritos',r.medicamentos));
    tela(titulo(t?'Triagem':'Consulta')+fluxoPaciente(a)+`<div class="contexto-etapa"><p class="contexto-paciente">${escape(p.nome_completo)} · Atendimento #${id}</p><p class="muted">Confira o paciente e preencha os dados desta etapa. ${t ? 'Ao salvar, você poderá iniciar a consulta ou voltar ao painel.' : 'Ao salvar, o atendimento será encerrado e ficará no histórico.'}</p></div>`+form(conteudo,'atendimento.html?id='+id));
    $('#form').classList.add('form-etapa');
    if (!t) $('#medicamentos').maxLength = R.limiteMedicamentos;
    const acoesEtapa = $('#form > .actions');
    acoesEtapa.classList.add('acoes-etapa');
    acoesEtapa.prepend(acoesEtapa.querySelector('button[type="submit"]'));
    enviar(d=>{
      if(t) {
        for(const c of ['pressao_sistolica','pressao_diastolica','temperatura','batimentos_cardiacos']) d[c]=d[c]===''?null:Number(d[c]);
        R.salvar(tipo,{...r,...d});
      } else {
        R.consulta({...r, observacoes:d.observacoes || null, medicamentos:d.medicamentos || null});
      }
      if (t) location.href = 'atendimento.html?id=' + id + '&origem=triagem';
      else navegar('atendimento.html?id=' + id, 'Consulta salva e atendimento encerrado.');
    });
  }
  tentar(()=>{
    const rotas={'painel.html':()=>listaAtendimentos(true),'atendimentos.html':()=>listaAtendimentos(),'pacientes.html':listaPacientes,'paciente-form.html':formularioPaciente,'novo-atendimento.html':novoAtendimento,'atendimento.html':detalhe,'triagem.html':()=>formularioClinico('triagens'),'consulta.html':()=>formularioClinico('consultas')};
    if(!rotas[pagina]) throw Error('Página não encontrada.');
    rotas[pagina]();
    if(window.VihvaAviso) aviso(window.VihvaAviso,true);
    const mensagem=sessionStorage.getItem('vihva.demo.aviso');
    if(mensagem){sessionStorage.removeItem('vihva.demo.aviso'); aviso(mensagem);}
  });
})();
