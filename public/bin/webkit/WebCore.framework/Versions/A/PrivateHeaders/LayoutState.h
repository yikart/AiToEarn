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

#include "LayoutElementBox.h"
#include "SecurityOrigin.h"
#include <wtf/HashMap.h>
#include <wtf/HashSet.h>
#include <wtf/WeakPtr.h>

namespace WebCore {
namespace Layout {
class LayoutState;
}
}

namespace WTF {
template<typename T> struct IsDeprecatedWeakRefSmartPointerException;
template<> struct IsDeprecatedWeakRefSmartPointerException<WebCore::Layout::LayoutState> : std::true_type { };
}

namespace WebCore {

class Document;

namespace LayoutIntegration {
enum class LogicalWidthType : uint8_t;
enum class LogicalHeightType : uint8_t;
}

namespace Layout {

class BlockFormattingState;
class BoxGeometry;
class FormattingContext;
class FormattingState;
class InlineContentCache;
class TableFormattingState;

class LayoutState : public CanMakeWeakPtr<LayoutState> {
    WTF_MAKE_NONCOPYABLE(LayoutState);
    WTF_MAKE_TZONE_OR_ISO_ALLOCATED(LayoutState);
public:
    // Primary layout state has a direct geometry cache in layout boxes.
    enum class Type { Primary, Secondary };

    using FormattingContextLayoutFunction = Function<void(const ElementBox&, std::optional<LayoutUnit>, LayoutState&)>;
    using FormattingContextLogicalWidthFunction = Function<LayoutUnit(const ElementBox&, LayoutIntegration::LogicalWidthType)>;
    using FormattingContextLogicalHeightFunction = Function<LayoutUnit(const ElementBox&, LayoutIntegration::LogicalHeightType)>;

    LayoutState(const Document&, const ElementBox& rootContainer, Type, FormattingContextLayoutFunction&&, FormattingContextLogicalWidthFunction&&, FormattingContextLogicalHeightFunction&&);
    ~LayoutState();

    Type type() const { return m_type; }

    void updateQuirksMode(const Document&);

    InlineContentCache& inlineContentCache(const ElementBox& formattingContextRoot);

    BlockFormattingState& ensureBlockFormattingState(const ElementBox& formattingContextRoot);
    TableFormattingState& ensureTableFormattingState(const ElementBox& formattingContextRoot);

    BlockFormattingState& formattingStateForBlockFormattingContext(const ElementBox& blockFormattingContextRoot) const;
    TableFormattingState& formattingStateForTableFormattingContext(const ElementBox& tableFormattingContextRoot) const;

    FormattingState& formattingStateForFormattingContext(const ElementBox& formattingRoot) const;

    void destroyBlockFormattingState(const ElementBox& formattingContextRoot);
    void destroyInlineContentCache(const ElementBox& formattingContextRoot);

    bool hasFormattingState(const ElementBox& formattingRoot) const;

#ifndef NDEBUG
    void registerFormattingContext(const FormattingContext&);
    void deregisterFormattingContext(const FormattingContext& formattingContext) { m_formattingContextList.remove(&formattingContext); }
#endif

    BoxGeometry& geometryForRootBox();
    BoxGeometry& ensureGeometryForBox(const Box&);
    const BoxGeometry& geometryForBox(const Box&) const;

    bool hasBoxGeometry(const Box&) const;

    enum class QuirksMode { No, Limited, Yes };
    bool inQuirksMode() const { return m_quirksMode == QuirksMode::Yes; }
    bool inLimitedQuirksMode() const { return m_quirksMode == QuirksMode::Limited; }
    bool inStandardsMode() const { return m_quirksMode == QuirksMode::No; }
    const SecurityOrigin& securityOrigin() const { return m_securityOrigin.get(); }

    const ElementBox& root() const { return m_rootContainer; }

    void layoutWithFormattingContextForBox(const ElementBox&, std::optional<LayoutUnit> widthConstraint) const;
    LayoutUnit logicalWidthWithFormattingContextForBox(const ElementBox&, LayoutIntegration::LogicalWidthType) const;
    LayoutUnit logicalHeightWithFormattingContextForBox(const ElementBox&, LayoutIntegration::LogicalHeightType) const;

private:
    void setQuirksMode(QuirksMode quirksMode) { m_quirksMode = quirksMode; }
    BoxGeometry& ensureGeometryForBoxSlow(const Box&);

    const Type m_type;

    UncheckedKeyHashMap<const ElementBox*, std::unique_ptr<InlineContentCache>> m_inlineContentCaches;

    UncheckedKeyHashMap<const ElementBox*, std::unique_ptr<BlockFormattingState>> m_blockFormattingStates;
    UncheckedKeyHashMap<const ElementBox*, std::unique_ptr<TableFormattingState>> m_tableFormattingStates;

#ifndef NDEBUG
    HashSet<const FormattingContext*> m_formattingContextList;
#endif
    UncheckedKeyHashMap<const Box*, std::unique_ptr<BoxGeometry>> m_layoutBoxToBoxGeometry;
    QuirksMode m_quirksMode { QuirksMode::No };

    CheckedRef<const ElementBox> m_rootContainer;
    Ref<SecurityOrigin> m_securityOrigin;

    FormattingContextLayoutFunction m_formattingContextLayoutFunction;
    FormattingContextLogicalWidthFunction m_formattingContextLogicalWidthFunction;
    FormattingContextLogicalHeightFunction m_formattingContextLogicalHeightFunction;
};

inline bool LayoutState::hasBoxGeometry(const Box& layoutBox) const
{
    if (LIKELY(m_type == Type::Primary))
        return !!layoutBox.m_cachedGeometryForPrimaryLayoutState;

    return m_layoutBoxToBoxGeometry.contains(&layoutBox);
}

inline BoxGeometry& LayoutState::ensureGeometryForBox(const Box& layoutBox)
{
    if (LIKELY(m_type == Type::Primary)) {
        if (auto* boxGeometry = layoutBox.m_cachedGeometryForPrimaryLayoutState.get()) {
            ASSERT(layoutBox.m_primaryLayoutState == this);
            return *boxGeometry;
        }
    }
    return ensureGeometryForBoxSlow(layoutBox);
}

inline const BoxGeometry& LayoutState::geometryForBox(const Box& layoutBox) const
{
    if (LIKELY(m_type == Type::Primary)) {
        ASSERT(layoutBox.m_primaryLayoutState == this);
        return *layoutBox.m_cachedGeometryForPrimaryLayoutState;
    }

    ASSERT(layoutBox.m_primaryLayoutState != this);
    ASSERT(m_layoutBoxToBoxGeometry.contains(&layoutBox));
    return *m_layoutBoxToBoxGeometry.get(&layoutBox);
}

#ifndef NDEBUG
inline void LayoutState::registerFormattingContext(const FormattingContext& formattingContext)
{
    // Multiple formatting contexts of the same root within a layout frame indicates defective layout logic.
    ASSERT(!m_formattingContextList.contains(&formattingContext));
    m_formattingContextList.add(&formattingContext);
}
#endif

}
}
