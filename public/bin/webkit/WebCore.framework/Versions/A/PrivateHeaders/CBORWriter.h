// Copyright 2017 The Chromium Authors. All rights reserved.
// Copyright (C) 2018 Apple Inc. All rights reserved.
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

#include "CBORValue.h"
#include <stddef.h>

// A basic Concise Binary Object Representation (CBOR) encoder as defined by
// https://tools.ietf.org/html/rfc7049. This is a generic encoder that supplies
// canonical, well-formed CBOR values but does not guarantee their validity
// (see https://tools.ietf.org/html/rfc7049#section-3.2).
// Supported:
//  * Major types:
//     * 0: Unsigned integers, up to INT64_MAX.
//     * 1: Negative integers, to INT64_MIN.
//     * 2: Byte strings.
//     * 3: UTF-8 strings.
//     * 4: Arrays, with the number of elements known at the start.
//     * 5: Maps, with the number of elements known at the start
//              of the container.
//     * 7: Simple values.
//
// Unsupported:
//  * Floating-point numbers.
//  * Indefinite-length encodings.
//  * Parsing.
//
// Requirements for canonical CBOR as suggested by RFC 7049 are:
//  1) All major data types for the CBOR values must be as short as possible.
//      * Unsigned integer between 0 to 23 must be expressed in same byte as
//            the major type.
//      * 24 to 255 must be expressed only with an additional uint8_t.
//      * 256 to 65535 must be expressed only with an additional uint16_t.
//      * 65536 to 4294967295 must be expressed only with an additional
//            uint32_t. * The rules for expression of length in major types
//            2 to 5 follow the above rule for integers.
//  2) Keys in every map must be sorted (first by major type, then by key
//         length, then by value in byte-wise lexical order).
//  3) Indefinite length items must be converted to definite length items.
//  4) All maps must not have duplicate keys.
//
// Current implementation of CBORWriter encoder meets all the requirements of
// canonical CBOR.

namespace cbor {

class CBORWriter {
    WTF_MAKE_NONCOPYABLE(CBORWriter);
public:
    // Default that should be sufficiently large for most use cases.
    static constexpr size_t kDefaultMaxNestingDepth = 16;

    ~CBORWriter();

    // Returns the CBOR byte string representation of |node|, unless its nesting
    // depth is greater than |max_nesting_depth|, in which case an empty optional
    // value is returned. The nesting depth of |node| is defined as the number of
    // arrays/maps that has to be traversed to reach the most nested CBORValue
    // contained in |node|. Primitive values and empty containers have nesting
    // depths of 0.
    WEBCORE_EXPORT static std::optional<Vector<uint8_t>> write(const CBORValue&, size_t maxNestingLevel = kDefaultMaxNestingDepth);

private:
    explicit CBORWriter(Vector<uint8_t>*);

    // Called recursively to build the CBOR bytestring. When completed,
    // |m_encodedCBOR| will contain the CBOR.
    bool encodeCBOR(const CBORValue&, int maxNestingLevel);

    // Encodes the type and size of the data being added.
    void startItem(CBORValue::Type, uint64_t size);

    // Encodes the additional information for the data.
    void setAdditionalInformation(uint8_t);

    // Encodes an unsigned integer value. This is used to both write
    // unsigned integers and to encode the lengths of other major types.
    void setUint(uint64_t value);

    // Get the number of bytes needed to store the unsigned integer.
    size_t getNumUintBytes(uint64_t value);

    // Holds the encoded CBOR data.
    Vector<uint8_t>* m_encodedCBOR;
};

} // namespace cbor

#endif // ENABLE(WEB_AUTHN)
