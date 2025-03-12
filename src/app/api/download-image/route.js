import { NextResponse } from 'next/server';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const imageUrl = searchParams.get('imageUrl');
    const filename = searchParams.get('filename') || 'downloaded-image.jpg';

    if (!imageUrl) {
      return NextResponse.json({ error: 'Image URL is required' }, { status: 400 });
    }

    const response = await fetch(imageUrl);
    if (!response.ok) {
      return NextResponse.json({ error: `Failed to fetch image: ${response.statusText}` }, { status: response.status });
    }

    const blob = await response.blob();
    const buffer = await blob.arrayBuffer();

    return new Response(Buffer.from(buffer), {
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error in API:', error.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
