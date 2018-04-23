var express = require('express');
var request = require('request'); // "Request" library
var querystring = require('querystring');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var sigUtil = require('eth-sig-util')

import SpotifyWebApi from 'spotify-web-api-js'
const spotifyApi = new SpotifyWebApi()

var client_id = '9b07765e7fc846f68e644e3ce45b47fc'; // Your client id
var client_secret = 'a0b1efb86ae1486085bbd0da7cb85a71'; // Your secret
var redirect_uri = 'http://localhost:8888/callback'; // Your redirect uri




var app = express();
var generateRandomString = function (length) {
  var text = '';
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

var stateKey = 'spotify_auth_state';

var clients = {}
var access_tokens = {}

app.use(bodyParser.json());

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.use(express.static(__dirname + '/public'))
  .use(cookieParser());

app.get('/login', function (req, res) {
  var state = generateRandomString(16);
  res.cookie(stateKey, state);

  // your application requests authorization
  var scope = 'user-read-playback-state user-modify-playback-state';
  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: client_id,
      scope: scope,
      redirect_uri: redirect_uri,
      state: state
    }));
});

app.get('/callback', function (req, res) {

  // your application requests refresh and access tokens
  // after checking the state parameter

  var code = req.query.code || null;
  var state = req.query.state || null;
  var storedState = req.cookies ? req.cookies[stateKey] : null;

  if (state === null || state !== storedState) {
    res.redirect('/#' +
      querystring.stringify({
        error: 'state_mismatch'
      }));
  } else {
    res.clearCookie(stateKey);
    var authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      form: {
        code: code,
        redirect_uri: redirect_uri,
        grant_type: 'authorization_code'
      },
      headers: {
        'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
      },
      json: true
    };

    request.post(authOptions, function (error, response, body) {
      if (!error && response.statusCode === 200) {

        var access_token = body.access_token,
          refresh_token = body.refresh_token;

        var options = {
          url: 'https://api.spotify.com/v1/me',
          headers: { 'Authorization': 'Bearer ' + access_token },
          json: true
        };

        // use the access token to access the Spotify Web API
        request.get(options, function (error, response, body) {
          access_tokens[body.id] = access_token

          res.redirect('http://localhost:8080/#' +
            querystring.stringify({
              access_token: access_token,
              refresh_token: refresh_token,
              id: body.id
            }));
        });

        // we can also pass the token to the browser to make requests from there

      } else {
        res.redirect('/#' +
          querystring.stringify({
            error: 'invalid_token'
          }));
      }
    });
  }
});

app.post('/send', function (req, res) {
  const recovered = sigUtil.recoverTypedSignature({
    data: req.body.data,
    sig: req.body.msg
  })
  if (recovered === req.body.from) {
    console.log('Recovered signer: ' + recovered)

    var options = {
      url: 'https://api.spotify.com/v1/me',
      headers: { 'Authorization': 'Bearer ' + req.body.token },
      json: true
    };

    request.get(options, function (error, response, body) {
      if(body.id == req.body.data[0].value) {
        console.log("Authorization successful.")
        clients[body.id] = recovered
      }
    });

  } else {
    console.log('Invalid signature.')
  }
})

app.post('/clientid', function(req, res) {
  res.send(clients[req.body.id])
})

app.post('/queue', function(req, res) {
  spotifyApi.setAccessToken(access_tokens[clients[req.body.address]]);
  spotifyApi.play({
    "uris": [req.body.track]
  })
  .then((response) => {
    res.send(response)
  })
})

app.get('/refresh_token', function (req, res) {

  // requesting access token from refresh token
  var refresh_token = req.query.refresh_token;
  var authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    headers: { 'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64')) },
    form: {
      grant_type: 'refresh_token',
      refresh_token: refresh_token
    },
    json: true
  };

  request.post(authOptions, function (error, response, body) {
    if (!error && response.statusCode === 200) {
      var access_token = body.access_token;

      var options = {
        url: 'https://api.spotify.com/v1/me',
        headers: { 'Authorization': 'Bearer ' + access_token },
        json: true
      };

      // use the access token to access the Spotify Web API
      request.get(options, function (error, response, body) {
        access_tokens[body.id] = access_token
      });

      res.send({
        'access_token': access_token
      });
    }
  });
});


console.log('Listening on 8888');
app.listen(8888);