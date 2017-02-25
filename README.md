# HardLock

HardLock is a proof-of-work system to force both malicious users and legitimate
users to calculate a piece of information with the property that it is hard to
calculate but easy to verify. HardLock uses hash collisions and the generalized
birthday problem to provide this property. It takes a hash of a salt and a
challenge value supplied by the server plus nonces supplied by the client. The
client must find a pair of nonces that results in a hash collision. Hash length
is set to an unusually small value in order to make hash collisions possible in
the expected time period. Each increase in difficulty factor is an order of
magnitude more difficult than the previous value. This could be made more
fine-grained by using a longer hash and looking for hash collision prefixes at
the bit level. I was too lazy to bother. A good difficulty factor for typical
usage is 3 or 4.

HardLock is a proof-of-concept and probably should not be used in production.
I'm not even sure if it will really prevent the types of attacks it's intended
for. For all I know, it'll set mobile devices on fire... you've been warned.

Obviously, it also requires JavaScript to be enabled on the client, which may or
may not be an acceptable trade-off.

# Demo

```bash
npm install -g serve
serve
```
Navigate to [http://localhost:3000/](http://localhost:3000/)

NOTE: If you open index.html directly via file://, you will not be able to use
Web Workers for background computation and the browser may become unresponsive.
It will, however, otherwise work as intended.

# Usage

```js
var base64 = require('base64-js');
var encoder = new TextEncoder('ascii');
var hl = new HardLock(4, encoder.encode('testsalt'), encoder.encode('challengevaluegoesherelikecsrf'), './dist/hardlock.min.js');
hl.work().then(function (results) {
  var encodedNonces =
    base64.fromByteArray(encoder.encode(results.nonces[0])) + "|" +
    base64.fromByteArray(encoder.encode(results.nonces[1]));
  document.getElementById('nonces').value = encodedNonces;
}).catch(function (error) {
  // WARNING: The user will not be able to successfully submit the form if this
  // happens. You should notify the user as appropriate and probably log this
  // whereever you track client-side errors.
  console.error(error);
})
```
