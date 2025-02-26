/*
 * Copyright (C) 2021 Apple Inc. All rights reserved.
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

#include "CachedResourceLoader.h"
#include "ClientOrigin.h"
#include "Document.h"
#include "DocumentMarkerController.h"
#include "DocumentParser.h"
#include "Element.h"
#include "ExtensionStyleSheets.h"
#include "FocusOptions.h"
#include "FrameDestructionObserverInlines.h"
#include "LocalDOMWindow.h"
#include "NodeIterator.h"
#include "ReportingScope.h"
#include "SecurityOrigin.h"
#include "TextResourceDecoder.h"
#include "UndoManager.h"
#include "WebCoreOpaqueRoot.h"

namespace WebCore {

inline PAL::TextEncoding Document::textEncoding() const
{
    if (RefPtr decoder = this->decoder())
        return decoder->encoding();
    return PAL::TextEncoding();
}

inline ASCIILiteral Document::encoding() const
{
    return textEncoding().domName();
}

inline ASCIILiteral Document::charset() const
{
    return Document::encoding();
}

inline Quirks& Document::quirks()
{
    if (!m_quirks)
        return ensureQuirks();
    return *m_quirks;
}

inline const Quirks& Document::quirks() const
{
    if (!m_quirks)
        return const_cast<Document&>(*this).ensureQuirks();
    return *m_quirks;
}

inline ExtensionStyleSheets& Document::extensionStyleSheets()
{
    if (!m_extensionStyleSheets)
        return ensureExtensionStyleSheets();
    return *m_extensionStyleSheets;
}

inline CheckedRef<ExtensionStyleSheets> Document::checkedExtensionStyleSheets()
{
    return extensionStyleSheets();
}

inline VisitedLinkState& Document::visitedLinkState() const
{
    if (!m_visitedLinkState)
        return const_cast<Document&>(*this).ensureVisitedLinkState();
    return *m_visitedLinkState;
}

inline ScriptRunner& Document::scriptRunner()
{
    if (!m_scriptRunner)
        return ensureScriptRunner();
    return *m_scriptRunner;
}

inline ScriptModuleLoader& Document::moduleLoader()
{
    if (!m_moduleLoader)
        return ensureModuleLoader();
    return *m_moduleLoader;
}

CSSFontSelector& Document::fontSelector()
{
    if (!m_fontSelector)
        return ensureFontSelector();
    return *m_fontSelector;
}

const CSSFontSelector& Document::fontSelector() const
{
    if (!m_fontSelector)
        return const_cast<Document&>(*this).ensureFontSelector();
    return *m_fontSelector;
}

inline const Document* Document::templateDocument() const
{
    return m_templateDocumentHost ? this : m_templateDocument.get();
}

inline AXObjectCache* Document::existingAXObjectCache() const
{
    if (!hasEverCreatedAnAXObjectCache)
        return nullptr;
    return existingAXObjectCacheSlow();
}

inline Ref<Document> Document::create(const Settings& settings, const URL& url)
{
    auto document = adoptRef(*new Document(nullptr, settings, url));
    document->addToContextsMap();
    return document;
}

bool Document::hasNodeIterators() const
{
    return !m_nodeIterators.isEmptyIgnoringNullReferences();
}

inline void Document::invalidateAccessKeyCache()
{
    if (UNLIKELY(m_accessKeyCache))
        invalidateAccessKeyCacheSlowCase();
}

inline bool Document::hasMutationObserversOfType(MutationObserverOptionType type) const
{
    return m_mutationObserverTypes.containsAny(type);
}

inline ClientOrigin Document::clientOrigin() const { return { topOrigin().data(), securityOrigin().data() }; }

inline bool Document::isSameOriginAsTopDocument() const { return securityOrigin().isSameOriginAs(topOrigin()); }

inline bool Document::shouldMaskURLForBindings(const URL& urlToMask) const
{
    if (LIKELY(urlToMask.protocolIsInHTTPFamily()))
        return false;
    return shouldMaskURLForBindingsInternal(urlToMask);
}

inline const URL& Document::maskedURLForBindingsIfNeeded(const URL& url) const
{
    if (UNLIKELY(shouldMaskURLForBindings(url)))
        return maskedURLForBindings();
    return url;
}

// These functions are here because they require the Document class definition and we want to inline them.

inline ScriptExecutionContext* Node::scriptExecutionContext() const
{
    return &document().contextDocument();
}

inline bool Document::hasBrowsingContext() const
{
    return !!frame();
}

inline WebCoreOpaqueRoot Node::opaqueRoot() const
{
    // FIXME: Possible race?
    // https://bugs.webkit.org/show_bug.cgi?id=165713
    if (isConnected())
        return WebCoreOpaqueRoot { &document() };
    return traverseToOpaqueRoot();
}

inline bool Document::wasLastFocusByClick() const { return m_latestFocusTrigger == FocusTrigger::Click; }

inline Ref<Document> Node::protectedDocument() const
{
    return document();
}

inline RefPtr<LocalDOMWindow> Document::protectedWindow() const
{
    return m_domWindow;
}

inline CachedResourceLoader& Document::cachedResourceLoader()
{
    if (!m_cachedResourceLoader)
        return ensureCachedResourceLoader();
    return *m_cachedResourceLoader;
}

inline Ref<CachedResourceLoader> Document::protectedCachedResourceLoader() const
{
    return const_cast<Document&>(*this).cachedResourceLoader();
}

inline RefPtr<DocumentParser> Document::protectedParser() const
{
    return m_parser;
}

inline RefPtr<Element> Document::protectedDocumentElement() const
{
    return m_documentElement;
}

inline UndoManager& Document::undoManager() const
{
    if (!m_undoManager)
        return const_cast<Document&>(*this).ensureUndoManager();
    return *m_undoManager;
}

inline Ref<UndoManager> Document::protectedUndoManager() const
{
    return undoManager();
}

inline ReportingScope& Document::reportingScope() const
{
    if (!m_reportingScope)
        return const_cast<Document&>(*this).ensureReportingScope();
    return *m_reportingScope;
}

inline Ref<ReportingScope> Document::protectedReportingScope() const
{
    return reportingScope();
}

inline RefPtr<TextResourceDecoder> Document::protectedDecoder() const
{
    return m_decoder;
}

inline RefPtr<Element> Document::protectedFocusedElement() const
{
    return m_focusedElement;
}

inline DocumentMarkerController& Document::markers()
{
    if (!m_markers)
        return ensureMarkers();
    return *m_markers;
}

inline const DocumentMarkerController& Document::markers() const
{
    if (!m_markers)
        return const_cast<Document&>(*this).ensureMarkers();
    return *m_markers;
}

inline CheckedRef<DocumentMarkerController> Document::checkedMarkers()
{
    return markers();
}

inline CheckedRef<const DocumentMarkerController> Document::checkedMarkers() const
{
    return markers();
}

inline Ref<SecurityOrigin> Document::protectedSecurityOrigin() const
{
    return SecurityContext::protectedSecurityOrigin().releaseNonNull();
}

} // namespace WebCore
