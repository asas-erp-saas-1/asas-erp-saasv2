# ASAS RE-OS Component Library Guide

This guide documents the comprehensive UI component library created for ASAS RE-OS with modern design patterns, accessibility features, and reusable patterns.

## 📋 Table of Contents

1. [New Components Overview](#new-components-overview)
2. [UI Components](#ui-components)
3. [Pattern Components](#pattern-components)
4. [Section Components](#section-components)
5. [Usage Examples](#usage-examples)
6. [Design System](#design-system)

## New Components Overview

### Phase 1: Foundation Components (Completed)
✅ **10+ New Components Created:**
- Core UI components (Card, Dialog, Dropdown, Tabs)
- Pattern components (StatusBadge, EmptyState, LoadingState, FormField, PriorityIndicator)
- Utility components (KPICard, LeadCard, DealCard, PropertyCard, ClientCard)
- Helper patterns (SearchBar, FilterBar, Pagination, AlertBox, ProgressBar, Skeleton)

### Enhancement Summary
- **Enhanced Button**: Added loading state, additional sizes (xl, icon-sm), better hover/active states
- **Enhanced Input**: Added variants (outline, filled) and sizes (sm, md, lg)
- **Enhanced Badge**: Added warning, info, ghost variants with rounded-full borders
- **ActionPanel**: Improved styling with better animations and structure

## UI Components

### Button Component
Enhanced with loading states and additional variants.

```tsx
import { Button } from "@/components/ui/Button"

// Loading state
<Button isLoading>Saving...</Button>

// Size variants
<Button size="sm">Small</Button>
<Button size="lg">Large</Button>
<Button size="xl">Extra Large</Button>

// Variant options
<Button variant="default">Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="destructive">Danger</Button>
<Button variant="link">Link</Button>
```

### Input Component
Supports multiple variants and sizes.

```tsx
import { Input } from "@/components/ui/Input"

<Input placeholder="Type here..." />
<Input variant="outline" size="lg" />
<Input variant="filled" disabled />
```

### Badge Component
Enhanced with more color options.

```tsx
import { Badge } from "@/components/ui/Badge"

<Badge variant="default">Gold</Badge>
<Badge variant="success">Success</Badge>
<Badge variant="warning">Warning</Badge>
<Badge variant="destructive">Error</Badge>
<Badge variant="info">Info</Badge>
<Badge variant="outline">Outline</Badge>
```

### Card Component
Flexible card with multiple variants for different use cases.

```tsx
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/Card"

<Card variant="elevated">
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card description</CardDescription>
  </CardHeader>
  <CardContent>Content here</CardContent>
</Card>
```

### Dialog Component
Modal dialog with smooth animations.

```tsx
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/Dialog"

<Dialog>
  <DialogTrigger asChild>
    <Button>Open Dialog</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Dialog Title</DialogTitle>
    </DialogHeader>
    Dialog content here
  </DialogContent>
</Dialog>
```

### Dropdown Menu Component
Rich dropdown menu with icons and states.

```tsx
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/Dropdown"

<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="outline">Menu</Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem>Edit</DropdownMenuItem>
    <DropdownMenuItem>Delete</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

### Tabs Component
Tab navigation with active state styling.

```tsx
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs"

<Tabs defaultValue="tab1">
  <TabsList>
    <TabsTrigger value="tab1">Tab 1</TabsTrigger>
    <TabsTrigger value="tab2">Tab 2</TabsTrigger>
  </TabsList>
  <TabsContent value="tab1">Content 1</TabsContent>
  <TabsContent value="tab2">Content 2</TabsContent>
</Tabs>
```

## Pattern Components

### StatusBadge
Status indicator with colored dot.

```tsx
import { StatusBadge } from "@/components/patterns/StatusBadge"

<StatusBadge status="active">Active</StatusBadge>
<StatusBadge status="pending" showDot label="Pending" />
<StatusBadge status="error">Error</StatusBadge>
```

### PriorityIndicator
Priority level badge with icon.

```tsx
import { PriorityIndicator } from "@/components/patterns/PriorityIndicator"

<PriorityIndicator priority="high" />
<PriorityIndicator priority="critical" label="Urgent" />
```

### EmptyState
Display when no data is available.

```tsx
import { EmptyState } from "@/components/patterns/EmptyState"
import { Package } from "lucide-react"

<EmptyState
  icon={Package}
  title="No products found"
  description="Create your first product to get started"
  action={{
    label: "Create Product",
    onClick: () => navigate('/create')
  }}
/>
```

### LoadingState
Loading indicator with message.

```tsx
import { LoadingState } from "@/components/patterns/LoadingState"

<LoadingState message="Loading..." />
<LoadingState variant="minimal" />
<LoadingState size="lg" />
```

### FormField
Reusable form field wrapper.

```tsx
import { FormField } from "@/components/patterns/FormField"
import { Input } from "@/components/ui/Input"

<FormField label="Email" required error="Email is required" hint="Enter a valid email">
  <Input type="email" />
</FormField>
```

### SearchBar
Search input with clear button.

```tsx
import { SearchBar } from "@/components/patterns/SearchBar"

<SearchBar
  placeholder="Search..."
  value={search}
  onChange={setSearch}
  onSearch={handleSearch}
  onClear={() => setSearch('')}
/>
```

### FilterBar
Multi-filter component for tables and lists.

```tsx
import { FilterBar } from "@/components/patterns/FilterBar"

<FilterBar
  filters={{
    Status: [
      { id: 'active', label: 'Active', count: 15 },
      { id: 'inactive', label: 'Inactive', count: 3 }
    ]
  }}
  activeFilters={filters}
  onFilterChange={setFilters}
/>
```

### Pagination
Page navigation component.

```tsx
import { Pagination } from "@/components/patterns/Pagination"

<Pagination
  currentPage={page}
  totalPages={10}
  onPageChange={setPage}
  showFirstLast
/>
```

### AlertBox
Alert/notification component.

```tsx
import { AlertBox } from "@/components/patterns/AlertBox"

<AlertBox variant="success" title="Success!" description="Operation completed" />
<AlertBox variant="error" title="Error" closeable onClose={handleClose} />
```

### ProgressBar
Visual progress indicator.

```tsx
import { ProgressBar } from "@/components/patterns/ProgressBar"

<ProgressBar value={75} max={100} showLabel animated />
<ProgressBar value={50} color="success" />
```

### Skeleton
Loading skeleton for cards and tables.

```tsx
import { Skeleton, CardSkeleton, TableRowSkeleton } from "@/components/patterns/Skeleton"

<Skeleton className="h-12 w-full" />
<CardSkeleton />
```

## Section Components

### KPICard
Dashboard KPI display card.

```tsx
import { KPICard } from "@/components/sections/KPICard"
import { TrendingUp } from "lucide-react"

<KPICard
  icon={TrendingUp}
  title="Revenue"
  value="$45,000"
  subtitle="Last 30 days"
  trend={{ value: 12, isPositive: true }}
  variant="highlighted"
/>
```

### LeadCard
Lead information card.

```tsx
import { LeadCard } from "@/components/sections/LeadCard"

<LeadCard
  id="lead-123"
  name="John Doe"
  status="qualified"
  value={50000}
  lastContact="2 hours ago"
  onContact={handleCall}
  onMessage={handleMessage}
  onView={handleView}
/>
```

### DealCard
Deal/opportunity card for pipeline views.

```tsx
import { DealCard } from "@/components/sections/DealCard"

<DealCard
  id="deal-456"
  clientName="Acme Corp"
  stage="CONTRACT_PENDING"
  value={100000}
  progress={75}
  assignee={{ initials: "JD", name: "John Doe" }}
  onMessage={handleMessage}
  isDragging={false}
/>
```

### PropertyCard
Real estate property listing card.

```tsx
import { PropertyCard } from "@/components/sections/PropertyCard"

<PropertyCard
  id="prop-789"
  name="Downtown Apartments"
  location="Algiers"
  type="Apartment"
  units={20}
  available={5}
  price={2500000}
  status="active"
  onView={handleView}
/>
```

### ClientCard
Client/customer profile card.

```tsx
import { ClientCard } from "@/components/sections/ClientCard"

<ClientCard
  id="client-101"
  name="Jane Smith"
  email="jane@example.com"
  phone="+213 555 0100"
  location="Algiers"
  status="vip"
  deals={5}
  totalValue={500000}
  onContact={handleContact}
  onView={handleView}
/>
```

### StatsGrid
Grid layout for KPI cards.

```tsx
import { StatsGrid } from "@/components/sections/StatsGrid"

<StatsGrid cols={4} items={[
  { title: "Revenue", value: "$45K" },
  { title: "Leads", value: "128" },
  // ... more items
]} />
```

### PageHeader
Consistent page header with title and actions.

```tsx
import { PageHeader } from "@/components/sections/PageHeader"

<PageHeader
  title="Leads Management"
  description="Manage all your leads"
  icon={Users}
  actions={<Button>Create Lead</Button>}
/>
```

### PageLayout Components
Layout helpers for consistent page structure.

```tsx
import { PageLayout, Section, Grid } from "@/components/sections/PageLayout"

<PageLayout>
  <PageHeader title="Dashboard" />
  <Section title="Overview" description="Your metrics">
    <Grid cols={3}>
      {/* Cards here */}
    </Grid>
  </Section>
</PageLayout>
```

## Usage Examples

### Complete Page Example
```tsx
"use client"
import { useState } from "react"
import { PageHeader, PageLayout, Section, Grid, KPICard, LeadCard } from "@/components"
import { Button } from "@/components/ui/Button"
import { Users, Plus } from "lucide-react"

export default function LeadsPage() {
  const [leads, setLeads] = useState([])

  return (
    <PageLayout>
      <PageHeader
        title="Leads Management"
        icon={Users}
        description="Track and manage all your leads"
        actions={
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Lead
          </Button>
        }
      />

      <Section title="Key Metrics">
        <Grid cols={4}>
          <KPICard
            title="Total Leads"
            value={leads.length}
            variant="highlighted"
          />
          <KPICard title="Qualified" value="45" />
          <KPICard title="In Negotiation" value="12" />
          <KPICard title="Won This Month" value="8" />
        </Grid>
      </Section>

      <Section title="All Leads">
        <Grid cols={3}>
          {leads.map((lead) => (
            <LeadCard
              key={lead.id}
              {...lead}
              onView={() => navigate(`/leads/${lead.id}`)}
            />
          ))}
        </Grid>
      </Section>
    </PageLayout>
  )
}
```

## Design System

### Color Palette
- **Primary Brand**: `#0F1113` (Charcoal)
- **Secondary**: `#F2EDE4` (Sand)
- **Accent**: `#C7A15A` (Gold)
- **Navy**: `#081D33`
- **Emerald**: `#0D2824`
- **Copper**: `#B87333`
- **Silver**: `#A7A9AC`

### Typography
- **Display/Headings**: Space Grotesk
- **Body**: Inter
- **Mono**: JetBrains Mono

### Spacing
- Uses Tailwind's default spacing scale
- Consistent gap and padding patterns across components

### Animations
- Smooth transitions (200-300ms)
- Framer Motion integration for advanced effects
- Entrance animations for modals and dialogs

## Best Practices

1. **Use the component library** - Always prefer existing components
2. **Consistent spacing** - Use Tailwind's gap and p classes
3. **Accessibility** - All components support ARIA labels and keyboard navigation
4. **Dark mode** - All colors work in both light and dark modes
5. **Responsive design** - Components are mobile-first and responsive

## Next Steps

- Continue with Phase 2: Enhance pages (leads, deals, clients, projects, finance)
- Add micro-interactions and animations
- Implement loading and empty states on all pages
- Create additional section components as needed
