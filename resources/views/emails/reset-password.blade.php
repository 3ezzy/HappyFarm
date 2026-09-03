<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Reset your HappyFarm password</title>
<!--[if mso]>
<noscript>
<xml>
<o:OfficeDocumentSettings>
<o:PixelsPerInch>96</o:PixelsPerInch>
</o:OfficeDocumentSettings>
</xml>
</noscript>
<![endif]-->
<style>
  /* Progressive enhancement only — every rule that matters for legibility
     is also inlined below, so this email still reads correctly in clients
     that strip <style> entirely (e.g. Gmail app on some versions). */
  body, table, td { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
  img { border: 0; line-height: 100%; outline: none; text-decoration: none; }
  a { text-decoration: none; }
  @media only screen and (max-width: 600px) {
    .hf-container { width: 100% !important; }
    .hf-px { padding-left: 20px !important; padding-right: 20px !important; }
  }
</style>
</head>
<body style="margin:0; padding:0; background-color:#F3F5F1;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F3F5F1;">
  <tr>
    <td align="center" style="padding:32px 16px;">

      <table role="presentation" class="hf-container" width="560" cellpadding="0" cellspacing="0" border="0" style="width:560px; max-width:100%;">

        {{-- Wordmark, email-safe: a colored badge + text rather than an
             embedded/linked image, since SVG and remote images are both
             unreliable across mail clients. --}}
        <tr>
          <td class="hf-px" style="padding:0 8px 24px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="width:36px; height:36px; background-color:#1B6349; border-radius:8px;" align="center" valign="middle">
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center">
                    <tr>
                      <td width="10" height="10" style="width:10px; height:10px; background-color:#F2B807; border-radius:5px; font-size:0; line-height:0;">&nbsp;</td>
                    </tr>
                  </table>
                </td>
                <td style="padding-inline-start:10px; font-family:Arial,Helvetica,sans-serif; font-size:20px; font-weight:bold; color:#10402F;" valign="middle">
                  HappyFarm
                </td>
              </tr>
            </table>
          </td>
        </tr>

        {{-- Card --}}
        <tr>
          <td style="background-color:#FFFFFF; border:1px solid #DFE5DC; border-radius:12px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td class="hf-px" style="padding:40px 40px 8px; font-family:Arial,Helvetica,sans-serif;">

                  <h1 style="margin:0 0 16px; font-family:Arial,Helvetica,sans-serif; font-size:22px; line-height:1.3; font-weight:bold; color:#131A14;">
                    Reset your password
                  </h1>

                  <p style="margin:0 0 24px; font-family:Arial,Helvetica,sans-serif; font-size:15px; line-height:1.6; color:#2C382D;">
                    Hi {{ $userName ?: 'there' }}, we received a request to reset the password for your HappyFarm account. Click the button below to choose a new one.
                  </p>

                  {{-- Bulletproof button: the background lives on the <td>,
                       not the <a>, so it still renders as a solid button in
                       Outlook's Word-based rendering engine. --}}
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px;">
                    <tr>
                      <td style="background-color:#1B6349; border-radius:8px;" align="center">
                        <a href="{{ $url }}" target="_blank" style="display:inline-block; padding:14px 32px; font-family:Arial,Helvetica,sans-serif; font-size:15px; font-weight:bold; color:#FFFFFF; text-decoration:none; border-radius:8px;">
                          Reset Password
                        </a>
                      </td>
                    </tr>
                  </table>

                  <p style="margin:0 0 8px; font-family:Arial,Helvetica,sans-serif; font-size:13px; line-height:1.6; color:#5A665A;">
                    If the button above doesn't work, copy and paste this link into your browser:
                  </p>
                  <p style="margin:0 0 24px; font-family:Arial,Helvetica,sans-serif; font-size:13px; line-height:1.6; word-break:break-all;">
                    <a href="{{ $url }}" target="_blank" style="color:#1B6349;">{{ $url }}</a>
                  </p>

                  <p style="margin:0 0 4px; font-family:Arial,Helvetica,sans-serif; font-size:13px; line-height:1.6; color:#5A665A;">
                    This link will expire in {{ $expireMinutes }} minutes.
                  </p>
                  <p style="margin:0 0 24px; font-family:Arial,Helvetica,sans-serif; font-size:13px; line-height:1.6; color:#5A665A;">
                    If you didn't request a password reset, you can safely ignore this email — your password will not be changed.
                  </p>

                </td>
              </tr>
              <tr>
                <td class="hf-px" style="padding:0 40px 32px;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid #DFE5DC;">
                    <tr><td style="line-height:1px; font-size:1px;">&nbsp;</td></tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        {{-- Footer --}}
        <tr>
          <td class="hf-px" style="padding:24px 8px 0; font-family:Arial,Helvetica,sans-serif; font-size:12px; line-height:1.6; color:#5A665A; text-align:center;">
            HappyFarm &middot; Digital flock management for Eid Al Adha readiness.
          </td>
        </tr>

      </table>

    </td>
  </tr>
</table>
</body>
</html>
