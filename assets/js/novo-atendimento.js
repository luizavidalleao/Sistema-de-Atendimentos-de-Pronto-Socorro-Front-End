"use strict";

// Seleciona o paciente e registra a chegada ao enviar o formulário.
// Mantém as variáveis deste arquivo separadas das outras telas.
(function () {
  // Funções compartilhadas utilizadas nesta tela.
  const repositorio = VihvaTela.repositorio;
  const selecionarElemento = VihvaTela.selecionarElemento;
  const parametrosDaPagina = VihvaTela.parametrosDaPagina;
  const buscarPaciente = VihvaTela.buscarPaciente;
  const listarRegistros = VihvaTela.listarRegistros;
  const adicionarOpcoes = VihvaTela.adicionarOpcoes;
  const marcarEtapas = VihvaTela.marcarEtapas;
  const atendimentoAtivo = VihvaTela.atendimentoAtivo;
  const criarCartao = VihvaTela.criarCartao;
  const criarLink = VihvaTela.criarLink;
  const aoEnviarFormulario = VihvaTela.aoEnviarFormulario;
  const formatarData = VihvaTela.formatarData;
  const protegerTextoHtml = VihvaTela.protegerTextoHtml;
  const iniciarTela = VihvaTela.iniciarTela;

  function criarResumoPaciente(pacienteAtual) {
    const nome = protegerTextoHtml(pacienteAtual.nome_completo);
    const nascimento = formatarData(pacienteAtual.data_nascimento);
    const cpf = protegerTextoHtml(pacienteAtual.cpf || 'Não informado');
    return '<div class="paciente-selecionado">'
      + '<span class="muted">Paciente selecionado</span>'
      + '<h2>' + nome + '</h2>'
      + '<p class="muted">Nascimento: ' + nascimento + ' · CPF: ' + cpf + '</p></div>';
  }

  function iniciarNovoAtendimento() {
    let selecionado;
    if (parametrosDaPagina.has('paciente')) {
      selecionado = buscarPaciente(Number(parametrosDaPagina.get('paciente')));
    } else {
      selecionado = null;
    }
    if (parametrosDaPagina.has('paciente') && !selecionado) {
      throw Error('Paciente não encontrado.');
    }
    const cadastrados = listarRegistros('pacientes');
    const campoPaciente = selecionarElemento('#id_paciente');
    adicionarOpcoes(campoPaciente, cadastrados.map(function (pessoa) {
      return [pessoa.id_paciente, pessoa.nome_completo];
    }));
    campoPaciente.value = selecionado?.id_paciente || '';
    campoPaciente.closest('.field').hidden = !cadastrados.length;
    campoPaciente.disabled = !cadastrados.length;
    selecionarElemento('.abertura-vazia').hidden = Boolean(cadastrados.length);
    function atualizarPaciente() {
      let pacienteAtual;
      if (campoPaciente?.value) {
        pacienteAtual = buscarPaciente(Number(campoPaciente.value));
      } else {
        pacienteAtual = null;
      }
      selecionarElemento('#form button[type=submit]').disabled = !pacienteAtual;
      selecionarElemento('.abertura-opcoes').classList.toggle('com-paciente', Boolean(pacienteAtual));
      if (pacienteAtual) {
        selecionarElemento('#resumo-abertura').innerHTML = criarResumoPaciente(pacienteAtual);
      } else {
        selecionarElemento('#resumo-abertura').innerHTML = '';
      }
      selecionarElemento('#cadastro-alternativo').hidden = Boolean(pacienteAtual);
      let existentes;
      if (pacienteAtual) {
        existentes = listarRegistros('atendimentos').filter(function (atendimento) {
          return atendimento.id_paciente === pacienteAtual.id_paciente && atendimentoAtivo(atendimento);
        });
      } else {
        existentes = [];
      }
      // Mostra os atendimentos existentes para evitar uma abertura por engano.
      if (existentes.length > 0) {
        let linksAtendimentos = '';
        for (const atendimento of existentes) {
          const endereco = 'atendimento.html?id=' + atendimento.id_atendimento;
          const textoBotao = 'Continuar atendimento #' + atendimento.id_atendimento;
          linksAtendimentos += criarLink(endereco, textoBotao, true);
        }
        const conteudoAviso = '<p class="muted">Confira o registro existente antes de abrir outro atendimento.</p>' + '<div class="actions aviso-abertura-acoes">' + linksAtendimentos + '</div>';
        selecionarElemento('#avisos-paciente').innerHTML = criarCartao('Este paciente já possui atendimento ativo', conteudoAviso);
      } else {
        selecionarElemento('#avisos-paciente').innerHTML = '';
      }
      marcarEtapas(null, Boolean(pacienteAtual));
    }
    campoPaciente?.addEventListener('change', atualizarPaciente);
    atualizarPaciente();
    aoEnviarFormulario(function (dadosFormulario) {
      const atendimento = repositorio.salvar('atendimentos', {
        id_paciente: Number(dadosFormulario.id_paciente),
        status: 'ABERTO',
        data_hora_chegada: new Date().toISOString(),
        data_hora_saida: null
      });
      location.href = 'atendimento.html?id=' + atendimento.id_atendimento + '&origem=abertura';
    });
  }
  iniciarTela(iniciarNovoAtendimento);
})();
