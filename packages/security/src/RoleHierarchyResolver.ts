export class RoleHierarchyResolver {
  private static hierarchy: Record<string, string[]> = {
    'system_admin': ['agency_owner', 'agent', 'readonly'],
    'agency_owner': ['agent', 'readonly'],
    'agent': ['readonly'],
    'readonly': []
  };

  /**
   * Explodes a single role into all inherited roles down the tree.
   * Useful for complex RBAC systems where higher roles implicitly gain lower permissions.
   */
  static getInheritedRoles(role: string): string[] {
    const inherited = this.hierarchy[role];
    if (!inherited) return [role];

    let allRoles = [role];
    for (const childRole of inherited) {
       allRoles = allRoles.concat(this.getInheritedRoles(childRole));
    }

    return Array.from(new Set(allRoles)); // Deduplicate
  }

  static dominates(roleA: string, roleB: string): boolean {
    const aHierarchy = this.getInheritedRoles(roleA);
    return aHierarchy.includes(roleB);
  }
}
