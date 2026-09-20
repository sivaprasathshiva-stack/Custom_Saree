# VELVOREA Textile Studio — Product Requirements Document

**Document type:** Product Requirements Document (PRD) + Functional Requirements (FRD) + Technical Architecture  
**Product:** VELVOREA Textile Studio  
**Version:** 1.0  
**Status:** Product definition / implementation baseline  
**Primary experience:** Custom silk saree design → digital textile preview → NILA 3D drape → design-team submission  
**Core principle:** The customer creates a visual concept. VELVOREA's textile designers validate, refine, engineer, and manufacture the final textile.

---

# 1. Executive Product Definition

VELVOREA Textile Studio is a browser-based custom silk saree design experience for customers who want to turn an image, artwork, photograph, letter, word, motif, or simple visual idea into a silk saree concept.

The product is **not intended to be Photoshop, Illustrator, or professional textile CAD**.

The experience should be intentionally simple:

> **Choose Saree → Add Idea → Position / Scale → Choose Colour → Preview Woven Textile → Drape on NILA → Submit to VELVOREA**

The customer should not need to understand textile engineering.

VELVOREA's system should hide technical complexity behind a simple interface and provide an increasingly realistic visualization of the customer's idea.

The final output shown by the application is a **digital concept/sample visualization**, not a production-approved textile specification.

The production workflow begins only after the customer submits the concept to VELVOREA.

---

# 2. Product Vision

## 2.1 Vision statement

> Let anyone create a personalized silk saree concept in minutes, visualize how the design could look when woven, see it on a realistic 3D model, and submit the concept to VELVOREA's textile design team for professional refinement and production.

## 2.2 Product promise

The customer should feel:

1. "I can create this without knowing textile design."
2. "I can see my idea on a saree."
3. "It looks like woven silk rather than a flat graphic."
4. "I can see how the saree looks when draped."
5. "VELVOREA will professionally convert my concept into the final textile."
6. "My design is saved safely in my account."

## 2.3 Non-goals

The first release must NOT attempt to become:

- Photoshop
- Illustrator
- Figma
- a full textile CAD system
- a professional jacquard CAD package
- a general-purpose fashion design suite
- a public image marketplace
- a customer-side production specification editor
- a downloadable design generator

Technical textile controls should remain behind the scenes and/or inside the VELVOREA designer/admin workspace.

---

# 3. Primary Customer Journey

```text
Landing Page
   ↓
Google Login
   ↓
Phone Verification
   ↓
My Designs
   ↓
Create New Design
   ↓
Choose / Upload Saree Base
   ↓
Add Image / Photo / Text / Simple Design
   ↓
Minimal Editing
   ↓
Choose Colour
   ↓
Generate Woven Preview
   ↓
Review Digital Saree
   ↓
Drape on NILA
   ↓
Explore Drapes
   ↓
3D Rotate / Zoom
   ↓
Complete Design
   ↓
Submit to VELVOREA
   ↓
Customer Details
   ↓
Required-by Date
   ↓
Delivery / Address Information
   ↓
Submit Request
   ↓
Confirmation
   ↓
VELVOREA Design Team Review
   ↓
Professional Textile Design
   ↓
Customer Follow-up
```

---

# 4. User Roles

## 4.1 Customer

Can:

- sign in
- provide phone number
- create designs
- upload source images
- add text
- add simple motifs/design assets
- position/scale/rotate content within controlled limits
- choose colours
- preview woven effect
- view on NILA
- rotate/zoom NILA
- choose supported drapes
- save designs
- rename designs
- delete/archive designs
- submit a design request
- provide contact/order information
- view submission status
- logout

Cannot:

- export PNG/JPG
- download the final visualization
- download source artwork
- access raw generated textile maps
- access production files
- modify manufacturing specifications
- access other customers' designs

## 4.2 Textile Designer

Can:

- view submitted concepts
- inspect customer artwork
- inspect generated previews
- modify/refine design
- create production-ready textile design
- record technical decisions
- communicate with customer
- update workflow status
- create production specification
- approve/reject/request clarification

## 4.3 Admin / Support

Can:

- manage customers
- manage submissions
- manage design statuses
- manage saree templates
- manage colours
- manage NILA drape configurations
- manage notification settings
- manage office email
- audit activities
- configure business rules

## 4.4 Super Admin

Can additionally:

- manage roles
- manage system configuration
- manage feature flags
- manage integrations
- manage security settings
- access system audit logs

---

# 5. Authentication & Account Requirements

## FR-AUTH-001 Google Login

The primary authentication method is Google Sign-In.

### UI

Button:

**Continue with Google**

Secondary links:

- Privacy Policy
- Terms of Use

### Behaviour

1. Customer clicks Continue with Google.
2. Google OAuth opens.
3. User authenticates.
4. Backend validates Google identity token.
5. System creates or retrieves customer account.
6. System checks phone-number status.
7. New users are redirected to phone onboarding.
8. Existing users go to My Designs.

## FR-AUTH-002 Phone Number

Every customer must provide a phone number before creating/submitting a design.

Fields:

- Country
- Phone Number

Primary button:

**Verify Phone**

Optional future capability:

- OTP verification

Recommended MVP:

- phone number collection required
- OTP verification enabled before submission
- phone verification status stored in DB

## FR-AUTH-003 Profile

Customer profile fields:

- Full Name
- Email
- Phone Number
- Country
- Address
- City
- State
- Postal Code
- Default required-by preference (optional)

## FR-AUTH-004 Logout

Button:

**Log Out**

Behaviour:

- terminate application session
- clear client authentication state
- redirect to homepage

---

# 6. Application Information Architecture

Primary authenticated navigation:

```text
VELVOREA
--------------------------------
My Designs
Create Design
How It Works
Support
Profile
Log Out
```

Mobile:

```text
Home | Designs | Create | Profile
```

---

# 7. My Designs

Route:

`/studio/designs`

Purpose: customer's personal design library.

## Design card

Each card displays:

- thumbnail
- design name
- base saree
- last edited date
- status
- submission status
- optional concept number

Buttons:

- Open
- Rename
- Duplicate
- Archive
- Delete

Recommended status labels:

- Draft
- Preview Ready
- Drape Viewed
- Submitted
- Under Design Review
- Clarification Required
- Design Refinement
- Final Design Ready
- Sample Requested
- Sample in Progress
- Completed

## Empty state

Heading:

**Create your first silk saree concept**

Description:

"Start with a saree, add your image or idea, and see how it could look when woven."

Button:

**Create New Design**

---

# 8. Create Design

Route:

`/studio/new`

Primary button:

**Start Designing**

The first step asks the customer to choose the base saree.

---

# 9. Saree Base Selection

The customer should NOT be required to understand textile construction.

## Base selection UI

Cards may include:

- Kanchipuram Silk
- Banarasi Silk
- Mysore Silk
- Tussar Silk
- Custom / Discuss With Designer

Each card can show:

- image
- name
- short description
- approximate characteristics
- "Recommended" or "Available" state

Button:

**Use This Saree**

## Important

The technical textile values shown to customers must come from the VELVOREA material configuration database.

Do not hard-code universal claims such as GSM, yarn count, density, or price.

---

# 10. Design Studio UI

The studio is the flagship product experience.

## Desktop layout

```text
┌──────────────────────────────────────────────────────────────┐
│ VELVOREA | Design Name | Save | Undo | Redo | Preview | ... │
├──────────────┬───────────────────────────────┬───────────────┤
│              │                               │               │
│ TOOL PANEL   │       SAREE CANVAS            │ PROPERTIES    │
│              │                               │               │
│ Add Image    │                               │ Selected Item │
│ Add Text     │                               │               │
│ Add Design   │                               │ Colour        │
│ Colour       │                               │ Size          │
│              │                               │ Position      │
│              │                               │               │
├──────────────┴───────────────────────────────┴───────────────┤
│ Zoom - | 100% | Zoom + | Fit | Preview Woven | Drape        │
└──────────────────────────────────────────────────────────────┘
```

## Mobile layout

Do not copy the desktop UI.

Use:

```text
Top:
← Design Name              Save

Canvas

Bottom:
Add
Text
Image
Colour
Preview
Drape

Contextual bottom sheet:
Selected object's controls
```

---

# 11. Minimal Editing Philosophy

The editor must intentionally contain a small number of controls.

## Customer-facing tools

### Add Image

Upload:

- JPG
- JPEG
- PNG
- WEBP

Recommended limit:

- 20 MB per upload

System should validate:

- MIME type
- file size
- image dimensions
- malware/security constraints
- image decode validity

### Add Text

Fields:

- Text
- Font
- Colour
- Size
- Alignment

Supported fonts should be curated.

Do NOT expose hundreds of fonts.

Recommended initial font groups:

- Elegant Serif
- Modern Sans
- Classic Tamil
- Classic English
- Monogram
- Signature

### Add Design

Customer can select from VELVOREA-provided simple motifs.

Examples:

- Flower
- Leaf
- Paisley
- Geometric
- Temple
- Dot
- Line
- Monogram frame

Future:

- customer uploads an image and AI converts it into a simplified textile motif.

---

# 12. Canvas Interaction

Supported customer operations:

- Select
- Move
- Scale
- Rotate
- Delete
- Duplicate
- Undo
- Redo

Avoid free-form Photoshop-like complexity.

## Constraints

The system should prevent:

- placing objects outside allowed design regions where inappropriate
- extreme scaling
- unreadable text
- unsupported resolution
- impossible repeat density

## Snap

Optional:

- center
- edge
- repeat boundary
- border boundary

---

# 13. Saree Layout

The customer should see a recognizable saree structure.

Logical regions:

```text
BODY
BORDER
PALLU
```

Potential future:

```text
BLouse
Fall
Special Border
```

The customer should be able to choose where the uploaded content appears.

Simple UI:

**Place On**

- Body
- Border
- Pallu
- Custom

The system should visually highlight the selected region.

---

# 14. Image-to-Textile Transformation

This is a core product capability.

Customer input:

```text
Source artwork
+
Saree material
+
Selected colour
+
Placement
+
Repeat
+
Saree region
```

System output:

```text
Digital woven textile visualization
```

## Important architecture rule

Do not treat this as a single black-box AI image generation request.

Use a deterministic textile-rendering pipeline wherever possible.

---

# 15. Woven Preview Pipeline

```text
Customer Design
       ↓
Normalize Artwork
       ↓
Background / Transparency Processing
       ↓
Motif Extraction
       ↓
Colour Mapping
       ↓
Repeat Mapping
       ↓
Saree Region Mapping
       ↓
Textile Structure Selection
       ↓
Warp / Weft Appearance Model
       ↓
Silk Material Response
       ↓
Zari / Metallic Response if applicable
       ↓
Microtexture
       ↓
Lighting
       ↓
Final Woven Preview
```

## Preview levels

### Level 1 — Fast Preview

Used while editing.

Target:

- < 1 second perceived response where possible
- lower resolution
- simplified weave texture

### Level 2 — Final Concept Preview

Triggered by:

**Preview Woven**

Higher quality.

### Level 3 — Drape Preview

Optimized texture/material maps applied to NILA.

---

# 16. Colour System

Customer-facing colour selection should be visual.

Do not expose raw RGB values in the first release.

UI:

**Choose Colour**

Groups:

- Reds
- Pink
- Orange
- Yellow
- Green
- Blue
- Purple
- Neutrals
- Gold
- Silver
- Custom

Each colour should have:

- display colour
- internal colour ID
- HEX
- optional LAB/XYZ representation
- textile-safe mapping
- display name

Example:

```text
VELVOREA Ruby
VELVOREA Ivory
VELVOREA Peacock
VELVOREA Emerald
VELVOREA Antique Gold
```

The customer sees the curated name, not technical colour coordinates.

---

# 17. Colour Mapping Engine

The system should maintain two representations:

```text
Display Colour
       ↓
Textile Colour
```

Because screen RGB does not equal physical silk colour.

Database should store:

- customer selected colour
- internal colour profile
- textile colour approximation
- material context
- rendering profile version

The preview should clearly communicate that physical silk may vary.

---

# 18. Repeat Engine

The customer should NOT see complex textile CAD controls.

Simple controls:

**Pattern**

- Single
- Repeating
- Border
- Pallu

Optional:

**Repeat Size**

- Small
- Medium
- Large

Advanced dimensions are internal.

The backend should maintain:

- repeat width
- repeat height
- X/Y offset
- tile definition
- mirror mode
- rotation
- scale

---

# 19. Border & Pallu

Simple controls:

**Add Border Design**

**Add Pallu Design**

The user can:

- upload image
- add text
- choose motif
- choose colour
- select density

Density:

- Light
- Medium
- Rich

Backend maps these to technical values.

---

# 20. Save System

The system must auto-save.

## Save states

- Saving...
- Saved
- Save failed

Customer should never lose work because of browser refresh or navigation.

## Draft persistence

Every material change creates a draft revision.

Recommended:

- local temporary recovery
- server-side persisted draft
- revision history

---

# 21. Versioning

Every design should have revisions.

Example:

```text
Design: Amma Wedding Saree

v1
v2
v3
v4
```

Customer-facing version history can remain simple.

Backend stores complete immutable revision snapshots.

---

# 22. Undo / Redo

Required.

Operations should be command-based.

Example:

```text
ADD_IMAGE
MOVE_OBJECT
SCALE_OBJECT
ROTATE_OBJECT
ADD_TEXT
CHANGE_COLOUR
CHANGE_REGION
DELETE_OBJECT
```

Undo should reverse the latest command.

Redo should restore it.

---

# 23. Complete Design

Primary CTA:

**Complete Design**

This does NOT mean the textile is production-ready.

It means:

> "Your digital concept is ready for preview and submission to the VELVOREA design team."

On click:

1. validate design
2. generate final concept preview
3. save revision
4. create preview record
5. open concept review screen

---

# 24. Concept Review Screen

Display:

- full saree preview
- material
- selected colour
- design name
- design summary
- concept ID
- timestamp

Buttons:

**Edit Design**

**View on NILA**

**Submit to VELVOREA**

**Save & Exit**

---

# 25. NILA 3D Experience

Route/state:

`/studio/design/:id/drape`

NILA is the VELVOREA digital model.

The experience should be inspired by the usefulness of fashion 3D applications but remain much simpler for customers.

## Main screen

```text
┌─────────────────────────────────────────────────────────────┐
│ ← Back | Design Name                         Submit Design │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                         NILA                                │
│                    3D Saree Model                           │
│                                                             │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ Drapes:  Classic | Shoulder | Gujarati | ...                │
│                                                             │
│ Rotate ↔    Zoom +/-    Reset    Fullscreen                 │
└─────────────────────────────────────────────────────────────┘
```

---

# 26. NILA Controls

Required:

- rotate
- zoom
- reset camera
- fullscreen
- front view
- back view
- 3/4 view

Optional:

- auto rotate

Avoid exposing:

- bone controls
- camera technical settings
- lighting settings
- mesh controls

---

# 27. Saree Drape Library

Initial drape configurations should be curated by VELVOREA.

Each drape has:

- ID
- name
- preview image
- 3D configuration
- garment mesh configuration
- camera presets
- supported textile mappings

Example:

```text
Classic
Front Drape
Shoulder Focus
Pallu Focus
Back View
Editorial
```

The exact drape set should be confirmed with the textile/fashion team.

---

# 28. 3D Textile Rendering

The saree applied to NILA should preserve:

- artwork placement
- text
- colours
- border
- pallu
- repeat
- approximate textile texture
- silk response
- zari appearance where supported

The system should NOT claim physical simulation accuracy unless validated.

UI label:

**Digital Drape Preview**

Optional disclaimer:

"This is a digital concept visualization. Final textile appearance may vary after weaving."

---

# 29. 3D Technical Architecture

Recommended:

```text
React
   +
Three.js
   +
React Three Fiber
   +
GLB / GLTF
```

NILA asset package:

```text
n​​ila.glb
textures/
materials/
animations/
drapes/
```

Use LOD.

Target:

- desktop: high-quality model
- mobile: optimized model

---

# 30. No Customer Export

This is a deliberate product rule.

Customers cannot:

- download PNG
- download JPG
- download PDF
- export SVG
- export design JSON
- download 3D model
- download texture maps

The customer can only:

- view
- save in account
- submit to VELVOREA

Prevent accidental export through normal UI.

Do not rely only on hiding a button for IP protection.

---

# 31. Submission Workflow

Primary button:

**Submit to VELVOREA**

Before submission show:

### Your Concept

- Design
- Material
- Colour
- Preview
- Drape preview

### What happens next?

1. Our textile designer reviews your concept.
2. We refine the artwork for weaving.
3. We confirm technical feasibility.
4. We discuss final material/specification.
5. We proceed toward sample/production after approval.

---

# 32. Customer Submission Form

Required:

- Full Name
- Email
- Phone Number
- Address
- City
- State
- Country
- Postal Code
- Required By Date

Optional:

- Occasion
- Quantity
- Preferred budget range
- Additional comments
- Preferred contact method

Occasion examples:

- Wedding
- Engagement
- Gift
- Festival
- Personal
- Corporate
- Other

---

# 33. Required-by Date

Field:

**When do you need the saree?**

Date picker.

System should NOT promise delivery automatically.

Instead show:

> "This date helps our design team understand your timeline. Final delivery timing will be confirmed after design and production review."

Backend stores:

- requested date
- submission timestamp
- timezone

---

# 34. Submission Confirmation

After successful submission:

Heading:

**Your concept has been sent to VELVOREA**

Show:

- Concept ID
- Design name
- Submitted date
- Requested-by date
- Contact details

Message:

> "Your concept is now with our textile design team. Our team will review the design and contact you to discuss refinement, feasibility, sampling and production."

Button:

**View My Design**

Secondary:

**Back to My Designs**

---

# 35. Customer Submission Status

Customer can see:

```text
Concept Saved
     ↓
Submitted
     ↓
Design Team Review
     ↓
Clarification Required
     ↓
Textile Design Refinement
     ↓
Technical Review
     ↓
Sample Discussion
     ↓
Production Discussion
     ↓
Completed
```

Do not expose internal technical statuses that confuse customers.

---

# 36. Office Email Notification

Every submission must create an office notification.

Recommended architecture:

```text
Customer Submission
       ↓
Submission Service
       ↓
Database Transaction
       ↓
Notification Queue
       ↓
Email Service
       ↓
Office Email
```

Email:

**Subject:**
`New VELVOREA Custom Saree Design Request — {Concept ID}`

Email should include:

- Customer name
- email
- phone
- address
- required-by date
- design name
- concept ID
- material
- colour
- submission timestamp
- link to internal admin/design review
- thumbnail / secure preview link

Do not send huge image files as email attachments.

---

# 37. Email Failure Handling

If email fails:

- submission must remain successful
- email status = FAILED
- retry automatically
- admin notification after repeated failures

Never make the customer submit again because email failed.

---

# 38. Design Team Workspace

Route:

`/admin/design-requests`

Dashboard columns:

- Concept ID
- Customer
- Design
- Material
- Submitted Date
- Required By
- Status
- Assigned Designer
- Priority

Actions:

- Open
- Assign
- Change Status
- Add Note
- Request Clarification
- Contact Customer

---

# 39. Design Review Workspace

Designer sees:

```text
Customer Concept
      |
      +-- Original Artwork
      +-- Customer Canvas
      +-- Woven Preview
      +-- NILA Drape
      +-- Design Parameters
      +-- Customer Information
      +-- Notes
      +-- Revision History
```

Designer-only capabilities may include:

- higher-resolution preview
- motif cleanup
- colour correction
- repeat engineering
- weave selection
- border engineering
- pallu engineering
- zari engineering
- manufacturability analysis
- technical specification
- final design files

These are intentionally outside the customer editor.

---

# 40. Customer vs Designer Complexity

## Customer

```text
Upload
Text
Design
Colour
Place
Scale
Preview
Drape
Submit
```

## Designer

```text
Motif extraction
Vectorization
Repeat engineering
Warp/weft
Weave
Density
Yarn
Zari
Colour separation
Production width
Technical repeat
Manufacturability
Pricing
Production specification
```

This separation is one of the most important product decisions.

---

# 41. AI Capabilities

AI should be assistive, not the sole rendering engine.

Potential AI features:

### AI-01 Image Simplification

Convert uploaded photo into textile-friendly artwork.

Modes:

- Clean Motif
- Line Art
- Floral
- Silhouette
- Pattern
- Monogram

### AI-02 Background Removal

Remove background from uploaded image.

### AI-03 Motif Extraction

Identify central visual motif.

### AI-04 Repeat Suggestion

Suggest a repeat layout.

### AI-05 Colour Simplification

Reduce image into textile-friendly colour palette.

### AI-06 Textile Preview Assistance

Generate a visual approximation of woven texture.

AI output must always be labelled as preview/assistance where applicable.

---

# 42. AI Guardrails

AI must not:

- invent production specifications
- claim manufacturability without rule validation
- claim colour accuracy
- claim final weaving accuracy
- silently alter customer artwork
- replace the original uploaded artwork

Store:

- original input
- AI output
- model/provider
- model version
- prompt/configuration version
- timestamp

---

# 43. Asset Security

Customer uploads are private.

Storage structure:

```text
customers/{customerId}/designs/{designId}/
    originals/
    processed/
    previews/
    drapes/
    revisions/
```

Object storage should use private buckets.

Serve files using signed URLs.

Do not expose direct storage credentials.

---

# 44. Recommended Backend Architecture

For MVP, use a modular monolith rather than unnecessary microservices.

```text
Frontend
React / Next.js
       |
       v
API Layer
       |
       +--------------------+
       |                    |
       v                    v
Application Services     Auth
       |
       +-------------------------------+
       |       |        |       |       |
       v       v        v       v       v
Design   Rendering   Drape   Submission Notification
Service  Service     Service Service    Service
       |
       v
PostgreSQL
       |
       +---- Object Storage
       |
       +---- Redis / Queue
       |
       +---- Email Provider
```

Recommended deployment:

- Next.js application
- PostgreSQL
- object storage such as S3-compatible storage
- Redis/managed queue
- email provider
- Google OAuth
- Three.js frontend
- background rendering workers

---

# 45. Suggested Technology Stack

## Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS or design-system CSS
- React Three Fiber
- Three.js
- Zustand or Redux Toolkit for editor state
- Zod for client validation

## Backend

Option A:

- Next.js API / server actions for MVP

Option B:

- Node.js
- NestJS

Recommendation:

Start with a modular Next.js backend unless scale/organizational requirements justify NestJS.

## Database

PostgreSQL.

## Storage

S3-compatible object storage.

## Queue

Redis + BullMQ or managed equivalent.

## Authentication

Google OAuth / Auth.js or equivalent.

## Email

Transactional email provider.

## Observability

- structured logging
- error monitoring
- performance monitoring
- audit logs

---

# 46. Database Design

## users

```sql
id UUID PK
google_subject VARCHAR UNIQUE
email VARCHAR UNIQUE NOT NULL
full_name VARCHAR
phone VARCHAR
phone_verified BOOLEAN DEFAULT FALSE
country_code VARCHAR
created_at TIMESTAMP
updated_at TIMESTAMP
last_login_at TIMESTAMP
status VARCHAR
```

## user_addresses

```sql
id UUID PK
user_id UUID FK
label VARCHAR
address_line_1 TEXT
address_line_2 TEXT
city VARCHAR
state VARCHAR
postal_code VARCHAR
country VARCHAR
is_default BOOLEAN
created_at TIMESTAMP
updated_at TIMESTAMP
```

## designs

```sql
id UUID PK
user_id UUID FK
name VARCHAR NOT NULL
status VARCHAR
material_id UUID
base_saree_template_id UUID
current_revision_id UUID
submitted_at TIMESTAMP NULL
required_by_date DATE NULL
created_at TIMESTAMP
updated_at TIMESTAMP
archived_at TIMESTAMP NULL
```

## design_revisions

```sql
id UUID PK
design_id UUID FK
version_number INTEGER
state_json JSONB
preview_asset_id UUID NULL
created_by UUID
created_at TIMESTAMP
```

## design_objects

For queryable object-level information.

```sql
id UUID PK
design_revision_id UUID FK
object_type VARCHAR
source_asset_id UUID NULL
text_content TEXT NULL
x NUMERIC
y NUMERIC
scale_x NUMERIC
scale_y NUMERIC
rotation NUMERIC
colour_id UUID NULL
region VARCHAR
z_index INTEGER
properties_json JSONB
created_at TIMESTAMP
```

## uploaded_assets

```sql
id UUID PK
user_id UUID FK
design_id UUID FK
asset_type VARCHAR
storage_key TEXT
mime_type VARCHAR
file_size BIGINT
width INTEGER
height INTEGER
checksum VARCHAR
status VARCHAR
created_at TIMESTAMP
```

## textile_materials

```sql
id UUID PK
name VARCHAR
slug VARCHAR UNIQUE
description TEXT
image_asset_id UUID
active BOOLEAN
configuration_json JSONB
created_at TIMESTAMP
updated_at TIMESTAMP
```

## textile_colours

```sql
id UUID PK
name VARCHAR
hex VARCHAR
lab_l NUMERIC
lab_a NUMERIC
lab_b NUMERIC
textile_profile_json JSONB
active BOOLEAN
created_at TIMESTAMP
```

## saree_templates

```sql
id UUID PK
name VARCHAR
slug VARCHAR UNIQUE
material_id UUID
width_mm NUMERIC
length_mm NUMERIC
body_config_json JSONB
border_config_json JSONB
pallu_config_json JSONB
preview_asset_id UUID
active BOOLEAN
created_at TIMESTAMP
```

## drape_configs

```sql
id UUID PK
name VARCHAR
slug VARCHAR UNIQUE
model_asset_id UUID
drape_asset_id UUID
camera_config_json JSONB
material_config_json JSONB
active BOOLEAN
created_at TIMESTAMP
```

## design_drape_previews

```sql
id UUID PK
design_id UUID FK
revision_id UUID FK
drape_config_id UUID FK
asset_id UUID
render_version VARCHAR
created_at TIMESTAMP
```

## submissions

```sql
id UUID PK
design_id UUID FK
user_id UUID FK
full_name VARCHAR
email VARCHAR
phone VARCHAR
required_by_date DATE
occasion VARCHAR
quantity INTEGER
budget_range VARCHAR
comments TEXT
status VARCHAR
assigned_designer_id UUID NULL
submitted_at TIMESTAMP
updated_at TIMESTAMP
```

## submission_addresses

Store a snapshot at submission time.

```sql
id UUID PK
submission_id UUID FK
address_line_1 TEXT
address_line_2 TEXT
city VARCHAR
state VARCHAR
postal_code VARCHAR
country VARCHAR
```

This prevents future profile address changes from changing historical submission data.

## submission_events

```sql
id UUID PK
submission_id UUID FK
event_type VARCHAR
from_status VARCHAR
to_status VARCHAR
actor_id UUID
metadata_json JSONB
created_at TIMESTAMP
```

## designer_notes

```sql
id UUID PK
submission_id UUID FK
author_id UUID
note TEXT
visibility VARCHAR
created_at TIMESTAMP
```

## notification_events

```sql
id UUID PK
submission_id UUID NULL
type VARCHAR
recipient VARCHAR
status VARCHAR
provider_message_id VARCHAR
attempt_count INTEGER
last_error TEXT
created_at TIMESTAMP
updated_at TIMESTAMP
```

## audit_logs

```sql
id UUID PK
actor_id UUID
entity_type VARCHAR
entity_id UUID
action VARCHAR
metadata_json JSONB
ip_hash VARCHAR NULL
user_agent TEXT NULL
created_at TIMESTAMP
```

---

# 47. Important Database Rules

## Soft deletion

Do not immediately hard-delete customer designs.

Use:

```text
archived_at
deleted_at
```

with retention policies.

## Revision immutability

Once a revision is submitted, do not overwrite it.

Create a new revision.

## Submission snapshot

Submission should preserve the exact customer concept state that was submitted.

## Tenant isolation

Every customer-owned entity must be scoped by `user_id`.

---

# 48. API Design

Example endpoints:

## Authentication

```text
GET /api/auth/session
POST /api/auth/phone
POST /api/auth/phone/verify
POST /api/auth/logout
```

## Designs

```text
GET    /api/designs
POST   /api/designs
GET    /api/designs/:id
PATCH  /api/designs/:id
DELETE /api/designs/:id
POST   /api/designs/:id/duplicate
POST   /api/designs/:id/archive
```

## Revisions

```text
GET  /api/designs/:id/revisions
POST /api/designs/:id/revisions
GET  /api/designs/:id/revisions/:revisionId
```

## Assets

```text
POST /api/assets/upload-url
POST /api/assets/complete
GET  /api/assets/:id
DELETE /api/assets/:id
```

## Rendering

```text
POST /api/designs/:id/preview
GET  /api/designs/:id/previews
```

## Drape

```text
GET  /api/drapes
POST /api/designs/:id/drape-preview
```

## Submission

```text
POST /api/designs/:id/submit
GET  /api/submissions
GET  /api/submissions/:id
```

---

# 49. API Authorization

Customer can only access:

```text
their user
their designs
their assets
their submissions
their addresses
```

Designer can access assigned/authorized submissions.

Admin can access all business records.

Every API must enforce authorization server-side.

Never rely on frontend route hiding.

---

# 50. Rendering Architecture

Use two rendering modes.

## Browser rendering

Used for:

- live canvas
- instant edits
- quick preview
- interactive drape

## Server/background rendering

Used for:

- high-quality concept preview
- expensive textile texture generation
- final drape snapshots
- future production previews

Architecture:

```text
Editor
 ↓
Design JSON
 ↓
Render Job
 ↓
Queue
 ↓
Render Worker
 ↓
Object Storage
 ↓
Preview Asset
```

---

# 51. Design JSON

Example conceptual structure:

```json
{
  "schemaVersion": 1,
  "material": "kanchipuram-silk",
  "colour": "velvorea-ruby",
  "regions": {
    "body": [],
    "border": [],
    "pallu": []
  },
  "objects": [
    {
      "type": "image",
      "assetId": "asset_123",
      "x": 0.5,
      "y": 0.5,
      "scale": 0.8,
      "rotation": 0,
      "region": "body"
    },
    {
      "type": "text",
      "text": "S",
      "font": "elegant-serif",
      "colour": "velvorea-gold",
      "x": 0.5,
      "y": 0.5,
      "scale": 0.5,
      "region": "pallu"
    }
  ]
}
```

The actual schema should be versioned.

---

# 52. Image Processing Pipeline

```text
Upload
 ↓
Virus/security scan
 ↓
MIME validation
 ↓
Decode
 ↓
Dimension validation
 ↓
Checksum
 ↓
Original stored privately
 ↓
Create optimized working copy
 ↓
Generate thumbnail
 ↓
Remove metadata where appropriate
 ↓
Mark READY
```

Never destroy the original uploaded file.

---

# 53. Performance Requirements

## NFR-PERF-001

Studio initial interactive load target:

- desktop: ≤ 3 seconds on a good broadband connection
- mobile: ≤ 5 seconds on a good 4G/5G connection

## NFR-PERF-002

Editor interactions should feel immediate.

Target:

- object movement: < 100 ms visual response
- simple property updates: < 100 ms
- autosave debounce: ~500–1500 ms after inactivity

## NFR-PERF-003

Fast preview should generally begin rendering within 1 second.

## NFR-PERF-004

High-quality preview should be asynchronous.

Never block the UI waiting for a long render.

---

# 54. Reliability

The application must tolerate:

- browser refresh
- temporary network failure
- rendering failure
- email failure
- storage upload failure
- session expiration

Autosave and retry should protect customer work.

---

# 55. Security

Requirements:

- HTTPS everywhere
- secure cookies
- CSRF protection where applicable
- OAuth token validation
- server-side authorization
- rate limiting
- upload validation
- malware scanning
- private object storage
- signed URLs
- encryption at rest
- encryption in transit
- audit logs
- secrets in secret manager
- no API secrets in frontend
- no raw database credentials in source code

---

# 56. Privacy

Customer designs should be treated as private intellectual property.

Default rule:

> A customer's uploaded artwork and design concepts are not public.

The system should not use customer designs for model training without explicit legal/product consent.

Privacy policy should explain:

- what is stored
- why it is stored
- who can access it
- retention
- deletion
- design/IP handling
- third-party processors

---

# 57. Intellectual Property

The customer must retain control of uploaded source material subject to VELVOREA's terms.

VELVOREA needs appropriate terms covering:

- permission to process uploaded content
- production/design use
- prohibited content
- customer warranties
- copyright/trademark responsibility
- design confidentiality
- designer refinement rights
- AI processing where applicable

Legal review required before commercial launch.

---

# 58. Accessibility

Target WCAG 2.2 AA.

Requirements:

- keyboard navigation where practical
- visible focus
- screen-reader labels
- sufficient contrast
- text alternatives
- accessible dialogs
- accessible upload controls
- reduced-motion support
- touch targets ≥ 44px
- error messages
- form labels

3D viewer must provide alternate static preview for users who cannot interact with WebGL.

---

# 59. Mobile Requirements

Mobile is a first-class experience.

Must support:

- Google login
- phone verification
- upload from camera/gallery
- basic editing
- preview
- NILA drape
- touch rotate
- pinch zoom
- submit

Do not attempt to reproduce the desktop editor exactly.

---

# 60. Error Handling

Examples:

### Upload failure

"Your image could not be uploaded. Please try again."

### Unsupported image

"This image format is not supported. Please upload JPG, PNG or WEBP."

### Preview failure

"We couldn't create the woven preview right now. Your design is saved. Please try again."

### Drape failure

"The digital drape preview is temporarily unavailable. Your design is safe."

### Submission failure

"We couldn't submit your request. Your design is saved. Please try again."

Never show technical stack traces to customers.

---

# 61. Analytics

Track:

## Acquisition

- landing_view
- google_login_started
- google_login_completed
- phone_verified

## Design

- create_design_started
- saree_selected
- image_uploaded
- text_added
- motif_added
- colour_changed
- object_moved
- preview_requested
- preview_completed
- preview_failed

## Drape

- drape_opened
- drape_selected
- model_rotated
- model_zoomed
- drape_completed

## Conversion

- submit_started
- submit_completed
- submit_failed

Important funnel:

```text
Visitors
 ↓
Login
 ↓
Design Started
 ↓
Artwork Added
 ↓
Preview
 ↓
Drape
 ↓
Submit
```

---

# 62. Product Metrics

Primary:

**Concept Submission Rate**

`submitted_designs / design_started`

Secondary:

- design completion rate
- preview generation success
- average time to first preview
- average editing session
- drape engagement
- submission abandonment
- mobile completion
- repeat customer rate
- design-team response time
- clarification rate
- concept-to-sample conversion
- sample-to-order conversion

Do not optimize purely for time spent.

The objective is successful concept creation and qualified submission.

---

# 63. Customer Notifications

Initial:

- submission received
- design team reviewing
- clarification requested
- designer update
- final design discussion

Channels:

- email
- future WhatsApp
- future SMS

Do not send unnecessary notifications for every internal event.

---

# 64. Admin Configuration

Admin should be able to configure:

### Materials

- active/inactive
- customer name
- images
- description
- available colours
- preview profile

### Colours

- name
- colour values
- display swatch
- material mapping

### Saree templates

- body
- border
- pallu
- dimensions
- preview

### Drape configurations

- name
- model asset
- drape asset
- camera presets
- supported materials

### Email

- office recipient
- CC
- notification templates
- retry policy

---

# 65. Audit Logging

Audit:

- login
- profile changes
- design created
- asset uploaded
- design updated
- design deleted/archived
- design submitted
- status changed
- designer assignment
- admin configuration change

Audit entries should be immutable.

---

# 66. UI Design Language

VELVOREA should feel like a luxury atelier, not a generic SaaS dashboard.

Principles:

- restrained
- editorial
- tactile
- spacious
- typography-led
- material-focused
- minimal chrome
- subtle animation
- premium photography
- high-quality silk texture
- no excessive gradients
- no gamification
- no clutter

The studio itself should be calm and functional.

---

# 67. Recommended Studio Navigation

Top bar:

```text
VELVOREA

Design Name

Undo | Redo

Save Status

Preview

Drape

Complete
```

Left:

```text
ADD
Image
Text
Design
```

Secondary:

```text
COLOUR
Saree
Design
```

Center:

```text
SAREE CANVAS
```

Right:

```text
SELECTED
Position
Size
Rotation
Colour
Region
```

Bottom:

```text
Zoom
Fit
Preview Woven
Drape
```

---

# 68. Exact Customer-Facing Button Inventory

## Authentication

- Continue with Google
- Verify Phone
- Continue
- Log Out

## Designs

- Create New Design
- Open
- Rename
- Duplicate
- Archive
- Delete

## Studio

- Add Image
- Add Text
- Add Design
- Choose Colour
- Place On
- Undo
- Redo
- Delete
- Duplicate
- Save
- Preview Woven
- Drape
- Complete Design

## Drape

- Front
- Back
- 3/4
- Reset
- Fullscreen
- Auto Rotate
- Change Drape

## Submission

- Submit to VELVOREA
- Edit Design
- Save & Exit
- Back to My Designs
- Confirm Submission

---

# 69. Detailed Functional Requirement Matrix

| ID | Requirement | Priority |
|---|---|---|
| FR-001 | Google login | P0 |
| FR-002 | Phone collection | P0 |
| FR-003 | Phone verification | P0 |
| FR-004 | Customer profile | P0 |
| FR-005 | My Designs | P0 |
| FR-006 | Create design | P0 |
| FR-007 | Select saree | P0 |
| FR-008 | Upload image | P0 |
| FR-009 | Add text | P0 |
| FR-010 | Add motif | P0 |
| FR-011 | Move object | P0 |
| FR-012 | Scale object | P0 |
| FR-013 | Rotate object | P1 |
| FR-014 | Delete object | P0 |
| FR-015 | Undo/redo | P0 |
| FR-016 | Colour selection | P0 |
| FR-017 | Body/border/pallu placement | P0 |
| FR-018 | Autosave | P0 |
| FR-019 | Revision history | P0 |
| FR-020 | Woven preview | P0 |
| FR-021 | NILA viewer | P0 |
| FR-022 | 3D rotate | P0 |
| FR-023 | 3D zoom | P0 |
| FR-024 | Drape library | P0 |
| FR-025 | No customer export | P0 |
| FR-026 | Complete Design | P0 |
| FR-027 | Submission form | P0 |
| FR-028 | Required-by date | P0 |
| FR-029 | Submission status | P0 |
| FR-030 | Office email | P0 |
| FR-031 | Email retry | P0 |
| FR-032 | Design-team workspace | P0 |
| FR-033 | Designer assignment | P1 |
| FR-034 | Designer notes | P1 |
| FR-035 | AI background removal | P1 |
| FR-036 | AI motif extraction | P1 |
| FR-037 | AI repeat suggestion | P2 |
| FR-038 | Analytics | P1 |
| FR-039 | Audit logging | P0 |
| FR-040 | Admin configuration | P1 |

---

# 70. Non-Functional Requirement Matrix

| ID | NFR | Target |
|---|---|---|
| NFR-001 | Security | HTTPS + secure auth |
| NFR-002 | Authorization | server-side RBAC |
| NFR-003 | Performance | interactive editor <100ms target |
| NFR-004 | Initial load | ≤3s desktop target |
| NFR-005 | Mobile load | ≤5s good 4G/5G target |
| NFR-006 | Availability | 99.9% target after launch maturity |
| NFR-007 | Autosave | no intentional data loss |
| NFR-008 | Accessibility | WCAG 2.2 AA target |
| NFR-009 | Privacy | private customer designs |
| NFR-010 | Scalability | horizontal app/render workers |
| NFR-011 | Observability | logs + metrics + error tracking |
| NFR-012 | Recovery | database backup + asset durability |
| NFR-013 | Maintainability | TypeScript + modular architecture |
| NFR-014 | Testability | unit + integration + E2E |
| NFR-015 | Auditability | immutable audit records |
| NFR-016 | Browser | latest major Chrome/Safari/Edge/Firefox |
| NFR-017 | 3D | WebGL fallback |
| NFR-018 | IP protection | no customer export |
| NFR-019 | Data retention | configurable policy |
| NFR-020 | Email reliability | asynchronous retry |

---

# 71. Testing Strategy

## Unit tests

Test:

- design reducer
- object transforms
- colour mapping
- repeat mapping
- validation
- submission rules
- authorization
- status transitions

## Integration tests

Test:

- Google authentication
- phone verification
- upload flow
- design save
- preview generation
- submission
- email queue
- email failure/retry

## E2E tests

Critical journey:

```text
Login
→ Verify Phone
→ Create Design
→ Select Saree
→ Upload Image
→ Add Text
→ Choose Colour
→ Preview
→ Drape
→ Rotate
→ Zoom
→ Complete
→ Submit
→ Confirmation
```

## Visual tests

Test:

- saree canvas
- woven preview
- NILA
- mobile editor
- desktop editor

---

# 72. Acceptance Criteria — Core Journey

A release is not complete unless a new customer can:

1. Login with Google.
2. Provide phone number.
3. Create a new design.
4. Choose a saree base.
5. Upload an image.
6. Add text.
7. Position and resize content.
8. Choose a colour.
9. Preview woven output.
10. Save the design.
11. Open NILA.
12. Select a drape.
13. Rotate NILA.
14. Zoom NILA.
15. View the concept from multiple angles.
16. Complete the design.
17. Enter name, phone, address and required-by date.
18. Submit the concept.
19. Receive confirmation.
20. See the design in My Designs.
21. Office receives the submission email.
22. Customer cannot export the design image.

---

# 73. Important Product Guardrails

## Guardrail 1

Never tell the customer:

> "This is exactly how the final saree will look."

Say:

> "Digital textile concept preview."

## Guardrail 2

Never tell the customer:

> "Your design is production-ready."

Instead:

> "Our textile design team will refine and validate your concept for weaving."

## Guardrail 3

Never silently replace customer artwork.

If AI creates a modified version:

```text
Original
AI-assisted
```

Keep both.

## Guardrail 4

Never lose customer work.

Autosave continuously.

## Guardrail 5

Do not expose professional textile engineering controls in the customer editor.

---

# 74. Recommended MVP Scope

## MVP P0

### Authentication

- Google
- phone
- profile

### Design

- saree selection
- image upload
- text
- simple motif
- move
- scale
- rotate
- delete
- undo/redo
- colour
- body/border/pallu
- autosave

### Rendering

- woven preview
- basic silk texture
- colour mapping

### NILA

- 3D model
- 3–5 curated drapes
- rotate
- zoom
- front/back/3-quarter

### Submission

- customer details
- required-by date
- submission
- office email
- status

### Account

- My Designs
- open
- rename
- archive
- logout

---

# 75. Post-MVP

P1:

- AI background removal
- motif extraction
- designer workspace
- advanced textile preview
- WhatsApp notification
- sample workflow
- quotation workflow
- customer/designer communication
- richer NILA drapes
- better textile material simulation

P2:

- AI repeat suggestions
- intelligent textile feasibility
- production pricing
- digital sample approval
- B2B designer workspace
- advanced 3D cloth simulation
- production specification generation

---

# 76. Suggested Project Architecture

```text
src/
├── app/
│   ├── (marketing)/
│   ├── auth/
│   ├── studio/
│   │   ├── designs/
│   │   ├── new/
│   │   └── [designId]/
│   │       ├── edit/
│   │       ├── preview/
│   │       └── drape/
│   ├── account/
│   └── admin/
│
├── components/
│   ├── studio/
│   ├── canvas/
│   ├── textile/
│   ├── drape/
│   └── forms/
│
├── domain/
│   ├── design/
│   ├── textile/
│   ├── rendering/
│   ├── drape/
│   ├── submission/
│   └── users/
│
├── lib/
│   ├── auth/
│   ├── db/
│   ├── storage/
│   ├── email/
│   ├── queue/
│   └── analytics/
│
├── rendering/
│   ├── weave/
│   ├── colour/
│   ├── repeat/
│   └── composition/
│
└── three/
    ├── nila/
    ├── drapes/
    └── materials/
```

---

# 77. Design State Architecture

Use a normalized editor state.

```text
Design
 ├── metadata
 ├── material
 ├── colour
 ├── regions
 ├── objects
 ├── viewport
 ├── preview
 └── version
```

Use command history:

```text
Command
 → apply()
 → inverse()
```

This provides reliable undo/redo.

---

# 78. Rendering Versioning

Every preview should store:

```text
renderer_version
material_profile_version
colour_profile_version
design_schema_version
drape_version
```

This is critical because rendering logic will evolve.

A preview generated today must remain explainable later.

---

# 79. Business Workflow Architecture

```text
CUSTOMER
   |
   | creates concept
   v
DIGITAL CONCEPT
   |
   | preview
   v
DIGITAL TEXTILE VISUALIZATION
   |
   | NILA
   v
DIGITAL DRAPE
   |
   | submit
   v
VELVOREA DESIGN TEAM
   |
   v
TEXTILE REFINEMENT
   |
   v
TECHNICAL VALIDATION
   |
   v
SAMPLE
   |
   v
CUSTOMER APPROVAL
   |
   v
PRODUCTION
   |
   v
QC
   |
   v
DELIVERY
```

The customer-facing application should stop at the concept/submission boundary for MVP.

---

# 80. Product Principle: Hide Complexity

The most important UX requirement is:

> The customer should not learn textile CAD software in order to use VELVOREA.

The application should progressively reveal complexity.

### Customer

"Add my photo."

### System

Internally performs:

```text
segmentation
motif extraction
colour mapping
repeat mapping
texture mapping
region mapping
```

### Customer

"Show me how it looks woven."

### System

Internally performs:

```text
material shader
weave texture
lighting
silk response
zari response
```

### Customer

"Show it on NILA."

### System

Internally performs:

```text
texture generation
UV mapping
drape mapping
3D rendering
camera presets
```

This is the VELVOREA product advantage.

---

# 81. Final Definition of Done

The product is ready for a controlled customer launch when:

### Customer

- Google login works
- phone verification works
- design creation works
- uploads work
- editing works
- autosave works
- woven preview works
- NILA works
- drapes work
- submission works
- designs are saved
- no export exists

### Backend

- PostgreSQL implemented
- object storage secured
- authorization tested
- rendering jobs reliable
- email notification reliable
- audit logging active
- backups configured
- monitoring active

### Design Team

- can see submissions
- can see exact customer concept
- can access source artwork
- can see woven preview
- can see NILA drape
- can update status
- can contact customer

### Quality

- no data loss
- no cross-user access
- mobile tested
- desktop tested
- accessibility tested
- performance tested
- critical E2E flow passes

---

# 82. Recommended Product Language

Use:

**Digital Textile Concept**

**Woven Preview**

**Digital Drape**

**Design Team Review**

**Textile Refinement**

**Production Validation**

Avoid:

**Final Saree Preview**

**Guaranteed Appearance**

**Production Ready** (unless verified)

**Exact Colour**

**Exact Weave Simulation**

---

# 83. One-Sentence Product Definition

> **VELVOREA Textile Studio lets anyone turn an image, letter, photograph or simple idea into a personalized silk saree concept, preview it as a woven textile, experience it on NILA in 3D, save it privately, and submit it to VELVOREA's textile designers for professional refinement and production.**

---

# 84. Product Success Criterion

The product succeeds when a first-time customer can go from:

> **"I have an idea."**

to:

> **"I can see my idea as a silk saree."**

to:

> **"I can see it on a person."**

to:

> **"VELVOREA has my concept and can turn it into the real textile."**

with minimal learning and without needing professional design software.
