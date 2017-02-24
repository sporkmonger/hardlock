# HardLock

HardLock is a proof-of-work system to force both malicious users and legitimate
users to calculate a piece of information with the property that it is hard to
calculate but easy to verify. HardLock uses hash collisions and the generalized
birthday problem to provide this property. It takes a hash of a salt and a
challenge value supplied by the server plus nonces supplied by the client. The
client must find a pair of nonces that results in a hash collision. Hash length
is set to an unusually small value in order to make hash collisions possible in
the expected time period. Each increase in difficulty factor is an order of
magnitude more difficult than the previous value. A good difficulty factor for
typical usage is 3 or 4.

HardLock is a proof-of-concept and probably should not be used in production.
I'm not even sure if it will really prevent the types of attacks it's intended
for. For all I know, it'll set mobile devices on fire... you've been warned.

Obviously, it also requires JavaScript to be enabled on the client, which may or
may not be an acceptable trade-off.

# Demo

http://sporkmonger.github.io/hardlock
