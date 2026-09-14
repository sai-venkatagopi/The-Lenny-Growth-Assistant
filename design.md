# Design Document: Lenny Growth Assistant

## Product Vision
Lenny Growth Assistant is a grounded AI workspace for product and growth teams. The product blends research, strategy, and execution into a single workflow: ask questions, inspect evidence, generate artifacts, and move from insight to action without leaving the interface.

The visual system should feel premium, calm, and credible — similar to a modern research studio rather than a generic chatbot. Trust and clarity are more important than flashy UI. Every interaction should help the user understand where the answer came from, what is happening now, and what they can do next.

---

## UI / UX Principles

### 1. Evidence-first interaction
The core experience is grounded in transcript evidence. Answers should feel trustworthy and explainable.

- Source-backed answers are prioritized over quick but vague responses
- Relevant transcript snippets are visible next to answer content
- When evidence is weak, the system should say so explicitly instead of guessing

### 2. Clear hierarchy
The interface should guide attention in a predictable order:

1. Conversation / question entry
2. Answer content
3. Supporting sources
4. Actionable artifacts

This reduces cognitive load and avoids cluttering the user with too many competing surfaces.

### 3. Calm, premium visual language
The design uses a soft neutral palette with deep contrast accents to create a serious and confident product feel.

- Base surfaces: warm white / soft cream
- Primary accent: deep teal / emerald
- High-contrast text for readability
- Shadows and subtle gradients to create depth without noise
- Rounded cards and panels for a friendly workspace feel

### 4. Purposeful motion
Motion should reinforce status and focus, not distract.

- Subtle fade-in for content panels
- Gentle pulsing on loading states
- Smooth transitions for panel open/close and tab changes
- Hover states on interactive controls to communicate affordance

### 5. Confidence and control
Users should always know what model is active, what state the system is in, and how to recover from errors.

- Provider label remains visible
- Loading states communicate grounding activity
- Error states propose recovery instead of silently failing
- Persistent controls support session switching and navigation

---

## Information Architecture

### Top-level structure
The product is structured around two key experiences:

1. Landing / introduction screen
2. Growth Studio workspace

#### Landing screen
The landing experience sets the brand position and narrative. It presents:

- Product name and positioning
- High-impact hero message
- Strong CTA: Start now
- 3D or motion-driven visual background
- Minimal navigation and no clutter

This gives the app a polished “welcome” experience before the user enters the actual workspace.

#### Growth Studio workspace
The workspace is organized as a multi-panel research and synthesis environment.

- Left sidebar: sessions and conversation history
- Center: active chat conversation
- Right-middle: artifact generation / output
- Far-right or lower panel: source references and transcript evidence

This layout supports fast switching between exploration, writing, and evidence review.

### Content model
The workspace centers on four data types:

- Session: a chat thread with conversation history
- Message: user or assistant content
- Artifact: generated strategy/essay/markdown/html output
- Source: retrieved transcript evidence with metadata and excerpts

### User tasks
Priority tasks mapped to screen hierarchy:

- Ask a question → Chat panel
- Review evidence → Source panel
- Generate artifact → Artifact panel
- Manage sessions → Sidebar
- Switch model/provider → header controls or selector

---

## Core Screens and Interaction Patterns

### Landing page
Purpose: establish trust and momentum.

Key elements:
- Brand lockup and robot logo
- Short product description
- Primary CTA to enter workspace
- Rich visual background with animated or 3D hero treatment

Interaction behavior:
- CTA should feel immediate and frictionless
- No unnecessary menu or sidebar clutter
- Strong contrast ensures readability against the hero background

### Session sidebar
Purpose: manage context and conversation continuity.

Key elements:
- New conversation button
- List of recent sessions
- Active session highlight
- Delete or archive affordances

Interaction behavior:
- Active session is clearly emphasized
- Sidebar collapses or overlays on smaller screens
- Selection should feel instant and stable

### Chat interface
Purpose: ask questions and receive answers in context.

Key elements:
- Message list with user and assistant bubbles
- Input composer at the bottom
- Quick actions such as Ship 30 or strategy prompts
- Model indicator/status

Interaction behavior:
- Enter submits message
- Keyboard-friendly interaction is required
- Loading states appear while grounding and generation happen
- Long answer content should remain readable with comfortable spacing

### Artifact panel
Purpose: present generated outputs and strategic work.

Key elements:
- Rendered markdown or HTML view
- Tabs or switchers for different output formats
- Clear callouts for generated result states

Interaction behavior:
- Output updates without disrupting the chat flow
- User should be able to compare artifact output and source evidence easily

### Source panel
Purpose: increase confidence and explainability.

Key elements:
- Relevance signals
- Source title and metadata
- Transcript excerpt snippets
- Optional external links or document references

Interaction behavior:
- Sources should remain visible and easy to scan
- The most relevant evidence should appear first
- Source list should not dominate the primary conversation flow on small screens

---

## Key Interaction States

### Empty state
For a new session or no content yet:

- Show a short onboarding message or suggested prompts
- Encourage exploration with simple actions
- Keep UI minimal and not overwhelm with options

Suggested examples:
- “What drove activation?”
- “Summarize retention loops”
- “Generate a Ship 30 essay”

### Loading state
During retrieval and generation:

- Show a subtle status indicator or pulsing animation
- Use clear copy such as: “Grounding answer in transcripts…”
- Keep the user informed without leaving the chat composition area

### Success state
When an answer is returned:

- Answer content appears immediately in the chat stream
- Relevant sources are surfaced in context
- The artifact panel may update or remain available if generation was triggered

### Error state
When provider or backend calls fail:

- Display a clear, non-technical message
- Suggest a recovery action such as retry or switch model
- Avoid fake demo or seeded fallback messaging when the system is actually failing

### Insufficient evidence state
When the system cannot answer confidently:

- Explicitly communicate uncertainty
- State what information is missing
- Avoid fabricating citations or confident claims

### Session transitions
When switching sessions or creating a new one:

- The active state should update immediately
- Chat content and artifact content should clear or reload predictably
- The user should never lose context unexpectedly

---

## Responsive Behavior

### Desktop
The default layout should use the full studio arrangement:

- Sidebar fixed-width on the left
- Main conversation center column
- Artifact output in a right-side panel
- Source evidence as an additional right panel or dedicated section when space allows

This layout supports deep work and side-by-side comparison.

### Tablet
The panels should compress gracefully:

- Reduce panel widths
- Keep primary interaction in the chat area
- Allow artifact and source views to stack or alternate using tabbed navigation

### Mobile
On smaller screens, the layout should prioritize conversation flow:

- Sidebar becomes an overlay or slide-in menu
- Chat remains the dominant panel
- Artifact and sources become tabbed or collapsible sections
- Controls remain thumb-friendly and do not crowd the screen

### Panel behavior
Panels should be:
- resizable on desktop
- collapsible on smaller breakpoints
- persistent between sessions when relevant

---

## Accessibility Considerations

### Color and contrast
- Maintain sufficient contrast between text and background
- Do not rely on color alone to convey states or errors
- Use icons, text, and outline changes to reinforce meaning

### Keyboard support
- Enter to submit messages
- Tab order should be predictable across controls
- Focus rings should be visible on buttons, inputs, and session items
- Modal/overlay navigation should trap focus appropriately when needed

### Screen reader support
- Form fields and buttons should have accessible labels
- Status updates like loading, success, and errors should be announced in a meaningful way
- Decorative visuals should not distract from content

### Touch and readability
- Tap targets should be large enough for mobile interaction
- Text and panels should maintain readable line length and spacing
- Content density should remain comfortable even in dense research workflows

---

## Visual Style and Design Tokens

### Typography
- Clear sans-serif fonts for readability and modern product feel
- Strong headings with a premium editorial tone
- Body text sized for comfortable reading at desktop and mobile scales

### Color palette
- Background: warm white / cream tones
- Primary accent: teal / emerald
- Dark surfaces: deep slate / charcoal
- Support accents: subtle blue, neutral grays, warm highlights

### Surfaces and depth
- Soft borders and clean panels
- Gentle shadows to indicate layering
- Rounded corners for a softer enterprise feel
- Minimal noise to keep interface focused on content

---

## Design Decisions and Rationale

| Decision | Rationale |
|----------|-----------|
| Dedicated landing page before studio access | Creates a stronger brand introduction and cleaner onboarding flow |
| Left sidebar for sessions | Gives persistent context and easy switching between conversations |
| Centered chat as primary workspace | Keeps the user’s main task visible and central |
| Artifact and source panels as secondary surfaces | Encourages evidence-based decision making without cluttering the chat view |
| Keep model/provider visible | Builds trust and makes tool behavior understandable |
| Explicit “insufficient evidence” states | Prevents hallucination and supports credibility |
| Mobile tab-based fallback | Preserves usability without sacrificing the desktop power layout |
| Rich 3D or motion hero on landing page | Differentiates the product and creates a premium first impression |
| Safe rendering for HTML artifacts | Reduces risk from untrusted generated content |

---

## Summary
The Lenny Growth Assistant experience should feel like a strategic research studio: grounded, premium, calm, and highly useful. The product must prioritize trust and transparency, especially in a domain where fabricated claims are costly. The combination of a polished landing experience, a structured workspace, clear evidence surfaces, and responsive behavior creates a UI that supports both exploration and action without overwhelming the user.
