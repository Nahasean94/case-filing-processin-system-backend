var request = require('request')

const url = "https://classmite.com/confirm_payment.php"
const confirmPayment=function(checkout_id){
   return request(
        {
            method: 'POST',
            url: url,
            json: {
                "checkout_id": checkout_id
            }
        },
        function (error, response, body) {
            // TODO: Use the body object to extract the response
            return response
        }
    )
}
console.log(confirmPayment("ws_CO_DMZ_63668561_17082018033818289"))
module.exports=confirmPayment
