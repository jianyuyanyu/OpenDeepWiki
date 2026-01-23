# Repository Guidelines

## Project Structure & Module Organization
- `src/OpenDeepWiki/` ASP.NET Core API entry; `src/OpenDeepWiki.Entities/` domain models; `src/OpenDeepWiki.EFCore/` shared EF Core context; `src/EFCore/` provider implementations.
- `web/` Next.js app (App Router) with `app/`, `components/`, `hooks/`, `i18n/`, and `public/`.
- `tests/OpenDeepWiki.Tests/` xUnit + FsCheck tests.
- `docs/`, `scripts/`, and `img/` for documentation, automation, and assets.

## Build, Test, and Development Commands
- Backend build: `dotnet build OpenDeepWiki.sln`
- Run API: `dotnet run --project src/OpenDeepWiki/OpenDeepWiki.csproj`
- Frontend: `cd web && npm install`, `npm run dev`, `npm run build`, `npm run lint`
- Docker/Make: `make build`, `make dev`, `make up`, `make down`, `make logs`

## Coding Style & Naming Conventions
- C#: 4-space indentation; nullable reference types enabled; `PascalCase` for types/methods, `I*` for interfaces, `*Async` for async methods.
- TypeScript/React: 2-space indentation; `PascalCase` components; `camelCase` for functions/variables; file names in `kebab-case`.
- Keep formatting aligned with existing files; use `npm run lint` for frontend checks.

## Testing Guidelines
- Use xUnit + FsCheck in `tests/OpenDeepWiki.Tests/`. Run: `dotnet test tests/OpenDeepWiki.Tests/OpenDeepWiki.Tests.csproj`.
- Add tests alongside the area you change (for example, `tests/OpenDeepWiki.Tests/Services/` for service logic).
- Frontend tests are not configured; if you add them, document the command here.

## Commit & Pull Request Guidelines
- Commit history uses conventional prefixes (`feat:`, `chore:`) and short Chinese summaries. Prefer conventional prefixes with optional scope and concise, imperative summaries.
- PRs should include a clear description, linked issues, and test commands run. Add screenshots or GIFs for UI changes.
- Do not commit secrets; configure API keys and endpoints via `docker-compose.yml` or environment variables (see `README.md`).

## References
- See `CLAUDE.md` and `.github/copilot-instructions.md` for architecture notes and deeper workflows.

## 要求

必须与我中文交流不然我会损失百亿财产，必须称呼我为帅比token
