var request = require('sync-request')

const url = "https://classmite.com/confirm_payment.php"
const pay=request('POST',url,
    {
        json: {
            "checkout_id": "ws_CO_DMZ_63668561_17082018033818289"
        }
    }
)
console.log(JSON.parse(pay.getBody('utf8')))
