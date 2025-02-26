/*
 * Copyright (C) 2006, 2008, 2011, 2014 Apple Inc. All rights reserved.
 * Copyright (C) 2012 Research In Motion Limited. All rights reserved.
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
 * THIS SOFTWARE IS PROVIDED BY APPLE INC. ``AS IS'' AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED.  IN NO EVENT SHALL APPLE INC. OR
 * CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 * EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
 * PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 * PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY
 * OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE. 
 */

#pragma once

#include "BackForwardItemIdentifier.h"
#include "FloatRect.h"
#include "FrameIdentifier.h"
#include "FrameLoaderTypes.h"
#include "IntPoint.h"
#include "IntRect.h"
#include "LengthBox.h"
#include "PolicyContainer.h"
#include "SerializedScriptValue.h"
#include <memory>
#include <wtf/RefCountedAndCanMakeWeakPtr.h>
#include <wtf/TZoneMalloc.h>
#include <wtf/UUID.h>
#include <wtf/WeakPtr.h>
#include <wtf/text/WTFString.h>

#if PLATFORM(IOS_FAMILY)
#include "ViewportArguments.h"
#endif

#if PLATFORM(COCOA)
#import <wtf/RetainPtr.h>
typedef struct objc_object* id;
#endif

namespace WebCore {

class CachedPage;
class Document;
class FormData;
class HistoryItem;
class Image;
class ResourceRequest;

class HistoryItemClient : public RefCounted<HistoryItemClient> {
    WTF_MAKE_TZONE_ALLOCATED_EXPORT(HistoryItemClient, WEBCORE_EXPORT);
public:
    virtual ~HistoryItemClient() = default;
    virtual void historyItemChanged(const HistoryItem&) = 0;
protected:
    HistoryItemClient() = default;
};

class HistoryItem : public RefCountedAndCanMakeWeakPtr<HistoryItem> {
public:
    using Client = HistoryItemClient;
    static Ref<HistoryItem> create(Client& client, const String& urlString = { }, const String& title = { }, const String& alternateTitle = { }, std::optional<BackForwardItemIdentifier> identifier = { })
    {
        return adoptRef(*new HistoryItem(client, urlString, title, alternateTitle, identifier));
    }
    
    WEBCORE_EXPORT ~HistoryItem();

    WEBCORE_EXPORT Ref<HistoryItem> copy() const;

    const BackForwardItemIdentifier& identifier() const { return m_identifier; }
    const WTF::UUID& uuidIdentifier() const { return m_uuidIdentifier; }
    void setUUIDIdentifier(const WTF::UUID& uuidIdentifier) { m_uuidIdentifier = uuidIdentifier; }

    // Resets the HistoryItem to its initial state, as returned by create().
    void reset();

    bool operator==(const HistoryItem& other) const { return identifier() == other.identifier(); }

    WEBCORE_EXPORT const String& originalURLString() const;
    WEBCORE_EXPORT const String& urlString() const;
    WEBCORE_EXPORT const String& title() const;
    
    WEBCORE_EXPORT bool isInBackForwardCache() const;
    WEBCORE_EXPORT bool hasCachedPageExpired() const;

    WEBCORE_EXPORT void setAlternateTitle(const String&);
    WEBCORE_EXPORT const String& alternateTitle() const;
    
    WEBCORE_EXPORT URL url() const;
    WEBCORE_EXPORT URL originalURL() const;
    WEBCORE_EXPORT const String& referrer() const;
    WEBCORE_EXPORT const AtomString& target() const;
    std::optional<FrameIdentifier> frameID() const { return m_frameID; }
    
    WEBCORE_EXPORT FormData* formData();
    WEBCORE_EXPORT String formContentType() const;
    
    bool lastVisitWasFailure() const { return m_lastVisitWasFailure; }

    WEBCORE_EXPORT const IntPoint& scrollPosition() const;
    WEBCORE_EXPORT void setScrollPosition(const IntPoint&);
    void clearScrollPosition();

    WEBCORE_EXPORT bool shouldRestoreScrollPosition() const;
    WEBCORE_EXPORT void setShouldRestoreScrollPosition(bool);
    
    WEBCORE_EXPORT float pageScaleFactor() const;
    WEBCORE_EXPORT void setPageScaleFactor(float);
    
    WEBCORE_EXPORT const Vector<AtomString>& documentState() const;
    WEBCORE_EXPORT void setDocumentState(const Vector<AtomString>&);
    void clearDocumentState();

    WEBCORE_EXPORT void setShouldOpenExternalURLsPolicy(ShouldOpenExternalURLsPolicy);
    WEBCORE_EXPORT ShouldOpenExternalURLsPolicy shouldOpenExternalURLsPolicy() const;

    void setURL(const URL&);
    WEBCORE_EXPORT void setURLString(const String&);
    WEBCORE_EXPORT void setOriginalURLString(const String&);
    WEBCORE_EXPORT void setReferrer(const String&);
    WEBCORE_EXPORT void setTarget(const AtomString&);
    void setFrameID(std::optional<FrameIdentifier> frameID) { m_frameID = frameID; }
    WEBCORE_EXPORT void setTitle(const String&);
    
    WEBCORE_EXPORT void setStateObject(RefPtr<SerializedScriptValue>&&);
    SerializedScriptValue* stateObject() const { return m_stateObject.get(); }

    void setNavigationAPIStateObject(RefPtr<SerializedScriptValue>&&);
    SerializedScriptValue* navigationAPIStateObject() const { return m_navigationAPIStateObject.get(); }

    void setItemSequenceNumber(long long number) { m_itemSequenceNumber = number; }
    long long itemSequenceNumber() const { return m_itemSequenceNumber; }

    void setDocumentSequenceNumber(long long number) { m_documentSequenceNumber = number; }
    long long documentSequenceNumber() const { return m_documentSequenceNumber; }

    void setFormInfoFromRequest(const ResourceRequest&);
    WEBCORE_EXPORT void setFormData(RefPtr<FormData>&&);
    WEBCORE_EXPORT void setFormContentType(const String&);

    void setLastVisitWasFailure(bool wasFailure) { m_lastVisitWasFailure = wasFailure; }

    WEBCORE_EXPORT void addChildItem(Ref<HistoryItem>&&);
    void setChildItem(Ref<HistoryItem>&&);
    WEBCORE_EXPORT HistoryItem* childItemWithTarget(const AtomString&);
    WEBCORE_EXPORT HistoryItem* childItemWithFrameID(FrameIdentifier);
    HistoryItem* childItemWithDocumentSequenceNumber(long long number);
    WEBCORE_EXPORT const Vector<Ref<HistoryItem>>& children() const;
    void clearChildren();
    
    bool shouldDoSameDocumentNavigationTo(HistoryItem& otherItem) const;

    bool isCurrentDocument(Document&) const;
    
#if PLATFORM(COCOA)
    WEBCORE_EXPORT id viewState() const;
    WEBCORE_EXPORT void setViewState(id);
#endif

#ifndef NDEBUG
    int showTree() const;
    int showTreeWithIndent(unsigned indentLevel) const;
#endif

#if PLATFORM(IOS_FAMILY)
    FloatRect exposedContentRect() const { return m_exposedContentRect; }
    void setExposedContentRect(FloatRect exposedContentRect) { m_exposedContentRect = exposedContentRect; }

    IntRect unobscuredContentRect() const { return m_unobscuredContentRect; }
    void setUnobscuredContentRect(IntRect unobscuredContentRect) { m_unobscuredContentRect = unobscuredContentRect; }

    const FloatBoxExtent& obscuredInsets() const { return m_obscuredInsets; }
    void setObscuredInsets(const FloatBoxExtent& insets) { m_obscuredInsets = insets; }

    FloatSize minimumLayoutSizeInScrollViewCoordinates() const { return m_minimumLayoutSizeInScrollViewCoordinates; }
    void setMinimumLayoutSizeInScrollViewCoordinates(FloatSize minimumLayoutSizeInScrollViewCoordinates) { m_minimumLayoutSizeInScrollViewCoordinates = minimumLayoutSizeInScrollViewCoordinates; }

    IntSize contentSize() const { return m_contentSize; }
    void setContentSize(IntSize contentSize) { m_contentSize = contentSize; }

    float scale() const { return m_scale; }
    bool scaleIsInitial() const { return m_scaleIsInitial; }
    void setScaleIsInitial(bool scaleIsInitial) { m_scaleIsInitial = scaleIsInitial; }
    void setScale(float newScale, bool isInitial)
    {
        m_scale = newScale;
        m_scaleIsInitial = isInitial;
    }

    const ViewportArguments& viewportArguments() const { return m_viewportArguments; }
    void setViewportArguments(const ViewportArguments& viewportArguments) { m_viewportArguments = viewportArguments; }
#endif

    void notifyChanged();

    void setWasRestoredFromSession(bool wasRestoredFromSession) { m_wasRestoredFromSession = wasRestoredFromSession; }
    bool wasRestoredFromSession() const { return m_wasRestoredFromSession; }

    void setWasCreatedByJSWithoutUserInteraction(bool wasCreatedByJSWithoutUserInteraction) { m_wasCreatedByJSWithoutUserInteraction = wasCreatedByJSWithoutUserInteraction; }
    bool wasCreatedByJSWithoutUserInteraction() const { return m_wasCreatedByJSWithoutUserInteraction; }

#if !LOG_DISABLED
    String logString() const;
#endif

    const std::optional<PolicyContainer>& policyContainer() const { return m_policyContainer; }
    void setPolicyContainer(const PolicyContainer& policyContainer) { m_policyContainer = policyContainer; }

private:
    WEBCORE_EXPORT HistoryItem(Client&, const String& urlString, const String& title, const String& alternateTitle, std::optional<BackForwardItemIdentifier>);

    HistoryItem(const HistoryItem&);

    static int64_t generateSequenceNumber();

    bool hasSameDocumentTree(HistoryItem& otherItem) const;

    String m_urlString;
    String m_originalURLString;
    String m_referrer;
    AtomString m_target;
    std::optional<FrameIdentifier> m_frameID;
    String m_title;
    String m_displayTitle;

    IntPoint m_scrollPosition;
    float m_pageScaleFactor { 0 }; // 0 indicates "unset".
    Vector<AtomString> m_documentState;

    ShouldOpenExternalURLsPolicy m_shouldOpenExternalURLsPolicy { ShouldOpenExternalURLsPolicy::ShouldNotAllow };
    
    Vector<Ref<HistoryItem>> m_children;
    
    bool m_lastVisitWasFailure { false };
    bool m_wasRestoredFromSession { false };
    bool m_wasCreatedByJSWithoutUserInteraction { false };
    bool m_shouldRestoreScrollPosition { true };

    // If two HistoryItems have the same item sequence number, then they are
    // clones of one another.  Traversing history from one such HistoryItem to
    // another is a no-op.  HistoryItem clones are created for parent and
    // sibling frames when only a subframe navigates.
    int64_t m_itemSequenceNumber { generateSequenceNumber() };

    // If two HistoryItems have the same document sequence number, then they
    // refer to the same instance of a document.  Traversing history from one
    // such HistoryItem to another preserves the document.
    int64_t m_documentSequenceNumber { generateSequenceNumber() };

    // Support for HTML5 History
    RefPtr<SerializedScriptValue> m_stateObject;
    
    // Navigation API
    RefPtr<SerializedScriptValue> m_navigationAPIStateObject;

    // info used to repost form data
    RefPtr<FormData> m_formData;
    String m_formContentType;

#if PLATFORM(IOS_FAMILY)
    FloatRect m_exposedContentRect;
    IntRect m_unobscuredContentRect;
    FloatSize m_minimumLayoutSizeInScrollViewCoordinates;
    IntSize m_contentSize;
    FloatBoxExtent m_obscuredInsets;
    float m_scale { 0 }; // Note that UIWebView looks for a non-zero value, so this has to start as 0.
    bool m_scaleIsInitial { false };
    ViewportArguments m_viewportArguments;
#endif

#if PLATFORM(COCOA)
    RetainPtr<id> m_viewState;
#endif

    BackForwardItemIdentifier m_identifier;
    WTF::UUID m_uuidIdentifier;
    std::optional<PolicyContainer> m_policyContainer;
    Ref<Client> m_client;
};

} // namespace WebCore

#if ENABLE(TREE_DEBUGGING)
// Outside the WebCore namespace for ease of invocation from the debugger.
extern "C" int showTree(const WebCore::HistoryItem*);
#endif
