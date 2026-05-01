import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const defaultPriorities = [
      { priority: 'urgent', client_name: 'Atlas Invest Group', title: 'Alerte Pipeline', description: 'Investisseur VIP bloqué en phase de négociation.' },
      { priority: 'high', client_name: 'Dr. Ziani', title: 'Taux de réponse bas', description: 'Le contact n\'a pas répondu aux 2 dernières sollicitations.' },
      { priority: 'medium', client_name: 'Sarl Moderne', title: 'Offre expirée', description: 'Re-calibrage de l\'offre nécessaire selon les prix actuels.' },
    ];
    return NextResponse.json(defaultPriorities);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
