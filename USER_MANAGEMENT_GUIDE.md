# User Management Guide - Pasar Malam AI

## Overview
This guide explains how users, roles, and accounts work in Pasar Malam AI.

## User Roles System

### How It Works
The platform uses a **many-to-many relationship** between users and roles:
- One user can have MULTIPLE roles (Customer + Seller + Admin)
- Roles are stored in the `user_roles` table
- Each email/account is unique in Supabase Auth

### Current Role Types
1. **customer** - Browse products, place orders
2. **seller** - Manage products, view orders, subscription features
3. **admin** - System management, approvals, payouts (Qash Aris)

---

## Answering Your Questions

### Q1: Can a Seller become a Customer and vice versa?

**YES!** The system supports users having BOTH roles simultaneously.

**How to add multiple roles:**
You need to manually add entries in Supabase dashboard:

1. Go to Supabase Dashboard → Table Editor → `user_roles`
2. Find the user's existing role entry
3. Insert a NEW row with:
   - `user_id`: (same user ID)
   - `role`: 'customer' (if they're already a seller)
   - OR `role`: 'seller' (if they're already a customer)

**Example:**
```
User: fauziyah@example.com (user_id: abc-123)

user_roles table:
| id | user_id | role     |
|----|---------|----------|
| 1  | abc-123 | customer |
| 2  | abc-123 | seller   |
```

Now this user can:
- Browse and buy as a Customer
- List products and manage orders as a Seller

---

### Q2: Can they use the same email address or phone number?

**Email: NO (Technical Limitation)**
- Supabase Auth requires unique email per account
- One email = One account
- BUT: One account can have multiple roles (customer + seller + admin)

**Phone Number: YES (Technically possible, but NOT recommended)**
- The phone field is just stored as metadata
- Multiple accounts could technically use same phone
- **However, this creates confusion for:**
  - WhatsApp support (which number to contact?)
  - Order notifications
  - Password recovery

**RECOMMENDATION:**
- **Best Practice:** One person = One email = One account with multiple roles
- If someone wants to be both Customer AND Seller:
  1. Register once with ONE email
  2. You (Qash) manually add both 'customer' and 'seller' roles in Supabase
  3. Dashboard will show options for BOTH roles

**Benefits of this approach:**
- No confusion with duplicate data
- Easier to track user activity
- Simpler support via WhatsApp
- Single login for all features

---

### Q3: Managing Role Changes

**Scenario 1: Customer wants to become a Seller**
1. User registers as Customer
2. Later requests to become Seller via WhatsApp
3. You (Qash Aris) manually:
   - Add new entry in `user_roles` table: `role: 'seller'`
   - Process their subscription payment
   - Create their `seller_stalls` entry
4. User logs out and logs back in
5. Dashboard now shows BOTH customer and seller features

**Scenario 2: Seller also wants to buy as Customer**
1. User registered as Seller
2. You manually add `role: 'customer'` in `user_roles` table
3. User can now browse products AND manage their stall

---

## Admin Account Setup (For You, Qash!)

### Problem: "Infinite recursion in policy for user_roles"
This happens because the RLS policy is trying to check itself.

### Solution: Create admin account directly in Supabase

**Step 1: Create account via Auth**
1. Sign up normally through the website as a customer
2. Use your email: g8fauziyah@gmail.com
3. Verify your email

**Step 2: Manually add admin role in Supabase**
1. Go to Supabase Dashboard
2. Navigate to: Authentication → Users
3. Find your user and copy the `user_id`
4. Go to: Table Editor → `user_roles`
5. Insert new row:
   ```
   user_id: [your-user-id-here]
   role: admin
   ```

**Step 3: Fix RLS Policy (Optional)**
If you still get errors, you may need to disable RLS temporarily on `user_roles` table:
```sql
ALTER TABLE user_roles DISABLE ROW LEVEL SECURITY;
```

**OR** update the policy to avoid recursion:
```sql
-- Allow users to read their own roles
CREATE POLICY "Users can read own roles" ON user_roles
  FOR SELECT USING (auth.uid() = user_id);

-- Allow authenticated users to insert roles (for signup)
CREATE POLICY "Allow insert during signup" ON user_roles
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

---

## Recommended User Flow for Taiping Roadtour

### For Customers:
1. Register with email + password
2. Automatic role: 'customer'
3. Can immediately browse and order

### For Sellers:
1. Register with email + password + seller category
2. Initial role: 'seller' (but not approved)
3. **You (Qash) manually:**
   - Verify their details via WhatsApp
   - Process subscription payment
   - Add them to `seller_stalls` table
   - Set `is_approved: true` in their profile
4. They can now access full seller features

### For Dual Role Users:
1. Start with existing account (customer or seller)
2. Request additional role via WhatsApp
3. **You manually:**
   - Add the second role in `user_roles` table
   - Process any additional fees if applicable
4. User logs back in and sees combined dashboard

---

## Important Notes

- **One email = One account** (Supabase limitation)
- **One account = Multiple roles** (Your system design)
- **Phone numbers SHOULD be unique** (Best practice for support)
- **You control all role assignments** (Manual approval process)

---

## Quick Commands for You

### Check user's current roles:
```sql
SELECT u.email, ur.role 
FROM auth.users u
JOIN user_roles ur ON u.id = ur.user_id
WHERE u.email = 'user@example.com';
```

### Add customer role to existing seller:
```sql
INSERT INTO user_roles (user_id, role)
VALUES ('user-id-here', 'customer');
```

### Add seller role to existing customer:
```sql
INSERT INTO user_roles (user_id, role)
VALUES ('user-id-here', 'seller');
```

---

**Questions? WhatsApp Qash Aris: +60193438388** 🇲🇾
