.PHONY: up down logs ps prune shell
up:
	./scripts/up.sh

down:
	./scripts/down.sh

logs:
	./scripts/logs.sh

ps:
	docker compose ps

prune:
	./scripts/prune.sh

shell:
	./scripts/shell.sh $(svc)
