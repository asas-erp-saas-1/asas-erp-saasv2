# ASAS RE-OS Component Library - Quick Start Guide

## What's New?

40+ production-ready components have been added to enhance the UX/UI of ASAS RE-OS. This guide helps you start using them immediately.

## Installation

No installation needed! All components are already in your codebase.

## Basic Usage

### Import Components

```tsx
import { 
  Button, 
  Card, 
  Badge, 
  KPICard, 
  LeadCard,
  PageHeader,
  PageLayout,
  Section,
  Grid
} from "@/components"
```

### Create a Simple Page

```tsx
"use client"
import { PageLayout, PageHeader, Section, Grid, KPICard, Button } from "@/components"
import { Plus, Users } from "lucide-react"

export default function Example() {
  return (
    <PageLayout>
      <PageHeader
        title="My Dashboard"
        icon={Users}
        description="Overview of key metrics"
        actions={<Button><Plus className="mr-2 h-4 w-4" /> Create New</Button>}
      />
      
      <Section title="Key Metrics">
        <Grid cols={4}>
          <KPICard title="Total" value={100} />
          <KPICard title="Active" value={45} />
          <KPICard title="Pending" value={12} />
          <KPICard title="Completed" value={8} />
        </Grid>
      </Section>
    </PageLayout>
  )
}
```

## Component Categories

### 1. UI Components (Use for basic elements)
- `Button` - All interactive buttons
- `Input` - Form inputs
- `Badge` - Status labels
- `Card` - Container elements
- `Dialog` - Modals
- `Dropdown` - Menus
- `Tabs` - Tab navigation

### 2. Pattern Components (Use for common patterns)
- `StatusBadge` - Status indicators
- `PriorityIndicator` - Priority levels
- `EmptyState` - Empty data display
- `LoadingState` - Loading indicators
- `FormField` - Form wrapper
- `SearchBar` - Search inputs
- `FilterBar` - Filter dropdowns
- `Pagination` - Page navigation
- `AlertBox` - Notifications
- `ProgressBar` - Progress display
- `Skeleton` - Loading placeholders
- `ConfirmDialog` - Confirmation modals

### 3. Section Components (Use for sections/cards)
- `KPICard` - Dashboard metrics
- `LeadCard` - Lead information
- `DealCard` - Deal/opportunity
- `PropertyCard` - Real estate listing
- `ClientCard` - Client profile
- `StatsGrid` - Metrics grid
- `PageHeader` - Page title
- `PageLayout` - Page structure

## Common Patterns

### Display a List of Items
```tsx
import { Grid, LeadCard } from "@/components"

<Grid cols={3}>
  {leads.map(lead => (
    <LeadCard
      key={lead.id}
      {...lead}
      onView={() => navigate(`/leads/${lead.id}`)}
    />
  ))}
</Grid>
```

### Show Loading State
```tsx
import { LoadingState } from "@/components"

{isLoading ? <LoadingState /> : <YourContent />}
```

### Display Empty State
```tsx
import { EmptyState } from "@/components"
import { Package } from "lucide-react"

{items.length === 0 && (
  <EmptyState
    icon={Package}
    title="No items found"
    description="Create your first item to get started"
    action={{
      label: "Create Item",
      onClick: handleCreate
    }}
  />
)}
```

### Add Search & Filter
```tsx
import { SearchBar, FilterBar } from "@/components"
import { useState } from "react"

export default function List() {
  const [search, setSearch] = useState("")
  const [filters, setFilters] = useState({})

  return (
    <>
      <SearchBar
        value={search}
        onChange={setSearch}
        placeholder="Search items..."
      />
      
      <FilterBar
        filters={{
          Status: [
            { id: 'active', label: 'Active' },
            { id: 'inactive', label: 'Inactive' }
          ]
        }}
        activeFilters={filters}
        onFilterChange={setFilters}
      />
    </>
  )
}
```

### Add Confirmation Dialog
```tsx
import { useConfirmDialog } from "@/components"

export default function DeleteButton() {
  const { confirm, config } = useConfirmDialog()

  const handleDelete = () => {
    confirm({
      title: "Delete Item?",
      description: "This action cannot be undone",
      variant: "destructive",
      confirmText: "Delete",
      onConfirm: () => {
        // Delete logic here
      }
    })
  }

  return (
    <>
      <button onClick={handleDelete}>Delete</button>
      <ConfirmDialog {...config} />
    </>
  )
}
```

## Button Variants

```tsx
import { Button } from "@/components"

// Variants
<Button variant="default">Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="destructive">Delete</Button>
<Button variant="link">Link</Button>

// Sizes
<Button size="sm">Small</Button>
<Button size="md">Medium</Button>
<Button size="lg">Large</Button>

// Loading
<Button isLoading>Saving...</Button>

// Icon
<Button size="icon"><Plus className="h-4 w-4" /></Button>
```

## Badge Variants

```tsx
import { Badge } from "@/components"

<Badge variant="default">Gold</Badge>
<Badge variant="success">Success</Badge>
<Badge variant="warning">Warning</Badge>
<Badge variant="destructive">Error</Badge>
<Badge variant="info">Info</Badge>
<Badge variant="outline">Outline</Badge>
```

## Color System

The design system uses these colors:

- **Primary (Gold)**: `text-asas-gold`, `bg-asas-gold`
- **Dark (Charcoal)**: `text-asas-charcoal`, `bg-asas-charcoal`
- **Light (Sand)**: `text-asas-sand`, `bg-asas-sand`
- **Accent (Navy)**: `text-asas-navy`, `bg-asas-navy`
- **Success (Emerald)**: `text-asas-emerald`, `bg-asas-emerald`
- **Secondary (Copper)**: `text-asas-copper`, `bg-asas-copper`
- **Neutral (Silver)**: `text-asas-silver`, `bg-asas-silver`

## Responsive Classes

```tsx
// Mobile-first approach
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
  {/* Single column on mobile, 2 on tablet, 4 on desktop */}
</div>
```

## Documentation

- **COMPONENT_GUIDE.md** - Detailed component documentation
- **UX_UI_DEVELOPMENT_SUMMARY.md** - Project overview and statistics

## Next Steps

1. Read COMPONENT_GUIDE.md for detailed component documentation
2. Look at existing pages in `/dashboard` to see component usage
3. Create new pages using the PageLayout + Section + Grid pattern
4. Customize components by passing props
5. Use the Tailwind CSS classes for additional styling

## Tips & Tricks

### Consistent Spacing
```tsx
<div className="space-y-8">  {/* Gap between items */}
  <Section />
  <Section />
</div>
```

### Responsive Grids
```tsx
// 1 column on mobile, 2 on tablet, 3 on desktop
<Grid cols={3} className="...">
  {items.map(...)}
</Grid>
```

### Dark Mode
All components support dark mode automatically. No additional styling needed!

### Animations
Import animation variants from `/lib/animations.ts` for Framer Motion:

```tsx
import { fadeInVariants, slideInUpVariants } from "@/lib/animations"
import { motion } from "motion/react"

<motion.div variants={fadeInVariants} initial="hidden" animate="visible">
  Content here
</motion.div>
```

## Need Help?

- Check COMPONENT_GUIDE.md for detailed examples
- Look at existing dashboard pages for real-world usage
- All components have TypeScript prop documentation
- Components follow Tailwind CSS conventions

Happy coding! 🚀
