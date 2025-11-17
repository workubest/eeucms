# Authentication Testing Guide

## Quick Test Steps

### 1. Test with Demo Authentication (Immediate)
Since the GAS backend might not be deployed yet, the app will fall back to demo authentication:

1. Open the application
2. The login form should be pre-filled with:
   - Email: `admin@eeu.gov.et`
   - Password: `12345678`
3. Click "Sign In"
4. You should be redirected to the dashboard

### 2. Test with GAS Backend (After Deployment)

#### Deploy the Google Apps Script:
1. Open Google Apps Script: https://script.google.com
2. Create a new project or open existing one
3. Copy the entire content of `code.gs` into the script editor
4. Click "Deploy" → "New deployment"
5. Choose "Web app"
6. Set "Execute as" to "Me"
7. Set "Who has access" to "Anyone"
8. Click "Deploy"
9. Copy the deployment URL

#### Initialize the Backend:
1. In the Apps Script editor, run these functions in order:
   - `initializeSheets()` - Creates the necessary sheets
   - `seedProfiles()` - Adds user profiles
   - `seedUserRoles()` - Adds user roles

#### Test the Login:
1. Open browser console (F12)
2. Try logging in with `admin@eeu.gov.et` / `12345678`
3. Check console for:
   ```
   🚀 Starting login process...
   📡 Calling login...
   Trying GAS backend login...
   GAS backend response: {success: true, user: {...}, token: "..."}
   🔍 Login response received: {success: true}
   ✅ Login successful
   ```

## Troubleshooting

### If login still fails:

1. **Check Console Logs**:
   - Look for "GAS backend response:" to see what the backend returns
   - Look for any error messages

2. **Verify GAS Backend**:
   - Test the GAS URL directly in Postman or curl:
   ```bash
   curl -X POST https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec \
     -H "Content-Type: application/json" \
     -d '{"path":"/auth/login","action":"login","data":{"email":"admin@eeu.gov.et","password":"12345678"}}'
   ```

3. **Check Google Sheets**:
   - Open the spreadsheet (ID: 1wHZT8vXoAjQwRUHGNKbvKaYW_Eo0517tvUh-zg8RxVM)
   - Verify the "Profiles" sheet has the correct email and password hash
   - Verify the "User_Roles" sheet has the correct role mapping

4. **Clear Browser Cache**:
   - Clear localStorage: `localStorage.clear()`
   - Refresh the page

## Expected Behavior

### Successful Login Flow:
1. User enters credentials
2. Frontend calls GAS backend
3. GAS backend validates credentials against Google Sheets
4. GAS backend returns user data and JWT token
5. Frontend stores user data and token in localStorage
6. User is redirected to dashboard

### Fallback Flow (if GAS fails):
1. User enters credentials
2. GAS backend fails (network error, not deployed, etc.)
3. Frontend tries Supabase (if configured)
4. Supabase fails or not configured
5. Frontend falls back to demo authentication
6. Demo credentials are validated locally
7. User data is stored in localStorage
8. User is redirected to dashboard

## Current Status

✅ **Fixed Issues**:
- Email domain mismatch (now using @eeu.gov.et)
- Password mismatch (now using 12345678)
- GAS API response handling (now checking response.user)
- Token storage (now saving to localStorage)

✅ **Working**:
- Demo authentication (immediate fallback)
- Login form pre-filled with correct credentials
- Error handling and logging

⏳ **Pending**:
- GAS backend deployment (manual step required)
- Google Sheets initialization (manual step required)
- Supabase configuration (optional)