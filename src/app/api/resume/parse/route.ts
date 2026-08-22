import { NextResponse } from 'next/server';
import { extractTextFromPDFDetailed, parseResumeText, saveCandidateProfileToDatabase, isValidResumeContent, isUnreadableExtraction } from '@/lib/resume_parser';

export const dynamic = 'force-dynamic';

export async function GET() {
  const sampleRawText = `Alex Rivers\nalex@example.com\nData Analyst & Python Developer\nSkills: Python (Pandas, NumPy), SQL, PostgreSQL\nProjects: Built customer sales analytics ETL pipeline`;
  const parsedData = await parseResumeText(sampleRawText);

  return NextResponse.json({
    success: true,
    message: 'Resume Parse API Endpoint. Send POST request with multipart/form-data "resume" file to upload custom PDF.',
    parsed_resume: parsedData
  });
}

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get('content-type') || '';
    let rawText = '';
    let isOcrTriggered = false;
    let extractionMethod = 'pdf-parse';

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('resume') as File | null;

      if (!file) {
        return NextResponse.json(
          { success: false, error: 'No resume file provided. Field name must be "resume".' },
          { status: 400 }
        );
      }

      if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json(
          { success: false, error: 'Maximum file size is 10 MB.' },
          { status: 400 }
        );
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const extraction = await extractTextFromPDFDetailed(buffer);

      // Never build a profile from a document we could not actually read.
      if (isUnreadableExtraction(extraction)) {
        return NextResponse.json(
          {
            success: false,
            error: "We couldn't read any text from this PDF. It looks like a scanned image. Please upload a text-based PDF, or export your resume to PDF again from the original document."
          },
          { status: 400 }
        );
      }

      rawText = extraction.text;
      isOcrTriggered = extraction.is_ocr_triggered;
      extractionMethod = extraction.extraction_method;
    } else {
      const json = await request.json().catch(() => ({}));
      if (json.raw_resume_text) {
        rawText = json.raw_resume_text;
      } else {
        return NextResponse.json(
          { success: false, error: 'Invalid payload: Send multipart/form-data with "resume" file or JSON with "raw_resume_text"' },
          { status: 400 }
        );
      }
    }

    if (!rawText || rawText.trim().length < 10) {
      return NextResponse.json(
        { success: false, error: "We couldn't read text from this PDF. Please try a clearer PDF or a text-based resume." },
        { status: 400 }
      );
    }

    // Validate that the document is actually a resume
    const validityCheck = isValidResumeContent(rawText);
    if (!validityCheck.isValid) {
      return NextResponse.json(
        { success: false, error: validityCheck.reason || 'Please upload a valid resume. The uploaded document does not appear to contain standard resume sections (such as skills, education, or work experience).' },
        { status: 400 }
      );
    }

    // Parse structured data using Gemini 2.5 Flash / Zod validation
    const parsedData = await parseResumeText(rawText);

    // Retrieve authenticated user if available
    let userId: string | undefined;
    try {
      const { createClient } = await import('@/lib/supabase/server');
      const supabaseServer = createClient();
      const { data: { user } } = await supabaseServer.auth.getUser();
      if (user) {
        userId = user.id;
      }
    } catch (authErr) {
      // Fallback for direct API testing
    }

    // Save to Supabase PostgreSQL database
    const profileId = await saveCandidateProfileToDatabase(parsedData, rawText, userId);

    return NextResponse.json({
      success: true,
      profile_id: profileId,
      is_ocr_triggered: isOcrTriggered,
      extraction_method: extractionMethod,
      parsed_resume: parsedData
    });

  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "We couldn't read text from this PDF. Please try a clearer PDF or a text-based resume." },
      { status: 500 }
    );
  }
}
