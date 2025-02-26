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

#include "FileHandle.h"
#include "FileSystemHandleIdentifier.h"
#include "FileSystemSyncAccessHandleIdentifier.h"
#include "FileSystemWriteCloseReason.h"
#include "FileSystemWriteCommandType.h"
#include "ProcessQualified.h"
#include "ScriptExecutionContextIdentifier.h"
#include <wtf/CompletionHandler.h>
#include <wtf/ThreadSafeRefCounted.h>

namespace WebCore {

class FileSystemDirectoryHandle;
class FileSystemFileHandle;
class FileHandle;
class FileSystemHandleCloseScope;
class FileSystemSyncAccessHandle;
template<typename> class ExceptionOr;

class FileSystemStorageConnection : public ThreadSafeRefCounted<FileSystemStorageConnection> {
public:
    virtual ~FileSystemStorageConnection() { }

    using SameEntryCallback = CompletionHandler<void(ExceptionOr<bool>&&)>;
    using GetHandleCallback = CompletionHandler<void(ExceptionOr<Ref<FileSystemHandleCloseScope>>&&)>;
    using ResolveCallback = CompletionHandler<void(ExceptionOr<Vector<String>>&&)>;
    struct SyncAccessHandleInfo {
        FileSystemSyncAccessHandleIdentifier identifier;
        FileHandle file;
        uint64_t capacity { 0 };
        SyncAccessHandleInfo isolatedCopy() && { return { identifier, WTFMove(file).isolatedCopy(), capacity }; }
    };
    using GetAccessHandleCallback = CompletionHandler<void(ExceptionOr<SyncAccessHandleInfo>&&)>;
    using VoidCallback = CompletionHandler<void(ExceptionOr<void>&&)>;
    using EmptyCallback = CompletionHandler<void()>;
    using GetHandleNamesCallback = CompletionHandler<void(ExceptionOr<Vector<String>>&&)>;
    using StringCallback = CompletionHandler<void(ExceptionOr<String>&&)>;
    using RequestCapacityCallback = CompletionHandler<void(std::optional<uint64_t>&&)>;

    virtual bool isWorker() const { return false; }
    virtual void closeHandle(FileSystemHandleIdentifier) = 0;
    virtual void isSameEntry(FileSystemHandleIdentifier, FileSystemHandleIdentifier, SameEntryCallback&&) = 0;
    virtual void move(FileSystemHandleIdentifier, FileSystemHandleIdentifier, const String& newName, VoidCallback&&) = 0;
    virtual void getFileHandle(FileSystemHandleIdentifier, const String& name, bool createIfNecessary, GetHandleCallback&&) = 0;
    virtual void getDirectoryHandle(FileSystemHandleIdentifier, const String& name, bool createIfNecessary, GetHandleCallback&&) = 0;
    virtual void removeEntry(FileSystemHandleIdentifier, const String& name, bool deleteRecursively, VoidCallback&&) = 0;
    virtual void resolve(FileSystemHandleIdentifier, FileSystemHandleIdentifier, ResolveCallback&&) = 0;
    virtual void getFile(FileSystemHandleIdentifier, StringCallback&&) = 0;
    virtual void createSyncAccessHandle(FileSystemHandleIdentifier, GetAccessHandleCallback&&) = 0;
    virtual void closeSyncAccessHandle(FileSystemHandleIdentifier, FileSystemSyncAccessHandleIdentifier, EmptyCallback&&) = 0;
    virtual void requestNewCapacityForSyncAccessHandle(FileSystemHandleIdentifier, FileSystemSyncAccessHandleIdentifier, uint64_t newCapacity, RequestCapacityCallback&&) = 0;
    virtual void registerSyncAccessHandle(FileSystemSyncAccessHandleIdentifier, ScriptExecutionContextIdentifier) = 0;
    virtual void unregisterSyncAccessHandle(FileSystemSyncAccessHandleIdentifier) = 0;
    virtual void invalidateAccessHandle(WebCore::FileSystemSyncAccessHandleIdentifier) = 0;
    virtual void createWritable(FileSystemHandleIdentifier, bool keepExistingData, VoidCallback&&) = 0;
    virtual void closeWritable(FileSystemHandleIdentifier, FileSystemWriteCloseReason, VoidCallback&&) = 0;
    virtual void executeCommandForWritable(FileSystemHandleIdentifier, FileSystemWriteCommandType, std::optional<uint64_t> position, std::optional<uint64_t> size, std::span<const uint8_t> dataBytes, bool hasDataError, VoidCallback&&) = 0;
    virtual void getHandleNames(FileSystemHandleIdentifier, GetHandleNamesCallback&&) = 0;
    virtual void getHandle(FileSystemHandleIdentifier, const String& name, GetHandleCallback&&) = 0;
};

} // namespace WebCore
