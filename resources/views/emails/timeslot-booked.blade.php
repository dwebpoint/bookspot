<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Booking</title>
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
        .footer { padding: 24px 32px; background: #f9fafb; text-align: center; font-size: 12px; color: #9ca3af; }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="header">
            <h1>New Booking Confirmed</h1>
        </div>
        <div class="body">
            <p>Hello {{ $timeslot->provider->name }},</p>
            <p>
                A client has booked one of your timeslots. Here are the details:
            </p>
            <div class="details">
                <table>
                    <tr>
                        <td>Client</td>
                        <td>{{ $client->name }} &lt;{{ $client->email }}&gt;</td>
                    </tr>
                    <tr>
                        <td>Date &amp; Time</td>
                        <td>{{ $timeslot->start_time->format('D, d M Y \a\t H:i') }}</td>
                    </tr>
                    <tr>
                        <td>Duration</td>
                        <td>{{ $timeslot->duration_minutes }} minutes</td>
                    </tr>
                    <tr>
                        <td>Ends At</td>
                        <td>{{ $timeslot->start_time->copy()->addMinutes($timeslot->duration_minutes)->format('H:i') }}</td>
                    </tr>
                </table>
            </div>
            <p>You can view and manage your bookings in your calendar.</p>
        </div>
        <div class="footer">
            <p>{{ config('app.name') }} &mdash; This is an automated notification.</p>
        </div>
    </div>
</body>
</html>
