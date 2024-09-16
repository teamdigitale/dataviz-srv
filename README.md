# Dataviz chart server

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run index.ts
# or
bun run dev
```

This project was created using `bun init` in bun v1.1.3. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.

# fly.io config

Docker file generated with

```bash
 bunx --bun @flydotio/dockerfile@latest
```

then used the `flyctl secrets` command to add envs, see `sample.env` for variables reference.

```bash
fly secrets set DATABASE_URL=postgres://example.com/mydb
fly secrets list
```
