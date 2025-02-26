/*
 * Copyright 2010, The Android Open Source Project
 * Copyright (C) 2012 Samsung Electronics. All rights reserved.
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

#include "Event.h"
#include "LocalDOMWindow.h"
#include "Supplementable.h"
#include "Timer.h"
#include <wtf/CheckedRef.h>
#include <wtf/HashCountedSet.h>
#include <wtf/TZoneMalloc.h>

namespace WebCore {

class DeviceClient;
class Page;

class DeviceController : public Supplement<Page>, public CanMakeCheckedPtr<DeviceController> {
    WTF_MAKE_TZONE_ALLOCATED(DeviceController);
    WTF_OVERRIDE_DELETE_FOR_CHECKED_PTR(DeviceController);
public:
    explicit DeviceController(DeviceClient&);
    virtual ~DeviceController();

    void addDeviceEventListener(LocalDOMWindow&);
    void removeDeviceEventListener(LocalDOMWindow&);
    void removeAllDeviceEventListeners(LocalDOMWindow&);
    bool hasDeviceEventListener(LocalDOMWindow&) const;

    void dispatchDeviceEvent(Event&);
    bool isActive() { return !m_listeners.isEmpty(); }
    DeviceClient& client();

    virtual bool hasLastData() { return false; }
    virtual RefPtr<Event> getLastEvent() { return nullptr; }

protected:
    void fireDeviceEvent();

    HashCountedSet<RefPtr<LocalDOMWindow>> m_listeners;
    HashCountedSet<RefPtr<LocalDOMWindow>> m_lastEventListeners;
    WeakRef<DeviceClient> m_client;
    Timer m_timer;
};

} // namespace WebCore
