# Authentication Credentials & Flow

## Issue Summary
The login was failing due to credential mismatches between the frontend and backend systems.

## Root Cause
1. **Email domain mismatch**: Backend used `@eeu.com` while frontend expected `@eeu.gov.et`
2. **Password mismatch**: Backend used `admin123` while frontend expected `12345678`
3. **Response structure**: The GAS API returns `response.user` but the code was checking `response.data`

## Fixes Applied

### 1. Updated code.gs (Google Apps Script Backend)
Changed the seeded profiles to match frontend expectations:
- Admin email: `admin@eeu.com` → `admin@eeu.gov.et`
- Admin password: `admin123` → `12345678`
- Manager email: `manager@eeu.com` → `manager.oromia@eeu.gov.et`
- Manager password: `manager123` → `managerOromia2025`
- Staff email: `staff1@eeu.com` → `staff.addis@eeu.gov.et`
- Staff password: `staff123` → `staffAddis2025`

### 2. Updated auth-context.tsx
Fixed the GAS API response handling:
- Changed from checking `response.data` to `response.user`
- Added token storage: `localStorage.setItem('eeu_token', response.token)`
- Improved error logging

### 3. Updated Login.tsx
Changed default password from `Admin123!` to `12345678`

## Valid Credentials

### Admin Account
- **Email**: `admin@eeu.gov.et`
- **Password**: `12345678`
- **Role**: admin
- **Region**: Addis Ababa
- **Service Center**: Head Office

### Manager Account
- **Email**: `manager.oromia@eeu.gov.et`
- **Password**: `managerOromia2025`
- **Role**: manager
- **Region**: Oromia
- **Service Center**: Adama Service Center

### Staff Account
- **Email**: `staff.addis@eeu.gov.et`
- **Password**: `staffAddis2025`
- **Role**: staff
- **Region**: Addis Ababa
- **Service Center**: Bole Service Center

## Authentication Flow

The application tries authentication in this order:

1. **Google Apps Script (GAS) Backend**
   - URL: `https://script.google.com/macros/s/AKfycbwWoZtW-PbJv0wCB6VQquETpPpbenpFjRlhioqJ1jR0_5ES689-S_X126R9IVNoBDe0/exec`
   - Checks Google Sheets for user credentials
   - Returns JWT token on success

2. **Supabase Backend** (if GAS fails)
   - Only if `isBackendOnline` is true
   - Attempts to sign in with Supabase Auth
   - Can auto-create demo users if they don't exist

3. **Demo Authentication** (fallback)
   - Uses hardcoded credentials from `demo-data.ts`
   - Stores user in localStorage
   - No backend validation

## Next Steps

### To Use GAS Backend:
1. Deploy the updated `code.gs` to Google Apps Script
2. Run the `initializeSheets()` function to create the sheets
3. Run `seedProfiles()` and `seedUserRoles()` to populate data
4. The GAS URL is already configured in `gas-client.ts`

### To Test Locally:
1. The demo authentication should work immediately with the updated credentials
2. Login with `admin@eeu.gov.et` / `12345678`

### To Debug:
- Check browser console for detailed logs
- Look for "GAS backend response:" to see what the backend returns
- Check "Login response received:" to see the final result

## Files Modified
1. `code.gs` - Updated seeded user profiles
2. `src/lib/auth-context.tsx` - Fixed GAS API response handling
3. `src/pages/Login.tsx` - Updated default password
4. `AUTH_CREDENTIALS.md` - This documentation file