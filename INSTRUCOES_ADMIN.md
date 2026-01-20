# Como Cadastrar o Usuário Administrador

## Passo 1: Criar o usuário no Firebase Authentication

1. Acesse o [Console do Firebase](https://console.firebase.google.com/)
2. Selecione seu projeto
3. Vá em **Authentication** no menu lateral
4. Clique na aba **Users**
5. Clique em **Add user**
6. Preencha:
   - **Email**: seu-email-admin@exemplo.com
   - **Password**: Uma senha forte (mínimo 6 caracteres)
7. Clique em **Add user**
8. **IMPORTANTE**: Copie o **User UID** que aparece na lista (ex: `abc123def456...`)

## Passo 2: Adicionar o documento na coleção "admins"

1. No Console do Firebase, vá em **Firestore Database** no menu lateral
2. Clique em **Start collection** (se for a primeira vez) ou em **+ Start collection**
3. Digite o nome da coleção: `admins`
4. Clique em **Next**

### Configuração do Documento:

- **Document ID**: Cole aqui o **User UID** que você copiou no Passo 1
- **Field**: `isAdmin`
- **Type**: `boolean`
- **Value**: `true` (marque a caixinha)

5. Clique em **+ Add field** para adicionar mais informações (opcional):
   - **Field**: `email`
   - **Type**: `string`
   - **Value**: seu-email-admin@exemplo.com
   
   - **Field**: `nome`
   - **Type**: `string`
   - **Value**: Nome do Administrador

6. Clique em **Save**

## Estrutura Final no Firestore

```
Collection: admins
└── Document: [USER_UID_DO_AUTHENTICATION]
    ├── isAdmin: true (boolean)
    ├── email: "seu-email@exemplo.com" (string) [opcional]
    └── nome: "Nome Admin" (string) [opcional]
```

## Importante

- Apenas usuários com `isAdmin: true` na coleção `admins` poderão acessar o dashboard
- O Document ID **DEVE SER EXATAMENTE IGUAL** ao User UID do Firebase Authentication
- Sem esse documento, mesmo com login e senha corretos, o acesso será negado

## Testando

1. Acesse: `http://localhost:5173/portal-interno`
2. Faça login com o email e senha cadastrados
3. Se tudo estiver correto, você será redirecionado para `/admin-dashboard`
4. Se aparecer "Acesso negado", verifique se:
   - O Document ID é igual ao User UID
   - O campo `isAdmin` está marcado como `true` (boolean)

## Segurança

⚠️ **NUNCA compartilhe essas credenciais**
⚠️ **Use uma senha forte e única**
⚠️ **Mantenha o acesso ao Firebase Console restrito**
