#!/usr/bin/env bash

mkdir -p diagnostics

echo "=== GIT STATUS ===" > diagnostics/git.txt
git status >> diagnostics/git.txt
git rev-parse --abbrev-ref HEAD >> diagnostics/git.txt 2>&1

echo "=== AWS SSM CHECK ===" > diagnostics/ssm.txt
aws ssm get-parameters-by-path --path "/amplify/dfo2b1olzgvv2/master/" --region us-east-1 --recursive >> diagnostics/ssm.txt 2>&1 || true

echo "=== NODE & NPM ===" > diagnostics/node.txt
node -v >> diagnostics/node.txt
npm -v >> diagnostics/node.txt

