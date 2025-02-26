/*
 * Copyright (C) 2006, 2007 Rob Buis
 * Copyright (C) 2013 Apple, Inc. All rights reserved.
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

#include "CSSStyleSheet.h"
#include "StyleScope.h"
#include <wtf/text/TextPosition.h>

namespace WebCore {

class Document;
class Element;

class InlineStyleSheetOwner {
public:
    InlineStyleSheetOwner(Document&, bool createdByParser);
    ~InlineStyleSheetOwner();

    void setContentType(const AtomString& contentType) { m_contentType = contentType; }
    void setMedia(const AtomString& media) { m_media = media; }

    CSSStyleSheet* sheet() const { return m_sheet.get(); }

    bool isLoading() const;
    bool sheetLoaded(Element&);
    void startLoadingDynamicSheet(Element&);

    void insertedIntoDocument(Element&);
    void removedFromDocument(Element&);
    void clearDocumentData(Element&);
    void childrenChanged(Element&);
    void finishParsingChildren(Element&);

    Style::Scope* styleScope() { return m_styleScope.get(); }

private:
    void createSheet(Element&, const String& text);
    void createSheetFromTextContents(Element&);
    void clearSheet();

    bool m_isParsingChildren;
    bool m_loading;
    TextPosition m_startTextPosition;
    AtomString m_contentType;
    AtomString m_media;
    RefPtr<CSSStyleSheet> m_sheet;
    WeakPtr<Style::Scope> m_styleScope;
};

} // namespace WebCore
