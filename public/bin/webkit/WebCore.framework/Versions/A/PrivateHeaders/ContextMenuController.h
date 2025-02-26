/*
 * Copyright (C) 2006-2017 Apple Inc. All rights reserved.
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
 * THIS SOFTWARE IS PROVIDED BY APPLE INC. ``AS IS'' AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED.  IN NO EVENT SHALL APPLE INC. OR
 * CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 * EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
 * PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 * PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY
 * OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE. 
 */

#pragma once

#if ENABLE(CONTEXT_MENUS)

#include "ContextMenuContext.h"
#include "ContextMenuItem.h"
#include "HitTestRequest.h"
#include <wtf/OptionSet.h>
#include <wtf/TZoneMalloc.h>
#include <wtf/UniqueRef.h>
#include <wtf/WeakRef.h>

namespace WebCore {

class ContextMenuClient;
class ContextMenuProvider;
class Event;
class HitTestResult;
class Page;

class ContextMenuController {
    WTF_MAKE_TZONE_ALLOCATED(ContextMenuController);
public:
    ContextMenuController(Page&, UniqueRef<ContextMenuClient>&&);
    ~ContextMenuController();

    Page& page();
    ContextMenuClient& client() { return m_client.get(); }

    ContextMenu* contextMenu() const { return m_contextMenu.get(); }
    WEBCORE_EXPORT void clearContextMenu();

    void handleContextMenuEvent(Event&);
    void showContextMenu(Event&, ContextMenuProvider&);

    void populate();
    WEBCORE_EXPORT void didDismissContextMenu();
    WEBCORE_EXPORT void contextMenuItemSelected(ContextMenuAction, const String& title);
    void addDebuggingItems();

    WEBCORE_EXPORT void checkOrEnableIfNeeded(ContextMenuItem&) const;

    void setContextMenuContext(const ContextMenuContext& context) { m_context = context; }
    const ContextMenuContext& context() const { return m_context; }
    const HitTestResult& hitTestResult() const { return m_context.hitTestResult(); }

#if USE(ACCESSIBILITY_CONTEXT_MENUS)
    void showContextMenuAt(LocalFrame&, const IntPoint& clickPoint);
#endif
    
#if ENABLE(SERVICE_CONTROLS)
    void showImageControlsMenu(Event&);
#endif

private:
    std::unique_ptr<ContextMenu> maybeCreateContextMenu(Event&, OptionSet<HitTestRequest::Type> hitType, ContextMenuContext::Type);
    void showContextMenu(Event&);
    
    void appendItem(ContextMenuItem&, ContextMenu* parentMenu);

    void createAndAppendFontSubMenu(ContextMenuItem&);
    void createAndAppendSpellingAndGrammarSubMenu(ContextMenuItem&);
    void createAndAppendSpellingSubMenu(ContextMenuItem&);
    void createAndAppendSpeechSubMenu(ContextMenuItem&);
    void createAndAppendWritingDirectionSubMenu(ContextMenuItem&);
    void createAndAppendTextDirectionSubMenu(ContextMenuItem&);
    void createAndAppendSubstitutionsSubMenu(ContextMenuItem&);
    void createAndAppendTransformationsSubMenu(ContextMenuItem&);
    bool shouldEnableCopyLinkWithHighlight() const;
#if PLATFORM(GTK)
    void createAndAppendUnicodeSubMenu(ContextMenuItem&);
#endif

#if ENABLE(PDFJS)
    void performPDFJSAction(LocalFrame&, const String& action);
#endif

    WeakRef<Page> m_page;
    UniqueRef<ContextMenuClient> m_client;
    std::unique_ptr<ContextMenu> m_contextMenu;
    RefPtr<ContextMenuProvider> m_menuProvider;
    ContextMenuContext m_context;
    bool m_isHandlingContextMenuEvent { false };
};

} // namespace WebCore

#endif // ENABLE(CONTEXT_MENUS)
