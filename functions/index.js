const functions = require('firebase-functions');
const admin = require('firebase-admin')
admin.initializeApp(functions.config().firebase)
var secrets = require('./secrets');

const rp = require('request-promise')

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });

exports.register = functions.https.onRequest((req, res) =>
                                            
{
    console.log(req);
    console.log(req.body)
    const response = req.body['g-recaptcha-response']
    const battlenetUsername = req.body.battletag;
    const emailRequest=req.body.email;
    const passwordRequest=req.body.password;
    const region=req.body.region;
    const battlenetID = req.body.battlenumber;
    
    
    
    console.log("recaptcha response", response)
    return rp({
        uri: 'https://www.google.com/recaptcha/api/siteverify',
        method: 'POST',
        formData: {
            secret: secrets.GOOGLE_RECAPTCHA_SECRET,
            response: response
        },
        json: true
    }).then(result => {
        console.log("recaptcha result", result)
        if (result.success)
        {
            //Captcha success.
            
            //Check if user exits.
            //Check if email exists.
            ref = admin.database().ref();
            
            return ref.child('members').child(battlenetUsername + battlenetID).once("value", function(data)
            {
                console.log("Return:")
                const returnData = data.val();
                console.log(returnData)
                if(returnData == null)//Username doesnt exist.        
                {
                    admin.auth().createUser({//Register user
                      email: emailRequest,
                      emailVerified: false,
                      password: passwordRequest,
                      displayName: battlenetUsername + "#" + battlenetID,
                      photoURL: "http://media.blizzard.com/heroes/images/icons/heroes-icons-large.jpg",
                      disabled: false
                    }).then(function(userRecord)
                        {
                            console.log("Successfully created new user:", userRecord.uid)
                            //Then, register data in database.
                        
                            return ref.child('members').child(battlenetUsername + battlenetID).update({email:emailRequest, username:battlenetUsername, usernumber:battlenetID, region:region}).then(data =>
                            {
                                return res.redirect("https://hotstourneys.com/index.html?register=1")
                            });
                        })
                      .catch(function(error) {
                            console.log(error);
                            return res.redirect("https://hotstourneys.com/register.html?failed=" + error.message)
                      });
                }
                else
                {
                    return res.redirect("https://hotstourneys.com/register.html?failed=1")
                }
            });
        }
        else
        {
            return res.redirect("https://hotstourneys.com/register.html?failed=captcha")
        }
    }).catch(reason => {
        console.log("Recaptcha request failure", reason)
        return res.redirect("https://hotstourneys.com/register.html?failed=0")
    })
});