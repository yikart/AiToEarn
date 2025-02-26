/*
 * Copyright (C) 2022 Apple Inc. All rights reserved.
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

#include "IDBDatabaseIdentifier.h"
#include <wtf/WeakPtr.h>

namespace WebCore {
namespace IDBServer {
class UniqueIDBDatabaseManager;
}
}

namespace WTF {
template<typename T> struct IsDeprecatedWeakRefSmartPointerException;
template<> struct IsDeprecatedWeakRefSmartPointerException<WebCore::IDBServer::UniqueIDBDatabaseManager> : std::true_type { };
}

namespace WebCore {

struct ClientOrigin;

namespace IDBServer {

class IDBBackingStore;
class UniqueIDBDatabaseConnection;
class UniqueIDBDatabaseTransaction;

class UniqueIDBDatabaseManager : public CanMakeWeakPtr<UniqueIDBDatabaseManager> {
    WTF_MAKE_TZONE_NONALLOCATABLE(UniqueIDBDatabaseManager);
public:
    virtual ~UniqueIDBDatabaseManager() { }
    virtual void registerConnection(UniqueIDBDatabaseConnection&) = 0;
    virtual void unregisterConnection(UniqueIDBDatabaseConnection&) = 0;
    virtual void registerTransaction(UniqueIDBDatabaseTransaction&) = 0;
    virtual void unregisterTransaction(UniqueIDBDatabaseTransaction&) = 0;
    virtual std::unique_ptr<IDBBackingStore> createBackingStore(const IDBDatabaseIdentifier&) = 0;
    virtual void requestSpace(const ClientOrigin&, uint64_t size, CompletionHandler<void(bool)>&&) = 0;
};

} // namespace IDBServer

} // namespace WebCore
