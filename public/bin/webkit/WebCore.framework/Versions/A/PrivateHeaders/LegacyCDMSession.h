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

#if ENABLE(LEGACY_ENCRYPTED_MEDIA)

#include <JavaScriptCore/Forward.h>
#include <wtf/AbstractRefCounted.h>
#include <wtf/Forward.h>
#include <wtf/TZoneMallocInlines.h>
#include <wtf/WeakPtr.h>

namespace WebCore {
class LegacyCDMSessionClient;
}

namespace WTF {
template<typename T> struct IsDeprecatedWeakRefSmartPointerException;
template<> struct IsDeprecatedWeakRefSmartPointerException<WebCore::LegacyCDMSessionClient> : std::true_type { };
}

namespace WebCore {

class LegacyCDMSessionClient : public CanMakeWeakPtr<LegacyCDMSessionClient> {
    WTF_MAKE_TZONE_ALLOCATED_INLINE(LegacyCDMSessionClient);
public:
    virtual ~LegacyCDMSessionClient() = default;
    virtual void sendMessage(Uint8Array*, String destinationURL) = 0;

    enum : uint8_t {
        MediaKeyErrorUnknown = 1,
        MediaKeyErrorClient,
        MediaKeyErrorService,
        MediaKeyErrorOutput,
        MediaKeyErrorHardwareChange,
        MediaKeyErrorDomain,
    };
    typedef unsigned short MediaKeyErrorCode;
    virtual void sendError(MediaKeyErrorCode, uint32_t systemCode) = 0;

    virtual String mediaKeysStorageDirectory() const = 0;

#if !RELEASE_LOG_DISABLED
    virtual const Logger& logger() const = 0;
    virtual uint64_t logIdentifier() const = 0;
#endif
};

enum LegacyCDMSessionType {
    CDMSessionTypeUnknown,
    CDMSessionTypeClearKey,
    CDMSessionTypeAVFoundationObjC,
    CDMSessionTypeAVContentKeySession,
    CDMSessionTypeRemote,
};

class WEBCORE_EXPORT LegacyCDMSession : public AbstractRefCounted {
public:
    virtual ~LegacyCDMSession() = default;
    virtual void invalidate() { }

    virtual LegacyCDMSessionType type() { return CDMSessionTypeUnknown; }
    virtual const String& sessionId() const = 0;
    virtual RefPtr<Uint8Array> generateKeyRequest(const String& mimeType, Uint8Array* initData, String& destinationURL, unsigned short& errorCode, uint32_t& systemCode) = 0;
    virtual void releaseKeys() = 0;
    virtual bool update(Uint8Array*, RefPtr<Uint8Array>& nextMessage, unsigned short& errorCode, uint32_t& systemCode) = 0;
    virtual RefPtr<ArrayBuffer> cachedKeyForKeyID(const String&) const = 0;
};

}

#endif // ENABLE(LEGACY_ENCRYPTED_MEDIA)
