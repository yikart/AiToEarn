/*
 * Copyright (C) 2024 Apple Inc. All rights reserved.
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

#include <wtf/OptionSet.h>

namespace WebCore {

enum class SandboxFlag : uint16_t {
    // See http://www.whatwg.org/specs/web-apps/current-work/#attr-iframe-sandbox for a list of the sandbox flags.
    Navigation           = 1,
    Plugins              = 1 << 1,
    Origin               = 1 << 2,
    Forms                = 1 << 3,
    Scripts              = 1 << 4,
    TopNavigation        = 1 << 5,
    Popups               = 1 << 6, // See https://www.w3.org/Bugs/Public/show_bug.cgi?id=12393
    AutomaticFeatures    = 1 << 7,
    PointerLock          = 1 << 8,
    PropagatesToAuxiliaryBrowsingContexts = 1 << 9,
    TopNavigationByUserActivation = 1 << 10,
    DocumentDomain       = 1 << 11,
    Modals               = 1 << 12,
    StorageAccessByUserActivation = 1 << 13,
    TopNavigationToCustomProtocols = 1 << 14,
    Downloads = 1 << 15
};

using SandboxFlags = OptionSet<SandboxFlag>;

}
