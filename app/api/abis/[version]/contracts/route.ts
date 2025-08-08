import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ version: string }> }
) {
  try {
    const { version } = await params
    const versionPath = path.join(process.cwd(), 'public', 'abis', version)
    
    // Check if version directory exists
    if (!fs.existsSync(versionPath)) {
      return NextResponse.json({ error: 'Version not found' }, { status: 404 })
    }

    // Read all JSON files in the version directory
    const files = fs.readdirSync(versionPath)
    const contracts = files
      .filter(file => file.endsWith('.json'))
      .map(file => file.replace('.json', ''))
      .sort()

    return NextResponse.json({ contracts })
  } catch (error) {
    console.error('Error reading contracts for version:', error)
    return NextResponse.json({ error: 'Failed to read contracts' }, { status: 500 })
  }
}