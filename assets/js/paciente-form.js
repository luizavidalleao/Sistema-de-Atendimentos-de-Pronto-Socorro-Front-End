"use strict";

// Preenche e salva o formulário de cadastro ou edição de paciente.
// Mantém as variáveis deste arquivo separadas das outras telas.
(function () {
  // Funções compartilhadas utilizadas nesta tela.
  const repositorio = VihvaTela.repositorio;
  const selecionarElemento = VihvaTela.selecionarElemento;
  const parametrosDaPagina = VihvaTela.parametrosDaPagina;
  const buscarRegistroDaPagina = VihvaTela.buscarRegistroDaPagina;
  const marcarEtapas = VihvaTela.marcarEtapas;
  const aoEnviarFormulario = VihvaTela.aoEnviarFormulario;
  const navegarComAviso = VihvaTela.navegarComAviso;
  const iniciarTela = VihvaTela.iniciarTela;

  function iniciarFormularioPaciente() {
    let pacienteAtual = {};
    if (parametrosDaPagina.has('id')) {
      pacienteAtual = buscarRegistroDaPagina('pacientes');
    }
    const chegada = parametrosDaPagina.get('origem') === 'chegada' && !pacienteAtual.id_paciente;
    if (!pacienteAtual.id_paciente && !chegada) {
      location.replace('novo-atendimento.html');
      return;
    }
    if (chegada) {
      selecionarElemento('#titulo-pagina').textContent = 'Novo paciente';
    } else {
      selecionarElemento('#titulo-pagina').textContent = 'Editar paciente';
    }
    selecionarElemento('#orientacao-cadastro').hidden = !chegada;
    if (chegada) {
      marcarEtapas(null, false);
    }
    if (chegada) {
      selecionarElemento('#cancelar').href = 'novo-atendimento.html';
    } else {
      selecionarElemento('#cancelar').href = 'pacientes.html';
    }
    if (chegada) {
      selecionarElemento('#form button[type="submit"]').textContent = 'Salvar e continuar';
    } else {
      selecionarElemento('#form button[type="submit"]').textContent = 'Salvar paciente';
    }
    for (const campo of selecionarElemento('#form').querySelectorAll('input[name]')) {
      campo.value = pacienteAtual[campo.name] ?? '';
    }
    aoEnviarFormulario(function (dados) {
      const campos = {};
      for (const nome in dados) {
        campos[nome] = dados[nome] || null;
      }
      const salvo = repositorio.salvar('pacientes', {
        ...pacienteAtual,
        ...campos
      });
      if (chegada) {
        navegarComAviso('novo-atendimento.html?paciente=' + salvo.id_paciente, 'Paciente cadastrado. Agora abra o atendimento.');
      } else {
        navegarComAviso('pacientes.html', 'Paciente salvo.');
      }
    });
  }
  iniciarTela(iniciarFormularioPaciente);
})();
