# Design System Quick Reference

## 🎨 Colors
```css
Primary:    var(--color-primary)           #2575fc
Success:    var(--color-success)           #28a745
Warning:    var(--color-warning)           #ffc107
Danger:     var(--color-danger)            #dc3545
Info:       var(--color-info)              #0dcaf0
```

## 📏 Spacing (4px increments)
```
spacing-1:  4px    spacing-5:  20px
spacing-2:  8px    spacing-6:  24px
spacing-3:  12px   spacing-8:  32px
spacing-4:  16px   spacing-12: 48px
```

## 📝 Typography
```
Font Sizes:
xs: 12px   lg: 18px   3xl: 30px
sm: 14px   xl: 20px   4xl: 36px
base: 16px 2xl: 24px  5xl: 48px

Font Weights:
light: 300    semibold: 600
normal: 400   bold: 700
medium: 500
```

## 🎭 Shadows
```css
shadow-sm:  Subtle
shadow-md:  Default (cards)
shadow-lg:  Prominent (hover)
shadow-xl:  Very prominent
```

## 🔄 Border Radius
```
rounded-sm:  4px
rounded:     8px (default)
rounded-lg:  12px (cards)
rounded-xl:  16px
rounded-full: 9999px (circles)
```

## ⚡ Common Utility Classes

### Spacing
```html
m-4   → margin: 16px
mt-6  → margin-top: 24px
mb-8  → margin-bottom: 32px
p-6   → padding: 24px
gap-3 → gap: 12px
```

### Flexbox
```html
d-flex              → display: flex
flex-column         → vertical stack
justify-between     → space between items
items-center        → vertically centered
gap-4               → 16px gap
```

### Text
```html
text-xl             → 20px font size
font-bold           → 700 weight
text-primary        → primary color
text-center         → center aligned
```

### Background
```html
bg-white            → white background
bg-primary          → primary blue
bg-gradient-primary → gradient
```

### Display
```html
d-none              → hidden
d-block             → block
hide-mobile         → hidden < 768px
show-desktop        → visible > 991px
```

### Borders & Shadows
```html
border rounded      → bordered with radius
shadow              → default shadow
shadow-lg           → large shadow
rounded-lg          → 12px radius
```

### Interactions
```html
hover-lift          → lifts on hover
hover-scale         → scales on hover
cursor-pointer      → pointer cursor
transition          → smooth transition
```

## 🧩 Component Classes

### Card
```html
<div class="card">
  <div class="card-header">Title</div>
  <div class="card-body">Content</div>
  <div class="card-footer">Actions</div>
</div>
```

### Badge
```html
<span class="badge bg-success">Active</span>
```

### Alert
```html
<div class="alert alert-success">Message</div>
```

### Spinner
```html
<div class="spinner"></div>
```

## 📱 Breakpoints
```
xs:  360px   (small phones)
sm:  576px   (phones)
md:  768px   (tablets)
lg:  992px   (desktop)
xl:  1200px  (large desktop)
```

## 💡 Quick Patterns

### Page Header
```html
<div class="d-flex justify-between items-center mb-6">
  <h1 class="text-2xl font-semibold">Title</h1>
  <button class="btn btn-primary">Action</button>
</div>
```

### Form Field
```html
<div class="mb-3">
  <label class="form-label">Name:</label>
  <input type="text" class="form-control">
</div>
```

### Action Buttons
```html
<div class="d-flex gap-2 justify-end">
  <button class="btn btn-secondary">Cancel</button>
  <button class="btn btn-primary">Save</button>
</div>
```

### Status Badge
```html
<span class="badge bg-<%= status === 'active' ? 'success' : 'danger' %>">
  <%= status %>
</span>
```

## 🎯 Load Order
```html
1. Bootstrap 5.3.0
2. Font Awesome 6.4.0
3. Select2
4. design-tokens.css      ← Foundation
5. Page-specific CSS
6. responsive-enhancements.css ← Last
```

## ✅ Best Practices

**DO:**
- Use design tokens: `var(--color-primary)`
- Compose with utilities: `d-flex gap-3 p-4`
- Mobile-first approach
- Test all breakpoints

**DON'T:**
- Hard-code colors: `#2575fc`
- Hard-code spacing: `16px`
- Write custom CSS for common patterns
- Forget accessibility (focus states, contrast)

## 📚 Full Documentation
See [DESIGN-SYSTEM.md](DESIGN-SYSTEM.md) for complete guide.
