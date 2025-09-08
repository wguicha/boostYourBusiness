import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal that the user doesn't exist. 
      // Just send a generic success response.
      return NextResponse.json({ message: 'If an account with this email exists, a password reset link has been sent.' });
    }

    // Generate a reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const passwordResetToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    const passwordResetTokenExpires = new Date(Date.now() + 3600000); // 1 hour from now

    await prisma.user.update({
      where: { email },
      data: {
        passwordResetToken,
        passwordResetTokenExpires,
      },
    });

    // Create the reset URL
    const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${resetToken}`;

    // TODO: Configure your email transport options here
    // IMPORTANT: Use environment variables for sensitive data!
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_SERVER_HOST,
      port: Number(process.env.EMAIL_SERVER_PORT),
      secure: process.env.EMAIL_SERVER_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_SERVER_USER,
        pass: process.env.EMAIL_SERVER_PASSWORD,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: user.email as string,
      subject: 'Restablecimiento de Contraseña',
      html: `<p>Hola,</p>
             <p>Recibiste este correo porque solicitaste un restablecimiento de contraseña.</p>
             <p>Haz clic en este <a href="${resetUrl}">enlace</a> para restablecer tu contraseña.</p>
             <p>Si no solicitaste esto, por favor ignora este correo.</p>`,
    };

    if (!user.email) {
        console.warn(`Skipping password reset email for user ${user.id} because email is null.`);
        return NextResponse.json({ message: 'If an account with this email exists, a password reset link has been sent.' });
    }

    try {
        await transporter.sendMail(mailOptions);
    } catch (emailError) {
        console.error("Failed to send password reset email:", emailError);
        // Even if the email fails, we don't want to leak information.
        // The user record is updated, so they can try again later.
        // You might want to add more robust error handling or logging here.
    }

    return NextResponse.json({ message: 'If an account with this email exists, a password reset link has been sent.' });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'An internal server error occurred.' }, { status: 500 });
  }
}
