// Copyright 2017 The Chromium Authors. All rights reserved.
// Copyright (C) 2018-2023 Apple Inc. All rights reserved.
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

// Concise Binary Object Representation (CBOR) decoder as defined by
// https://tools.ietf.org/html/rfc7049. This decoder only accepts canonical
// CBOR as defined by section 3.9.
// Supported:
//  * Major types:
//     * 0: Unsigned integers, up to 64-bit.
//     * 2: Byte strings.
//     * 3: UTF-8 strings.
//     * 4: Definite-length arrays.
//     * 5: Definite-length maps.
//     * 7: Simple values.
//
// Requirements for canonical CBOR representation:
//  - Duplicate keys for map are not allowed.
//  - Keys for map must be sorted first by length and then by byte-wise
//    lexical order.
//
// Known limitations and interpretations of the RFC:
//  - Does not support negative integers, indefinite data streams and tagging.
//  - Floating point representations and BREAK stop code in major
//    type 7 are not supported.
//  - Non-character codepoint are not supported for Major type 3.
//  - Incomplete CBOR data items are treated as syntax errors.
//  - Trailing data bytes are treated as errors.
//  - Unknown additional information formats are treated as syntax errors.
//  - Callers can decode CBOR values with at most 16 nested depth layer. More
//    strict restrictions on nesting layer size of CBOR values can be enforced
//    by setting |maxNestingLevel|.
//  - Only CBOR maps with integer or string type keys are supported due to the
//    cost of serialization when sorting map keys.
//  - Simple values that are unassigned/reserved as per RFC 7049 are not
//    supported and treated as errors.

namespace cbor {

class CBORReader {
    WTF_MAKE_NONCOPYABLE(CBORReader);
public:
    using Bytes = std::span<const uint8_t>;

    enum class DecoderError {
        CBORNoError = 0,
        UnsupportedMajorType,
        UnknownAdditionalInfo,
        IncompleteCBORData,
        IncorrectMapKeyType,
        TooMuchNesting,
        InvalidUTF8,
        ExtraneousData,
        DuplicateKey,
        OutOfOrderKey,
        NonMinimalCBOREncoding,
        UnsupportedSimpleValue,
        UnsupportedFloatingPointValue,
        OutOfRangeIntegerValue,
    };

    // CBOR nested depth sufficient for most use cases.
    static const int kCBORMaxDepth = 16;

    ~CBORReader();

    // Reads and parses |input_data| into a CBORValue. If any one of the syntax
    // formats is violated -including unknown additional info and incomplete
    // CBOR data- then an empty optional is returned. Optional |errorCodeOut|
    // can be provided by the caller to obtain additional information about
    // decoding failures.
    WEBCORE_EXPORT static std::optional<CBORValue> read(const Bytes&, DecoderError* errorCodeOut = nullptr, int maxNestingLevel = kCBORMaxDepth);

    // Translates errors to human-readable error messages.
    static ASCIILiteral errorCodeToString(DecoderError errorCode);

private:
    explicit CBORReader(const Bytes&);
    std::optional<CBORValue> decodeCBOR(int maxNestingLevel);
    std::optional<CBORValue> decodeValueToNegative(uint64_t value);
    std::optional<CBORValue> decodeValueToUnsigned(uint64_t value);
    std::optional<CBORValue> readSimpleValue(uint8_t additionalInfo, uint64_t value);
    bool readVariadicLengthInteger(uint8_t additionalInfo, uint64_t* value);
    std::optional<CBORValue> readBytes(uint64_t numBytes);
    std::optional<CBORValue> readString(uint64_t numBytes);
    std::optional<CBORValue> readCBORArray(uint64_t length, int maxNestingLevel);
    std::optional<CBORValue> readCBORMap(uint64_t length, int maxNestingLevel);
    bool canConsume(uint64_t bytes);
    void checkExtraneousData();
    bool checkDuplicateKey(const CBORValue& newKey, const CBORValue::MapValue&);
    bool hasValidUTF8Format(const String&);
    bool checkOutOfOrderKey(const CBORValue& newKey, const CBORValue::MapValue&);
    bool checkMinimalEncoding(uint8_t additionalBytes, uint64_t uintData);

    DecoderError getErrorCode();

    const Bytes& m_data;
    Bytes::iterator m_it;
    DecoderError m_errorCode;
};

} // namespace cbor

#endif // ENABLE(WEB_AUTHN)
