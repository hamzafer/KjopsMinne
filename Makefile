.PHONY: dev up down rebuild restart reset ps shell-backend shell-db logs migrate seed seed-categories seed-ingredients seed-units seed-demo seed-all test test-coverage lint lint-fix fmt typecheck install clean pre-commit-install pre-commit-run

dev:
	@echo "Backend: http://localhost:8000"
	@echo "Frontend: http://localhost:3000"
	@echo "Ctrl+C to stop all services"
	@echo ""
	docker-compose up --watch

up:
	docker-compose up -d

down:
	docker-compose down

rebuild:
	docker-compose build --no-cache

restart:
	docker-compose restart

reset:
	docker-compose down -v --rmi all
	@echo "All containers, volumes, and images removed"

ps:
	docker-compose ps

shell-backend:
	docker-compose exec backend bash

shell-db:
	docker-compose exec db psql -U postgres kvitteringshvelv

logs:
	docker-compose logs -f

migrate:
	cd backend && uv run alembic upgrade head

seed:
	cd backend && uv run python -m src.db.seed

seed-categories:
	cd backend && uv run python -m src.db.seed

seed-ingredients:
	cd backend && uv run python -m src.db.seed_ingredients

seed-units:
	cd backend && uv run python -m src.db.seed_unit_conversions

seed-demo:
	cd backend && uv run python -m src.db.seed_demo_data

seed-all: seed-categories seed-ingredients seed-units
	@echo "All seed data loaded"

test:
	cd backend && uv run pytest
	cd frontend && npm test

test-coverage:
	cd backend && uv run pytest --cov=src --cov-report=term-missing --cov-report=html
	cd frontend && npm run test:coverage

lint:
	cd backend && uv run ruff check .
	cd frontend && npm run lint

lint-fix:
	cd backend && uv run ruff check . --fix
	cd frontend && npm run lint:fix

fmt:
	cd backend && uv run ruff format .
	cd frontend && npm run format

typecheck:
	cd backend && uv run mypy src
	cd frontend && npm run typecheck

install:
	cd backend && uv sync --all-extras
	cd frontend && npm install

clean:
	docker-compose down -v
	rm -rf backend/.venv frontend/node_modules frontend/.next

pre-commit-install:
	cd backend && uv run pre-commit install --install-hooks

pre-commit-run:
	cd backend && uv run pre-commit run --all-files
