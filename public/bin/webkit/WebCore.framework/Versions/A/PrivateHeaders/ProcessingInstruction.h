/*
 * Copyright (C) 2000 Peter Kelly (pmk@post.com)
 * Copyright (C) 2006-2018 Apple Inc. All rights reserved.
 * Copyright (C) 2013 Samsung Electronics. All rights reserved.
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

#include "CachedResourceHandle.h"
#include "CachedStyleSheetClient.h"
#include "CharacterData.h"

namespace WebCore {

class StyleSheet;
class CSSStyleSheet;

class ProcessingInstruction final : public CharacterData, private CachedStyleSheetClient {
    WTF_MAKE_TZONE_OR_ISO_ALLOCATED(ProcessingInstruction);
    WTF_OVERRIDE_DELETE_FOR_CHECKED_PTR(ProcessingInstruction);
public:
    USING_CAN_MAKE_WEAKPTR(CharacterData);

    static Ref<ProcessingInstruction> create(Document&, String&& target, String&& data);
    virtual ~ProcessingInstruction();

    const String& target() const { return m_target; }

    void setCreatedByParser(bool createdByParser) { m_createdByParser = createdByParser; }

    const String& localHref() const { return m_localHref; }
    StyleSheet* sheet() const { return m_sheet.get(); }
    RefPtr<StyleSheet> protectedSheet() const;

    bool isCSS() const { return m_isCSS; }
#if ENABLE(XSLT)
    bool isXSL() const { return m_isXSL; }
#endif

private:
    friend class CharacterData;
    ProcessingInstruction(Document&, String&& target, String&& data);

    String nodeName() const override;
    Ref<Node> cloneNodeInternal(TreeScope&, CloningOperation) override;

    InsertedIntoAncestorResult insertedIntoAncestor(InsertionType, ContainerNode&) override;
    void didFinishInsertingNode() override;
    void removedFromAncestor(RemovalType, ContainerNode&) override;

    void checkStyleSheet();
    void setCSSStyleSheet(const String& href, const URL& baseURL, ASCIILiteral charset, const CachedCSSStyleSheet*) override;
#if ENABLE(XSLT)
    void setXSLStyleSheet(const String& href, const URL& baseURL, const String& sheet) override;
#endif

    bool isLoading() const;
    bool sheetLoaded() override;

    void addSubresourceAttributeURLs(ListHashSet<URL>&) const override;

    void parseStyleSheet(const String& sheet);

    String m_target;
    String m_localHref;
    String m_title;
    String m_media;
    CachedResourceHandle<CachedResource> m_cachedSheet;
    RefPtr<StyleSheet> m_sheet;
    bool m_loading { false };
    bool m_alternate { false };
    bool m_createdByParser { false };
    bool m_isCSS { false };
#if ENABLE(XSLT)
    bool m_isXSL { false };
#endif
};

} // namespace WebCore

SPECIALIZE_TYPE_TRAITS_BEGIN(WebCore::ProcessingInstruction)
    static bool isType(const WebCore::Node& node) { return node.nodeType() == WebCore::Node::PROCESSING_INSTRUCTION_NODE; }
SPECIALIZE_TYPE_TRAITS_END()
