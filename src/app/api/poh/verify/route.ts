import { NextResponse, type NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { address } = await req.json();

    if (!address) {
      return NextResponse.json({ error: 'Address is required.' }, { status: 400 });
    }

    const response = await fetch(`https://poh-api.linea.build/poh/v2/${address}`);
    
    // The API returns 200 OK and "true" for verified, 
    // and might return 404 or other non-200 statuses for unverified addresses.
    // We treat any non-"true" response as not human.
    if (response.ok) {
        const text = await response.text();
        const isHuman = text.trim().toLowerCase() === "true";
        return NextResponse.json({ isHuman });
    } else {
        // If the API returns any error (like 404), we consider the user not verified.
        return NextResponse.json({ isHuman: false });
    }

  } catch (error) {
    console.error("PoH Verification Error:", error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown server error occurred';
    return NextResponse.json({ error: `Failed to verify: ${errorMessage}` }, { status: 500 });
  }
}
