"use strict";

// Mostra o resumo ou a confirmação de uma etapa, de acordo com a origem do acesso.
// Mantém as variáveis deste arquivo separadas das outras telas.
(function () {
  // Funções compartilhadas utilizadas nesta tela.
  const selecionarElemento = VihvaTela.selecionarElemento;
  const idRegistro = VihvaTela.idRegistro;
  const parametrosDaPagina = VihvaTela.parametrosDaPagina;
  const buscarRegistroDaPagina = VihvaTela.buscarRegistroDaPagina;
  const buscarPaciente = VihvaTela.buscarPaciente;
  const buscarTriagem = VihvaTela.buscarTriagem;
  const buscarConsulta = VihvaTela.buscarConsulta;
  const atendimentoAtivo = VihvaTela.atendimentoAtivo;
  const marcarEtapas = VihvaTela.marcarEtapas;
  const criarEtiquetaSituacao = VihvaTela.criarEtiquetaSituacao;
  const nomes = VihvaTela.nomes;
  const formatarData = VihvaTela.formatarData;
  const criarEtiqueta = VihvaTela.criarEtiqueta;
  const iniciarTela = VihvaTela.iniciarTela;
  const repositorio = VihvaTela.repositorio;
  const navegarComAviso = VihvaTela.navegarComAviso;
  const executarComTratamentoDeErro = VihvaTela.executarComTratamentoDeErro;

  function cancelarAtendimento() {
    const dialogo = selecionarElemento('#confirmacao-cancelamento');
    // Limpa a resposta anterior: Escape e Voltar nunca confirmam a operação.
    dialogo.returnValue = '';
    dialogo.showModal();
  }

  function confirmarCancelamento() {
    executarComTratamentoDeErro(function () {
      // A mensagem de sucesso só aparece depois de gravar no navegador.
      repositorio.cancelarAtendimento(idRegistro);
      navegarComAviso('atendimento.html?id=' + idRegistro, 'Atendimento cancelado. O registro continua disponível no histórico.');
    });
  }

  function preencherDados(seletor, registro) {
    for (const elemento of selecionarElemento(seletor).querySelectorAll('[data-campo]')) {
      const chave = elemento.dataset.campo;
      if (chave === 'classificacao_manchester') {
        elemento.innerHTML = criarEtiqueta(registro[chave]);
      } else if (chave === 'data_nascimento') {
        elemento.textContent = formatarData(registro[chave]);
      } else {
        elemento.textContent = registro[chave] ?? '—';
      }
    }
  }

  function preencherResumo(pessoa, triagemAtual, consulta) {
    preencherDados('#resumo-paciente', pessoa);
    if (triagemAtual) {
      selecionarElemento('#triagem-vazia').hidden = true;
      selecionarElemento('#resumo-triagem').hidden = false;
      preencherDados('#resumo-triagem', triagemAtual);
      selecionarElemento('#queixas-triagem').textContent = triagemAtual.queixas?.trim() || 'Nenhuma queixa registrada.';
    }
    if (consulta) {
      selecionarElemento('#consulta-vazia').hidden = true;
      selecionarElemento('.resumo-consulta').hidden = false;
      selecionarElemento('#observacoes-consulta').textContent = consulta.observacoes || 'Nenhum registro clínico informado.';
      selecionarElemento('#medicamentos-consulta').textContent = consulta.medicamentos || 'Nenhuma prescrição de medicamentos registrada.';
    }
    selecionarElemento('#resumo-atendimento').hidden = false;
  }
  // A confirmação fica entre as etapas; ainda não é o formulário seguinte.

  function mostrarConfirmacao(pessoa, triagemConcluida) {
    const botaoContinuar = selecionarElemento('#iniciar-etapa');
    if (triagemConcluida) {
      selecionarElemento('#titulo-pagina').textContent = 'Triagem registrada';
      botaoContinuar.textContent = 'Iniciar consulta';
      botaoContinuar.href = 'consulta.html?id=' + idRegistro;
    } else {
      selecionarElemento('#titulo-pagina').textContent = 'Atendimento aberto';
      botaoContinuar.textContent = 'Iniciar triagem';
      botaoContinuar.href = 'triagem.html?id=' + idRegistro;
    }
    selecionarElemento('#abertura-concluida').textContent = pessoa.nome_completo + ' · Atendimento #' + idRegistro;
    selecionarElemento('#confirmacao-triagem').hidden = !triagemConcluida;
    selecionarElemento('#confirmacao-abertura').hidden = triagemConcluida;
    selecionarElemento('#confirmacao-etapa').hidden = false;
  }

  function mostrarProximaEtapa(prontoParaConsulta) {
    const titulo = selecionarElemento('#titulo-proxima-etapa');
    const descricao = selecionarElemento('#descricao-proxima-etapa');
    const botaoRegistrar = selecionarElemento('#registrar-etapa');
    if (prontoParaConsulta) {
      titulo.textContent = 'Próxima etapa: consulta';
      descricao.textContent = 'A triagem já foi registrada. Continue com o registro da consulta.';
      botaoRegistrar.href = 'consulta.html?id=' + idRegistro;
      botaoRegistrar.textContent = 'Registrar consulta';
    } else {
      titulo.textContent = 'Próxima etapa: triagem';
      descricao.textContent = 'A chegada já foi registrada. Preencha os dados da triagem para continuar.';
      botaoRegistrar.href = 'triagem.html?id=' + idRegistro;
      botaoRegistrar.textContent = 'Registrar triagem';
    }
    botaoRegistrar.hidden = false;
    selecionarElemento('#proxima-etapa').hidden = false;
  }

  function iniciarDetalheAtendimento() {
    const atendimento = buscarRegistroDaPagina('atendimentos');
    const pessoa = buscarPaciente(atendimento.id_paciente);
    const triagemAtual = buscarTriagem(idRegistro);
    const consulta = buscarConsulta(idRegistro);
    const ativo = atendimentoAtivo(atendimento);
    const visualizacao = parametrosDaPagina.get('modo') === 'visualizar';
    const origem = parametrosDaPagina.get('origem');
    const somenteLeitura = visualizacao || !ativo || origem === 'historico';
    const aberturaConcluida = !somenteLeitura && !triagemAtual && origem === 'abertura';
    const triagemConcluida = !somenteLeitura && triagemAtual && !consulta && origem === 'triagem';
    const entreEtapas = Boolean(aberturaConcluida || triagemConcluida);
    marcarEtapas(atendimento, true, entreEtapas || visualizacao);
    if (entreEtapas) {
      mostrarConfirmacao(pessoa, triagemConcluida);
      return;
    }
    selecionarElemento('#titulo-pagina').textContent = pessoa.nome_completo;
    const identificacao = selecionarElemento('.identificacao-atendimento');
    identificacao.innerHTML = 'Atendimento #' + idRegistro + ' · ' + criarEtiquetaSituacao(atendimento);
    identificacao.hidden = false;
    const retornoNoCartao = (visualizacao || !ativo) && origem !== 'historico';
    const retorno = selecionarElemento('#retorno-cabecalho');
    retorno.hidden = retornoNoCartao;
    if (origem === 'historico') {
      retorno.textContent = 'Voltar ao histórico';
      retorno.href = 'atendimentos.html?paciente=' + pessoa.id_paciente;
    }
    if (somenteLeitura) {
      let titulo;
      if (visualizacao) {
        titulo = 'Resumo do atendimento';
      } else {
        if (ativo) {
          titulo = 'Consulta do histórico';
        } else {
          titulo = 'Atendimento ' + nomes[atendimento.status].toLowerCase();
        }
      }
      selecionarElemento('#titulo-proxima-etapa').textContent = titulo;
      selecionarElemento('#descricao-proxima-etapa').textContent = 'Visualização dos dados registrados neste atendimento.';
      selecionarElemento('#retorno-resumo').hidden = !retornoNoCartao;
      selecionarElemento('#proxima-etapa').hidden = false;
    } else {
      if (!triagemAtual || !consulta) {
        mostrarProximaEtapa(Boolean(triagemAtual));
      }
      if (triagemAtual) {
        selecionarElemento('#editar-triagem').hidden = false;
        selecionarElemento('#editar-triagem').href = 'triagem.html?id=' + idRegistro;
        selecionarElemento('#acoes-registros').hidden = false;
      }
    }
    if (ativo) {
      const botaoCancelar = selecionarElemento('#cancelar-atendimento');
      botaoCancelar.hidden = false;
      botaoCancelar.addEventListener('click', cancelarAtendimento);
      selecionarElemento('#acoes-registros').hidden = false;
    }
    preencherResumo(pessoa, triagemAtual, consulta);
  }
  selecionarElemento('#confirmacao-cancelamento').addEventListener('close', function (evento) {
    if (evento.currentTarget.returnValue === 'confirmar') {
      confirmarCancelamento();
    }
  });
  iniciarTela(iniciarDetalheAtendimento);
})();
