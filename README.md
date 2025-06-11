# PublicManagementOS

Esta aplicação Web simula um ambiente de trabalho completo (WebOS)
voltado para gestão pública. Os dados são salvos por padrão no
`localStorage` do navegador.

## Uso do GitHub como repositório de dados

Ao abrir a página, será exibida uma tela de login solicitando o repositório e o token pessoal do GitHub. As credenciais ficam salvas no navegador, permitindo que cada usuário utilize o seu próprio repositório. Um botão "Limpar dados" possibilita remover essas informações a qualquer momento.

É possível sincronizar o sistema de arquivos virtual com um
repositório do GitHub. Edite o arquivo `index.html` e localize o bloco
`GITHUB_STORAGE`. Altere as opções conforme o exemplo abaixo:

```javascript
const GITHUB_STORAGE = {
    enabled: true,
    repo: 'usuario/repositorio',      // Ex.: "minhaConta/meuRepo"
    filePath: 'dados/fs.json',        // Caminho do arquivo no repositório
    token: 'seu_token_pessoal'        // Necessário para salvar alterações
};
```

Quando `enabled` estiver como `true`, o WebOS tentará carregar e salvar
o sistema de arquivos no GitHub utilizando a API. Caso o arquivo ainda
não exista, ele será criado automaticamente na primeira gravação.
