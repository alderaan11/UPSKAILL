#!/bin/bash
# Fast local build check — runs before docker compose up --build
# Catches 90% of errors without Docker

set -e
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'

echo "${YELLOW}1/3 Python syntax check...${NC}"
python3 -c "
import ast, pathlib, sys
errors = []
for f in pathlib.Path('server').rglob('*.py'):
    if '.venv' in str(f): continue
    try: ast.parse(f.read_text())
    except SyntaxError as e: errors.append(f'{f}: {e}')
if errors:
    [print('  FAIL:', e) for e in errors]; sys.exit(1)
print(f'  OK ({len(list(pathlib.Path(\"server\").rglob(\"*.py\")))} files)')
"

echo "${YELLOW}2/3 TypeScript check...${NC}"
cd client && npx tsc --noEmit && echo "  OK" && cd ..

echo "${YELLOW}3/3 Next.js build (with dummy env vars)...${NC}"
cd client
NEXT_PUBLIC_API_URL="" \
NEXT_PUBLIC_SUPABASE_URL="https://placeholder.supabase.co" \
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder" \
npm run build
cd ..

echo "${GREEN}All checks passed!${NC}"
