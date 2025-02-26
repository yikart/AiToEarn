/*
 * Copyright (C) 1999 Lars Knoll (knoll@kde.org)
 *           (C) 1999 Antti Koivisto (koivisto@kde.org)
 * Copyright (C) 2004-2019 Apple Inc. All rights reserved.
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

#include "HTMLFrameOwnerElement.h"
#include "Image.h"
#include "JSValueInWrappedObject.h"
#include "RenderEmbeddedObject.h"

namespace JSC {
namespace Bindings {
class Instance;
}
}

namespace WebCore {

class PluginReplacement;
class PluginViewBase;
class RenderWidget;
class VoidCallback;

class HTMLPlugInElement : public HTMLFrameOwnerElement {
    WTF_MAKE_TZONE_OR_ISO_ALLOCATED(HTMLPlugInElement);
    WTF_OVERRIDE_DELETE_FOR_CHECKED_PTR(HTMLPlugInElement);
public:
    virtual ~HTMLPlugInElement();

    void resetInstance();

    JSC::Bindings::Instance* bindingsInstance();

    enum class PluginLoadingPolicy { DoNotLoad, Load };
    WEBCORE_EXPORT PluginViewBase* pluginWidget(PluginLoadingPolicy = PluginLoadingPolicy::Load) const;

    enum DisplayState {
        Playing,
        PreparingPluginReplacement,
        DisplayingPluginReplacement,
    };
    DisplayState displayState() const { return m_displayState; }
    void setDisplayState(DisplayState);

    bool isCapturingMouseEvents() const { return m_isCapturingMouseEvents; }
    void setIsCapturingMouseEvents(bool capturing) { m_isCapturingMouseEvents = capturing; }

#if PLATFORM(IOS_FAMILY)
    bool willRespondToMouseMoveEvents() const final { return false; }
#endif
    bool willRespondToMouseClickEventsWithEditability(Editability) const final;

    virtual bool isPlugInImageElement() const = 0;

    // Return whether or not the replacement content for blocked plugins is accessible to the user.
    WEBCORE_EXPORT bool setReplacement(PluginUnavailabilityReason, const String& unavailabilityDescription);

    WEBCORE_EXPORT bool isReplacementObscured();

    WEBCORE_EXPORT void pluginDestroyedWithPendingPDFTestCallback(RefPtr<VoidCallback>&&);
    WEBCORE_EXPORT RefPtr<VoidCallback> takePendingPDFTestCallback();

protected:
    HTMLPlugInElement(const QualifiedName& tagName, Document&, OptionSet<TypeFlag> = { });

    bool canContainRangeEndPoint() const override { return false; }
    void willDetachRenderers() override;
    bool hasPresentationalHintsForAttribute(const QualifiedName&) const override;
    void collectPresentationalHintsForAttribute(const QualifiedName&, const AtomString&, MutableStyleProperties&) override;

    virtual bool useFallbackContent() const { return false; }

    InsertedIntoAncestorResult insertedIntoAncestor(InsertionType, ContainerNode& parentOfInsertedTree) override;
    void removedFromAncestor(RemovalType, ContainerNode& oldParentOfRemovedTree) override;

    void defaultEventHandler(Event&) final;

    virtual bool requestObject(const String& url, const String& mimeType, const Vector<AtomString>& paramNames, const Vector<AtomString>& paramValues);
    RenderPtr<RenderElement> createElementRenderer(RenderStyle&&, const RenderTreePosition&) override;
    bool isReplaced(const RenderStyle&) const final;
    void didAddUserAgentShadowRoot(ShadowRoot&) final;

    // This will load the plugin if necessary.
    virtual RenderWidget* renderWidgetLoadingPlugin() const;

private:
    void swapRendererTimerFired();
    bool shouldOverridePlugin(const String& url, const String& mimeType);

    bool supportsFocus() const final;

    bool isKeyboardFocusable(KeyboardEvent*) const final;
    bool isPluginElement() const final;
    bool canLoadScriptURL(const URL&) const final;

    RefPtr<JSC::Bindings::Instance> m_instance;
    Timer m_swapRendererTimer;
    RefPtr<PluginReplacement> m_pluginReplacement;
    bool m_isCapturingMouseEvents { false };
    DisplayState m_displayState { Playing };

    RefPtr<VoidCallback> m_pendingPDFTestCallback;
};

} // namespace WebCore

SPECIALIZE_TYPE_TRAITS_BEGIN(WebCore::HTMLPlugInElement)
    static bool isType(const WebCore::Node& node) { return node.isPluginElement(); }
SPECIALIZE_TYPE_TRAITS_END()
