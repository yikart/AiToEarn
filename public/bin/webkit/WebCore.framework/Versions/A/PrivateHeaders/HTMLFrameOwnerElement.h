/*
 * Copyright (C) 2006-2023 Apple Inc. All rights reserved.
 * Copyright (C) 2013-2016 Google Inc. All rights reserved.
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

#include "Frame.h"
#include "HTMLElement.h"
#include "ReferrerPolicy.h"
#include "SecurityContext.h"
#include <wtf/HashCountedSet.h>
#include <wtf/NeverDestroyed.h>

namespace WebCore {

class RenderWidget;

class HTMLFrameOwnerElement : public HTMLElement {
    WTF_MAKE_TZONE_OR_ISO_ALLOCATED(HTMLFrameOwnerElement);
    WTF_OVERRIDE_DELETE_FOR_CHECKED_PTR(HTMLFrameOwnerElement);
public:
    virtual ~HTMLFrameOwnerElement();

    Frame* contentFrame() const { return m_contentFrame.get(); }
    RefPtr<Frame> protectedContentFrame() const;
    WEBCORE_EXPORT WindowProxy* contentWindow() const;
    WEBCORE_EXPORT Document* contentDocument() const;
    RefPtr<Document> protectedContentDocument() const { return contentDocument(); }

    WEBCORE_EXPORT void setContentFrame(Frame&);
    void clearContentFrame();

    void disconnectContentFrame();

    // Most subclasses use RenderWidget (either RenderEmbeddedObject or RenderIFrame)
    // except for HTMLObjectElement and HTMLEmbedElement which may return any
    // RenderElement when using fallback content.
    RenderWidget* renderWidget() const;

    Document* getSVGDocument() const;

    virtual ScrollbarMode scrollingMode() const { return ScrollbarMode::Auto; }

    SandboxFlags sandboxFlags() const { return m_sandboxFlags; }

    WEBCORE_EXPORT void scheduleInvalidateStyleAndLayerComposition();

    virtual bool canLoadScriptURL(const URL&) const = 0;

    virtual ReferrerPolicy referrerPolicy() const { return ReferrerPolicy::EmptyString; }

    virtual bool shouldLoadFrameLazily() { return false; }
    virtual bool isLazyLoadObserverActive() const { return false; }

protected:
    HTMLFrameOwnerElement(const QualifiedName& tagName, Document&, OptionSet<TypeFlag> = { });
    void setSandboxFlags(SandboxFlags);
    bool isProhibitedSelfReference(const URL&) const;
    bool isKeyboardFocusable(KeyboardEvent*) const override;

private:
    bool isHTMLFrameOwnerElement() const final { return true; }

    WeakPtr<Frame> m_contentFrame;
    SandboxFlags m_sandboxFlags;
};

class SubframeLoadingDisabler {
public:
    explicit SubframeLoadingDisabler(ContainerNode* root)
        : m_root(root)
    {
        if (m_root)
            disabledSubtreeRoots().add(m_root.get());
    }

    ~SubframeLoadingDisabler()
    {
        if (m_root)
            disabledSubtreeRoots().remove(m_root.get());
    }

    static bool canLoadFrame(HTMLFrameOwnerElement&);

private:
    static HashCountedSet<ContainerNode*>& disabledSubtreeRoots()
    {
        static NeverDestroyed<HashCountedSet<ContainerNode*>> nodes;
        return nodes;
    }

    WeakPtr<ContainerNode, WeakPtrImplWithEventTargetData> m_root;
};

inline HTMLFrameOwnerElement* Frame::ownerElement() const
{
    return m_ownerElement.get();
}

inline RefPtr<HTMLFrameOwnerElement> Frame::protectedOwnerElement() const
{
    return m_ownerElement.get();
}

} // namespace WebCore

SPECIALIZE_TYPE_TRAITS_BEGIN(WebCore::HTMLFrameOwnerElement)
    static bool isType(const WebCore::Node& node) { return node.isHTMLFrameOwnerElement(); }
SPECIALIZE_TYPE_TRAITS_END()
