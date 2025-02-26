/*
 * Copyright (C) 2011 Google Inc. All rights reserved.
 * Copyright (C) 2015 Apple Inc. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are
 * met:
 *
 *     * Redistributions of source code must retain the above copyright
 * notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above
 * copyright notice, this list of conditions and the following disclaimer
 * in the documentation and/or other materials provided with the
 * distribution.
 *     * Neither the name of Google Inc. nor the names of its
 * contributors may be used to endorse or promote products derived from
 * this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

#pragma once

#include "InspectorOverlay.h"
#include <JavaScriptCore/InspectorAgentRegistry.h>
#include <JavaScriptCore/InspectorEnvironment.h>
#include <wtf/Forward.h>
#include <wtf/Noncopyable.h>
#include <wtf/TZoneMalloc.h>
#include <wtf/WeakRef.h>
#include <wtf/text/WTFString.h>

namespace Inspector {
class BackendDispatcher;
class FrontendChannel;
class FrontendRouter;
class InspectorAgent;
}

namespace WebCore {

class DOMWrapperWorld;
class GraphicsContext;
class InspectorClient;
class InspectorDOMAgent;
class InspectorFrontendClient;
class InspectorInstrumentation;
class InspectorPageAgent;
class InstrumentingAgents;
class LocalFrame;
class Node;
class Page;
class PageDebugger;
class WebInjectedScriptManager;
struct PageAgentContext;

class InspectorController final : public Inspector::InspectorEnvironment, public CanMakeWeakPtr<InspectorController> {
    WTF_MAKE_NONCOPYABLE(InspectorController);
    WTF_MAKE_TZONE_ALLOCATED(InspectorController);
public:
    InspectorController(Page&, std::unique_ptr<InspectorClient>&&);
    ~InspectorController() override;

    WEBCORE_EXPORT void ref() const;
    WEBCORE_EXPORT void deref() const;

    void inspectedPageDestroyed();

    WEBCORE_EXPORT bool enabled() const;
    Page& inspectedPage() const;

    WEBCORE_EXPORT void show();

    WEBCORE_EXPORT void setInspectorFrontendClient(InspectorFrontendClient*);
    unsigned inspectionLevel() const;
    void didClearWindowObjectInWorld(LocalFrame&, DOMWrapperWorld&);

    WEBCORE_EXPORT void dispatchMessageFromFrontend(const String& message);

    bool hasLocalFrontend() const;
    bool hasRemoteFrontend() const;

    WEBCORE_EXPORT void connectFrontend(Inspector::FrontendChannel&, bool isAutomaticInspection = false, bool immediatelyPause = false);
    WEBCORE_EXPORT void disconnectFrontend(Inspector::FrontendChannel&);
    WEBCORE_EXPORT void disconnectAllFrontends();

    void inspect(Node*);
    WEBCORE_EXPORT bool shouldShowOverlay() const;
    WEBCORE_EXPORT void drawHighlight(GraphicsContext&) const;
    WEBCORE_EXPORT void getHighlight(InspectorOverlay::Highlight&, InspectorOverlay::CoordinateSystem) const;
    void hideHighlight();
    Node* highlightedNode() const;

    WEBCORE_EXPORT void setIndicating(bool);

    WEBCORE_EXPORT void willComposite(LocalFrame&);
    WEBCORE_EXPORT void didComposite(LocalFrame&);

    enum class PauseCondition { DONT_PAUSE, WHEN_SHOWN, WHEN_CREATION_FINISHED };
    WEBCORE_EXPORT void pauseOnStart(PauseCondition);
    WEBCORE_EXPORT void resumeIfPausedInNewWindow();
    WEBCORE_EXPORT void didShowPage();
    WEBCORE_EXPORT void didFinishPageCreation();

    // Testing support.
    bool isUnderTest() const { return m_isUnderTest; }
    void setIsUnderTest(bool isUnderTest) { m_isUnderTest = isUnderTest; }
    WEBCORE_EXPORT void evaluateForTestInFrontend(const String& script);
    WEBCORE_EXPORT unsigned gridOverlayCount() const;
    WEBCORE_EXPORT unsigned flexOverlayCount() const;
    WEBCORE_EXPORT unsigned paintRectCount() const;

    InspectorClient* inspectorClient() const { return m_inspectorClient.get(); }
    InspectorFrontendClient* inspectorFrontendClient() const { return m_inspectorFrontendClient; }

    Inspector::InspectorAgent& ensureInspectorAgent();
    InspectorDOMAgent& ensureDOMAgent();
    WEBCORE_EXPORT InspectorPageAgent& ensurePageAgent();

    // InspectorEnvironment
    bool developerExtrasEnabled() const override;
    bool canAccessInspectedScriptState(JSC::JSGlobalObject*) const override;
    Inspector::InspectorFunctionCallHandler functionCallHandler() const override;
    Inspector::InspectorEvaluateHandler evaluateHandler() const override;
    void frontendInitialized() override;
    WTF::Stopwatch& executionStopwatch() const final;
    JSC::Debugger* debugger() override;
    JSC::VM& vm() override;

private:
    friend class InspectorInstrumentation;

    PageAgentContext pageAgentContext();
    void createLazyAgents();
    void runLoopWhilePaused();

    WeakRef<Page> m_page;
    Ref<InstrumentingAgents> m_instrumentingAgents;
    std::unique_ptr<WebInjectedScriptManager> m_injectedScriptManager;
    Ref<Inspector::FrontendRouter> m_frontendRouter;
    Ref<Inspector::BackendDispatcher> m_backendDispatcher;
    const UniqueRef<InspectorOverlay> m_overlay;
    Ref<WTF::Stopwatch> m_executionStopwatch;
    std::unique_ptr<PageDebugger> m_debugger;
    Inspector::AgentRegistry m_agents;

    std::unique_ptr<InspectorClient> m_inspectorClient;
    InspectorFrontendClient* m_inspectorFrontendClient { nullptr };

    // Lazy, but also on-demand agents.
    Inspector::InspectorAgent* m_inspectorAgent { nullptr };
    InspectorDOMAgent* m_domAgent { nullptr };
    InspectorPageAgent* m_pageAgent { nullptr };

    bool m_isUnderTest { false };
    bool m_isAutomaticInspection { false };
    bool m_pauseAfterInitialization = { false };
    bool m_didCreateLazyAgents { false };
    PauseCondition m_pauseOnStart { PauseCondition::DONT_PAUSE };
};

} // namespace WebCore
