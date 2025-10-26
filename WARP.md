# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

**Pasar Malam AI** is a marketplace platform for Malaysian night markets (pasar malam) with specialized features for Kuih Raya sellers during festive seasons. The platform connects customers with sellers for pre-orders and supports bulk orders, custom bundles, and lead time management.

**Tech Stack:**
- **Frontend:** React 18 with TypeScript, Vite
- **UI Framework:** shadcn-ui components, Tailwind CSS
- **Backend/Database:** Supabase (PostgreSQL with Row Level Security)
- **State Management:** @tanstack/react-query
- **Routing:** react-router-dom v6
- **Forms:** react-hook-form with Zod validation

## Development Commands

### Build & Run
```bash
npm i                  # Install dependencies
npm run dev           # Start dev server on port 8080
npm run build         # Production build
npm run build:dev     # Development build
npm run preview       # Preview production build
```

### Code Quality
```bash
npm run lint          # Run ESLint on codebase
```

**Note:** There is no test suite configured in this project. When making changes, rely on manual testing through the development server.

## Project Architecture

### Authentication & Authorization

The application uses a **role-based access control (RBAC)** system with three primary roles:
- **customer**: Browse products, place orders, track orders
- **seller**: Manage products, orders, subscriptions
- **admin**: System-wide management, payouts, approvals

**Key Files:**
- `src/utils/securityMiddleware.ts` - Role validation, ownership verification, password validation
- `src/pages/Dashboard.tsx` - Role-based dashboard routing
- Supabase RLS policies enforce database-level security

**Authentication Flow:**
1. Users authenticate via Supabase Auth
2. User roles stored in `user_roles` table (many-to-many)
3. Profile data in `profiles` table
4. Dashboard renders role-specific features based on `user_roles` query

### Database Schema Architecture

**Core Tables:**
- `profiles` - User profile information
- `user_roles` - Role assignments (supports multiple roles per user)
- `seller_stalls` - Seller marketplace stalls
- `products` - Product listings with Kuih Raya features
- `pre_orders` - Customer orders with bulk order support
- `order_items` - Line items for orders
- `pasar_malam_locations` - Physical market locations with geolocation

**Kuih Raya Specialized Features:**
- `products.fulfillment_lead_time_days` - Required lead time for production
- `products.is_bundle` - Custom product bundles/sets
- `products.bundle_components` - JSONB field for bundle configuration
- `pre_orders.order_type` - ENUM: 'STANDARD' or 'BULK'
- `pre_orders.estimated_fulfillment_date` - Production deadline tracking

**Database Access:**
- Supabase client: `src/integrations/supabase/client.ts`
- Type definitions: `src/integrations/supabase/types.ts` (auto-generated)
- Migrations: `supabase/migrations/*.sql`

### Routing Structure

Routes are organized by user role in `src/App.tsx`:

```
/ - Landing page (Index)
/auth - Authentication page
/auth/callback - OAuth callback handler
/auth/admin - Admin-specific login
/dashboard - Role-based dashboard

Customer Routes:
/products, /customer/browse, /customer/browse-products - Product browsing
/customer/cart - Shopping cart
/customer/orders - Order history
/customer/market-map - Stall location map

Seller Routes:
/seller/subscription - Subscription management

Admin Routes:
/admin/products - Product management
/admin/subscriptions - Seller subscription oversight
/admin/payouts - Payment processing

/tutorials - Help documentation
* - 404 Not Found
```

### Component Organization

**Layout:** Component files are organized by function, not by role.

**Specialized Components:**
- `BulkOrderManagement.tsx` - Aggregate view for bulk Kuih Raya orders
- `CustomBundleManagement.tsx` - Bundle creation for product sets
- `LeadTimeManagement.tsx` - Production deadline tracking
- `SecurityAudit.tsx` - Security validation dashboard
- `StallMap.tsx` - Leaflet-based stall location map
- `PaymentQR.tsx` - QR code payment display

**UI Components:** `src/components/ui/` contains shadcn-ui components. These should generally not be modified directly unless adding new shadcn components via `npx shadcn@latest add [component]`.

### Security Implementation

**Password Security:**
- Minimum 12 characters with complexity requirements
- HIBP (Have I Been Pwned) breach detection via API
- Zod schema validation in `securityMiddleware.ts`

**Data Protection:**
- Row Level Security (RLS) policies on all Supabase tables
- Ownership verification middleware for stalls and orders
- Client-side encryption utilities (basic obfuscation in MVP)

**Authorization Patterns:**
```typescript
// Check user role
const isAdmin = await hasRole('admin');

// Verify ownership
const canEdit = await verifyStallOwnership(stallId);
```

## Environment Configuration

**Required Variables (.env):**
```
VITE_SUPABASE_URL=<your-supabase-url>
VITE_SUPABASE_PUBLISHABLE_KEY=<your-anon-key>
```

**Note:** The `.gitignore` only excludes `node_modules`. The `.env` file is currently tracked in git (security risk). Consider adding `.env` to `.gitignore` and using `.env.example` for templates.

## Deployment

**Production:** Deployed to Netlify
- Build command: `npm run build`
- Publish directory: `dist`
- SPA redirect configured in `netlify.toml`
- Production URL: https://pasarmalamai.netlify.app

**Supabase:** Database hosted on Supabase cloud
- Apply migrations via Supabase CLI or dashboard
- Site URL configured in `client.ts`: https://pasarmalamai.netlify.app

## Key Patterns & Conventions

### State Management
- **React Query** for server state (caching, mutations, invalidation)
- **Local useState** for UI state
- Supabase real-time subscriptions for auth state changes

### Forms
- **react-hook-form** with **zod** validation
- Consistent error handling with `sonner` toast notifications

### Styling
- **Tailwind CSS** utility-first approach
- Theme configured in `tailwind.config.ts` with CSS variables
- Dark mode support via `next-themes` (class-based)

### TypeScript
- Strict mode disabled (`@typescript-eslint/no-unused-vars: "off"`)
- Type safety via Supabase-generated types
- Path alias `@/` maps to `src/`

### Data Fetching Pattern
```typescript
// Typical pattern with React Query + Supabase
const { data, isLoading } = useQuery({
  queryKey: ['products', stallId],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('stall_id', stallId);
    if (error) throw error;
    return data;
  }
});
```

## Database Migration Workflow

1. Create new migration file in `supabase/migrations/` with timestamp prefix
2. Name format: `YYYYMMDDHHMMSS_description.sql`
3. Include RLS policies and indexes
4. Test locally before deploying to production
5. Apply via Supabase dashboard or CLI: `supabase db push`

## Known Constraints

- No automated test suite (manual testing required)
- Client-side encryption is basic obfuscation (not cryptographically secure)
- Single payment method: QR codes (no integrated payment gateway)
- Mobile optimization complete but native app not available
- AI features are roadmap items (database prepared with timestamps/categories)

## Product-Specific Business Logic

**Kuih Raya Subscription (Peniaga Raya):**
- RM249 for 5-month subscription
- Managed in `SubscriptionManagement.tsx` and `SubscriptionPayment.tsx`
- Grants access to bulk order features and custom bundles

**Bulk Orders:**
- Aggregated view of multiple orders
- Filtering by status (pending, confirmed, fulfilled)
- Revenue tracking and production planning support

**Custom Bundles:**
- Sellers create product sets with component limits
- Bundle pricing separate from component prices
- JSONB storage for flexible component configuration

**Lead Time Management:**
- Mandatory fulfillment lead time per product
- Automatic calculation of estimated fulfillment dates
- Urgent/warning indicators for production deadlines
