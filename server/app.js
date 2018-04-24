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
var isHosting = {}

function authorizeAddress(data, msg, address) {
  return new Promise((resolve, reject) => {
    const recovered = sigUtil.recoverTypedSignature({
      data: data,
      sig: msg
    })
    if (recovered === address) {
      console.log('Recovered signer: ' + recovered)
      resolve(recovered)
    } else {
      console.log('Invalid signature.')
      reject()
    }
  })
}

function authorizeClient(id, token) {
  return new Promise((resolve, reject) => {
    var options = {
      url: 'https://api.spotify.com/v1/me',
      headers: { 'Authorization': 'Bearer ' + token },
      json: true
    };

    request.get(options, function (error, response, body) {
      if (body.id == id) {
        console.log("Authorization successful.")
        resolve()
      } else {
        console.log("Authorization failed.")
        reject()
      }
    })
  })
}


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
  authorizeClient(req.body.data[0].value, req.body.token).then(function () {
    authorizeAddress(req.body.data, req.body.msg, req.body.from).then(function (recovered) {
      clients[req.body.data[0].value] = recovered
      res.end()
    })
  })
})

app.post('/host', function (req, res) {
  console.log("host")
  authorizeClient(req.body.id, req.body.token).then(function() {
    isHosting[req.body.id] = true
    res.send(clients[req.body.id])
  })
})

app.post('/stop', function (req, res) {
  console.log("stop")
  authorizeClient(req.body.id, req.body.token).then(function() {
    isHosting[req.body.id] = false
    res.send(clients[req.body.id])
  })
})

app.post('/clientaddress', function (req, res) {
  res.send(clients[req.body.id])
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