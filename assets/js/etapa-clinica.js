"use strict";

// Carrega o atendimento e preenche os campos das duas etapas clínicas.
// Mantém as variáveis deste arquivo separadas das outras telas.
(function () {
  // Funções compartilhadas utilizadas nesta tela.
  const selecionarElemento = VihvaTela.selecionarElemento;
  const idRegistro = VihvaTela.idRegistro;
  const buscarRegistroDaPagina = VihvaTela.buscarRegistroDaPagina;
  const atendimentoAtivo = VihvaTela.atendimentoAtivo;
  const buscarTriagem = VihvaTela.buscarTriagem;
  const listarRegistros = VihvaTela.listarRegistros;
  const buscarPaciente = VihvaTela.buscarPaciente;
  const marcarEtapas = VihvaTela.marcarEtapas;

  function carregarEtapa(tipo) {
    const atendimento = buscarRegistroDaPagina('atendimentos');
    const consultaSemTriagem = tipo === 'consultas' && !buscarTriagem(idRegistro);
    if (!atendimentoAtivo(atendimento) || consultaSemTriagem) {
      location.replace('atendimento.html?id=' + idRegistro);
      return null;
    }
    const pessoa = buscarPaciente(atendimento.id_paciente);
    // Procura os dados já salvos. Se não houver, mantém um registro vazio.
    let registroAtual = {
      id_atendimento: idRegistro
    };
    for (const registroSalvo of listarRegistros(tipo)) {
      if (registroSalvo.id_atendimento === idRegistro) {
        registroAtual = registroSalvo;
        break;
      }
    }
    selecionarElemento('.contexto-paciente').textContent = pessoa.nome_completo + ' · Atendimento #' + idRegistro;
    selecionarElemento('#cancelar').href = 'atendimento.html?id=' + idRegistro;
    marcarEtapas(atendimento);
    for (const campo of selecionarElemento('#form').querySelectorAll('[name]')) {
      const valorSalvo = registroAtual[campo.name];
      if (campo.type === 'radio') {
        campo.checked = campo.value === valorSalvo;
      } else if (valorSalvo === null || valorSalvo === undefined) {
        campo.value = '';
      } else {
        campo.value = valorSalvo;
      }
    }
    return registroAtual;
  }

  window.carregarEtapa = carregarEtapa;
})();
