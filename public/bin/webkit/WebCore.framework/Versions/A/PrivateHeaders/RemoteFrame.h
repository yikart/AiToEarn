/*
 * Copyright (C) 2018 Apple Inc. All rights reserved.
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

#include "Frame.h"
#include "LayerHostingContextIdentifier.h"
#include <wtf/RefPtr.h>
#include <wtf/TypeCasts.h>
#include <wtf/UniqueRef.h>

namespace WebCore {

class IntPoint;
class RemoteDOMWindow;
class RemoteFrameClient;
class RemoteFrameView;
class WeakPtrImplWithEventTargetData;

enum class AdvancedPrivacyProtections : uint16_t;
enum class RenderAsTextFlag : uint16_t;

class RemoteFrame final : public Frame {
public:
    using ClientCreator = CompletionHandler<UniqueRef<RemoteFrameClient>(RemoteFrame&)>;
    WEBCORE_EXPORT static Ref<RemoteFrame> createMainFrame(Page&, ClientCreator&&, FrameIdentifier, Frame* opener);
    WEBCORE_EXPORT static Ref<RemoteFrame> createSubframe(Page&, ClientCreator&&, FrameIdentifier, Frame& parent, Frame* opener);
    WEBCORE_EXPORT static Ref<RemoteFrame> createSubframeWithContentsInAnotherProcess(Page&, ClientCreator&&, FrameIdentifier, HTMLFrameOwnerElement&, std::optional<LayerHostingContextIdentifier>);
    ~RemoteFrame();

    RemoteDOMWindow& window() const;

    const RemoteFrameClient& client() const { return m_client.get(); }
    RemoteFrameClient& client() { return m_client.get(); }

    RemoteFrameView* view() const { return m_view.get(); }
    WEBCORE_EXPORT void setView(RefPtr<RemoteFrameView>&&);

    Markable<LayerHostingContextIdentifier> layerHostingContextIdentifier() const { return m_layerHostingContextIdentifier; }

    String renderTreeAsText(size_t baseIndent, OptionSet<RenderAsTextFlag>);
    void bindRemoteAccessibilityFrames(int processIdentifier, Vector<uint8_t>&&, CompletionHandler<void(Vector<uint8_t>, int)>&&);
    void updateRemoteFrameAccessibilityOffset(IntPoint);
    void unbindRemoteAccessibilityFrames(int);

    void setCustomUserAgent(const String& customUserAgent) { m_customUserAgent = customUserAgent; }
    String customUserAgent() const final;
    void setCustomUserAgentAsSiteSpecificQuirks(const String& customUserAgentAsSiteSpecificQuirks) { m_customUserAgentAsSiteSpecificQuirks = customUserAgentAsSiteSpecificQuirks; }
    String customUserAgentAsSiteSpecificQuirks() const final;

    void setCustomNavigatorPlatform(const String& customNavigatorPlatform) { m_customNavigatorPlatform = customNavigatorPlatform; }
    String customNavigatorPlatform() const final;

    void setAdvancedPrivacyProtections(OptionSet<AdvancedPrivacyProtections> advancedPrivacyProtections) { m_advancedPrivacyProtections = advancedPrivacyProtections; }
    OptionSet<AdvancedPrivacyProtections> advancedPrivacyProtections() const final;

    void updateScrollingMode() final;

private:
    WEBCORE_EXPORT explicit RemoteFrame(Page&, ClientCreator&&, FrameIdentifier, HTMLFrameOwnerElement*, Frame* parent, Markable<LayerHostingContextIdentifier>, Frame* opener);

    void frameDetached() final;
    bool preventsParentFromBeingComplete() const final;
    void changeLocation(FrameLoadRequest&&) final;
    void didFinishLoadInAnotherProcess() final;
    bool isRootFrame() const final { return false; }
    void documentURLForConsoleLog(CompletionHandler<void(const URL&)>&&) final;

    FrameView* virtualView() const final;
    void disconnectView() final;
    DOMWindow* virtualWindow() const final;
    FrameLoaderClient& loaderClient() final;
    void reinitializeDocumentSecurityContext() final { }

    Ref<RemoteDOMWindow> m_window;
    RefPtr<RemoteFrameView> m_view;
    UniqueRef<RemoteFrameClient> m_client;
    Markable<LayerHostingContextIdentifier> m_layerHostingContextIdentifier;
    String m_customUserAgent;
    String m_customUserAgentAsSiteSpecificQuirks;
    String m_customNavigatorPlatform;
    OptionSet<AdvancedPrivacyProtections> m_advancedPrivacyProtections;
    bool m_preventsParentFromBeingComplete { true };
};

} // namespace WebCore

SPECIALIZE_TYPE_TRAITS_BEGIN(WebCore::RemoteFrame)
static bool isType(const WebCore::Frame& frame) { return frame.frameType() == WebCore::Frame::FrameType::Remote; }
SPECIALIZE_TYPE_TRAITS_END()
