/*
 * Copyright (C) 2014 Apple Inc. All rights reserved.
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

#include "ProtectionSpaceBase.h"
#include <wtf/RetainPtr.h>

OBJC_CLASS NSURLProtectionSpace;

namespace WebCore {

class ProtectionSpace : public ProtectionSpaceBase {
public:
    struct PlatformData {
        RetainPtr<NSURLProtectionSpace> nsSpace;
    };

    ProtectionSpace() : ProtectionSpaceBase() { }
    WEBCORE_EXPORT ProtectionSpace(const String& host, int port, ServerType, const String& realm, AuthenticationScheme, std::optional<PlatformData> = std::nullopt);
    ProtectionSpace(WTF::HashTableDeletedValueType deletedValue) : ProtectionSpaceBase(deletedValue) { }

    WEBCORE_EXPORT explicit ProtectionSpace(NSURLProtectionSpace *);

    static bool platformCompare(const ProtectionSpace& a, const ProtectionSpace& b);

    bool encodingRequiresPlatformData() const { return m_nsSpace && encodingRequiresPlatformData(m_nsSpace.get()); }

    WEBCORE_EXPORT bool receivesCredentialSecurely() const;
    WEBCORE_EXPORT NSURLProtectionSpace *nsSpace() const;
    
    WEBCORE_EXPORT std::optional<PlatformData> getPlatformDataToSerialize() const;

private:
    WEBCORE_EXPORT static bool encodingRequiresPlatformData(NSURLProtectionSpace *);

    mutable RetainPtr<NSURLProtectionSpace> m_nsSpace;
};

} // namespace WebCore
