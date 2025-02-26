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

#include "BackgroundFetchFailureReason.h"
#include "BackgroundFetchResult.h"
#include "ServiceWorkerTypes.h"

namespace WebCore {

struct BackgroundFetchInformation {
    BackgroundFetchInformation isolatedCopy() const & { return { registrationIdentifier, identifier.isolatedCopy(), uploadTotal, uploaded, downloadTotal, downloaded, result, failureReason, recordsAvailable }; }
    BackgroundFetchInformation isolatedCopy() && { return { registrationIdentifier, WTFMove(identifier).isolatedCopy(), uploadTotal, uploaded, downloadTotal, downloaded, result, failureReason, recordsAvailable }; }

    ServiceWorkerRegistrationIdentifier registrationIdentifier;
    String identifier;
    uint64_t uploadTotal { 0 };
    uint64_t uploaded { 0 };
    uint64_t downloadTotal { 0 };
    uint64_t downloaded { 0 };
    BackgroundFetchResult result { BackgroundFetchResult::EmptyString };
    BackgroundFetchFailureReason failureReason { BackgroundFetchFailureReason::EmptyString };
    bool recordsAvailable { true };
};

} // namespace WebCore
