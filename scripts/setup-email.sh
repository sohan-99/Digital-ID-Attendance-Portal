#!/bin/bash

# Email Configuration Setup Script
# This script helps you add email configuration to .env.local

echo "🔧 Email Configuration Setup"
echo "=============================="
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "❌ .env.local file not found!"
    echo "Creating .env.local file..."
    touch .env.local
fi

echo "This script will add email configuration to your .env.local file"
echo ""
echo "You have two options:"
echo ""
echo "1. Configure real email (recommended for production)"
echo "2. Skip email configuration (use console logs for testing)"
echo ""
read -p "Choose option (1 or 2): " option

if [ "$option" == "1" ]; then
    echo ""
    echo "📧 Email Configuration"
    echo "======================"
    echo ""
    echo "Choose your email provider:"
    echo "1. Gmail"
    echo "2. Outlook/Hotmail"
    echo "3. Yahoo"
    echo "4. Custom SMTP"
    echo ""
    read -p "Choose provider (1-4): " provider
    
    case $provider in
        1)
            EMAIL_HOST="smtp.gmail.com"
            EMAIL_PORT="587"
            echo ""
            echo "Gmail Configuration:"
            echo "-------------------"
            echo "⚠️  You need to generate an App Password for Gmail"
            echo "Steps:"
            echo "1. Go to https://myaccount.google.com/security"
            echo "2. Enable 2-Step Verification"
            echo "3. Click 'App passwords'"
            echo "4. Generate password for 'Mail' → 'Other'"
            echo ""
            read -p "Enter your Gmail address: " EMAIL_USER
            read -sp "Enter your App Password (16 chars): " EMAIL_PASS
            echo ""
            ;;
        2)
            EMAIL_HOST="smtp-mail.outlook.com"
            EMAIL_PORT="587"
            echo ""
            read -p "Enter your Outlook/Hotmail email: " EMAIL_USER
            read -sp "Enter your password: " EMAIL_PASS
            echo ""
            ;;
        3)
            EMAIL_HOST="smtp.mail.yahoo.com"
            EMAIL_PORT="587"
            echo ""
            read -p "Enter your Yahoo email: " EMAIL_USER
            read -sp "Enter your App Password: " EMAIL_PASS
            echo ""
            ;;
        4)
            echo ""
            read -p "Enter SMTP host: " EMAIL_HOST
            read -p "Enter SMTP port: " EMAIL_PORT
            read -p "Enter email address: " EMAIL_USER
            read -sp "Enter password: " EMAIL_PASS
            echo ""
            ;;
        *)
            echo "❌ Invalid option"
            exit 1
            ;;
    esac
    
    read -p "Enter sender name (e.g., Pundra University): " EMAIL_FROM_NAME
    
    # Add to .env.local
    echo "" >> .env.local
    echo "# Email Configuration" >> .env.local
    echo "EMAIL_HOST=$EMAIL_HOST" >> .env.local
    echo "EMAIL_PORT=$EMAIL_PORT" >> .env.local
    echo "EMAIL_USER=$EMAIL_USER" >> .env.local
    echo "EMAIL_PASS=$EMAIL_PASS" >> .env.local
    echo "EMAIL_FROM_NAME=$EMAIL_FROM_NAME" >> .env.local
    
    echo ""
    echo "✅ Email configuration added to .env.local"
    echo ""
    echo "Next steps:"
    echo "1. Restart your development server"
    echo "2. Test email: tsx scripts/test-email.ts your-email@example.com"
    
elif [ "$option" == "2" ]; then
    echo ""
    echo "⚠️  Skipping email configuration"
    echo ""
    echo "OTP codes will be printed in the server console during development."
    echo "You can add email configuration later by editing .env.local"
    echo ""
    echo "Add these lines to .env.local when ready:"
    echo "EMAIL_HOST=smtp.gmail.com"
    echo "EMAIL_PORT=587"
    echo "EMAIL_USER=your-email@gmail.com"
    echo "EMAIL_PASS=your-app-password"
    echo "EMAIL_FROM_NAME=Pundra University"
else
    echo "❌ Invalid option"
    exit 1
fi

echo ""
echo "Done! 🎉"
