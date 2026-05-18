# Roadmap & Architecture : ERP/CRM Promotion Immobilière

Ce document présente la stratégie complète, l'architecture et la feuille de route pour transformer "ASAS OS" en un ERP/CRM de pointe dédié à la promotion immobilière.

## 1. Vision et Objectifs
L'objectif est de fournir un "Système d'Exploitation" (OS) centralisé pour la gestion complète du cycle de vie d'un projet immobilier : de la conception (foncier, plans) à la livraison (SAV), en passant par la commercialisation (marketing, ventes, finance).

## 2. Architecture des Modules (Plan d'Action)

### 🔴 Phase 1 : Commercialisation et Ventes (Fondations - En Cours)
- **Base Clients (CRM)** : Gestion des prospects (Leads), qualification, historique des échanges, segmentation.
- **Pipeline d'Acquisition (Leads)** : Kanban des prospects, suivi des relances, intégration des sources (formulaires web, réseaux sociaux).
- **Gestion des Transactions (Deals)** : Suivi des ventes (réservations, compromis, actes authentiques), prévisions de vente.
- **Inventaire (Biens / Lots)** : Statut en temps réel de chaque lot (Disponible, Option, Réservé, Vendu), avec caractéristiques (surface, étage, prix).

### 🟡 Phase 2 : Gestion de Projets & Finance (Structure - À Développer)
- **Programmes Immobiliers (Projets)** : Groupement des biens par programme commercial, avancement des travaux, gestion documentaire globale (permis, plans de masse).
- **Facturation et Finance** : Échéanciers de paiement (appels de fonds basés sur l'avancement), relances automatiques, suivi de trésorerie (recettes attendues vs réalisées).
- **Tableaux de Bord Avancés (Overview/Metrics)** : KPI spécifiques à la promotion (Taux d'écoulement, Chiffre d'Affaires réservé vs acté, Taux de rentabilité interne).

### 🟢 Phase 3 : Back-Office Technique & SAV (Maturité - À Développer)
- **Gestion Documentaire Avancée (GED)** : Génération automatique des contrats (Contrats de réservation, VEFA), signature électronique.
- **Service Après-Vente (SAV) / Remises de clés** : Gestion des réserves à la livraison, suivi des levées de réserves avec les sous-traitants, tickets clients.
- **Espace Acquéreur (Portail Client)** : Un portail externe sécurisé où le client peut voir l'avancement du chantier, ses appels de fonds, et déclarer ses réserves SAV.

## 3. Plan d'Amélioration UX/UI Mobile (Résolution des obstacles)

### Problématique Actuelle (Menu Mobile)
- **Symptôme** : Au clic sur le menu, l'interface est bloquée ou s'affiche incorrectement sur mobile.
- **Diagnostic** : Le placement du composant `NextMobileMenu` dans l'arborescence DOM (dans `layout.tsx`) ainsi que les conflits de z-index (z-50 vs z-[100]) et la gestion des événements tactiles (safari/chrome bottom bars) causent un rendering bugué.
- **Solution Technique (Appliquée)** : 
  1. Simplification de l'animation `motion` pour garantir la stabilité sur iOS/Android.
  2. Ajustement des z-index pour le "Bottom Sheet" et les overlays.
  3. Sécurisation des "Tap Targets" (zones de clic) avec la gestion des zones sûres `env(safe-area-inset-bottom)`.

### Standards & Guidelines UI "ASAS"
L'interface doit respirer le luxe, la technologie et la précision.
1. **Couleurs** : Dark mode hyper-moderne (Fonds très sombres #050505, accents émeraudes et bleus électriques pour la valeur financière et les statuts).
2. **Typographie** : Fonts sans-serif géométriques (Inter/Space Grotesk) avec forte hiérarchie (Gros titres impactants, étiquettes minuscules espacées pour le contexte technique).
3. **Ergonomie** : Privilégier les interactions à une main (Bottom navigation, Bottom sheets pour les actions, listes lisibles).

## 4. Prochaines Étapes Techniques (Roadmap Immédiate)
1. **Correction Immédiate** : Refactoriser le Bottom Bar Mobile et le Composant Menu pour une expérience fluide à 100%.
2. **Module Programmes** : Création de la table `projects` pour lier les `properties` ensemble.
3. **Module Appels de Fonds** : Lier la finance aux différents stades de construction du projet.
4. **Intégration Documentaire** : Permettre d'uploader/générer des PDFs directement depuis une Transaction (Deal).
