/*
 * Copyright (C) 2015 Apple Inc. All rights reserved.
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

#if ENABLE(CONTENT_EXTENSIONS)

#include "CachedResource.h"
#include <wtf/OptionSet.h>
#include <wtf/URL.h>

namespace WebCore::ContentExtensions {

enum class ActionCondition : uint32_t {
    None = 0x00000,
    IfTopURL = 0x20000,
    UnlessTopURL = 0x40000,
    IfFrameURL = 0x60000,
    UnlessFrameURL = 0x80000
};
static constexpr uint32_t ActionConditionMask = 0xE0000;

enum class ResourceType : uint32_t {
    Document = 0x0001,
    Image = 0x0002,
    StyleSheet = 0x0004,
    Script = 0x0008,
    Font = 0x0010,
    SVGDocument = 0x0020,
    Media = 0x0040,
    Popup = 0x0080,
    Ping = 0x0100,
    Fetch = 0x0200,
    WebSocket = 0x0400,
    Other = 0x0800,
    CSPReport = 0x10000,
};
static constexpr uint32_t ResourceTypeMask = 0x10FFF;

enum class LoadType : uint32_t {
    FirstParty = 0x1000,
    ThirdParty = 0x2000,
};
static constexpr uint32_t LoadTypeMask = 0x3000;

enum class LoadContext : uint32_t {
    TopFrame = 0x4000,
    ChildFrame = 0x8000,
};
static constexpr uint32_t LoadContextMask = 0xC000;

using ResourceFlags = uint32_t;

constexpr ResourceFlags AllResourceFlags = LoadTypeMask | ResourceTypeMask | LoadContextMask | ActionConditionMask;

// The first 32 bits of a uint64_t action are used for the action location.
// The next 20 bits are used for the flags (ResourceType, LoadType, LoadContext, ActionCondition).
// The values -1 and -2 are used for removed and empty values in HashTables.
static constexpr uint64_t ActionFlagMask = 0x000FFFFF00000000;

OptionSet<ResourceType> toResourceType(CachedResource::Type, ResourceRequestRequester);
std::optional<OptionSet<ResourceType>> readResourceType(StringView);
std::optional<OptionSet<LoadType>> readLoadType(StringView);
std::optional<OptionSet<LoadContext>> readLoadContext(StringView);

struct ResourceLoadInfo {
    URL resourceURL;
    URL mainDocumentURL;
    URL frameURL;
    OptionSet<ResourceType> type;
    bool mainFrameContext { false };

    bool isThirdParty() const;
    ResourceFlags getResourceFlags() const;
    ResourceLoadInfo isolatedCopy() const & { return { resourceURL.isolatedCopy(), mainDocumentURL.isolatedCopy(), frameURL.isolatedCopy(), type, mainFrameContext }; }
    ResourceLoadInfo isolatedCopy() && { return { WTFMove(resourceURL).isolatedCopy(), WTFMove(mainDocumentURL).isolatedCopy(), WTFMove(frameURL).isolatedCopy(), type, mainFrameContext }; }
};

} // namespace WebCore::ContentExtensions

#endif
