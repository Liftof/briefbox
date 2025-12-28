# Brand Color Extraction Fix - 2025-12-27

## Status
- [x] Code changes applied
- [ ] Migration run (`drizzle/0005_add_visual_style.sql`)
- [ ] Committed to git
- [ ] Pushed to remote

## Problem
Brand generation was producing images with wrong colors (e.g., `#0000FF` pure blue instead of actual brand blues like `#5B8DEF`). Investigation on Ordalie (ordalie.com) revealed:

1. **Screenshot was captured but never used** - Firecrawl took a screenshot, but the code discarded it before sending to the LLM
2. **SVG logos skipped** - Color extraction returned empty for SVG logos
3. **No screenshot color extraction** - Only logo colors were extracted, but logos are often black/white
4. **Generic AI guesses** - Without visual input, AI guessed generic colors like `#0000FF`
5. **Tinted backgrounds filtered out** - Beige/cream backgrounds like `#F8F6F3` were incorrectly filtered as "white"

## Files Modified

### 1. `lib/gemini.ts`
**Changes:** Added multimodal (vision) support for Gemini and Claude fallback

**Key additions:**
- `MultimodalContent` type exports
- `imageUrlToBase64()` function
- `buildGeminiParts()` function
- `buildClaudeContent()` function
- Updated `callGemini()` and `callGeminiWithFallback()` signatures to accept `string | MultimodalContent[]`

**To revert:** Replace entire file with git checkout or restore from backup.

### 2. `db/schema.ts`
**Changes:** Added `visualStyle` column to brands table

```typescript
// NEW COLUMN
visualStyle: jsonb('visual_style').$type<{
  designSystem?: string,
  backgroundStyle?: string,
  heroElement?: string,
  whitespace?: string,
  corners?: string,
  shadows?: string,
  gradients?: string
}>(),
```

**Migration:** `drizzle/0005_add_visual_style.sql`
```sql
ALTER TABLE "brands" ADD COLUMN "visual_style" jsonb;
```

### 3. `app/api/brand/save/route.ts`
**Changes:** Added `visualStyle` to saved brand data

```typescript
// ADDED
visualStyle: brand.visualStyle || null
```

### 4. `app/api/brand/analyze/route.ts`
**Changes:** Multiple fixes for color extraction and style analysis

#### Change A: Import MultimodalContent type (line ~10)
```typescript
// BEFORE
import { callGeminiWithFallback, USE_GEMINI_FOR_BRAND_ANALYSIS } from '@/lib/gemini';

// AFTER
import { callGeminiWithFallback, USE_GEMINI_FOR_BRAND_ANALYSIS, type MultimodalContent } from '@/lib/gemini';
```

#### Change B: Pass screenshot to LLM (lines ~1669-1694)
```typescript
// BEFORE - Screenshot was discarded!
const userPromptText = typeof userMessageContent === 'string'
  ? userMessageContent
  : userMessageContent[0]?.text || '';
brandData = await callGeminiWithFallback(systemPrompt, userPromptText, {...});

// AFTER - Full multimodal content passed
const multimodalContent: MultimodalContent[] = userMessageContent as MultimodalContent[];
brandData = await callGeminiWithFallback(systemPrompt, multimodalContent, {...});
```

#### Change C: New `mergeAllColorSources()` function (lines ~1032-1144)
Added new function that:
- Prioritizes: screenshot colors > logo colors > AI colors
- Filters generic AI guesses (`#0000FF`, `#FF0000`, etc.)
- Keeps tinted backgrounds (beige, cream)

#### Change D: Screenshot color extraction (lines ~1743-1755)
```typescript
// NEW - Extract colors from screenshot in parallel
if (screenshotUrl && screenshotUrl.startsWith('http')) {
  parallelTasks.push(extractColorsFromImage(screenshotUrl).catch(...));
}
```

#### Change E: Fixed `isInterestingColor()` to keep beige/cream (lines ~1052-1084)
```typescript
// BEFORE - Filtered all light colors
if (r > 240 && g > 240 && b > 240) return false;

// AFTER - Only filters pure white, keeps tinted backgrounds
if (r > 240 && g > 240 && b > 240) {
  if (channelSpread < 5) return false; // Only pure white
  // Keep beige (#F8F6F3), cream, warm whites
}
```

#### Change F: New `visualStyle` field in LLM prompt (lines ~1605-1613)
Added new schema field for detailed visual style extraction:
```json
"visualStyle": {
  "designSystem": "Apple-like minimalism",
  "backgroundStyle": "Warm off-white/cream",
  "heroElement": "3D abstract brain shape",
  "whitespace": "Generous/airy",
  "corners": "Rounded/soft",
  "shadows": "Soft drop shadows",
  "gradients": "Blue gradient on 3D shapes"
}
```

#### Change G: Enhanced color instruction in prompt (line ~1578)
Added explicit warning against generic hex values like `#0000FF`.

### 3. `app/api/creative-director/route.ts`
**Changes:** Added visual style to image generation prompts (lines ~533-549)

```typescript
// NEW - Use visualStyle in prompts
if (brand.visualStyle) {
  const vs = brand.visualStyle;
  const styleDetails = [];
  if (vs.designSystem) styleDetails.push(`Design: ${vs.designSystem}`);
  if (vs.backgroundStyle) styleDetails.push(`Background: ${vs.backgroundStyle}`);
  // ... etc
  brandKnowledge.push(`VISUAL STYLE (from website): ${styleDetails.join('. ')}`);
}
```

## How to Revert

### Option 1: Git revert (if committed)
```bash
git revert <commit-hash>
```

### Option 2: Restore specific files
```bash
git checkout HEAD~1 -- lib/gemini.ts
git checkout HEAD~1 -- app/api/brand/analyze/route.ts
git checkout HEAD~1 -- app/api/creative-director/route.ts
```

### Option 3: Manual revert of key changes

**To disable screenshot vision (quick fix):**
In `app/api/brand/analyze/route.ts`, change line ~1692:
```typescript
// Change this:
multimodalContent,

// Back to this:
multimodalContent[0]?.text || '',
```

**To disable screenshot color extraction:**
In `app/api/brand/analyze/route.ts`, comment out lines ~1743-1755 and change line ~1774:
```typescript
// Change:
const [logoColorsResult, screenshotColorsResult, industrySearchResult] = await Promise.all(parallelTasks);

// To:
const [logoColorsResult, industrySearchResult] = await Promise.all(parallelTasks);
const screenshotColorsResult = [];
```

## Testing

To verify the fix works, re-analyze a brand like ordalie.com and check:
1. Console logs show "📸 Vision mode: Screenshot will be analyzed"
2. Console logs show "📸 Screenshot colors extracted: [...]"
3. Final colors are realistic (not `#0000FF`)
4. `visualStyle` field is populated in response

## Expected Results

| Element | Before | After |
|---------|--------|-------|
| Blue accent | `#0000FF` | `#5B8DEF`, `#7B9FE8` |
| Background | `#FFFFFF` | `#F8F6F3` (warm cream) |
| Visual style | Not captured | Full design system info |
