// import the necessary package
const nodemailer = require('nodemailer');
const pug = require('pug');
const htmlToText = require('html-to-text');

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(` `)[0];
    this.url = url;
    this.from = `Nick Baker ${process.env.EMAIL}`;
  }

  newTransport() {
    if (process.env.NODE_ENV === 'development') {
      return nodemailer.createTransport({
        service: 'SendGrid',
        auth: {
          user: process.env.SENDGRID_USER,
          pass: process.env.SENDGRID_PASSWORD
        }
      });
    }

    if (process.env.NODE_ENV === 'production') {
      // Add production email service configuration here
      return nodemailer.createTransport({
        service: 'SendGrid',
        auth: {
          user: process.env.SENDGRID_USER,
          pass: process.env.SENDGRID_PASSWORD
        }
      });
    }
  }

  async send(template, subject) {
    /* 1. Render HTML based on a pug template */
    const html = pug.renderFile(`${__dirname}/../views/email/${template}.pug`, {
      firstName: this.firstName,
      url: this.url,
      subject
    });

    /*  2. Define email options */
    const mailOptions = {
      // first comes the name, then the email
      from: `tuznikolas@gmail.com`,
      to: this.to,
      subject,
      html,
      text: htmlToText.htmlToText(html, {
        wordWrap: 100
      })
    };

    /* 2. Create transport and send email */
    await this.newTransport().sendMail(mailOptions);

  }

  async sendWelcome() {
    await this.send(`welcome`, `Welcome to the Natours family!`);
  }

  async sendResetPassword() {
    await this.send(`passwordReset`, `Wanted to reset Natours Password? The token is valid for 10 minutes.`);
  }

};

// module.exports = sendEmail;