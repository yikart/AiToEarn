/*
 * Copyright (C) 1999 Lars Knoll (knoll@kde.org)
 *           (C) 1999 Antti Koivisto (koivisto@kde.org)
 *           (C) 2001 Dirk Mueller (mueller@kde.org)
 *           (C) 2006 Alexey Proskuryakov (ap@webkit.org)
 * Copyright (C) 2004-2010, 2012-2013, 2015 Apple Inc. All rights reserved.
 * Copyright (C) 2008, 2009 Torch Mobile Inc. All rights reserved. (http://www.torchmobile.com/)
 * Copyright (C) 2010 Nokia Corporation and/or its subsidiary(-ies)
 * Copyright (C) 2011 Google Inc. All rights reserved.
 *
 * This library is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Library General Public
 * License as published by the Free Software Foundation; either
 * version 2 of the License, or (at your option) any later version.
 *
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Library General Public License for more details.
 *
 * You should have received a copy of the GNU Library General Public License
 * along with this library; see the file COPYING.LIB.  If not, write to
 * the Free Software Foundation, Inc., 51 Franklin Street, Fifth Floor,
 * Boston, MA 02110-1301, USA.
 *
 */

#pragma once

#include "UserStyleSheet.h"
#include <memory>
#include <wtf/CheckedRef.h>
#include <wtf/RefPtr.h>
#include <wtf/RobinHoodHashMap.h>
#include <wtf/TZoneMalloc.h>
#include <wtf/Vector.h>
#include <wtf/WeakRef.h>
#include <wtf/text/WTFString.h>

#if ENABLE(CONTENT_EXTENSIONS)
#include "ContentExtensionStyleSheet.h"
#endif

namespace WebCore {

class CSSStyleSheet;
class Document;
class Node;
class StyleSheet;
class StyleSheetContents;
class StyleSheetList;
class WeakPtrImplWithEventTargetData;

class ExtensionStyleSheets final : public CanMakeCheckedPtr<ExtensionStyleSheets> {
    WTF_MAKE_TZONE_ALLOCATED(ExtensionStyleSheets);
    WTF_OVERRIDE_DELETE_FOR_CHECKED_PTR(ExtensionStyleSheets);
public:
    explicit ExtensionStyleSheets(Document&);
    ~ExtensionStyleSheets();

    CSSStyleSheet* pageUserSheet();
    const Vector<RefPtr<CSSStyleSheet>>& documentUserStyleSheets() const { return m_userStyleSheets; }
    const Vector<RefPtr<CSSStyleSheet>>& injectedUserStyleSheets() const;
    const Vector<RefPtr<CSSStyleSheet>>& injectedAuthorStyleSheets() const;
    const Vector<RefPtr<CSSStyleSheet>>& authorStyleSheetsForTesting() const { return m_authorStyleSheetsForTesting; }

    void clearPageUserSheet();
    void updatePageUserSheet();
    void invalidateInjectedStyleSheetCache();
    void updateInjectedStyleSheetCache() const;

    WEBCORE_EXPORT void addUserStyleSheet(Ref<StyleSheetContents>&&);

    WEBCORE_EXPORT void addAuthorStyleSheetForTesting(Ref<StyleSheetContents>&&);

#if ENABLE(CONTENT_EXTENSIONS)
    void addDisplayNoneSelector(const String& identifier, const String& selector, uint32_t selectorID);
    void maybeAddContentExtensionSheet(const String& identifier, StyleSheetContents&);
#endif

    void injectPageSpecificUserStyleSheet(const UserStyleSheet&);
    void removePageSpecificUserStyleSheet(const UserStyleSheet&);

    String contentForInjectedStyleSheet(const RefPtr<CSSStyleSheet>&) const;

    void detachFromDocument();

private:
    Ref<Document> protectedDocument() const;

    WeakRef<Document, WeakPtrImplWithEventTargetData> m_document;

    RefPtr<CSSStyleSheet> m_pageUserSheet;

    mutable Vector<RefPtr<CSSStyleSheet>> m_injectedUserStyleSheets;
    mutable Vector<RefPtr<CSSStyleSheet>> m_injectedAuthorStyleSheets;
    mutable UncheckedKeyHashMap<RefPtr<CSSStyleSheet>, String> m_injectedStyleSheetToSource;
    mutable bool m_injectedStyleSheetCacheValid { false };

    Vector<RefPtr<CSSStyleSheet>> m_userStyleSheets;
    Vector<RefPtr<CSSStyleSheet>> m_authorStyleSheetsForTesting;
    Vector<UserStyleSheet> m_pageSpecificStyleSheets;

#if ENABLE(CONTENT_EXTENSIONS)
    MemoryCompactRobinHoodHashMap<String, RefPtr<CSSStyleSheet>> m_contentExtensionSheets;
    MemoryCompactRobinHoodHashMap<String, RefPtr<ContentExtensions::ContentExtensionStyleSheet>> m_contentExtensionSelectorSheets;
#endif
};

} // namespace WebCore
