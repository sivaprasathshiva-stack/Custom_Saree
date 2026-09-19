# NILA Prompt Library

Reusable prompt templates for future Nila generations. Every template separates the fields below; fill placeholders per campaign, don't hardcode a specific future saree into the template itself.

Common placeholders used throughout:
`[SAREE DESIGN]` `[SAREE COLOUR]` `[MATERIAL]` `[BORDER]` `[PALLU]` `[ZARI]` `[LOCATION]` `[CAMPAIGN TYPE]`

Every template must be used together with `NILA_GENERATION_RULES.md` — supply `nila-master-primary.png` plus relevant supporting references per Rules 3–4.

---

### 1. Nila Portrait
- **Identity:** nila-master-primary.png + nila-front-portrait.png
- **Wardrobe:** [SAREE DESIGN] blouse, [MATERIAL]
- **Saree:** [SAREE COLOUR] [MATERIAL], [BORDER] border
- **Pose:** Head-and-shoulders, facing camera, relaxed posture
- **Location:** [LOCATION] — neutral or softly blurred background
- **Lighting:** Soft natural window light, warm tone
- **Camera:** 85mm-equivalent, shallow depth of field
- **Composition:** Centred or rule-of-thirds portrait crop
- **Brand mood:** Quiet luxury, composed
- **Negative prompt:** plastic skin, beauty filter, CGI look, different face, exaggerated makeup

### 2. Nila Full Body
- **Identity:** nila-master-primary.png + nila-full-body.png
- **Wardrobe:** Full [SAREE DESIGN] drape with blouse
- **Saree:** [SAREE COLOUR] [MATERIAL], [BORDER] border, [PALLU] pallu, [ZARI] zari
- **Pose:** Standing, natural stance, weight on one leg
- **Location:** [LOCATION]
- **Lighting:** Natural daylight, even exposure
- **Camera:** 50mm-equivalent, full-body framing
- **Composition:** Vertical, saree drape fully visible
- **Brand mood:** Editorial, confident
- **Negative prompt:** distorted drape, extra limbs, different body proportions, different face

### 3. Nila Wearing Saree
- **Identity:** nila-master-primary.png + nila-3q-left.png or nila-3q-right.png
- **Wardrobe:** [SAREE DESIGN]
- **Saree:** [SAREE COLOUR] [MATERIAL], [BORDER], [PALLU], [ZARI]
- **Pose:** Three-quarter angle, one hand adjusting pallu
- **Location:** [LOCATION]
- **Lighting:** Warm directional light
- **Camera:** Medium shot, waist-up or full-body per campaign need
- **Composition:** Product-forward — saree drape and border clearly visible
- **Brand mood:** Product-accurate, aspirational but honest
- **Negative prompt:** inaccurate weave pattern, wrong border colour, different face

### 4. Nila Editorial
- **Identity:** nila-master-primary.png + nila-neutral-expression.png
- **Wardrobe:** [SAREE DESIGN]
- **Saree:** [SAREE COLOUR] [MATERIAL]
- **Pose:** Candid, mid-movement or looking away from camera
- **Location:** [LOCATION]
- **Lighting:** Cinematic, directional
- **Camera:** 35–50mm-equivalent
- **Composition:** Asymmetric, editorial magazine framing
- **Brand mood:** Sophisticated, understated
- **Negative prompt:** posed/stiff, stock-photo smile, different face

### 5. Nila Textile Studio
- **Identity:** nila-master-primary.png + nila-front-portrait.png
- **Wardrobe:** [SAREE DESIGN] or contemporary studio attire
- **Saree:** [SAREE COLOUR] [MATERIAL] (if shown in saree)
- **Pose:** Engaged with a screen/canvas, hands visible
- **Location:** Digital design studio interior
- **Lighting:** Clean, even, modern interior light
- **Camera:** Medium shot
- **Composition:** Include design/technical elements in frame
- **Brand mood:** Technical precision meets craft
- **Negative prompt:** cluttered background, different face, exaggerated tech props

### 6. Nila Handloom Environment
- **Identity:** nila-master-primary.png + nila-3q-left.png
- **Wardrobe:** [SAREE DESIGN]
- **Saree:** [SAREE COLOUR] [MATERIAL]
- **Pose:** Near a loom, observing or engaging respectfully — not operating machinery she wouldn't realistically operate
- **Location:** Handloom/weaving environment
- **Lighting:** Natural workshop light
- **Camera:** Medium-wide
- **Composition:** Environment visible but Nila remains the subject
- **Brand mood:** Craft, authenticity — must not imply documentary reality (Rule 9)
- **Negative prompt:** implies real factory documentation, different face

### 7. Nila Product Campaign
- **Identity:** nila-master-primary.png + nila-full-body.png
- **Wardrobe:** [SAREE DESIGN]
- **Saree:** [SAREE COLOUR] [MATERIAL], [BORDER], [PALLU], [ZARI]
- **Pose:** Campaign hero pose, confident stance
- **Location:** [LOCATION]
- **Lighting:** Campaign-grade, polished but natural
- **Camera:** Full-body or three-quarter
- **Composition:** Negative space for campaign typography
- **Brand mood:** [CAMPAIGN TYPE]
- **Negative prompt:** generic stock pose, different face, inaccurate product

### 8. Nila Saree Lookbook
- **Identity:** nila-master-primary.png + nila-full-body.png + nila-natural-smile.png
- **Wardrobe:** [SAREE DESIGN]
- **Saree:** [SAREE COLOUR] [MATERIAL], [BORDER], [PALLU], [ZARI]
- **Pose:** Series-consistent pose across lookbook set
- **Location:** [LOCATION]
- **Lighting:** Consistent across the series
- **Camera:** Consistent focal length across the series
- **Composition:** Full saree visible, consistent crop across set
- **Brand mood:** Cohesive, catalogue-ready
- **Negative prompt:** inconsistent lighting/pose across set, different face

### 9. Nila International Campaign
- **Identity:** nila-master-primary.png + nila-front-portrait.png
- **Wardrobe:** [SAREE DESIGN]
- **Saree:** [SAREE COLOUR] [MATERIAL]
- **Pose:** Campaign pose appropriate to [LOCATION]
- **Location:** [LOCATION] (e.g. Paris, London, Dubai, Singapore, New York, Tokyo)
- **Lighting:** City/location-appropriate
- **Camera:** Full-body or three-quarter
- **Composition:** Location landmark/character visible but secondary to Nila
- **Brand mood:** International, confident, quiet luxury
- **Negative prompt:** touristic/cliché framing, different face

### 10. Nila Social Media
- **Identity:** nila-master-primary.png + nila-natural-smile.png
- **Wardrobe:** [SAREE DESIGN]
- **Saree:** [SAREE COLOUR] [MATERIAL]
- **Pose:** Relaxed, social-native framing
- **Location:** [LOCATION]
- **Lighting:** Natural, approachable
- **Camera:** Vertical/square crop for social formats
- **Composition:** Space for platform UI overlays
- **Brand mood:** Warm, approachable, on-brand
- **Negative prompt:** over-filtered, different face

### 11. Nila Website Hero
- **Identity:** nila-master-primary.png + nila-full-body.png
- **Wardrobe:** [SAREE DESIGN]
- **Saree:** [SAREE COLOUR] [MATERIAL], [BORDER], [PALLU], [ZARI]
- **Pose:** Hero-scale, confident, allows text overlay
- **Location:** [LOCATION]
- **Lighting:** Cinematic
- **Camera:** Wide, full-body
- **Composition:** Negative space left/right for headline text
- **Brand mood:** Aspirational, premium
- **Negative prompt:** cluttered frame, different face

### 12. Nila Saree Passport
- **Identity:** nila-master-primary.png + nila-neutral-expression.png
- **Wardrobe:** [SAREE DESIGN] matching the specific passport record
- **Saree:** [SAREE COLOUR] [MATERIAL], [BORDER], [PALLU], [ZARI] — must match the actual passport data being illustrated
- **Pose:** Composed, documentation-style
- **Location:** Neutral studio background
- **Lighting:** Even, clean
- **Camera:** Medium shot
- **Composition:** Clean, ID-adjacent but editorial
- **Brand mood:** Trustworthy, precise
- **Negative prompt:** mismatched saree vs. passport data, different face

### 13. Nila Material Lab
- **Identity:** nila-master-primary.png + nila-front-portrait.png
- **Wardrobe:** Contemporary studio attire or [SAREE DESIGN]
- **Saree:** [MATERIAL] swatch in hand or in frame
- **Pose:** Examining/holding fabric swatch
- **Location:** Material library / lab environment
- **Lighting:** Clean, technical
- **Camera:** Medium close-up, hands and material in focus
- **Composition:** Material texture clearly visible
- **Brand mood:** Technical, material-focused
- **Negative prompt:** inaccurate fabric texture, different face

### 14. Nila Close-up
- **Identity:** nila-master-primary.png + nila-front-portrait.png
- **Wardrobe:** [SAREE DESIGN] (jewellery/border detail focus)
- **Saree:** [BORDER] or [ZARI] detail near frame
- **Pose:** Close, still
- **Location:** N/A — tight crop
- **Lighting:** Soft, directional
- **Camera:** Macro-adjacent close-up
- **Composition:** Face and one product detail (earring, border) in frame
- **Brand mood:** Intimate, refined
- **Negative prompt:** different face, distorted features

### 15. Nila Walking
- **Identity:** nila-master-primary.png + nila-full-body.png
- **Wardrobe:** [SAREE DESIGN]
- **Saree:** [SAREE COLOUR] [MATERIAL], drape in motion
- **Pose:** Mid-stride, natural gait
- **Location:** [LOCATION]
- **Lighting:** Natural, motion-appropriate
- **Camera:** Full-body, slight motion blur acceptable in pallu/fabric only
- **Composition:** Dynamic, forward motion
- **Brand mood:** Confident, alive
- **Negative prompt:** unnatural gait, distorted limbs, different face

### 16. Nila Sitting
- **Identity:** nila-master-primary.png + nila-master-primary.png (seated pose closest to reference framing)
- **Wardrobe:** [SAREE DESIGN]
- **Saree:** [SAREE COLOUR] [MATERIAL], drape arranged for seated pose
- **Pose:** Seated, relaxed, similar register to nila-master-primary.png
- **Location:** [LOCATION]
- **Lighting:** Warm, natural
- **Camera:** Medium shot
- **Composition:** Consistent with master reference framing
- **Brand mood:** Composed, at ease
- **Negative prompt:** awkward seated anatomy, different face

### 17. Nila Holding Saree
- **Identity:** nila-master-primary.png + nila-front-portrait.png
- **Wardrobe:** Holding folded/draped [SAREE DESIGN], not necessarily wearing it
- **Saree:** [SAREE COLOUR] [MATERIAL] held/presented to camera
- **Pose:** Presenting the saree with both hands
- **Location:** [LOCATION]
- **Lighting:** Product-clear, even
- **Camera:** Medium shot, product and face both legible
- **Composition:** Saree texture/border clearly visible
- **Brand mood:** Presentational, warm
- **Negative prompt:** obscured product detail, different face

### 18. Nila Showing Pallu
- **Identity:** nila-master-primary.png + nila-3q-left.png
- **Wardrobe:** [SAREE DESIGN]
- **Saree:** [PALLU] detail fully visible
- **Pose:** Turned to reveal pallu over shoulder
- **Location:** [LOCATION]
- **Lighting:** Directional, highlighting pallu detail
- **Camera:** Medium-wide
- **Composition:** Pallu is the focal point
- **Brand mood:** Product-accurate, elegant
- **Negative prompt:** pallu obscured, wrong motif, different face

### 19. Nila Showing Border
- **Identity:** nila-master-primary.png + nila-full-body.png
- **Wardrobe:** [SAREE DESIGN]
- **Saree:** [BORDER] fully visible along hemline
- **Pose:** Seated or standing pose that exposes the border clearly
- **Location:** [LOCATION]
- **Lighting:** Even, product-clear
- **Camera:** Lower-body or full-body framing
- **Composition:** Border is the focal point
- **Brand mood:** Technical, product-accurate
- **Negative prompt:** border obscured or inaccurate, different face

### 20. Nila Packaging Campaign
- **Identity:** nila-master-primary.png + nila-natural-smile.png
- **Wardrobe:** [SAREE DESIGN]
- **Saree:** [SAREE COLOUR] [MATERIAL]
- **Pose:** Holding or standing near VELVOREA packaging
- **Location:** [LOCATION] or neutral studio
- **Lighting:** Clean, product-photography style
- **Camera:** Medium shot, packaging and Nila both in focus
- **Composition:** Packaging legible, Nila as brand context
- **Brand mood:** Premium, gift-worthy
- **Negative prompt:** packaging illegible/distorted, different face
