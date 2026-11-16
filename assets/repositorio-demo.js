/* Repositório local substituível: nenhuma regra de apresentação ou transporte HTTP. */
(() => {
  const chave = VihvaConfig.chave;
  // Limite provisório até a definição do tamanho do VARCHAR.
  const limiteMedicamentos = 255;
  const copiar = valor => JSON.parse(JSON.stringify(valor));
  let dados;
  try {
    const salvo = localStorage.getItem(chave);
    dados = salvo ? JSON.parse(salvo) : VihvaCenario();
    if (!Object.keys(VihvaCenario()).every(t => Array.isArray(dados[t]))) throw Error();
  } catch { dados = VihvaCenario(); window.VihvaAviso = 'Armazenamento indisponível ou cenário inválido. Usando cenário temporário; salve novamente para testar a persistência local.'; }
  // Limpeza única do protótipo. Cadastros feitos depois são preservados.
  if (!dados.limpezaInicialNovembro) {
    for (const tabela of ['pacientes', 'atendimentos', 'triagens', 'consultas']) dados[tabela] = [];
    delete dados.medicamentos;
    delete dados.consultas_medicamentos;
    dados.limpezaInicialNovembro = true;
    try { localStorage.setItem(chave, JSON.stringify(dados)); }
    catch { window.VihvaAviso = 'Não foi possível gravar a limpeza no navegador.'; }
  }
  // Preserva registros locais anteriores, convertendo vínculos em texto.
  for (const c of dados.consultas) {
    if (!Object.hasOwn(c, 'medicamentos')) {
      c.medicamentos = (dados.consultas_medicamentos || []).filter(m => m.id_consulta === c.id_consulta)
        .map(m => {
          const nome = (dados.medicamentos || []).find(item => item.id_medicamento === m.id_medicamento)?.nome_medicamento;
          return nome ? [nome, m.posologia].filter(Boolean).join(' — ') : '';
        }).filter(Boolean).join('\n') || null;
    }
    const a = dados.atendimentos.find(a => a.id_atendimento === c.id_atendimento);
    if (a && ['ABERTO','EM_ANDAMENTO'].includes(a.status)) {
      a.status = 'FINALIZADO';
      a.data_hora_saida ??= null; // O cenário anterior não registrava a data real do encerramento.
    }
  }
  delete dados.medicamentos;
  delete dados.consultas_medicamentos;
  const salvar = () => {
    // Falha de escrita não pode ser anunciada como cadastro concluído.
    localStorage.setItem(chave, JSON.stringify(dados));
  };
  const idCampo = tabela => ({pacientes:'id_paciente',atendimentos:'id_atendimento',triagens:'id_triagem',consultas:'id_consulta',usuarios:'id_usuario'})[tabela];
  const existe = (t,c,v) => dados[t].some(x => x[c] === v);
  function validar(t,r) {
    const obrigar = (v,m) => {if (!v) throw Error(m);};
    const texto = (c,n,req=false) => {
      if (req) obrigar(typeof r[c]==='string' && r[c].trim(), 'Preencha '+c+'.');
      if (r[c]!=null && (typeof r[c]!=='string' || r[c].length>n)) throw Error('Campo inválido: '+c);
    };
    if (t==='pacientes') {
      texto('nome_completo',200,true);
      obrigar(/^\d{4}-\d{2}-\d{2}$/.test(r.data_nascimento) && Number(r.data_nascimento.slice(0,4))>=1000 && !isNaN(Date.parse(r.data_nascimento)) && new Date(r.data_nascimento).toISOString().slice(0,10)===r.data_nascimento,'Data de nascimento inválida.');
      for (const [c,n] of Object.entries({cpf:11,rg:20,nome_pai:200,nome_mae:200,logradouro:150,numero:10,bairro:100,cidade:100,estado:2,cep:8})) texto(c,n);
      if (r.cpf && dados.pacientes.some(x=>x.cpf===r.cpf && x.id_paciente!==r.id_paciente)) throw Error('CPF já cadastrado.');
    }
    if (t==='usuarios') {
      texto('nome_completo',150,true); texto('email',100,true);
      obrigar(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.email),'E-mail inválido.');
      if(dados.usuarios.some(x=>x.email.toLowerCase()===r.email.toLowerCase() && x.id_usuario!==r.id_usuario)) throw Error('E-mail já cadastrado.');
    }
    if(t==='atendimentos') {
      obrigar(existe('pacientes','id_paciente',r.id_paciente),'Paciente não encontrado.');
      obrigar(['ABERTO','EM_ANDAMENTO','FINALIZADO','CANCELADO'].includes(r.status),'Status inválido.');
    }
    if(['triagens','consultas'].includes(t)) {
      obrigar(existe('atendimentos','id_atendimento',r.id_atendimento),'Atendimento não encontrado.');
      if(dados[t].some(x=>x.id_atendimento===r.id_atendimento && x[idCampo(t)]!==r[idCampo(t)])) throw Error('Este atendimento já possui '+t+'.');
      if(t==='triagens') {
        obrigar(['VERMELHO','LARANJA','AMARELO','VERDE','AZUL'].includes(r.classificacao_manchester),'Selecione uma classificação.');
        for(const c of ['pressao_sistolica','pressao_diastolica','batimentos_cardiacos']) if(r[c]!=null && (!Number.isInteger(r[c]) || r[c]<0 || r[c]>65535)) throw Error('Valor inválido: '+c);
        if(r.temperatura!=null && (!Number.isFinite(r.temperatura) || Math.abs(r.temperatura)>999.9 || Math.abs(r.temperatura*10-Math.round(r.temperatura*10))>1e-8)) throw Error('Temperatura inválida.');
      }
      const campo = t==='triagens'?'queixas':'observacoes';
      if(r[campo]!=null && new TextEncoder().encode(r[campo]).length>65535) throw Error('Texto excede o limite de armazenamento.');
    }
  }
  function transacao(acao) {
    const anterior=copiar(dados);
    try {const resultado=acao(); salvar(); return copiar(resultado ?? null);}
    catch(e) {dados=anterior; throw e;}
  }
  function gravar(t,registro) {
    const r=copiar(registro), campo=idCampo(t);
    if(!campo) throw Error('Entidade inválida.');
    if(!r[campo]) r[campo]=Math.max(0,...dados[t].map(x=>x[campo]))+1;
    // O PATCH de pacientes usa COALESCE: null mantém o valor anterior.
    const anterior=dados[t].find(x=>x[campo]===r[campo]);
    if(t==='pacientes' && anterior) {
      for(const c of Object.keys(r)) if(r[c]===null) r[c]=anterior[c]??null;
    }
    validar(t,r);
    const i=dados[t].findIndex(x=>x[campo]===r[campo]);
    if(i<0) dados[t].push(r); else dados[t][i]=r;
    return r;
  }
  window.VihvaRepositorio = {
    listar: t => copiar(dados[t]),
    obter: (t,id) => copiar(dados[t].find(x=>x[idCampo(t)]===id) ?? null),
    salvar: (t,r) => transacao(()=>gravar(t,r)),
    limiteMedicamentos,
    consulta: r => transacao(() => {
      const a = dados.atendimentos.find(a => a.id_atendimento === r.id_atendimento);
      if (!a || !['ABERTO','EM_ANDAMENTO'].includes(a.status)) throw Error('O atendimento não está ativo.');
      if (!existe('triagens','id_atendimento',a.id_atendimento)) throw Error('Registre a triagem antes da consulta.');
      if (r.medicamentos != null && (typeof r.medicamentos !== 'string' || r.medicamentos.length > limiteMedicamentos)) {
        throw Error('Informe até ' + limiteMedicamentos + ' caracteres em Medicamentos.');
      }
      const consulta = gravar('consultas', r);
      gravar('atendimentos', {...a, status:'FINALIZADO', data_hora_saida:new Date().toISOString()});
      return consulta;
    }),
    cadastrarUsuario: r => transacao(()=> {
      const u=gravar('usuarios',r);
      dados.confirmacoes_demo.push({id_usuario:u.id_usuario,confirmado:false});
      return u;
    }),
    confirmar: id => transacao(()=> {
      const c=dados.confirmacoes_demo.find(x=>x.id_usuario===id);
      if(!c) throw Error('Nenhum cadastro de demonstração pendente.');
      if(c.confirmado) throw Error('Demonstração já confirmada.');
      c.confirmado=true;
    }),
    reiniciar: () => transacao(()=> {dados=VihvaCenario();})
  };
})();
