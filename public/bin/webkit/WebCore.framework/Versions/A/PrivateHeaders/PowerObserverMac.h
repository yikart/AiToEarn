/*
 * Copyright (C) 2006, 2010, 2015 Apple Inc. All rights reserved.
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

#ifndef PowerObserverMac_h
#define PowerObserverMac_h

#import <IOKit/IOMessage.h>
#import <IOKit/pwr_mgt/IOPMLib.h>
#import <wtf/Function.h>
#import <wtf/Noncopyable.h>
#import <wtf/OSObjectPtr.h>
#import <wtf/TZoneMalloc.h>
#import <wtf/WeakPtr.h>

namespace WebCore {
class PowerObserver;
}

namespace WTF {
template<typename T> struct IsDeprecatedWeakRefSmartPointerException;
template<> struct IsDeprecatedWeakRefSmartPointerException<WebCore::PowerObserver> : std::true_type { };
}

namespace WebCore {

class PowerObserver : public CanMakeWeakPtr<PowerObserver, WeakPtrFactoryInitialization::Eager> {
    WTF_MAKE_TZONE_ALLOCATED_EXPORT(PowerObserver, WEBCORE_EXPORT);
    WTF_MAKE_NONCOPYABLE(PowerObserver);

public:
    WEBCORE_EXPORT PowerObserver(Function<void()>&& powerOnHander);
    WEBCORE_EXPORT ~PowerObserver();

private:
    void didReceiveSystemPowerNotification(io_service_t, uint32_t messageType, void* messageArgument);

    Function<void()> m_powerOnHander;
    io_connect_t m_powerConnection;
    IONotificationPortRef m_notificationPort;
    io_object_t m_notifierReference;
    OSObjectPtr<dispatch_queue_t> m_dispatchQueue;
};

} // namespace WebCore

#endif // PowerObserverMac_h

