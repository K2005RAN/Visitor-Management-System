import transporter from "../config/email.config.js";

// -------------------- Visitor Pass Email (Internal Employee Notification) --------------------
export const sendVisitorPassMail = async ({
  to, // employee's email  → receives the email
  cc, // manager's email   → silently CC'd, no mention in body
  photoPath,
  visitorName,
  visitorContact,
  visitorEmail,
  company,
  city,
  visitorId,
  allowOn,
  allowTill,
  departmentToVisit,
  employeeToVisit,
  purposeOfVisit,
}) => {
  try {
    if (!to) {
      console.warn("No recipient email provided");
      return false;
    }

    const currentYear = new Date().getFullYear();

    const formatDate = (date) =>
      date
        ? new Date(date).toLocaleString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          })
        : "N/A";

    const mailOptions = {
      from: {
        name: "WRL Security Team",
        address: "security.tadgam@westernequipments.com",
      },
      to,
      cc: cc?.filter(Boolean), // manager CC'd silently — not mentioned in email body
      subject: `Visitor Alert — ${visitorName} is here to meet you`,
      html: `
        <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
        <html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
        <head>
          <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Visitor Notification</title>
          <!--[if gte mso 9]><xml>
            <o:OfficeDocumentSettings>
              <o:AllowPNG/>
              <o:PixelsPerInch>96</o:PixelsPerInch>
            </o:OfficeDocumentSettings>
          </xml><![endif]-->
          <!--[if gte mso 9]><style>table{border-collapse:collapse;}</style><![endif]-->
        </head>
        <body style="margin:0;padding:0;background-color:#F0F2F5;">

        <table width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="#F0F2F5">
          <tr>
            <td align="center" style="padding:36px 12px;">

              <table width="560" border="0" cellpadding="0" cellspacing="0" bgcolor="#ffffff"
                style="border:1px solid #DDE3EC;font-family:Arial,Helvetica,sans-serif;">

                <!-- TOP ACCENT BAR -->
                <tr>
                  <td bgcolor="#1A56DB" style="height:4px;font-size:4px;line-height:4px;mso-line-height-rule:exactly;">&nbsp;</td>
                </tr>

                <!-- ══ HEADER ══ -->
                <tr>
                  <td style="padding:26px 32px 18px 32px;">
                    <table width="100%" border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td valign="middle">
                          <p style="margin:0 0 1px 0;font-family:Arial,sans-serif;font-size:9px;
                            font-weight:bold;letter-spacing:2.5px;color:#9CA3AF;text-transform:uppercase;">
                            Western Refrigeration Pvt. Ltd.
                          </p>
                          <p style="margin:0;font-family:Arial,sans-serif;font-size:20px;
                            font-weight:bold;color:#111827;">
                            Visitor Arrival Notification
                          </p>
                        </td>
                        <td valign="middle" align="right">
                          <table border="0" cellpadding="0" cellspacing="0">
                            <tr>
                              <td bgcolor="#EEF3FF" style="padding:6px 14px;border:1px solid #C5D3F5;" align="center">
                                <p style="margin:0 0 1px 0;font-family:Arial,sans-serif;font-size:8px;
                                  font-weight:bold;letter-spacing:1.5px;color:#1A56DB;text-transform:uppercase;">
                                  Pass ID
                                </p>
                                <p style="margin:0;font-family:'Courier New',Courier,monospace;font-size:13px;
                                  font-weight:bold;color:#0D1B4B;letter-spacing:1px;">
                                  #${visitorId}
                                </p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- HAIRLINE -->
                <tr>
                  <td style="padding:0 32px;">
                    <table width="100%" border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td bgcolor="#DDE3EC" style="height:1px;font-size:1px;line-height:1px;mso-line-height-rule:exactly;">&nbsp;</td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- ══ GREETING ══ -->
                <tr>
                  <td style="padding:20px 32px 6px 32px;font-family:Arial,sans-serif;font-size:13px;
                    color:#374151;line-height:1.75;">
                    Hi <strong style="color:#111827;">${employeeToVisit}</strong>,<br/>
                    Someone is at the security gate to meet you. Their details are below.
                  </td>
                </tr>

                <!-- ══ VISITOR CARD ══ -->
                <tr>
                  <td style="padding:14px 32px 22px 32px;">
                    <table width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="#F8FAFC" style="border:1px solid #DDE3EC; border-radius:8px;">
                      <tr>
                        <!-- Photo -->
                        <td width="88" valign="top" align="center" style="padding:16px;">
                          <img src="${photoPath}" alt="${visitorName}" width="88" height="88"
                              style="display:block;width:100%;height:auto;border-radius:50%;border:2px solid #1A56DB;" />
                        </td>
                        
                        <!-- Divider -->
                        <td width="1" bgcolor="#DDE3EC" style="font-size:0;line-height:0;">&nbsp;</td>
                        
                        <!-- Info -->
                        <td valign="top" style="padding:16px 18px;">
                          <!-- Name -->
                          <p style="margin:0 0 4px 0;font-family:Arial,sans-serif;font-size:16px;font-weight:bold;color:#111827;">
                            ${visitorName}
                          </p>
                          
                          <!-- Company & City -->
                          <p style="margin:0 0 12px 0;font-family:Arial,sans-serif;font-size:12px;color:#6B7280;">
                            ${company || "—"}${city ? ` &nbsp;&bull;&nbsp; ${city}` : ""}
                          </p>
                          
                          <!-- Contact Table -->
                          <table border="0" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="font-family:Arial,sans-serif;font-size:12px;color:#9CA3AF;font-weight:bold;padding-right:12px;white-space:nowrap;">
                                Phone
                              </td>
                              <td style="font-family:Arial,sans-serif;font-size:12px;color:#374151;">
                                ${visitorContact || "—"}
                              </td>
                            </tr>
                            <tr>
                              <td style="font-family:Arial,sans-serif;font-size:12px;color:#9CA3AF;font-weight:bold;padding-right:12px;white-space:nowrap;padding-top:4px;">
                                Email
                              </td>
                              <td style="font-family:Arial,sans-serif;font-size:12px;color:#374151;padding-top:4px;">
                                ${visitorEmail || "—"}
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

        <!-- ══ VISIT DETAILS ══ -->
        <tr>
          <td style="padding:0 32px 10px 32px;">
            <p style="margin:0 0 10px 0;font-family:Arial,sans-serif;font-size:9px;font-weight:bold;
              letter-spacing:2px;color:#9CA3AF;text-transform:uppercase;">Visit Details</p>

            <!-- Row 1: Purpose | Department -->
            <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom:8px;">
              <tr>
                <td width="48%" valign="top">
                  <table width="100%" border="0" cellpadding="0" cellspacing="0">
                    <tr>
                      <td bgcolor="#ffffff" style="padding:9px 12px;border:1px solid #DDE3EC;">
                        <p style="margin:0 0 2px 0;font-family:Arial,sans-serif;font-size:8px;font-weight:bold;
                          letter-spacing:1px;color:#9CA3AF;text-transform:uppercase;">Purpose</p>
                        <p style="margin:0;font-family:Arial,sans-serif;font-size:12px;
                          font-weight:bold;color:#111827;">${purposeOfVisit || "—"}</p>
                      </td>
                    </tr>
                  </table>
                </td>
                <td width="4%">&nbsp;</td>
                <td width="48%" valign="top">
                  <table width="100%" border="0" cellpadding="0" cellspacing="0">
                    <tr>
                      <td bgcolor="#ffffff" style="padding:9px 12px;border:1px solid #DDE3EC;">
                        <p style="margin:0 0 2px 0;font-family:Arial,sans-serif;font-size:8px;font-weight:bold;
                          letter-spacing:1px;color:#9CA3AF;text-transform:uppercase;">Department</p>
                        <p style="margin:0;font-family:Arial,sans-serif;font-size:12px;
                          font-weight:bold;color:#111827;">${departmentToVisit || "—"}</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <!-- Row 2: Valid From | Valid Till -->
            <table width="100%" border="0" cellpadding="0" cellspacing="0">
              <tr>
                <td width="48%" valign="top">
                  <table width="100%" border="0" cellpadding="0" cellspacing="0">
                    <tr>
                      <td width="3" bgcolor="#1A56DB" style="font-size:0;line-height:0;">&nbsp;</td>
                      <td bgcolor="#EEF3FF" style="padding:9px 12px;border-top:1px solid #C5D3F5;
                        border-right:1px solid #C5D3F5;border-bottom:1px solid #C5D3F5;">
                        <p style="margin:0 0 2px 0;font-family:Arial,sans-serif;font-size:8px;font-weight:bold;
                          letter-spacing:1px;color:#1A56DB;text-transform:uppercase;">Valid From</p>
                        <p style="margin:0;font-family:Arial,sans-serif;font-size:12px;
                          font-weight:bold;color:#0D1B4B;">${formatDate(allowOn)}</p>
                      </td>
                    </tr>
                  </table>
                </td>
                <td width="4%">&nbsp;</td>
                <td width="48%" valign="top">
                  <table width="100%" border="0" cellpadding="0" cellspacing="0">
                    <tr>
                      <td width="3" bgcolor="#DC2626" style="font-size:0;line-height:0;">&nbsp;</td>
                      <td bgcolor="#FEF2F2" style="padding:9px 12px;border-top:1px solid #FECACA;
                        border-right:1px solid #FECACA;border-bottom:1px solid #FECACA;">
                        <p style="margin:0 0 2px 0;font-family:Arial,sans-serif;font-size:8px;font-weight:bold;
                          letter-spacing:1px;color:#DC2626;text-transform:uppercase;">Valid Till</p>
                        <p style="margin:0;font-family:Arial,sans-serif;font-size:12px;
                          font-weight:bold;color:#7F1D1D;">${formatDate(allowTill)}</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- ══ ACTION NOTE ══ -->
        <tr>
          <td style="padding:10px 32px 26px 32px;">
            <table width="100%" border="0" cellpadding="0" cellspacing="0">
              <tr>
                <td width="3" bgcolor="#1A56DB" style="font-size:0;line-height:0;">&nbsp;</td>
                <td bgcolor="#F8FAFC" style="padding:12px 16px;border-top:1px solid #DDE3EC;
                  border-right:1px solid #DDE3EC;border-bottom:1px solid #DDE3EC;">
                  <p style="margin:0;font-family:Arial,sans-serif;font-size:12px;
                    color:#374151;line-height:1.7;">
                    Please proceed to the security gate to receive your visitor. If this visit
                    was not expected, contact the security desk immediately.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- ══ FOOTER ══ -->
        <tr>
          <td bgcolor="#F8FAFC" style="padding:14px 32px;border-top:1px solid #DDE3EC;">
            <table width="100%" border="0" cellpadding="0" cellspacing="0">
              <tr>
                <td valign="top" style="font-family:Arial,sans-serif;font-size:10px;
                  color:#9CA3AF;line-height:1.7;">
                  <span style="font-weight:bold;color:#6B7280;">WRL Security Team &bull; Tadgam Plant</span>
                  <br/>
                  security.tadgam@westernequipments.com
                </td>
                <td align="right" valign="bottom" style="font-family:Arial,sans-serif;
                  font-size:10px;color:#D1D5DB;line-height:1.7;">
                  <span style="font-weight:bold;color:#1A56DB;">MES Team &copy; ${currentYear}</span><br/><span style="font-weight:bold;color:#6B7280;">Do not reply<span/>
                </td>
              </tr>
            </table>
          </td>
        </tr>

      </table>

    </td>
  </tr>
</table>

</body>
</html>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(
      `Visitor notification sent → To: ${to} | CC: ${cc?.filter(Boolean).join(", ") || "none"} | ID: ${info.messageId}`,
    );
    return true;
  } catch (error) {
    console.error("Failed to send visitor notification email:", error);
    return false;
  }
};
