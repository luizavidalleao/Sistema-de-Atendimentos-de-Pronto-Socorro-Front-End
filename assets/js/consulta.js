"use strict";

// Salva a consulta e encaminha para o resumo do atendimento.
// Mantém as variáveis deste arquivo separadas das outras telas.
(function () {
  // Funções compartilhadas utilizadas nesta tela.
  const repositorio = VihvaTela.repositorio;
  const selecionarElemento = VihvaTela.selecionarElemento;
  const idRegistro = VihvaTela.idRegistro;
  const aoEnviarFormulario = VihvaTela.aoEnviarFormulario;
  const navegarComAviso = VihvaTela.navegarComAviso;
  const iniciarTela = VihvaTela.iniciarTela;

  function iniciarConsulta() {
    const consulta = carregarEtapa('consultas');
    if (!consulta) {
      return;
    }
    selecionarElemento('#medicamentos').maxLength = repositorio.limiteMedicamentos;
    aoEnviarFormulario(function (dados) {
      repositorio.consulta({
        ...consulta,
        observacoes: dados.observacoes || null,
        medicamentos: dados.medicamentos || null
      });
      navegarComAviso('atendimento.html?id=' + idRegistro, 'Consulta salva e atendimento encerrado.');
    });
  }

  iniciarTela(iniciarConsulta);
})();
