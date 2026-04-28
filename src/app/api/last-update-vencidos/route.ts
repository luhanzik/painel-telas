import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'last-update-vencidos.json');

export async function GET() {
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8');
      return NextResponse.json(JSON.parse(data));
    }
    return NextResponse.json({ date: '...', checksum: 0 });
  } catch (error) {
    return NextResponse.json({ date: '...', checksum: 0 }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { date, checksum } = await request.json();
    fs.writeFileSync(filePath, JSON.stringify({ date, checksum }), 'utf8');
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
