/*
 * Copyright (C) 2010 Google Inc. All rights reserved.
 * Copyright (C) 2015-2020 Apple Inc. All rights reserved.
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

#include "InspectorFrontendAPIDispatcher.h"
#include "InspectorFrontendClient.h"
#include <wtf/Forward.h>
#include <wtf/Noncopyable.h>
#include <wtf/TZoneMalloc.h>
#include <wtf/WeakPtr.h>
#include <wtf/text/WTFString.h>

namespace WebCore {

class Color;
class FloatRect;
class InspectorController;
class InspectorBackendDispatchTask;
class InspectorFrontendHost;
class LocalFrame;
class Page;

class InspectorFrontendClientLocal : public InspectorFrontendClient {
    WTF_MAKE_TZONE_ALLOCATED_EXPORT(InspectorFrontendClientLocal, WEBCORE_EXPORT);
    WTF_MAKE_NONCOPYABLE(InspectorFrontendClientLocal);
public:
    class WEBCORE_EXPORT Settings {
        WTF_MAKE_TZONE_ALLOCATED_EXPORT(Settings, WEBCORE_EXPORT);
    public:
        Settings() = default;
        virtual ~Settings() = default;
        virtual String getProperty(const String& name);
        virtual void setProperty(const String& name, const String& value);
        virtual void deleteProperty(const String& name);
    };

    WEBCORE_EXPORT InspectorFrontendClientLocal(InspectorController* inspectedPageController, Page* frontendPage, std::unique_ptr<Settings>);
    WEBCORE_EXPORT ~InspectorFrontendClientLocal() override;

    WEBCORE_EXPORT void resetState() override;

    WEBCORE_EXPORT void windowObjectCleared() final;
    WEBCORE_EXPORT void frontendLoaded() override;
    WEBCORE_EXPORT void pagePaused() final;
    WEBCORE_EXPORT void pageUnpaused() final;

    void startWindowDrag() override { }
    WEBCORE_EXPORT void moveWindowBy(float x, float y) final;

    WEBCORE_EXPORT UserInterfaceLayoutDirection userInterfaceLayoutDirection() const final;

    WEBCORE_EXPORT void requestSetDockSide(DockSide) final;
    WEBCORE_EXPORT void changeAttachedWindowHeight(unsigned) final;
    WEBCORE_EXPORT void changeAttachedWindowWidth(unsigned) final;
    WEBCORE_EXPORT void changeSheetRect(const FloatRect&) final;
    WEBCORE_EXPORT void openURLExternally(const String& url) final;
    void revealFileExternally(const String&) override { }
    bool canSave(InspectorFrontendClient::SaveMode) override { return false; }
    void save(Vector<InspectorFrontendClient::SaveData>&&, bool /* forceSaveAs */) override { }
    bool canLoad()  override { return false; }
    void load(const String&, CompletionHandler<void(const String&)>&& completionHandler) override { completionHandler(nullString()); }

    bool canPickColorFromScreen() override { return false; }
    void pickColorFromScreen(CompletionHandler<void(const std::optional<WebCore::Color>&)>&& completionHandler) override { completionHandler({ }); }

    void setInspectorPageDeveloperExtrasEnabled(bool) override { };

    virtual void attachWindow(DockSide) = 0;
    virtual void detachWindow() = 0;

    WEBCORE_EXPORT void sendMessageToBackend(const String& message) final;

    WEBCORE_EXPORT bool isUnderTest() final;
    bool isRemote() const final { return false; }
    WEBCORE_EXPORT unsigned inspectionLevel() const final;
    String backendCommandsURL() const final { return String(); };

    InspectorFrontendAPIDispatcher& frontendAPIDispatcher() final { return m_frontendAPIDispatcher; }
    WEBCORE_EXPORT Page* frontendPage() final;
    
    WEBCORE_EXPORT bool canAttachWindow();
    WEBCORE_EXPORT void setDockingUnavailable(bool);

    WEBCORE_EXPORT static unsigned constrainedAttachedWindowHeight(unsigned preferredHeight, unsigned totalWindowHeight);
    WEBCORE_EXPORT static unsigned constrainedAttachedWindowWidth(unsigned preferredWidth, unsigned totalWindowWidth);

    // Direct Frontend API
    WEBCORE_EXPORT bool isDebuggingEnabled();
    WEBCORE_EXPORT void setDebuggingEnabled(bool);

    WEBCORE_EXPORT bool isTimelineProfilingEnabled();
    WEBCORE_EXPORT void setTimelineProfilingEnabled(bool);

    WEBCORE_EXPORT bool isProfilingJavaScript();
    WEBCORE_EXPORT void startProfilingJavaScript();
    WEBCORE_EXPORT void stopProfilingJavaScript();

    WEBCORE_EXPORT void showConsole();

    WEBCORE_EXPORT void showMainResourceForFrame(LocalFrame*);

    WEBCORE_EXPORT void showResources();

    WEBCORE_EXPORT void setAttachedWindow(DockSide);

    WEBCORE_EXPORT Page* inspectedPage() const;

protected:
    virtual void setAttachedWindowHeight(unsigned) = 0;
    virtual void setAttachedWindowWidth(unsigned) = 0;
    WEBCORE_EXPORT void restoreAttachedWindowHeight();

    virtual void setSheetRect(const WebCore::FloatRect&) = 0;

private:
    friend class FrontendMenuProvider;
    std::optional<bool> evaluationResultToBoolean(InspectorFrontendAPIDispatcher::EvaluationResult);

    RefPtr<InspectorController> protectedInspectedPageController() const;

    WeakPtr<InspectorController> m_inspectedPageController;
    WeakPtr<Page> m_frontendPage;
    // TODO(yurys): this ref shouldn't be needed.
    RefPtr<InspectorFrontendHost> m_frontendHost;
    std::unique_ptr<InspectorFrontendClientLocal::Settings> m_settings;
    DockSide m_dockSide;
    Ref<InspectorBackendDispatchTask> m_dispatchTask;
    Ref<InspectorFrontendAPIDispatcher> m_frontendAPIDispatcher;
};

} // namespace WebCore
