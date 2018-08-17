
const accountSid = 'AC7eea5ad0c0793fd647c6d7a596740fbc'
const authToken = '055e40e06dda72b7d70b343f0fb0d133\n'
const client = require('twilio')(accountSid, authToken)
// const body=



client.messages
    .create({
        body: "Never mess the system",
        from: '+14159095176',
        to: '+254705031577'
    })
    .then(message => console.log(message.sid)).catch(err => {
    console.log("Could not send the message. Check you network connection")
})