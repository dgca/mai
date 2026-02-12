#!/usr/bin/env bash
#
# Install assume-persona plugin and commands for OpenCode
#
# Usage:
#   curl -fsSL https://raw.githubusercontent.com/dgca/mai/main/plugins/assume-persona/opencode/install.sh | bash
#
# Or from local clone:
#   ./plugins/assume-persona/opencode/install.sh
#

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

info() { echo -e "${GREEN}[OK]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
error() { echo -e "${RED}[X]${NC} $1"; exit 1; }
step() { echo -e "${CYAN}==>${NC} $1"; }

echo ""
echo "=============================================="
echo "  assume-persona for OpenCode"
echo "=============================================="
echo ""

# Base paths
CONFIG_DIR="${XDG_CONFIG_HOME:-$HOME/.config}/opencode"
PLUGIN_DIR="$CONFIG_DIR/plugins/assume-persona"
COMMANDS_DIR="$CONFIG_DIR/commands"
REPO_BASE="https://raw.githubusercontent.com/dgca/mai/main/plugins/assume-persona/opencode"

# Create directories
mkdir -p "$PLUGIN_DIR/lib"
mkdir -p "$COMMANDS_DIR"

# Determine if running from local clone or curl
if [[ -f "${BASH_SOURCE[0]}" ]]; then
  SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  if [[ -d "$SCRIPT_DIR/lib" && -f "$SCRIPT_DIR/plugin.ts" ]]; then
    LOCAL_INSTALL=true
  else
    LOCAL_INSTALL=false
  fi
else
  LOCAL_INSTALL=false
fi

# ============================================
# Install plugin files
# ============================================
step "Installing plugin..."

PLUGIN_FILES=(
  "plugin.ts"
  "package.json"
  "lib/types.ts"
  "lib/state.ts"
  "lib/personas.ts"
)

if [[ "$LOCAL_INSTALL" == true ]]; then
  for file in "${PLUGIN_FILES[@]}"; do
    src="$SCRIPT_DIR/$file"
    dst="$PLUGIN_DIR/$file"
    if [[ -f "$src" ]]; then
      cp "$src" "$dst"
      echo "  + $file"
    else
      warn "Missing: $file"
    fi
  done
else
  for file in "${PLUGIN_FILES[@]}"; do
    dst="$PLUGIN_DIR/$file"
    mkdir -p "$(dirname "$dst")"
    curl -fsSL "$REPO_BASE/$file" -o "$dst" 2>/dev/null && echo "  + $file" || warn "Failed: $file"
  done
fi

info "Plugin installed to $PLUGIN_DIR"

# ============================================
# Install command files
# ============================================
step "Installing commands..."

COMMANDS=(
  "assume-persona:list.md"
  "assume-persona:load.md"
  "assume-persona:show.md"
  "assume-persona:status.md"
  "assume-persona:clear.md"
  "assume-persona:restore.md"
  "assume-persona:create.md"
  "assume-persona:delete.md"
  "assume-persona:recommend.md"
  "assume-persona:import.md"
  "assume-persona:audit.md"
  "assume-persona:help.md"
)

INSTALLED=0
SKIPPED=0

for cmd in "${COMMANDS[@]}"; do
  target="$COMMANDS_DIR/$cmd"
  
  if [[ "$LOCAL_INSTALL" == true ]]; then
    src="$SCRIPT_DIR/commands/$cmd"
    if [[ -f "$src" ]]; then
      if [[ -f "$target" ]] && diff -q "$src" "$target" > /dev/null 2>&1; then
        echo "  = $cmd (unchanged)"
        ((SKIPPED++))
      else
        cp "$src" "$target"
        echo "  + $cmd"
        ((INSTALLED++))
      fi
    else
      warn "Missing: commands/$cmd"
    fi
  else
    if curl -fsSL "$REPO_BASE/commands/$cmd" -o "$target" 2>/dev/null; then
      echo "  + $cmd"
      ((INSTALLED++))
    else
      warn "Failed: $cmd"
    fi
  fi
done

info "Commands: $INSTALLED installed, $SKIPPED unchanged"

# ============================================
# Configure plugin in opencode config
# ============================================
step "Checking plugin configuration..."

OPENCODE_CONFIG="$CONFIG_DIR/config.json"

if [[ -f "$OPENCODE_CONFIG" ]]; then
  # Check if plugin is already registered
  if grep -q "assume-persona" "$OPENCODE_CONFIG" 2>/dev/null; then
    info "Plugin already registered in config"
  else
    warn "Plugin not registered in $OPENCODE_CONFIG"
    echo ""
    echo "Add to your config.json plugins array:"
    echo ""
    echo '  "plugins": ['
    echo '    {'
    echo '      "name": "assume-persona",'
    echo "      \"path\": \"$PLUGIN_DIR/plugin.ts\""
    echo '    }'
    echo '  ]'
    echo ""
  fi
else
  warn "No config.json found at $OPENCODE_CONFIG"
  echo ""
  echo "Create one with:"
  echo ""
  echo '{'
  echo '  "plugins": ['
  echo '    {'
  echo '      "name": "assume-persona",'
  echo "      \"path\": \"$PLUGIN_DIR/plugin.ts\""
  echo '    }'
  echo '  ]'
  echo '}'
  echo ""
fi

# ============================================
# Summary
# ============================================
echo ""
echo "=============================================="
echo ""

# Check for existing personas
PERSONA_DIR="$HOME/.claude/skills"
PERSONA_COUNT=$(ls -d "$PERSONA_DIR"/assume-persona--*/ 2>/dev/null | wc -l | tr -d ' ')

if [[ "$PERSONA_COUNT" -gt 0 ]]; then
  info "Found $PERSONA_COUNT existing persona(s)"
else
  echo "No personas found. Get started:"
  echo "  /assume-persona:create typescript-expert"
fi

echo ""
echo "Commands:"
echo "  /assume-persona:list      List available personas"
echo "  /assume-persona:load      Load a persona"
echo "  /assume-persona:status    Show loaded personas"
echo "  /assume-persona:create    Create a new persona"
echo "  /assume-persona:help      Show all commands"
echo ""
echo "Tools (available to the agent):"
echo "  persona_load, persona_list, persona_status,"
echo "  persona_clear, persona_show, persona_exists"
echo ""
