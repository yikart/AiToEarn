/*
 * Copyright (C) 2015-2020 Apple Inc. All rights reserved.
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

#include "IDBIndexIdentifier.h"
#include "IDBObjectStoreIdentifier.h"
#include "IDBRequest.h"
#include "IDBRequestData.h"
#include "IDBResourceIdentifier.h"
#include "IDBResultData.h"
#include "IDBTransaction.h"
#include <optional>
#include <wtf/Function.h>
#include <wtf/MainThread.h>
#include <wtf/Markable.h>
#include <wtf/Threading.h>

namespace WebCore {

class IDBResultData;

namespace IndexedDB {
enum class IndexRecordType : bool;
}

namespace IDBClient {

class TransactionOperation : public ThreadSafeRefCounted<TransactionOperation> {
    WTF_MAKE_TZONE_OR_ISO_ALLOCATED(TransactionOperation);
    friend IDBRequestData::IDBRequestData(TransactionOperation&);
public:
    virtual ~TransactionOperation()
    {
        ASSERT(canCurrentThreadAccessThreadLocalData(originThread()));
    }

    void perform()
    {
        ASSERT(canCurrentThreadAccessThreadLocalData(originThread()));
        ASSERT(m_performFunction);
        m_performFunction();
        m_performFunction = { };
    }

    void transitionToCompleteOnThisThread(const IDBResultData& data)
    {
        ASSERT(canCurrentThreadAccessThreadLocalData(originThread()));
        m_transaction->operationCompletedOnServer(data, *this);
    }

    void transitionToComplete(const IDBResultData& data, RefPtr<TransactionOperation>&& lastRef)
    {
        ASSERT(isMainThread());

        if (canCurrentThreadAccessThreadLocalData(originThread()))
            transitionToCompleteOnThisThread(data);
        else {
            m_transaction->performCallbackOnOriginThread(*this, &TransactionOperation::transitionToCompleteOnThisThread, data);
            m_transaction->callFunctionOnOriginThread([lastRef = WTFMove(lastRef)]() {
            });
        }
    }

    void doComplete(const IDBResultData& data)
    {
        ASSERT(canCurrentThreadAccessThreadLocalData(originThread()));

        if (m_performFunction)
            m_performFunction = { };

        // Due to race conditions between the server sending an "operation complete" message and the client
        // forcefully aborting an operation, it's unavoidable that this method might be called twice.
        // It's okay to handle that gracefully with an early return.
        if (m_didComplete)
            return;
        m_didComplete = true;

        if (m_completeFunction) {
            m_completeFunction(data);
            // m_completeFunction should not hold ref to this TransactionOperation after its execution.
            m_completeFunction = { };
        }
        m_transaction->operationCompletedOnClient(*this);
    }

    const IDBResourceIdentifier& identifier() const { return m_identifier; }

    Thread& originThread() const { return m_originThread.get(); }

    IDBRequest* idbRequest() { return m_idbRequest.get(); }

    bool nextRequestCanGoToServer() const { return m_nextRequestCanGoToServer && m_idbRequest; }
    void setNextRequestCanGoToServer(bool nextRequestCanGoToServer) { m_nextRequestCanGoToServer = nextRequestCanGoToServer; }

    uint64_t operationID() const { return m_operationID; }

protected:
    TransactionOperation(IDBTransaction& transaction)
        : m_transaction(transaction)
        , m_identifier(transaction.connectionProxy())
        , m_operationID(transaction.generateOperationID())
    {
    }

    TransactionOperation(IDBTransaction&, IDBRequest&);

    Ref<IDBTransaction> m_transaction;
    IDBResourceIdentifier m_identifier;
    Markable<IDBObjectStoreIdentifier> m_objectStoreIdentifier;
    Markable<IDBIndexIdentifier> m_indexIdentifier;
    std::optional<IDBResourceIdentifier> m_cursorIdentifier;
    IndexedDB::IndexRecordType m_indexRecordType { IndexedDB::IndexRecordType::Key };
    Function<void()> m_performFunction;
    Function<void(const IDBResultData&)> m_completeFunction;

private:
    IDBResourceIdentifier transactionIdentifier() const { return m_transaction->info().identifier(); }
    std::optional<IDBObjectStoreIdentifier> objectStoreIdentifier() const { return m_objectStoreIdentifier; }
    std::optional<IDBIndexIdentifier> indexIdentifier() const { return m_indexIdentifier; }
    std::optional<IDBResourceIdentifier> cursorIdentifier() const { return m_cursorIdentifier; }
    IDBTransaction& transaction() { return m_transaction.get(); }
    IndexedDB::IndexRecordType indexRecordType() const { return m_indexRecordType; }

    Ref<Thread> m_originThread { Thread::current() };
    RefPtr<IDBRequest> m_idbRequest;
    bool m_nextRequestCanGoToServer { true };
    bool m_didComplete { false };

    uint64_t m_operationID { 0 };
};

class TransactionOperationImpl final : public TransactionOperation {
    WTF_MAKE_TZONE_OR_ISO_ALLOCATED(TransactionOperationImpl);
public:
    template<typename... Args> static Ref<TransactionOperationImpl> create(Args&&... args) { return adoptRef(*new TransactionOperationImpl(std::forward<Args>(args)...)); }
private:
    TransactionOperationImpl(IDBTransaction& transaction, Function<void(const IDBResultData&)> completeMethod, Function<void(TransactionOperation&)> performMethod)
        : TransactionOperation(transaction)
    {
        ASSERT(performMethod);
        m_performFunction = [protectedThis = Ref { *this }, performMethod = WTFMove(performMethod)] {
            performMethod(protectedThis.get());
        };

        if (completeMethod) {
            m_completeFunction = [protectedThis = Ref { *this }, completeMethod = WTFMove(completeMethod)] (const IDBResultData& resultData) {
                completeMethod(resultData);
            };
        }
    }

    TransactionOperationImpl(IDBTransaction& transaction, IDBRequest& request, Function<void(const IDBResultData&)> completeMethod, Function<void(TransactionOperation&)> performMethod)
        : TransactionOperation(transaction, request)
    {
        ASSERT(performMethod);
        m_performFunction = [protectedThis = Ref { *this }, performMethod = WTFMove(performMethod)] {
            performMethod(protectedThis.get());
        };

        if (completeMethod) {
            m_completeFunction = [protectedThis = Ref { *this }, completeMethod = WTFMove(completeMethod)] (const IDBResultData& resultData) {
                completeMethod(resultData);
            };
        }
    }
};

} // namespace IDBClient
} // namespace WebCore
