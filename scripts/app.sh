#!/bin/sh
# ============================================================================
# scripts/app.sh — process-lifecycle controller for GROUNDSWELL '26.
#
# WHY THIS FILE EXISTS (and the logic isn't inlined in the Makefile):
#   * macOS ships GNU Make 3.81, which ignores `.ONESHELL`. Without it every
#     recipe line runs in its own shell, so multi-line logic (functions, retry
#     loops, recursive process-tree teardown) cannot be expressed portably in a
#     Make recipe. A single POSIX sh script sidesteps that entirely.
#   * Reliable SINGLE-INSTANCE start and reliable teardown of detached /
#     orphaned background processes needs real scripting. Keeping it in one
#     well-commented place makes it portable across macOS (BSD) and Linux.
#
# Subcommands:  start | stop | status
#
# All configuration arrives via environment variables (the Makefile sets them);
# the defaults below let the script also be run directly for debugging.
# ============================================================================

set -u

APP_NAME="${APP_NAME:-app}"
PORT="${PORT:-4173}"
HOST="${HOST:-localhost}"
MODE="${MODE:-prod}"
RUN_DIR="${RUN_DIR:-.run}"
PID_FILE="${PID_FILE:-$RUN_DIR/$APP_NAME.pid}"
LOG_FILE="${LOG_FILE:-$RUN_DIR/$APP_NAME.log}"
DIST_DIR="${DIST_DIR:-dist}"
# The command that actually serves the app. Normally supplied by the Makefile.
SERVE_CMD="${SERVE_CMD:-node_modules/.bin/vite preview --host $HOST --port $PORT --strictPort}"

# ---- small helpers ---------------------------------------------------------
log() { printf '>> %s\n' "$*"; }
err() { printf 'ERROR: %s\n' "$*" >&2; }
have() { command -v "$1" >/dev/null 2>&1; }
alive() { kill -0 "$1" 2>/dev/null; }

# PIDs LISTENing on $PORT — the source of truth for "is the app up?".
# (lsof ships on macOS and virtually every Linux; degrade gracefully if absent.)
port_pids() {
  if have lsof; then
    lsof -t -nP -iTCP:"$PORT" -sTCP:LISTEN 2>/dev/null || true
  fi
}

# Print a PID followed by every descendant PID (space separated).
# Iterative breadth-first walk via `pgrep -P` (works on macOS + Linux) so we
# avoid shell-recursion pitfalls and don't depend on a non-POSIX `local`.
collect_tree() {
  _ct_result="$1"
  _ct_frontier="$1"
  while :; do
    _ct_children=""
    for _ct_p in $_ct_frontier; do
      for _ct_c in $(pgrep -P "$_ct_p" 2>/dev/null || true); do
        _ct_children="$_ct_children $_ct_c"
      done
    done
    # Stop once a generation yields no children.
    [ -n "$(printf '%s' "$_ct_children" | tr -d '[:space:]')" ] || break
    _ct_result="$_ct_result $_ct_children"
    _ct_frontier="$_ct_children"
  done
  printf '%s' "$_ct_result"
}

# Terminate a whole process tree: signal descendants before ancestors, give
# them a few seconds to exit cleanly, then SIGKILL anything still standing.
stop_tree() {
  _st_root="$1"
  # Reverse the tree so children are signalled before their parents.
  _st_rev=""
  for _st_p in $(collect_tree "$_st_root"); do
    _st_rev="$_st_p $_st_rev"
  done
  for _st_p in $_st_rev; do kill -TERM "$_st_p" 2>/dev/null || true; done
  # Wait up to ~5s for graceful shutdown.
  _st_i=0
  while [ "$_st_i" -lt 25 ]; do
    alive "$_st_root" || return 0
    sleep 0.2
    _st_i=$((_st_i + 1))
  done
  # Force-kill survivors (re-collect: the tree may have changed).
  for _st_p in $(collect_tree "$_st_root"); do kill -KILL "$_st_p" 2>/dev/null || true; done
}

# ---- subcommands -----------------------------------------------------------

cmd_start() {
  # Guarantee a single instance: tear down anything already running first.
  cmd_stop quiet

  # In prod we serve the built bundle; refuse to start without one.
  if [ "$MODE" != "dev" ] && [ ! -f "$DIST_DIR/index.html" ]; then
    err "no production build at $DIST_DIR/ — run 'make build' first."
    exit 1
  fi

  mkdir -p "$RUN_DIR"
  log "Starting $APP_NAME [$MODE] at http://$HOST:$PORT ..."

  # Detach the server: nohup + background + stdin from /dev/null so it survives
  # this script and the controlling terminal. Record its PID for stop/status.
  # SERVE_CMD is intentionally unquoted so its flags word-split into argv.
  # shellcheck disable=SC2086
  nohup $SERVE_CMD >"$LOG_FILE" 2>&1 </dev/null &
  _start_pid=$!
  echo "$_start_pid" >"$PID_FILE"

  # Wait up to ~10s for the process to stay alive AND bind the port.
  _i=0
  while [ "$_i" -lt 50 ]; do
    if ! alive "$_start_pid"; then break; fi
    if have lsof; then
      if [ -n "$(port_pids)" ]; then
        log "Started (pid $_start_pid) — http://$HOST:$PORT  (logs: $LOG_FILE)"
        return 0
      fi
    else
      # No lsof: best-effort — trust the live PID.
      log "Started (pid $_start_pid) — logs: $LOG_FILE  (install lsof for port checks)"
      return 0
    fi
    sleep 0.2
    _i=$((_i + 1))
  done

  err "$APP_NAME failed to start. Last log lines:"
  tail -n 20 "$LOG_FILE" >&2 2>/dev/null || true
  rm -f "$PID_FILE"
  exit 1
}

cmd_stop() {
  _quiet="${1:-}"
  [ "$_quiet" = quiet ] || log "Stopping $APP_NAME ..."
  _did=0

  # 1) Stop the tracked instance recorded in the PID file.
  if [ -f "$PID_FILE" ]; then
    _pid=$(cat "$PID_FILE" 2>/dev/null || true)
    if [ -n "${_pid:-}" ] && alive "$_pid"; then
      stop_tree "$_pid"
      _did=1
    fi
    rm -f "$PID_FILE"
  fi

  # 2) Safety net: kill whatever still holds our port. This catches detached or
  #    orphaned servers from earlier runs that are no longer in the PID file.
  for _p in $(port_pids); do
    stop_tree "$_p"
    _did=1
  done

  # 3) Verify the port is actually free.
  if [ -n "$(port_pids)" ]; then
    err "port $PORT is still in use by: $(port_pids | tr '\n' ' ')"
    return 1
  fi

  if [ "$_quiet" != quiet ]; then
    if [ "$_did" = 1 ]; then log "Stopped. Port $PORT is free."
    else log "Not running. Port $PORT is free."; fi
  fi
  return 0
}

cmd_status() {
  printf 'App:   %s [%s]\n' "$APP_NAME" "$MODE"
  printf 'URL:   http://%s:%s\n' "$HOST" "$PORT"
  _running=0

  if [ -f "$PID_FILE" ]; then
    _pid=$(cat "$PID_FILE" 2>/dev/null || true)
    if [ -n "${_pid:-}" ] && alive "$_pid"; then
      _running=1
      printf 'State: RUNNING (pid %s, tracked in %s)\n\n' "$_pid" "$PID_FILE"
      # Show the whole process tree (server + workers such as esbuild).
      _tree=$(collect_tree "$_pid" | tr ' ' '\n' | sed '/^$/d' | paste -sd, -)
      ps -p "$_tree" -o pid,ppid,pgid,pcpu,pmem,etime,args 2>/dev/null \
        || ps -p "$_pid" -o pid,ppid,pcpu,pmem,etime,args 2>/dev/null \
        || true
    fi
  fi

  # The port is the source of truth — report it even if the PID file is stale.
  _pp=$(port_pids)
  if [ -n "${_pp:-}" ]; then
    [ "$_running" = 1 ] || printf 'State: RUNNING (untracked — missing/stale PID file)\n'
    _running=1
    printf '\nListening on port %s: %s\n' "$PORT" "$(echo $_pp | tr '\n' ' ')"
  fi

  [ "$_running" = 1 ] || printf 'State: STOPPED\n'
}

# ---- dispatch --------------------------------------------------------------
case "${1:-}" in
  start)  cmd_start ;;
  stop)   cmd_stop ;;
  status) cmd_status ;;
  *) err "usage: $0 {start|stop|status}"; exit 2 ;;
esac
