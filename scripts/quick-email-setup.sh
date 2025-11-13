#!/bin/bash

echo "╔════════════════════════════════════════════════════════╗"
echo "║   📧 Email Configuration Setup for OTP Service        ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""
echo "This will help you configure email for sending OTP codes."
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "❌ .env.local file not found!"
    exit 1
fi

echo "Current .env.local content:"
echo "─────────────────────────────────────────────────────────"
cat .env.local
echo "─────────────────────────────────────────────────────────"
echo ""

echo "Choose your email provider:"
echo "1. Gmail (Recommended)"
echo "2. Outlook/Hotmail"
echo "3. Yahoo"
echo "4. Other SMTP"
echo ""
read -p "Enter choice (1-4): " choice

case $choice in
    1)
        echo ""
        echo "╔════════════════════════════════════════════════════════╗"
        echo "║        Gmail App Password Setup Instructions          ║"
        echo "╚════════════════════════════════════════════════════════╝"
        echo ""
        echo "📋 Steps to get Gmail App Password:"
        echo ""
        echo "1. Open: https://myaccount.google.com/security"
        echo "2. Enable '2-Step Verification' (if not already enabled)"
        echo "3. Go back to Security page"
        echo "4. Click 'App passwords' (under 2-Step Verification)"
        echo "5. Select 'Mail' and 'Other (Custom name)'"
        echo "6. Name it: Pundra University"
        echo "7. Click 'Generate'"
        echo "8. COPY the 16-character password (e.g., abcdefghijklmnop)"
        echo ""
        echo "⚠️  IMPORTANT: Use App Password, NOT your regular Gmail password!"
        echo ""
        read -p "Press Enter when you have your App Password ready..."
        echo ""
        
        read -p "Enter your Gmail address: " email
        echo ""
        read -p "Paste your 16-character App Password (no spaces): " password
        echo ""
        read -p "Enter sender name (e.g., Pundra University): " from_name
        
        # Add to .env.local
        echo "" >> .env.local
        echo "# Email Configuration for OTP" >> .env.local
        echo "EMAIL_HOST=smtp.gmail.com" >> .env.local
        echo "EMAIL_PORT=587" >> .env.local
        echo "EMAIL_USER=$email" >> .env.local
        echo "EMAIL_PASS=$password" >> .env.local
        echo "EMAIL_FROM_NAME=$from_name" >> .env.local
        
        echo ""
        echo "✅ Email configuration added!"
        ;;
    *)
        echo "Feature coming soon. For now, please manually edit .env.local"
        exit 0
        ;;
esac

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║                Configuration Complete!                 ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""
echo "Next steps:"
echo "1. Restart your server (Ctrl+C, then: yarn dev)"
echo "2. Test email: node scripts/simple-email-test.js $email"
echo ""
