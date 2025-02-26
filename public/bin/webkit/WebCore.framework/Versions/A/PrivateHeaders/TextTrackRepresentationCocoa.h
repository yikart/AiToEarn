/*
 * Copyright (C) 2012-2023 Apple Inc. All rights reserved.
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

#if (PLATFORM(IOS_FAMILY) || (PLATFORM(MAC) && ENABLE(VIDEO_PRESENTATION_MODE))) && ENABLE(VIDEO)

#include "TextTrackRepresentation.h"
#include <QuartzCore/CALayer.h>
#include <wtf/RetainPtr.h>
#include <wtf/TZoneMalloc.h>
#include <wtf/WeakPtr.h>

namespace WebCore {
class TextTrackRepresentationCocoa;
}

namespace WTF {
template<typename T> struct IsDeprecatedWeakRefSmartPointerException;
template<> struct IsDeprecatedWeakRefSmartPointerException<WebCore::TextTrackRepresentationCocoa> : std::true_type { };
}

@class WebCoreTextTrackRepresentationCocoaHelper;

namespace WebCore {

class HTMLMediaElement;

class TextTrackRepresentationCocoa : public TextTrackRepresentation, public CanMakeWeakPtr<TextTrackRepresentationCocoa, WeakPtrFactoryInitialization::Eager> {
    WTF_MAKE_TZONE_ALLOCATED_EXPORT(TextTrackRepresentationCocoa, WEBCORE_EXPORT);
public:
    WEBCORE_EXPORT explicit TextTrackRepresentationCocoa(TextTrackRepresentationClient&);
    WEBCORE_EXPORT virtual ~TextTrackRepresentationCocoa();

    TextTrackRepresentationClient& client() const { return m_client; }

    PlatformLayer* platformLayer() final { return m_layer.get(); }

    WEBCORE_EXPORT void setBounds(const IntRect&) override;
    WEBCORE_EXPORT IntRect bounds() const override;
    void boundsChanged();

    using TextTrackRepresentationFactory = WTF::Function<std::unique_ptr<TextTrackRepresentation>(TextTrackRepresentationClient&, HTMLMediaElement&)>;

    WEBCORE_EXPORT static TextTrackRepresentationFactory& representationFactory();

protected:
    // TextTrackRepresentation
    WEBCORE_EXPORT void update() override;
    WEBCORE_EXPORT void setContentScale(float) override;
    WEBCORE_EXPORT void setHidden(bool) const override;

    TextTrackRepresentationClient& m_client;

private:
    RetainPtr<CALayer> m_layer;
    RetainPtr<WebCoreTextTrackRepresentationCocoaHelper> m_delegate;
};

}

#endif // (PLATFORM(IOS_FAMILY) || (PLATFORM(MAC) && ENABLE(VIDEO_PRESENTATION_MODE))) && ENABLE(VIDEO)
