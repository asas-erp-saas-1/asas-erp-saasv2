# ASAS RE-OS Components - Visual Reference

Quick visual reference for all 40+ components organized by category.

## UI Components

### Button
```
[Primary]  [Secondary]  [Outline]  [Ghost]  [Destructive]  [Link]

Size: sm, md (default), lg, xl
Icon: icon, icon-sm
Loading: <Button isLoading>Saving...</Button>
```

### Input
```
[Text Input]  [Outline]  [Filled]

Size: sm, md (default), lg
Types: text, email, password, etc.
```

### Badge
```
[Gold]  [Success]  [Warning]  [Error]  [Info]  [Outline]

Auto-sized, roundedSize: px-2.5 py-1
```

### Card
```
┌─────────────────┐
│ Card Header     │
├─────────────────┤
│ Card Content    │
├─────────────────┤
│ Card Footer     │
└─────────────────┘

Variants: default, elevated, outlined, filled
```

### Dialog
```
[Trigger Button]  → ┌──────────────────┐
                     │ Dialog Title  [X]│
                     │ Dialog Content   │
                     └──────────────────┘
```

### Dropdown
```
[Menu Button] ▼
  ├─ Edit
  ├─ Delete
  └─ Share
```

### Tabs
```
[Tab 1] [Tab 2] [Tab 3]
┌────────────────┐
│ Tab 1 Content  │
└────────────────┘
```

## Pattern Components

### StatusBadge
```
● Active    ● Pending    ● Error    ● Success
```

### PriorityIndicator
```
↓ Low    ↗ Medium    ⚠ High    🔴 Critical
```

### EmptyState
```
    📦
  No items found
  Create your first item
     [Create Button]
```

### LoadingState
```
    ⟳ (spinning)
    Loading...
```

### FormField
```
Email * _______________
  Hint text
  [or error message]
```

### SearchBar
```
🔍 [Search...]  [X]
```

### FilterBar
```
[Status ▼] [Type ▼]  [Active:2] [User:1] [Reset]
```

### Pagination
```
⟨ [ 1 ] [ 2 ] [ 3 ] ... [ 10 ] ⟩
```

### AlertBox
```
┌─────────────────────────────┐
│ ℹ Title                 [X] │
│ Description text here       │
└─────────────────────────────┘

Variants: default, success, warning, error, info
```

### ProgressBar
```
Progress: [████████░░] 80%

Colors: default, success, warning, error, info
```

### Skeleton
```
████████░  (pulse animation)
████░░░░░
████████░
```

### ConfirmDialog
```
[Confirm Action]
Are you sure? [Cancel] [Confirm]
```

## Section Components

### KPICard
```
┌──────────────────┐
│ REVENUE    💰    │
│ $45,000          │
│ Last 30 days     │
│ ↑ 12%            │
└──────────────────┘

Variants: default, highlighted, accent, danger
```

### LeadCard
```
┌──────────────────┐
│ John Doe    [NEW]│
│ $50,000          │
│ 📞 💬 Clock 2h   │
│      [View ⟶]    │
└──────────────────┘
```

### DealCard
```
┌──────────────────┐
│ Acme Corp    ●   │
│ CONTRACT...      │
│ $100,000         │
│ ████████░░ 80%   │
│ JD  💬           │
└──────────────────┘
```

### PropertyCard
```
┌──────────────────┐
│ 🏢 Thumbnail     │
│ Downtown Apt     │
│ 📍 Algiers       │
│ [Apartment] [Act]│
│ 20 | 5 Avail     │
│ $2.5M            │
│ [View Details]   │
└──────────────────┘
```

### ClientCard
```
┌──────────────────┐
│ 👤 Jane Smith    │
│ ID: client123    │
│ 📧 jane@ex.com   │
│ 📱 +213 555 0100 │
│ 📍 Algiers       │
│ Deals: 5 | $500K │
│ [Contact] [View] │
└──────────────────┘
```

### PageHeader
```
👥 Leads Management
   Manage all your sales pipeline

           [Create Lead]
```

### StatsGrid
```
┌────┐ ┌────┐ ┌────┐ ┌────┐
│KPI1│ │KPI2│ │KPI3│ │KPI4│
└────┘ └────┘ └────┘ └────┘
```

### PageLayout Components
```
<PageLayout>
  <PageHeader>
  
  <Section>
    <Grid cols={4}>
      {cards}
    </Grid>
  </Section>
  
  <Section>
    <Grid cols={3}>
      {items}
    </Grid>
  </Section>
</PageLayout>
```

## Complete Page Example

```
┌─────────────────────────────────────────┐
│  👥 Leads Management                    │
│  Manage all your sales pipeline         │
│                        [+ Create Lead]  │
├─────────────────────────────────────────┤
│ METRICS (StatsGrid - 4 columns)         │
│ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐   │
│ │Total │ │Qual'd│ │Nego  │ │Won   │   │
│ │ 156  │ │ 45   │ │ 12   │ │ 8    │   │
│ └──────┘ └──────┘ └──────┘ └──────┘   │
├─────────────────────────────────────────┤
│ ALL LEADS (Grid - 3 columns)            │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐│
│ │LeadCard  │ │LeadCard  │ │LeadCard  ││
│ └──────────┘ └──────────┘ └──────────┘│
│ ┌──────────┐ ┌──────────┐ ┌──────────┐│
│ │LeadCard  │ │LeadCard  │ │LeadCard  ││
│ └──────────┘ └──────────┘ └──────────┘│
└─────────────────────────────────────────┘
```

## Color Palette Quick Reference

```
┌─────────────────────────────────────────┐
│ Primary Gold        #C7A15A (asas-gold) │
│ Dark Charcoal       #0F1113 (asas-char) │
│ Light Sand          #F2EDE4 (asas-sand) │
│ Navy Accent         #081D33 (asas-navy) │
│ Emerald Success     #0D2824 (asas-emer) │
│ Copper Secondary    #B87333 (asas-copp) │
│ Silver Neutral      #A7A9AC (asas-silv) │
└─────────────────────────────────────────┘
```

## Responsive Layout Grid

```
Mobile (1 col)      Tablet (2 cols)     Desktop (3-4 cols)
┌──────────┐       ┌────────┬────────┐  ┌────┬────┬────┬────┐
│          │       │        │        │  │    │    │    │    │
│  Item 1  │       │ Item 1 │ Item 2 │  │ 1  │ 2  │ 3  │ 4  │
│          │  -->  │        │        │  └────┴────┴────┴────┘
├──────────┤       ├────────┼────────┤
│          │       │        │        │
│  Item 2  │       │ Item 3 │ Item 4 │
│          │       │        │        │
└──────────┘       └────────┴────────┘
```

## Animation Types Available

```
✓ Fade In       (fadeInVariants)
✓ Slide Left    (slideInLeftVariants)
✓ Slide Right   (slideInRightVariants)
✓ Slide Up      (slideInUpVariants)
✓ Scale In      (scaleInVariants)
✓ Stagger List  (containerVariants + itemVariants)
✓ Pulse         (pulseVariants)
✓ Bounce        (bounceVariants)
```

## Dark Mode Support

All components automatically support dark mode:
- Light background colors become dark
- Light text becomes dark
- Borders and accents adjust appropriately
- No additional code needed!

## Accessibility Features

✓ ARIA labels
✓ Keyboard navigation (Tab, Enter, Escape)
✓ Focus management
✓ Color contrast (WCAG AA)
✓ Semantic HTML
✓ Screen reader support

## Touch-Friendly Sizes

```
Button: minimum 44px (all variants)
Input:  minimum 40px height
Icons:  16px, 20px, or 24px (not smaller)
Links:  minimum 48px tap target
```

## Common Tailwind Classes Used

```
Spacing:     px-4 py-2 gap-6 mb-8
Colors:      text-asas-gold bg-white/10
Borders:     border border-asas-silver/20
Rounded:     rounded-md rounded-lg rounded-full
Shadows:     shadow-sm shadow-md shadow-lg
Transitions: transition-all duration-200
Hover:       hover:bg-white/10 hover:shadow-lg
Active:      active:shadow-sm active:bg-white/5
```

## Quick Copy Snippets

### Basic Card Layout
```tsx
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>Content</CardContent>
  <CardFooter>Actions</CardFooter>
</Card>
```

### KPI Grid
```tsx
<StatsGrid cols={4} items={[
  { title: "Total", value: "100", icon: Users },
  { title: "Active", value: "45", icon: CheckCircle },
  // ...
]} />
```

### Card Grid
```tsx
<Grid cols={3}>
  {items.map(item => <LeadCard key={item.id} {...item} />)}
</Grid>
```

### Form with Validation
```tsx
<FormField label="Email" required error="Required" hint="Valid email">
  <Input type="email" {...register('email')} />
</FormField>
```

### Search & Filter
```tsx
<SearchBar {...searchProps} />
<FilterBar {...filterProps} />
```

## Performance Tips

- Use `Skeleton` for loading states
- Use `LoadingState` for processing
- Use `EmptyState` for empty data
- Memoize cards in large lists
- Lazy load images in PropertyCard
- Use Pagination for large datasets

## Browser Support

✓ Chrome/Edge 90+
✓ Firefox 88+
✓ Safari 14+
✓ Mobile browsers (iOS Safari, Chrome Mobile)
