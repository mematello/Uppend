import { NextResponse } from 'next/server';
import { createClient } from '../../../lib/supabase/server';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');
    const action = searchParams.get('action');

    if (!token || !action) {
      return new NextResponse(
        generateHtml('Invalid Request', 'Missing token or action parameter.'),
        { status: 400, headers: { 'Content-Type': 'text/html' } }
      );
    }

    // Standard server client (NOT service_role)
    const supabase = await createClient();

    const { data: result, error } = await supabase.rpc('redeem_reengagement_token', {
      p_token: token,
      p_action: action
    });

    if (error) {
      console.error('Error redeeming re-engagement token:', error);
      return new NextResponse(
        generateHtml('Server Error', 'An unexpected error occurred. Please try again later.'),
        { status: 500, headers: { 'Content-Type': 'text/html' } }
      );
    }

    if (result === 'success') {
      let message = 'Your preference has been recorded. Good luck with your job search!';
      if (action === 'found_job') {
        message = 'Congratulations on finding a job! 🎉 Your reminders have been paused.';
      } else if (action === 'snooze') {
        message = 'Your reminders have been snoozed for 30 days. We\'ll check back in later!';
      } else if (action === 'still_looking') {
        message = 'Thanks for letting us know. Keep up the momentum!';
      }

      return new NextResponse(
        generateHtml('Success!', message),
        { status: 200, headers: { 'Content-Type': 'text/html' } }
      );
    } else if (result === 'already_used') {
      return new NextResponse(
        generateHtml('Already Used', 'This link has already been used.'),
        { status: 400, headers: { 'Content-Type': 'text/html' } }
      );
    } else if (result === 'expired') {
      return new NextResponse(
        generateHtml('Expired', 'This link has expired or is invalid.'),
        { status: 400, headers: { 'Content-Type': 'text/html' } }
      );
    }

    return new NextResponse(
      generateHtml('Error', 'An unknown error occurred.'),
      { status: 400, headers: { 'Content-Type': 'text/html' } }
    );

  } catch (error: unknown) {
    console.error('Re-engagement route exception:', error);
    return new NextResponse(
      generateHtml('Server Error', 'An unexpected error occurred.'),
      { status: 500, headers: { 'Content-Type': 'text/html' } }
    );
  }
}

function generateHtml(title: string, message: string) {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Uppend</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          background-color: #f9fafb;
          color: #111827;
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          margin: 0;
        }
        .container {
          background-color: #ffffff;
          padding: 40px;
          border-radius: 12px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          max-width: 400px;
          text-align: center;
        }
        h1 {
          margin-top: 0;
          font-size: 24px;
        }
        p {
          color: #4b5563;
          font-size: 16px;
          line-height: 1.5;
          margin-bottom: 24px;
        }
        a {
          display: inline-block;
          background-color: #111827;
          color: #ffffff;
          font-weight: 600;
          text-decoration: none;
          padding: 12px 24px;
          border-radius: 6px;
          transition: background-color 0.2s;
        }
        a:hover {
          background-color: #374151;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>${title}</h1>
        <p>${message}</p>
        <a href="/">Go to Uppend</a>
      </div>
    </body>
    </html>
  `;
}
