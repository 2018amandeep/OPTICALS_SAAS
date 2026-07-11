# OptiFlow - Premium Optical Shop SaaS Platform

OptiFlow is a premium, multi-tenant SaaS application designed specifically for Optical Shops (opticians). This platform allows shop owners to manage patient records, input complex eye test prescriptions, print receipt envelopes replicating the physical **Malhotra Opticals** design, track deliveries, and send automated notifications (such as booking, readiness, or balance reminders) via WhatsApp.

---

## 🚀 Technology Stack
- **Framework**: [Next.js (App Router)](https://nextjs.org/) (React 19, TypeScript)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Database**: [MongoDB](https://www.mongodb.com/)
- **ORM / Driver**: [Mongoose](https://mongoosejs.com/)
- **Authentication**: JWT Session Cookies (HTTP-only)
- **Icons**: [Lucide React](https://lucide.dev/)

---

## 📦 Project Folder Structure
The codebase follows Next.js App Router conventions:
```
saas-opticals/
├── src/
│   ├── app/                    # Next.js App Router folders
│   │   ├── page.tsx            # SaaS Landing page
│   │   ├── login/              # Login screen
│   │   ├── register/           # Registration screen
│   │   └── dashboard/          # Sidebar nested sub-dashboard
│   │       ├── page.tsx        # Dashboard home (Stats & SVG Trend chart)
│   │       ├── layout.tsx      # Dashboard layout wrapper
│   │       ├── patients/       # Patient directory & dynamic Profile views
│   │       ├── orders/         # Orders collection & Digital Order Forms
│   │       └── settings/       # Shop metadata & WhatsApp templates edit
│   ├── components/
│   │   ├── DashboardLayout.tsx # Sidebar menu & light/dark mode switch
│   │   ├── OrderForm.tsx       # Complex order inputs (pre-fill & Edit)
│   │   ├── OrderReceipt.tsx    # Malhotra Opticals receipt layout & Print trigger
│   │   └── ui/                 # Reusable Input, Button, and Select elements
│   ├── lib/
│   │   ├── db.ts               # Cached MongoDB server connection logic
│   │   └── auth.ts             # JWT cryptography & password hashing helpers
│   └── models/
│       ├── Shop.ts             # Shop configurations & default message templates
│       ├── Patient.ts          # Demographics, contact info and history notes
│       └── Order.ts            # Ocular values, frame/lens details & financials
```

---

## 🗃️ Database Schema Design

### 1. Shop Schema (`models/Shop.ts`)
Stores registration credentials, layout parameters, and customizable WhatsApp notification messages:
- `name` / `email` / `password` (Hashed via bcrypt)
- `phone` / `address` (Shop coordinates printed on invoice header)
- `currency` (INR, USD, EUR) / `taxRate` (Percentage)
- `whatsappTemplateOrder`: Booking alert text
- `whatsappTemplateReady`: Collection alert text
- `whatsappTemplateBalance`: Outstanding balance alert text

### 2. Patient Schema (`models/Patient.ts`)
Patient demographics and tracking parameters:
- `shopId`: Reference to the owner Shop
- `code`: Custom identifier card code
- `name` / `phone` / `email`
- `age` / `gender` (Male, Female, Other)
- `address` / `notes` (Ophthalmic medical notes)

### 3. Order / Prescription Schema (`models/Order.ts`)
A fully-featured prescription, mapping to Malhotra Opticals receipt fields:
- `shopId` / `patientId`: Multi-tenant ownership keys
- `orderNumber`: Unique sequential invoice code (e.g. `OPT-YYMMDD-0001`)
- `bookingDate` / `deliveryDate`
- `optometrist` (Default doctor conducting refraction)
- `prescription`:
  - `right` (OD) & `left` (OS) metrics: `sph`, `cyl`, `axis`, `vsn` (Visual acuity)
- `ipd`: Interpupillary Distance
- `shapeChange`: (Yes, No, or Empty)
- `contactLens`: (Yes, No, or Empty)
- `pendingWork`: Free-form pending lab remarks
- `frame`: Frame descriptions (Brand, Color, Silhouette)
- `lenses`: Lenses details (Anti-reflection, single-vision/progressive, coatings)
- `financials`:
  - `amount`: Total retail price
  - `advance`: Deposit paid at booking
  - `balance`: Outstanding remaining amount (computed via hook)
- `status`: ('Ordered', 'In Lab', 'Ready', 'Delivered', 'Cancelled')
- `paymentStatus`: ('Paid', 'Partial', 'Unpaid') (derived automatically based on balance)

---

## 💻 Local Setup & Installation

### 1. Prerequisites
Make sure you have [Node.js](https://nodejs.org/) (v20+ recommended) and a running instance of [MongoDB](https://www.mongodb.com/try/download/community) locally.

### 2. Clone and install dependencies
Navigate into the workspace and run npm install:
```bash
cd saas-opticals
npm install
```

### 3. Configure Environment Variables
Create or verify the `.env.local` file in the root of the project:
```env
MONGODB_URI=mongodb://localhost:27017/optiflow
JWT_SECRET=super_secret_optiflow_key_2026_jwt_token
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Running the Development Server
Launch the compiler and boot the dev server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser to view the landing page.

---

## 🖨️ Malhotra Opticals Printing Architecture
OptiFlow includes a stylesheet print override inside `globals.css` and `OrderReceipt.tsx`:
1. It uses a **Print-Friendly CSS Wrapper** (`.print-area`).
2. When the user triggers the browser **Print Receipt** command (`window.print()`), a CSS `@media print` query suppresses all webpage navigation headers, settings sidebars, and actions overlays.
3. The layout automatically expands to print the pixel-perfect receipt envelope, replicating the exact table layout of the physical Malhotra Opticals slip.

---

## 💬 WhatsApp Automation Variable Legend
When configuring custom messages in **Shop Settings**, you can place dynamic variables inside bracket tokens. The notification engine parses the order details and substitutes these parameters automatically:

| Token | Description | Example Output |
| :--- | :--- | :--- |
| `{patientName}` | Full name of the patient | Rajesh Kumar |
| `{orderNumber}` | Unique booking receipt code | OPT-260707-0001 |
| `{totalAmount}` | Total invoice retail cost | ₹4,500 |
| `{advanceAmount}` | Advance payment deposit | ₹2,000 |
| `{balanceAmount}` | Outstanding pending collection | ₹2,500 |
| `{deliveryDate}` | Scheduled collection date | 7/14/2026 |
| `{shopName}` | Name of the registered business | Malhotra Opticals |

*Example Template:*
> `"Hello {patientName}, your glasses for order {orderNumber} are ready for pickup at {shopName}. Remaining Balance: {balanceAmount}."`

*Parses to:*
> `"Hello Rajesh Kumar, your glasses for order OPT-260707-0001 are ready for pickup at Malhotra Opticals. Remaining Balance: ₹2,500."`
# OPTICALS_SAAS
