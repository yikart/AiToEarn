/*
 * Copyright (C) 2017 Apple Inc. All rights reserved.
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

#include "ProcessIdentifier.h"
#include "ProcessQualified.h"
#include "ScriptBuffer.h"
#include "ScriptExecutionContextIdentifier.h"
#include "ServiceWorkerIdentifier.h"
#include <variant>
#include <wtf/ObjectIdentifier.h>
#include <wtf/RobinHoodHashMap.h>
#include <wtf/URLHash.h>

namespace WebCore {

struct ServiceWorkerData;
struct ServiceWorkerClientData;

enum class ServiceWorkerRegistrationState : uint8_t {
    Installing = 0,
    Waiting = 1,
    Active = 2,
};

enum class ServiceWorkerState : uint8_t {
    Parsed,
    Installing,
    Installed,
    Activating,
    Activated,
    Redundant,
};

enum class ServiceWorkerClientFrameType : uint8_t {
    Auxiliary,
    TopLevel,
    Nested,
    None
};

enum class ServiceWorkerIsInspectable : bool { No, Yes };
enum class ShouldNotifyWhenResolved : bool { No, Yes };

enum class ServiceWorkerRegistrationIdentifierType { };
using ServiceWorkerRegistrationIdentifier = AtomicObjectIdentifier<ServiceWorkerRegistrationIdentifierType>;

enum class ServiceWorkerJobIdentifierType { };
using ServiceWorkerJobIdentifier = AtomicObjectIdentifier<ServiceWorkerJobIdentifierType>;

enum class SWServerToContextConnectionIdentifierType { };
using SWServerToContextConnectionIdentifier = ObjectIdentifier<SWServerToContextConnectionIdentifierType>;

using SWServerConnectionIdentifierType = ProcessIdentifierType;
using SWServerConnectionIdentifier = ObjectIdentifier<SWServerConnectionIdentifierType>;

using ServiceWorkerOrClientData = std::variant<ServiceWorkerData, ServiceWorkerClientData>;

// FIXME: It should be possible to replace ServiceWorkerOrClientIdentifier with ScriptExecutionContextIdentifier entirely.
using ServiceWorkerOrClientIdentifier = std::variant<ScriptExecutionContextIdentifier, ServiceWorkerIdentifier>;

struct ServiceWorkerScripts {
    ServiceWorkerScripts isolatedCopy() const
    {
        MemoryCompactRobinHoodHashMap<WTF::URL, ScriptBuffer> isolatedImportedScripts;
        for (auto& [url, script] : importedScripts)
            isolatedImportedScripts.add(url.isolatedCopy(), script.isolatedCopy());
        return { identifier, mainScript.isolatedCopy(), WTFMove(isolatedImportedScripts) };
    }

    ServiceWorkerIdentifier identifier;
    ScriptBuffer mainScript;
    MemoryCompactRobinHoodHashMap<WTF::URL, ScriptBuffer> importedScripts;
};

} // namespace WebCore
