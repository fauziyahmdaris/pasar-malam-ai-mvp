# Supabase Setup Guide for Pasar Malam AI
## Complete Step-by-Step Instructions for Qash Aris

---

## 🚨 FIXING THE CURRENT ERROR

### Problem: "Infinite recursion detected in policy for relation user_roles"

This happens because the RLS policy is checking itself in a loop when trying to verify user roles.

### Solution: Fix RLS Policies in Supabase

**Step 1: Go to Supabase Dashboard**
1. Visit: https://supabase.com/dashboard
2. Login with your account
3. Select your project: `holsdtnnlcvqecyfjcph`

**Step 2: Open SQL Editor**
1. Click on "SQL Editor" in the left sidebar
2. Click "New Query"

**Step 3: Run This SQL to Fix the Policy**

```sql
-- First, drop any existing problematic policies
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON user_roles;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON user_roles;

-- Disable RLS temporarily (we'll re-enable with better policies)
ALTER TABLE user_roles DISABLE ROW LEVEL SECURITY;

-- Optional: Re-enable with simple policies
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Allow users to read their OWN roles only
CREATE POLICY "Users can view own roles"
ON user_roles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Allow users to insert their own role during signup
CREATE POLICY "Users can insert own role during signup"
ON user_roles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Admin can do everything (you'll add admin role manually)
CREATE POLICY "Admins can manage all roles"
ON user_roles FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);
```

**Step 4: Click "RUN" button**

✅ This should fix the infinite recursion error!

---

## 👤 SETTING UP YOUR ADMIN ACCOUNT

### Method 1: Create Account via Website (RECOMMENDED)

**Step 1: Register on your website**
1. Go to http://localhost:8080/auth
2. Click "Sign Up"
3. Fill in your details:
   - Full Name: Qash Aris (or Fauziyah)
   - Phone: +60193438388
   - Email: g8fauziyah@gmail.com
   - Password: (your choice - make it strong!)
   - Role: Select "Customer" (for now)
4. Click "Sign Up"
5. Check your email for confirmation link
6. Click the confirmation link

**Step 2: Find Your User ID in Supabase**
1. Go to Supabase Dashboard
2. Click "Authentication" → "Users"
3. Find your email: g8fauziyah@gmail.com
4. Click on it to see details
5. **Copy the "ID" field** (it's a long UUID like: 028faac4-b539-4e51-877b-663050ef030e)

**Step 3: Add Admin Role Manually**
1. Go to "Table Editor" → "user_roles"
2. Click "Insert row" button
3. Fill in:
   - `user_id`: [paste your copied ID]
   - `role`: `admin`
4. Click "Save"

**Step 4: Test Admin Login**
1. Go to http://localhost:8080/auth/admin
2. Login with your email and password
3. ✅ Should work now!

---

## 📦 PRODUCT LISTING FEATURES

### Current Database Schema for Products

Your `products` table has these fields:
```sql
- id (UUID)
- name (text) - Product name
- description (text) - Product description
- price (numeric) - Price in RM
- category (text) - e.g., "Kuih Raya", "Makanan", etc.
- stock_quantity (integer) - Available stock
- image_url (text) - Photo URL
- stall_id (UUID) - Links to seller_stalls
- is_available (boolean) - Active/inactive
- min_preorder_quantity (integer) - Minimum order quantity
- fulfillment_lead_time_days (integer) - Days needed to prepare
- is_bundle (boolean) - Is this a bundle product?
- bundle_components (JSONB) - Bundle details
- created_at (timestamp)
- updated_at (timestamp)
```

### Seller Stalls (Shop/Gerai/Business Info)

Your `seller_stalls` table has:
```sql
- id (UUID)
- seller_id (UUID) - Links to user
- stall_name (text) - Shop name (e.g., "Kuih Makcik Kiah")
- description (text) - Business description
- location (text) - e.g., "Taiping, Perak - Pasar Malam Batu 2 1/2"
- geolocation (JSONB) - {lat, lng} coordinates
- category (text) - Seller category
- operating_hours (text)
- contact_number (text)
- is_active (boolean)
- created_at (timestamp)
- updated_at (timestamp)
```

### Recommendations for Your MVP:

**1. Product Photos:**
- **Maximum photos per product:** Currently 1 (image_url field)
- **To add multiple photos:** You'll need to:
  - Create new table: `product_images`
  - Fields: `product_id`, `image_url`, `display_order`
  - Or: Use JSONB array in products table: `images: ["url1", "url2", "url3"]`

**Suggestion for MVP:** Keep it simple with 1 main photo. Add multiple photos later if needed.

**2. Shop/Gerai Template:**
Each seller gets ONE stall entry with:
- Business name (stall_name)
- Location
- Operating hours
- Contact number
- Category (Pasar Malam, Pasar Tani, etc.)

**You manually create this when approving sellers!**

---

## 📱 WHATSAPP NOTIFICATIONS SYSTEM

### Yes, It's Totally Possible! Here's How:

### Option 1: Manual WhatsApp (Current - FREE) ✅

**How it works now:**
1. Seller receives order → You see it in Supabase
2. You manually WhatsApp the seller: "You have new order!"
3. Customer pays → Seller confirms via WhatsApp
4. Seller prepares → WhatsApp customer: "Ready for pickup!"

**Pros:** Free, simple, personal touch
**Cons:** Manual work, not scalable

### Option 2: WhatsApp Business API (Automated - PAID) 💰

**Services you can use:**
1. **Twilio WhatsApp API**
   - Cost: ~USD 0.005 per message (sent)
   - Website: https://www.twilio.com/whatsapp

2. **MessageBird**
   - Cost: Similar pricing
   - Website: https://www.messagebird.com

3. **Wati.io** (Malaysia-friendly!)
   - Cost: Starts from RM150/month
   - Website: https://www.wati.io

**How it would work:**
```javascript
// When order is created
async function sendOrderNotification(order) {
  // Send to SELLER
  await sendWhatsApp({
    to: seller.phone,
    message: `🛒 New Order!
    Customer: ${order.customerName}
    Items: ${order.items}
    Total: RM ${order.total}
    Pickup: ${order.pickupDate}
    
    View order: https://pasarmalamai.netlify.app/dashboard`
  });
  
  // Send to CUSTOMER
  await sendWhatsApp({
    to: customer.phone,
    message: `✅ Order Confirmed!
    Order #${order.id}
    Seller: ${seller.name}
    Total: RM ${order.total}
    
    Track order: https://pasarmalamai.netlify.app/customer/orders`
  });
}
```

### Option 3: WhatsApp Link Notifications (FREE!) 🎯

**Smart hybrid approach:**
1. System sends EMAIL notification
2. Email contains WhatsApp link to contact seller/customer
3. Click link → Opens WhatsApp automatically

**Example:**
```javascript
// In your order creation code
const whatsappLink = `https://wa.me/60${sellerPhone}?text=Hi! I placed order #${orderId}`;
sendEmail({
  to: customer.email,
  subject: "Order Confirmed!",
  body: `Your order is confirmed!
         Contact seller: ${whatsappLink}`
});
```

---

## 🔔 NOTIFICATION FLOW DESIGN

### Scenario: Customer Places Order

**What happens:**

1. **Customer submits order** → System saves to `pre_orders` table

2. **System triggers notification:**
   ```javascript
   // In your order creation function
   const { data: order } = await supabase
     .from('pre_orders')
     .insert({...orderData})
     .select()
     .single();
   
   // Send notifications
   await notifyNewOrder(order);
   ```

3. **Seller gets notified:**
   - Email: "New order from [Customer Name]"
   - WhatsApp link: Click to contact customer
   - Dashboard badge: Red dot on "Orders" tab

4. **Seller confirms order:**
   - Updates order status to "confirmed"
   - System notifies customer

5. **Customer gets confirmation:**
   - Email: "Order confirmed by [Seller Name]"
   - WhatsApp link: Click to contact seller

6. **Seller marks as ready:**
   - Updates status to "ready_for_pickup"
   - System notifies customer

7. **Customer gets pickup notification:**
   - Email: "Your order is ready!"
   - WhatsApp link: Click to coordinate pickup

---

## 🛠️ HOW TO IMPLEMENT NOTIFICATIONS

### Step 1: Create Notification Function in Supabase

**Go to Supabase Dashboard → Database → Functions**

Create new function: `notify_order_update`

```sql
CREATE OR REPLACE FUNCTION notify_order_update()
RETURNS trigger AS $$
BEGIN
  -- This will be triggered when order status changes
  -- For MVP, we'll just log it
  -- Later, integrate with WhatsApp API
  
  RAISE NOTICE 'Order % status changed to %', NEW.id, NEW.status;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER on_order_status_change
  AFTER UPDATE ON pre_orders
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION notify_order_update();
```

### Step 2: Frontend Notification Component

**For your MVP, create a simple notification system:**

```typescript
// src/utils/notifications.ts
export async function notifyOrderCreated(order: any) {
  // Get seller details
  const { data: stall } = await supabase
    .from('seller_stalls')
    .select('contact_number, stall_name')
    .eq('id', order.stall_id)
    .single();
  
  // Create WhatsApp link for seller
  const sellerWhatsApp = `https://wa.me/60${stall.contact_number}?text=Hi! New order #${order.id} from customer. Please check your dashboard.`;
  
  // For MVP: Show alert with WhatsApp link
  alert(`Order created! Seller will be notified. Contact seller: ${sellerWhatsApp}`);
  
  // TODO: Later, send actual WhatsApp message via API
}
```

---

## 📋 MVP SETUP CHECKLIST

### Database Setup (Do this first!)

- [ ] Run the RLS policy fix SQL (above)
- [ ] Create your admin account via website
- [ ] Manually add admin role in user_roles table
- [ ] Test admin login

### For Each New Seller Registration:

- [ ] Verify their email and category
- [ ] Contact via WhatsApp for payment
- [ ] Create entry in `seller_stalls` table:
  ```sql
  INSERT INTO seller_stalls (
    seller_id,
    stall_name,
    location,
    category,
    contact_number
  ) VALUES (
    '[user_id_from_auth]',
    'Kuih Makcik Kiah',
    'Taiping, Perak - Pasar Malam Batu 2 1/2',
    'kuih-raya',
    '0123456789'
  );
  ```
- [ ] Add products for them (or let them add via dashboard)

### Notification Setup (For MVP):

**Simple approach:**
- [ ] Email notifications (Supabase has built-in email)
- [ ] WhatsApp links in emails
- [ ] Manual WhatsApp for important updates

**Future enhancement:**
- [ ] Integrate Twilio/Wati for automated WhatsApp
- [ ] Push notifications
- [ ] SMS backup

---

## 🎬 PERFECT FOR YOUR PhD RESEARCH!

Qash, this journey documenting pasar malam digitalization is BRILLIANT for your research! 🎓

**AI as Co-Researcher aspects you're demonstrating:**
- AI helping you build technical platform (me! 🤖)
- AI understanding cultural context (pasar malam preservation)
- AI as development partner (learning Supabase together)
- AI bridging technical and non-technical knowledge

**For your documentary:**
- Show how you learned to code with AI
- Capture sellers' reactions to seeing their digital stall
- Document the transformation journey state by state

---

## 🆘 QUICK HELP

**If localhost shows error:**
1. Check .env file has correct Supabase keys
2. Run the RLS fix SQL above
3. Restart dev server: `npm run dev`

**To test everything works:**
```bash
# Terminal 1: Start server
npm run dev

# Open browser
http://localhost:8080

# Try to:
1. Register as customer ✅
2. Browse products ✅
3. Login as admin (after fixing RLS) ✅
```

**Need help?** WhatsApp yourself: +60193438388 😄

---

**Selamat maju jaya with your PhD and Pasar Malam AI! 🇲🇾🎓🤖**

You're making history, Qash! Documenting this journey will inspire future researchers and sellers! 

Let's save Malaysia's pasar malam culture together! 💪✨
