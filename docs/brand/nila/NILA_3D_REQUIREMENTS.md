# 

\# VELVOREA — Nila 3D Digital Model

\#\# Product & Engineering Requirements

&nbsp;

\*\*Document:\*\* 21-nila-3d-model-requirements.md&nbsp;&nbsp;

\*\*Product:\*\* VELVOREA — Contemporary Silk Atelier&nbsp;&nbsp;

\*\*Feature:\*\* Nila 3D Digital Model&nbsp;&nbsp;

\*\*Primary Use:\*\* Textile Studio / Saree Drape / Digital Look Visualization&nbsp;&nbsp;

\*\*Status:\*\* Implementation Specification&nbsp;&nbsp;

\*\*Owner:\*\* VELVOREA Product&nbsp;&nbsp;

\*\*Implementation Agent:\*\* Claude Code&nbsp;&nbsp;

&nbsp;

\---

&nbsp;

\# 1\. Purpose

&nbsp;

Create a production-ready 3D digital representation of \*\*Nila\*\*, the fictional VELVOREA digital fashion model, using the existing Nila reference image stored inside the repository.

&nbsp;

Nila will become a reusable digital character asset for:

&nbsp;

\- VELVOREA Textile Studio

\- Saree drape visualization

\- Saree design presentation

\- Front / 3/4 / side / back visualization

\- Digital lookbook

\- Product visualization

\- Future virtual showroom

\- Future campaign visualization

\- Future 3D fashion experiences

&nbsp;

The objective is NOT merely to create a static 3D-looking image.

&nbsp;

The objective is to establish a reusable, technically structured digital character asset that can eventually be rendered and used inside the VELVOREA web application.

&nbsp;

\---

&nbsp;

\# 2\. Critical Product Principle

&nbsp;

Nila is a canonical fictional VELVOREA digital model.

&nbsp;

The Nila reference image already present in the repository is the authoritative source for her visual identity.

&nbsp;

The implementation must preserve Nila's identity consistently.

&nbsp;

Do not redesign Nila.

&nbsp;

Do not arbitrarily modify:

&nbsp;

\- face

\- facial proportions

\- skin tone

\- eye characteristics

\- nose

\- lips

\- jaw

\- hair characteristics

\- overall appearance

&nbsp;

Do not create a new generic Indian female model and call her Nila.

&nbsp;

\---

&nbsp;

\# 3\. Important Technical Distinction

&nbsp;

A generated image is NOT a 3D model.

&nbsp;

The required final asset should support a pipeline similar to:

&nbsp;

Nila Reference

&nbsp;&nbsp;&nbsp;&nbsp;↓

Identity Reference Set

&nbsp;&nbsp;&nbsp;&nbsp;↓

3D Character

&nbsp;&nbsp;&nbsp;&nbsp;↓

Clean Mesh

&nbsp;&nbsp;&nbsp;&nbsp;↓

Materials / Textures

&nbsp;&nbsp;&nbsp;&nbsp;↓

Rig / Skeleton

&nbsp;&nbsp;&nbsp;&nbsp;↓

UV Mapping

&nbsp;&nbsp;&nbsp;&nbsp;↓

Saree-Ready Body

&nbsp;&nbsp;&nbsp;&nbsp;↓

GLB / GLTF

&nbsp;&nbsp;&nbsp;&nbsp;↓

Web Rendering

&nbsp;&nbsp;&nbsp;&nbsp;↓

VELVOREA Textile Studio

&nbsp;

The resulting asset must be suitable for future integration with:

&nbsp;

\- Three.js

\- React Three Fiber

\- WebGL

\- GLB / GLTF

\- 3D garment systems

\- Saree drape systems

\- Cloth simulation

&nbsp;

\---

&nbsp;

\# 4\. Repository-First Requirement

&nbsp;

Before making any changes:

&nbsp;

1\. Inspect the entire existing repository.

2\. Locate the Nila reference image.

3\. Identify its exact path.

4\. Inspect existing VELVOREA asset conventions.

5\. Inspect existing \`/public/assets\` structure.

6\. Inspect existing media registry architecture.

7\. Inspect existing Textile Studio architecture.

8\. Inspect existing design data model.

9\. Inspect existing documentation.

10\. Read the master product requirements before implementation.

&nbsp;

Do NOT assume paths.

&nbsp;

Do NOT duplicate existing media architecture.

&nbsp;

Do NOT create a second unrelated asset-management system.

&nbsp;

Do NOT overwrite the original Nila reference image.

&nbsp;

\---

&nbsp;

\# 5\. Existing Nila Reference

&nbsp;

The repository already contains the canonical Nila reference image.

&nbsp;

Claude Code must:

&nbsp;

\- locate it automatically

\- report the path

\- inspect dimensions

\- inspect format

\- inspect file size

\- preserve the original

\- create derivative assets only where required

\- register the asset in the existing media architecture if applicable

&nbsp;

The original reference must remain immutable.

&nbsp;

Recommended metadata:

&nbsp;

\`\`\`ts

interface NilaReferenceAsset {

&nbsp;&nbsp;id: string;

&nbsp;&nbsp;type: "character\_reference";

&nbsp;&nbsp;character: "nila";

&nbsp;&nbsp;path: string;

&nbsp;&nbsp;source: "VELVOREA\_CANONICAL\_REFERENCE";

&nbsp;&nbsp;immutable: true;

}

Do not fabricate metadata that cannot be verified.

---

# **6\. Nila Asset Architecture**

Create a canonical Nila asset structure.

Preferred logical structure:

Nila

├── Identity

│   ├── master-reference

│   ├── front

│   ├── three-quarter-left

│   ├── three-quarter-right

│   ├── profile-left

│   ├── profile-right

│   ├── back

│   └── full-body

│

├── 3D

│   ├── source

│   ├── working

│   ├── production

│   └── exports

│

├── Textures

│   ├── skin

│   ├── face

│   ├── hair

│   ├── eyes

│   └── other

│

├── Rig

│   ├── skeleton

│   └── controls

│

├── Preview

│   ├── front

│   ├── three-quarter

│   ├── side

│   └── back

│

└── Documentation

&nbsp;&nbsp;&nbsp;&nbsp;├── identity

&nbsp;&nbsp;&nbsp;&nbsp;├── technical

&nbsp;&nbsp;&nbsp;&nbsp;└── provenance

Adapt this to the existing repository architecture rather than blindly creating these exact folders.

---

# **7\. Canonical Asset Identifier**

Use a stable identifier:

character.nila

Possible asset identifiers:

character.nila.reference

character.nila.model

character.nila.production

character.nila.preview

Do not use filenames as business identifiers.

---

# **8\. Identity Preservation**

The generated 3D model must preserve:

### **Face**

* overall facial structure  
* facial proportions  
* eye placement  
* eye shape  
* eyebrow characteristics  
* nose structure  
* lip structure  
* jawline  
* cheek structure  
* chin  
* natural asymmetry

### **Skin**

* natural skin tone  
* realistic skin texture  
* realistic subsurface scattering  
* natural pores  
* realistic roughness

Avoid:

* plastic skin  
* porcelain skin  
* excessive beauty retouching  
* artificial glow  
* excessive smoothing

### **Hair**

Preserve the characteristic appearance of Nila's hair.

Hair must be represented as a proper 3D asset rather than a painted approximation wherever practical.

---

# **9\. Body Requirements**

Nila must have realistic human anatomy.

Do not exaggerate:

* waist  
* hips  
* bust  
* legs  
* arms  
* height  
* proportions

The body must be suitable for clothing visualization.

The model must support a saree.

Important areas:

* shoulders  
* torso  
* waist  
* hips  
* arms  
* hands  
* legs  
* feet

must have sufficient geometry for believable garment interaction.

---

# **10\. Saree-Ready Requirements**

Nila is not a generic character.

The body must be prepared for saree visualization.

The geometry should support:

* blouse  
* waist region  
* saree body  
* pleats  
* pallu  
* shoulder drape  
* border  
* pallu border  
* zari  
* blouse sleeves

The design should anticipate future garment interaction.

Avoid geometry that makes saree placement impossible.

---

# **11\. Neutral Base Garment**

The base character should use a simple neutral fitted garment suitable for technical visualization.

Do not use:

* saree  
* fashion gown  
* elaborate dress  
* jewelry  
* accessories  
* handbags  
* shoes that interfere with saree visualization

The base garment exists primarily to make the character usable as a digital fashion mannequin.

---

# **12\. Pose Requirements**

Create a neutral primary pose.

Preferred:

* standing  
* upright  
* balanced  
* feet naturally separated  
* arms slightly away from torso  
* hands clearly separated from body  
* relaxed shoulders  
* neutral facial expression

The model should be suitable for:

* rigging  
* animation  
* cloth simulation  
* garment fitting  
* camera rotation

---

# **13\. Reference Views**

Create or derive a consistent reference set where possible:

1. Front  
2. 3/4 left  
3. 3/4 right  
4. Left profile  
5. Right profile  
6. Back  
7. Full body

All views must represent the same Nila.

Maintain:

* same identity  
* same hairstyle  
* same proportions  
* same skin tone  
* same visual age  
* same general appearance

Do not allow each generated angle to become a different interpretation of Nila.

---

# **14\. 3D Geometry Requirements**

The final model must contain clean topology.

Requirements:

* watertight character mesh where appropriate  
* clean edge flow  
* reasonable polygon density  
* deformation-friendly topology  
* clean facial topology  
* clean shoulder topology  
* clean elbow topology  
* clean knee topology  
* clean hand topology  
* clean neck topology

Avoid:

* unnecessary dense geometry  
* broken normals  
* non-manifold geometry  
* visible mesh artifacts  
* intersecting geometry  
* obvious deformation failures

---

# **15\. Level of Detail**

Prepare a strategy for multiple levels of detail.

At minimum define:

### **High**

Used for:

* source  
* offline rendering  
* future high-quality visualization

### **Medium**

Used for:

* desktop web  
* Textile Studio

### **Low**

Used for:

* mobile  
* previews  
* future performance-sensitive experiences

Do not prematurely create unnecessary versions if the chosen 3D pipeline can generate them automatically.

Document the chosen approach.

---

# **16\. Materials**

Use physically based materials.

Minimum materials:

Skin

Hair

Eyes

Iris

Cornea

Teeth

Base Garment

Recommended PBR properties:

* Base Color  
* Roughness  
* Metallic where appropriate  
* Normal  
* Subsurface / transmission where supported  
* Ambient occlusion where appropriate

Skin should not be metallic.

Hair should have realistic highlights and roughness variation.

Eyes should contain realistic depth and reflections.

---

# **17\. UV Requirements**

The character must have usable UV coordinates.

UVs must support future texture replacement.

This is particularly important because future VELVOREA functionality may involve:

* makeup  
* skin variants  
* lighting variants  
* garment interaction  
* material previews  
* digital photography

The UV layout must be documented.

---

# **18\. Rigging**

Create a production-quality humanoid rig or a rig-compatible skeleton.

Minimum skeletal requirements:

Root

&nbsp;├── Pelvis

&nbsp;│   ├── Spine

&nbsp;│   │   ├── Chest

&nbsp;│   │   │   ├── Neck

&nbsp;│   │   │   │   └── Head

&nbsp;│   │   │   ├── Left Shoulder

&nbsp;│   │   │   └── Right Shoulder

&nbsp;│   ├── Left Leg

&nbsp;│   └── Right Leg

&nbsp;└── ...

The exact skeleton may depend on the selected 3D pipeline.

It must support:

* standing  
* walking  
* turning  
* arm movement  
* camera presentation poses  
* saree visualization

---

# **19\. Facial Rigging**

Do not over-engineer facial animation in the first implementation.

However, the architecture should allow future facial controls.

Future-compatible targets may include:

* blink  
* eye direction  
* smile  
* neutral  
* mouth movement  
* eyebrow movement

For MVP:

Neutral

Smile

Blink

are sufficient if facial rigging is implemented.

---

# **20\. Hair**

Hair should be treated as a separate technical asset where practical.

Requirements:

* natural silhouette  
* realistic strands or strand-like geometry  
* no obvious helmet effect  
* no excessive polygon cost  
* suitable for web rendering

Support future variants:

hair-down

hair-up

Do not create arbitrary hairstyles that change Nila's identity.

---

# **21\. Nila Production Format**

The production web asset should preferably support:

GLB / GLTF

The final asset should be optimized for web delivery.

Do not ship:

* raw modeling files  
* unnecessarily huge textures  
* unused geometry  
* unused materials  
* development-only assets

to the browser.

Source files may remain outside the public production bundle.

---

# **22\. Web Integration**

The architecture must allow:

Nila GLB

&nbsp;&nbsp;&nbsp;↓

Three.js / React Three Fiber

&nbsp;&nbsp;&nbsp;↓

VELVOREA Textile Studio

Create a reusable component conceptually equivalent to:

\<NilaModel

&nbsp;&nbsp;pose="neutral"

&nbsp;&nbsp;camera="front"

&nbsp;&nbsp;saree={sareeDesign}

&nbsp;&nbsp;showControls

/\>

Do not necessarily implement this exact API if the existing architecture dictates another approach.

The principle is that Nila must be a reusable application-level asset.

---

# **23\. Camera Views**

Support at minimum:

Front

3/4 Left

3/4 Right

Side

Back

Camera transitions should be smooth.

The user should eventually be able to rotate around Nila.

Avoid:

* extreme perspective  
* distorted anatomy  
* unnecessary camera shake  
* cinematic effects that make textile evaluation difficult

---

# **24\. Saree Integration Contract**

Nila must eventually accept a canonical VELVOREA `SareeDesign`.

Conceptually:

interface NilaDrapeInput {

&nbsp;&nbsp;modelId: "character.nila";

&nbsp;&nbsp;sareeDesignId: string;

&nbsp;&nbsp;sareeVersionId?: string;

&nbsp;

&nbsp;&nbsp;view:

&nbsp;&nbsp;&nbsp;&nbsp;| "front"

&nbsp;&nbsp;&nbsp;&nbsp;| "three-quarter-left"

&nbsp;&nbsp;&nbsp;&nbsp;| "three-quarter-right"

&nbsp;&nbsp;&nbsp;&nbsp;| "side"

&nbsp;&nbsp;&nbsp;&nbsp;| "back";

&nbsp;

&nbsp;&nbsp;pose?: string;

}

The Nila model should NOT contain a specific saree design permanently.

The saree must remain a separate asset/system.

---

# **25\. Separation of Character and Garment**

This is mandatory.

Architecture:

Nila

\+

Saree Design

\+

Drape Configuration

\=

Digital Look

Not:

Nila-With-Saree.glb

for every individual saree.

This separation allows thousands of future VELVOREA designs to use the same Nila model.

---

# **26\. Drape Architecture**

Create an abstraction for the future drape system.

Recommended conceptual interface:

interface DrapeEngine {

&nbsp;&nbsp;apply(

&nbsp;&nbsp;&nbsp;&nbsp;character: NilaModel,

&nbsp;&nbsp;&nbsp;&nbsp;design: SareeDesign,

&nbsp;&nbsp;&nbsp;&nbsp;configuration: DrapeConfiguration

&nbsp;&nbsp;): DrapeResult;

}

Possible implementations:

TemplateDrapeEngine

ThreeDDrapeEngine

PhysicsDrapeEngine

AIDrapeEngine

MVP should favor a deterministic approach.

Do NOT make random AI image generation the core draping mechanism.

---

# **27\. Drape MVP**

The initial implementation may use a predefined saree garment mesh.

The system should map:

Saree Body Texture

Border Texture

Pallu Texture

Zari Layer

onto the predefined garment.

Example:

SareeDesign

&nbsp;&nbsp;&nbsp;&nbsp;↓

Material

&nbsp;&nbsp;&nbsp;&nbsp;↓

Colour

&nbsp;&nbsp;&nbsp;&nbsp;↓

Artwork

&nbsp;&nbsp;&nbsp;&nbsp;↓

Repeat

&nbsp;&nbsp;&nbsp;&nbsp;↓

Border

&nbsp;&nbsp;&nbsp;&nbsp;↓

Pallu

&nbsp;&nbsp;&nbsp;&nbsp;↓

Zari

&nbsp;&nbsp;&nbsp;&nbsp;↓

Drape Mapping

&nbsp;&nbsp;&nbsp;&nbsp;↓

Nila

---

# **28\. Digital Drape Disclaimer**

The application must clearly distinguish:

Digital Preview

from:

Physical Saree

The 3D visualization must not be presented as guaranteeing exact physical folds, weave behavior, colour, sheen or final appearance.

Recommended terminology:

> Digital Drape Preview

or

> 3D Visualization

Avoid claims such as:

> Exact physical representation

unless technically validated.

---

# **29\. AI Architecture**

AI capabilities must remain behind the existing VELVOREA AI architecture.

Do not expose AI provider credentials to the browser.

If Gemini is the configured LLM provider:

Browser

&nbsp;&nbsp;&nbsp;↓

VELVOREA API

&nbsp;&nbsp;&nbsp;↓

AI Provider abstraction

&nbsp;&nbsp;&nbsp;↓

Gemini

not:

Browser

&nbsp;&nbsp;&nbsp;↓

Gemini API directly

AI capabilities remain paid-only and disabled unless explicitly enabled through the existing entitlement system.

---

# **30\. AI Provisioning**

Potential future capabilities:

ai.drape.generate

ai.pose.generate

ai.look.generate

ai.editorial.generate

ai.saree.visualize

These should initially be:

enabled: false

Do not activate paid AI functionality simply because the infrastructure exists.

---

# **31\. AI Does Not Own Canonical State**

AI may propose:

* pose  
* styling  
* camera  
* drape configuration  
* editorial composition

But AI must not silently mutate the canonical design.

Preferred flow:

User

&nbsp;↓

AI Request

&nbsp;↓

AI Response

&nbsp;↓

Structured Proposal

&nbsp;↓

Validation

&nbsp;↓

User Approval

&nbsp;↓

Canonical State Mutation

---

# **32\. Asset Provenance**

Document how Nila was created.

Create or update:

NILA\_PROVENANCE.md

Record:

* source reference  
* creation method  
* generation/editing tools if known  
* dates where available  
* asset versions  
* ownership information provided by the project  
* derivative relationships

Do not invent provenance.

If provenance is unknown:

UNKNOWN

rather than fabricating it.

---

# **33\. Nila Usage Rules**

Create:

NILA\_USAGE\_GUIDELINES.md

Include rules such as:

### **Allowed**

* VELVOREA website  
* Textile Studio  
* product visualization  
* lookbook  
* campaign artwork  
* social media  
* digital presentations

### **Not allowed**

* representing Nila as a real customer  
* representing Nila as a real employee  
* representing Nila as a real artisan  
* claiming Nila is a real person  
* implying testimonial authenticity  
* using Nila to fabricate documentary evidence

Nila is a fictional digital model.

---

# **34\. Preview Generation**

Generate technical previews for validation:

nila-front.png

nila-three-quarter-left.png

nila-three-quarter-right.png

nila-side.png

nila-back.png

These previews are for QA and visual verification.

They should use consistent:

* camera  
* lighting  
* background  
* scale

---

# **35\. Quality Validation**

Before accepting the model, validate:

## **Identity**

* Does the face resemble the canonical reference?  
* Is identity consistent across views?  
* Are facial proportions preserved?

## **Anatomy**

* Are body proportions natural?  
* Are hands correct?  
* Are fingers correct?  
* Are feet correct?  
* Are joints clean?

## **Geometry**

* No non-manifold geometry  
* No broken normals  
* No obvious intersections  
* No visible topology artifacts

## **Materials**

* Skin realistic  
* Hair realistic  
* Eyes realistic  
* No plastic appearance

## **Rig**

* Arms deform correctly  
* shoulders deform correctly  
* elbows deform correctly  
* hips deform correctly  
* knees deform correctly

## **Web**

* GLB loads successfully  
* textures load successfully  
* model renders correctly  
* no console errors  
* reasonable memory usage

---

# **36\. Automated Validation**

Where technically possible, add validation scripts.

Examples:

validate-nila-model

validate-nila-glb

validate-nila-assets

Validate:

* file exists  
* GLB is readable  
* expected nodes exist  
* expected materials exist  
* expected textures exist  
* file size  
* texture dimensions  
* missing references  
* duplicate assets  
* invalid paths

Do not claim visual quality can be fully validated automatically.

---

# **37\. Performance Requirements**

The web version must be optimized.

Measure:

* GLB size  
* texture size  
* number of materials  
* polygon count  
* draw calls  
* load time  
* memory footprint

Use appropriate compression/optimization where supported by the chosen rendering pipeline.

Do not sacrifice visual quality unnecessarily.

---

# **38\. Mobile Requirements**

Nila must eventually work on mobile devices.

Provide an appropriate lower-detail representation where necessary.

Mobile should not automatically download the highest-quality desktop model.

Use responsive asset selection.

---

# **39\. Loading State**

When loading Nila:

Show a premium but minimal loading state.

Example:

Preparing Nila…

Do not show a generic application spinner if a more contextual loading experience can be implemented.

---

# **40\. Error State**

If Nila fails to load:

Display a useful error.

Example:

> Nila's digital model could not be loaded. Please try again.

Log technical details for developers without exposing implementation details to normal users.

---

# **41\. Offline / Fallback Behavior**

Do not create a fake image fallback that pretends to be the 3D model.

If a 3D model cannot load:

Clearly distinguish:

3D model unavailable

from:

3D model loaded

---

# **42\. Security**

Do not expose:

* API keys  
* provider credentials  
* internal storage credentials  
* private source assets

through client-side code.

Only public production assets should be accessible to the browser.

---

# **43\. Versioning**

Nila must be versionable.

Recommended:

Nila v1.0

Nila v1.1

Nila v2.0

Do not silently replace the canonical model.

Maintain a changelog.

Example:

NILA\_CHANGELOG.md

---

# **44\. Backward Compatibility**

Existing VELVOREA features must continue to work.

Do not break:

* homepage  
* materials  
* Textile Studio  
* design editor  
* existing routes  
* authentication  
* existing media  
* existing design persistence  
* existing AI architecture

---

# **45\. Integration With SareeDesign**

The existing canonical `SareeDesign` model remains the source of truth.

Nila must consume the design rather than creating a second saree-design model.

The relationship should conceptually be:

SareeDesign

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;│

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;▼

DrapeConfiguration

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;│

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;▼

NilaModel

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;│

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;▼

DigitalLook

---

# **46\. Digital Look Entity**

If the existing domain architecture supports it, introduce:

interface DigitalLook {

&nbsp;&nbsp;id: string;

&nbsp;&nbsp;characterId: string;

&nbsp;&nbsp;sareeDesignId: string;

&nbsp;&nbsp;sareeVersionId?: string;

&nbsp;&nbsp;drapeConfigurationId: string;

&nbsp;&nbsp;cameraConfiguration?: object;

&nbsp;&nbsp;poseConfiguration?: object;

&nbsp;&nbsp;createdAt: string;

&nbsp;&nbsp;updatedAt: string;

}

Do not duplicate the entire SareeDesign inside DigitalLook.

---

# **47\. Database Requirements**

If persistence is implemented:

Use the existing production database architecture.

Do NOT use localStorage as the source of truth for saved 3D looks.

Possible entities:

character\_assets

character\_versions

digital\_looks

drape\_configurations

drape\_previews

Adapt to the existing schema.

---

# **48\. Analytics**

Track meaningful product events where the existing analytics architecture supports them.

Potential events:

nila.model.loaded

nila.model.load\_failed

nila.view.changed

nila.drape.started

nila.drape.completed

nila.look.saved

nila.look.exported

Do not track unnecessary personal information.

---

# **49\. Export**

The architecture should support future exports:

* PNG  
* JPG  
* WebP  
* high-resolution digital look  
* future 3D export where appropriate

For MVP, a rendered image export is sufficient if technically practical.

---

# **50\. Export Naming**

Use deterministic names.

Example:

VELVOREA-NILA-DESIGN-123-V01-FRONT.webp

VELVOREA-NILA-DESIGN-123-V01-3Q.webp

Do not expose internal database IDs unnecessarily.

---

# **51\. UI Integration**

The future Textile Studio should provide a clear action:

View on Nila

or:

Drape on Nila

After selecting:

Drape on Nila

the user should enter the digital drape experience.

---

# **52\. Drape Workspace**

Conceptually:

┌───────────────────────────────────────────────┐

│ VELVOREA        Design Name       Save       │

├───────────────┬───────────────────────────────┤

│               │                               │

│ Drape         │                               │

│ Controls      │             NILA              │

│               │                               │

│ • Model       │                               │

│ • View        │                               │

│ • Pose        │                               │

│ • Saree       │                               │

│ • Lighting    │                               │

│               │                               │

├───────────────┴───────────────────────────────┤

│ Front  3/4  Side  Back       Zoom      Export │

└───────────────────────────────────────────────┘

Do not build this UI until the underlying Nila asset architecture is understood.

---

# **53\. Lighting**

The default Nila presentation should use neutral studio lighting.

Lighting should make textile characteristics visible.

Avoid:

* excessive cinematic contrast  
* colored lighting  
* heavy bloom  
* dramatic shadows  
* lighting that hides saree details

Future editorial lighting can be a separate mode.

---

# **54\. Textile Evaluation Priority**

The purpose of Nila inside Textile Studio is primarily to evaluate the saree.

Therefore:

Saree visibility \> dramatic model styling

The user must be able to clearly see:

* colour  
* artwork  
* repeat  
* border  
* pallu  
* zari  
* drape  
* fabric appearance

---

# **55\. Physical Accuracy Boundary**

Do not claim that the 3D model perfectly predicts:

* physical silk folds  
* real-world colour  
* exact zari reflection  
* actual fabric weight  
* exact physical drape

unless these are technically validated.

Use:

> Digital Visualization

instead of:

> Physical Simulation

for MVP where appropriate.

---

# **56\. Documentation Deliverables**

Create/update:

/docs/brand/nila/NILA\_MASTER\_IDENTITY.md

/docs/brand/nila/NILA\_REFERENCE\_REGISTRY.md

/docs/brand/nila/NILA\_VISUAL\_BIBLE.md

/docs/brand/nila/NILA\_GENERATION\_RULES.md

/docs/brand/nila/NILA\_USAGE\_GUIDELINES.md

/docs/brand/nila/NILA\_PROVENANCE.md

/docs/brand/nila/NILA\_CHANGELOG.md

And technical documentation:

/docs/technical/nila-3d-architecture.md

/docs/technical/nila-3d-pipeline.md

/docs/technical/nila-drape-integration.md

Adapt locations to the existing documentation structure.

---

# **57\. Definition of Done**

Nila 3D Model is NOT complete merely because a `.glb` file exists.

The feature is complete when:

## **Asset**

* Canonical reference identified  
* Original preserved  
* Identity documented  
* 3D model created  
* Clean topology  
* UVs created  
* Materials created  
* Hair created  
* Rig created  
* Web-optimized version created

## **Technical**

* GLB/GLTF loads successfully  
* No missing textures  
* No broken materials  
* No console errors  
* Asset registered  
* Versioning implemented  
* Provenance documented

## **VELVOREA**

* Nila is represented as canonical character asset  
* Nila is reusable  
* Nila is separate from SareeDesign  
* Drape architecture exists  
* Textile Studio integration path exists

## **QA**

* Front view validated  
* 3/4 view validated  
* Side view validated  
* Back view validated  
* Identity consistency checked  
* Anatomy checked  
* Hands checked  
* Materials checked  
* Performance checked  
* Mobile strategy checked

---

# **58\. What Claude Code Must NOT Do**

DO NOT:

* replace the existing Nila reference  
* invent a different Nila  
* create a generic avatar  
* create a fake "3D-looking" PNG and call it a 3D model  
* hardcode Nila into one saree  
* duplicate the SareeDesign domain model  
* expose AI keys  
* expose Gemini credentials  
* activate paid AI features  
* use AI as the canonical source of truth  
* silently mutate designs  
* break existing Textile Studio functionality  
* replace existing media architecture  
* introduce unnecessary dependencies  
* create fake manufacturing claims  
* claim physical drape accuracy without validation  
* claim Nila is a real person  
* represent Nila as a real customer, employee or artisan

---

# **59\. Implementation Strategy**

Claude Code MUST work in phases.

## **Phase 1 — Repository Audit**

Before coding:

* inspect repository  
* locate Nila reference  
* inspect architecture  
* inspect asset system  
* inspect Textile Studio  
* inspect existing dependencies  
* inspect rendering architecture  
* inspect documentation

Output:

NILA\_3D\_AUDIT.md

Do not start implementation before completing the audit.

---

## **Phase 2 — Technical Decision**

Determine:

* 3D generation approach  
* modeling pipeline  
* rendering library  
* GLB/GLTF strategy  
* texture strategy  
* rigging strategy  
* web optimization strategy  
* drape architecture

Document the decision.

Do not introduce a technology merely because it is popular.

Choose based on the existing VELVOREA architecture.

---

## **Phase 3 — Character Asset**

Create the Nila 3D asset.

Validate:

* identity  
* anatomy  
* geometry  
* materials  
* UV  
* rig  
* hair  
* export

---

## **Phase 4 — Web Asset**

Create optimized production asset.

Validate:

* GLB  
* textures  
* load time  
* rendering  
* memory  
* mobile strategy

---

## **Phase 5 — Textile Studio Integration**

Integrate Nila without breaking the existing editor.

Implement the minimum viable:

SareeDesign

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↓

Drape

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↓

Nila

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↓

Front / 3Q / Side / Back

---

## **Phase 6 — QA**

Run:

* build  
* lint  
* type checking  
* asset validation  
* route checks  
* rendering checks  
* integration tests

Where browser automation is unavailable, explicitly report that visual browser validation remains pending.

Never claim a test was performed if it was not.

---

# **60\. Required Final Claude Code Report**

At the end, provide:

## **Files Created**

List every new file.

## **Files Modified**

List every modified file.

## **Assets Created**

List:

* reference  
* model  
* textures  
* rig  
* previews  
* exports

## **Architecture Decisions**

Explain the selected:

* modeling pipeline  
* rendering pipeline  
* asset format  
* drape approach

## **Tests**

Report actual:

* build  
* lint  
* typecheck  
* asset validation  
* route tests  
* browser tests

## **Known Limitations**

Clearly distinguish:

IMPLEMENTED

PARTIALLY IMPLEMENTED

PLANNED

REQUIRES EXTERNAL 3D TOOL

Do not hide limitations.

---

# **61\. Final Product Vision**

The final VELVOREA experience should eventually allow:

USER CREATES SAREE

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↓

SELECTS MATERIAL

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↓

SELECTS COLOUR

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↓

CREATES ARTWORK

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↓

CREATES REPEAT

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↓

CONFIGURES BORDER

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↓

CONFIGURES PALLU

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↓

CONFIGURES ZARI

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↓

SAVES DESIGN

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↓

DRAPE ON NILA

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↓

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;┌─────────────────┐

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;│      NILA       │

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;│                 │

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;│   3D DIGITAL    │

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;│     MODEL       │

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└─────────────────┘

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↓

FRONT

3/4

SIDE

BACK

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↓

DIGITAL LOOK

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↓

SAVE

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↓

EXPORT

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↓

TECHNICAL REVIEW

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↓

PHYSICAL SAMPLE

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↓

PRODUCTION

The Nila 3D model is therefore a foundational VELVOREA platform asset, not an isolated visual feature.

---

# **62\. North Star**

The final experience should make the user feel:

> "I designed this saree digitally, and now I can actually see how my design looks when worn."

The system must preserve the distinction between:

DIGITAL CONCEPT

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↓

DIGITAL DESIGN

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↓

3D DIGITAL DRAPE

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↓

TECHNICAL REVIEW

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↓

PHYSICAL SAMPLE

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↓

PRODUCTION

Never collapse these stages into one misleading "AI-generated final product."

---

# **END OF REQUIREMENTS**

&nbsp;

\#\#\# One important thing before you give this to Claude

&nbsp;

There is a practical distinction here that I would \*\*not ask Claude Code to ignore\*\*:

&nbsp;

\*\*Claude Code can build the software architecture and integrate a 3D asset, but it cannot magically turn one PNG into a production-quality \`.glb\` merely through frontend code.\*\*

&nbsp;

Your pipeline should therefore be:

&nbsp;

\*\*Nila reference in repo → create/obtain actual 3D Nila asset → optimize/export GLB → Claude integrates it into VELVOREA.\*\*

&nbsp;

The requirements above deliberately make Claude \*\*audit the repository first\*\* and identify what part can actually be implemented in the current environment rather than pretending a 3D model has been created.

&nbsp;

If you want, I can also create the actual \*\*\`21-nila-3d-model-requirements.md\` file for you as a downloadable file\*\*, ready to put into your repo.

&nbsp;