var request = require('request')
const btoa = require('btoa')

function pad2(n) {
    return n < 10 ? '0' + n : n
}

var date = new Date()

const timestamp = date.getFullYear().toString() + pad2(date.getMonth() + 1) + pad2(date.getDate()) + pad2(date.getHours()) + pad2(date.getMinutes()) + pad2(date.getSeconds())

const password = btoa(174379 + "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919" + timestamp)


const auth = "Bearer 8jDqE6liGl1LW8Vc7aV6cW0FfDDc"


const url = "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest"

const makePayment = function (phone_number) {

    return request(
        {
            method: 'POST',
            url: url,
            headers: {
                "Authorization": auth
            },
            json: {
                "BusinessShortCode": "174379",
                "Password": password,
                "Timestamp": timestamp,
                "TransactionType": "CustomerPayBillOnline",
                "Amount": "1",
                "PartyA": "600342",
                "PartyB": "174379",
                "PhoneNumber": phone_number,
                "CallBackURL": "https://classmite.com/mpesa_response.php",
                "AccountReference": "CaseFiling",
                "TransactionDesc": "This transaction is to pay for forms for ejudiciary"
            }
        },
        function ({error, response, body}) {
            // TODO: Use the body object to extract the response
            console.log(body)
            // return body.body

        }
    )
}
module.exports=makePayment