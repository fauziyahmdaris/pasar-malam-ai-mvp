# QUICK FIX for "Failed to load user data" Error

## 🚨 The Problem
You're seeing "Failed to load user data" because the RLS (Row Level Security) policies are blocking access to the `user_roles` table, even though you manually added the roles.

## ✅ The Solution (5 Minutes!)

### Step 1: Open Supabase Dashboard
1. Go to: https://supabase.com/dashboard
2. Login with your account
3. Select your project: `holsdtnnlcvqecyfjcph`

### Step 2: Go to SQL Editor
1. Click "SQL Editor" in the left sidebar (looks like a document icon)
2. Click "New Query" button (top right)

### Step 3: Copy & Paste This SQL

**OPTION A: Quick Fix (Disable RLS Temporarily)**
```sql
-- This will make login work immediately
ALTER TABLE user_roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
```

**OPTION B: Proper Fix (Better Security)**
Copy EVERYTHING from `FIX_RLS_POLICIES.sql` file and paste it into the SQL editor.

### Step 4: Click "RUN" Button
- The green "RUN" button at bottom right
- You should see "Success. No rows returned"

### Step 5: Test Login
1. Go back to: https://pasarmalamai.netlify.app/auth
2. Try logging in with:
   - Email: `fauziyahqasharis@gmail.com` 
   - Password: [your password]
3. Should work now! ✅

---

## 📋 Verify Your Accounts in Supabase

### For fauziyahqasharis@gmail.com:

**Check in Supabase:**
1. Go to "Authentication" → "Users"
2. Find: fauziyahqasharis@gmail.com
3. Copy the `ID` (user_id)

**Check Roles:**
1. Go to "Table Editor" → "user_roles"
2. Look for rows where `user_id` = [your copied ID]
3. Should see roles: `admin`, `customer`, `seller`

**If roles are missing, add them:**
```sql
-- Replace [your-user-id] with actual ID from Authentication page
INSERT INTO user_roles (user_id, role) VALUES 
('[your-user-id]', 'admin'),
('[your-user-id]', 'customer'),
('[your-user-id]', 'seller');
```

### For globalitasia@gmail.com:

**Same process:**
1. Find user ID in Authentication
2. Check/add role in user_roles table:
```sql
-- Replace [user-id] with ID from Authentication
INSERT INTO user_roles (user_id, role) VALUES 
('[user-id]', 'seller');

-- Optional: Add customer role too
INSERT INTO user_roles (user_id, role) VALUES 
('[user-id]', 'customer');
```

---

## 🔧 If Still Not Working

### Check Email Verification Status

1. Go to Supabase → "Authentication" → "Users"
2. Find both emails
3. Look at "Email Confirmed" column
4. If it says "Not confirmed":
   - Click on the user
   - Click "Send confirmation email" button
   - OR manually set `email_confirmed_at` to current time

**Quick SQL to confirm emails:**
```sql
-- Confirm fauziyahqasharis@gmail.com
UPDATE auth.users 
SET email_confirmed_at = NOW() 
WHERE email = 'fauziyahqasharis@gmail.com';

-- Confirm globalitasia@gmail.com
UPDATE auth.users 
SET email_confirmed_at = NOW() 
WHERE email = 'globalitasia@gmail.com';
```

---

## 🎯 Testing Checklist

After running the fix, test these:

### Test 1: Regular Login
- [ ] Go to: https://pasarmalamai.netlify.app/auth
- [ ] Login as: fauziyahqasharis@gmail.com
- [ ] Should redirect to Dashboard
- [ ] Should see all 3 role options (Customer, Seller, Admin)

### Test 2: Admin Login
- [ ] Go to: https://pasarmalamai.netlify.app/auth/admin
- [ ] Login as: fauziyahqasharis@gmail.com
- [ ] Should work without "infinite recursion" error

### Test 3: Seller Login
- [ ] Logout
- [ ] Login as: globalitasia@gmail.com
- [ ] Should redirect to Dashboard
- [ ] Should see Seller features

---

## 💡 Why This Happened

The original RLS policy was trying to check if a user is admin by querying the user_roles table... but to query user_roles, it needed to check if the user is admin first! This created an infinite loop (recursion).

**The fix:** We simplified the policies to just check `auth.uid()` which doesn't cause recursion.

---

## 📱 Quick Commands for Future

### To add new admin:
```sql
INSERT INTO user_roles (user_id, role) 
VALUES ('[user-id-here]', 'admin');
```

### To check user's roles:
```sql
SELECT u.email, ur.role 
FROM auth.users u
JOIN user_roles ur ON u.id = ur.user_id
WHERE u.email = 'email@example.com';
```

### To see all users with roles:
```sql
SELECT u.email, ur.role, u.email_confirmed_at
FROM auth.users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
ORDER BY u.created_at DESC;
```

---

## 🆘 Still Having Issues?

1. **Check browser console** (F12) for error messages
2. **Check Supabase logs** (Dashboard → Logs → API)
3. **Clear browser cache** and try again
4. **Try incognito mode** to rule out cache issues

---

## ✅ Success Indicators

You'll know it's working when:
- ✅ No "Failed to load user data" error
- ✅ No "infinite recursion" error  
- ✅ Dashboard loads with your name
- ✅ You see role badges (admin/customer/seller)
- ✅ Navigation works (click different sections)

---

**Partner, after you run this SQL, try logging in again and let me know if it works! 🚀**
