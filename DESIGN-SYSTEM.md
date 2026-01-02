# Design System Documentation

## Overview
This document outlines the design system for the ATC Timetable Management System (TMS), including design tokens, utility classes, and component patterns.

## Table of Contents
1. [Design Tokens (CSS Variables)](#design-tokens)
2. [Utility Classes](#utility-classes)
3. [Component Patterns](#component-patterns)
4. [Usage Guidelines](#usage-guidelines)
5. [Migration Guide](#migration-guide)

---

## Design Tokens

Design tokens are stored as CSS custom properties (variables) in `css/design-tokens.css`. They provide a single source of truth for design decisions.

### Color Palette

#### Primary Colors
```css
--color-primary: #2575fc          /* Main brand color */
--color-primary-light: #4a90fc    /* Lighter variant */
--color-primary-dark: #1a5dd9     /* Darker variant */
--color-primary-gradient: linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)
```

**Usage:**
```css
.my-element {
  background-color: var(--color-primary);
  border: 2px solid var(--color-primary-dark);
}
```

#### Secondary Colors
```css
--color-secondary: #6a11cb
--color-secondary-light: #8b3de0
--color-secondary-dark: #5209a8
```

#### Semantic Colors
```css
--color-success: #28a745          /* Green for success states */
--color-warning: #ffc107          /* Yellow for warnings */
--color-danger: #dc3545           /* Red for errors/delete */
--color-info: #0dcaf0             /* Cyan for informational */
```

#### Neutral Colors (Grays)
```css
--color-gray-100: #f8f9fa         /* Lightest */
--color-gray-200: #e9ecef
--color-gray-300: #dee2e6
--color-gray-400: #ced4da
--color-gray-500: #adb5bd
--color-gray-600: #6c757d
--color-gray-700: #495057
--color-gray-800: #343a40
--color-gray-900: #212529         /* Darkest */
```

#### Text Colors
```css
--color-text-primary: #333333     /* Main body text */
--color-text-secondary: #6c757d   /* Secondary text */
--color-text-muted: #868e96       /* Muted/disabled text */
--color-text-light: #ffffff       /* Light text on dark bg */
```

### Spacing Scale

Based on 4px increments (0.25rem):

```css
--spacing-0: 0              /* 0px */
--spacing-1: 0.25rem        /* 4px */
--spacing-2: 0.5rem         /* 8px */
--spacing-3: 0.75rem        /* 12px */
--spacing-4: 1rem           /* 16px */
--spacing-5: 1.25rem        /* 20px */
--spacing-6: 1.5rem         /* 24px */
--spacing-8: 2rem           /* 32px */
--spacing-10: 2.5rem        /* 40px */
--spacing-12: 3rem          /* 48px */
--spacing-16: 4rem          /* 64px */
--spacing-20: 5rem          /* 80px */
```

**Usage:**
```css
.section {
  padding: var(--spacing-6);      /* 24px */
  margin-bottom: var(--spacing-8); /* 32px */
}
```

### Typography

#### Font Sizes
```css
--font-size-xs: 0.75rem     /* 12px */
--font-size-sm: 0.875rem    /* 14px */
--font-size-base: 1rem      /* 16px - body text */
--font-size-lg: 1.125rem    /* 18px */
--font-size-xl: 1.25rem     /* 20px */
--font-size-2xl: 1.5rem     /* 24px */
--font-size-3xl: 1.875rem   /* 30px */
--font-size-4xl: 2.25rem    /* 36px */
```

#### Font Weights
```css
--font-weight-light: 300
--font-weight-normal: 400      /* Body text */
--font-weight-medium: 500
--font-weight-semibold: 600    /* Headings */
--font-weight-bold: 700
--font-weight-extrabold: 800
```

#### Line Heights
```css
--line-height-tight: 1.25      /* For headings */
--line-height-normal: 1.5      /* Body text */
--line-height-relaxed: 1.75
--line-height-loose: 2
```

### Shadows

```css
--shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.1)       /* Subtle */
--shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1)       /* Default */
--shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1)     /* Prominent */
--shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.1)     /* Very prominent */
--shadow-primary: 0 4px 12px rgba(37, 117, 252, 0.15)  /* Primary colored */
```

**Usage:**
```css
.card {
  box-shadow: var(--shadow-md);
}

.card:hover {
  box-shadow: var(--shadow-lg);
}
```

### Border Radius

```css
--radius-sm: 0.25rem        /* 4px - subtle */
--radius-md: 0.5rem         /* 8px - default */
--radius-lg: 0.75rem        /* 12px - cards */
--radius-xl: 1rem           /* 16px - prominent */
--radius-full: 9999px       /* Fully rounded (pills) */
```

### Transitions

```css
--transition-fast: 150ms ease-in-out    /* Quick hover effects */
--transition-base: 300ms ease-in-out    /* Default animations */
--transition-slow: 500ms ease-in-out    /* Slow reveals */
```

**Usage:**
```css
.button {
  transition: all var(--transition-base);
}

.button:hover {
  transform: translateY(-2px);
}
```

### Z-Index Scale

```css
--z-index-dropdown: 1000
--z-index-sticky: 1020
--z-index-fixed: 1030
--z-index-modal-backdrop: 1040
--z-index-modal: 1050
--z-index-tooltip: 1070
```

---

## Utility Classes

### Spacing Utilities

#### Margin
```html
<div class="m-4">Margin all sides: 16px</div>
<div class="mt-6">Margin top: 24px</div>
<div class="mb-8">Margin bottom: 32px</div>
<div class="mx-auto">Centered horizontally</div>
<div class="my-4">Margin Y-axis (top & bottom): 16px</div>
```

#### Padding
```html
<div class="p-4">Padding all sides: 16px</div>
<div class="px-6">Padding X-axis (left & right): 24px</div>
<div class="py-4">Padding Y-axis (top & bottom): 16px</div>
```

#### Gap (Flexbox/Grid)
```html
<div class="d-flex gap-3">Flex with 12px gap</div>
```

### Typography Utilities

#### Font Sizes
```html
<p class="text-xs">Extra small text (12px)</p>
<p class="text-sm">Small text (14px)</p>
<p class="text-base">Base text (16px)</p>
<p class="text-lg">Large text (18px)</p>
<p class="text-xl">Extra large (20px)</p>
<p class="text-2xl">2XL (24px)</p>
```

#### Font Weights
```html
<p class="font-light">Light weight (300)</p>
<p class="font-normal">Normal weight (400)</p>
<p class="font-medium">Medium weight (500)</p>
<p class="font-semibold">Semibold (600)</p>
<p class="font-bold">Bold (700)</p>
```

#### Text Alignment
```html
<p class="text-left">Left aligned</p>
<p class="text-center">Center aligned</p>
<p class="text-right">Right aligned</p>
```

#### Text Colors
```html
<p class="text-primary">Primary color</p>
<p class="text-success">Success green</p>
<p class="text-danger">Danger red</p>
<p class="text-muted">Muted gray</p>
```

### Flexbox Utilities

```html
<!-- Flex Container -->
<div class="d-flex justify-between items-center gap-4">
  <div>Item 1</div>
  <div>Item 2</div>
</div>

<!-- Flex Direction -->
<div class="d-flex flex-column">Vertical stack</div>

<!-- Justify Content -->
<div class="d-flex justify-center">Centered content</div>
<div class="d-flex justify-between">Space between</div>

<!-- Align Items -->
<div class="d-flex items-center">Vertically centered</div>
<div class="d-flex items-start">Top aligned</div>
```

### Background Utilities

```html
<div class="bg-primary">Primary background</div>
<div class="bg-success">Success background</div>
<div class="bg-gray-100">Light gray background</div>
<div class="bg-gradient-primary">Gradient background</div>
```

### Border Utilities

```html
<div class="border rounded">Bordered with radius</div>
<div class="border-bottom">Bottom border only</div>
<div class="border-primary rounded-lg">Primary border, large radius</div>
<div class="rounded-full">Fully rounded (circle/pill)</div>
```

### Shadow Utilities

```html
<div class="shadow">Default shadow</div>
<div class="shadow-lg">Large shadow</div>
<div class="shadow-primary">Primary colored shadow</div>
```

### Display Utilities

```html
<div class="d-none">Hidden</div>
<div class="d-block">Block display</div>
<div class="d-flex">Flex display</div>
<div class="d-inline-block">Inline block</div>

<!-- Responsive visibility -->
<div class="hide-mobile">Hidden on mobile</div>
<div class="show-desktop">Visible only on desktop</div>
```

### Width & Height Utilities

```html
<div class="w-100">Full width (100%)</div>
<div class="w-50">Half width (50%)</div>
<div class="h-100">Full height (100%)</div>
```

### Interaction Utilities

```html
<!-- Hover effects -->
<div class="hover-lift">Lifts on hover</div>
<div class="hover-scale">Scales up on hover</div>

<!-- Cursor -->
<div class="cursor-pointer">Pointer cursor</div>
<div class="cursor-not-allowed disabled">Not allowed cursor</div>

<!-- Transitions -->
<div class="transition">Smooth transition</div>
<div class="transition-fast">Fast transition</div>
```

---

## Component Patterns

### Card Component

```html
<div class="card">
  <div class="card-header">
    Card Title
  </div>
  <div class="card-body">
    Card content goes here
  </div>
  <div class="card-footer">
    <button class="btn btn-primary">Action</button>
  </div>
</div>
```

**Styles:**
- White background with subtle shadow
- Rounded corners (12px)
- Hover effect (lifts slightly)
- Optional header and footer

### Badge Component

```html
<span class="badge bg-success">Active</span>
<span class="badge bg-danger">Inactive</span>
<span class="badge bg-primary">New</span>
```

**Variants:**
- Small, compact design
- Semantic colors (success, danger, warning, info)
- Can be used inline with text

### Alert Component

```html
<div class="alert alert-success">
  Operation completed successfully!
</div>

<div class="alert alert-danger">
  An error occurred. Please try again.
</div>
```

**Variants:**
- `alert-success` - Green
- `alert-warning` - Yellow
- `alert-danger` - Red
- `alert-info` - Cyan

### Divider

```html
<!-- Horizontal divider -->
<div class="divider"></div>

<!-- Vertical divider (in flex container) -->
<div class="d-flex">
  <div>Left content</div>
  <div class="divider-vertical"></div>
  <div>Right content</div>
</div>
```

### Loading Spinner

```html
<div class="spinner"></div>
<button class="btn btn-primary">
  <span class="spinner mr-2"></span>
  Loading...
</button>
```

### Truncated Text

```html
<p class="truncate">
  This is a very long text that will be truncated with an ellipsis...
</p>
```

---

## Usage Guidelines

### Color Usage

#### When to use each color:
- **Primary Blue (#2575fc):** Main actions, links, active states
- **Success Green (#28a745):** Success messages, confirmations, active status
- **Warning Yellow (#ffc107):** Warnings, caution messages
- **Danger Red (#dc3545):** Errors, delete actions, inactive status
- **Info Cyan (#0dcaf0):** Informational messages, download buttons

#### Do's:
✅ Use semantic colors consistently (success = green, danger = red)
✅ Maintain color contrast for accessibility (WCAG AA minimum)
✅ Use the gradient backgrounds for prominent headers
✅ Stick to the defined palette

#### Don'ts:
❌ Don't use random hex colors not in the palette
❌ Don't use pure black (#000) for text (use --color-text-primary)
❌ Don't override Bootstrap colors directly

### Spacing Guidelines

#### Consistent Spacing Pattern:
- **Sections:** 32px (spacing-8) vertical spacing between major sections
- **Cards/Forms:** 24px (spacing-6) padding inside containers
- **Form Fields:** 16px (spacing-4) margin between inputs
- **Buttons:** 12px (spacing-3) gap between adjacent buttons
- **Inline Elements:** 8px (spacing-2) gap between small items

#### Example:
```html
<div class="section mb-8">              <!-- 32px bottom margin -->
  <div class="card p-6">                <!-- 24px padding -->
    <h2 class="mb-4">Title</h2>         <!-- 16px bottom margin -->
    <div class="d-flex gap-3">          <!-- 12px gap -->
      <button class="btn">Cancel</button>
      <button class="btn">Submit</button>
    </div>
  </div>
</div>
```

### Typography Guidelines

#### Hierarchy:
1. **H1 (2.25rem):** Page title (one per page)
2. **H2 (1.875rem):** Section headings
3. **H3 (1.5rem):** Subsection headings
4. **Body (1rem):** Main content
5. **Small (0.875rem):** Secondary text, captions

#### Do's:
✅ Use font-semibold (600) for headings
✅ Use font-normal (400) for body text
✅ Maintain line-height: 1.5 for readability
✅ Use 16px minimum for mobile inputs (prevents zoom)

#### Don'ts:
❌ Don't use more than 3 font weights on a page
❌ Don't use font sizes smaller than 12px
❌ Don't use ALL CAPS for long paragraphs

### Responsive Design

#### Breakpoint Strategy:
```
Mobile First Approach:
1. Design for 360px (small phones) first
2. Add enhancements at 576px (large phones)
3. Adjust layout at 768px (tablets)
4. Full experience at 992px+ (desktop)
```

#### Using Utilities Responsively:
```html
<!-- Hide on mobile, show on desktop -->
<div class="hide-mobile show-desktop">
  Desktop-only content
</div>

<!-- Stack on mobile, row on desktop -->
<div class="d-flex flex-column flex-md-row">
  <div>Item 1</div>
  <div>Item 2</div>
</div>
```

### Accessibility Guidelines

#### Focus States:
- All interactive elements must have visible focus indicators
- Use `focus-ring` class for consistent focus styling

#### Color Contrast:
- Text on backgrounds: Minimum 4.5:1 ratio
- Large text (18px+): Minimum 3:1 ratio
- Use text-muted sparingly (it's borderline for contrast)

#### Semantic HTML:
- Use proper heading hierarchy (H1 → H2 → H3)
- Use `<button>` for actions, `<a>` for navigation
- Include alt text for images
- Use `sr-only` class for screen reader only content

---

## Migration Guide

### Converting Inline Styles

#### Before (Inline):
```html
<div style="margin-bottom: 16px; padding: 24px; background: white;">
  Content
</div>
```

#### After (Using Utilities):
```html
<div class="mb-4 p-6 bg-white">
  Content
</div>
```

### Converting Custom CSS

#### Before (Custom CSS):
```css
.my-button {
  background-color: #2575fc;
  padding: 16px 24px;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.my-button:hover {
  background-color: #1a5dd9;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}
```

#### After (Using Tokens):
```css
.my-button {
  background-color: var(--color-primary);
  padding: var(--spacing-4) var(--spacing-6);
  border-radius: var(--radius-md);
  transition: all var(--transition-base);
}

.my-button:hover {
  background-color: var(--color-primary-dark);
  box-shadow: var(--shadow-md);
}
```

### Refactoring Checklist

When refactoring a page to use the design system:

- [ ] Replace hard-coded colors with CSS variables
- [ ] Replace pixel values with spacing tokens
- [ ] Use utility classes for common patterns (margins, padding, flex)
- [ ] Replace inline styles with utility classes
- [ ] Use component classes (card, badge, alert) where appropriate
- [ ] Ensure responsive behavior using responsive utilities
- [ ] Test all breakpoints (360px, 576px, 768px, 992px)
- [ ] Verify color contrast meets WCAG standards
- [ ] Check keyboard navigation and focus states

---

## File Structure

```
css/
├── design-tokens.css              # Design system foundation (load first)
├── nav.css                        # Navigation and sidebar
├── responsive-enhancements.css    # Global responsive overrides (load last)
├── dashboard.css                  # Page-specific styles
├── subjects.css                   # Page-specific styles
├── venues.css                     # Page-specific styles
├── departments.css                # Page-specific styles
└── users.css                      # Page-specific styles
```

**Load Order in nav.ejs:**
1. Bootstrap 5.3.0 (CDN)
2. Font Awesome 6.4.0 (CDN)
3. Select2 (CDN)
4. **design-tokens.css** ← Foundation
5. Page-specific CSS files
6. **responsive-enhancements.css** ← Final overrides

---

## Best Practices

### 1. Use Design Tokens First
Always check if a design token exists before adding custom values.

**✅ Good:**
```css
.element {
  color: var(--color-primary);
  margin: var(--spacing-4);
}
```

**❌ Bad:**
```css
.element {
  color: #2575fc;
  margin: 16px;
}
```

### 2. Compose with Utilities
Combine utility classes instead of writing custom CSS.

**✅ Good:**
```html
<div class="d-flex items-center gap-3 p-4 bg-white rounded shadow">
  Content
</div>
```

**❌ Bad:**
```html
<div class="custom-container">Content</div>

<style>
.custom-container {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}
</style>
```

### 3. Keep Page CSS Specific
Page-specific CSS files should only contain unique styles for that page, not generic patterns.

**✅ Good (in subjects.css):**
```css
.subjects-header {
  /* Unique layout specific to subjects page */
}
```

**❌ Bad (in subjects.css):**
```css
.card {
  /* This should be in design-tokens.css */
}
```

### 4. Document Component Variants
When creating new components, document all variants.

```css
/* Button Variants */
.btn-primary { /* default */ }
.btn-secondary { /* alternative */ }
.btn-outline { /* outlined version */ }
```

### 5. Test Across Devices
Always test changes on multiple breakpoints:
- Mobile: 360px, 375px
- Tablet: 768px, 820px
- Desktop: 1280px, 1920px

---

## Common Patterns

### Pattern 1: Page Header
```html
<div class="d-flex justify-between items-center mb-6">
  <h1 class="text-2xl font-semibold">Page Title</h1>
  <button class="btn btn-primary">
    <i class="fas fa-plus"></i> Add New
  </button>
</div>
```

### Pattern 2: Filter Section
```html
<div class="card mb-6">
  <div class="card-header">Filters</div>
  <div class="card-body">
    <div class="row">
      <div class="col-md-4 mb-3">
        <label class="form-label">Name:</label>
        <input type="text" class="form-control">
      </div>
      <!-- More filters -->
    </div>
  </div>
</div>
```

### Pattern 3: Action Buttons
```html
<div class="d-flex gap-2 justify-end">
  <button class="btn btn-secondary">Cancel</button>
  <button class="btn btn-primary">Save</button>
</div>
```

### Pattern 4: Status Badge
```html
<span class="badge <%= status === 'active' ? 'bg-success' : 'bg-danger' %>">
  <%= status %>
</span>
```

### Pattern 5: Loading State
```html
<button class="btn btn-primary" disabled>
  <span class="spinner mr-2"></span>
  Loading...
</button>
```

---

## Changelog

### Version 1.0 (January 2, 2026)
- Initial design system implementation
- 200+ utility classes
- 50+ design tokens
- Component patterns (card, badge, alert, spinner)
- Comprehensive documentation
- Responsive utilities
- Accessibility features

---

## Support

For questions or contributions:
1. Review this documentation
2. Check existing CSS files for examples
3. Test changes across all breakpoints
4. Document any new patterns added

**Last Updated:** January 2, 2026
**Version:** 1.0
**Status:** Production Ready
