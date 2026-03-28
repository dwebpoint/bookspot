<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>You've been invited</title>
    <style>
        body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 0; }
        .wrapper { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 8px; overflow: hidden; }
        .header { background: #4f46e5; padding: 32px; text-align: center; }
        .header h1 { color: #ffffff; margin: 0; font-size: 22px; }
        .body { padding: 32px; color: #374151; }
        .body p { line-height: 1.6; margin: 0 0 16px; }
        .details { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 20px; margin: 24px 0; }
        .details table { width: 100%; border-collapse: collapse; }
        .details td { padding: 8px 0; font-size: 14px; }
        .details td:first-child { color: #6b7280; width: 40%; }
        .details td:last-child { font-weight: 600; color: #111827; }
        .btn { display: inline-block; background: #4f46e5; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 6px; font-size: 15px; font-weight: 600; margin: 8px 0; }
        .footer { padding: 24px 32px; background: #f9fafb; text-align: center; font-size: 12px; color: #9ca3af; }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="header">
            <h1>You've been invited to {{ config('app.name') }}</h1>
        </div>
        <div class="body">
            <p>Hello,</p>
            <p>
                <strong>{{ $invitation->provider->name }}</strong> has invited you to join {{ config('app.name') }} as a client.
            </p>
            <div class="details">
                <table>
                    <tr>
                        <td>Invited by</td>
                        <td>{{ $invitation->provider->name }}</td>
                    </tr>
                    <tr>
                        <td>Invitation expires</td>
                        <td>{{ $invitation->expires_at->format('D, d M Y') }}</td>
                    </tr>
                </table>
            </div>
            <p>Click the button below to create your account and get started:</p>
            <p style="text-align: center; margin: 32px 0;">
                <a href="{{ url(route('invitation.show', $invitation->token)) }}" class="btn">Accept Invitation</a>
            </p>
            <p style="font-size: 13px; color: #6b7280;">
                If the button doesn't work, copy and paste this link into your browser:<br>
                <a href="{{ url(route('invitation.show', $invitation->token)) }}" style="color: #4f46e5; word-break: break-all;">{{ url(route('invitation.show', $invitation->token)) }}</a>
            </p>
            <p style="font-size: 13px; color: #6b7280;">
                If you weren't expecting this invitation, you can safely ignore this email.
            </p>
        </div>
        <div class="footer">
            <p>{{ config('app.name') }} &mdash; This is an automated notification.</p>
        </div>
    </div>
</body>
</html>
