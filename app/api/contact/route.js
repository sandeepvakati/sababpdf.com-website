import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_FIELD_LENGTH = 5000;

function normalize(value) {
    return typeof value === 'string' ? value.trim() : '';
}

export async function POST(request) {
    try {
        const body = await request.json();

        const name = normalize(body?.name);
        const email = normalize(body?.email);
        const subject = normalize(body?.subject);
        const message = normalize(body?.message);

        if (!name || !email || !subject || !message) {
            return NextResponse.json({ error: 'All fields are required.' }, { status: 400 });
        }

        if (name.length > 120 || subject.length > 180 || message.length > MAX_FIELD_LENGTH) {
            return NextResponse.json({ error: 'Input is too long.' }, { status: 400 });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json({ error: 'Please provide a valid email address.' }, { status: 400 });
        }

        const resendApiKey = process.env.RESEND_API_KEY;
        const toEmail = process.env.CONTACT_TO_EMAIL || 'sababpdf@gmail.com';
        const fromEmail = process.env.CONTACT_FROM_EMAIL || 'SababPDF Contact <onboarding@resend.dev>';

        if (!resendApiKey) {
            return NextResponse.json(
                { error: 'Contact service is not configured. Set RESEND_API_KEY.' },
                { status: 503 }
            );
        }

        const textBody = [
            'New contact form submission from SababPDF',
            '',
            `Name: ${name}`,
            `Email: ${email}`,
            `Subject: ${subject}`,
            '',
            'Message:',
            message,
        ].join('\n');

        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${resendApiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from: fromEmail,
                to: [toEmail],
                reply_to: email,
                subject: `[SababPDF Contact] ${subject}`,
                text: textBody,
            }),
        });

        if (!response.ok) {
            const errorPayload = await response.text();
            console.error('[contact] Resend error:', errorPayload);
            return NextResponse.json({ error: 'Failed to send message. Please try again later.' }, { status: 502 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[contact] Unexpected error:', error);
        return NextResponse.json({ error: 'Unable to send message right now.' }, { status: 500 });
    }
}
