# Particle Text Animation Skill

A reusable Codex Skill for adding interactive, canvas-rendered particle text to React interfaces. It includes an original dependency-free React component with scatter-to-text assembly, cursor repulsion, responsive font sampling, glow, and reduced-motion support.

## Install

Copy the `particle-text-animation` folder into your Codex skills directory:

```text
~/.codex/skills/particle-text-animation
```

Restart or reload Codex, then invoke it with:

```text
$particle-text-animation Add a particle-formed headline to this React hero.
```

The reusable component lives in `assets/react/`. The Skill instructs Codex to adapt it to the target project's structure and visual language rather than treating it as a fixed demo.

## Contents

- `SKILL.md` — activation rules and implementation workflow
- `agents/openai.yaml` — Codex UI metadata
- `assets/react/` — reusable React and CSS source
- `references/tuning.md` — tuning, performance, and adaptation guidance

## Attribution

The interaction was visually studied from the Particle Text example on [React Bits](https://reactbits.dev/text-animations/particle-text). The component included here is an independent implementation created for this Skill.
