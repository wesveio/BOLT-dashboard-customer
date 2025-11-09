#!/bin/bash

# Script to install Supabase CA certificate for CLI
# This script creates the required directory structure and installs the certificate

set -e

CERT_SOURCE="/Users/wesley/Documents/Personal/projects/poc/checkout-headless/supabase/certs/prod-ca-2021.crt"
CERT_TARGET="/supabase/certs/prod-ca-2021.crt"

echo "🔐 Installing Supabase CA Certificate..."
echo ""

# Check if source certificate exists
if [ ! -f "$CERT_SOURCE" ]; then
    echo "❌ Error: Source certificate not found at: $CERT_SOURCE"
    echo "   Please ensure the certificate file exists."
    exit 1
fi

# Create directory structure (requires sudo)
echo "📁 Creating directory structure..."
sudo mkdir -p /supabase/certs

# Copy certificate
echo "📋 Copying certificate..."
sudo cp "$CERT_SOURCE" "$CERT_TARGET"

# Set permissions
echo "🔒 Setting permissions..."
sudo chmod 644 "$CERT_TARGET"

echo ""
echo "✅ Certificate installed successfully!"
echo "   Location: $CERT_TARGET"
echo ""
echo "You can now run: supabase link --project-ref lywtcighvhbqdyrhwgmb"

