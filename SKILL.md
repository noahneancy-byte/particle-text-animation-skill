---
name: particle-text-animation
description: Add or adapt interactive particle-formed text in React interfaces with Canvas, including scatter-to-glyph assembly, pointer repulsion, glow, and responsive text sampling. Use when the user asks for particle text, text made from dots, or the React Bits-style Particle Text effect; do not use for ordinary text transitions or unrelated particle backgrounds.
---

# Particle Text Animation

Build a production-ready particle-text treatment that fits the host interface instead of dropping in an isolated demo.

## Workflow

1. Inspect the existing React stack, component conventions, styling system, target container, and typography before editing.
2. Reuse the starter in `assets/react/ParticleText.tsx` and `assets/react/ParticleText.css` when it matches the project. Copy it into the project's component area and adapt imports or typing to local conventions. Do not add a canvas or animation dependency for this effect alone.
3. Give the component a parent with an explicit responsive height. Set the visible phrase through `text`; keep the same phrase available to assistive technology.
4. Tune density and motion for the actual typeface, viewport, and performance budget. Read `references/tuning.md` when matching a reference, supporting mobile, or adapting the algorithm to a non-React canvas.
5. Preserve the surrounding layout and visual system. Change page-level colors, fonts, or spacing only when the user asks for a broader redesign.

## Implementation invariants

- Sample the loaded font into an offscreen canvas; do not approximate letters with manually placed particles.
- Size the visible canvas in CSS pixels and scale its backing store by device pixel ratio so dots stay crisp.
- Re-sample after the wrapper changes size and after inherited fonts finish loading.
- Keep pointer coordinates in the same CSS-pixel coordinate system as particle targets.
- Keep readable fallback text in the accessibility tree while hiding the canvas from assistive technology.
- Respect `prefers-reduced-motion`: render the completed word without looping scatter, drift, or pointer motion.
- Cancel animation frames, observers, media listeners, and font callbacks during cleanup.

## Validation

Verify the initial assembly, pointer interaction, replay trigger, resize behavior, loaded production font, high-DPI rendering, and reduced-motion mode. Check a narrow mobile viewport as well as the intended desktop composition. Reduce particle count before weakening layout or accessibility behavior when performance is poor.

When handing off, state which files changed and list any deliberate departures from the requested reference.
