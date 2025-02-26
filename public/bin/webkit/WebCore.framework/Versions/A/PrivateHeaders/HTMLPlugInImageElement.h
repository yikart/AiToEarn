/*
 * Copyright (C) 2008-2019 Apple Inc. All rights reserved.
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

#include "HTMLPlugInElement.h"

namespace WebCore {

class HTMLImageLoader;

enum class CreatePlugins : bool { No, Yes };

// Base class for HTMLEmbedElement and HTMLObjectElement.
// FIXME: This is the only class that derives from HTMLPlugInElement, so we could merge the two classes.
class HTMLPlugInImageElement : public HTMLPlugInElement {
    WTF_MAKE_TZONE_OR_ISO_ALLOCATED(HTMLPlugInImageElement);
    WTF_OVERRIDE_DELETE_FOR_CHECKED_PTR(HTMLPlugInImageElement);
public:
    virtual ~HTMLPlugInImageElement();

    RenderEmbeddedObject* renderEmbeddedObject() const;

    virtual void updateWidget(CreatePlugins) = 0;

    const String& serviceType() const { return m_serviceType; }
    const String& url() const { return m_url; }

    bool needsWidgetUpdate() const { return m_needsWidgetUpdate; }
    void setNeedsWidgetUpdate(bool needsWidgetUpdate) { m_needsWidgetUpdate = needsWidgetUpdate; }

    bool shouldBypassCSPForPDFPlugin(const String& contentType) const;
    
protected:
    HTMLPlugInImageElement(const QualifiedName& tagName, Document&);

    void didMoveToNewDocument(Document& oldDocument, Document& newDocument) override;

    bool requestObject(const String& url, const String& mimeType, const Vector<AtomString>& paramNames, const Vector<AtomString>& paramValues) final;

    bool isImageType();
    HTMLImageLoader* imageLoader() { return m_imageLoader.get(); }
    void updateImageLoaderWithNewURLSoon();

    bool canLoadURL(const String& relativeURL) const;
    bool wouldLoadAsPlugIn(const String& relativeURL, const String& serviceType);

    void scheduleUpdateForAfterStyleResolution();

    String m_serviceType;
    String m_url;

private:
    bool isPlugInImageElement() const final { return true; }

    bool canLoadPlugInContent(const String& relativeURL, const String& mimeType) const;
    bool canLoadURL(const URL&) const;

    RenderPtr<RenderElement> createElementRenderer(RenderStyle&&, const RenderTreePosition&) override;
    bool childShouldCreateRenderer(const Node&) const override;
    void willRecalcStyle(Style::Change) final;
    void didRecalcStyle(Style::Change) final;
    void didAttachRenderers() final;
    void willDetachRenderers() final;

    void prepareForDocumentSuspension() final;
    void resumeFromDocumentSuspension() final;

    void updateAfterStyleResolution();

    bool m_needsWidgetUpdate { false };
    bool m_needsDocumentActivationCallbacks { false };
    std::unique_ptr<HTMLImageLoader> m_imageLoader;
    bool m_needsImageReload { false };
    bool m_hasUpdateScheduledForAfterStyleResolution { false };
};

} // namespace WebCore

SPECIALIZE_TYPE_TRAITS_BEGIN(WebCore::HTMLPlugInImageElement)
    static bool isType(const WebCore::HTMLPlugInElement& element) { return element.isPlugInImageElement(); }
    static bool isType(const WebCore::Node& node)
    {
        auto* pluginElement = dynamicDowncast<WebCore::HTMLPlugInElement>(node);
        return pluginElement && isType(*pluginElement);
    }
SPECIALIZE_TYPE_TRAITS_END()
