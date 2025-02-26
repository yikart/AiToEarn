/*
* Copyright (C) 2020-2021 Apple Inc. All rights reserved.
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

#include <optional>
#include <wtf/Function.h>

namespace WebCore {

WEBCORE_EXPORT void setSystemHasBattery(bool);
WEBCORE_EXPORT bool systemHasBattery();

WEBCORE_EXPORT void resetSystemHasAC();
WEBCORE_EXPORT void setSystemHasAC(bool);
WEBCORE_EXPORT bool systemHasAC();
WEBCORE_EXPORT std::optional<bool> cachedSystemHasAC();

class WEBCORE_EXPORT SystemBatteryStatusTestingOverrides {
public:
    static SystemBatteryStatusTestingOverrides& singleton();

    void setHasAC(std::optional<bool>&&);
    std::optional<bool> hasAC() { return m_hasAC; }

    void setHasBattery(std::optional<bool>&&);
    std::optional<bool> hasBattery() { return  m_hasBattery; }

    void setConfigurationChangedCallback(std::function<void(bool)>&&);
    void resetOverridesToDefaultValues();

private:
    std::optional<bool> m_hasBattery;
    std::optional<bool> m_hasAC;
    Function<void(bool)> m_configurationChangedCallback;
};

}
