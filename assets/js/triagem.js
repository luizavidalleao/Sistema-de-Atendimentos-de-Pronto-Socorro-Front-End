"use strict";

// Salva os sinais vitais, as queixas e a classificação escolhida.
// Mantém as variáveis deste arquivo separadas das outras telas.
(function () {
  // Funções compartilhadas utilizadas nesta tela.
  const repositorio = VihvaTela.repositorio;
  const idRegistro = VihvaTela.idRegistro;
  const aoEnviarFormulario = VihvaTela.aoEnviarFormulario;
  const iniciarTela = VihvaTela.iniciarTela;

  function iniciarTriagem() {
    const triagem = carregarEtapa('triagens');
    if (!triagem) {
      return;
    }
    aoEnviarFormulario(function (dados) {
      const sinaisVitais = ['pressao_sistolica', 'pressao_diastolica', 'temperatura', 'batimentos_cardiacos'];
      for (const campo of sinaisVitais) {
        if (dados[campo] === '') {
          dados[campo] = null;
        } else {
          dados[campo] = Number(dados[campo]);
        }
      }
      repositorio.salvar('triagens', {
        ...triagem,
        ...dados
      });
      location.href = 'atendimento.html?id=' + idRegistro + '&origem=triagem';
    });
  }

  iniciarTela(iniciarTriagem);
})();
