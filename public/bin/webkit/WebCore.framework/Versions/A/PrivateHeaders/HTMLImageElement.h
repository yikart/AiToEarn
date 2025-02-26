/*
 * Copyright (C) 1999 Lars Knoll (knoll@kde.org)
 *           (C) 1999 Antti Koivisto (koivisto@kde.org)
 * Copyright (C) 2004-2023 Apple Inc. All rights reserved.
 * Copyright (C) 2010-2015 Google Inc. All rights reserved.
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

#include "ActiveDOMObject.h"
#include "AttachmentAssociatedElement.h"
#include "DecodingOptions.h"
#include "FormAssociatedElement.h"
#include "GraphicsTypes.h"
#include "HTMLElement.h"
#include "MediaQuery.h"
#include <wtf/WeakPtr.h>

namespace WebCore {

class CachedImage;
class DeferredPromise;
class HTMLAttachmentElement;
class HTMLFormElement;
class HTMLImageLoader;
class HTMLMapElement;
class Image;

struct ImageCandidate;

enum class ReferrerPolicy : uint8_t;
enum class RelevantMutation : bool;
enum class RequestPriority : uint8_t;

class HTMLImageElement
    : public HTMLElement
#if ENABLE(ATTACHMENT_ELEMENT)
    , public AttachmentAssociatedElement
#endif
    , public FormAssociatedElement
    , public ActiveDOMObject {
    WTF_MAKE_TZONE_OR_ISO_ALLOCATED(HTMLImageElement);
    WTF_OVERRIDE_DELETE_FOR_CHECKED_PTR(HTMLImageElement);
public:
    static Ref<HTMLImageElement> create(Document&);
    static Ref<HTMLImageElement> create(const QualifiedName&, Document&, HTMLFormElement* = nullptr);
    static Ref<HTMLImageElement> createForLegacyFactoryFunction(Document&, std::optional<unsigned> width, std::optional<unsigned> height);

    virtual ~HTMLImageElement();

    // ActiveDOMObject.
    void ref() const final { HTMLElement::ref(); }
    void deref() const final { HTMLElement::deref(); }

    void formOwnerRemovedFromTree(const Node& formRoot);

    WEBCORE_EXPORT unsigned width();
    WEBCORE_EXPORT unsigned height();

    WEBCORE_EXPORT unsigned naturalWidth() const;
    WEBCORE_EXPORT unsigned naturalHeight() const;
    const URL& currentURL() const { return m_currentURL; }
    WEBCORE_EXPORT const AtomString& currentSrc();

    bool isServerMap() const;

    const AtomString& altText() const;

    CompositeOperator compositeOperator() const { return m_compositeOperator; }

    WEBCORE_EXPORT CachedImage* cachedImage() const;

    void setLoadManually(bool);

    bool matchesUsemap(const AtomString&) const;
    RefPtr<HTMLMapElement> associatedMapElement() const;

    WEBCORE_EXPORT const AtomString& alt() const;

    WEBCORE_EXPORT void setHeight(unsigned);

    URL src() const;
    void setSrc(const AtomString&);

    WEBCORE_EXPORT void setCrossOrigin(const AtomString&);
    WEBCORE_EXPORT String crossOrigin() const;

    WEBCORE_EXPORT void setWidth(unsigned);

    WEBCORE_EXPORT int x() const;
    WEBCORE_EXPORT int y() const;

    WEBCORE_EXPORT bool complete() const;

    void setDecoding(AtomString&&);
    String decoding() const;

    DecodingMode decodingMode() const;
    
    WEBCORE_EXPORT void decode(Ref<DeferredPromise>&&);

#if PLATFORM(IOS_FAMILY)
    bool willRespondToMouseClickEventsWithEditability(Editability) const override;

    enum class IgnoreTouchCallout : bool { No, Yes };
    bool willRespondToMouseClickEventsWithEditability(Editability, IgnoreTouchCallout) const;
#endif

#if ENABLE(ATTACHMENT_ELEMENT)
    void setAttachmentElement(Ref<HTMLAttachmentElement>&&) final;
#endif

    WEBCORE_EXPORT size_t pendingDecodePromisesCountForTesting() const;

    bool canContainRangeEndPoint() const override { return false; }

    const AtomString& imageSourceURL() const override;
    
#if ENABLE(SERVICE_CONTROLS)
    bool isImageMenuEnabled() const { return m_isImageMenuEnabled; }
    void setImageMenuEnabled(bool value) { m_isImageMenuEnabled = value; }
#endif

    HTMLPictureElement* pictureElement() const;
    void setPictureElement(HTMLPictureElement*);

#if USE(SYSTEM_PREVIEW)
    WEBCORE_EXPORT bool isSystemPreviewImage() const;
#endif

#if ENABLE(MULTI_REPRESENTATION_HEIC)
    bool isMultiRepresentationHEIC() const;
#endif

    void loadDeferredImage();

    AtomString srcsetForBindings() const;
    void setSrcsetForBindings(const AtomString&);

    bool usesSrcsetOrPicture() const;

    const AtomString& loadingForBindings() const;
    void setLoadingForBindings(const AtomString&);

    bool isLazyLoadable() const;
    static bool hasLazyLoadableAttributeValue(StringView);

    bool isDeferred() const;

    bool isDroppedImagePlaceholder() const { return m_isDroppedImagePlaceholder; }
    void setIsDroppedImagePlaceholder() { m_isDroppedImagePlaceholder = true; }

    void evaluateDynamicMediaQueryDependencies();

    void setReferrerPolicyForBindings(const AtomString&);
    String referrerPolicyForBindings() const;
    ReferrerPolicy referrerPolicy() const;

    bool allowsOrientationOverride() const;

    bool allowsAnimation() const;
#if ENABLE(ACCESSIBILITY_ANIMATION_CONTROL)
    WEBCORE_EXPORT void setAllowsAnimation(std::optional<bool>);
#endif

    void setFetchPriorityForBindings(const AtomString&);
    String fetchPriorityForBindings() const;
    RequestPriority fetchPriorityHint() const;

    bool originClean(const SecurityOrigin&) const;

    Image* image() const;

protected:
    HTMLImageElement(const QualifiedName&, Document&, HTMLFormElement* = nullptr);

    void didMoveToNewDocument(Document& oldDocument, Document& newDocument) override;

private:
    void resetFormOwner() final;
    void refFormAssociatedElement() const final { HTMLElement::ref(); }
    void derefFormAssociatedElement() const final { HTMLElement::deref(); }
    void setFormInternal(RefPtr<HTMLFormElement>&&) final;

    void attributeChanged(const QualifiedName&, const AtomString& oldValue, const AtomString& newValue, AttributeModificationReason) final;
    bool hasPresentationalHintsForAttribute(const QualifiedName&) const override;
    void collectPresentationalHintsForAttribute(const QualifiedName&, const AtomString&, MutableStyleProperties&) override;
    void invalidateAttributeMapping();
    void collectExtraStyleForPresentationalHints(MutableStyleProperties&) override;

    Ref<Element> cloneElementWithoutAttributesAndChildren(TreeScope&) final;

    // ActiveDOMObject.
    bool virtualHasPendingActivity() const final;

    void didAttachRenderers() override;
    RenderPtr<RenderElement> createElementRenderer(RenderStyle&&, const RenderTreePosition&) override;
    bool isReplaced(const RenderStyle&) const final;
    void setBestFitURLAndDPRFromImageCandidate(const ImageCandidate&);

    bool canStartSelection() const override;

    bool isURLAttribute(const Attribute&) const override;
    bool attributeContainsURL(const Attribute&) const override;
    String completeURLsInAttributeValue(const URL& base, const Attribute&, ResolveURLs = ResolveURLs::Yes) const override;
    Attribute replaceURLsInAttributeValue(const Attribute&, const UncheckedKeyHashMap<String, String>&) const override;

    bool isDraggableIgnoringAttributes() const final { return true; }

    void addSubresourceAttributeURLs(ListHashSet<URL>&) const override;
    void addCandidateSubresourceURLs(ListHashSet<URL>&) const override;

    InsertedIntoAncestorResult insertedIntoAncestor(InsertionType, ContainerNode&) override;
    void removedFromAncestor(RemovalType, ContainerNode&) override;

    bool isFormListedElement() const final { return false; }
    FormAssociatedElement* asFormAssociatedElement() final { return this; }
    HTMLImageElement& asHTMLElement() final { return *this; }
    const HTMLImageElement& asHTMLElement() const final { return *this; }

#if ENABLE(ATTACHMENT_ELEMENT)
    void refAttachmentAssociatedElement() const final { HTMLElement::ref(); }
    void derefAttachmentAssociatedElement() const final { HTMLElement::deref(); }

    AttachmentAssociatedElement* asAttachmentAssociatedElement() final { return this; }

    AttachmentAssociatedElementType attachmentAssociatedElementType() const final { return AttachmentAssociatedElementType::Image; };
#endif

    bool isInteractiveContent() const final;

    void selectImageSource(RelevantMutation);

    ImageCandidate bestFitSourceFromPictureElement();

    void copyNonAttributePropertiesFromElement(const Element&) final;

    float effectiveImageDevicePixelRatio() const;
    
#if ENABLE(SERVICE_CONTROLS)
    bool childShouldCreateRenderer(const Node&) const override;
#endif

    HTMLSourceElement* sourceElement() const;
    void setSourceElement(HTMLSourceElement*);

    IntersectionObserverData& ensureIntersectionObserverData() final;
    IntersectionObserverData* intersectionObserverDataIfExists() final;

    std::unique_ptr<HTMLImageLoader> m_imageLoader;
    std::unique_ptr<IntersectionObserverData> m_intersectionObserverData;

    AtomString m_bestFitImageURL;
    URL m_currentURL;
    AtomString m_currentSrc;
    AtomString m_parsedUsemap;
    CompositeOperator m_compositeOperator;
    float m_imageDevicePixelRatio;
#if ENABLE(SERVICE_CONTROLS)
    bool m_isImageMenuEnabled { false };
#endif
    bool m_hadNameBeforeAttributeChanged { false }; // FIXME: We only need this because parseAttribute() can't see the old value.
    bool m_isDroppedImagePlaceholder { false };

    WeakPtr<HTMLPictureElement, WeakPtrImplWithEventTargetData> m_pictureElement;
    // The source element that was selected to provide the source URL.
    WeakPtr<HTMLSourceElement, WeakPtrImplWithEventTargetData> m_sourceElement;

    Vector<MQ::MediaQueryResult> m_dynamicMediaQueryResults;

    friend class HTMLPictureElement;
};

} //namespace
