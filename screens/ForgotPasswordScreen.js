// POST /api/auth/forgot-password { identifier }   (email OR phone)
// No SMS. Reuse OTP table. Always create a code; email if possible; log in dev.
exports.forgotPassword = async (req, res) => {
  const { identifier } = req.body;
  if (!identifier) return res.status(400).json({ message: 'identifier is required (email or phone)' });

  try {
    const pool = await poolPromise;
    const idTrim = String(identifier).trim();
    const isPhone = isPhoneLike(idTrim);

    // Build an OTP key that we’ll use consistently in all 3 steps
    // - For phones: use E.164 form (2335…) as the key
    // - For emails: use lowercase email as the key
    let otpKey = idTrim.toLowerCase();
    let emailTo = null;

    if (isPhone) {
      const { local, e164 } = normalizeGhana(idTrim);
      otpKey = e164;

      // Try to fetch the user by *either* saved format
      const ures = await pool.request()
        .input('p1', sql.VarChar, local)
        .input('p2', sql.VarChar, e164)
        .query('SELECT TOP 1 id, email, phone FROM Users WHERE phone IN (@p1, @p2)');
      const user = ures.recordset[0];
      if (user?.email) emailTo = user.email;
    } else {
      const ures = await pool.request()
        .input('email', sql.VarChar, idTrim.toLowerCase())
        .query('SELECT TOP 1 id, email, phone FROM Users WHERE LOWER(email) = @email');
      const user = ures.recordset[0];
      if (user) {
        emailTo = user.email; // confirm email exists on file
      }
    }

    // Create OTP and store against the otpKey in the otps table
    const code = genCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await pool.request()
      .input('phone', sql.VarChar, otpKey)      // we reuse the 'phone' column as the key
      .input('otp', sql.VarChar, code)
      .input('expiresAt', sql.DateTime, expiresAt)
      .query('INSERT INTO otps (phone, otp, expires_at) VALUES (@phone, @otp, @expiresAt)');

    // Deliver via EMAIL (if configured & we have an address). Otherwise just log for dev.
    if (emailTo) {
      try {
        await sendEmail(
          emailTo,
          'Your TaskConnect password reset code',
          `Use this code to reset your password: ${code}. It expires in 10 minutes.`
        );
      } catch (e) {
        console.warn('Email send failed:', e.message);
        console.log(`[FORGOT:DEV] To:${emailTo} | Code:${code}`);
      }
    } else {
      console.log(`[FORGOT:DEV] No email on file for ${idTrim}. Code: ${code}`);
    }

    // Always generic (no user enumeration)
    return res.status(200).json({ message: 'If the account exists, a reset code has been sent.' });
  } catch (err) {
    console.error('forgotPassword error:', err.message);
    return res.status(200).json({ message: 'If the account exists, a reset code has been sent.' });
  }
};
