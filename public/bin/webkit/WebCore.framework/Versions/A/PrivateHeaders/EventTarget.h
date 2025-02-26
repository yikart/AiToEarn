/*
 * Copyright (C) 1999 Lars Knoll (knoll@kde.org)
 *           (C) 1999 Antti Koivisto (koivisto@kde.org)
 *           (C) 2001 Dirk Mueller (mueller@kde.org)
 * Copyright (C) 2004-2021 Apple Inc. All rights reserved.
 * Copyright (C) 2006 Alexey Proskuryakov (ap@webkit.org)
 *           (C) 2007, 2008 Nikolas Zimmermann <zimmermann@kde.org>
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

#include "EventListenerMap.h"
#include "EventListenerOptions.h"
#include "EventTargetInterfaces.h"
#include "ExceptionOr.h"
#include "ScriptWrappable.h"
#include <memory>
#include <variant>
#include <wtf/CheckedPtr.h>
#include <wtf/Forward.h>
#include <wtf/TZoneMalloc.h>
#include <wtf/WeakPtr.h>

namespace JSC {
class JSValue;
class JSObject;
}

namespace WebCore {

struct AddEventListenerOptions;
class DOMWrapperWorld;
class EventTarget;
class JSEventListener;

struct EventTargetData {
    WTF_MAKE_TZONE_ALLOCATED(EventTargetData);
    WTF_MAKE_NONCOPYABLE(EventTargetData);
public:
    EventTargetData() = default;

    void clear()
    {
        eventListenerMap.clearEntriesForTearDown();
    }

    EventListenerMap eventListenerMap;
};

// Do not make WeakPtrImplWithEventTargetData a derived class of DefaultWeakPtrImpl to catch the bug which uses incorrect impl class.
class WeakPtrImplWithEventTargetData final : public WTF::WeakPtrImplBase<WeakPtrImplWithEventTargetData> {
public:
    EventTargetData& eventTargetData() { return m_eventTargetData; }
    const EventTargetData& eventTargetData() const { return m_eventTargetData; }

    template<typename T> WeakPtrImplWithEventTargetData(T* ptr) : WTF::WeakPtrImplBase<WeakPtrImplWithEventTargetData>(ptr) { }

private:
    EventTargetData m_eventTargetData;
};

class EventTarget : public ScriptWrappable, public CanMakeWeakPtrWithBitField<EventTarget, WeakPtrFactoryInitialization::Lazy, WeakPtrImplWithEventTargetData> {
    WTF_MAKE_TZONE_OR_ISO_ALLOCATED(EventTarget);
public:
    static Ref<EventTarget> create(ScriptExecutionContext&);

    inline void ref(); // Defined in Node.h.
    inline void deref(); // Defined in Node.h.

    virtual enum EventTargetInterfaceType eventTargetInterface() const = 0;
    virtual ScriptExecutionContext* scriptExecutionContext() const = 0;

    WEBCORE_EXPORT virtual bool isPaymentRequest() const;

    using AddEventListenerOptionsOrBoolean = std::variant<AddEventListenerOptions, bool>;
    WEBCORE_EXPORT void addEventListenerForBindings(const AtomString& eventType, RefPtr<EventListener>&&, AddEventListenerOptionsOrBoolean&&);
    using EventListenerOptionsOrBoolean = std::variant<EventListenerOptions, bool>;
    WEBCORE_EXPORT void removeEventListenerForBindings(const AtomString& eventType, RefPtr<EventListener>&&, EventListenerOptionsOrBoolean&&);
    WEBCORE_EXPORT ExceptionOr<bool> dispatchEventForBindings(Event&);

    WEBCORE_EXPORT virtual bool addEventListener(const AtomString& eventType, Ref<EventListener>&&, const AddEventListenerOptions&);
    WEBCORE_EXPORT virtual bool removeEventListener(const AtomString& eventType, EventListener&, const EventListenerOptions& = { });

    WEBCORE_EXPORT virtual void removeAllEventListeners();
    WEBCORE_EXPORT virtual void dispatchEvent(Event&);
    WEBCORE_EXPORT virtual void uncaughtExceptionInEventHandler();

    static const AtomString& legacyTypeForEvent(const Event&);

    // Used for legacy "onevent" attributes.
    template<typename JSMaybeErrorEventListener>
    void setAttributeEventListener(const AtomString& eventType, JSC::JSValue listener, JSC::JSObject& jsEventTarget);
    bool setAttributeEventListener(const AtomString& eventType, RefPtr<EventListener>&&, DOMWrapperWorld&);
    RefPtr<JSEventListener> attributeEventListener(const AtomString& eventType, DOMWrapperWorld&);

    bool hasEventListeners() const;
    bool hasEventListeners(const AtomString& eventType) const;
    bool hasAnyEventListeners(Vector<AtomString> eventTypes) const;
    bool hasCapturingEventListeners(const AtomString& eventType);
    bool hasActiveEventListeners(const AtomString& eventType) const;

    Vector<AtomString> eventTypes() const;
    const EventListenerVector& eventListeners(const AtomString& eventType);

    enum class EventInvokePhase { Capturing, Bubbling };
    void fireEventListeners(Event&, EventInvokePhase);

    template<typename Visitor> void visitJSEventListeners(Visitor&);
    void invalidateJSEventListeners(JSC::JSObject*);

    const EventTargetData* eventTargetData() const
    {
        if (hasEventTargetData())
            return &weakPtrFactory().impl()->eventTargetData();
        return nullptr;
    }

    EventTargetData* eventTargetData()
    {
        if (hasEventTargetData())
            return &weakPtrFactory().impl()->eventTargetData();
        return nullptr;
    }

    EventTargetData* eventTargetDataConcurrently()
    {
        bool flag = this->hasEventTargetData();
        auto fencedFlag = Dependency::fence(flag);
        if (flag)
            return &fencedFlag.consume(this)->weakPtrFactory().impl()->eventTargetData();
        return nullptr;
    }

    template<typename CallbackType>
    void enumerateEventListenerTypes(CallbackType callback) const
    {
        if (auto* data = eventTargetData())
            data->eventListenerMap.enumerateEventListenerTypes(callback);
    }

    template<typename CallbackType>
    bool containsMatchingEventListener(CallbackType callback) const
    {
        if (auto* data = eventTargetData())
            return data->eventListenerMap.containsMatchingEventListener(callback);
        return false;
    }

    bool hasEventTargetData() const { return hasEventTargetFlag(EventTargetFlag::HasEventTargetData); }
    bool isNode() const { return hasEventTargetFlag(EventTargetFlag::IsNode); }

    bool isInGCReacheableRefMap() const { return hasEventTargetFlag(EventTargetFlag::IsInGCReachableRefMap); }
    void setIsInGCReacheableRefMap(bool flag) { setEventTargetFlag(EventTargetFlag::IsInGCReachableRefMap, flag); }

    bool hasValidQuerySelectorAllResults() const { return hasEventTargetFlag(EventTargetFlag::HasValidQuerySelectorAllResults); }
    void setHasValidQuerySelectorAllResults(bool flag) { setEventTargetFlag(EventTargetFlag::HasValidQuerySelectorAllResults, flag); }

protected:
    enum ConstructNodeTag { ConstructNode };
    EventTarget() = default;
    EventTarget(ConstructNodeTag)
    {
        setEventTargetFlag(EventTargetFlag::IsNode, true);
    }

    WEBCORE_EXPORT virtual ~EventTarget();

    // Flags for ownership & relationship.
    enum class EventTargetFlag : uint16_t {
        HasEventTargetData = 1 << 0,
        IsNode = 1 << 1,
        IsInGCReachableRefMap = 1 << 2,
        // Node bits
        IsConnected = 1 << 3,
        IsInShadowTree = 1 << 4,
        HasBeenInUserAgentShadowTree = 1 << 5,
        HasValidQuerySelectorAllResults = 1 << 6,
        // Element bits
        HasSyntheticAttrChildNodes = 1 << 7,
        HasDuplicateAttribute = 1 << 8,
        HasLangAttr = 1 << 9,
        HasXMLLangAttr = 1 << 10,
        HasFormAssociatedCustomElementInterface = 1 << 11,
        HasShadowRootContainingSlots = 1 << 12,
        IsInTopLayer = 1 << 13,
        // 1-bit free
        // SVGElement bits
        HasPendingResources = 1 << 15,
    };

    EventTargetData& ensureEventTargetData()
    {
        if (auto* data = eventTargetData())
            return *data;
        initializeWeakPtrFactory();
        WTF::storeStoreFence();
        setEventTargetFlag(EventTargetFlag::HasEventTargetData, true);
        return weakPtrFactory().impl()->eventTargetData();
    }

    virtual void eventListenersDidChange() { }

    bool hasEventTargetFlag(EventTargetFlag flag) const { return weakPtrFactory().bitfield() & enumToUnderlyingType(flag); }
    void setEventTargetFlag(EventTargetFlag, bool = true);
    void clearEventTargetFlag(EventTargetFlag flag) { setEventTargetFlag(flag, false); }

private:
    virtual void refEventTarget() = 0;
    virtual void derefEventTarget() = 0;

    void innerInvokeEventListeners(Event&, EventListenerVector, EventInvokePhase);
};

inline bool EventTarget::hasEventListeners() const
{
    auto* data = eventTargetData();
    return data && !data->eventListenerMap.isEmpty();
}

inline bool EventTarget::hasEventListeners(const AtomString& eventType) const
{
    auto* data = eventTargetData();
    return data && data->eventListenerMap.contains(eventType);
}

inline bool EventTarget::hasAnyEventListeners(Vector<AtomString> eventTypes) const
{
    if (auto* data = eventTargetData()) {
        for (const auto& eventType : eventTypes) {
            if (data->eventListenerMap.contains(eventType))
                return true;
        }
    }
    return false;
}

inline bool EventTarget::hasCapturingEventListeners(const AtomString& eventType)
{
    auto* data = eventTargetData();
    return data && data->eventListenerMap.containsCapturing(eventType);
}

template<typename Visitor>
void EventTarget::visitJSEventListeners(Visitor& visitor)
{
    if (auto* data = eventTargetDataConcurrently())
        data->eventListenerMap.visitJSEventListeners(visitor);
}

inline void EventTarget::setEventTargetFlag(EventTargetFlag flag, bool value)
{
    auto flags = OptionSet<EventTargetFlag>::fromRaw(weakPtrFactory().bitfield());
    flags.set(flag, value);
    weakPtrFactory().setBitfield(flags.toRaw());
}

} // namespace WebCore
