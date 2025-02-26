/*
 * Copyright (C) 2017-2019 Apple Inc. All rights reserved.
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

#if ENABLE(PREVIEW_CONVERTER)

#include "ResourceError.h"
#include "ResourceResponse.h"
#include "SharedBuffer.h"
#include <wtf/RefCounted.h>
#include <wtf/RetainPtr.h>
#include <wtf/TZoneMalloc.h>
#include <wtf/WeakPtr.h>
#include <wtf/text/WTFString.h>

OBJC_CLASS QLPreviewConverter;
OBJC_CLASS WebPreviewConverterDelegate;

namespace WebCore {
struct PreviewPlatformDelegate;
}

namespace WTF {
template<typename T> struct IsDeprecatedWeakRefSmartPointerException;
template<> struct IsDeprecatedWeakRefSmartPointerException<WebCore::PreviewPlatformDelegate> : std::true_type { };
}

namespace WebCore {

class ResourceError;
class ResourceRequest;
struct PreviewConverterClient;
struct PreviewConverterProvider;

struct PreviewPlatformDelegate : CanMakeWeakPtr<PreviewPlatformDelegate> {
    virtual ~PreviewPlatformDelegate() = default;

    virtual void delegateDidReceiveData(const FragmentedSharedBuffer&) = 0;
    virtual void delegateDidFinishLoading() = 0;
    virtual void delegateDidFailWithError(const ResourceError&) = 0;
};

class PreviewConverter final : private PreviewPlatformDelegate, public RefCounted<PreviewConverter> {
    WTF_MAKE_TZONE_ALLOCATED(PreviewConverter);
    WTF_MAKE_NONCOPYABLE(PreviewConverter);
public:
    static Ref<PreviewConverter> create(const ResourceResponse& response, PreviewConverterProvider& provider)
    {
        return adoptRef(*new PreviewConverter(response, provider));
    }

    WEBCORE_EXPORT static bool supportsMIMEType(const String& mimeType);

    ~PreviewConverter();

    ResourceRequest safeRequest(const ResourceRequest&) const;
    ResourceResponse previewResponse() const;
    WEBCORE_EXPORT String previewFileName() const;
    WEBCORE_EXPORT String previewUTI() const;
    const ResourceError& previewError() const;
    const FragmentedSharedBuffer& previewData() const;

    void failedUpdating();
    void finishUpdating();
    void updateMainResource();

    bool hasClient(PreviewConverterClient&) const;
    void addClient(PreviewConverterClient&);
    void removeClient(PreviewConverterClient&);

    WEBCORE_EXPORT static const String& passwordForTesting();
    WEBCORE_EXPORT static void setPasswordForTesting(const String&);

private:
    static HashSet<String, ASCIICaseInsensitiveHash> platformSupportedMIMETypes();

    PreviewConverter(const ResourceResponse&, PreviewConverterProvider&);

    ResourceResponse platformPreviewResponse() const;
    bool isPlatformPasswordError(const ResourceError&) const;

    template<typename T> void iterateClients(T&& callback);
    void appendFromBuffer(const FragmentedSharedBuffer&);
    void didAddClient(PreviewConverterClient&);
    void didFailConvertingWithError(const ResourceError&);
    void didFailUpdating();
    void replayToClient(PreviewConverterClient&);

    void platformAppend(const SharedBufferDataView&);
    void platformFailedAppending();
    void platformFinishedAppending();
    void platformUnlockWithPassword(const String&);

    // PreviewPlatformDelegate
    void delegateDidReceiveData(const FragmentedSharedBuffer&) final;
    void delegateDidFinishLoading() final;
    void delegateDidFailWithError(const ResourceError&) final;

    enum class State : uint8_t {
        Updating,
        FailedUpdating,
        Converting,
        FailedConverting,
        FinishedConverting,
    };

    SharedBufferBuilder m_previewData;
    ResourceError m_previewError;
    ResourceResponse m_originalResponse;
    State m_state { State::Updating };
    Vector<WeakPtr<PreviewConverterClient>, 1> m_clients;
    WeakPtr<PreviewConverterProvider> m_provider;
    bool m_isInClientCallback { false };
    size_t m_lengthAppended { 0 };

#if USE(QUICK_LOOK)
    RetainPtr<WebPreviewConverterDelegate> m_platformDelegate;
    RetainPtr<QLPreviewConverter> m_platformConverter;
#endif
};

} // namespace WebCore

#endif // ENABLE(PREVIEW_CONVERTER)
