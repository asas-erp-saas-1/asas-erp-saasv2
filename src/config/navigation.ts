export type NavigationItem = {
  href: string
  label: string
  iconName: string
  description?: string
}

export type NavigationGroup = {
  group: string
  items: NavigationItem[]
  roles?: string[]
}

/**
 * Single source of truth for dashboard navigation.
 * Keep this list aligned with real App Router segments only.
 */
export const DASHBOARD_NAVIGATION: NavigationGroup[] = [
  {
    group: 'Command Center',
    items: [
      { href: '/dashboard/overview', label: 'Vue exécutive', iconName: 'LayoutGrid', description: 'Pilotage quotidien et exceptions' },
      { href: '/dashboard/intelligence', label: 'Intelligence Room', iconName: 'Zap', description: 'Décisions, risques et prévisions' },
      { href: '/dashboard/copilot', label: 'AI Copilot', iconName: 'Star', description: 'Assistant opérationnel' },
    ],
  },
  {
    group: 'Commercial & CRM',
    items: [
      { href: '/dashboard/leads', label: 'Leads & Pipeline', iconName: 'Users', description: 'Acquisition et qualification' },
      { href: '/dashboard/clients', label: 'Clients 360°', iconName: 'UserSquare2', description: 'Portefeuille et relation client' },
      { href: '/dashboard/deals', label: 'Transactions', iconName: 'Handshake', description: 'Réservations, ventes et encaissements' },
      { href: '/dashboard/reservations', label: 'Réservations', iconName: 'CalendarIcon', description: 'Suivi des disponibilités' },
    ],
  },
  {
    group: 'Promotion & Inventaire',
    items: [
      { href: '/dashboard/projects', label: 'Programmes immobiliers', iconName: 'Building2', description: 'Promotion, programmes et chantiers' },
      { href: '/dashboard/properties', label: 'Unités & Biens', iconName: 'Grid', description: 'Inventaire commercial' },
      { href: '/dashboard/unites', label: 'Matrice des unités', iconName: 'LayoutGrid', description: 'Disponibilité et tarification' },
      { href: '/dashboard/map', label: 'Carte immobilière', iconName: 'Search', description: 'Lecture géographique du portefeuille' },
    ],
  },
  {
    group: 'Finance & Opérations',
    roles: ['owner', 'admin', 'finance'],
    items: [
      { href: '/dashboard/finance', label: 'Finance & Trésorerie', iconName: 'DollarSign', description: 'Cash, dépenses et grand livre' },
      { href: '/dashboard/accounting', label: 'Comptabilité', iconName: 'Calculator', description: 'Journal et contrôle comptable' },
      { href: '/dashboard/invoices', label: 'Facturation', iconName: 'Receipt', description: 'Factures et suivi' },
      { href: '/dashboard/fournisseurs', label: 'Fournisseurs', iconName: 'ShoppingCart', description: 'Achats et partenaires' },
    ],
  },
  {
    group: 'Construction & Qualité',
    roles: ['owner', 'admin', 'project_manager'],
    items: [
      { href: '/dashboard/chantiers', label: 'Chantiers', iconName: 'Building2', description: 'Avancement opérationnel' },
      { href: '/dashboard/chantiers/risks', label: 'Risques chantier', iconName: 'ShieldAlert', description: 'Risques, retards et alertes' },
      { href: '/dashboard/qualite', label: 'Qualité', iconName: 'Award', description: 'Contrôle et conformité' },
    ],
  },
  {
    group: 'People & Performance',
    items: [
      { href: '/dashboard/agents', label: 'Équipe commerciale', iconName: 'Users', description: 'Agents et performance' },
      { href: '/dashboard/recruitment', label: 'Recrutement', iconName: 'UserSquare2', description: 'Talents et recrutement' },
      { href: '/dashboard/payroll', label: 'Paie', iconName: 'Receipt', description: 'Suivi RH' },
    ],
  },
  {
    group: 'Système',
    roles: ['owner', 'admin'],
    items: [
      { href: '/dashboard/automation', label: 'Automatisation', iconName: 'Zap', description: 'Workflows et RPA' },
      { href: '/dashboard/workflows', label: 'Workflows', iconName: 'Webhook', description: 'Orchestration des processus' },
      { href: '/dashboard/multi-company', label: 'Multi-sociétés', iconName: 'Building2', description: 'Gouvernance multi-entités' },
      { href: '/dashboard/settings', label: 'Paramètres', iconName: 'Settings', description: 'Configuration du système' },
      { href: '/dashboard/audit', label: 'Audit', iconName: 'Clock', description: 'Traçabilité et contrôle' },
    ],
  },
]
