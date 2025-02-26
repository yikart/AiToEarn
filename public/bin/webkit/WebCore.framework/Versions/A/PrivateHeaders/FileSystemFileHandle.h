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

#include "FileSystemHandle.h"
#include "FileSystemSyncAccessHandleIdentifier.h"

namespace WebCore {

class File;
class FileSystemSyncAccessHandle;
class FileSystemWritableFileStream;
enum class FileSystemWriteCloseReason : bool;
enum class FileSystemWriteCommandType : uint8_t;
template<typename> class ExceptionOr;

class FileSystemFileHandle final : public FileSystemHandle {
    WTF_MAKE_TZONE_OR_ISO_ALLOCATED(FileSystemFileHandle);
public:
    WEBCORE_EXPORT static Ref<FileSystemFileHandle> create(ScriptExecutionContext&, String&&, FileSystemHandleIdentifier, Ref<FileSystemStorageConnection>&&);
    void getFile(DOMPromiseDeferred<IDLInterface<File>>&&);

    void createSyncAccessHandle(DOMPromiseDeferred<IDLInterface<FileSystemSyncAccessHandle>>&&);
    void closeSyncAccessHandle(FileSystemSyncAccessHandleIdentifier);
    std::optional<uint64_t> requestNewCapacityForSyncAccessHandle(FileSystemSyncAccessHandleIdentifier, uint64_t newCapacity);
    void registerSyncAccessHandle(FileSystemSyncAccessHandleIdentifier, FileSystemSyncAccessHandle&);
    void unregisterSyncAccessHandle(FileSystemSyncAccessHandleIdentifier);

    struct CreateWritableOptions {
        bool keepExistingData { false };
    };
    void createWritable(const CreateWritableOptions&, DOMPromiseDeferred<IDLInterface<FileSystemWritableFileStream>>&&);

    void closeWritable(FileSystemWriteCloseReason);
    void executeCommandForWritable(FileSystemWriteCommandType, std::optional<uint64_t> position, std::optional<uint64_t> size, std::span<const uint8_t> dataBytes, bool hasDataError, DOMPromiseDeferred<void>&&);

private:
    FileSystemFileHandle(ScriptExecutionContext&, String&&, FileSystemHandleIdentifier, Ref<FileSystemStorageConnection>&&);
};

} // namespace WebCore

SPECIALIZE_TYPE_TRAITS_BEGIN(WebCore::FileSystemFileHandle)
    static bool isType(const WebCore::FileSystemHandle& handle) { return handle.kind() == WebCore::FileSystemHandle::Kind::File; }
SPECIALIZE_TYPE_TRAITS_END()
