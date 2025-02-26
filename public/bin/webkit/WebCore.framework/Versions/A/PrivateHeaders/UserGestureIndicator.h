/*
 * Copyright (C) 2010-2017 Apple Inc. All rights reserved.
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

#include "DOMPasteAccess.h"
#include <wtf/Function.h>
#include <wtf/MonotonicTime.h>
#include <wtf/Noncopyable.h>
#include <wtf/RefCountedAndCanMakeWeakPtr.h>
#include <wtf/TZoneMalloc.h>
#include <wtf/UUID.h>
#include <wtf/Vector.h>
#include <wtf/WeakHashSet.h>
#include <wtf/WeakPtr.h>

namespace WebCore {

class Document;
class WeakPtrImplWithEventTargetData;

enum class IsProcessingUserGesture : uint8_t { No, Yes, Potentially };

enum class CanRequestDOMPaste : bool { No, Yes };
enum class UserGestureType : uint8_t { EscapeKey, ActivationTriggering, Other };

class UserGestureToken : public RefCountedAndCanMakeWeakPtr<UserGestureToken> {
public:
    static constexpr Seconds maximumIntervalForUserGestureForwarding { 1_s }; // One second matches Gecko.
    static const Seconds& maximumIntervalForUserGestureForwardingForFetch();
    WEBCORE_EXPORT static void setMaximumIntervalForUserGestureForwardingForFetchForTesting(Seconds);

    static Ref<UserGestureToken> create(IsProcessingUserGesture isProcessingUserGesture, UserGestureType gestureType, Document* document = nullptr, std::optional<WTF::UUID> authorizationToken = std::nullopt, CanRequestDOMPaste canRequestDOMPaste = CanRequestDOMPaste::Yes)
    {
        return adoptRef(*new UserGestureToken(isProcessingUserGesture, gestureType, document, authorizationToken, canRequestDOMPaste));
    }

    WEBCORE_EXPORT ~UserGestureToken();

    IsProcessingUserGesture isProcessingUserGesture() const { return m_isProcessingUserGesture; }
    bool processingUserGesture() const { return m_scope == GestureScope::All && m_isProcessingUserGesture == IsProcessingUserGesture::Yes; }
    bool processingUserGestureForMedia() const { return m_isProcessingUserGesture == IsProcessingUserGesture::Yes || m_isProcessingUserGesture == IsProcessingUserGesture::Potentially; }
    UserGestureType gestureType() const { return m_gestureType; }

    void addDestructionObserver(Function<void(UserGestureToken&)>&& observer)
    {
        m_destructionObservers.append(WTFMove(observer));
    }

    DOMPasteAccessPolicy domPasteAccessPolicy() const { return m_domPasteAccessPolicy; }
    void didRequestDOMPasteAccess(DOMPasteAccessResponse response)
    {
        switch (response) {
        case DOMPasteAccessResponse::DeniedForGesture:
            m_domPasteAccessPolicy = DOMPasteAccessPolicy::Denied;
            break;
        case DOMPasteAccessResponse::GrantedForCommand:
            break;
        case DOMPasteAccessResponse::GrantedForGesture:
            m_domPasteAccessPolicy = DOMPasteAccessPolicy::Granted;
            break;
        }
    }
    void resetDOMPasteAccess() { m_domPasteAccessPolicy = DOMPasteAccessPolicy::NotRequestedYet; }

    enum class GestureScope { All, MediaOnly };
    void setScope(GestureScope scope) { m_scope = scope; }
    void resetScope() { m_scope = GestureScope::All; }

    // Expand the following methods if more propagation sources are added later.
    enum class IsPropagatedFromFetch : bool { No, Yes };
    void setIsPropagatedFromFetch(IsPropagatedFromFetch is) { m_isPropagatedFromFetch = is; }
    void resetIsPropagatedFromFetch() { m_isPropagatedFromFetch = IsPropagatedFromFetch::No; }
    bool isPropagatedFromFetch() const { return m_isPropagatedFromFetch == IsPropagatedFromFetch::Yes; }

    bool hasExpired(Seconds expirationInterval) const
    {
        return m_startTime + expirationInterval < MonotonicTime::now();
    }

    MonotonicTime startTime() const { return m_startTime; }

    std::optional<WTF::UUID> authorizationToken() const { return m_authorizationToken; }

    bool canRequestDOMPaste() const { return m_canRequestDOMPaste == CanRequestDOMPaste::Yes; }

    bool isValidForDocument(const Document&) const;

    void forEachImpactedDocument(Function<void(Document&)>&&);

private:
    UserGestureToken(IsProcessingUserGesture, UserGestureType, Document*, std::optional<WTF::UUID> authorizationToken, CanRequestDOMPaste);

    IsProcessingUserGesture m_isProcessingUserGesture = IsProcessingUserGesture::No;
    Vector<Function<void(UserGestureToken&)>> m_destructionObservers;
    UserGestureType m_gestureType;
    WeakHashSet<Document, WeakPtrImplWithEventTargetData> m_documentsImpactedByUserGesture;
    CanRequestDOMPaste m_canRequestDOMPaste { CanRequestDOMPaste::No };
    DOMPasteAccessPolicy m_domPasteAccessPolicy { DOMPasteAccessPolicy::NotRequestedYet };
    GestureScope m_scope { GestureScope::All };
    MonotonicTime m_startTime { MonotonicTime::now() };
    IsPropagatedFromFetch m_isPropagatedFromFetch { IsPropagatedFromFetch::No };
    std::optional<WTF::UUID> m_authorizationToken;
};

class UserGestureIndicator {
    WTF_MAKE_TZONE_ALLOCATED_EXPORT(UserGestureIndicator, WEBCORE_EXPORT);
    WTF_MAKE_NONCOPYABLE(UserGestureIndicator);
public:
    WEBCORE_EXPORT static RefPtr<UserGestureToken> currentUserGesture();

    WEBCORE_EXPORT static bool processingUserGesture(const Document* = nullptr);
    WEBCORE_EXPORT static bool processingUserGestureForMedia();

    // If a document is provided, its last known user gesture timestamp is updated.
    enum class ProcessInteractionStyle { Immediate, Delayed, Never };
    WEBCORE_EXPORT explicit UserGestureIndicator(std::optional<IsProcessingUserGesture>, Document* = nullptr, UserGestureType = UserGestureType::ActivationTriggering, ProcessInteractionStyle = ProcessInteractionStyle::Immediate, std::optional<WTF::UUID> authorizationToken = std::nullopt, CanRequestDOMPaste = CanRequestDOMPaste::Yes);
    WEBCORE_EXPORT explicit UserGestureIndicator(RefPtr<UserGestureToken>, UserGestureToken::GestureScope = UserGestureToken::GestureScope::All, UserGestureToken::IsPropagatedFromFetch = UserGestureToken::IsPropagatedFromFetch::No);
    WEBCORE_EXPORT ~UserGestureIndicator();

    WEBCORE_EXPORT std::optional<WTF::UUID> authorizationToken() const;

private:
    RefPtr<UserGestureToken> m_previousToken;
};

}
