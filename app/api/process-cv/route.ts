import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Check if file is a text file
    if (!file.type.includes('text/plain')) {
      return NextResponse.json(
        { error: 'Only text files (.txt) are supported' },
        { status: 400 }
      );
    }

    // Read the file content
    const text = await file.text();
    
    // Enhanced text cleaning
    const cleanedText = text
      .replace(/\r\n/g, '\n')  // Normalize line endings
      .replace(/\n{3,}/g, '\n\n')  // Remove excessive newlines
      .replace(/[^\S\n]+/g, ' ')  // Replace multiple spaces with single space
      .replace(/[^\w\s\n.,!?-]/g, '')  // Remove special characters except basic punctuation
      .trim();

    if (!cleanedText) {
      throw new Error('Failed to extract text from CV');
    }

    // Split into sections for better organization
    const sections = cleanedText.split('\n\n').filter(section => section.trim());

    // Format the text with clear section headers
    const formattedText = sections.map(section => {
      // If the section starts with common CV headers, format them
      const commonHeaders = ['EDUCATION', 'EXPERIENCE', 'SKILLS', 'PROJECTS', 'CERTIFICATIONS'];
      const firstLine = section.split('\n')[0].toUpperCase();
      
      if (commonHeaders.some(header => firstLine.includes(header))) {
        return `\n${firstLine}\n${section.split('\n').slice(1).join('\n')}`;
      }
      return section;
    }).join('\n\n');

    return NextResponse.json({ text: formattedText });
  } catch (error) {
    console.error('Error processing CV:', error);
    return NextResponse.json(
      { error: 'Failed to process CV file' },
      { status: 500 }
    );
  }
} 