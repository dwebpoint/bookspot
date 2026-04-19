<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Contact Form Submission</title>
    <style>
        body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 0; }
        .wrapper { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 8px; overflow: hidden; }
        .header { background: #4f46e5; padding: 32px; text-align: center; }
        .header h1 { color: #ffffff; margin: 0; font-size: 22px; }
        .body { padding: 32px; color: #374151; }
        .body p { line-height: 1.6; margin: 0 0 16px; }
        .details { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 20px; margin: 24px 0; }
        .details table { width: 100%; border-collapse: collapse; }
        .details td { padding: 8px 0; font-size: 14px; vertical-align: top; }
        .details td:first-child { color: #6b7280; width: 25%; font-weight: 500; }
        .details td:last-child { color: #111827; word-break: break-word; }
        .message-box { background: #f9fafb; border-left: 4px solid #4f46e5; border-radius: 6px; padding: 16px; margin: 24px 0; white-space: pre-wrap; word-wrap: break-word; }
        .footer { padding: 24px 32px; background: #f9fafb; text-align: center; font-size: 12px; color: #9ca3af; }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="header">
            <h1>New Contact Form Submission</h1>
        </div>
        <div class="body">
            <p>You have received a new message from the contact form:</p>

            <div class="details">
                <table>
                    <tr>
                        <td>From</td>
                        <td>{{ $visitorName }}<br><a href="mailto:{{ $visitorEmail }}" style="color: #4f46e5;">{{ $visitorEmail }}</a></td>
                    </tr>
                    <tr>
                        <td>Subject</td>
                        <td>{{ $subject }}</td>
                    </tr>
                </table>
            </div>

            <p style="font-weight: 500; margin-bottom: 8px;">Message:</p>
            <div class="message-box">{{ $message }}</div>

            <p style="font-size: 13px; color: #6b7280; margin-top: 32px;">
                To reply to this message, send an email to <strong>{{ $visitorEmail }}</strong>
            </p>
        </div>
        <div class="footer">
            <p>{{ config('app.name') }} &mdash; Contact Form Submission</p>
        </div>
    </div>
</body>
</html>
