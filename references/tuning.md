# Particle Text tuning and adaptation

## Parameter guide

| Prop | Visual effect | Practical range |
| --- | --- | --- |
| `particleSize` | Diameter of each dot | `1.4–3` CSS px |
| `density` | Sampling step; lower values create more particles | `3–7` |
| `scatter` | Maximum initial displacement from the glyph | `100–260` CSS px |
| `gatherDuration` | Time for each particle to reach its target | `900–2200` ms |
| `stagger` | Random delay before individual particles begin | `150–700` ms |
| `pointerRepel` | Cursor displacement strength | `20–70` |
| `repelRadius` | Cursor influence radius | `70–180` CSS px |
| `idleDrift` | Subtle movement after assembly | `0–1.5` CSS px |

Start with the asset defaults for a dark hero treatment. Increase `density` first when reducing CPU/GPU load. A value of `5` samples roughly 36% fewer positions than `4`; `6` samples roughly 56% fewer.

## Matching a reference

Match in this order:

1. Typeface, weight, line width, and container geometry.
2. Particle count and size.
3. Scatter distance, assembly duration, and stagger.
4. Base/highlight color balance and glow.
5. Pointer radius and strength.

Typography and container geometry determine the sampled target field, so motion tuning before those are stable usually creates rework.

## Layout

The component fills its parent. Give that parent a real height, for example:

```tsx
<section className="particle-hero">
  <ParticleText text="Future Interfaces" />
</section>
```

```css
.particle-hero {
  width: 100%;
  height: clamp(18rem, 45vw, 30rem);
  background: #09090f;
}
```

The default `fontSize="clamp(3rem, 12vw, 8rem)"` is resolved through a temporary DOM measurement element before Canvas sampling, so inherited and responsive typography remain accurate.

## Performance

- Prefer a higher `density` over shrinking `particleSize` when there are too many particles.
- Keep glow modest; shadow blur across thousands of circles is expensive.
- Avoid multiple full-viewport particle-text canvases animating at once.
- For very long text, split the message into intentional lines or reserve particle text for one short phrase.

## Adapting outside React

Retain the same four stages:

1. Measure the rendered font and draw text into an offscreen canvas.
2. Sample non-transparent pixels into target coordinates.
3. Assign each target a scattered start point and stagger delay.
4. Animate toward targets, then add bounded idle drift and pointer repulsion.

Recreate lifecycle handling with the host framework's mount, resize, and cleanup primitives. Do not copy React hooks mechanically into another runtime.
