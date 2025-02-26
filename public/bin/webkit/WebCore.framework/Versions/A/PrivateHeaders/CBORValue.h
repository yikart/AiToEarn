// Copyright 2017 The Chromium Authors. All rights reserved.
// Copyright (C) 2018-2021 Apple Inc. All rights reserved.
//
// Redistribution and use in source and binary forms, with or without
// modification, are permitted provided that the following conditions are
// met:
//
//    * Redistributions of source code must retain the above copyright
// notice, this list of conditions and the following disclaimer.
//    * Redistributions in binary form must reproduce the above
// copyright notice, this list of conditions and the following disclaimer
// in the documentation and/or other materials provided with the
// distribution.
//    * Neither the name of Google Inc. nor the names of its
// contributors may be used to endorse or promote products derived from
// this software without specific prior written permission.
//
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
// "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
// LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
// A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
// OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
// SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
// LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
// DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
// THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
// (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
// OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

#pragma once

#if ENABLE(WEB_AUTHN)

#include <stdint.h>
#include <wtf/Noncopyable.h>
#include <wtf/StdMap.h>
#include <wtf/Vector.h>
#include <wtf/text/WTFString.h>

namespace WebCore {
class BufferSource;
}

namespace cbor {

// A class for Concise Binary Object Representation (CBOR) values.
// This does not support:
//  * Floating-point numbers.
//  * Indefinite-length encodings.
class WEBCORE_EXPORT CBORValue {
    WTF_MAKE_NONCOPYABLE(CBORValue);
public:
    struct CTAPLess {
        // Comparison predicate to order keys in a dictionary as required by the
        // Client-to-Authenticator Protocol (CTAP) spec 2.0.
        //
        // The sort order defined in CTAP is:
        //   * If the major types are different, the one with the lower value in
        //     numerical order sorts earlier.
        //   * If two keys have different lengths, the shorter one sorts earlier.
        //   * If two keys have the same length, the one with the lower value in
        //     (byte-wise) lexical order sorts earlier.
        //
        // See section 6 of https://fidoalliance.org/specs/fido-v2.0-rd-20170927/
        // fido-client-to-authenticator-protocol-v2.0-rd-20170927.html.
        //
        // THE CTAP SORT ORDER IMPLEMENTED HERE DIFFERS FROM THE CANONICAL CBOR
        // ORDER defined in https://tools.ietf.org/html/rfc7049#section-3.9, in that
        // the latter sorts purely by serialised key and doesn't specify that major
        // types are compared first. Thus the shortest key sorts first by the RFC
        // rules (irrespective of the major type), but may not by CTAP rules.
        bool operator()(const CBORValue& a, const CBORValue& b) const
        {
            ASSERT((a.isInteger() || a.isString()) && (b.isInteger() || b.isString()));
            if (a.type() != b.type())
                return a.type() < b.type();
            switch (a.type()) {
            case Type::Unsigned:
                return a.getInteger() < b.getInteger();
            case Type::Negative:
                return a.getInteger() > b.getInteger();
            case Type::String: {
                const auto& aStr = a.getString();
                const size_t aLength = aStr.length();
                const auto& bStr = b.getString();
                const size_t bLength = bStr.length();

                if (aLength != bLength)
                    return aLength < bLength;
                return WTF::codePointCompareLessThan(aStr, bStr);
            }
            default:
                break;
            }

            ASSERT_NOT_REACHED();
            return false;
        }
    };

    using BinaryValue = Vector<uint8_t>;
    using ArrayValue = Vector<CBORValue>;
    using MapValue = StdMap<CBORValue, CBORValue, CTAPLess>;

    enum class Type {
        Unsigned = 0,
        Negative = 1,
        ByteString = 2,
        String = 3,
        Array = 4,
        Map = 5,
        SimpleValue = 7,
        None = -1,
    };

    enum class SimpleValue {
        FalseValue = 20,
        TrueValue = 21,
        NullValue = 22,
        Undefined = 23,
    };

    CBORValue(CBORValue&& that);
    CBORValue(); // A NONE value.

    explicit CBORValue(Type);
    explicit CBORValue(int);
    explicit CBORValue(int64_t);
    explicit CBORValue(uint64_t) = delete;

    explicit CBORValue(const BinaryValue&);
    explicit CBORValue(BinaryValue&&);

    explicit CBORValue(const WebCore::BufferSource&);

    explicit CBORValue(const char*);
    explicit CBORValue(ASCIILiteral);
    explicit CBORValue(String&&);
    explicit CBORValue(const String&);

    explicit CBORValue(const ArrayValue&);
    explicit CBORValue(ArrayValue&&);

    explicit CBORValue(const MapValue&);
    explicit CBORValue(MapValue&&);

    explicit CBORValue(SimpleValue);
    explicit CBORValue(bool);

    CBORValue& operator=(CBORValue&&);

    ~CBORValue();

    // CBORValue's copy constructor and copy assignment operator are deleted.
    // Use this to obtain a deep copy explicitly.
    CBORValue clone() const;

    // Returns the type of the value stored by the current Value object.
    Type type() const { return m_type; }

    // Returns true if the current object represents a given type.
    bool isType(Type type) const { return type == m_type; }
    bool isNone() const { return type() == Type::None; }
    bool isUnsigned() const { return type() == Type::Unsigned; }
    bool isNegative() const { return type() == Type::Negative; }
    bool isInteger() const { return isUnsigned() || isNegative(); }
    bool isByteString() const { return type() == Type::ByteString; }
    bool isString() const { return type() == Type::String; }
    bool isArray() const { return type() == Type::Array; }
    bool isMap() const { return type() == Type::Map; }
    bool isSimple() const { return type() == Type::SimpleValue; }
    bool isBool() const { return isSimple() && (m_simpleValue == SimpleValue::TrueValue || m_simpleValue == SimpleValue::FalseValue); }

    // FIXME(183535): Considering adding && getter for better performance.
    // These will all fatally assert if the type doesn't match.
    SimpleValue getSimpleValue() const;
    bool getBool() const;
    const int64_t& getInteger() const;
    const int64_t& getUnsigned() const;
    const int64_t& getNegative() const;
    const BinaryValue& getByteString() const;
    // Returned string may contain NUL characters.
    const String& getString() const;
    const ArrayValue& getArray() const;
    const MapValue& getMap() const;

private:
    Type m_type;

    union {
        SimpleValue m_simpleValue;
        int64_t m_integerValue;
        BinaryValue m_byteStringValue;
        String m_stringValue;
        ArrayValue m_arrayValue;
        MapValue m_mapValue;
    };

    void internalMoveConstructFrom(CBORValue&&);
    void internalCleanup();
};

} // namespace cbor

#endif // ENABLE(WEB_AUTHN)
