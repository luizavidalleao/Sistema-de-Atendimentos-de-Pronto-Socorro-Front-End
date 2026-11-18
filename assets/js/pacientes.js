"use strict";

// Busca e ações da lista de pacientes.
// Mantém as variáveis deste arquivo separadas das outras telas.
(function () {
  // Funções compartilhadas utilizadas nesta tela.
  const selecionarElemento = VihvaTela.selecionarElemento;
  const listarRegistros = VihvaTela.listarRegistros;
  const correspondeBusca = VihvaTela.correspondeBusca;
  const formatarData = VihvaTela.formatarData;
  const protegerTextoHtml = VihvaTela.protegerTextoHtml;
  const criarLink = VihvaTela.criarLink;
  const preencherTabela = VihvaTela.preencherTabela;
  const iniciarTela = VihvaTela.iniciarTela;

  function iniciarListaPacientes() {
    function atualizarLista() {
      const busca = selecionarElemento('#busca').value;
      const pacientesEncontrados = listarRegistros('pacientes').filter(function (pacienteAtual) {
        const camposPesquisados = [pacienteAtual.nome_completo, pacienteAtual.cpf, pacienteAtual.cidade];
        return correspondeBusca(camposPesquisados, busca);
      });
      const linhas = [];
      for (const pacienteAtual of pacientesEncontrados) {
        const localizacao = [pacienteAtual.cidade, pacienteAtual.estado].filter(Boolean).join('/');
        const botaoEditar = criarLink('paciente-form.html?id=' + pacienteAtual.id_paciente, 'Editar', true);
        const botaoHistorico = criarLink('atendimentos.html?paciente=' + pacienteAtual.id_paciente, 'Ver histórico', true);
        const acoes = '<div class="acoes-paciente">' + botaoEditar + botaoHistorico + '</div>';
        linhas.push([protegerTextoHtml(pacienteAtual.nome_completo), protegerTextoHtml(pacienteAtual.cpf || '—'), formatarData(pacienteAtual.data_nascimento), protegerTextoHtml(localizacao || '—'), acoes]);
      }
      preencherTabela(linhas);
    }
    selecionarElemento("#busca").addEventListener("input", atualizarLista);
    atualizarLista();
  }
  iniciarTela(iniciarListaPacientes);
})();
