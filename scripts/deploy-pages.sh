#!/usr/bin/env bash
# Builds the skeleton and both apps for GitHub Pages and pushes them to the gh-pages branch.
# Site: https://hassank007.github.io/skeleton-key/
# Usage (repo root, Git Bash): bash scripts/deploy-pages.sh
set -euo pipefail
# Git Bash on Windows rewrites arguments that look like POSIX paths (e.g. --base=/skeleton-key/)
# into Windows paths. Turn that off so Vite gets the URL base as written.
export MSYS_NO_PATHCONV=1
cd "$(dirname "$0")/.."
root=$(pwd)
out=$(mktemp -d)

for pair in skeleton:skeleton apps/grimoire:grimoire apps/seance:seance; do
  dir=${pair%%:*}; name=${pair##*:}
  (cd "$dir" && npm run build -- --base="/skeleton-key/$name/")
  mkdir -p "$out/$name"
  cp -r "$dir/dist/." "$out/$name/"
done
cp site/index.html site/404.html "$out/"
touch "$out/.nojekyll"

cd "$out"
git init -q -b gh-pages
git add -A
git -c user.name="$(git -C "$root" config user.name)" -c user.email="$(git -C "$root" config user.email)" \
  commit -q -m "Deploy $(git -C "$root" rev-parse --short HEAD)"
git push -f -q "$(git -C "$root" remote get-url origin)" gh-pages
echo "Deployed to https://hassank007.github.io/skeleton-key/"
