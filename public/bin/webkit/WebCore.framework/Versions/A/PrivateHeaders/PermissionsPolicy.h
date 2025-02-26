/*
 * Copyright (C) 2019 Apple Inc. All rights reserved.
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

#include "Allowlist.h"
#include <wtf/HashSet.h>
#include <wtf/HashTraits.h>
#include <wtf/TZoneMalloc.h>
#include <wtf/text/StringHash.h>

namespace WebCore {

class Allowlist;
class Document;
class HTMLFrameOwnerElement;
class HTMLIFrameElement;
struct OwnerPermissionsPolicyData;

class PermissionsPolicy {
    WTF_MAKE_TZONE_ALLOCATED(PermissionsPolicy);
public:
    PermissionsPolicy();
    PermissionsPolicy(const Document&);

    enum class Feature : uint8_t {
        Camera = 0,
        Microphone,
        SpeakerSelection,
        DisplayCapture,
        Gamepad,
        Geolocation,
        Payment,
        ScreenWakeLock,
        SyncXHR,
        Fullscreen,
        WebShare,
#if ENABLE(DEVICE_ORIENTATION)
        Gyroscope,
        Accelerometer,
        Magnetometer,
#endif
#if ENABLE(WEB_AUTHN)
        PublickeyCredentialsGetRule,
        DigitalCredentialsGetRule,
#endif
#if ENABLE(WEBXR)
        XRSpatialTracking,
#endif
        PrivateToken,
        Invalid
    };
    enum class ShouldReportViolation : bool { No, Yes };
    static bool isFeatureEnabled(Feature, const Document&, ShouldReportViolation = ShouldReportViolation::Yes);
    bool inheritedPolicyValueForFeature(Feature) const;

    // InheritedPolicy contains enabled features.
    using InheritedPolicy = HashSet<Feature, IntHash<Feature>, WTF::StrongEnumHashTraits<Feature>>;
    PermissionsPolicy(const InheritedPolicy& inheritedPolicy)
        : m_inheritedPolicy(inheritedPolicy)
    {
    }
    InheritedPolicy inheritedPolicy() const { return m_inheritedPolicy; }

    // https://w3c.github.io/webappsec-permissions-policy/#policy-directives
    using PolicyDirective = HashMap<Feature, Allowlist, IntHash<Feature>, WTF::StrongEnumHashTraits<Feature>>;
    static PolicyDirective processPermissionsPolicyAttribute(const HTMLIFrameElement&);

private:
    bool computeInheritedPolicyValueInContainer(Feature, const std::optional<OwnerPermissionsPolicyData>&, const SecurityOriginData&) const;

    InheritedPolicy m_inheritedPolicy;
};

} // namespace WebCore
