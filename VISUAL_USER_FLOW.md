# 📸 Visual User Flow - OTP Email Verification

## 🎬 Complete User Journey

### Scene 1: Registration
```
┌─────────────────────────────────────┐
│     📝 Registration Form            │
├─────────────────────────────────────┤
│  Name: [John Doe            ]      │
│  Email: [john@example.com   ]      │
│  Password: [**********      ]      │
│  Student ID: [2024001       ]      │
│  Program: [CSE              ]      │
│  Department: [Engineering   ]      │
│  Batch: [50                 ]      │
│  Session: [2023-24          ]      │
│  Blood Group: [A+           ]      │
│                                     │
│         [Register Button]           │
└─────────────────────────────────────┘
           ↓ Click Register
           ↓
    ✅ Success Alert:
    "Registration successful! 
     Please check your email for 
     the verification code (OTP)."
           ↓
    🔄 Auto-redirect to Profile
```

### Scene 2: Email Inbox
```
┌─────────────────────────────────────┐
│  📧 Email Inbox                     │
├─────────────────────────────────────┤
│  From: Pundra University            │
│  Subject: Email Verification - OTP  │
│                                     │
│  ┌───────────────────────────────┐ │
│  │ Welcome to Pundra University! │ │
│  │                               │ │
│  │ Dear John Doe,                │ │
│  │                               │ │
│  │ Your OTP for verification:    │ │
│  │                               │ │
│  │    ┌─────────────────────┐   │ │
│  │    │    1  2  3  4  5  6 │   │ │
│  │    └─────────────────────┘   │ │
│  │                               │ │
│  │ Valid for 15 minutes          │ │
│  └───────────────────────────────┘ │
└─────────────────────────────────────┘
```

### Scene 3: Profile Page (Before Verification)
```
┌─────────────────────────────────────────────┐
│  👤 Profile - John Doe                      │
├─────────────────────────────────────────────┤
│  ┌─────────────────────────────────────┐   │
│  │  📸 Profile Picture                 │   │
│  │  Name: John Doe                     │   │
│  │  Email: john@example.com            │   │
│  │  Student ID: 2024001                │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │  🔐 Your Digital ID (QR)            │   │
│  ├─────────────────────────────────────┤   │
│  │  ℹ️  Please verify your email to    │   │
│  │     access your QR code.            │   │
│  │     We've sent a code to:           │   │
│  │     john@example.com                │   │
│  │                                     │   │
│  │  Enter OTP:                         │   │
│  │  ┌───────────────────────────────┐ │   │
│  │  │ [______]                      │ │   │
│  │  └───────────────────────────────┘ │   │
│  │                                     │   │
│  │     [  Verify Email  ]              │   │
│  │     [  Resend OTP    ]              │   │
│  │                                     │   │
│  │  💡 OTP is valid for 15 minutes    │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ❌ QR Code: Hidden (not verified)         │
└─────────────────────────────────────────────┘
```

### Scene 4: Entering OTP
```
┌─────────────────────────────────────────────┐
│  🔐 Your Digital ID (QR)                    │
├─────────────────────────────────────────────┤
│  Enter OTP:                                 │
│  ┌───────────────────────────────────┐     │
│  │ [1][2][3][4][5][6]                │     │
│  └───────────────────────────────────┘     │
│          ↓ User types OTP                   │
│  ┌───────────────────────────────────┐     │
│  │ [1][2][3][4][5][6] ✓              │     │
│  └───────────────────────────────────┘     │
│                                             │
│     [  Verify Email  ] ← Enabled now       │
│     [  Resend OTP    ]                      │
└─────────────────────────────────────────────┘
           ↓ Click Verify
           ↓
      🔄 Verifying...
```

### Scene 5: Verification Success
```
┌─────────────────────────────────────────────┐
│  🔐 Your Digital ID (QR)                    │
├─────────────────────────────────────────────┤
│  ✅ Email verified successfully!            │
│     Your QR code is now available.          │
│                                             │
│     🔄 Reloading page...                    │
└─────────────────────────────────────────────┘
           ↓ Auto-reload after 2 seconds
```

### Scene 6: Profile Page (After Verification)
```
┌─────────────────────────────────────────────────┐
│  👤 Profile - John Doe                          │
├─────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────┐       │
│  │  📸 Profile Picture                 │       │
│  │  Name: John Doe                     │       │
│  │  Email: john@example.com ✅         │       │
│  │  Student ID: 2024001                │       │
│  └─────────────────────────────────────┘       │
│                                                 │
│  ┌─────────────────────────────────────┐       │
│  │  🔐 Your Digital ID (QR)            │       │
│  ├─────────────────────────────────────┤       │
│  │                                     │       │
│  │     ┌─────────────────────┐        │       │
│  │     │  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓   │        │       │
│  │     │  ▓▓       ▓▓  ▓▓   │  📲    │       │
│  │     │  ▓▓  🎓   ▓▓  ▓▓   │        │       │
│  │     │  ▓▓       ▓▓  ▓▓   │  QR    │       │
│  │     │  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓   │  Code  │       │
│  │     └─────────────────────┘        │       │
│  │                                     │       │
│  │  Use this QR code for attendance   │       │
│  │  scanning at lecture halls,         │       │
│  │  library, and campus events.        │       │
│  │                                     │       │
│  │     [📥 Download QR Code]           │       │
│  └─────────────────────────────────────┘       │
│                                                 │
│  ✅ QR Code: Visible & Downloadable            │
└─────────────────────────────────────────────────┘
```

## 🔄 Alternative Flows

### Flow A: OTP Expired
```
User enters expired OTP
        ↓
❌ Error: "OTP expired. Please request a new one."
        ↓
Click "Resend OTP"
        ↓
New OTP sent to email
        ↓
Check email → Enter new OTP → Verify ✅
```

### Flow B: Wrong OTP
```
User enters wrong OTP
        ↓
❌ Error: "Invalid OTP"
        ↓
Try again or click "Resend OTP"
        ↓
Enter correct OTP → Verify ✅
```

### Flow C: Email Not Received
```
No email in inbox
        ↓
Check spam/junk folder
        ↓
If still not found:
  Click "Resend OTP"
        ↓
New OTP sent → Check email → Verify ✅
```

### Flow D: Admin Registration (Skip OTP)
```
Admin registers
        ↓
Auto-login to profile
        ↓
✅ QR Code immediately visible
(No OTP verification needed)
```

## 📊 State Diagram

```
┌──────────────┐
│  Not         │
│  Registered  │
└──────┬───────┘
       │ Register
       ↓
┌──────────────┐     Send OTP Email
│  Registered  ├─────────────────────→ 📧
│  Not         │
│  Verified    │
└──────┬───────┘
       │ Enter OTP
       │ & Verify
       ↓
┌──────────────┐
│  Verified    │
│  (Can access │
│   QR Code)   │
└──────────────┘
```

## 🎯 Key UI States

### Loading States:
```
Verifying OTP:  [🔄 Verifying...]
Resending OTP:  [🔄 Sending...]
Uploading Pic:  [🔄 Uploading...]
```

### Success States:
```
✅ Email verified successfully!
✅ New OTP sent to your email
✅ Profile picture updated
```

### Error States:
```
❌ Invalid OTP
❌ OTP expired. Please request a new one.
❌ Failed to send OTP email
❌ Email not verified
```

## 💡 Visual Indicators

### Before Verification:
- 🔒 QR Code section shows OTP input
- ℹ️ Info alert in blue
- 📧 Email address displayed
- ⏱️ 15-minute timer mentioned

### After Verification:
- ✅ Green checkmark next to email
- 📲 QR Code visible
- 📥 Download button active
- 🎉 Success message

### Interactive Elements:
```
Buttons:
[  Verify Email  ]  ← Primary action
[  Resend OTP    ]  ← Secondary action
[📥 Download QR  ]  ← After verification

Input:
[1][2][3][4][5][6]  ← 6-digit OTP input
Max length: 6
Only numbers: 0-9
```

## 🎨 Color Coding

### Alerts:
- 🔵 Blue (Info): Email verification pending
- 🟢 Green (Success): Email verified, OTP sent
- 🔴 Red (Error): Invalid OTP, expired OTP
- 🟡 Yellow (Warning): Check spam folder

### Status:
- ❌ Not verified → Red/Gray
- ✅ Verified → Green
- 🔄 Loading → Blue spinner

## 📱 Responsive Design

### Desktop View:
```
[Profile Picture]  [User Info]
[QR Code/OTP]     [Details]
```

### Mobile View:
```
[Profile Picture]
[User Info]
[QR Code/OTP]
[Details]
```

## 🎓 Tips for Users

### Visual Cues to Look For:
1. **Alert message** at top of QR section
2. **Input box** with 6 empty squares
3. **Verify button** turns blue when 6 digits entered
4. **Success message** in green when verified
5. **QR code** appears with download button

### Common Questions:
**Q: Where is my QR code?**
A: Look for the OTP input box. Enter the code from your email.

**Q: How do I know if I'm verified?**
A: You'll see a green checkmark next to your email and the QR code will be visible.

**Q: What if I didn't get the email?**
A: Click the "Resend OTP" button and check your spam folder.

---

This visual guide should help users understand the complete flow! 🎉
