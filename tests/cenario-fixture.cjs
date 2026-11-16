/* Cenário fictício centralizado. Campos seguem o schema do Vihva. */
module.exports = () => {
  const hoje = new Date();
  const horario = h => new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), h).toISOString();
  return {
    pacientes: [
      {id_paciente:1,nome_completo:'Maria Aparecida Souza',data_nascimento:'1984-03-12',cpf:null,cidade:'São Paulo',estado:'SP'},
      {id_paciente:2,nome_completo:'João Pedro Almeida',data_nascimento:'2015-07-22',cpf:null,cidade:'Guarulhos',estado:'SP'},
      {id_paciente:3,nome_completo:'Antônio Ferreira Lima',data_nascimento:'1951-11-02',cpf:null,cidade:'Osasco',estado:'SP'},
      {id_paciente:4,nome_completo:'Carla Mendes Rocha',data_nascimento:'1990-01-15',cpf:null,cidade:'São Paulo',estado:'SP'}
    ],
    atendimentos: [
      {id_atendimento:1,id_paciente:3,data_hora_chegada:horario(8),data_hora_saida:null,status:'ABERTO'},
      {id_atendimento:2,id_paciente:2,data_hora_chegada:horario(9),data_hora_saida:null,status:'EM_ANDAMENTO'},
      {id_atendimento:3,id_paciente:1,data_hora_chegada:horario(10),data_hora_saida:horario(11),status:'FINALIZADO'},
      {id_atendimento:4,id_paciente:4,data_hora_chegada:horario(7),data_hora_saida:horario(8),status:'FINALIZADO'}
    ],
    triagens: [{id_triagem:1,id_atendimento:2,classificacao_manchester:'VERDE',queixas:'Registro fictício para demonstração.'},{id_triagem:2,id_atendimento:3,classificacao_manchester:'AMARELO',queixas:'Registro fictício para demonstração.'}],
    consultas: [{id_consulta:1,id_atendimento:3,observacoes:'Exemplo de registro, sem orientação clínica.',medicamentos:null}],
    usuarios: [{id_usuario:1,nome_completo:'Equipe de demonstração',email:'equipe@example.com'}],
    confirmacoes_demo: []
  };
};
