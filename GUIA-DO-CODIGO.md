# Como estudar o Front do Vihva

## Comece pela tela que você vai apresentar

1. Abra o HTML: ele contém os títulos, formulários, tabelas e botões.
2. Veja os scripts no começo do HTML e abra o JavaScript da tela.
3. Localize a chamada de iniciarTela no final do script. Ela indica por onde a tela começa.
4. Siga as funções chamadas e os eventos de clique, digitação ou envio de formulário.
5. Consulte comum.js apenas quando precisar entender uma função compartilhada.

## Onde está cada parte

| Tela | HTML | JavaScript em assets/js |
| --- | --- | --- |
| Boas-vindas | index.html | Não precisa de JavaScript |
| Painel | painel.html | lista-atendimentos.js |
| Histórico | atendimentos.html | lista-atendimentos.js |
| Pacientes | pacientes.html | pacientes.js |
| Cadastro e edição de paciente | paciente-form.html | paciente-form.js |
| Abertura | novo-atendimento.html | novo-atendimento.js |
| Resumo e confirmação entre etapas | atendimento.html | atendimento.js |
| Triagem | triagem.html | etapa-clinica.js e triagem.js |
| Consulta | consulta.html | etapa-clinica.js e consulta.js |

## Padrão de escrita

- Variáveis e funções usam português e camelCase: pacienteAtual, buscarPaciente.
- Funções recebem nomes de ações: buscar, preencher, criar, mostrar, validar e iniciar.
- Condições usam if/else com chaves; funções usam function; a indentação é de dois espaços.
- Os campos dos registros mantêm nomes como id_paciente e data_nascimento, para corresponder aos formulários e aos dados. Não são variáveis abreviadas.
- Os seletores de CSS e HTML existentes foram preservados para manter o visual.
- Comentários explicam a finalidade ou uma regra importante, sem repetir cada linha.

## Recursos que aparecem nos arquivos

| Trecho | Significado |
| --- | --- |
| const | Guarda um valor que não será reatribuído |
| let | Guarda um valor que pode mudar |
| function | Agrupa passos de uma ação |
| if / else | Escolhe o que executar conforme uma condição |
| for / for...of | Repete passos para cada item |
| filter | Cria uma lista apenas com os itens que atendem à condição |
| find | Procura o primeiro item que atende à condição |
| map | Transforma cada item de uma lista |
| addEventListener | Executa uma função quando ocorre um evento |
| textContent | Preenche um texto no HTML |
| hidden | Mostra ou esconde um elemento |
| ?. | Só acessa uma propriedade se o objeto existir |
| ?? | Usa o valor à direita quando o da esquerda é null ou undefined |
| ...registro | Copia os campos de um objeto para outro |
| try / catch | Tenta uma operação e trata um erro, caso ocorra |

O bloco (function () { ... })() executa o script e mantém suas variáveis separadas das outras telas. A linha "use strict" ajuda o JavaScript a apontar alguns erros de programação.

VihvaTela reúne funções compartilhadas de comum.js. Por exemplo, selecionarElemento procura um elemento no HTML e aoEnviarFormulario prepara os dados enviados pelo formulário. VihvaRepositorio é a parte responsável por ler e salvar os registros.

## Estilos e protótipo

Os estilos estão em assets/css. style.css carrega as outras folhas; componentes.css cuida de elementos reutilizados, como botões. Imagens ficam em assets/imagens.

Os três arquivos de assets/js/prototipo simulam os dados: config.js define a chave do armazenamento, dados-demo.js cria as listas vazias e repositorio-demo.js valida e salva os registros no navegador. Esse último mantém compatibilidade com registros de versões antigas; essa parte não é a lógica visual das telas.

O protótipo ainda guarda ABERTO e EM_ANDAMENTO internamente. A função obterSituacao apresenta Triagem pendente ou Consulta pendente conforme os registros existentes. Essa regra foi preservada nesta revisão; a integração com o backend será uma mudança separada.

## Exemplo para explicar o fluxo

Na triagem, o HTML fornece os campos. etapa-clinica.js identifica o atendimento e carrega os dados existentes. triagem.js recebe o formulário, converte os sinais vitais em números, salva e abre a confirmação. O CSS controla somente a aparência.
