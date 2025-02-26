/*
 * Copyright (C) 2021 Apple Inc. All rights reserved.
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

#include "FileSystemHandleIdentifier.h"
#include "FileSystemStorageConnection.h"
#include "WorkerFileSystemStorageConnectionCallbackIdentifier.h"
#include <wtf/WeakPtr.h>

namespace WebCore {

class WeakPtrImplWithEventTargetData;
class FileHandle;
class FileSystemSyncAccessHandle;
class WorkerGlobalScope;
class WorkerThread;

class WorkerFileSystemStorageConnection final : public FileSystemStorageConnection, public CanMakeWeakPtr<WorkerFileSystemStorageConnection, WeakPtrFactoryInitialization::Eager>  {
public:
    static Ref<WorkerFileSystemStorageConnection> create(WorkerGlobalScope&, Ref<FileSystemStorageConnection>&&);
    ~WorkerFileSystemStorageConnection();

    FileSystemStorageConnection* mainThreadConnection() const { return m_mainThreadConnection.get(); }
    void connectionClosed();
    void scopeClosed();
    void registerSyncAccessHandle(FileSystemSyncAccessHandleIdentifier, FileSystemSyncAccessHandle&);
    void closeSyncAccessHandle(FileSystemHandleIdentifier, FileSystemSyncAccessHandleIdentifier);
    std::optional<uint64_t> requestNewCapacityForSyncAccessHandle(FileSystemHandleIdentifier, FileSystemSyncAccessHandleIdentifier, uint64_t newCapacity);
    using CallbackIdentifier = WorkerFileSystemStorageConnectionCallbackIdentifier;
    void didIsSameEntry(CallbackIdentifier, ExceptionOr<bool>&&);
    void didGetHandle(CallbackIdentifier, ExceptionOr<Ref<FileSystemHandleCloseScope>>&&);
    void didResolve(CallbackIdentifier, ExceptionOr<Vector<String>>&&);
    void completeStringCallback(CallbackIdentifier, ExceptionOr<String>&&);
    void didCreateSyncAccessHandle(CallbackIdentifier, ExceptionOr<FileSystemStorageConnection::SyncAccessHandleInfo>&&);
    void completeVoidCallback(CallbackIdentifier, ExceptionOr<void>&& result);
    void didGetHandleNames(CallbackIdentifier, ExceptionOr<Vector<String>>&&);

private:
    WorkerFileSystemStorageConnection(WorkerGlobalScope&, Ref<FileSystemStorageConnection>&&);

    // FileSystemStorageConnection
    bool isWorker() const final { return true; }
    void closeHandle(FileSystemHandleIdentifier) final;
    void isSameEntry(FileSystemHandleIdentifier, FileSystemHandleIdentifier, FileSystemStorageConnection::SameEntryCallback&&) final;
    void move(FileSystemHandleIdentifier, FileSystemHandleIdentifier, const String& newName, VoidCallback&&) final;
    void getFileHandle(FileSystemHandleIdentifier, const String& name, bool createIfNecessary, FileSystemStorageConnection::GetHandleCallback&&) final;
    void getDirectoryHandle(FileSystemHandleIdentifier, const String& name, bool createIfNecessary, FileSystemStorageConnection::GetHandleCallback&&) final;
    void removeEntry(FileSystemHandleIdentifier, const String& name, bool deleteRecursively, FileSystemStorageConnection::VoidCallback&&) final;
    void resolve(FileSystemHandleIdentifier, FileSystemHandleIdentifier, FileSystemStorageConnection::ResolveCallback&&) final;
    void getHandleNames(FileSystemHandleIdentifier, GetHandleNamesCallback&&) final;
    void getHandle(FileSystemHandleIdentifier, const String& name, GetHandleCallback&&) final;
    void getFile(FileSystemHandleIdentifier, StringCallback&&) final;
    void createSyncAccessHandle(FileSystemHandleIdentifier, FileSystemStorageConnection::GetAccessHandleCallback&&) final;
    void closeSyncAccessHandle(FileSystemHandleIdentifier, FileSystemSyncAccessHandleIdentifier, EmptyCallback&&) final;
    void registerSyncAccessHandle(FileSystemSyncAccessHandleIdentifier, ScriptExecutionContextIdentifier) final { };
    void unregisterSyncAccessHandle(FileSystemSyncAccessHandleIdentifier) final;
    void invalidateAccessHandle(FileSystemSyncAccessHandleIdentifier) final;
    void requestNewCapacityForSyncAccessHandle(FileSystemHandleIdentifier, FileSystemSyncAccessHandleIdentifier, uint64_t, RequestCapacityCallback&&) final;
    void createWritable(FileSystemHandleIdentifier, bool keepExistingData, VoidCallback&&) final;
    void closeWritable(FileSystemHandleIdentifier, FileSystemWriteCloseReason, VoidCallback&&) final;
    void executeCommandForWritable(FileSystemHandleIdentifier, FileSystemWriteCommandType, std::optional<uint64_t> position, std::optional<uint64_t> size, std::span<const uint8_t> dataBytes, bool hasDataError, VoidCallback&&) final;

    WeakPtr<WorkerGlobalScope, WeakPtrImplWithEventTargetData> m_scope;
    RefPtr<FileSystemStorageConnection> m_mainThreadConnection;
    HashMap<CallbackIdentifier, FileSystemStorageConnection::SameEntryCallback> m_sameEntryCallbacks;
    HashMap<CallbackIdentifier, FileSystemStorageConnection::GetHandleCallback> m_getHandleCallbacks;
    HashMap<CallbackIdentifier, FileSystemStorageConnection::ResolveCallback> m_resolveCallbacks;
    HashMap<CallbackIdentifier, FileSystemStorageConnection::GetAccessHandleCallback> m_getAccessHandlCallbacks;
    HashMap<CallbackIdentifier, FileSystemStorageConnection::VoidCallback> m_voidCallbacks;
    HashMap<CallbackIdentifier, FileSystemStorageConnection::GetHandleNamesCallback> m_getHandleNamesCallbacks;
    HashMap<CallbackIdentifier, FileSystemStorageConnection::StringCallback> m_stringCallbacks;
    HashMap<FileSystemSyncAccessHandleIdentifier, Function<void()>> m_accessHandleInvalidationHandlers;
    HashMap<FileSystemSyncAccessHandleIdentifier, WeakPtr<FileSystemSyncAccessHandle>> m_syncAccessHandles;
};

} // namespace WebCore

SPECIALIZE_TYPE_TRAITS_BEGIN(WebCore::WorkerFileSystemStorageConnection)
    static bool isType(const WebCore::FileSystemStorageConnection& connection) { return connection.isWorker(); }
SPECIALIZE_TYPE_TRAITS_END()
