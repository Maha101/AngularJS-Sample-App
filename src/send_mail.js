var nodemailer = require('nodemailer');

function SendMail(send_to, mail_subject, mail_body, callback) {
    var transporter = nodemailer.createTransport({
        service: 'outlook',
        auth: {
            user: 'goldennutsreport@outlook.com',
            pass: '1by04cs027'
        }
    });

    var mailOptions = {
        from: 'The Golden Nuts ✔ <goldennutsreport@outlook.com>', // sender address
        to: send_to, 
        subject: mail_subject, // Subject line
        html: mail_body, // plaintext body
    };

    transporter.sendMail(mailOptions, function(error, info){
        if(error){
            console.log(error);
            callback(true);
        }else{
            console.log('Message sent: ' + info.response);
            callback(false);
        }
    });
}

module.exports = {
    SendMail: SendMail
}
