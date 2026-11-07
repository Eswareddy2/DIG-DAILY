# Welcome to your Lovable project

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Open your project in the [Lovable editor](https://lovable.dev) and keep building.

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: connect the project to GitHub and every change made in Lovable is committed straight to your repository.
- **Full ownership**: this code is yours. Push to your repository and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## Built with

- TanStack Start
- TypeScript
- React
- Tailwind CSS

## Application source

The application source lives directly in `src/`, with static assets in `public/`.
TanStack Start resolves `src/router.tsx` and `src/server.ts` during deployment;
these files and their imports must be present in the repository, not only inside
a ZIP archive. The router exports `getRouter()` to create a router and query
client for each request.

Supabase clients read their keys from environment variables rather than embedded
credential fallbacks. The browser client uses `VITE_SUPABASE_URL` and
`VITE_SUPABASE_PUBLISHABLE_KEY`; the server client uses `SUPABASE_URL` and
`SUPABASE_SERVICE_ROLE_KEY`. Keep the service role key server-side.
