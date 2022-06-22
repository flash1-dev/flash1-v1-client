#!/bin/bash
set -euxo pipefail

VERSION=$(cat package.json | jq -r '.version')
NAME=$(cat package.json | jq -r '.name')

test -z "$(npm info $NAME@$VERSION)"
if [ $? -eq 0 ]
then
    set -e
    
    echo "Committing to GitHub"
	git config credential.helper 'cache --timeout=120'
	git config --local user.email "41898282+github-actions[bot]@users.noreply.github.com"
	git config --local user.name "github-actions[bot]"
	git add .
	git commit --allow-empty -m "[ci skip] update npm package"

    # Get version and tag
    git tag v${VERSION}
else
    echo "skipping publish, package $NAME@$VERSION already published"
    exit 1
fi
