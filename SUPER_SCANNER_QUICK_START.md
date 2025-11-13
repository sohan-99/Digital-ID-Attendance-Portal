# Super Scanner Admin - Quick Reference

## 🔑 Credentials
```
Username: super_scanner
Password: SuperScanner@2025
Location: All Locations
```

## 🚀 Quick Start

### Method 1: Auto-Login (Recommended)
1. Login as regular admin
2. Navigate to Scanner page
3. Automatically logged in as Super Scanner Admin ✨
4. Start scanning at any location

### Method 2: Manual Login
1. Go to `/scanner-login`
2. Select any location
3. Enter super_scanner credentials
4. Login and start scanning

## ✨ Key Features

| Feature | Description |
|---------|-------------|
| 🌍 All Locations | Access Campus, Library, and Event |
| 🔄 Switch Locations | Change location anytime without re-login |
| ⚡ Auto-Login | Seamless transition from admin dashboard |
| 🎯 Flexible Scanning | Scan at any location on-demand |

## 📊 Differences from Regular Scanner Admin

| Aspect | Regular Scanner | Super Scanner |
|--------|----------------|---------------|
| Locations | 1 (Fixed) | All (Flexible) |
| Location Selector | 🔒 Locked | ✅ Enabled |
| Auto-Login | ❌ No | ✅ Yes |
| Use Case | Fixed station | Mobile/Multi-location |

## 🔧 Setup

```bash
# Create super scanner admin
yarn create-super-scanner-admin

# Or with npx
npx tsx scripts/create-super-scanner-admin.ts
```

## ⚠️ Important Notes

1. **Change password in production!**
2. Keep credentials secure
3. Only ONE super scanner admin by default
4. All scans are properly logged with location

## 🎯 Usage Flow

```
Regular Admin → /scanner → Auto-Login → Super Scanner Admin
                                              ↓
                              Choose Location (Campus/Library/Event)
                                              ↓
                                         Start Scanning
                                              ↓
                                    Switch Location Anytime
```

## 📝 Status Indicator

Look for these indicators on the scanner page:

- **🌟 Super Scanner Admin** badge
- **Green** alert box (instead of blue)
- **Enabled** location selector
- Message: "You have access to all locations"

## 🔍 Troubleshooting

| Problem | Solution |
|---------|----------|
| Auto-login fails | Verify super_scanner exists in database |
| Location locked | Check isSuperAdmin flag in localStorage |
| Wrong location scans | Verify selected location before scanning |

## 📚 More Information

See [SUPER_SCANNER_ADMIN.md](./SUPER_SCANNER_ADMIN.md) for detailed documentation.
