/*
 * Copyright (C) 2020 Darryl Pogue (darryl@dpogue.ca)
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

#include "IDBActiveDOMObject.h"
#include "IDBDatabaseNameAndVersion.h"
#include "IDBResourceIdentifier.h"
#include <wtf/Forward.h>
#include <wtf/Function.h>
#include <wtf/Ref.h>
#include <wtf/TZoneMalloc.h>
#include <wtf/ThreadSafeRefCounted.h>

namespace WebCore {

class ScriptExecutionContext;

namespace IDBClient {
class IDBConnectionProxy;
}

class WEBCORE_EXPORT IDBDatabaseNameAndVersionRequest final : public ThreadSafeRefCounted<IDBDatabaseNameAndVersionRequest>, public IDBActiveDOMObject {
    WTF_MAKE_TZONE_OR_ISO_ALLOCATED_EXPORT(IDBDatabaseNameAndVersionRequest, WEBCORE_EXPORT);
public:
    using InfoCallback = Function<void(std::optional<Vector<IDBDatabaseNameAndVersion>>&&)>;

    static Ref<IDBDatabaseNameAndVersionRequest> create(ScriptExecutionContext&, IDBClient::IDBConnectionProxy&, InfoCallback&&);

    ~IDBDatabaseNameAndVersionRequest();

    const IDBResourceIdentifier& resourceIdentifier() const;

    // ActiveDOMObject.
    void ref() const final { ThreadSafeRefCounted::ref(); }
    void deref() const final { ThreadSafeRefCounted::deref(); }

    void complete(std::optional<Vector<IDBDatabaseNameAndVersion>>&&);

private:
    IDBDatabaseNameAndVersionRequest(ScriptExecutionContext&, IDBClient::IDBConnectionProxy&, InfoCallback&&);

    // ActiveDOMObject.
    bool virtualHasPendingActivity() const final;
    void stop() final;

    Ref<IDBClient::IDBConnectionProxy> m_connectionProxy;
    IDBResourceIdentifier m_resourceIdentifier;
    InfoCallback m_callback;
};

inline const IDBResourceIdentifier& IDBDatabaseNameAndVersionRequest::resourceIdentifier() const
{
    return m_resourceIdentifier;
}

inline IDBDatabaseNameAndVersionRequest::~IDBDatabaseNameAndVersionRequest()
{
    ASSERT(canCurrentThreadAccessThreadLocalData(originThread()));
}

} // namespace WebCore
