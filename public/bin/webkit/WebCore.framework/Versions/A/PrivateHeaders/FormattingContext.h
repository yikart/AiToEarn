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

#include "FormattingConstraints.h"
#include "LayoutElementBox.h"
#include "LayoutUnit.h"
#include "LayoutUnits.h"
#include <wtf/TZoneMalloc.h>

namespace WebCore {

class LayoutSize;
struct Length;

namespace Layout {

class BoxGeometry;
class ElementBox;
struct ConstraintsForInFlowContent;
class FormattingGeometry;
class FormattingQuirks;
struct IntrinsicWidthConstraints;
class LayoutState;

class FormattingContext {
    WTF_MAKE_TZONE_OR_ISO_ALLOCATED(FormattingContext);
public:
    virtual ~FormattingContext();

    virtual void layoutInFlowContent(const ConstraintsForInFlowContent&) { };
    virtual IntrinsicWidthConstraints computedIntrinsicWidthConstraints() { return { }; }
    virtual LayoutUnit usedContentHeight() const { return { }; }

    const ElementBox& root() const { return m_root; }

    LayoutState& layoutState();
    const LayoutState& layoutState() const { return const_cast<FormattingContext&>(*this).layoutState(); }

    enum class EscapeReason {
        TableQuirkNeedsGeometryFromEstablishedFormattingContext,
        OutOfFlowBoxNeedsInFlowGeometry,
        FloatBoxIsAlwaysRelativeToFloatStateRoot,
        FindFixedHeightAncestorQuirk,
        DocumentBoxStretchesToViewportQuirk,
        BodyStretchesToViewportQuirk,
        TableNeedsAccessToTableWrapper
    };
    const BoxGeometry& geometryForBox(const Box&, std::optional<EscapeReason> = std::nullopt) const;
    BoxGeometry& geometryForBox(const Box&, std::optional<EscapeReason> = std::nullopt);

    bool isBlockFormattingContext() const { return root().establishesBlockFormattingContext(); }
    bool isTableFormattingContext() const { return root().establishesTableFormattingContext(); }
    bool isTableWrapperBlockFormattingContext() const { return isBlockFormattingContext() && root().isTableWrapperBox(); }
    bool isFlexFormattingContext() const { return root().establishesFlexFormattingContext(); }

    static const InitialContainingBlock& initialContainingBlock(const Box&);
    static const ElementBox& containingBlock(const Box&);
#if ASSERT_ENABLED
    static const ElementBox& formattingContextRoot(const Box&);
#endif

protected:
    FormattingContext(const ElementBox& formattingContextRoot, LayoutState&);

#if ASSERT_ENABLED
    virtual void validateGeometryConstraintsAfterLayout() const;
#endif

private:
    CheckedRef<const ElementBox> m_root;
    LayoutState& m_layoutState;
};

}
}

#define SPECIALIZE_TYPE_TRAITS_LAYOUT_FORMATTING_CONTEXT(ToValueTypeName, predicate) \
SPECIALIZE_TYPE_TRAITS_BEGIN(WebCore::Layout::ToValueTypeName) \
    static bool isType(const WebCore::Layout::FormattingContext& formattingContext) { return formattingContext.predicate; } \
SPECIALIZE_TYPE_TRAITS_END()

