/// Pure Motoko SHA-1 and HMAC-SHA1 implementation.
/// Used for Twilio webhook signature validation.
import Array "mo:core/Array";
import Blob "mo:core/Blob";
import Nat8 "mo:core/Nat8";
import Nat32 "mo:core/Nat32";
import Text "mo:core/Text";

module {

  // ── SHA-1 ─────────────────────────────────────────────────────────────────

  /// Rotate-left 32-bit.
  private func rotl(x : Nat32, n : Nat32) : Nat32 {
    (x << n) | (x >> (32 - n));
  };

  /// Compute SHA-1 digest of a byte array.  Returns 20-byte array.
  public func sha1(msg : [Nat8]) : [Nat8] {
    var h0 : Nat32 = 0x67452301;
    var h1 : Nat32 = 0xEFCDAB89;
    var h2 : Nat32 = 0x98BADCFE;
    var h3 : Nat32 = 0x10325476;
    var h4 : Nat32 = 0xC3D2E1F0;

    let msgLen = msg.size();
    let bitLen : Nat = msgLen * 8;

    // Padding: how many zero bytes after the 0x80 byte so total ≡ 56 mod 64
    let lenMod64 = (msgLen + 1) % 64;
    let zeroPad : Nat = if (lenMod64 <= 56) { 56 - lenMod64 } else { 120 - lenMod64 };
    let totalLen = msgLen + 1 + zeroPad + 8;

    let padded = Array.tabulate(
      totalLen,
      func(i : Nat) : Nat8 {
        if (i < msgLen) {
          msg[i]
        } else if (i == msgLen) {
          0x80
        } else if (i < msgLen + 1 + zeroPad) {
          0x00
        } else {
          // Big-endian 64-bit bit length
          let bytePos = i - (msgLen + 1 + zeroPad); // 0..7
          Nat8.fromNat((bitLen / natPow(256, 7 - bytePos)) % 256)
        }
      },
    );

    let numChunks = totalLen / 64;
    var chunk = 0;
    while (chunk < numChunks) {
      // Build schedule w[0..79]
      let w = Array.tabulate(80, func(_ : Nat) : Nat32 { 0 });
      let wm = w.toVarArray();

      var t = 0;
      while (t < 16) {
        let base = chunk * 64 + t * 4;
        let b0 = Nat32.fromNat(padded[base].toNat());
        let b1 = Nat32.fromNat(padded[base + 1].toNat());
        let b2 = Nat32.fromNat(padded[base + 2].toNat());
        let b3 = Nat32.fromNat(padded[base + 3].toNat());
        wm[t] := (b0 << 24) | (b1 << 16) | (b2 << 8) | b3;
        t += 1;
      };

      var i = 16;
      while (i < 80) {
        wm[i] := rotl(wm[i - 3] ^ wm[i - 8] ^ wm[i - 14] ^ wm[i - 16], 1);
        i += 1;
      };

      var a = h0;
      var b = h1;
      var c = h2;
      var d = h3;
      var e = h4;

      var j = 0;
      while (j < 80) {
        let (f, k) : (Nat32, Nat32) = if (j < 20) {
          ((b & c) | ((^ b) & d), 0x5A827999)
        } else if (j < 40) {
          (b ^ c ^ d, 0x6ED9EBA1)
        } else if (j < 60) {
          ((b & c) | (b & d) | (c & d), 0x8F1BBCDC)
        } else {
          (b ^ c ^ d, 0xCA62C1D6)
        };
        let temp = rotl(a, 5) +% f +% e +% k +% wm[j];
        e := d;
        d := c;
        c := rotl(b, 30);
        b := a;
        a := temp;
        j += 1;
      };

      h0 +%= a;
      h1 +%= b;
      h2 +%= c;
      h3 +%= d;
      h4 +%= e;

      chunk += 1;
    };

    // Produce 20-byte digest (big-endian)
    Array.tabulate<Nat8>(20, func(i : Nat) : Nat8 {
      let word : Nat32 = if (i < 4) { h0 }
        else if (i < 8) { h1 }
        else if (i < 12) { h2 }
        else if (i < 16) { h3 }
        else { h4 };
      let shift : Nat32 = Nat32.fromNat((3 - (i % 4)) * 8);
      Nat8.fromNat(((word >> shift) & 0xFF).toNat())
    });
  };

  // ── HMAC-SHA1 ─────────────────────────────────────────────────────────────

  /// Compute HMAC-SHA1(key, message).  Both inputs are byte arrays.
  public func hmacSha1(key : [Nat8], message : [Nat8]) : [Nat8] {
    let blockSize = 64;

    // If key longer than block size, hash it first
    let k : [Nat8] = if (key.size() > blockSize) { sha1(key) } else { key };

    // Pad key to block size
    let kPadded = Array.tabulate(blockSize, func(i : Nat) : Nat8 {
      if (i < k.size()) { k[i] } else { 0x00 }
    });

    // ipad XOR and opad XOR
    let iPad = Array.tabulate(blockSize, func(i : Nat) : Nat8 {
      kPadded[i] ^ 0x36
    });
    let oPad = Array.tabulate(blockSize, func(i : Nat) : Nat8 {
      kPadded[i] ^ 0x5C
    });

    // inner = SHA1(iPad || message)
    let inner = sha1(iPad.concat(message));

    // outer = SHA1(oPad || inner)
    sha1(oPad.concat(inner));
  };

  // ── Base64 encoding ───────────────────────────────────────────────────────

  private let b64Chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

  /// Base64-encode a byte array (standard, with padding).
  public func base64Encode(data : [Nat8]) : Text {
    let b64 = b64Chars.toArray();
    var result = "";
    let len = data.size();
    var i = 0;
    while (i < len) {
      let b0 = Nat32.fromNat(data[i].toNat());
      let b1 : Nat32 = if (i + 1 < len) { Nat32.fromNat(data[i + 1].toNat()) } else { 0 };
      let b2 : Nat32 = if (i + 2 < len) { Nat32.fromNat(data[i + 2].toNat()) } else { 0 };

      let idx0 = ((b0 >> 2) & 0x3F).toNat();
      let idx1 = (((b0 << 4) | (b1 >> 4)) & 0x3F).toNat();
      let idx2 = (((b1 << 2) | (b2 >> 6)) & 0x3F).toNat();
      let idx3 = (b2 & 0x3F).toNat();

      result := result # Text.fromChar(b64[idx0]) # Text.fromChar(b64[idx1]);
      if (i + 1 < len) {
        result := result # Text.fromChar(b64[idx2]);
      } else {
        result := result # "=";
      };
      if (i + 2 < len) {
        result := result # Text.fromChar(b64[idx3]);
      } else {
        result := result # "=";
      };
      i += 3;
    };
    result;
  };

  // ── Helpers ───────────────────────────────────────────────────────────────

  private func natPow(base : Nat, exp : Nat) : Nat {
    if (exp == 0) { 1 } else { base * natPow(base, exp - 1) }
  };

  /// Convert a Text to UTF-8 bytes (Nat8 array).
  public func textToBytes(t : Text) : [Nat8] {
    t.encodeUtf8().toArray()
  };
};
