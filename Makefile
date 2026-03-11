.PHONY: help build up down restart logs test

help: ## Show this help
	@egrep -h '\s##\s' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

build: ## Build docker images
	docker-compose build

up: ## Start all services in detached mode
	docker-compose up -d

down: ## Stop and remove all services, networks
	docker-compose down

restart: down up ## Restart all services

logs: ## Tail logs for all services
	docker-compose logs -f

logs-api: ## Tail logs for API only
	docker-compose logs -f api

logs-worker: ## Tail logs for Worker only
	docker-compose logs -f worker

test: ## Run unit tests inside the API container
	docker-compose exec api pytest tests/ -v
