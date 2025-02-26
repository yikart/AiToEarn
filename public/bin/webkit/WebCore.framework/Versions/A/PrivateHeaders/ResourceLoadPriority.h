/*
 * Copyright (C) 2010 Apple Inc. All rights reserved.
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

#include <wtf/EnumTraits.h>

namespace WebCore {

enum class ResourceLoadPriority : uint8_t {
    VeryLow,
    Low,
    Medium,
    High,
    VeryHigh,
    Lowest = VeryLow,
    Highest = VeryHigh,
};
static constexpr unsigned bitWidthOfResourceLoadPriority = 3;
static_assert(static_cast<unsigned>(ResourceLoadPriority::Highest) <= ((1U << bitWidthOfResourceLoadPriority) - 1));

static const unsigned resourceLoadPriorityCount { static_cast<unsigned>(ResourceLoadPriority::Highest) + 1 };

inline ResourceLoadPriority& operator++(ResourceLoadPriority& priority)
{
    ASSERT(priority != ResourceLoadPriority::Highest);
    return priority = static_cast<ResourceLoadPriority>(static_cast<int>(priority) + 1);
}

inline ResourceLoadPriority& operator--(ResourceLoadPriority& priority)
{
    ASSERT(priority != ResourceLoadPriority::Lowest);
    return priority = static_cast<ResourceLoadPriority>(static_cast<int>(priority) - 1);
}

} // namespace WebCore

namespace WTF {

template<> struct EnumTraitsForPersistence<WebCore::ResourceLoadPriority> {
    using values = EnumValues<
        WebCore::ResourceLoadPriority,
        WebCore::ResourceLoadPriority::VeryLow,
        WebCore::ResourceLoadPriority::Low,
        WebCore::ResourceLoadPriority::Medium,
        WebCore::ResourceLoadPriority::High,
        WebCore::ResourceLoadPriority::VeryHigh
    >;
};

} // namespace WTF
