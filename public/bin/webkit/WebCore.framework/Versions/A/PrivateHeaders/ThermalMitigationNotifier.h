/*
 * Copyright (C) 2023 Apple Inc. All rights reserved.
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

#include <wtf/Function.h>
#include <wtf/TZoneMalloc.h>
#include <wtf/WeakPtr.h>

#if HAVE(APPLE_THERMAL_MITIGATION_SUPPORT)
#include <wtf/RetainPtr.h>
OBJC_CLASS WebThermalMitigationObserver;
#endif

namespace WebCore {
class ThermalMitigationNotifier;
}

namespace WTF {
template<typename T> struct IsDeprecatedWeakRefSmartPointerException;
template<> struct IsDeprecatedWeakRefSmartPointerException<WebCore::ThermalMitigationNotifier> : std::true_type { };
}

namespace WebCore {

class ThermalMitigationNotifier : public CanMakeWeakPtr<ThermalMitigationNotifier> {
    WTF_MAKE_TZONE_ALLOCATED_EXPORT(ThermalMitigationNotifier, WEBCORE_EXPORT);
public:
    using ThermalMitigationChangeCallback = Function<void(bool thermalMitigationEnabled)>;
    WEBCORE_EXPORT explicit ThermalMitigationNotifier(ThermalMitigationChangeCallback&&);
    WEBCORE_EXPORT ~ThermalMitigationNotifier();

    WEBCORE_EXPORT bool thermalMitigationEnabled() const;
    WEBCORE_EXPORT static bool isThermalMitigationEnabled();

private:
#if HAVE(APPLE_THERMAL_MITIGATION_SUPPORT)
    void notifyThermalMitigationChanged(bool);
    friend void notifyThermalMitigationChanged(ThermalMitigationNotifier&, bool);

    RetainPtr<WebThermalMitigationObserver> m_observer;
    ThermalMitigationChangeCallback m_callback;
#endif
};

}
