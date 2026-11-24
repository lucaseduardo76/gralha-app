# gralha-app

App mobile do **GralhaFit** (React Native + Expo + TypeScript), cliente do backend `gralha-back`.
Plano completo: `gralha-back/memoria/planos/plano-gerenciamento-treinos.md`.
Referência visual: UI kit Gofit (dark first, roxo `#7259F0`, fonte Urbanist), telas exportadas em
`C:\gralha\Gofit - Fitness & Workout App UI Kit (Preview) (1)`.

## Rodando

```bash
npm install
cp .env.example .env        # ajuste EXPO_PUBLIC_API_URL (emulador Android: http://10.0.2.2:8080)
npm start                   # Expo; "a" abre no emulador Android
npm run typecheck
```

Backend local: no `gralha-back`, `docker compose up -d postgres && ./mvnw spring-boot:run`.

## Estrutura

```
src/
├── api/          chamadas por domínio (auth, usuarios, catalogo)
├── lib/          api.ts (axios + Bearer + refresh com rotação), token.ts (SecureStore), theme.ts, format.ts
├── context/      AuthContext (sessão, role pelo JWT), ThemeContext (escuro padrão)
├── navigation/   AuthStack | AppStack (Tabs: Hoje · Treinos · Exercícios · Perfil)
├── components/ui componentes base do kit (Button, TextField, Chip, OptionCard, BottomSheet…)
└── screens/      auth, hoje, treinos, catalogo, perfil
```

## Status (fase M0)

- [x] Boas-vindas, login, cadastro, recuperação de senha por código, senha redefinida
- [x] Sessão persistida (SecureStore), refresh automático com lock, logout, sessão expirada → login
- [x] Hoje (BFF `/usuarios/me/hoje` atual), Exercícios (busca + filtros + detalhe), Perfil (editar, senha, tema, sair, excluir conta)
- [ ] Treinos manuais / IA, sessão de treino, resultados, questionário da IA, catálogo admin (fases M1–M5)
- [ ] Login com Google (precisa do client ID OAuth "Web" configurado no backend)
