"use strict";

/* Repositório local substituível: nenhuma regra de apresentação ou transporte HTTP. */
(function () {
  const chave = VihvaConfig.chave;
  // Limite provisório até a definição do tamanho do VARCHAR.
  const limiteMedicamentos = 255;

  function copiarDados(valor) {
    return JSON.parse(JSON.stringify(valor));
  }
  let dados;
  try {
    const salvo = localStorage.getItem(chave);
    if (salvo) {
      dados = JSON.parse(salvo);
    } else {
      dados = VihvaCenario();
    }
    if (!Object.keys(VihvaCenario()).every(function (tabela) {
      return Array.isArray(dados[tabela]);
    })) {
      throw Error();
    }
  } catch {
    dados = VihvaCenario();
    window.VihvaAviso = 'Armazenamento indisponível ou cenário inválido. Usando cenário temporário; salve novamente para testar a persistência local.';
  }
  // Limpeza única do protótipo. Cadastros feitos depois são preservados.
  if (!dados.limpezaInicialNovembro) {
    for (const tabela of ['pacientes', 'atendimentos', 'triagens', 'consultas']) {
      dados[tabela] = [];
    }
    delete dados.medicamentos;
    delete dados.consultas_medicamentos;
    dados.limpezaInicialNovembro = true;
    try {
      localStorage.setItem(chave, JSON.stringify(dados));
    } catch {
      window.VihvaAviso = 'Não foi possível gravar a limpeza no navegador.';
    }
  }
  // Preserva registros locais anteriores, convertendo vínculos em texto.
  for (const consultaRegistrada of dados.consultas) {
    if (!Object.hasOwn(consultaRegistrada, 'medicamentos')) {
      const prescricoes = [];
      const vinculosAntigos = dados.consultas_medicamentos || [];
      const medicamentosAntigos = dados.medicamentos || [];
      for (const vinculo of vinculosAntigos) {
        if (vinculo.id_consulta !== consultaRegistrada.id_consulta) {
          continue;
        }
        const medicamento = medicamentosAntigos.find(function (item) {
          return item.id_medicamento === vinculo.id_medicamento;
        });
        if (medicamento && medicamento.nome_medicamento) {
          let prescricao = medicamento.nome_medicamento;
          if (vinculo.posologia) {
            prescricao += ' — ' + vinculo.posologia;
          }
          prescricoes.push(prescricao);
        }
      }
      consultaRegistrada.medicamentos = prescricoes.join('\n') || null;
    }
    const atendimento = dados.atendimentos.find(function (item) {
      return item.id_atendimento === consultaRegistrada.id_atendimento;
    });
    if (atendimento && ['ABERTO', 'EM_ANDAMENTO'].includes(atendimento.status)) {
      atendimento.status = 'FINALIZADO';
      // Registros antigos podem não ter a data do encerramento.
      if (atendimento.data_hora_saida === undefined || atendimento.data_hora_saida === null) {
        atendimento.data_hora_saida = null;
      }
    }
  }
  delete dados.medicamentos;
  delete dados.consultas_medicamentos;

  function salvarNoNavegador() {
    // Falha de escrita não pode ser anunciada como cadastro concluído.
    localStorage.setItem(chave, JSON.stringify(dados));
  }

  function obterCampoId(tabela) {
    return {
      pacientes: 'id_paciente',
      atendimentos: 'id_atendimento',
      triagens: 'id_triagem',
      consultas: 'id_consulta'
    }[tabela];
  }

  function existeRegistro(tabela, nomeCampo, valor) {
    return dados[tabela].some(function (registroExistente) {
      return registroExistente[nomeCampo] === valor;
    });
  }

  function validarRegistro(tabela, registro) {
    function exigirCondicao(valor, mensagem) {
      if (!valor) {
        throw Error(mensagem);
      }
    }
    function validarTexto(nomeCampo, limite, obrigatorio = false) {
      if (obrigatorio) {
        exigirCondicao(typeof registro[nomeCampo] === 'string' && registro[nomeCampo].trim(), 'Preencha ' + nomeCampo + '.');
      }
      if (registro[nomeCampo] != null && (typeof registro[nomeCampo] !== 'string' || registro[nomeCampo].length > limite)) {
        throw Error('Campo inválido: ' + nomeCampo);
      }
    }
    if (tabela === 'pacientes') {
      validarTexto('nome_completo', 200, true);
      // Primeiro verifica o formato; depois confere se a data realmente existe.
      const nascimento = registro.data_nascimento;
      const formatoCorreto = /^\d{4}-\d{2}-\d{2}$/.test(nascimento);
      exigirCondicao(formatoCorreto, 'Data de nascimento inválida.');
      const anoValido = Number(nascimento.slice(0, 4)) >= 1000;
      const dataInterpretada = Date.parse(nascimento);
      exigirCondicao(anoValido && !isNaN(dataInterpretada), 'Data de nascimento inválida.');
      const dataConferida = new Date(nascimento).toISOString().slice(0, 10);
      exigirCondicao(dataConferida === nascimento, 'Data de nascimento inválida.');
      for (const [nomeCampo, limite] of Object.entries({
        cpf: 11,
        rg: 20,
        nome_pai: 200,
        nome_mae: 200,
        logradouro: 150,
        numero: 10,
        bairro: 100,
        cidade: 100,
        estado: 2,
        cep: 8
      })) {
        validarTexto(nomeCampo, limite);
      }
      if (registro.cpf && dados.pacientes.some(function (registroExistente) {
        return registroExistente.cpf === registro.cpf && registroExistente.id_paciente !== registro.id_paciente;
      })) {
        throw Error('CPF já cadastrado.');
      }
    }
    if (tabela === 'atendimentos') {
      exigirCondicao(existeRegistro('pacientes', 'id_paciente', registro.id_paciente), 'Paciente não encontrado.');
      exigirCondicao(['ABERTO', 'EM_ANDAMENTO', 'FINALIZADO', 'CANCELADO'].includes(registro.status), 'Status inválido.');
    }
    if (['triagens', 'consultas'].includes(tabela)) {
      exigirCondicao(existeRegistro('atendimentos', 'id_atendimento', registro.id_atendimento), 'Atendimento não encontrado.');
      if (dados[tabela].some(function (registroExistente) {
        return registroExistente.id_atendimento === registro.id_atendimento && registroExistente[obterCampoId(tabela)] !== registro[obterCampoId(tabela)];
      })) {
        throw Error('Este atendimento já possui ' + tabela + '.');
      }
      if (tabela === 'triagens') {
        exigirCondicao(['VERMELHO', 'LARANJA', 'AMARELO', 'VERDE', 'AZUL'].includes(registro.classificacao_manchester), 'Selecione uma classificação.');
        for (const nomeCampo of ['pressao_sistolica', 'pressao_diastolica', 'batimentos_cardiacos']) {
          if (registro[nomeCampo] != null && (!Number.isInteger(registro[nomeCampo]) || registro[nomeCampo] < 0 || registro[nomeCampo] > 65535)) {
            throw Error('Valor inválido: ' + nomeCampo);
          }
        }
        if (registro.temperatura != null) {
          const temperatura = registro.temperatura;
          const numeroValido = Number.isFinite(temperatura);
          const dentroDoLimite = Math.abs(temperatura) <= 999.9;
          // O banco permite uma casa decimal. A tolerância evita erros de arredondamento.
          const diferencaDecimal = Math.abs(temperatura * 10 - Math.round(temperatura * 10));
          const umaCasaDecimal = diferencaDecimal <= 1e-8;
          if (!numeroValido || !dentroDoLimite || !umaCasaDecimal) {
            throw Error('Temperatura inválida.');
          }
        }
      }
      let campo;
      if (tabela === 'triagens') {
        campo = 'queixas';
      } else {
        campo = 'observacoes';
      }
      if (registro[campo] != null && new TextEncoder().encode(registro[campo]).length > 65535) {
        throw Error('Texto excede o limite de armazenamento.');
      }
    }
  }
  // Só confirma a alteração se a gravação funcionar; caso contrário, desfaz a mudança.

  function executarTransacao(acao) {
    const anterior = copiarDados(dados);
    try {
      const resultado = acao();
      salvarNoNavegador();
      return copiarDados(resultado ?? null);
    } catch (erro) {
      dados = anterior;
      throw erro;
    }
  }

  function gravarRegistro(tabela, registro) {
    const registroAtual = copiarDados(registro);
    const campo = obterCampoId(tabela);
    if (!campo) {
      throw Error('Entidade inválida.');
    }
    if (!registroAtual[campo]) {
      registroAtual[campo] = Math.max(0, ...dados[tabela].map(function (registroExistente) {
        return registroExistente[campo];
      })) + 1;
    }
    // Ao editar um paciente, um campo vazio mantém o valor que já estava salvo.
    const anterior = dados[tabela].find(function (registroExistente) {
      return registroExistente[campo] === registroAtual[campo];
    });
    if (tabela === 'pacientes' && anterior) {
      for (const nomeCampo of Object.keys(registroAtual)) {
        if (registroAtual[nomeCampo] === null) {
          registroAtual[nomeCampo] = anterior[nomeCampo] ?? null;
        }
      }
    }
    validarRegistro(tabela, registroAtual);
    const indice = dados[tabela].findIndex(function (registroExistente) {
      return registroExistente[campo] === registroAtual[campo];
    });
    if (indice < 0) {
      dados[tabela].push(registroAtual);
    } else {
      dados[tabela][indice] = registroAtual;
    }
    return registroAtual;
  }

  window.VihvaRepositorio = {
    listar: function (tabela) {
      return copiarDados(dados[tabela]);
    },
    obter: function (tabela, id) {
      return copiarDados(dados[tabela].find(function (registroExistente) {
        return registroExistente[obterCampoId(tabela)] === id;
      }) ?? null);
    },
    salvar: function (tabela, registro) {
      return executarTransacao(function () {
        return gravarRegistro(tabela, registro);
      });
    },
    limiteMedicamentos,
    consulta: function (registro) {
      return executarTransacao(function () {
        const atendimento = dados.atendimentos.find(function (atendimento) {
          return atendimento.id_atendimento === registro.id_atendimento;
        });
        if (!atendimento || !['ABERTO', 'EM_ANDAMENTO'].includes(atendimento.status)) {
          throw Error('O atendimento não está ativo.');
        }
        if (!existeRegistro('triagens', 'id_atendimento', atendimento.id_atendimento)) {
          throw Error('Registre a triagem antes da consulta.');
        }
        if (registro.medicamentos != null && (typeof registro.medicamentos !== 'string' || registro.medicamentos.length > limiteMedicamentos)) {
          throw Error('Informe até ' + limiteMedicamentos + ' caracteres em Medicamentos.');
        }
        const consulta = gravarRegistro('consultas', registro);
        gravarRegistro('atendimentos', {
          ...atendimento,
          status: 'FINALIZADO',
          data_hora_saida: new Date().toISOString()
        });
        return consulta;
      });
    },
    reiniciar: function () {
      return executarTransacao(function () {
        dados = VihvaCenario();
      });
    }
  };
})();
