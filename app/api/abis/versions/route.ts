import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET() {
  try {
    const abisPath = path.join(process.cwd(), 'public', 'abis')
    
    // Check if abis directory exists
    if (!fs.existsSync(abisPath)) {
      return NextResponse.json({ error: 'ABIs directory not found' }, { status: 404 })
    }

    // Read all directories in the abis folder
    const items = fs.readdirSync(abisPath, { withFileTypes: true })
    const versions = items
      .filter(item => item.isDirectory())
      .map(dir => dir.name)
      .sort()

    return NextResponse.json({ versions })
  } catch (error) {
    console.error('Error reading ABIs directory:', error)
    return NextResponse.json({ error: 'Failed to read versions' }, { status: 500 })
  }
}