#!/bin/bash

# TinyHumanMD Deployment Script
# Strict branch-gated deployment for staging, production, and limited previews.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

PROD_PROJECT="tinyhumanmd"
STAGING_PROJECT="tinyhumanmd-staging"

require_git_branch() {
    local expected_branch="$1"
    local current_branch
    current_branch="$(git -C "$PROJECT_DIR" rev-parse --abbrev-ref HEAD)"

    if [ "$current_branch" != "$expected_branch" ]; then
        echo "❌ Branch guard failed: expected '$expected_branch', found '$current_branch'."
        echo "   Switch branches and retry."
        exit 1
    fi
}

deploy_to_staging() {
    echo "📦 Deploying to STAGING..."
    require_git_branch "staging"

    cd "$PROJECT_DIR"
    npx wrangler pages deploy . \
        --project-name "$STAGING_PROJECT" \
        --branch staging

    echo "✅ STAGING deployment complete!"
    echo "🔗 Staging URL: https://staging.tinyhumanmd.pages.dev"
}

deploy_to_production() {
    echo "⚠️  Deploying to PRODUCTION..."
    echo "This will update the live site at tinyhumanmd.com."
    require_git_branch "main"

    read -p "Are you sure you want to deploy to PRODUCTION? (y/N): " -n 1 -r
    echo ""

    if [[ ! "$REPLY" =~ ^[Yy]$ ]]; then
        echo "🛑 Production deployment cancelled."
        exit 0
    fi

    cd "$PROJECT_DIR"
    npx wrangler pages deploy . \
        --project-name "$PROD_PROJECT" \
        --branch main

    echo "✅ PRODUCTION deployment complete!"
    echo "🔗 Production URL: https://tinyhumanmd.com"
}

deploy_preview() {
    local current_branch
    current_branch="$(git -C "$PROJECT_DIR" rev-parse --abbrev-ref HEAD)"

    if [ "$current_branch" = "main" ] || [ "$current_branch" = "staging" ]; then
        echo "❌ Preview deploy is for feature branches only. Current branch: $current_branch"
        exit 1
    fi

    echo "📦 Deploying PREVIEW from branch '$current_branch'..."
    cd "$PROJECT_DIR"
    npx wrangler pages deploy . \
        --project-name "$PROD_PROJECT" \
        --branch "$current_branch"

    echo "✅ Preview deployment complete for branch '$current_branch'."
}

show_status() {
    local current_branch
    current_branch="$(git -C "$PROJECT_DIR" rev-parse --abbrev-ref HEAD)"

    echo "📊 Deployment Status"
    echo "  Current git branch: $current_branch"
    echo "  Production project:  $PROD_PROJECT (allowed branch: main)"
    echo "  Staging project:     $STAGING_PROJECT (allowed branch: staging)"
    echo ""
    echo "Policy: keep only prod + staging + up to 2-3 active feature preview branches."
}

echo "🚀 TinyHumanMD Deployment Controller"
echo "===================================="
echo "1) Deploy to STAGING (branch must be: staging)"
echo "2) Deploy to PRODUCTION (branch must be: main)"
echo "3) Deploy preview (feature branch only)"
echo "4) Show deployment status"
echo "5) Exit"

read -p "Enter your choice (1-5): " choice

case "$choice" in
    1) deploy_to_staging ;;
    2) deploy_to_production ;;
    3) deploy_preview ;;
    4) show_status ;;
    5) echo "Exiting. No deployments made." ;;
    *) echo "Invalid choice. Please enter 1-5."; exit 1 ;;
esac
