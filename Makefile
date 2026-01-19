.PHONY: dev up down migrate seed test lint fmt install

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

logs:
	docker-compose logs -f

migrate:
	cd backend && uv run alembic upgrade head

seed:
	cd backend && uv run python -m src.db.seed

test:
	cd backend && uv run pytest
	cd frontend && npm test

lint:
	cd backend && uv run ruff check .
	cd frontend && npm run lint

fmt:
	cd backend && uv run ruff format .
	cd frontend && npm run format

install:
	cd backend && uv sync
	cd frontend && npm install

clean:
	docker-compose down -v
	rm -rf backend/.venv frontend/node_modules frontend/.next
