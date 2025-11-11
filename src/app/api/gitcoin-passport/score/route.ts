
import { NextResponse, type NextRequest } from 'next/server';

const GITCOIN_API_KEY = process.env.GITCOIN_API_KEY;
const SCORER_ID = process.env.GITCOIN_SCORER_ID;

export async function POST(req: NextRequest) {
  if (!GITCOIN_API_KEY || !SCORER_ID) {
    return NextResponse.json({ error: 'Gitcoin Passport API is not configured on the server.' }, { status: 500 });
  }

  try {
    const { address } = await req.json();

    if (!address) {
      return NextResponse.json({ error: 'Address is required.' }, { status: 400 });
    }

    const response = await fetch(`https://api.passport.xyz/v2/stamps/${SCORER_ID}/score/${address}`, {
      method: 'GET',
      headers: {
        'X-API-KEY': GITCOIN_API_KEY,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData?.detail || `Gitcoin API returned status: ${response.status}`;
        // If the address is not found, Gitcoin might return a 404 with a specific message.
        // We treat it as a score of 0 rather than a server error.
        if (response.status === 404) {
            return NextResponse.json({ score: 0, status: 'NOT_FOUND' });
        }
        return NextResponse.json({ error: errorMessage }, { status: response.status });
    }
    
    const data = await response.json();
    return NextResponse.json({ score: data.score, status: 'OK' });

  } catch (error) {
    console.error("Gitcoin Passport Score Error:", error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown server error occurred';
    return NextResponse.json({ error: `Failed to get score: ${errorMessage}` }, { status: 500 });
  }
}
