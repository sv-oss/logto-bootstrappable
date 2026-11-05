import nodemailer from 'nodemailer';

describe('Nodemailer recipient parsing', () => {
  it('uses the address outside nested comments as the envelope recipient', async () => {
    const transporter = nodemailer.createTransport({ jsonTransport: true });

    const result = await transporter.sendMail({
      from: 'sender@example.com',
      to: 'Victim (x(y) <evil@evil.com>) <v@victim.com>',
      subject: 'Test',
      text: 'Test',
    });

    expect(result.envelope.to).toEqual(['v@victim.com']);
  });
});
