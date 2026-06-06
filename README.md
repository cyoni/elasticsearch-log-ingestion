
<img src="https://github.com/cyoni/cookie-remover-chrome-extension/assets/44746539/167cfd5e-d0f9-4ac9-81aa-bc86ddf670d1"  height="300">


# How to Run

![alt text](https://github.com/[username]/[reponame]/blob/[branch]/image.jpg?raw=true)


## Option A — Docker (full stack)

```bash
cd dev && docker compose up -d
```

Starts Elasticsearch, Kafka, Kibana, API (`:8082`), and Worker.

## Option B — Local app, Docker infra only

1.

```bash
cd dev && docker compose up -d elasticsearch kafka kibana
cd dev/src && pnpm install
```

2.

API: `pnpm dev:api`
Worker: `pnpm dev:worker`
Create index: `pnpm dev:create-index`
Load logs | `pnpm dev:load-logs`
