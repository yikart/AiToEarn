/*
 * Copyright (C) 2017 Apple Inc. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 * 1. Redistributions of source code must retain the above copyright
 *    notice, this list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright
 *    notice, this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY APPLE INC. AND ITS CONTRIBUTORS ``AS IS''
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO,
 * THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL APPLE INC. OR ITS CONTRIBUTORS
 * BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF
 * THE POSSIBILITY OF SUCH DAMAGE.
 */

#pragma once

#include <type_traits>
#include <wtf/HashTraits.h>
#include <wtf/Hasher.h>
#include <wtf/Vector.h>
#include <wtf/text/WTFString.h>

namespace WebCore {

class CachedResource;
class FragmentedSharedBuffer;

struct ResourceCryptographicDigest {
    static constexpr unsigned algorithmCount = 3;
    enum class Algorithm : uint8_t {
        SHA256 = 1 << 0,
        SHA384 = 1 << 1,
        SHA512 = 1 << (algorithmCount - 1),
    };

    // Number of bytes to hold SHA-512 digest
    static constexpr size_t maximumDigestLength = 64;

    Algorithm algorithm;
    Vector<uint8_t> value;

    friend bool operator==(const ResourceCryptographicDigest&, const ResourceCryptographicDigest&) = default;
};

inline void add(Hasher& hasher, const ResourceCryptographicDigest& digest)
{
    add(hasher, digest.algorithm, digest.value);
}

struct EncodedResourceCryptographicDigest {
    using Algorithm = ResourceCryptographicDigest::Algorithm;
    
    Algorithm algorithm;
    String digest;
};

std::optional<ResourceCryptographicDigest> parseCryptographicDigest(StringParsingBuffer<UChar>&);
std::optional<ResourceCryptographicDigest> parseCryptographicDigest(StringParsingBuffer<LChar>&);

std::optional<EncodedResourceCryptographicDigest> parseEncodedCryptographicDigest(StringParsingBuffer<UChar>&);
std::optional<EncodedResourceCryptographicDigest> parseEncodedCryptographicDigest(StringParsingBuffer<LChar>&);

std::optional<ResourceCryptographicDigest> decodeEncodedResourceCryptographicDigest(const EncodedResourceCryptographicDigest&);

ResourceCryptographicDigest cryptographicDigestForSharedBuffer(ResourceCryptographicDigest::Algorithm, const FragmentedSharedBuffer*);
ResourceCryptographicDigest cryptographicDigestForBytes(ResourceCryptographicDigest::Algorithm, std::span<const uint8_t> bytes);

}

namespace WTF {

template<> struct DefaultHash<WebCore::ResourceCryptographicDigest> {
    static unsigned hash(const WebCore::ResourceCryptographicDigest& digest)
    {
        return computeHash(digest);
    }
    static bool equal(const WebCore::ResourceCryptographicDigest& a, const WebCore::ResourceCryptographicDigest& b)
    {
        return a == b;
    }
    static const bool safeToCompareToEmptyOrDeleted = true;
};

template<> struct HashTraits<WebCore::ResourceCryptographicDigest> : GenericHashTraits<WebCore::ResourceCryptographicDigest> {
    using Algorithm = WebCore::ResourceCryptographicDigest::Algorithm;
    using AlgorithmUnderlyingType = typename std::underlying_type<Algorithm>::type;
    static constexpr auto emptyAlgorithmValue = static_cast<Algorithm>(std::numeric_limits<AlgorithmUnderlyingType>::max());
    static constexpr auto deletedAlgorithmValue = static_cast<Algorithm>(std::numeric_limits<AlgorithmUnderlyingType>::max() - 1);

    static const bool emptyValueIsZero = false;

    static WebCore::ResourceCryptographicDigest emptyValue()
    {
        return { emptyAlgorithmValue, { } };
    }

    static bool isEmptyValue(const WebCore::ResourceCryptographicDigest& value) { return value.algorithm == emptyAlgorithmValue; }

    static void constructDeletedValue(WebCore::ResourceCryptographicDigest& slot)
    {
        slot.algorithm = deletedAlgorithmValue;
    }

    static bool isDeletedValue(const WebCore::ResourceCryptographicDigest& slot)
    {
        return slot.algorithm == deletedAlgorithmValue;
    }
};

}
