# Blog Generation Fix Plan

## Issues Identified
1. ✅ **FAQ parsing fixed** - Added `parseFAQContent` method to LLM service
2. 🔄 **Rate limiting** - Google AI hitting limits during blog generation
3. 🔄 **Blog structure** - Need to match reference website format

## Reference Blog Structure Analysis

Based on https://clovedental.in/blog/filling-root-canal/can-root-canal-treatment-painless

### Layout & Design Requirements:
- **Two-column layout** (64% content, 35% sticky sidebar)
- **Hero image** with rounded corners
- **Author metadata** with avatar, date, read-time
- **Table of contents** with anchor links
- **Structured content** with proper headings and spacing
- **Sticky sidebar** with appointment form and CTAs

### Content Structure:
1. **Introduction paragraph** - Context setting
2. **Main sections with H2 headings**
3. **Numbered/bulleted lists** within sections
4. **Internal anchor navigation**
5. **Related blog suggestions**

### Visual Elements:
- **Color scheme**: #f58420 orange accent, cream backgrounds
- **Typography**: Figtree headers, Open Sans body
- **Interactive elements**: Rounded buttons and forms
- **Responsive design**: Mobile-friendly adaptation

## Implementation Strategy

### Phase 1: Fix Rate Limiting (Immediate)
1. Increase delays between blog generation calls
2. Better error handling for rate limits
3. Fallback strategies when rate limited

### Phase 2: Blog Format Implementation
1. Create blog template matching reference design
2. Implement proper content structure
3. Add metadata and navigation elements
4. Style matching reference website

### Phase 3: Optimization
1. Reduce redundant API calls
2. Implement content caching
3. Better batch processing

## Next Steps
1. Test current parseFAQContent fix
2. Implement rate limiting improvements
3. Create blog template structure
4. Test end-to-end blog generation