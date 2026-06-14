# ============================================================================
# GROUNDSWELL '26 — Makefile
# Production lifecycle for the Vite + TypeScript + Phaser web application.
#
#   make build      Install dependencies and build the production bundle.
#   make start      Start the app (stops any existing instance first).
#   make stop       Stop all running instances + orphaned background processes.
#   make restart    Stop, then start.
#   make clean      Remove build artifacts, caches, logs and generated files.
#   make status     Show whether the app is running, with process info.
#
# Design goals: idempotent, single-instance, reliable teardown of detached
# processes. The fiddly process-management logic lives in scripts/app.sh
# because macOS ships GNU Make 3.81 (no `.ONESHELL`), which makes multi-line
# recipe logic non-portable. Each recipe line below is a self-contained shell
# command, so the Makefile works on stock macOS make and on GNU/Linux alike.
# ============================================================================

# Use a POSIX shell for recipes (every line is written to stand on its own).
SHELL := /bin/sh

# ---- Configuration (override on the CLI, e.g. `make start PORT=8080 MODE=dev`)
# NOTE: keep these comments on their own lines — a trailing `# ...` on a
# variable assignment would leave the preceding spaces inside the value.
APP_NAME := groundswell-26
# prod = serve the built bundle; dev = run the Vite dev server
MODE     ?= prod
# TCP port the server binds (enforced via --strictPort below)
PORT     ?= 4173
HOST     ?= localhost

# ---- Paths
NODE_BIN      := node_modules/.bin
DIST_DIR      := dist
# runtime pid + log directory (git-ignored)
RUN_DIR       := .run
PID_FILE      := $(RUN_DIR)/$(APP_NAME).pid
LOG_FILE      := $(RUN_DIR)/$(APP_NAME).log
INSTALL_STAMP := node_modules/.install.stamp
APP_CTL       := scripts/app.sh

# ---- The command that actually serves the app, selected by MODE.
# --strictPort makes Vite fail instead of silently choosing another port, so the
# port we manage in stop/status always matches the port the server bound.
ifeq ($(MODE),dev)
SERVE_CMD := $(NODE_BIN)/vite --host $(HOST) --port $(PORT) --strictPort
else
SERVE_CMD := $(NODE_BIN)/vite preview --host $(HOST) --port $(PORT) --strictPort
endif

# Environment handed to the control script — one single source of truth so the
# script and the Makefile can never disagree about port / paths / command.
CTL_ENV = APP_NAME='$(APP_NAME)' MODE='$(MODE)' PORT='$(PORT)' HOST='$(HOST)' \
          RUN_DIR='$(RUN_DIR)' PID_FILE='$(PID_FILE)' LOG_FILE='$(LOG_FILE)' \
          DIST_DIR='$(DIST_DIR)' SERVE_CMD='$(SERVE_CMD)'

# All targets are commands, not files.
.PHONY: help build deps start stop restart status clean distclean
.DEFAULT_GOAL := help

# ----------------------------------------------------------------------------
help: ## Show this help.
	@echo "GROUNDSWELL '26 — Makefile targets"
	@echo ""
	@echo "  make build      Install dependencies and build the bundle (-> $(DIST_DIR)/)"
	@echo "  make start      Stop any existing instance, then start the app"
	@echo "  make stop       Stop all instances + orphaned background processes"
	@echo "  make restart    Stop, then start"
	@echo "  make status     Show running state and process info"
	@echo "  make clean      Remove build artifacts, caches, logs, generated files"
	@echo "  make distclean  clean + remove node_modules"
	@echo ""
	@echo "Override variables, e.g.:  make start MODE=dev PORT=8080"
	@echo "  MODE=$(MODE)   (prod = serve built bundle via 'vite preview'; dev = 'vite' dev server)"
	@echo "  PORT=$(PORT)"
	@echo "  HOST=$(HOST)"

# ----------------------------------------------------------------------------
# build: install dependencies (if needed) and produce the production bundle.
build: deps
	@echo ">> Building production bundle ($(DIST_DIR)/) ..."
	npm run build
	@echo ">> Build complete."

# deps: install node_modules. Gated by a stamp file so it only re-runs when the
# package manifests change — safe and fast to invoke repeatedly (idempotent).
deps: $(INSTALL_STAMP)

$(INSTALL_STAMP): package.json package-lock.json
	@command -v npm >/dev/null 2>&1 || { echo "ERROR: npm is required but not on PATH" >&2; exit 1; }
	@echo ">> Installing dependencies ..."
	@if [ -f package-lock.json ]; then npm ci; else npm install; fi
	@mkdir -p $(dir $(INSTALL_STAMP))
	@touch $(INSTALL_STAMP)

# ----------------------------------------------------------------------------
# start: ensure a clean slate, then launch a single detached instance.
# For prod, build first if no bundle exists yet. The control script stops any
# previous instance before starting, so this never leaves duplicates running.
start:
	@if [ "$(MODE)" != "dev" ] && [ ! -f "$(DIST_DIR)/index.html" ]; then \
		echo ">> No build found — building first ..."; $(MAKE) build; \
	fi
	@$(CTL_ENV) sh $(APP_CTL) start

# stop: terminate the tracked instance and any orphaned process still holding
# the port, including detached children. Verifies the port is freed.
stop:
	@$(CTL_ENV) sh $(APP_CTL) stop

# restart: stop then start. Invoked as sequential sub-makes so ordering holds
# even under parallel make (-j); CLI overrides propagate automatically.
restart:
	@$(MAKE) stop
	@$(MAKE) start

# status: report whether the app is running and show its process tree.
status:
	@$(CTL_ENV) sh $(APP_CTL) status

# ----------------------------------------------------------------------------
# clean: stop the app (so we never orphan a process whose PID file we delete),
# then remove build output, caches, logs and generated/test artifacts.
# node_modules is intentionally kept — use `make distclean` to remove it too.
clean: stop
	@echo ">> Cleaning build artifacts, caches, logs and generated files ..."
	@# Always-generated, never-committed output: safe to remove unconditionally.
	@rm -rf "$(DIST_DIR)" .vite node_modules/.vite coverage "$(RUN_DIR)"
	@rm -f *.tsbuildinfo
	@# QA / test artifacts (see .gitignore): remove ONLY copies git does not
	@# track, so committed fixtures are never destroyed by a clean.
	@for f in .playwright-mcp slice*.png; do \
		[ -e "$$f" ] || continue; \
		if git rev-parse --is-inside-work-tree >/dev/null 2>&1 \
		   && git ls-files --error-unmatch "$$f" >/dev/null 2>&1; then \
			echo "  keep (git-tracked): $$f"; \
		else \
			rm -rf "$$f"; \
		fi; \
	done
	@find . -name '.DS_Store' -not -path './node_modules/*' -delete 2>/dev/null || true
	@echo ">> Clean complete (node_modules kept; run 'make distclean' to remove it)."

# distclean: a deeper clean that also removes installed dependencies.
distclean: clean
	@echo ">> Removing node_modules ..."
	rm -rf node_modules
	@echo ">> Deep clean complete."
