/*
 * Copyright (C) 2018-2021 Apple Inc. All rights reserved.
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

#if ENABLE(WEB_AUTHN)
#include "AttestationConveyancePreference.h"
#include "AuthenticationExtensionsClientInputs.h"
#include "AuthenticatorSelectionCriteria.h"
#include "BufferSource.h"
#include "IDLTypes.h"
#include "PublicKeyCredentialDescriptor.h"
#include "PublicKeyCredentialParameters.h"
#include "PublicKeyCredentialRpEntity.h"
#include "PublicKeyCredentialType.h"
#include "PublicKeyCredentialUserEntity.h"
#include "ResidentKeyRequirement.h"
#include "UserVerificationRequirement.h"
#include <wtf/Forward.h>
#endif // ENABLE(WEB_AUTHN)

namespace WebCore {

enum class AuthenticatorAttachment : uint8_t;

struct PublicKeyCredentialCreationOptions {
#if ENABLE(WEB_AUTHN)
    PublicKeyCredentialRpEntity rp;
    PublicKeyCredentialUserEntity user;

    BufferSource challenge;
    mutable Vector<PublicKeyCredentialParameters> pubKeyCredParams;

    std::optional<unsigned> timeout;
    Vector<PublicKeyCredentialDescriptor> excludeCredentials;
    std::optional<AuthenticatorSelectionCriteria> authenticatorSelection;
    AttestationConveyancePreference attestation;
    mutable std::optional<AuthenticationExtensionsClientInputs> extensions;
#endif // ENABLE(WEB_AUTHN)
};

} // namespace WebCore
