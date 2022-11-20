require('dotenv').config();

const express = require("express")
var http = require("http").createServer(app);
var app = express();
app.use(express.json());

var server = app.listen(process.env.PORT || 2500, () => {
    console.log("Howdy, I am running at PORT 2500")
})

const Amadeus = require("amadeus");
const amadeus = new Amadeus({
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET
});


//SEARCH BY SPECIFIED CITY
app.get(`/citySearch`, async (req, res) => {
    console.log(req.query);
    var keywords = req.query.keyword;
    const response = await amadeus.referenceData.locations
        .get({
            keyword: keywords,
            subType: "CITY,AIRPORT",
        })
        .catch((x) => console.log(x));
    try {
        await res.json(JSON.parse(response.body));
    } catch (err) {
        await res.json(err);
    }
});


//SEARCH FOR FLIGHTS ON SPECIFIED DATE AND LOCATIONS
app.post("/date", async function (req, res) {
    console.log(req.body);
    departure = req.body.departure;
    arrival = req.body.arrival;
    locationDeparture = req.body.locationDeparture;
    locationArrival = req.body.locationArrival;
    const response = await amadeus.shopping.flightOffersSearch
        .get({
            originLocationCode: locationDeparture,
            destinationLocationCode: locationArrival,
            departureDate: departure,
            adults: "1",
        })
        .catch((err) => console.log(err));
    try {
        await res.json(JSON.parse(response.body));
    } catch (err) {
        await res.json(err);
    }
});


//UPDATED FLIGHT PRICE CONFIRMATION
app.post("/flightprice", async function (req, res) {
    inputFlight = req.body;
    console.log(req.body);
    amadeus.shopping.flightOffersSearch.get({
        originLocationCode: req.body.originLocationCode,
        destinationLocationCode: req.body.destinationLocationCode,
        departureDate: req.body.departureDate,
        adults: req.body.adults
    }).then(function (flightOffersSearchResponse) {
        return amadeus.shopping.flightOffers.pricing.post(
            JSON.stringify({
                'data': {
                    'type': 'flight-offers-pricing',
                    'flightOffers': [flightOffersSearchResponse.data[0]]
                }
            })
        )
    }).then(function (response) {
        console.log(response);
        res.json(response)
    }).catch(function (response) {
        console.error(response);
    });
});

//CREATING ORDER
app.post("/flightCreateOrder", async function (req, res) {
    amadeus.shopping.flightOffersSearch.get({
        originLocationCode: req.body.originLocationCode,
        destinationLocationCode: req.body.destinationLocationCode,
        departureDate: req.body.departureDate,
        adults: req.body.adults
    }).then(function (flightOffersResponse) {
        return amadeus.shopping.flightOffers.pricing.post(
            JSON.stringify({
                "data": {
                    "type": "flight-offers-pricing",
                    "flightOffers": [
                        flightOffersResponse.data[0]
                    ]
                }
            })
        );
    }).then(function (pricingResponse) {
        return amadeus.booking.flightOrders.post(
            JSON.stringify({
                'data': {
                    'type': 'flight-order',
                    'flightOffers': [pricingResponse.data.flightOffers[0]],
                    'travelers': [{
                        "id": "1",
                        "dateOfBirth": req.body.dateOfBirth,
                        "name": {
                            "firstName": req.body.firstName,
                            "lastName": req.body.lastName,
                        },
                        "gender": req.body.gender,
                        "contact": {
                            "emailAddress": req.body.emailAddress,
                            "phones": [{
                                "deviceType": req.body.deviceType,
                                "countryCallingCode": req.body.countryCallingCode,
                                "number": req.body.number,
                            }]
                        },
                        "documents": [{
                            "documentType": req.body.documentType,
                            "birthPlace": req.body.birthPlace,
                            "issuanceLocation": req.body.issuanceLocation,
                            "issuanceDate": req.body.issuanceDate,
                            "number": req.body.documentNumber,
                            "expiryDate": req.body.expiryDate,
                            "issuanceCountry": req.body.issuanceCountry,
                            "validityCountry": req.body.validityCountry,
                            "nationality": req.body.nationality,
                            "holder": true
                        }]
                    }]
                }
            })
        );
    }).then(function (response) {
        res.json(response);
        console.log(response);
    }).catch(function (response) {
        res.json(response)
        console.error(response);
    });
});