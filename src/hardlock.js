/* jshint esversion: 6 */

const blake2 = require('blake2s-js');

var decode;
if (typeof TextDecoder !== 'undefined') {
  decode = function (value) {
    return new TextDecoder('US-ASCII').decode(value);
  };
} else {
  try {
    const StringDecoder = require('string_decoder').StringDecoder;
    const decoder = new StringDecoder('ascii');
    decode = function (value) {
      return decoder.write(Buffer.from(value));
    };
  } catch(err) {
    // Just fall back to .toString() since we're using this for set checks
    decode = function (value) {
      return value.toString();
    };
  }
}

class HardLock {
  constructor(difficulty, salt, key) {
    this.difficulty = difficulty;
    this.salt = salt;
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

  work() {
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
      if (!set[decode(digest)]) {
        // We haven't collided yet. Save this hash and nonce.
        set[decode(digest)] = nonce;
      } else {
        // Don't update the set if we have a collision.
        break;
      }
    }
    return {digest: digest, nonces: [nonce, set[decode(digest)]] };
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
      set[decode(hash.digest())] = true;
    }
    return Object.keys(set).length == 1;
  }
}

if (typeof window !== 'undefined') {
  window.HardLock = HardLock;
}
module.exports = HardLock;
