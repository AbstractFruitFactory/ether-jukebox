var rp = require('request-promise');
import Jukebox from '../js/jukebox.js'

Jukebox.init().then(function () {
  listen()
  function listen() {
    Jukebox.listenToEvent().then(function (result) {
      var options = {
        method: 'POST',
        uri: 'http://localhost:8888/queue',
        body: {
          address: result.clientAddress,
          track: result.trackURI
        },
        json: true
      };

      rp(options)
        .then(function (parsedBody) {
          console.log(parsedBody)
        })
        .catch(function (err) {
          console.log(err)
        });
    })
    listen()
  }

})
