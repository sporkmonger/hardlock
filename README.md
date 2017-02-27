# HardLock

HardLock is a proof-of-work system to force both malicious users and legitimate
users to calculate a piece of information with the property that it is hard to
calculate but easy to verify. HardLock uses hash collisions and the generalized
birthday problem to provide this property. It takes a hash of a salt and a
challenge value supplied by the server plus nonces supplied by the client. The
client must find a pair of nonces that results in a hash collision. Hash length
is set to an unusually small value in order to make hash collisions possible in
the expected time period. Each increase in difficulty factor is substantially
more difficult than the previous value. This could be made more fine-grained by
looking for hash collision prefixes at the bit level. I was too lazy to bother,
but I might pursue it if the technique proves effective as-is. A good difficulty
factor for typical usage is 4 or 5. You could increase it to 6 in case of an
active attack with some limited impact to legitimate clients on slower hardware.

HardLock is a proof-of-concept and probably should not be used in production.
I'm not even sure if it will really prevent the types of attacks it's intended
for. I've only tested it on a Nexus 5X and in Chrome and NodeJS on a
late 2013 Macbook Pro. For all I know, it'll set older mobile devices on fire...
you've been warned.

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

## Client-side Work

```js
// The filename is needed because it's need to run calculation as a web worker.
// This means that the hardlock.min.js must not be concatenated with other JS
// files during any kind of asset pipeline process you may be using.
var hl = new HardLock(5, 'testsalt', 'challengevaluegoesherelikecsrf', './dist/hardlock.min.js');
hl.work().then(function (results) {
  // Nonces are encoded into base64.
  document.getElementById('nonces').value = results.encoded;
}).catch(function (error) {
  // WARNING: The user will not be able to successfully submit the form if this
  // happens. You should notify the user as appropriate and probably log this
  // whereever you track client-side errors.
  console.error(error);
})
```

## Server-side Verification

```js
var hl = new HardLock(5, 'testsalt', 'challengevaluegoesherelikecsrf');
var nonces = req.body.nonces;
var verified = hl.verify(nonces);
```
