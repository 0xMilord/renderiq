# Renderiq Trade Show Demo Script
## 4-Day AEC Industry Exhibition - Full Screen Demo

**Duration:** 60 seconds (looping)
**Format:** Full-screen interactive presentation
**Goal:** Conversion-optimized showcase of Renderiq's core features

---

## Demo Flow Overview

### **Slide 1: Hero Introduction (0-5 seconds)**
**Visual:**
- Renderiq logo animates in (fade + scale)
- Tagline: "Transform Sketches into Photorealistic Renders"
- Subtitle: "Powered by Multiple State-of-the-Art AI Models"

**Animation:**
- Logo: Fade in + scale (0.8 → 1.0) with bounce
- Text: Typewriter effect for tagline
- Background: Subtle gradient animation

**CTA:** None (attention grabber)

---

### **Slide 2: The Problem (5-10 seconds)**
**Visual:**
- Split screen showing:
  - Left: Hand-drawn sketch / basic 3D model
  - Right: Photorealistic render
- Text overlay: "From Sketch to Reality in Minutes"

**Animation:**
- Left image: Fade in
- Right image: Slide in from right with reveal effect
- Text: Fade in after images

**CTA:** None (problem statement)

---

### **Slide 3: Unified Chat Interface Demo (10-20 seconds)**
**Visual:**
- Live demo of unified chat interface (mockup)
- Shows:
  - User typing: "Create a modern office building with glass facade"
  - AI processing indicator
  - Render appearing in chat
  - Real-time progress bar

**Animation:**
- Chat messages appear sequentially
- Typing indicator animation
- Progress bar fills smoothly
- Render fades in with scale effect

**Key Features Highlighted:**
- Natural language input
- Real-time progress
- Context-aware AI

**CTA:** "Try Free Today" button (subtle, bottom right)

---

### **Slide 4: Render Chains & Version Control (20-10 seconds)**
**Visual:**
- Timeline view showing render chain:
  - v1: Initial render
  - v2: Refined render
  - v3: Final render
- Shows version references (@v1, @v2, @latest)
- Text: "Iterate with Context - Reference Any Version"

**Animation:**
- Timeline animates from left to right
- Each version card slides in sequentially
- Version references highlight when mentioned
- Connection lines animate between versions

**Key Features Highlighted:**
- Version control
- Iterative refinement
- Context preservation

**CTA:** "See How It Works" button

---

### **Slide 5: Canvas Editor Showcase (30-40 seconds)**
**Visual:**
- Node-based canvas editor (Blender-style)
- Shows workflow:
  - Text Node → Image Node → Variants Node
- Nodes connecting and executing
- Text: "Build Complex Workflows Visually"

**Animation:**
- Canvas zooms in
- Nodes appear one by one
- Connections animate between nodes
- Execution flow highlights (pulse effect)
- Variants generate with particle effect

**Key Features Highlighted:**
- Visual workflow builder
- Node-based system
- Reusable workflows

**CTA:** "Explore Canvas" button

---

### **Slide 6: AEC Finetunes & Technical Accuracy (40-50 seconds)**
**Visual:**
- Side-by-side comparison:
  - Left: Generic AI render (inaccurate proportions)
  - Right: Renderiq render (technically correct)
- Highlighting architectural elements:
  - Proper scale
  - Material accuracy
  - Structural integrity
- Text: "Technically Correct Renders for AEC Professionals"

**Animation:**
- Comparison slides in
- Red X marks on left (wrong elements)
- Green checkmarks on right (correct elements)
- Highlight boxes animate around key features

**Key Features Highlighted:**
- AEC finetunes
- Technical accuracy
- Professional-grade output

**CTA:** "Learn More" button

---

### **Slide 7: Pricing & CTA (50-60 seconds)**
**Visual:**
- Pricing card showing:
  - "Try Renderiq for as low as ₹500"
  - Credit-based system
  - Free tier: 5 renders/month
- Large CTA button: "Start Free Trial"
- QR code for quick signup

**Animation:**
- Pricing card slides up from bottom
- Numbers count up animation
- QR code fades in
- CTA button pulses gently

**Key Features Highlighted:**
- Affordable pricing
- Credit-based system
- Free tier available

**CTA:** "Start Free Trial" (primary) + QR code

---

## Technical Implementation

### **Libraries Used:**
1. **Framer Motion** (already installed) - Main animation library
2. **GSAP** (already installed) - Advanced timeline animations
3. **React Spring** (optional) - Physics-based animations
4. **Embla Carousel** (already installed) - Slideshow functionality

### **Animation Principles:**
- **Easing:** Ease-in-out for smooth transitions
- **Duration:** 0.3-0.5s for micro-interactions, 1-2s for slide transitions
- **Stagger:** Sequential animations for lists (0.1s delay)
- **Performance:** Use `will-change` CSS property, GPU acceleration

### **Full-Screen Mode:**
- Use `document.documentElement.requestFullscreen()` on load
- Exit fullscreen on ESC key (optional)
- Responsive design: Scales to any screen size
- Auto-play: Starts automatically, loops seamlessly

### **Conversion Optimization:**
- **Clear CTAs:** Prominent buttons at key moments
- **Social Proof:** Show render count, user testimonials (subtle)
- **Urgency:** "Limited Time" badge (optional)
- **Trust Signals:** "Used by 1000+ AEC Professionals"
- **QR Code:** Quick mobile signup
- **Value Proposition:** Clear benefits at each slide

---

## Slide Transitions

### **Transition Types:**
1. **Fade:** Smooth opacity transition (0.3s)
2. **Slide:** Horizontal slide (0.5s)
3. **Zoom:** Scale + fade (0.4s)
4. **Reveal:** Mask animation (0.6s)

### **Timing:**
- Each slide: 10 seconds
- Transition: 0.5 seconds
- Total loop: 60 seconds

---

## Interactive Elements

### **Keyboard Controls:**
- **Space/Arrow Right:** Next slide
- **Arrow Left:** Previous slide
- **ESC:** Exit fullscreen
- **R:** Restart demo

### **Touch Controls:**
- **Swipe Left:** Next slide
- **Swipe Right:** Previous slide
- **Tap:** Pause/Resume

### **Auto-Advance:**
- Automatically advances every 10 seconds
- Pauses on hover/touch
- Loops infinitely

---

## Content Assets Needed

### **Images:**
1. Renderiq logo (SVG)
2. Before/After comparison images (3-4 sets)
3. Screenshot of unified chat interface
4. Canvas editor screenshot
5. Version control timeline visualization
6. AEC comparison renders

### **Videos:**
1. 1-minute looping background video (optional)
2. Screen recording of chat interface in action
3. Canvas editor workflow animation

### **Text:**
- All slide text content (provided above)
- CTA button text
- Trust signals and social proof

---

## Performance Considerations

### **Optimization:**
- Lazy load images
- Use WebP format for images
- Compress videos (H.264, max 5MB)
- Minimize JavaScript bundle
- Use CSS transforms for animations (GPU accelerated)

### **Loading:**
- Preload first 3 slides
- Lazy load remaining slides
- Show loading spinner on initial load
- Progressive enhancement

---

## Conversion Tracking

### **Metrics to Track:**
- Slide views (which slides get most attention)
- CTA clicks
- QR code scans
- Time spent on each slide
- Full loop completions

### **Analytics:**
- Google Analytics events
- Custom event tracking
- Heatmap (optional)

---

## Accessibility

### **Features:**
- Keyboard navigation
- Screen reader support
- High contrast mode
- Reduced motion option
- Pause/Resume controls

---

## Deployment Checklist

- [ ] All images optimized and loaded
- [ ] Videos compressed and hosted
- [ ] Animations tested on various devices
- [ ] Full-screen mode tested
- [ ] Auto-loop working correctly
- [ ] CTAs linked properly
- [ ] QR code generated and tested
- [ ] Analytics tracking implemented
- [ ] Performance optimized
- [ ] Mobile responsive
- [ ] Accessibility tested

---

## Post-Demo Follow-Up

### **Lead Capture:**
- QR code → Signup page
- Email capture form
- Business card collection
- Follow-up email sequence

### **Content:**
- Demo video recording
- Case studies
- Feature sheets
- Pricing information

---

**Last Updated:** [Date]
**Version:** 1.0
**Status:** Ready for Implementation



