"use strict";

// Funções usadas por várias telas: formulário, navegação e dados de atendimento.
// Mantém as variáveis deste arquivo separadas das outras telas.
(function () {
  const repositorio = VihvaRepositorio;
  // Procura um elemento do HTML, por exemplo: selecionarElemento('#form').

  function selecionarElemento(seletor) {
    return document.querySelector(seletor);
  }
  const parametrosDaPagina = new URLSearchParams(location.search);
  const idRegistro = Number(parametrosDaPagina.get('id'));
  const nomes = {
    ABERTO: 'Aberto',
    EM_ANDAMENTO: 'Em andamento',
    FINALIZADO: 'Finalizado',
    CANCELADO: 'Cancelado',
    VERMELHO: 'Vermelho',
    LARANJA: 'Laranja',
    AMARELO: 'Amarelo',
    VERDE: 'Verde',
    AZUL: 'Azul'
  };
  const cores = ['VERMELHO', 'LARANJA', 'AMARELO', 'VERDE', 'AZUL'];

  // Protege os valores que precisam ser inseridos nas linhas geradas em HTML.

  function protegerTextoHtml(valor) {
    const entidades = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    };
    return String(valor ?? '').replace(/[&<>"']/g, function (caractere) {
      return entidades[caractere];
    });
  }

  function formatarData(valor) {
    if (!valor) {
      return '—';
    }
    const somenteData = valor.length === 10;
    let horario;
    if (somenteData) {
      horario = valor + 'T12:00:00';
    } else {
      horario = valor;
    }
    let formato;
    if (somenteData) {
      formato = {
        dateStyle: 'short'
      };
    } else {
      formato = {
        dateStyle: 'short',
        timeStyle: 'short'
      };
    }
    return new Date(horario).toLocaleString('pt-BR', formato);
  }

  function criarLink(href, texto, secundario = false) {
    let classes;
    if (secundario) {
      classes = 'btn btn-ghost btn-small';
    } else {
      classes = 'btn btn-small';
    }
    return '<a class="' + classes + '" href="' + href + '">' + texto + '</a>';
  }

  function criarEtiqueta(valor) {
    let classe;
    if (valor === 'EM_ANDAMENTO') {
      classe = 'andamento';
    } else {
      classe = (valor || 'aberto').toLowerCase();
    }
    return '<span class="badge ' + classe + '">' + protegerTextoHtml(nomes[valor] || 'Sem triagem') + '</span>';
  }

  function criarCartao(titulo, conteudo) {
    return '<section class="card"><h2>' + titulo + '</h2>' + conteudo + '</section>';
  }

  function mostrarAviso(mensagem, erro = false) {
    const elemento = selecionarElemento('#mensagem');
    elemento.textContent = mensagem;
    if (erro) {
      elemento.className = 'alert erro';
    } else {
      elemento.className = 'alert ok';
    }
    elemento.hidden = false;
    elemento.focus();
  }

  function executarComTratamentoDeErro(acao) {
    try {
      acao();
    } catch (erro) {
      let mensagem;
      if (erro.name === 'QuotaExceededError') {
        mensagem = 'Sem espaço para salvar a demonstração neste navegador.';
      } else {
        mensagem = erro.message;
      }
      mostrarAviso(mensagem, true);
    }
  }

  function aoEnviarFormulario(salvar) {
    selecionarElemento('#form').addEventListener('submit', function (evento) {
      evento.preventDefault();
      executarComTratamentoDeErro(function () {
        const campos = new FormData(evento.currentTarget);
        // Reúne os campos e remove espaços extras nas pontas do texto.
        const dados = {};
        for (const [nome, valor] of campos) {
          dados[nome] = valor.trim();
        }
        salvar(dados);
      });
    });
  }

  function navegarComAviso(url, mensagem = 'Alterações salvas.') {
    sessionStorage.setItem('vihva.demo.aviso', mensagem);
    location.href = url;
  }

  function listarRegistros(tabela) {
    return repositorio.listar(tabela);
  }

  function buscarPaciente(idPaciente) {
    return repositorio.obter('pacientes', idPaciente);
  }

  function buscarTriagem(idAtendimento) {
    for (const registro of listarRegistros('triagens')) {
      if (registro.id_atendimento === idAtendimento) {
        return registro;
      }
    }
  }

  function buscarRegistroDaPagina(tabela) {
    if (!Number.isInteger(idRegistro) || idRegistro < 1) {
      throw Error('Selecione um registro na listagem.');
    }
    const encontrado = repositorio.obter(tabela, idRegistro);
    if (!encontrado) {
      throw Error('Registro não encontrado. Volte à listagem.');
    }
    return encontrado;
  }

  function normalizarTexto(valor) {
    return String(valor ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  }

  function correspondeBusca(valores, busca) {
    const termo = normalizarTexto(busca);
    return valores.some(function (valor) {
      return normalizarTexto(valor).includes(termo);
    });
  }

  // A fila deriva um único status dos registros já feitos.

  function atendimentoAtivo(atendimento) {
    return atendimento.status === 'ABERTO' || atendimento.status === 'EM_ANDAMENTO';
  }

  function buscarConsulta(id) {
    return listarRegistros('consultas').find(function (consultaRegistrada) {
      return consultaRegistrada.id_atendimento === id;
    });
  }
  const statusFila = {
    TRIAGEM_PENDENTE: 'Triagem pendente',
    CONSULTA_PENDENTE: 'Consulta pendente'
  };

  function obterSituacao(atendimento) {
    if (!atendimentoAtivo(atendimento)) {
      return atendimento.status;
    }
    if (buscarTriagem(atendimento.id_atendimento)) {
      return 'CONSULTA_PENDENTE';
    }
    return 'TRIAGEM_PENDENTE';
  }

  function criarEtiquetaSituacao(atendimento) {
    if (!atendimentoAtivo(atendimento)) {
      return criarEtiqueta(atendimento.status);
    }
    let classe = 'aberto';
    if (buscarTriagem(atendimento.id_atendimento)) {
      classe = 'andamento';
    }
    const texto = statusFila[obterSituacao(atendimento)];
    return '<span class="badge ' + classe + '">' + texto + '</span>';
  }

  function marcarEtapas(atendimento = null, cadastroConcluido = true, entreEtapas = false) {
    const triagemRegistrada = atendimento && buscarTriagem(atendimento.id_atendimento);
    const consultaRegistrada = atendimento && buscarConsulta(atendimento.id_atendimento);
    const encerrado = atendimento && !atendimentoAtivo(atendimento);
    const feitos = [cadastroConcluido, Boolean(atendimento), Boolean(triagemRegistrada), Boolean(consultaRegistrada), Boolean(encerrado)];
    let atual;
    if (encerrado || entreEtapas) {
      atual = -1;
    } else {
      atual = feitos.findIndex(function (valor) {
        return !valor;
      });
    }
    document.querySelectorAll(".fluxo-paciente li").forEach(function (etapa, indice) {
      etapa.classList.toggle("concluida", feitos[indice]);
      etapa.classList.toggle("atual", indice === atual);
      if (indice === atual) {
        etapa.setAttribute("aria-current", "step");
      } else {
        etapa.removeAttribute("aria-current");
      }
    });
  }
  // O cabeçalho está no HTML; aqui montamos as linhas com os dados salvos.

  function preencherTabela(linhas, vazio = 'Nenhum registro encontrado.') {
    const titulos = [];
    for (const coluna of document.querySelectorAll('#lista th')) {
      titulos.push(coluna.textContent);
    }
    let conteudo = '';
    if (linhas.length === 0) {
      conteudo = '<tr class="listagem-vazia" role="row"><td role="cell" colspan="' + titulos.length + '">' + protegerTextoHtml(vazio) + '</td></tr>';
    } else {
      for (const linha of linhas) {
        conteudo += '<tr role="row">';
        for (let indice = 0; indice < linha.length; indice++) {
          // O rótulo identifica cada coluna também na versão para celular.
          conteudo += '<td role="cell"><span class="rotulo-celula" aria-hidden="true">' + protegerTextoHtml(titulos[indice]) + '</span><div class="valor-celula">' + linha[indice] + '</div></td>';
        }
        conteudo += '</tr>';
      }
    }
    selecionarElemento('#lista tbody').innerHTML = conteudo;
  }

  function adicionarOpcoes(campo, opcoes) {
    for (const [valor, texto] of opcoes) {
      campo.add(new Option(texto, valor));
    }
  }

  function iniciarTela(iniciar) {
    executarComTratamentoDeErro(function () {
      iniciar();
      if (window.VihvaAviso) {
        mostrarAviso(window.VihvaAviso, true);
      }
      const mensagem = sessionStorage.getItem("vihva.demo.aviso");
      if (mensagem) {
        sessionStorage.removeItem("vihva.demo.aviso");
        mostrarAviso(mensagem);
      }
    });
  }
  selecionarElemento(".menu-toggle").addEventListener("click", function (evento) {
    const botao = evento.currentTarget;
    const aberto = botao.getAttribute("aria-expanded") !== "true";
    botao.setAttribute("aria-expanded", String(aberto));
    selecionarElemento("#menu").classList.toggle("expandido", aberto);
  });
  window.VihvaTela = {
    repositorio,
    selecionarElemento,
    parametrosDaPagina,
    idRegistro,
    protegerTextoHtml,
    nomes,
    cores,
    formatarData,
    criarLink,
    criarCartao,
    aoEnviarFormulario,
    navegarComAviso,
    listarRegistros,
    buscarPaciente,
    buscarTriagem,
    buscarRegistroDaPagina,
    correspondeBusca,
    atendimentoAtivo,
    buscarConsulta,
    obterSituacao,
    criarEtiqueta,
    criarEtiquetaSituacao,
    marcarEtapas,
    preencherTabela,
    adicionarOpcoes,
    iniciarTela,
    executarComTratamentoDeErro
  };
})();
