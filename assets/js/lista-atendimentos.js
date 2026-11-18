"use strict";

// Painel e Histórico compartilham as regras de filtragem e preenchimento da tabela.
// Mantém as variáveis deste arquivo separadas das outras telas.
(function () {
  // Funções compartilhadas utilizadas nesta tela.
  const selecionarElemento = VihvaTela.selecionarElemento;
  const parametrosDaPagina = VihvaTela.parametrosDaPagina;
  const listarRegistros = VihvaTela.listarRegistros;
  const buscarPaciente = VihvaTela.buscarPaciente;
  const atendimentoAtivo = VihvaTela.atendimentoAtivo;
  const obterSituacao = VihvaTela.obterSituacao;
  const adicionarOpcoes = VihvaTela.adicionarOpcoes;
  const buscarTriagem = VihvaTela.buscarTriagem;
  const protegerTextoHtml = VihvaTela.protegerTextoHtml;
  const formatarData = VihvaTela.formatarData;
  const criarEtiqueta = VihvaTela.criarEtiqueta;
  const criarEtiquetaSituacao = VihvaTela.criarEtiquetaSituacao;
  const cores = VihvaTela.cores;
  const criarLink = VihvaTela.criarLink;
  const preencherTabela = VihvaTela.preencherTabela;
  const correspondeBusca = VihvaTela.correspondeBusca;
  const iniciarTela = VihvaTela.iniciarTela;

  function iniciarListaAtendimentos(painel = false) {
    const todos = listarRegistros('atendimentos');
    let pacienteId;
    if (parametrosDaPagina.has('paciente')) {
      pacienteId = Number(parametrosDaPagina.get('paciente'));
    } else {
      pacienteId = null;
    }
    if (pacienteId !== null && (!Number.isInteger(pacienteId) || !buscarPaciente(pacienteId))) {
      throw Error('Paciente não encontrado.');
    }
    let base;
    if (painel) {
      base = todos.filter(atendimentoAtivo);
    } else {
      base = todos;
    } // A fila segue a chegada, sem calcular prioridade clínica.
    base.sort(function (atendimento, outroAtendimento) {
      if (painel) {
        return Date.parse(atendimento.data_hora_chegada) - Date.parse(outroAtendimento.data_hora_chegada) || atendimento.id_atendimento - outroAtendimento.id_atendimento;
      } else {
        return Date.parse(outroAtendimento.data_hora_chegada) - Date.parse(atendimento.data_hora_chegada) || outroAtendimento.id_atendimento - atendimento.id_atendimento;
      }
    });
    if (painel) {
      selecionarElemento('#total-ativos').textContent = base.length;
      selecionarElemento('#total-triagem').textContent = base.filter(function (atendimento) {
        return obterSituacao(atendimento) === 'TRIAGEM_PENDENTE';
      }).length;
      selecionarElemento('#total-consulta').textContent = base.filter(function (atendimento) {
        return obterSituacao(atendimento) === 'CONSULTA_PENDENTE';
      }).length;
    } else {
      const campoPaciente = selecionarElemento('#paciente_historico');
      adicionarOpcoes(campoPaciente, listarRegistros('pacientes').map(function (pacienteAtual) {
        return [pacienteAtual.id_paciente, pacienteAtual.nome_completo];
      }));
      campoPaciente.value = pacienteId || '';
    }
    function atualizarLista() {
      const selecionado = Number(selecionarElemento('#paciente_historico')?.value || 0);
      // Cada filtro responde a uma pergunta separada.
      const textoBuscado = selecionarElemento('#busca').value;
      const statusSelecionado = selecionarElemento('#status').value;
      const corSelecionada = selecionarElemento('#classificacao').value;
      const itens = base.filter(function (atendimento) {
        const pacienteAtual = buscarPaciente(atendimento.id_paciente);
        const triagemAtual = buscarTriagem(atendimento.id_atendimento);
        const classificacao = triagemAtual?.classificacao_manchester;
        const pacienteCorresponde = !selecionado || atendimento.id_paciente === selecionado;
        const textoCorresponde = correspondeBusca([pacienteAtual?.nome_completo, atendimento.id_atendimento], textoBuscado);
        const statusCorresponde = !statusSelecionado || obterSituacao(atendimento) === statusSelecionado;
        let corCorresponde = true;
        if (corSelecionada === 'SEM') {
          corCorresponde = !classificacao;
        } else if (corSelecionada) {
          corCorresponde = classificacao === corSelecionada;
        }
        return pacienteCorresponde && textoCorresponde && statusCorresponde && corCorresponde;
      });
      if (!painel) {
        // O filtro por paciente acompanha o endereço, inclusive ao voltar do detalhe.
        const url = new URL(location.href);
        if (selecionado) {
          url.searchParams.set('paciente', selecionado);
        } else {
          url.searchParams.delete('paciente');
        }
        history.replaceState(null, '', url);
      }
      selecionarElemento('#contagem').hidden = painel;
      if (painel) {
        selecionarElemento('#contagem').textContent = '';
      } else {
        selecionarElemento('#contagem').textContent = itens.length + ' atendimento(s) encontrado(s)';
      }
      const linhas = itens.map(function (atendimento) {
        let caminho = 'atendimento.html?id=' + atendimento.id_atendimento;
        if (!painel) {
          caminho += '&origem=historico';
        }
        const comuns = ['#' + atendimento.id_atendimento, protegerTextoHtml(buscarPaciente(atendimento.id_paciente)?.nome_completo), formatarData(atendimento.data_hora_chegada)];
        const registroTriagem = buscarTriagem(atendimento.id_atendimento);
        const cor = registroTriagem?.classificacao_manchester;
        let celulaTriagem;
        if (cor && cores.includes(cor)) {
          celulaTriagem = criarEtiqueta(cor);
        } else {
          let textoTriagem = 'Não registrada';
          if (atendimentoAtivo(atendimento)) {
            textoTriagem = 'Pendente';
          }
          celulaTriagem = '<div class="triagem-celula">' + '<span class="triagem-situacao triagem-pendente">' + textoTriagem + '</span>' + '<span class="triagem-sem-classificacao">Sem classificação</span></div>';
        }
        if (painel) {
          return [...comuns, celulaTriagem, criarEtiquetaSituacao(atendimento), '<div class="acoes-atendimento">' + criarLink(caminho, 'Continuar') + criarLink(caminho + '&modo=visualizar', 'Visualizar', true) + '</div>'];
        }
        return [...comuns, formatarData(atendimento.data_hora_saida), celulaTriagem, criarEtiquetaSituacao(atendimento), criarLink(caminho, 'Ver atendimento')];
      });
      let mensagemVazia;
      if (painel && !base.length) {
        mensagemVazia = 'Nenhum atendimento ativo no momento. Consulte os registros encerrados no histórico.';
      } else {
        mensagemVazia = 'Nenhum registro encontrado para os filtros selecionados.';
      }
      preencherTabela(linhas, mensagemVazia);
    }
    selecionarElemento('#filtros').addEventListener('input', atualizarLista);
    atualizarLista();
  }
  iniciarTela(function () {
    return iniciarListaAtendimentos(Boolean(selecionarElemento("#total-ativos")));
  });
})();
