# Login Troubleshooting Guide

## Current Status

The login system is functioning correctly at the API level:
- POST /api/auth/login returns 200 with valid token and user data
- Token and user data are stored in localStorage
- Auth context updates with user information

## Possible Issues

### Issue 1: 404 on /dashboard/client After Login
**Symptom**: Login succeeds (200 response) but redirect to /dashboard/client returns 404

**Causes**:
1. Next.js build cache may have stale data
2. Route might not be properly compiled
3. Layout file might have issues detecting authenticated state

**Solutions**:

**Option A - Clear Build Cache (Recommended)**
1. Stop the dev server (`Ctrl+C`)
2. Delete `.next` folder
3. Run `pnpm dev` again

**Option B - Check Authentication State in Browser**
1. After login, open browser DevTools (F12)
2. Go to Application → Local Storage
3. Check if `auth_token` and `auth_user` exist
4. If they do, auth succeeded; if not, login failed

**Option C - Manual Verification**
1. Login and check the Network tab
2. Look for POST /api/auth/login
3. Check the Response tab
4. You should see:
```json
{
  "success": true,
  "data": {
    "success": true,
    "token": "eyJ...",
    "user": {
      "_id": "admin-1",
      "email": "admin@example.com",
      "name": "Admin User",
      "role": "admin"
    }
  }
}
```

## Demo Credentials

**Client User:**
- Email: `client@example.com`
- Password: `Test1234`
- Expected redirect: `/dashboard/client`

**Admin User:**
- Email: `admin@example.com`
- Password: `Test1234`
- Expected redirect: `/dashboard/admin`

## Password Hashing Details

The password hashing uses SHA256 with the JWT secret:
```
hash = SHA256(password + JWT_SECRET)
```

Demo credentials are created with:
```
password: "Test1234"
hash: computed at database initialization time
```

The same algorithm is used when comparing passwords at login.

## Debugging the Login Flow

### Step 1: Verify API Works
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"Test1234"}'
```

Expected response: 200 with token

### Step 2: Check if Routes Exist
Navigate to:
- `/dashboard/client` - Should load client dashboard
- `/dashboard/admin` - Should load admin dashboard
- `/login` - Should load login page

### Step 3: Browser Console Errors
1. Open DevTools (F12)
2. Go to Console tab
3. Try logging in
4. Look for JavaScript errors
5. Check for auth context warnings

## Common Errors and Fixes

### "Invalid email or password"
- Verify you're using exactly: `admin@example.com` or `client@example.com`
- Verify password is exactly: `Test1234` (capital T, number 4)
- Check browser console for detailed error messages

### 404 on Dashboard
- Clear `.next` build cache (see Option A above)
- Verify the route files exist:
  - `/app/(dashboard)/client/page.tsx`
  - `/app/(dashboard)/admin/page.tsx`

### localStorage Not Persisting
- Check if cookies are enabled in browser
- Check if browser is in private/incognito mode
- Try a regular browser window

### Redirect Loop
- Check browser DevTools Network tab
- Look for infinite redirects
- Clear browser cache and try again

## If Nothing Works

1. **Full Reset Procedure**:
   ```bash
   # Stop the server
   Ctrl+C
   
   # Clear all caches
   rm -rf .next node_modules
   
   # Reinstall
   pnpm install
   
   # Start fresh
   pnpm dev
   ```

2. **Check Auth Context Initialization**:
   - Add a console.log in login page to verify `useAuth()` returns login function
   - Add a console.log in auth context to verify it's providing the context

3. **Verify Database Initialization**:
   - Check that `lib/db.ts` creates demo users on first call
   - Check that password hashing is consistent

## Next Steps

Once login is working:
1. Navigate to Projects page
2. Try creating a new project
3. Test the roadmap and chat features
4. Verify all API calls return data

## Contact Support

If you continue to experience issues:
1. Note the exact error message
2. Check the browser console for JavaScript errors
3. Check the server logs for API errors
4. Share the Network tab from DevTools (request/response)
