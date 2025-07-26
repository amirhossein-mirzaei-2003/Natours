const nodemailer = require('nodemailer');
const pug = require('pug');
const { htmlToText } = require('html-to-text');

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(' ')[0];
    this.url = url;
    this.from = `Amirhossein MIrzaei ${process.env.EMAIL_USERNAME}`;
  }

  newTranporter() {
    if (process.env.NODE_ENV === 'production') {
      return nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USERNAME,
          pass: process.env.EMAIL_PASSWORD,
        },
      });
    }
    if (process.env.NODE_ENV === 'development') {
      return nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        auth: {
          user: process.env.EMAIL_USERNAME_MAILTRAP,
          pass: process.env.EMAIL_PASSWORD_MAILTRAP,
        },
      });
    }
  }

  async send(template, subject) {
    // 1) render HTML based on a pug template
    const html = pug.renderFile(
      `${__dirname}/../views/emails/${template}.pug`,
      {
        firstName: this.firstName,
        url: this.url,
        subject,
      },
    );

    // 2) define email options
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: htmlToText(html),
    };

    // 3) create a  transport and send email
    await this.newTranporter().sendMail(mailOptions);
  }

  async sendWelcome() {
    await this.send('welcome', 'welcome to the natours family!');
  }

  async sendResetPassword() {
    await this.send(
      'resetPassword',
      'your reset password token (valid 10 minutes)',
    );
  }
};
