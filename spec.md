# Victory Caloocan Kids Church — Web Application Specification

**Document:** `spec.md`  
**Project Name:** Victory Caloocan Kids Church  
**Application Type:** Web application for child registration and QR-based Kids Church attendance  
**Primary Stack:** Next.js + TypeScript, Supabase, GitHub, Vercel  
**Development Agent:** Claude Code  
**Status:** Version 1 specification

---

## 1. Project Purpose

Build a web application for **Victory Caloocan Kids Church** that replaces the current handwritten logbook used to register children every Saturday/Sunday.

Parents or guardians should register once, add one or more children to their account, and receive a permanent unique QR code for each child. On future Kids Church visits, the child's QR code is scanned using a physical USB QR/barcode reader connected to the Admin laptop. The scan should automatically record attendance with a timestamp and immediately display the child's information on the Admin dashboard for visual validation.

The system must prioritize:

- Fast check-in
- Simple operation for church volunteers
- Accurate and readable records
- Child and guardian data privacy
- Permanent individual QR codes
- Real-time attendance display
- Easy parent/guardian registration at the church
- Historical attendance reporting

---

## 2. Current Context

Victory Caloocan Kids Church currently uses a physical logbook.

Every time a child attends, the parent/guardian manually writes information such as:

- Child's name
- Age
- Gender
- Guardian name
- Contact number

This process repeats every week.

---

## 3. Problem Statement

The handwritten process is:

- Repetitive and tedious
- Slow during busy check-in periods
- Prone to handwriting and transcription errors
- Difficult to search
- Difficult to preserve historically
- Difficult to summarize for attendance reporting
- Inefficient for returning children whose information has already been collected

---

## 4. Proposed Solution

Create a web application with two primary user roles:

1. **Member / Parent-Guardian**
2. **Admin**

A parent/guardian registers once using a mobile number and password. The account can contain multiple children.

Each child receives a **unique, permanent QR code**.

For future visits:

1. Admin opens the current Kids Church session.
2. Parent presents the child's QR code.
3. Admin scans it using a USB QR/barcode scanner.
4. Attendance is automatically recorded.
5. The child appears immediately on the Admin attendance dashboard.
6. The Admin visually verifies the displayed child/guardian information.
7. A duplicate scan for the same child during the same session must not create another attendance record.

---

# 5. Version 1 Scope

## Included

- Parent/guardian account registration
- Mobile number + password authentication
- Optional parent email address
- Guardian relationship
- One guardian account with multiple children
- Add child
- Edit guardian information
- Edit child information
- Admin-only child archive/deactivation
- Permanent QR code per child
- QR display in Member portal
- Optional QR delivery by email
- Admin-created Kids Church sessions
- USB QR scanner support
- Automatic attendance recording
- Duplicate attendance prevention
- Real-time attendance dashboard
- Attendance history for Admins
- Multiple Admin accounts
- Manual administration of records
- Responsive web interface
- Supabase Row Level Security
- GitHub source control
- Vercel deployment readiness

## Not Included in Version 1

- SMS OTP verification
- Check-out / pickup scanning
- Parent-visible attendance history
- Parent self-service deletion of children
- Multiple church branches
- Native mobile application
- Push notifications
- SMS notifications
- Online remote parent self-service from personal devices as the intended workflow
- Advanced analytics
- Printer integration
- QR expiration

These may be added in later phases.

---

# 6. Important Product Decisions

## 6.1 One QR Code Per Child

Every child must have an individual QR code.

If a guardian has three children, the account must have three separate permanent QR codes.

QR codes must never be shared between siblings.

---

## 6.2 QR Code Must NOT Contain Personal Information

Do **not** encode any of the following directly into the QR code:

- Guardian name
- Phone number
- Email
- Child name
- Birthday
- Gender
- Age
- Address/city

The QR code must contain only an **opaque unique token** that identifies the child.

Example conceptual payload:

```text
vckc:<secure-random-token>
```

The token is looked up securely by the server after scanning.

This ensures that somebody using a generic QR reader cannot directly read the child's or guardian's personal information.

### QR requirements

- One unique token per child
- Token generated using a cryptographically secure random value
- Token stored securely in Supabase
- Token must have a unique database constraint
- QR does not expire
- QR must remain valid when guardian/child details are edited
- QR may only be regenerated/replaced by an Admin if a future security requirement requires it
- Never use sequential child IDs as the QR value

---

# 7. User Roles

## 7.1 Member / Parent-Guardian

A Member can:

- Register an account
- Log in using mobile number + password
- View their profile
- Edit permitted guardian information
- Add children
- View children attached to their account
- Edit their children's information
- View each child's QR code
- Request/resend a child's QR to their registered email if an email exists
- Log out

A Member cannot:

- View another guardian's information
- View another guardian's children
- View attendance history
- Scan attendance through the Admin scanner screen
- Create or close Kids Church sessions
- Delete/archive children
- Create Admin users
- View the Admin dashboard

### Intended Member access

The Member registration/profile interface is intended to be used on the **church registration laptop**, not as a general remote self-service portal on the parent's personal device.

For Version 1, implement a **Registration Station gate**:

- Member registration/login pages used for creating/editing church records should require the browser/device to be placed into Registration Station mode by an Admin.
- Registration Station mode should be activated with an Admin-authenticated action.
- Do not rely only on hiding URLs in the UI.
- Normal Admin authentication and server authorization must still apply.
- The technical design should allow this restriction to be relaxed in a future version.

This requirement prevents the intended workflow from becoming an unrestricted public profile-editing portal.

---

## 7.2 Admin

Multiple Admin accounts must be supported.

An Admin can:

- Log in
- Access Admin dashboard
- Create/open a Kids Church session
- Close a session
- Use the QR scanner/check-in page
- See attendance appear in real time
- View today's/current session attendance
- View historical attendance
- Search attendance
- Search guardians
- Search children
- View guardian and child details
- Archive/deactivate a child
- Reactivate an archived child
- Manage incorrect attendance records if necessary
- Activate/deactivate Registration Station mode
- Resend QR code email when a guardian has an email
- Create/manage other Admin accounts if granted Admin-management permission

An Admin must never see passwords.

---

# 8. Authentication

Use **Supabase Auth**.

## Parent/Guardian Authentication

Primary sign-in identifier:

```text
Mobile Number + Password
```

Requirements:

- Use international E.164 storage format when sending the phone number to Supabase Auth.
- Philippine numbers entered as `09XXXXXXXXX` should be normalized to `+639XXXXXXXXX`.
- Display validation errors in a user-friendly format.
- Mobile number must be unique per guardian account.
- Password must comply with the application's password rules.
- No OTP/SMS verification in Version 1.
- Architecture must allow SMS OTP or MFA to be introduced later.

## Admin Authentication

Admins should also use Supabase Auth.

Admin role must **not** be trusted from client-side state alone.

Role authorization must be backed by the database and Row Level Security.

---

# 9. Parent/Guardian Registration

## Required Fields

- Guardian Full Name
- Guardian Relationship
- Contact Number
- Home City
- Password
- Confirm Password

## Optional Field

- Email Address

Guardian Relationship values:

- Mother
- Father
- Grandmother
- Grandfather
- Relative
- Legal Guardian
- Other

If `Other` is selected, show an optional/free-text relationship field.

## Child Information During Registration

At least one child must be added before registration is considered complete.

For each child collect:

- Child Full Name
- Gender
- Birthday

Do **not** ask the user to manually maintain Current Age.

Age must be calculated dynamically from Birthday.

### Gender

Version 1 options:

- Male
- Female

Keep database design extensible so additional values can be introduced later without destructive migration.

---

# 10. Multiple Children

Registration must support multiple children.

UI requirement:

```text
Children

[ Child 1 Form ]

+ Add Another Child
```

A guardian can also add another child after account creation.

Recommended dashboard:

```text
My Children

┌──────────────────────────────┐
│ Juan Dela Cruz               │
│ Age 5 • Male                 │
│ [ View QR ] [ Edit Child ]   │
└──────────────────────────────┘

┌──────────────────────────────┐
│ Maria Dela Cruz              │
│ Age 7 • Female               │
│ [ View QR ] [ Edit Child ]   │
└──────────────────────────────┘

[ + Add Child ]
```

Parent/guardian must not have a Delete button.

---

# 11. Editing Information

The guardian may edit:

### Guardian

- Full name
- Relationship
- Contact number, subject to authentication/account update rules
- Home City
- Email address

### Child

- Full name
- Gender
- Birthday

Editing information must **not** change the child's QR token.

Changes must be reflected the next time the QR is scanned because the scanner retrieves current data from the database.

Historical attendance should preserve relevant check-in snapshots for audit/history.

---

# 12. Child Archive / Deactivation

Parents cannot delete or archive children.

Only an Admin can archive/deactivate a child.

Use soft deletion:

```text
is_active = false
archived_at
archived_by
```

Do not physically delete the child record if attendance history exists.

If an archived child's QR is scanned:

- Do not create attendance.
- Show a clear warning:

```text
CHILD RECORD INACTIVE
Please ask an Admin for assistance.
```

---

# 13. QR Generation

After a child is successfully created:

1. Generate a unique secure QR token.
2. Save the token to the child's database record.
3. Generate a QR image representing only the token.
4. Allow the Member to view the QR from the child dashboard.
5. If the guardian has an email address, automatically send the child's QR to that email.
6. If no email exists, skip email delivery without treating registration as failed.

The QR generation process must be idempotent.

A child must not receive a new QR token every time the QR screen is opened.

---

# 14. QR Email Delivery

Email is optional during guardian registration.

## If Email Exists

After child registration succeeds:

- Send a Kids Church QR email.
- Include:
  - Victory Caloocan Kids Church branding/text
  - Child's first/full name
  - QR code
  - Simple instruction to save the QR image/screenshot and present it during future check-in
  - Privacy reminder not to publicly share the QR code

Suggested subject:

```text
Victory Caloocan Kids Church — QR Code for <Child Name>
```

The QR may be:

- Embedded inline in the email, or
- Attached as a PNG

## If Email Does Not Exist

- Do not send email.
- Registration still succeeds.
- Display QR on screen.
- Guardian can take a photo/screenshot of the QR.

## Resend QR

If an email exists, Member or Admin can press:

```text
Send QR to Email
```

This resends the existing QR, not a newly generated QR.

## Email Provider

Use a transactional email abstraction.

Recommended Version 1 provider:

**Resend**

Keep email-sending logic behind a server-side service/module so the provider can be replaced later.

Never expose the email provider API key to the browser.

---

# 15. Kids Church Sessions

Attendance must be grouped into Kids Church sessions rather than being an unstructured stream of timestamps.

Example:

```text
Sunday Kids Church
September 20, 2026
9:00 AM
Status: OPEN
```

## Session Fields

- Session ID
- Session Name
- Session Date
- Optional Service Time
- Status: `open` or `closed`
- Opened By
- Opened At
- Closed By
- Closed At
- Created At

## Rules

- Admin creates/opens a session before scanning begins.
- Scanner page must clearly show the currently active session.
- A scan must not create attendance if no session is open.
- Version 1 should allow only **one active/open session at a time** for this church unless explicitly changed later.
- Closing a session prevents new scans from being assigned to it.
- Admin can open the next service/session afterward.

This enables accurate reporting per service/day.

---

# 16. Physical QR Scanner Workflow

Primary hardware:

```text
USB QR / Barcode Scanner
```

Assume the scanner behaves as a keyboard/HID device:

1. Scanner reads QR.
2. It types the token into the focused input.
3. Scanner sends `Enter`.
4. Web app processes the scan.

## Scanner Page Requirements

- Always keep scan input focused.
- Input may be visually minimized/hidden but must remain accessible.
- Process scan on Enter.
- Automatically clear input after processing.
- Return focus immediately to the scan input.
- No mouse click should be required between successful scans.
- Debounce rapid duplicate scanner input.
- Reject malformed/non-Victory QR payloads.
- Display clear success/error feedback.
- Must work efficiently for back-to-back children.

Optional future/fallback:

- Camera-based scanning may be added later.
- It is not required for Version 1.

---

# 17. Check-In Workflow

When Admin scans a valid child QR:

1. Read QR token.
2. Validate payload format.
3. Look up child using QR token.
4. Verify child exists.
5. Verify child is active.
6. Verify guardian/account relationship exists.
7. Verify an active Kids Church session exists.
8. Check whether an attendance row already exists for:
   - current session
   - same child
9. If not duplicated:
   - calculate current age from birthday
   - create attendance record
   - store check-in timestamp
   - store attendance snapshot data
10. Display the child immediately on the Admin screen.
11. Update the attendance table in real time.

No confirmation button is required.

**Scan = Check In.**

---

# 18. Duplicate Scan Handling

A child can only be checked in **once per Kids Church session**.

Enforce this at both:

1. Application level
2. Database level

Database must include a unique constraint equivalent to:

```text
UNIQUE(session_id, child_id)
```

If duplicate:

- Do not create another row.
- Do not update the original timestamp.
- Show:

```text
Already Checked In
Juan Dela Cruz
Checked in at 9:15 AM
```

Use visible warning styling and an optional short sound/feedback if implemented.

---

# 19. Successful Scan Display

After a successful scan, prominently show:

```text
CHECKED IN

Juan Dela Cruz
Age 5
Male

Guardian: Maria Dela Cruz
Relationship: Mother
Contact: 09XX XXX XXXX

Check-in: 9:15:32 AM
```

Keep the most recent successful scan visible long enough for an Admin to visually verify the child.

The attendance table should update without a full browser refresh.

---

# 20. Admin Dashboard

The Admin dashboard should show:

## Current Session Summary

- Session name
- Date
- Session status
- Total checked in

Optional useful Version 1 summary cards:

- Total Children
- Male
- Female

Age group cards are optional and may be added if they do not complicate Version 1.

## Live Attendance Table

Required columns:

| Date       | Time    | Child          | Age | Gender | Guardian        | Relationship | Contact | Status     |
| ---------- | ------- | -------------- | --: | ------ | --------------- | ------------ | ------- | ---------- |
| 09/20/2026 | 9:02 AM | Juan Dela Cruz |   5 | Male   | Maria Dela Cruz | Mother       | 09XX... | Checked In |

The **Date must be the first column**.

Default sorting:

```text
Newest check-in first
```

Admin must be able to search/filter at minimum by:

- Child name
- Guardian name
- Contact number

---

# 21. Real-Time Behavior

Attendance created from the scanner must appear in the Admin dashboard without manual page refresh.

Use Supabase Realtime.

Recommended implementation:

- For Version 1/simple church scale, Supabase Realtime database-change subscription is acceptable.
- Keep the implementation modular so a Broadcast-based architecture can be adopted later if scale requires it.
- RLS must protect all realtime-readable records.

If realtime temporarily disconnects:

- Show connection status.
- Automatically reconnect.
- Perform a fresh attendance query after reconnecting to avoid missing records.

---

# 22. Attendance History

Attendance history is Admin-only.

Admins should be able to:

- Select a session
- Select/date-filter historical records
- Search child
- Search guardian
- Search contact number
- See attendance timestamp
- See snapshot information captured during check-in

Parents must not see attendance history in Version 1.

---

# 23. Attendance Snapshot Strategy

The attendance row should reference the actual child and guardian IDs, but also preserve important data as it appeared at check-in.

Recommended attendance snapshots:

- Child name snapshot
- Child gender snapshot
- Child age snapshot
- Guardian name snapshot
- Guardian relationship snapshot
- Guardian contact snapshot

Reason:

If a guardian edits a child's name or contact information later, historical attendance should still represent what was recorded at the time of attendance.

The current Admin profile screens should show current information; historical attendance can show snapshot values.

---

# 24. Database Design

Use Supabase PostgreSQL.

Recommended tables:

---

## 24.1 `profiles`

Represents authenticated users.

Suggested columns:

```sql
id uuid primary key references auth.users(id)
role text not null check (role in ('member', 'admin'))
full_name text not null
phone text unique
email text null
home_city text null
guardian_relationship text null
guardian_relationship_other text null
is_active boolean not null default true
created_at timestamptz not null default now()
updated_at timestamptz not null default now()
```

Notes:

- `id` corresponds to Supabase Auth user ID.
- Admin profile fields that do not apply may be null.
- Do not store passwords here.
- Passwords remain managed by Supabase Auth.

---

## 24.2 `children`

Suggested columns:

```sql
id uuid primary key default gen_random_uuid()
guardian_id uuid not null references profiles(id)
full_name text not null
gender text not null
birthday date not null
qr_token text not null unique
is_active boolean not null default true
archived_at timestamptz null
archived_by uuid null references profiles(id)
created_at timestamptz not null default now()
updated_at timestamptz not null default now()
```

Do not store a permanent `age` column.

Calculate age from `birthday`.

---

## 24.3 `church_sessions`

Suggested columns:

```sql
id uuid primary key default gen_random_uuid()
name text not null
session_date date not null
service_time time null
status text not null check (status in ('open', 'closed'))
opened_by uuid null references profiles(id)
opened_at timestamptz null
closed_by uuid null references profiles(id)
closed_at timestamptz null
created_at timestamptz not null default now()
updated_at timestamptz not null default now()
```

Enforce only one open session in Version 1 using application logic plus a suitable database constraint/index where practical.

---

## 24.4 `attendance`

Suggested columns:

```sql
id uuid primary key default gen_random_uuid()
session_id uuid not null references church_sessions(id)
child_id uuid not null references children(id)
guardian_id uuid not null references profiles(id)

checked_in_at timestamptz not null default now()
checked_in_by uuid not null references profiles(id)

child_name_snapshot text not null
child_gender_snapshot text not null
child_age_snapshot integer not null

guardian_name_snapshot text not null
guardian_relationship_snapshot text null
guardian_contact_snapshot text not null

created_at timestamptz not null default now()

unique(session_id, child_id)
```

---

## 24.5 `registration_stations`

Recommended to support church-laptop-only Member editing workflow.

Suggested columns:

```sql
id uuid primary key default gen_random_uuid()
name text not null
station_token_hash text not null
is_active boolean not null default true
activated_by uuid not null references profiles(id)
created_at timestamptz not null default now()
last_used_at timestamptz null
```

Implementation may use a secure HttpOnly station cookie/session issued after Admin authorization rather than exposing the token.

---

## 24.6 Optional `audit_logs`

Recommended for sensitive Admin actions.

Suggested event examples:

- Child archived
- Child reactivated
- Session opened
- Session closed
- Attendance removed/corrected
- Admin created
- QR manually regenerated in a future feature

Suggested columns:

```sql
id uuid primary key default gen_random_uuid()
actor_id uuid null references profiles(id)
action text not null
entity_type text not null
entity_id uuid null
metadata jsonb null
created_at timestamptz not null default now()
```

---

# 25. Row Level Security (RLS)

Enable RLS for all application tables.

Never rely only on client-side route protection.

## Member Rules

A Member may:

- Read/update their own profile
- Read their own children
- Insert children belonging to themselves
- Update their own active children

A Member may not:

- Read other profiles
- Read other children
- Read attendance
- Read all church sessions unless needed by a safe endpoint
- Archive children
- Change their own role
- Access Admin-only data

## Admin Rules

Admins may:

- Read guardians
- Read children
- Read attendance
- Create/manage sessions
- Insert attendance through authorized server logic
- Archive/reactivate children
- Perform approved administrative actions

## Critical Role Security

A Member must never be able to update:

```text
role = 'admin'
```

Client-supplied role values must never determine authorization.

Admin elevation must be a protected server/Admin operation.

---

# 26. Server-Side Check-In Endpoint

Do not perform the entire attendance check-in purely from exposed browser database writes.

Create a protected server-side endpoint/action such as:

```text
POST /api/admin/check-in
```

Input:

```json
{
  "qrPayload": "vckc:..."
}
```

Server responsibilities:

1. Verify authenticated user.
2. Verify user is Admin.
3. Validate QR payload format.
4. Find active child.
5. Find/open current session.
6. Check duplicate attendance.
7. Calculate age.
8. Build snapshot data.
9. Insert attendance.
10. Return safe display data.

Example success response:

```json
{
  "status": "checked_in",
  "child": {
    "name": "Juan Dela Cruz",
    "age": 5,
    "gender": "Male"
  },
  "guardian": {
    "name": "Maria Dela Cruz",
    "relationship": "Mother",
    "contact": "09XXXXXXXXX"
  },
  "checkedInAt": "..."
}
```

Example duplicate:

```json
{
  "status": "already_checked_in",
  "checkedInAt": "..."
}
```

Use database uniqueness as the final defense against race conditions.

---

# 27. Age Calculation

Age is calculated from birthday and the relevant date.

For live/current profiles:

```text
Age as of today
```

For attendance:

```text
Age as of session/check-in date
```

Handle cases where the birthday for the current year has not yet occurred.

Do not approximate with:

```text
currentYear - birthYear
```

without month/day comparison.

---

# 28. Time Zone

Use:

```text
Asia/Manila
```

Store timestamps in PostgreSQL as `timestamptz`/UTC-compatible values.

Convert to Asia/Manila for display.

Display date example:

```text
09/20/2026
```

Display time example:

```text
9:15:32 AM
```

---

# 29. Main Pages / Routes

Recommended Next.js App Router structure.

## Public / Station

```text
/
 /login
 /register
```

Registration/login access for Members must honor Registration Station rules.

## Member

```text
/member
/member/profile
/member/children/new
/member/children/[childId]
/member/children/[childId]/edit
/member/children/[childId]/qr
```

## Admin

```text
/admin
/admin/scanner
/admin/sessions
/admin/sessions/[sessionId]
/admin/attendance
/admin/guardians
/admin/children
/admin/children/[childId]
/admin/settings
/admin/admin-users
```

Route names may be adjusted if Claude Code finds a cleaner Next.js convention, but permissions and workflows must remain unchanged.

---

# 30. Member Dashboard

Member dashboard must show:

- Guardian name
- Optional email status
- Children
- Add Child button

Each child card should include:

- Full name
- Current calculated age
- Gender
- `View QR`
- `Edit Child`

If email exists:

- `Send QR to Email`

If no email exists:

Show:

```text
No email address on file.
You can display this QR and take a photo/screenshot for future use.
```

---

# 31. Admin Scanner UI

The scanner page is operationally critical.

Recommended layout:

```text
---------------------------------------------------------
Victory Caloocan Kids Church

CURRENT SESSION
Sunday Kids Church — Sep 20, 2026 — OPEN

[ Scanner ready... ]

LAST SCAN
┌───────────────────────────────────────┐
│ CHECKED IN                            │
│ Juan Dela Cruz                        │
│ Age 5 • Male                          │
│ Guardian: Maria Dela Cruz             │
│ Mother • 09XXXXXXXXX                  │
│ 9:15:32 AM                            │
└───────────────────────────────────────┘

Today's Attendance: 42

Live Attendance Table
---------------------------------------------------------
```

The UI should be usable by non-technical church volunteers.

Prioritize:

- Large readable text
- Obvious success/error state
- Minimal buttons during check-in
- Strong keyboard/scanner behavior
- Fast response

---

# 32. Error States

Handle gracefully.

## Invalid QR

```text
Invalid Kids Church QR Code
```

No attendance inserted.

## Unknown QR

```text
QR Code Not Recognized
Please ask an Admin for assistance.
```

## Inactive Child

```text
Child Record Inactive
```

## No Open Session

```text
No Kids Church Session Is Open
Open a session before scanning attendance.
```

## Duplicate

```text
Already Checked In
Checked in at 9:15 AM
```

## Network Failure

```text
Unable to record attendance.
Check the internet connection and scan again.
```

Do not show a false successful check-in when the database write has failed.

---

# 33. Email Failure Handling

Email delivery must not roll back successful child registration.

Example:

- Child creation succeeds.
- QR creation succeeds.
- Email fails.

Result:

```text
Registration successful.
QR code created.
We could not send the QR email. You can view it on screen and try sending it again.
```

Log email errors server-side without exposing API keys or sensitive provider output to the Member.

---

# 34. Privacy and Security Requirements

The application stores information about minors, so use conservative privacy defaults.

Requirements:

- Never put PII directly in QR codes.
- Do not expose Supabase service-role key to browser code.
- Do not expose Resend/email API keys to browser code.
- Use RLS.
- Use server-side authorization for Admin operations.
- Minimize data displayed where not needed.
- Do not log passwords.
- Do not log complete QR tokens in production logs.
- Avoid logging full phone numbers unnecessarily.
- Use HTTPS in production.
- Use secure cookies.
- Protect Admin routes.
- Validate all server input.
- Normalize and validate phone numbers.
- Validate email only when provided.
- Escape/render user-entered text safely.
- Use soft deletion for children.
- Preserve auditability of sensitive Admin changes.
- Do not store secrets in GitHub.

---

# 35. Validation Rules

## Guardian

### Full Name

- Required
- Trim whitespace
- Reasonable max length

### Contact Number

- Required
- Validate Philippine mobile format in Version 1
- Normalize to E.164 for Supabase Auth
- Must be unique

### Home City

- Required
- Text/select implementation may be simple in V1

### Email

- Optional
- Validate format only when supplied
- Store normalized lowercase form

### Password

- Required
- Use minimum acceptable security rule
- Show password/confirm-password mismatch clearly

## Child

### Full Name

- Required
- Trim whitespace

### Gender

- Required

### Birthday

- Required
- Cannot be a future date
- Add a reasonable child-age validation warning/range if desired, but do not block legitimate data without an agreed church policy

---

# 36. Technology Stack

## Application

- **Next.js**
- **TypeScript**
- **App Router**
- Server Components where appropriate
- Server Actions or Route Handlers for protected server operations

## UI

Recommended:

- Tailwind CSS
- Accessible reusable components
- Mobile-friendly registration forms
- Desktop-optimized Admin scanner/dashboard

Do not add a large UI framework unless it materially improves maintainability.

## Database / Auth / Realtime

- **Supabase PostgreSQL**
- **Supabase Auth**
- **Supabase Row Level Security**
- **Supabase Realtime**

## QR

Use a maintained QR-generation library compatible with Next.js/Node/browser requirements.

QR value must be the opaque application token only.

## Email

- Resend recommended for V1
- Server-side only

## Repository

- **GitHub**

## Hosting

- **Vercel** in deployment phase

---

# 37. GitHub Requirements

GitHub is the source of truth for application code.

Claude Code should:

1. Work inside a Git repository.
2. Use a clear branch/commit workflow.
3. Commit after meaningful implementation milestones.
4. Push code to the configured GitHub repository.
5. Never commit `.env.local`.
6. Never commit API keys.
7. Provide `.env.example`.
8. Store database migrations in the repository.
9. Store README/setup instructions in the repository.
10. Avoid leaving important project code/configuration only in an unmanaged local location.

Suggested branches:

```text
main
develop
feature/*
```

For a solo project, using `main` plus short-lived feature branches is also acceptable.

---

# 38. Suggested Repository Structure

```text
victory-caloocan-kids-church/
├── app/
│   ├── (auth)/
│   ├── member/
│   ├── admin/
│   └── api/
├── components/
│   ├── admin/
│   ├── member/
│   ├── qr/
│   └── ui/
├── lib/
│   ├── auth/
│   ├── supabase/
│   ├── qr/
│   ├── email/
│   ├── validation/
│   └── utils/
├── supabase/
│   └── migrations/
├── types/
├── public/
├── .env.example
├── .gitignore
├── README.md
└── spec.md
```

Claude Code may adjust structure to follow current Next.js conventions while preserving separation of concerns.

---

# 39. Environment Variables

Example only:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=

SUPABASE_SERVICE_ROLE_KEY=

RESEND_API_KEY=
EMAIL_FROM=

APP_URL=
APP_TIMEZONE=Asia/Manila
```

Rules:

- `.env.local` must be ignored by Git.
- `.env.example` contains names only, not secrets.
- Service-role and email keys are server-only.
- Never prefix a secret with `NEXT_PUBLIC_`.

---

# 40. Supabase Migration Requirements

Do not manually create production schema without keeping migrations.

Claude Code should create SQL migrations for:

- Tables
- Constraints
- Indexes
- RLS enablement
- RLS policies
- Updated-at triggers if used
- One-open-session enforcement where feasible
- Realtime configuration needed by the project

Migrations must be committed to GitHub.

---

# 41. Recommended Indexes

At minimum consider:

```text
profiles(phone)
children(guardian_id)
children(qr_token)
children(is_active)
church_sessions(session_date)
church_sessions(status)
attendance(session_id)
attendance(child_id)
attendance(checked_in_at)
```

Unique:

```text
profiles.phone
children.qr_token
attendance(session_id, child_id)
```

Optimize only after correctness, but avoid obvious full-table scans for scanner lookup.

---

# 42. Admin Session Flow

## Before Kids Church

Admin:

1. Logs in.
2. Opens Admin Dashboard.
3. Creates or selects today's session.
4. Opens the session.
5. Goes to Scanner.
6. Scanner page shows:

```text
Scanner Ready
Sunday Kids Church
September 20, 2026
```

## During Kids Church

For each child:

1. Parent presents QR.
2. Volunteer scans.
3. App records attendance.
4. Child details appear.
5. Volunteer visually validates.
6. Next scan can happen immediately.

## After Kids Church

Admin:

1. Reviews totals.
2. Closes the session.
3. Attendance remains accessible in history.

---

# 43. Parent First-Time Flow

On church Registration Laptop:

1. Admin enables Registration Station mode.
2. Parent selects `Create Account`.
3. Parent enters:
   - Guardian name
   - Relationship
   - Mobile number
   - Home City
   - Optional email
   - Password
4. Parent adds first child.
5. Parent can press `+ Add Another Child`.
6. Submit.
7. Account is created.
8. Children are created.
9. One QR per child is generated.
10. QR cards are displayed.
11. If email exists, QR emails are sent.
12. Parent saves/takes a photo of each QR.
13. Parent logs out.

---

# 44. Returning Parent Flow

At church Registration Laptop:

1. Parent logs in using mobile number + password.
2. Parent sees their children.
3. Parent may:
   - Add a child
   - Edit child information
   - Edit allowed guardian information
   - View QR
   - Send QR to email if email exists
4. Parent logs out.

The primary weekly check-in flow should **not require login** if the parent already has the QR.

---

# 45. Forgotten QR Flow

No Admin manual name-based attendance check-in is required in V1.

If the parent forgot the QR:

1. Parent uses the church Registration Laptop.
2. Parent logs in.
3. Parent opens the child's QR.
4. Parent displays it on screen.
5. The Admin QR reader scans the displayed QR.
6. Normal attendance process runs.

The parent may also take a photo of the displayed QR for future visits.

---

# 46. QR Email Behavior for Multiple Children

If a guardian registers multiple children:

Option A, recommended:

- Send one email per child.

Reason:

- Easier to save/share the correct QR for each child.
- Clear subject naming.

Example:

```text
Victory Caloocan Kids Church — QR Code for Juan Dela Cruz
Victory Caloocan Kids Church — QR Code for Maria Dela Cruz
```

Do not combine multiple children into one shared QR.

---

# 47. Accessibility / Usability

Registration and Admin screens should:

- Use labels, not placeholder-only forms
- Have keyboard-friendly navigation
- Have clear validation messages
- Use high-contrast status states
- Avoid tiny scanner feedback
- Use readable table text
- Use loading states
- Disable repeat submits while processing
- Prevent accidental double form submission
- Confirm sensitive Admin actions such as archive

Admin scanner flow should be usable without a mouse during normal scanning.

---

# 48. Performance Goals

For normal church internet conditions:

- Successful QR lookup/check-in should feel near-instant.
- Admin should not need to refresh the page.
- Scanner should be ready for the next scan immediately after the previous request completes.
- Queries should retrieve only necessary fields.
- Avoid loading full historical attendance on the live scanner page.

No formal high-scale performance target is necessary for V1.

---

# 49. Testing Requirements

Claude Code must include meaningful automated tests where practical.

At minimum test:

## Authentication/Authorization

- Member cannot access Admin route.
- Member cannot promote themselves to Admin.
- Member cannot read another guardian.
- Member cannot read another guardian's children.
- Member cannot read attendance.

## Children

- Guardian can add child.
- Guardian can edit own child.
- Guardian cannot archive child.
- QR token remains unchanged after normal profile edits.

## QR

- Valid QR identifies correct child.
- Invalid QR rejected.
- Unknown QR rejected.
- Archived child rejected.

## Attendance

- Valid scan creates attendance.
- Timestamp is created.
- Snapshot fields are stored.
- Duplicate scan does not create second record.
- No open session means no attendance.
- Unique database constraint protects against concurrent duplicates.

## Email

- Email omitted: registration succeeds and no email send attempted.
- Valid email: existing child QR is sent.
- Email failure does not delete child or invalidate registration.

## Session

- Admin can open session.
- Member cannot open session.
- Scan goes to correct active session.
- Closed session rejects new attendance.

---

# 50. Acceptance Criteria

Version 1 is considered functionally complete when all of the following work:

1. A guardian can create an account on the Registration Station using a mobile number and password.
2. Email is optional.
3. Guardian can register one or multiple children.
4. Birthday is stored and age is automatically calculated.
5. Each child receives a different permanent QR.
6. QR contains no PII.
7. Guardian can later add another child.
8. Guardian can edit their own permitted information at the church Registration Station.
9. Guardian can edit their children's information.
10. Editing does not change an existing QR.
11. Parent cannot delete/archive a child.
12. Admin can archive/reactivate a child.
13. Multiple Admin accounts are supported.
14. Admin can create/open/close Kids Church sessions.
15. USB scanner can submit QR without mouse interaction.
16. Valid QR automatically records attendance.
17. Attendance has a precise timestamp.
18. Duplicate child scan in the same session is prevented.
19. Child data appears immediately after scan.
20. Live attendance table updates without a page refresh.
21. Date is the first attendance table column.
22. Admin can view historical attendance.
23. Parents cannot view attendance history.
24. If optional email exists, QR can be emailed.
25. If email does not exist, QR remains available on screen.
26. Email failure does not cause registration failure.
27. Supabase RLS prevents cross-account unauthorized access.
28. Secrets are never committed to GitHub.
29. Database migrations are committed to GitHub.
30. Project is ready to be deployed to Vercel.

---

# 51. Future Enhancements

Design Version 1 so these can be introduced later without rebuilding the application:

- SMS OTP / phone verification
- MFA
- Check-out/pickup scan
- Authorized pickup persons
- Parent self-service from personal devices
- Camera QR scanning
- QR reissue/revocation
- SMS notifications
- Email attendance confirmation
- Emergency contact
- Allergy/medical notes, only if church policy and privacy requirements justify collecting them
- Multiple Kids Church rooms
- Multiple service times
- Multiple church branches
- Attendance analytics
- Export to CSV/Excel
- Printable child labels
- Parent QR wallet/pass
- Offline check-in strategy
- Volunteer role separate from full Admin
- Fine-grained Admin permissions

---

# 52. Claude Code Implementation Instructions

Claude Code should treat this document as the product and technical source of truth.

## Implementation Principles

1. Do not remove specified requirements without explicit approval.
2. If a requirement is ambiguous, prefer the safest and simplest implementation consistent with this specification.
3. Favor maintainable code over unnecessary complexity.
4. Use TypeScript strictness.
5. Keep sensitive business logic server-side.
6. Implement authorization at database/server level, not only UI level.
7. Preserve privacy of children.
8. Keep QR values opaque and non-PII.
9. Use database constraints for critical invariants.
10. Use Git commits at meaningful milestones.
11. Keep schema changes in migrations.
12. Create/update README setup instructions as development progresses.
13. Do not hard-code production credentials.
14. Ensure the application runs cleanly before considering a phase complete.
15. Do not silently substitute an unrelated authentication or database architecture.

---

# 53. Recommended Build Phases

## Phase 1 — Project Foundation

- Create Next.js TypeScript project
- Configure formatting/linting
- Set up Git repository
- Connect GitHub
- Add `.env.example`
- Add Supabase clients
- Create base route/layout structure

## Phase 2 — Database and Security

- Create migrations
- Profiles
- Children
- Sessions
- Attendance
- Registration stations
- RLS
- Constraints
- Indexes

## Phase 3 — Authentication

- Member phone + password registration/login
- Admin authentication
- Role guards
- Registration Station gate

## Phase 4 — Guardian + Children

- Registration wizard
- Add multiple children
- Member dashboard
- Edit profile
- Add child
- Edit child
- Admin archive/reactivate

## Phase 5 — QR

- Secure token generation
- QR display
- Permanent token behavior
- Email QR delivery
- Resend function

## Phase 6 — Kids Church Sessions

- Create session
- Open session
- Close session
- Current session UI

## Phase 7 — Scanner + Attendance

- USB scanner input
- Protected check-in endpoint
- Duplicate handling
- Scan feedback
- Snapshot storage

## Phase 8 — Realtime Admin Dashboard

- Supabase Realtime
- Live table
- Summary counts
- Search/filter
- Reconnection handling

## Phase 9 — Attendance History

- Session history
- Date/search filters
- Admin-only access

## Phase 10 — Testing and Hardening

- Authorization tests
- QR tests
- Attendance race-condition test
- Form validation
- Error handling
- Security review
- UX review

## Phase 11 — Deployment Preparation

- Vercel configuration
- Production Supabase environment
- Production email domain/configuration
- Environment variables
- Production RLS verification
- Smoke tests

---

# 54. Definition of Done

The system is not done merely because the UI works.

It is done when:

- Primary workflows operate end-to-end.
- RLS/security rules are tested.
- Admin and Member permissions are correctly separated.
- Duplicate attendance is impossible at database level.
- QR codes reveal no child/guardian PII.
- QR codes remain stable after profile edits.
- Scanner workflow works using a keyboard-style USB QR reader.
- Attendance is visible live to Admins.
- Optional email behavior is reliable.
- Historical attendance is preserved.
- Secrets are protected.
- Migrations and source code are committed to GitHub.
- README contains setup/run/deployment instructions.
- Application is ready for Vercel deployment.

---

# 55. Final Product Summary

**Victory Caloocan Kids Church** is a child registration and attendance system.

A guardian registers once at the church, using a mobile number and password, and may add multiple children. Each child receives a permanent individual QR code. The QR contains no personal information and may be displayed from the Member portal or optionally delivered to the guardian's email.

Before a service, an Admin opens a Kids Church session. When a returning child arrives, the parent presents the child's QR. A USB QR scanner connected to the Admin laptop scans it, attendance is automatically recorded with a timestamp, duplicates are prevented, and the child's current information is displayed immediately for visual validation.

Supabase provides authentication, PostgreSQL storage, Row Level Security, and realtime updates. Next.js provides the web application. GitHub is the source of truth for code, and Vercel will host the production application in a later deployment phase.

The architecture must remain simple enough for a small church operation while being secure and extensible for future capabilities such as OTP, check-out, additional church services, and expanded reporting.
