# **VELVOREA Textile Studio — Detailed Product & Technical Requirements**

**Document Version:** 1.0  
&nbsp;**Product:** VELVOREA Textile Studio  
&nbsp;**Purpose:** Digital saree design, textile configuration, drape visualization and future AI-assisted textile design  
&nbsp;**Primary Users:** Consumers, designers, fashion designers, textile designers, VELVOREA internal team  
&nbsp;**Authentication:** Google Sign-In  
&nbsp;**Hosting:** Vercel  
&nbsp;**AI Provider:** Gemini-compatible architecture, **AI features provisioned but paid/entitlement-gated**  
&nbsp;**Core Principle:** User remains the designer; the application provides tools, visualization and eventually AI assistance.

---

# **1\. Product Vision**

VELVOREA Textile Studio is a browser-based digital textile and saree design environment that allows a user to create a complete saree digitally and immediately visualize the resulting design on a female model.

The application must bridge:

> **Idea → Textile → Artwork → Repeat → Saree Composition → Drape → Visual Review → Manufacturing Readiness**

The Studio must not behave like a simple image editor.

It should understand that a saree contains different design regions and that each region has different functional behaviour.

SAREE

&nbsp;

┌──────────────────────────────┐

│            PALLU             │

│                              │

├──────────────────────────────┤

│                              │

│            BODY              │

│                              │

│                              │

│                              │

│                              │

├──────────────────────────────┤

│            BORDER            │

└──────────────────────────────┘

The user must be able to independently control:

* Material  
* Silk type  
* Weave  
* Base colour  
* Artwork  
* Motifs  
* Repeat  
* Body  
* Border  
* Pallu  
* Zari  
* Design scale  
* Placement  
* Colourways  
* Saree dimensions  
* Drape visualization  
* Female model visualization

---

# **2\. Product Positioning**

VELVOREA Textile Studio should combine capabilities inspired by professional textile-design applications with a significantly simpler luxury web experience.

The product should sit between:

Professional Textile CAD

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\+

Digital Fashion Visualization

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\+

Consumer Design Tool

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\+

Future AI Design Assistant

It should **not** initially attempt to reproduce the full complexity of industrial textile CAD systems.

The first version should provide a highly usable web-based saree design system with a strong underlying technical model that can later support production-grade textile workflows.

---

# **3\. Product Goals**

## **G-001 — Digital Saree Creation**

A user must be able to create a complete saree without external design software.

## **G-002 — Real-Time Preview**

Changes should immediately appear on the textile canvas.

## **G-003 — Saree-Specific Design**

Body, border and pallu must be treated as independent design regions.

## **G-004 — Drape Visualization**

The user must be able to apply the completed design to a female model and see an approximate final appearance.

## **G-005 — Design Iteration**

The user must be able to experiment without losing previous work.

## **G-006 — Future AI**

AI functionality must be architecturally supported but **not included as a free feature**.

## **G-007 — Production Foundation**

The design model must eventually support manufacturability, pricing and physical sampling.

---

# **4\. Non-Goals for Initial Release**

The initial release must NOT attempt to fully implement:

* AI artwork generation  
* AI image generation  
* AI model generation  
* AI drape generation  
* AI textile analysis  
* AI colour recommendations  
* AI design critique  
* AI manufacturing recommendations  
* Automatic production ordering  
* Fully automated physical manufacturing  
* Fully physically accurate cloth simulation  
* Automated loom programming

However, the architecture must support these capabilities later.

---

# **5\. User Authentication**

## **FR-AUTH-001 — Google Login**

Users must be able to authenticate using Google.

### **Login screen**

VELVOREA

&nbsp;

Textile Studio

&nbsp;

Create your own silk.

&nbsp;

\[ Continue with Google \]

No username/password registration is required for MVP.

---

## **FR-AUTH-002 — Authentication States**

System must support:

Unauthenticated

Authenticated

Session Expired

Account Disabled

Account Deleted

---

## **FR-AUTH-003 — User Profile**

Store:

User ID

Google ID

Name

Email

Profile Image

Created Date

Last Login

Subscription Plan

AI Entitlement

---

# **6\. Subscription / Entitlement Architecture**

All AI capabilities must be **paid-only**.

The UI and backend must therefore have an entitlement system from the beginning.

## **FR-ENT-001**

Every user has a plan.

Example:

FREE

PRO

BUSINESS

ADMIN

AI capability:

FREE       → AI disabled

PRO        → AI enabled

BUSINESS   → AI enabled

ADMIN      → AI enabled

The actual commercial plans can be changed later.

---

# **7\. AI Provisioning Requirement**

AI functionality must exist architecturally but remain disabled unless the user has an appropriate entitlement.

### **Example**

User clicks:

**AI Design Assistant**

If user is not entitled:

┌─────────────────────────────────┐

│ ✦ VELVOREA AI                   │

│                                 │

│ AI-powered textile design tools │

│ are available with a paid plan.│

│                                 │

│ \[ Explore Plans \]               │

└─────────────────────────────────┘

The application must **not call Gemini** in this situation.

---

# **8\. AI Architecture**

The frontend must never directly expose a Gemini API key.

Architecture:

Browser

&nbsp;&nbsp;&nbsp;│

&nbsp;&nbsp;&nbsp;▼

VELVOREA Backend

&nbsp;&nbsp;&nbsp;│

&nbsp;&nbsp;&nbsp;├── Authentication

&nbsp;&nbsp;&nbsp;├── Entitlement Check

&nbsp;&nbsp;&nbsp;├── Usage Check

&nbsp;&nbsp;&nbsp;├── AI Request Validation

&nbsp;&nbsp;&nbsp;│

&nbsp;&nbsp;&nbsp;▼

Gemini AI Gateway

&nbsp;&nbsp;&nbsp;│

&nbsp;&nbsp;&nbsp;▼

Gemini

Future AI operations:

AI Artwork

AI Motif

AI Repeat

AI Colour

AI Border

AI Pallu

AI Design Critic

AI Manufacturability

AI Drape

The initial implementation only needs **interfaces/contracts**, not active AI functionality.

---

# **9\. Studio Layout**

Desktop layout:

┌──────────────────────────────────────────────────────────────┐

│ VELVOREA     My Saree Design       Save     Preview    AI ✦ │

├────────────┬───────────────────────────────────┬─────────────┤

│            │                                   │             │

│ MATERIAL   │                                   │ DESIGN      │

│            │                                   │ PROPERTIES  │

│ COLOUR     │                                   │             │

│            │                                   │             │

│ ARTWORK    │          SAREE CANVAS             │             │

│            │                                   │             │

│ REPEAT     │                                   │             │

│            │                                   │             │

│ BORDER     │                                   │             │

│            │                                   │             │

│ PALLU      │                                   │             │

│            │                                   │             │

│ ZARI       │                                   │             │

│            │                                   │             │

│ DRAPE      │                                   │             │

│            │                                   │             │

├────────────┴───────────────────────────────────┴─────────────┤

│ Zoom │ Grid │ Undo │ Redo │ Save Status │ Price │ Warnings │

└──────────────────────────────────────────────────────────────┘

Mobile must convert this into:

Canvas

&nbsp;&nbsp;&nbsp;↓

Bottom toolbar

&nbsp;&nbsp;&nbsp;↓

Expandable panels

---

# **10\. Design Creation**

## **FR-DESIGN-001 — New Design**

User clicks:

**Create New Saree**

System creates:

Design ID

Owner ID

Design Name

Version 1

Default Material

Default Colour

Default Canvas

Example:

> Untitled Saree 001

---

# **11\. Design Naming**

User can rename the design.

Example:

> Temple Geometry — Burgundy

Design name must be saved automatically.

---

# **12\. Autosave**

Design changes must automatically save.

Display:

Saving...

Saved

Never silently lose design changes.

---

# **13\. Undo / Redo**

Support:

Undo

Redo

Keyboard:

Ctrl/Cmd \+ Z

Ctrl/Cmd \+ Shift \+ Z

Operations should be grouped intelligently so continuous dragging doesn't create hundreds of history entries.

---

# **14\. MATERIAL MODULE**

User selects a textile material.

Initial materials:

Kanchipuram Silk

Banarasi Silk

Mysore Silk

Tussar Silk

Raw Silk

Organza Silk

Crepe Silk

Georgette Silk

The material library must be data-driven.

---

# **15\. Material Data Model**

Material {

&nbsp;&nbsp;id

&nbsp;&nbsp;name

&nbsp;&nbsp;fiber

&nbsp;&nbsp;weaveFamily

&nbsp;&nbsp;description

&nbsp;&nbsp;image

&nbsp;&nbsp;textureImage

&nbsp;&nbsp;availableColours

&nbsp;&nbsp;supportedZariTypes

&nbsp;&nbsp;technicalProperties

&nbsp;&nbsp;manufacturingRules

&nbsp;&nbsp;status

}

Unknown technical information must remain `null`.

The system must never fabricate manufacturing specifications.

---

# **16\. COLOUR MODULE**

User can configure:

Body Colour

Motif Colour

Border Colour

Pallu Colour

Zari Colour

Support:

* HEX  
* RGB  
* colour picker  
* saved swatches  
* recent colours  
* palette creation  
* colour duplication

Future AI:

Generate palette

Extract palette

Recommend colour

Generate colourways

These AI functions are paid-only.

---

# **17\. ARTWORK MODULE**

User must be able to upload artwork.

Supported:

PNG

JPG

JPEG

WEBP

SVG

Maximum file size must be configurable.

Initial recommended limit:

20 MB

---

# **18\. Artwork Editor**

User can:

* move  
* scale  
* rotate  
* duplicate  
* delete  
* hide/show  
* adjust opacity  
* crop  
* lock  
* rename layer  
* reorder layers

Artwork must be represented as layers.

Example:

Layers

&nbsp;

☑ Lotus Motif

☑ Temple Border

☑ Central Motif

☐ Background

---

# **19\. Repeat Engine**

The repeat engine is a core system.

Supported repeat types:

Grid

Half Drop

Brick

Mirror

Tossed

Stripe

Custom

User controls:

Repeat Width

Repeat Height

X Offset

Y Offset

Scale

Rotation

Mirror X

Mirror Y

Spacing

The system must show a live repeat preview.

---

# **20\. Physical Scale**

The Studio must distinguish:

> Digital pixels

from:

> Physical textile dimensions.

Example:

Artwork width:

120 px

&nbsp;

Physical equivalent:

4 cm

The system must eventually support:

pixels → millimetres → centimetres

based on design scale.

---

# **21\. Saree Canvas**

The main canvas must represent a complete saree.

Recommended initial default:

Saree Length: 5.5 metres

Saree Width: 1.2 metres

These values must be configurable.

The canvas should visually identify:

Pallu

Body

Border

---

# **22\. BODY DESIGN**

The body should occupy the main textile region.

User can:

* apply artwork  
* apply repeat  
* change scale  
* change density  
* change colour  
* remove artwork  
* create multiple layers  
* preview repeat

---

# **23\. BORDER DESIGNER**

Border is independent from body.

User can define:

Border Width

Border Artwork

Border Repeat

Border Colour

Zari

Motif Scale

Example:

2 cm

4 cm

6 cm

8 cm

10 cm

Custom

---

# **24\. PALLU DESIGNER**

Pallu must be independent.

Controls:

Pallu Length

Pallu Artwork

Pallu Repeat

Central Motif

Pallu Border

Zari

Colour

The system must prevent accidental changes to the body when editing the pallu.

---

# **25\. ZARI MODULE**

Support conceptual zari configuration.

Gold

Antique Gold

Silver

Copper

Custom

Properties:

Zari Type

Zari Colour

Density

Placement

Width

The Studio must clearly label any non-validated technical calculation as an estimate.

---

# **26\. Saree Design Preview**

Provide:

### **Flat View**

Complete textile laid flat.

### **Section View**

Pallu

Body

Border

### **Macro View**

Zoom into:

Silk texture

Motif

Zari

Weave

---

# **27\. FEMALE MODEL DRAPE — CORE FEATURE**

This is a **major requirement**, not an optional image preview.

The user must be able to take the digital saree and see it applied to a female model.

Primary workflow:

DESIGN SAREE

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↓

SAVE

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↓

DRAPE

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↓

SELECT MODEL

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↓

APPLY SAREE

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↓

VIEW FINAL LOOK

---

# **28\. Model Library**

The Studio must provide predefined female model templates.

Initial MVP:

Model 01

Model 02

Model 03

Model 04

Models should represent different:

* body proportions  
* poses  
* skin tones  
* hairstyles  
* styling

The exact models/assets should be controlled through a model registry.

---

# **29\. Model View**

Example:

┌─────────────────────────────┐

│                             │

│        FEMALE MODEL         │

│                             │

│        ┌─────────┐          │

│        │         │          │

│        │ SAREE   │          │

│        │ DRAPE   │          │

│        │         │          │

│        └─────────┘          │

│                             │

└─────────────────────────────┘

---

# **30\. Drape Application**

The system must map the 2D saree design to the drape representation.

At minimum:

Pallu → Shoulder/Pallu region

Body → Main draped body

Border → Visible border regions

The system must preserve:

* artwork scale  
* colour  
* repeat  
* border  
* pallu  
* zari appearance

as accurately as the visualization technology permits.

---

# **31\. Drape Modes**

Provide:

### **Front View**

### **Three-Quarter View**

### **Side View**

### **Back View**

### **Full Look**

User can rotate between predefined views.

---

# **32\. Drape Zoom**

Support:

25%

50%

75%

100%

150%

200%

and:

Fit Model

Fit Saree

---

# **33\. Model Styling**

Initially, model styling should be predefined.

Example:

Hair

Jewellery

Blouse

Footwear

Background

Future versions may allow customization.

---

# **34\. Blouse**

The blouse must be independently configurable.

Initial options:

Blouse Colour

Blouse Sleeve

Blouse Neck

Blouse Material

Future:

AI blouse design

Custom blouse artwork

AI functionality remains paid-only.

---

# **35\. Drape Realism Requirement**

The drape visualization must not falsely claim to represent the exact physical final product.

UI should display:

> **Digital Drape Preview**

rather than:

> Exact final appearance

because actual physical behaviour depends on:

* fabric properties  
* weave  
* weight  
* finishing  
* draping method  
* body movement  
* lighting

---

# **36\. Drape Technology Architecture**

The system should use an abstraction layer:

DrapeEngine

rather than tightly coupling the Studio to one rendering method.

interface DrapeEngine {

&nbsp;&nbsp;applyDesign(

&nbsp;&nbsp;&nbsp;&nbsp;sareeDesign: SareeDesign,

&nbsp;&nbsp;&nbsp;&nbsp;model: ModelTemplate

&nbsp;&nbsp;): Promise\<DrapeResult\>

}

Future implementations can include:

2D compositing

3D texture mapping

Cloth simulation

AI visualization

---

# **37\. MVP Drape Engine**

For MVP, use a controlled model/template-based visualization system.

Example:

Model Template

\+

Saree UV/Mask Regions

\+

Design Texture

\=

Draped Preview

This allows the same saree design to be rendered consistently.

---

# **38\. Future AI Drape Engine**

Provision architecture for:

Saree Design

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\+

Female Model

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\+

Drape Instruction

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↓

AI Drape Generation

Example future prompt:

> Apply this exact saree design to the selected female model while preserving the artwork scale, border width, pallu design and colour relationships.

This must be an **AI paid feature**.

---

# **39\. Drape Fidelity**

The application should provide a fidelity indicator:

DIGITAL PREVIEW

&nbsp;

Material fidelity: Medium

Pattern fidelity: High

Colour fidelity: High

Drape fidelity: Approximate

This prevents users from assuming the digital model is physically exact.

---

# **40\. Design → Drape Synchronization**

If the user changes:

Body Colour

the draped model should update.

If the user changes:

Border Width

the drape should update.

If the user changes:

Pallu

the drape should update.

Therefore:

Single Source of Truth

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↓

SareeDesign

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;├── Canvas

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;├── Preview

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;├── Drape

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;├── Pricing

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└── Future Manufacturing

There must not be separate manually edited versions.

---

# **41\. AI Assistant — Future Provision**

A persistent AI button:

✦ VELVOREA AI

must exist in the architecture.

Potential future functions:

Generate Motif

Generate Artwork

Create Repeat

Generate Colourway

Design Border

Design Pallu

Analyse Artwork

Critique Design

Suggest Improvements

Check Manufacturability

Generate Drape

Every function must check entitlement before execution.

---

# **42\. AI Entitlement API**

Example:

GET /api/ai/entitlement

Response:

{

&nbsp;&nbsp;"enabled": false,

&nbsp;&nbsp;"plan": "FREE",

&nbsp;&nbsp;"features": {

&nbsp;&nbsp;&nbsp;&nbsp;"motifGeneration": false,

&nbsp;&nbsp;&nbsp;&nbsp;"repeatGeneration": false,

&nbsp;&nbsp;&nbsp;&nbsp;"colourAssistant": false,

&nbsp;&nbsp;&nbsp;&nbsp;"drapeGeneration": false

&nbsp;&nbsp;}

}

For a paid user:

{

&nbsp;&nbsp;"enabled": true,

&nbsp;&nbsp;"plan": "PRO",

&nbsp;&nbsp;"features": {

&nbsp;&nbsp;&nbsp;&nbsp;"motifGeneration": true,

&nbsp;&nbsp;&nbsp;&nbsp;"repeatGeneration": true,

&nbsp;&nbsp;&nbsp;&nbsp;"colourAssistant": true,

&nbsp;&nbsp;&nbsp;&nbsp;"drapeGeneration": true

&nbsp;&nbsp;}

}

---

# **43\. AI Gateway**

All future AI requests should pass through:

/api/ai/\*

Example:

POST /api/ai/motif

POST /api/ai/repeat

POST /api/ai/colour

POST /api/ai/border

POST /api/ai/pallu

POST /api/ai/critique

POST /api/ai/drape

The backend checks:

1. Authentication  
2. User account  
3. Subscription  
4. Feature entitlement  
5. Usage limits  
6. Request validity  
7. Gemini configuration

Only then call Gemini.

---

# **44\. AI Provider Abstraction**

Do not hard-code the application directly to Gemini everywhere.

Create:

interface AIProvider {

&nbsp;&nbsp;analyzeImage()

&nbsp;&nbsp;generateDesign()

&nbsp;&nbsp;generateRepeat()

&nbsp;&nbsp;generateColourway()

&nbsp;&nbsp;critiqueDesign()

&nbsp;&nbsp;generateDrape()

}

Then:

AIProvider

&nbsp;&nbsp;&nbsp;&nbsp;│

&nbsp;&nbsp;&nbsp;&nbsp;└── GeminiProvider

This allows future providers without rebuilding the Studio.

---

# **45\. Design Versioning**

Every significant saved state can become a version.

V1 — Initial

V2 — New border

V3 — New pallu

V4 — Final colour

User can:

Compare

Restore

Duplicate

Rename

Delete

---

# **46\. Design History**

Maintain:

Created

Material Changed

Artwork Added

Artwork Moved

Repeat Changed

Border Changed

Pallu Changed

Colour Changed

Drape Viewed

Version Saved

---

# **47\. Export**

User must eventually be able to export:

### **Design Sheet**

Saree preview

Material

Colour palette

Repeat

Border

Pallu

Zari

### **Flat Textile**

PNG/JPEG

### **Drape Preview**

PNG/JPEG

### **Design Specification**

PDF

Future:

Production file

Technical specification

Saree Passport

---

# **48\. Design Sharing**

Future functionality:

Share Design

creates:

velvorea.com/design/abc123

Permissions:

Private

Anyone with link

Team

---

# **49\. Security**

Each design must belong to a user.

design.ownerId \=== authenticatedUser.id

Users must never be able to access another user's private designs.

All design APIs must enforce server-side authorization.

---

# **50\. Artwork Security**

Uploaded artwork must:

* validate MIME type  
* validate file size  
* scan where appropriate  
* generate safe storage names  
* prevent executable uploads  
* use signed URLs where appropriate

---

# **51\. Performance Requirements**

### **Studio initial load**

Target:

**\< 3 seconds** on a good broadband connection.

### **Design interaction**

Target:

**\<100 ms perceived response** for normal canvas interactions.

### **Artwork**

Large artwork must not block the main UI thread.

Use:

Web Workers

Canvas

OffscreenCanvas where supported

where appropriate.

---

# **52\. Autosave Performance**

Autosave must be debounced.

Example:

User changes design

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↓

Wait 1–2 seconds

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↓

Save

Do not send an API request for every mouse movement.

---

# **53\. Responsive Design**

Desktop:

1440+

Tablet:

768–1439

Mobile:

320–767

Mobile should support:

* design inspection  
* colour changes  
* basic artwork movement  
* preview  
* drape preview  
* save  
* versioning

Advanced editing may be simplified on mobile.

---

# **54\. Accessibility**

Target:

**WCAG 2.2 AA**

Support:

* keyboard navigation  
* visible focus  
* semantic buttons  
* accessible colour controls  
* screen-reader labels  
* reduced motion  
* sufficient contrast  
* keyboard undo/redo

---

# **55\. Error Handling**

Example:

Unable to save your design.

&nbsp;

Your local changes are محفوظ/temporarily stored.

&nbsp;

\[ Retry \]

For AI:

AI service unavailable.

&nbsp;

Your design has not been changed.

&nbsp;

\[ Try Again \]

For drape:

Unable to generate the drape preview.

&nbsp;

Your saree design is safe.

&nbsp;

\[ Retry \]

Never lose the design because a secondary service fails.

---

# **56\. Offline / Local Recovery**

The browser should maintain a local draft.

If:

Internet disconnects

the user should still retain recent work.

When connectivity returns:

Local Draft

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↓

Sync

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↓

Server

Conflict handling must be implemented.

---

# **57\. Database Entities**

Minimum database structure:

users

designs

design\_versions

materials

material\_variants

colour\_palettes

artworks

artwork\_layers

repeat\_configurations

borders

pallus

zari\_configurations

models

model\_templates

drape\_previews

subscriptions

entitlements

ai\_usage

ai\_requests

exports

---

# **58\. Core Design Entity**

interface SareeDesign {

&nbsp;&nbsp;id: string;

&nbsp;&nbsp;ownerId: string;

&nbsp;

&nbsp;&nbsp;name: string;

&nbsp;

&nbsp;&nbsp;material: MaterialConfiguration;

&nbsp;

&nbsp;&nbsp;palette: ColourConfiguration;

&nbsp;

&nbsp;&nbsp;artwork: ArtworkLayer\[\];

&nbsp;

&nbsp;&nbsp;repeat: RepeatConfiguration;

&nbsp;

&nbsp;&nbsp;body: BodyConfiguration;

&nbsp;

&nbsp;&nbsp;border: BorderConfiguration;

&nbsp;

&nbsp;&nbsp;pallu: PalluConfiguration;

&nbsp;

&nbsp;&nbsp;zari: ZariConfiguration;

&nbsp;

&nbsp;&nbsp;blouse: BlouseConfiguration;

&nbsp;

&nbsp;&nbsp;dimensions: SareeDimensions;

&nbsp;

&nbsp;&nbsp;selectedModel?: string;

&nbsp;

&nbsp;&nbsp;drape?: DrapeConfiguration;

&nbsp;

&nbsp;&nbsp;pricing?: PricingEstimate;

&nbsp;

&nbsp;&nbsp;manufacturability?: ManufacturabilityResult;

&nbsp;

&nbsp;&nbsp;version: number;

&nbsp;

&nbsp;&nbsp;createdAt: string;

&nbsp;&nbsp;updatedAt: string;

}

---

# **59\. Drape Entity**

interface DrapeConfiguration {

&nbsp;&nbsp;modelId: string;

&nbsp;

&nbsp;&nbsp;view:

&nbsp;&nbsp;&nbsp;&nbsp;| "front"

&nbsp;&nbsp;&nbsp;&nbsp;| "three-quarter"

&nbsp;&nbsp;&nbsp;&nbsp;| "side"

&nbsp;&nbsp;&nbsp;&nbsp;| "back";

&nbsp;

&nbsp;&nbsp;blouse: BlouseConfiguration;

&nbsp;

&nbsp;&nbsp;background: BackgroundConfiguration;

&nbsp;

&nbsp;&nbsp;renderingMode:

&nbsp;&nbsp;&nbsp;&nbsp;| "template"

&nbsp;&nbsp;&nbsp;&nbsp;| "3d"

&nbsp;&nbsp;&nbsp;&nbsp;| "ai";

&nbsp;

&nbsp;&nbsp;previewUrl?: string;

&nbsp;

&nbsp;&nbsp;generatedAt?: string;

}

---

# **60\. Design State Architecture**

The entire Studio should have one central state.

SareeDesign

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;│

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;├── Material

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;├── Colour

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;├── Artwork

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;├── Repeat

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;├── Border

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;├── Pallu

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;├── Zari

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;├── Blouse

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;├── Drape

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└── Preview

All UI components derive their state from this model.

---

# **61\. Pricing Provision**

The Studio may display estimated pricing later.

Architecture:

Material

\+

Saree Length

\+

Zari

\+

Complexity

\+

Border

\+

Pallu

\+

Production

\=

Estimated Price

Pricing must be clearly marked:

> **Estimated**

unless backed by actual manufacturing quotations.

---

# **62\. Manufacturability Provision**

The architecture must support:

ManufacturabilityEngine

Future checks:

Motif complexity

Minimum detail

Colour count

Repeat size

Border complexity

Zari density

Material compatibility

Production limitations

AI suggestions must never replace deterministic manufacturing rules.

---

# **63\. Important Design Principle**

The Studio must maintain this distinction:

DIGITAL DESIGN

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;≠

TECHNICAL DESIGN

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;≠

DIGITAL DRAPE

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;≠

PHYSICAL SAMPLE

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;≠

PRODUCTION APPROVAL

This must appear throughout the product architecture.

---

# **64\. User Journey**

The ideal user journey:

Google Login

&nbsp;&nbsp;&nbsp;&nbsp;↓

Textile Studio

&nbsp;&nbsp;&nbsp;&nbsp;↓

Create Saree

&nbsp;&nbsp;&nbsp;&nbsp;↓

Choose Silk

&nbsp;&nbsp;&nbsp;&nbsp;↓

Choose Colour

&nbsp;&nbsp;&nbsp;&nbsp;↓

Upload Artwork

&nbsp;&nbsp;&nbsp;&nbsp;↓

Arrange Motif

&nbsp;&nbsp;&nbsp;&nbsp;↓

Create Repeat

&nbsp;&nbsp;&nbsp;&nbsp;↓

Design Border

&nbsp;&nbsp;&nbsp;&nbsp;↓

Design Pallu

&nbsp;&nbsp;&nbsp;&nbsp;↓

Add Zari

&nbsp;&nbsp;&nbsp;&nbsp;↓

Review Flat Saree

&nbsp;&nbsp;&nbsp;&nbsp;↓

Apply to Female Model

&nbsp;&nbsp;&nbsp;&nbsp;↓

Select Model

&nbsp;&nbsp;&nbsp;&nbsp;↓

View Front

&nbsp;&nbsp;&nbsp;&nbsp;↓

View 3/4

&nbsp;&nbsp;&nbsp;&nbsp;↓

View Side

&nbsp;&nbsp;&nbsp;&nbsp;↓

Compare Versions

&nbsp;&nbsp;&nbsp;&nbsp;↓

Save Design

&nbsp;&nbsp;&nbsp;&nbsp;↓

Export

Future:

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↓

AI Assistance

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↓

Manufacturability

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↓

Price

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↓

Physical Sample

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↓

Production

---

# **65\. Definition of Done — MVP**

The Textile Studio MVP should not be considered complete until a user can:

* Sign in with Google  
* Create a new saree  
* Name the design  
* Select a material  
* Select body colour  
* Upload artwork  
* Move artwork  
* Scale artwork  
* Rotate artwork  
* Create a repeat  
* Change repeat scale  
* Configure border  
* Configure pallu  
* Configure zari  
* View complete flat saree  
* Undo/redo  
* Autosave  
* Create versions  
* Select a female model  
* Apply saree design to model  
* View front drape  
* View three-quarter drape  
* View side/back preview  
* Change design and see drape update  
* Save drape preview  
* Export design  
* Recover work after refresh  
* Receive clear AI paywall when AI tools are selected  
* Have no AI API call made for non-entitled users

---

# **66\. Future AI Feature Matrix**

The application should be designed now for these future features:

| AI Feature | MVP UI Provision | AI Activation |
| ----- | ----- | ----- |
| AI Motif Generator | Yes | Paid |
| AI Artwork Generator | Yes | Paid |
| Image → Motif | Yes | Paid |
| AI Repeat Maker | Yes | Paid |
| AI Colour Assistant | Yes | Paid |
| AI Colourway Generator | Yes | Paid |
| AI Border Designer | Yes | Paid |
| AI Pallu Designer | Yes | Paid |
| AI Design Critic | Yes | Paid |
| AI Textile Analyst | Yes | Paid |
| AI Manufacturability Assistant | Yes | Paid |
| AI Drape | Yes | Paid |
| AI Model Generation | Future | Paid |
| AI Photoshoot | Future | Paid |

---

# **67\. The Most Important Architecture Decision**

I strongly recommend that **AI never become the source of truth for the saree**.

For example, if the user asks:

> "Make the border 6 cm."

Gemini should not directly manipulate the database.

Instead:

User

&nbsp;↓

AI

&nbsp;↓

Structured Command

&nbsp;↓

Validation

&nbsp;↓

Design Engine

&nbsp;↓

Preview

&nbsp;↓

User Approval

&nbsp;↓

Save

Example:

{

&nbsp;&nbsp;"operation": "UPDATE\_BORDER",

&nbsp;&nbsp;"widthCm": 6

}

The deterministic Textile Studio engine applies it.

This means you can eventually change Gemini to another model without rebuilding your core application.

---

# **68\. Final Product Architecture**

The final VELVOREA Textile Studio should conceptually become:

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;VELVOREA

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;TEXTILE STUDIO

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;│

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;┌──────────────┴──────────────┐

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;│                             │

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;DESIGN ENGINE                 AI ENGINE

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;│                             │

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;┌───────┼────────┐              Gemini Gateway

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;│       │        │                    │

&nbsp;&nbsp;Material Artwork  Repeat              Paid Only

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;│       │        │

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;├───────┼────────┤

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;│       │        │

&nbsp;&nbsp;Border   Pallu     Zari

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;│       │        │

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└───────┼────────┘

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;│

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;SAREE DESIGN

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;│

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;┌─────┴─────┐

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;│           │

&nbsp;&nbsp;&nbsp;FLAT VIEW    DRAPE ENGINE

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;│

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Female Model

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;│

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;┌──────────┼──────────┐

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;│          │          │

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Front      3/4        Side/Back

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;│          │          │

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└──────────┼──────────┘

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;│

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;DIGITAL DRAPE

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;│

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Export / Share

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;│

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Future Manufacturing

## **The core product proposition should ultimately be:**

> **Design the silk. Define the pattern. Shape the border. Compose the pallu. Add the zari. See it draped. Then take the design toward production.**

That gives VELVOREA a much stronger product identity than simply **“an AI saree generator.”**

**AI is an accelerator; the Textile Studio itself is the product.**

&nbsp;