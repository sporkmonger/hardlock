/* jshint esversion: 6 */

const blake2 = require('blake2s-js');
const base64 = require('base64-js');

var insideNode = false;
if ((typeof process !== 'undefined') &&
    (typeof process.release !== 'undefined') &&
    (process.release.name === 'node')) {
  insideNode = true;
}
var insideWebWorker = false;
if (insideNode) {
  // Node.js, therefore not a WebWorker.
  insideWebWorker = false;
} else if (typeof document === 'undefined') {
  // WebWorkers have window but not window.document.
  insideWebWorker = true;
}
var workableOrigin = false;
if (!insideNode && !insideWebWorker && typeof location !== 'undefined' &&
    typeof location.origin === 'string' && location.origin.startsWith('http')) {
  workableOrigin = true;
}

function arr2str(arr) {
  return String.fromCharCode.apply(null, new Uint8Array(arr));
}

function str2arr(str) {
  var arr = new Uint8Array(str.length);
  for (var i = 0, strLen = str.length; i < strLen; i++) {
    arr[i] = str.charCodeAt(i);
  }
  return arr;
}

class HardLock {
  constructor(difficulty, salt, key, workerFile) {
    this.workerFile = workerFile;
    this.difficulty = difficulty;
    if (typeof salt === 'string') {
      salt = str2arr(salt);
    }
    this.salt = salt;
    if (typeof key === 'string') {
      key = str2arr(key);
    }
    this.key = key;
    this.personalization =
      new Uint8Array([0x68, 0x61, 0x72, 0x64, 0x6c, 0x6f, 0x63, 0x6b]);
    var randomSource = global.crypto || global.msCrypto;
    if (typeof randomSource.getRandomValues !== 'undefined') {
      this.randomBytes = function() {
        var nonce = new Uint8Array(32);
        randomSource.getRandomValues(nonce);
        return nonce;
      };
    } else if (typeof randomSource.randomBytes !== 'undefined') {
      this.randomBytes = function() {
        return randomSource.randomBytes(32);
      };
    } else {
      this.randomBytes = function() {
        // Our usage of random numbers does not require them to be
        // cryptographically secure. Any old "random" values will do.
        var nonce = new Uint8Array(32);
        for (var i = 0; i < 32; i++) {
          nonce[i] = Math.floor((Math.random() * 256));
        }
        return nonce;
      };
    }
  }

  static encode(nonces) {
    var segments = [];
    for (var i = 0; i < nonces.length; i++) {
      segments.push(base64.fromByteArray(nonces[i]));
    }
    return segments.join(",");
  }

  static onmessage(event) {
    try {
      var params = JSON.parse(event.data);
      if (typeof params.difficulty !== 'undefined' &&
          typeof params.salt !== 'undefined' &&
          typeof params.key !== 'undefined') {
        var salt = new Uint8Array(8);
        var key = new Uint8Array(Object.keys(params.key).length);
        for (var i = 0; i < 8; i++) {
          salt[i] = params.salt[String(i)] || params.salt[i];
        }
        for (i = 0; i < Object.keys(params.key).length; i++) {
          key[i] = params.key[String(i)] || params.key[i];
        }
        var hl = new HardLock(params.difficulty, salt, key);
        hl.work().then(function (results) {
          global.postMessage(JSON.stringify(results));
        }).catch(function (reason) {
          global.postMessage(JSON.stringify({
            "error": reason
          }));
        });
      }
    } catch(err) {
      // Was this message meant for us?
      console.error(err);
    }
  }

  workSync() {
    var set = {};
    var digest = null;
    var nonce = null;
    while (true) {
      var hash = new blake2(this.difficulty, {
        salt: this.salt,
        personalization: this.personalization,
        key: this.key
      });
      nonce = this.randomBytes();
      hash.update(nonce);
      digest = hash.digest();
      if (!set[arr2str(digest)]) {
        // We haven't collided yet. Save this hash and nonce.
        set[arr2str(digest)] = nonce;
      } else {
        // Don't update the set if we have a collision.
        break;
      }
    }
    var nonces = [nonce, set[arr2str(digest)]];
    return {digest: digest, nonces: nonces, encoded: HardLock.encode(nonces)};
  }

  work() {
    var _this = this;
    return new Promise(function(resolve, reject) {
      if (_this.workerFile !== null && !insideWebWorker && !insideNode &&
          workableOrigin && typeof Worker === 'function') {
        // Don't actually do the work here. Do it in a web worker.
        // NOTE: This file itself is a web worker!
        var params = {
          difficulty: _this.difficulty,
          salt: _this.salt,
          key: _this.key
        };
        var message = JSON.stringify(params);
        var worker = new Worker(_this.workerFile || 'hardlock.min.js');
        var results;
        worker.onmessage = function (event) {
          try {
            var rawResults = JSON.parse(event.data);
            results = {
              digest: null,
              nonces: [],
              encoded: ""
            };

            var digest = new Uint8Array(_this.difficulty);
            for (var i = 0; i < 8; i++) {
              digest[i] = rawResults.digest[String(i)] || rawResults.digest[i];
            }
            for (var rawNonce of rawResults.nonces) {
              var nonce = new Uint8Array(32);
              for (i = 0; i < 32; i++) {
                nonce[i] = rawNonce[String(i)] || rawNonce[i];
              }
              results.nonces.push(nonce);
            }
            results.encoded = rawResults.encoded;

            if (typeof results.nonces !== 'undefined') {
              var hl = new HardLock(params.difficulty, params.salt, params.key);
              var verified = hl.verify(results.nonces);
              if (verified) {
                return resolve(results);
              } else {
                return reject("HardLock result did not verify");
              }
            }
          } catch (err) {
            // Was this message meant for us?
            return reject(err);
          }
        };
        worker.postMessage(message);
      } else {
        setTimeout(function () {
          return resolve(_this.workSync());
        }, 1);
      }
    });
  }

  verify(nonces) {
    var set = {};
    for (var i = 0; i < nonces.length; i++) {
      var hash = new blake2(this.difficulty, {
        salt: this.salt,
        personalization: this.personalization,
        key: this.key
      });
      hash.update(nonces[i]);
      set[arr2str(hash.digest())] = true;
    }
    return Object.keys(set).length == 1;
  }
}

if (typeof window !== 'undefined') {
  window.HardLock = HardLock;
}
if (insideWebWorker) {
  // We don't want to make the browser unresponsive while working.
  global.onmessage = HardLock.onmessage;
}
module.exports = HardLock;
